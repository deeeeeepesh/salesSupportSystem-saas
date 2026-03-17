import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyWebhookSignature } from '@/lib/razorpay';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('x-razorpay-signature') || '';
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;

  if (!verifyWebhookSignature(body, signature, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  let event: any;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const subscriptionId = event?.payload?.subscription?.entity?.id;
  if (!subscriptionId) {
    return NextResponse.json({ ok: true });
  }

  const subscription = await prisma.subscription.findUnique({
    where: { razorpaySubscriptionId: subscriptionId },
    include: { tenant: true },
  });

  if (!subscription) {
    return NextResponse.json({ ok: true }); // Unknown subscription, ignore
  }

  const tenantId = subscription.tenantId;

  switch (event.event) {
    case 'subscription.activated':
      await prisma.$transaction([
        prisma.tenant.update({ where: { id: tenantId }, data: { status: 'ACTIVE' } }),
        prisma.subscription.update({ where: { tenantId }, data: { status: 'ACTIVE' } }),
      ]);
      break;

    case 'subscription.charged':
      await prisma.$transaction([
        prisma.tenant.update({ where: { id: tenantId }, data: { status: 'ACTIVE' } }),
        prisma.subscription.update({
          where: { tenantId },
          data: {
            status: 'ACTIVE',
            currentPeriodStart: new Date(event.payload.subscription.entity.current_start * 1000),
            currentPeriodEnd: new Date(event.payload.subscription.entity.current_end * 1000),
          },
        }),
      ]);
      break;

    case 'subscription.halted':
    case 'subscription.pending':
      await prisma.$transaction([
        prisma.tenant.update({ where: { id: tenantId }, data: { status: 'SUSPENDED' } }),
        prisma.subscription.update({ where: { tenantId }, data: { status: 'PAST_DUE' } }),
      ]);
      break;

    case 'subscription.cancelled':
      await prisma.$transaction([
        prisma.tenant.update({ where: { id: tenantId }, data: { status: 'CANCELLED' } }),
        prisma.subscription.update({ where: { tenantId }, data: { status: 'CANCELLED' } }),
      ]);
      break;
  }

  return NextResponse.json({ ok: true });
}
