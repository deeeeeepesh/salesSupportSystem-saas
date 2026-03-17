import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = session.user.tenantId;

    const body = await request.json();
    const { duration } = body; // duration in seconds

    if (typeof duration !== 'number' || duration < 0) {
      return NextResponse.json({ error: 'Invalid duration' }, { status: 400 });
    }

    // Add to cumulative duration and update last active time, scoped to tenant
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        totalDuration: { increment: duration },
        lastActiveAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking duration:', error);
    return NextResponse.json({ error: 'Failed to track duration' }, { status: 500 });
  }
}
