import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = session.user.tenantId;

    // Increment total refreshes and update last active time, scoped to tenant
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        totalRefreshes: { increment: 1 },
        lastActiveAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking refresh:', error);
    return NextResponse.json({ error: 'Failed to track refresh' }, { status: 500 });
  }
}
