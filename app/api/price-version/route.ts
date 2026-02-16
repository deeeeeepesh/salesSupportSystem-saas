import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getVersionInfo, isPriceAuthorityEnabled, FALLBACK_VALID_DURATION_MS } from '@/lib/price-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      return response;
    }

    if (!isPriceAuthorityEnabled()) {
      // Feature flag OFF - return default version info
      const response = NextResponse.json({
        price_list_version: 0,
        server_timestamp: Date.now(),
        max_valid_duration_ms: FALLBACK_VALID_DURATION_MS,
      });
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      return response;
    }

    const versionInfo = await getVersionInfo();

    const response = NextResponse.json({
      price_list_version: versionInfo.version,
      server_timestamp: Date.now(),
      max_valid_duration_ms: versionInfo.maxValidDurationMs,
    });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return response;
  } catch (error) {
    console.error('[PriceVersion API] Error:', error);
    const response = NextResponse.json(
      { error: 'Failed to fetch version info' },
      { status: 500 }
    );
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return response;
  }
}
