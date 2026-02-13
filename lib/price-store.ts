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
 * Sync products from Google Sheets to PostgreSQL
 * This is the single source of truth for price updates
 */
export async function syncFromGoogleSheets(): Promise<{
  success: boolean;
  version?: number;
  productsCount?: number;
  message: string;
}> {
  console.log('[PriceStore] Starting sync from Google Sheets...');
  
  try {
    // Use transaction with row-level lock to prevent race conditions
    const lockAcquired = await prisma.$transaction(async (tx) => {
      const meta = await tx.priceListMeta.findUnique({
        where: { id: 'current' },
      });

      // Create meta record if it doesn't exist
      if (!meta) {
        await tx.priceListMeta.create({
          data: {
            id: 'current',
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
        return false;
      }

      await tx.priceListMeta.update({
        where: { id: 'current' },
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

    // Get current meta state
    const meta = await prisma.priceListMeta.findUnique({
      where: { id: 'current' },
    });

    if (!meta) {
      throw new Error('Failed to acquire metadata');
    }

    try {
      // Fetch from Google Sheets
      const products = await fetchProductsFromSheets();
      const newHash = computeProductHash(products);

      // Check if data has actually changed
      if (newHash === meta.lastSheetHash) {
        console.log('[PriceStore] No changes detected in product data');
        await prisma.priceListMeta.update({
          where: { id: 'current' },
          data: {
            syncInProgress: false,
            lastSyncedAt: new Date(),
          },
        });
        return {
          success: true,
          version: meta.version,
          productsCount: products.length,
          message: 'No changes detected',
        };
      }

      // Data has changed - perform atomic update
      const newVersion = meta.version + 1;
      
      await prisma.$transaction(async (tx) => {
        // Delete old products
        await tx.cachedProduct.deleteMany({
          where: { version: meta.version },
        });

        // Insert new products
        await tx.cachedProduct.createMany({
          data: products.map((p) => ({
            id: p.id,
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
          where: { id: 'current' },
          data: {
            version: newVersion,
            lastSyncedAt: new Date(),
            lastSheetHash: newHash,
            syncInProgress: false,
            maxValidDurationMs: MAX_VALID_DURATION_MS,
          },
        });
      });

      console.log(`[PriceStore] Sync complete: version ${newVersion}, ${products.length} products`);

      // Publish cache refresh event via Redis
      try {
        await publishMessage('cache:refresh', JSON.stringify({
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
        productsCount: products.length,
        message: 'Sync completed successfully',
      };
    } finally {
      // Release lock if still held (in case of error before transaction)
      await prisma.priceListMeta.updateMany({
        where: {
          id: 'current',
          syncInProgress: true,
        },
        data: { syncInProgress: false },
      });
    }
  } catch (error) {
    console.error('[PriceStore] Sync failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get products from PostgreSQL store (never touches Google Sheets)
 */
export async function getProductsFromStore(): Promise<{
  products: Product[];
  version: number;
  syncedAt: Date;
  maxValidDurationMs: number;
}> {
  const meta = await prisma.priceListMeta.findUnique({
    where: { id: 'current' },
  });

  if (!meta) {
    throw new Error('Price list not initialized - run sync first');
  }

  const cachedProducts = await prisma.cachedProduct.findMany({
    where: { version: meta.version },
    orderBy: { brand: 'asc' },
  });

  const products: Product[] = cachedProducts.map((cp) => ({
    id: cp.id,
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
 * Get version info only (lightweight ~100 bytes)
 */
export async function getVersionInfo(): Promise<{
  version: number;
  syncedAt: Date;
  maxValidDurationMs: number;
}> {
  const meta = await prisma.priceListMeta.findUnique({
    where: { id: 'current' },
  });

  if (!meta) {
    throw new Error('Price list not initialized');
  }

  return {
    version: meta.version,
    syncedAt: meta.lastSyncedAt,
    maxValidDurationMs: meta.maxValidDurationMs,
  };
}

/**
 * Start background sync interval
 */
export function startBackgroundSync(): void {
  if (syncIntervalHandle) {
    console.log('[PriceStore] Background sync already running');
    return;
  }

  console.log(`[PriceStore] Starting background sync (interval: ${SYNC_INTERVAL_MS}ms)`);

  // Perform initial sync
  syncFromGoogleSheets().catch((err) => {
    console.error('[PriceStore] Initial sync failed:', err);
  });

  // Set up interval
  syncIntervalHandle = setInterval(() => {
    syncFromGoogleSheets().catch((err) => {
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
