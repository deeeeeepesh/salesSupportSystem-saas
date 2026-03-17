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
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      return response;
    }

    // Check if user is ADMIN
    if (session.user.role !== 'ADMIN') {
      const response = NextResponse.json(
        { error: 'Forbidden - ADMIN role required' },
        { status: 403 }
      );
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      return response;
    }

    const tenantId = session.user.tenantId;

    if (!isPriceAuthorityEnabled()) {
      // Feature flag OFF - just clear the Google Sheets cache
      clearProductsCache();
      const response = NextResponse.json({
        success: true,
        message: 'Google Sheets cache cleared (legacy mode)',
      });
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      return response;
    }

    // Clear in-memory cache first
    clearProductsCache();

    // Trigger sync from Google Sheets to PostgreSQL for this tenant
    const result = await syncFromGoogleSheets(tenantId);

    const response = NextResponse.json(result, {
      status: result.success ? 200 : 500,
    });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return response;
  } catch (error) {
    console.error('[PriceSync API] Error:', error);
    const response = NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return response;
  }
}
