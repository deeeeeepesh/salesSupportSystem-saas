import { createHash } from 'crypto';
import { Product } from '@/types';
import { fetchProductsFromSheets } from './google-sheets';
import { prisma } from './db';
import { publishMessage } from './redis';

// Feature flag - defaults to true (enabled)
export function isPriceAuthorityEnabled(): boolean {
  return process.env.PRICE_AUTHORITY_ENABLED !== 'false';
}

// Configuration
const SYNC_INTERVAL_MS = parseInt(process.env.PRICE_SYNC_INTERVAL_MS || '120000', 10);
const MAX_VALID_DURATION_MS = parseInt(process.env.PRICE_MAX_VALID_MS || '300000', 10);

// Fallback duration when price authority is disabled or fails (2 minutes)
export const FALLBACK_VALID_DURATION_MS = 120000;

let syncIntervalHandle: NodeJS.Timeout | null = null;

/**
 * Compute SHA-256 hash of product data to detect changes
 */
function computeProductHash(products: Product[]): string {
  // Sort products by ID for consistent hashing
  const sorted = [...products].sort((a, b) => a.id.localeCompare(b.id));
  const dataStr = JSON.stringify(sorted);
  return createHash('sha256').update(dataStr).digest('hex');
}

/**
 * Sync products from Google Sheets to PostgreSQL for a specific tenant
 * This is the single source of truth for price updates
 */
