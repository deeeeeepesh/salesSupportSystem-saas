import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { calcMonthlyAmount, createRazorpayOrder, createRazorpayCustomer } from '@/lib/razorpay';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    include: { subscription: true },
  });

  if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  if (tenant.status === 'ACTIVE') return NextResponse.json({ error: 'Already subscribed' }, { status: 400 });

  const sub = tenant.subscription;
  const adminSeats = sub?.adminSeats ?? 1;
  const managerSeats = sub?.managerSeats ?? 1;
  const salesSeats = sub?.salesSeats ?? 4;
  const branchCount = 1; // default, can be extended

  const amountPaise = calcMonthlyAmount(adminSeats, managerSeats, salesSeats, branchCount);

  // Create or reuse Razorpay customer
  let razorpayCustomerId = tenant.razorpayCustomerId;
  if (!razorpayCustomerId) {
    const customer = await createRazorpayCustomer(tenant.name, tenant.email, tenant.phone ?? undefined);
    razorpayCustomerId = customer.id;
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { razorpayCustomerId },
    });
  }

  const order = await createRazorpayOrder(amountPaise, tenant.slug);

  return NextResponse.json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    tenantName: tenant.name,
    tenantEmail: tenant.email,
    razorpayCustomerId,
  });
}
