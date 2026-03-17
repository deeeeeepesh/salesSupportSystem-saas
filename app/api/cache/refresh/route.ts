import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { clearProductsCache, getCacheStatus } from '@/lib/google-sheets';
import { publishMessage } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    // Only admins can refresh cache
    if (!session || session.user.role !== 'ADMIN') {
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      return response;
    }

    const tenantId = session.user.tenantId;

    const beforeStatus = getCacheStatus();
    clearProductsCache();

    // Broadcast cache refresh event to all connected clients scoped to tenant
    // Log error if broadcast fails but don't block the response
    try {
      await publishMessage(`cache:refresh:${tenantId}`, new Date().toISOString());
    } catch (broadcastError) {
      console.error('Failed to broadcast cache refresh event:', broadcastError);
      console.warn('Cache cleared locally but clients may not have been notified');
    }

    const response = NextResponse.json({
      message: 'Cache cleared successfully',
      before: beforeStatus,
      after: getCacheStatus(),
    });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return response;
  } catch (error) {
    console.error('Error clearing cache:', error);
    const response = NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    );
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return response;
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      return response;
    }

    const status = getCacheStatus();
    const response = NextResponse.json(status);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return response;
  } catch (error) {
    console.error('Error getting cache status:', error);
    const response = NextResponse.json(
      { error: 'Failed to get cache status' },
      { status: 500 }
    );
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return response;
  }
}
