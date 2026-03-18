import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Called daily by Railway cron or external scheduler
// Suspends tenants whose trial has expired and have no active subscription
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();

  const expired = await prisma.tenant.findMany({
    where: {
      status: 'TRIAL',
      trialEndsAt: { lt: now },
    },
    select: { id: true, slug: true, email: true },
  });

  if (expired.length === 0) {
    return NextResponse.json({ suspended: 0, message: 'No expired trials found' });
  }

  await prisma.tenant.updateMany({
    where: {
      id: { in: expired.map((t) => t.id) },
    },
    data: { status: 'SUSPENDED' },
  });

  await prisma.subscription.updateMany({
    where: {
      tenantId: { in: expired.map((t) => t.id) },
    },
    data: { status: 'SUSPENDED' },
  });

  console.log(`Suspended ${expired.length} expired trial tenants:`, expired.map((t) => t.slug));

  return NextResponse.json({
    suspended: expired.length,
    tenants: expired.map((t) => t.slug),
  });
}
