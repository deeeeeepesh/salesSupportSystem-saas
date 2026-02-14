import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { syncFromGoogleSheets, isPriceAuthorityEnabled } from '@/lib/price-store';
import { clearProductsCache } from '@/lib/google-sheets';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is ADMIN
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - ADMIN role required' },
        { status: 403 }
      );
    }

    if (!isPriceAuthorityEnabled()) {
      // Feature flag OFF - just clear the Google Sheets cache
      clearProductsCache();
      return NextResponse.json({
        success: true,
        message: 'Google Sheets cache cleared (legacy mode)',
      });
    }

    // Clear in-memory cache first
    clearProductsCache();

    // Trigger sync from Google Sheets to PostgreSQL
    const result = await syncFromGoogleSheets();

    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    });
  } catch (error) {
    console.error('[PriceSync API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