export async function syncFromGoogleSheets(tenantId: string): Promise<{
  success: boolean;
  version?: number;
  productsCount?: number;
  message: string;
}> {
  console.log(`[PriceStore] Starting sync from Google Sheets for tenant ${tenantId}...`);

  try {
    // Use transaction with row-level lock to prevent race conditions
    const lockAcquired = await prisma.$transaction(async (tx) => {
      const meta = await tx.priceListMeta.findFirst({
        where: { tenantId },
      });

      // Create meta record if it doesn't exist
      if (!meta) {
        await tx.priceListMeta.create({
          data: {
            tenantId,
            version: 0,
            lastSyncedAt: new Date(),
            lastSheetHash: '',
            syncInProgress: true,
            maxValidDurationMs: MAX_VALID_DURATION_MS,
          },
        });
        return true;
      }

      // Check and acquire lock atomically
      if (meta.syncInProgress) {
        // Check if lock is stale (held for more than 5 minutes)
        const lockAge = Date.now() - meta.lastSyncedAt.getTime();
        const STALE_LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

        if (lockAge > STALE_LOCK_TIMEOUT_MS) {
          console.warn(`[PriceStore] Stale lock detected (held for ${Math.round(lockAge / 1000)}s) - force releasing`);
          // Force acquire by overriding the stale lock
          await tx.priceListMeta.update({
            where: { id: meta.id },
            data: { syncInProgress: true, lastSyncedAt: new Date() },
          });
          return true;
        }

        return false;
      }

      await tx.priceListMeta.update({
        where: { id: meta.id },
        data: { syncInProgress: true },
      });
      return true;
    });

    if (!lockAcquired) {
      console.log('[PriceStore] Sync already in progress, skipping');
      return {
        success: false,
        message: 'Sync already in progress',
      };
    }

    try {
      // Get current meta state
      const meta = await prisma.priceListMeta.findFirst({
        where: { tenantId },
      });

      if (!meta) {
        throw new Error('Failed to acquire metadata');
      }

      // Get tenant's Google Sheet ID
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { googleSheetId: true },
      });

      // Fetch from Google Sheets (use tenant's sheet if available)
      const products = await fetchProductsFromSheets(tenant?.googleSheetId || undefined);

      // Detect and log duplicate product IDs
      const idOccurrences = new Map<string, Array<{ brand: string; model: string; variant: string }>>();
      for (const p of products) {
        const existing = idOccurrences.get(p.id) ?? [];
        existing.push({ brand: p.brand, model: p.model, variant: p.variant });
        idOccurrences.set(p.id, existing);
      }

      const duplicates = Array.from(idOccurrences.entries()).filter(([, occurrences]) => occurrences.length > 1);

      if (duplicates.length > 0) {
        console.warn(`[PriceStore] WARNING: Found ${duplicates.length} duplicate product ID(s) in Google Sheets data:`);
        for (const [id, occurrences] of duplicates) {
          console.warn(`[PriceStore]   Duplicate ID "${id}" (${occurrences.length} occurrences):`);
          for (const occ of occurrences) {
            console.warn(`[PriceStore]     - Brand: "${occ.brand}", Model: "${occ.model}", Variant: "${occ.variant}"`);
          }
        }
      }

      // Deduplicate: last occurrence wins (last row in sheet takes priority)
      const uniqueProductsMap = new Map<string, Product>();
      for (const p of products) {
        uniqueProductsMap.set(p.id, p);
      }
      const uniqueProducts = Array.from(uniqueProductsMap.values());

      if (uniqueProducts.length < products.length) {
        console.warn(`[PriceStore] Deduplicated: ${products.length} products -> ${uniqueProducts.length} unique products (${products.length - uniqueProducts.length} duplicates removed)`);
      }

      const newHash = computeProductHash(uniqueProducts);

      // Check if data has actually changed
      if (newHash === meta.lastSheetHash) {
        console.log('[PriceStore] No changes detected in product data');
        await prisma.priceListMeta.update({
          where: { id: meta.id },
          data: {
            syncInProgress: false,
            lastSyncedAt: new Date(),
          },
        });
        return {
          success: true,
          version: meta.version,
          productsCount: uniqueProducts.length,
          message: 'No changes detected',
        };
      }

      // Data has changed - perform atomic update
      const newVersion = meta.version + 1;

      await prisma.$transaction(async (tx) => {
        // Delete old products for this tenant at old version
        await tx.cachedProduct.deleteMany({
          where: { tenantId, version: meta.version },
        });

        // Insert new products scoped to tenant
        await tx.cachedProduct.createMany({
          data: uniqueProducts.map((p) => ({
            id: `${tenantId}:${p.id}`,
            tenantId,
            brand: p.brand,
            model: p.model,
            image: p.image,
            variant: p.variant,
            mrp: p.mrp,
            mop: p.mop,
            finalPrice: p.finalPrice,
            selloutMop: p.selloutMop,
            selloutFinal: p.selloutFinal,
            selloutFromDate: p.selloutFromDate || null,
            selloutToDate: p.selloutToDate || null,
            lastUpdated: p.lastUpdated || null,
            quickPitch: p.quickPitch || null,
            bankOffers: p.bankOffers || null,
            upgradeExchangeOffers: p.upgradeExchangeOffers || null,
            storeOffersGifts: p.storeOffersGifts || null,
            weeklyFocus: p.weeklyFocus,
            allModels: p.allModels,
            newLaunch: p.newLaunch,
            ram: p.ram,
            rom: p.rom,
            version: newVersion,
          })),
        });

        // Update metadata
        await tx.priceListMeta.update({
          where: { id: meta.id },
          data: {
            version: newVersion,
            lastSyncedAt: new Date(),
            lastSheetHash: newHash,
            syncInProgress: false,
            maxValidDurationMs: MAX_VALID_DURATION_MS,
          },
        });
      });

      console.log(`[PriceStore] Sync complete for tenant ${tenantId}: version ${newVersion}, ${uniqueProducts.length} products`);

      // Publish tenant-scoped cache refresh event via Redis
      try {
        await publishMessage(`cache:refresh:${tenantId}`, JSON.stringify({
          type: 'price_update',
          version: newVersion,
          timestamp: Date.now(),
        }));
      } catch (redisError) {
        console.error('[PriceStore] Failed to publish Redis event:', redisError);
        // Continue - sync succeeded even if notification failed
      }

      return {
        success: true,
        version: newVersion,
        productsCount: uniqueProducts.length,
        message: 'Sync completed successfully',
      };
    } finally {
      // Release lock if still held (in case of error before transaction)
      try {
        const meta = await prisma.priceListMeta.findFirst({ where: { tenantId } });
        if (meta) {
          await prisma.priceListMeta.updateMany({
            where: {
              id: meta.id,
              syncInProgress: true,
            },
            data: { syncInProgress: false },
          });
        }
      } catch (releaseError) {
        console.error('[PriceStore] CRITICAL: Failed to release sync lock:', releaseError);
      }
    }
  } catch (error) {
    console.error('[PriceStore] Sync failed:', error);

    // Release lock on failure
    try {
      const meta = await prisma.priceListMeta.findFirst({ where: { tenantId } });
      if (meta) {
        await prisma.priceListMeta.updateMany({
          where: { id: meta.id, syncInProgress: true },
          data: { syncInProgress: false },
        });
      }
    } catch (releaseError) {
      console.error('[PriceStore] CRITICAL: Failed to release sync lock after error:', releaseError);
    }

    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get products from PostgreSQL store for a specific tenant (never touches Google Sheets)
 */
export async function getProductsFromStore(tenantId: string): Promise<{
  products: Product[];
  version: number;
  syncedAt: Date;
  maxValidDurationMs: number;
}> {
  const meta = await prisma.priceListMeta.findFirst({
    where: { tenantId },
  });

  if (!meta) {
    throw new Error('Price list not initialized for this store - run sync first');
  }

  const cachedProducts = await prisma.cachedProduct.findMany({
    where: { tenantId, version: meta.version },
    orderBy: { brand: 'asc' },
  });

  const products: Product[] = cachedProducts.map((cp) => ({
    id: cp.id.replace(`${tenantId}:`, ''), // strip tenant prefix for client
    brand: cp.brand,
    model: cp.model,
    image: cp.image,
    variant: cp.variant,
    mrp: cp.mrp,
    mop: cp.mop,
    finalPrice: cp.finalPrice,
    selloutMop: cp.selloutMop,
    selloutFinal: cp.selloutFinal,
    selloutFromDate: cp.selloutFromDate || '',
    selloutToDate: cp.selloutToDate || '',
    lastUpdated: cp.lastUpdated || '',
    quickPitch: cp.quickPitch || '',
    bankOffers: cp.bankOffers || '',
    upgradeExchangeOffers: cp.upgradeExchangeOffers || '',
    storeOffersGifts: cp.storeOffersGifts || '',
    weeklyFocus: cp.weeklyFocus,
    allModels: cp.allModels,
    newLaunch: cp.newLaunch,
    ram: cp.ram,
    rom: cp.rom,
  }));

  return {
    products,
    version: meta.version,
    syncedAt: meta.lastSyncedAt,
    maxValidDurationMs: meta.maxValidDurationMs,
  };
}

/**
 * Get version info only for a specific tenant (lightweight ~100 bytes)
 */
export async function getVersionInfo(tenantId: string): Promise<{
  version: number;
  syncedAt: Date;
  maxValidDurationMs: number;
}> {
  const meta = await prisma.priceListMeta.findFirst({
    where: { tenantId },
  });

  if (!meta) {
    throw new Error('Price list not initialized for this store');
  }

  return {
    version: meta.version,
    syncedAt: meta.lastSyncedAt,
    maxValidDurationMs: meta.maxValidDurationMs,
  };
}

/**
 * Start background sync interval for a specific tenant
 */
export function startBackgroundSync(tenantId: string): void {
  if (syncIntervalHandle) {
    console.log('[PriceStore] Background sync already running');
    return;
  }

  console.log(`[PriceStore] Starting background sync for tenant ${tenantId} (interval: ${SYNC_INTERVAL_MS}ms)`);

  // Perform initial sync
  syncFromGoogleSheets(tenantId).catch((err) => {
    console.error('[PriceStore] Initial sync failed:', err);
  });

  // Set up interval
  syncIntervalHandle = setInterval(() => {
    syncFromGoogleSheets(tenantId).catch((err) => {
      console.error('[PriceStore] Scheduled sync failed:', err);
    });
  }, SYNC_INTERVAL_MS);
}

/**
 * Stop background sync (for graceful shutdown)
 */
export function stopBackgroundSync(): void {
  if (syncIntervalHandle) {
    clearInterval(syncIntervalHandle);
    syncIntervalHandle = null;
    console.log('[PriceStore] Background sync stopped');
  }
}
