import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

const PRICE_STORE_BASE = 200000;      // ₹2,000 in paise
const PRICE_EXTRA_STAFF = 20000;      // ₹200
const PRICE_EXTRA_MANAGER = 50000;    // ₹500
const PRICE_EXTRA_ADMIN = 70000;      // ₹700

function calcMonthlyAmount(adminSeats: number, managerSeats: number, salesSeats: number, branchCount: number): number {
  // First branch is the base store (₹2,000 includes 1A+1M+4S)
  // Each additional branch adds ₹2,000 + its own 1M+4S (no extra admin needed)
  const baseCost = PRICE_STORE_BASE; // first store always
  const extraBranchCost = Math.max(0, branchCount - 1) * PRICE_STORE_BASE;

  // Included seats: 1 admin, branchCount managers, branchCount*4 staff
  const includedAdmins = 1;
  const includedManagers = branchCount;
  const includedStaff = branchCount * 4;

  const extraAdmins = Math.max(0, adminSeats - includedAdmins);
  const extraManagers = Math.max(0, managerSeats - includedManagers);
  const extraStaff = Math.max(0, salesSeats - includedStaff);

  return baseCost + extraBranchCost
    + extraAdmins * PRICE_EXTRA_ADMIN
    + extraManagers * PRICE_EXTRA_MANAGER
    + extraStaff * PRICE_EXTRA_STAFF;
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const subscription = await prisma.subscription.findUnique({
    where: { tenantId: session.user.tenantId },
    include: { tenant: { select: { status: true, trialEndsAt: true, name: true } } },
  });

  if (!subscription) {
    return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
  }

  // Count actual users per role
  const userCounts = await prisma.user.groupBy({
    by: ['role'],
    where: { tenantId: session.user.tenantId, isActive: true },
    _count: { role: true },
  });

  const usedSeats = {
    ADMIN: userCounts.find(u => u.role === 'ADMIN')?._count.role ?? 0,
    STORE_MANAGER: userCounts.find(u => u.role === 'STORE_MANAGER')?._count.role ?? 0,
    SALES: userCounts.find(u => u.role === 'SALES')?._count.role ?? 0,
  };

  return NextResponse.json({
    subscription,
    usedSeats,
    pricing: {
      storeBase: PRICE_STORE_BASE,
      extraStaff: PRICE_EXTRA_STAFF,
      extraManager: PRICE_EXTRA_MANAGER,
      extraAdmin: PRICE_EXTRA_ADMIN,
    },
  });
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { adminSeats, managerSeats, salesSeats, branchCount } = body;

  if (
    typeof adminSeats !== 'number' || adminSeats < 1 ||
    typeof managerSeats !== 'number' || managerSeats < 1 ||
    typeof salesSeats !== 'number' || salesSeats < 4 ||
    typeof branchCount !== 'number' || branchCount < 1
  ) {
    return NextResponse.json({
      error: 'Invalid seat counts. Minimum: 1 admin, 1 manager, 4 staff, 1 branch.'
    }, { status: 400 });
  }

  // Check used seats don't exceed new allocation
  const userCounts = await prisma.user.groupBy({
    by: ['role'],
    where: { tenantId: session.user.tenantId, isActive: true },
    _count: { role: true },
  });
  const usedAdmin = userCounts.find(u => u.role === 'ADMIN')?._count.role ?? 0;
  const usedManager = userCounts.find(u => u.role === 'STORE_MANAGER')?._count.role ?? 0;
  const usedSales = userCounts.find(u => u.role === 'SALES')?._count.role ?? 0;

  if (adminSeats < usedAdmin) return NextResponse.json({ error: `Cannot reduce admin seats below current usage (${usedAdmin} active admins)` }, { status: 400 });
  if (managerSeats < usedManager) return NextResponse.json({ error: `Cannot reduce manager seats below current usage (${usedManager} active managers)` }, { status: 400 });
  if (salesSeats < usedSales) return NextResponse.json({ error: `Cannot reduce staff seats below current usage (${usedSales} active staff)` }, { status: 400 });

  const monthlyAmount = calcMonthlyAmount(adminSeats, managerSeats, salesSeats, branchCount);

  const updated = await prisma.subscription.update({
    where: { tenantId: session.user.tenantId },
    data: { adminSeats, managerSeats, salesSeats, monthlyAmount },
    include: { tenant: { select: { status: true, trialEndsAt: true, name: true } } },
  });

  return NextResponse.json({ subscription: updated, newMonthlyAmount: monthlyAmount });
}
