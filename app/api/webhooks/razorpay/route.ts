import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyWebhookSignature } from '@/lib/razorpay';

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-razorpay-signature') || '';
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;

  if (!verifyWebhookSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const event = JSON.parse(rawBody);
  const eventType = event.event as string;

  try {
    switch (eventType) {
      case 'payment.captured': {
        // One-time payment captured — already handled by payment-verify API
        // This is a backup/confirmation
        const paymentEntity = event.payload?.payment?.entity;
        const tenantSlug = paymentEntity?.notes?.tenantSlug;
        if (tenantSlug) {
          const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
          if (tenant && tenant.status !== 'ACTIVE') {
            const now = new Date();
            const periodEnd = new Date(now);
            periodEnd.setMonth(periodEnd.getMonth() + 1);
            await prisma.$transaction([
              prisma.tenant.update({ where: { id: tenant.id }, data: { status: 'ACTIVE' } }),
              prisma.subscription.update({
                where: { tenantId: tenant.id },
                data: { status: 'ACTIVE', currentPeriodStart: now, currentPeriodEnd: periodEnd },
              }),
            ]);
          }
        }
        break;
      }

      case 'payment.failed': {
        const paymentEntity = event.payload?.payment?.entity;
        const tenantSlug = paymentEntity?.notes?.tenantSlug;
        if (tenantSlug) {
          const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
          if (tenant) {
            await prisma.tenant.update({ where: { id: tenant.id }, data: { status: 'SUSPENDED' } });
            await prisma.subscription.update({
              where: { tenantId: tenant.id },
              data: { status: 'PAST_DUE' },
            });
          }
        }
        break;
      }

      case 'subscription.activated': {
        const subEntity = event.payload?.subscription?.entity;
        const razorpaySubId = subEntity?.id;
        if (razorpaySubId) {
          const subscription = await prisma.subscription.findFirst({
            where: { razorpaySubscriptionId: razorpaySubId },
          });
          if (subscription) {
            await prisma.tenant.update({ where: { id: subscription.tenantId }, data: { status: 'ACTIVE' } });
            await prisma.subscription.update({
              where: { id: subscription.id },
              data: { status: 'ACTIVE' },
            });
          }
        }
        break;
      }

      case 'subscription.charged': {
        // Recurring charge succeeded — refresh the billing period
        const subEntity = event.payload?.subscription?.entity;
        const razorpaySubId = subEntity?.id;
        if (razorpaySubId) {
          const subscription = await prisma.subscription.findFirst({
            where: { razorpaySubscriptionId: razorpaySubId },
          });
          if (subscription) {
            await prisma.$transaction([
              prisma.tenant.update({ where: { id: subscription.tenantId }, data: { status: 'ACTIVE' } }),
              prisma.subscription.update({
                where: { id: subscription.id },
                data: {
                  status: 'ACTIVE',
                  currentPeriodStart: new Date(subEntity.current_start * 1000),
                  currentPeriodEnd: new Date(subEntity.current_end * 1000),
                },
              }),
            ]);
          }
        }
        break;
      }

      case 'subscription.halted':
      case 'subscription.cancelled': {
        const subEntity = event.payload?.subscription?.entity;
        const razorpaySubId = subEntity?.id;
        if (razorpaySubId) {
          const subscription = await prisma.subscription.findFirst({
            where: { razorpaySubscriptionId: razorpaySubId },
          });
          if (subscription) {
            const newStatus = eventType === 'subscription.cancelled' ? 'CANCELLED' : 'SUSPENDED';
            await prisma.tenant.update({ where: { id: subscription.tenantId }, data: { status: newStatus } });
            await prisma.subscription.update({
              where: { id: subscription.id },
              data: { status: newStatus },
            });
          }
        }
        break;
      }

      default:
        // Unhandled event — log and return 200 to prevent Razorpay retries
        console.log(`Unhandled Razorpay webhook event: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
