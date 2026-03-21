import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { syncFromGoogleSheets } from '@/lib/price-store';

export const dynamic = 'force-dynamic';

// Called every 2 minutes by Railway Cron Job to sync all tenant Google Sheets
// POST /api/cron/sync-sheets
// Header: x-cron-secret: <CRON_SECRET>
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Find all active/trial tenants with a Google Sheet configured
  const tenants = await prisma.tenant.findMany({
    where: {
      status: { in: ['ACTIVE', 'TRIAL'] },
      googleSheetId: { not: null },
    },
    select: {
      id: true,
      slug: true,
      googleSheetId: true,
      priceMeta: {
        select: {
          syncInProgress: true,
          lastSyncedAt: true,
        },
        orderBy: { lastSyncedAt: 'desc' },
        take: 1,
      },
    },
  });

  const results: Array<{
    slug: string;
    success: boolean;
    productsCount?: number;
    message: string;
  }> = [];

  let succeeded = 0;
  let failed = 0;
  let skipped = 0;

  for (const tenant of tenants) {
    const meta = tenant.priceMeta[0];

    // Skip tenants with a sync already in progress within the last 4 minutes
    // to avoid overlapping cron runs hammering the Google Sheets API
    if (meta?.syncInProgress && meta.lastSyncedAt) {
      const ageMs = Date.now() - meta.lastSyncedAt.getTime();
      const FOUR_MINUTES_MS = 4 * 60 * 1000;
      if (ageMs < FOUR_MINUTES_MS) {
        console.log(`[CronSyncSheets] Skipping tenant ${tenant.slug} — sync already in progress (age: ${Math.round(ageMs / 1000)}s)`);
        results.push({
          slug: tenant.slug,
          success: false,
          message: `Skipped — sync already in progress (started ${Math.round(ageMs / 1000)}s ago)`,
        });
        skipped++;
        continue;
      }
    }

    console.log(`[CronSyncSheets] Syncing tenant: ${tenant.slug}`);

    try {
      const result = await syncFromGoogleSheets(tenant.id);

      if (result.success) {
        succeeded++;
        results.push({
          slug: tenant.slug,
          success: true,
          productsCount: result.productsCount,
          message: result.message,
        });
        console.log(`[CronSyncSheets] ✓ ${tenant.slug}: ${result.message} (${result.productsCount ?? 0} products)`);
      } else {
        failed++;
        results.push({
          slug: tenant.slug,
          success: false,
          message: result.message,
        });
        console.error(`[CronSyncSheets] ✗ ${tenant.slug}: ${result.message}`);
      }
    } catch (err) {
      failed++;
      const message = err instanceof Error ? err.message : 'Unknown error';
      results.push({
        slug: tenant.slug,
        success: false,
        message,
      });
      console.error(`[CronSyncSheets] ✗ ${tenant.slug}: ${message}`);
    }
  }

  console.log(`[CronSyncSheets] Done — ${tenants.length} tenants synced, ${succeeded} succeeded, ${failed} failed, ${skipped} skipped`);

  return NextResponse.json({
    synced: tenants.length,
    succeeded,
    failed,
    skipped,
    results,
  });
}
