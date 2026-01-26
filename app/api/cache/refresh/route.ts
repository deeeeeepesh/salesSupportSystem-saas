import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { clearProductsCache, getCacheStatus } from '@/lib/google-sheets';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Only admins can refresh cache
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const beforeStatus = getCacheStatus();
    clearProductsCache();
    
    return NextResponse.json({
      message: 'Cache cleared successfully',
      before: beforeStatus,
      after: getCacheStatus(),
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const status = getCacheStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error('Error getting cache status:', error);
    return NextResponse.json(
      { error: 'Failed to get cache status' },
      { status: 500 }
    );
  }
}
