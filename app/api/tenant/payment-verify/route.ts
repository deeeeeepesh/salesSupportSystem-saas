import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();

  // Verify signature
  const secret = process.env.RAZORPAY_KEY_SECRET!;
  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSig = crypto.createHmac('sha256', secret).update(body).digest('hex');

  if (expectedSig !== razorpay_signature) {
    return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
  }

  // Activate tenant
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  await prisma.$transaction([
    prisma.tenant.update({
      where: { id: session.user.tenantId },
      data: { status: 'ACTIVE' },
    }),
    prisma.subscription.update({
      where: { tenantId: session.user.tenantId },
      data: {
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    }),
  ]);

  return NextResponse.json({ success: true, message: 'Subscription activated' });
}
