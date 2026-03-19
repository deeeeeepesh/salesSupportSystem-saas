import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { jwtVerify } from 'jose';

const SA_SECRET = new TextEncoder().encode(process.env.SUPER_ADMIN_SECRET || 'change-me-super-secret');

async function verifySuperAdmin(request: NextRequest) {
  const token = request.cookies.get('sa_token')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SA_SECRET);
    return payload;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const admin = await verifySuperAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenants = await prisma.tenant.findMany({
    include: {
      subscription: true,
      priceMeta: { select: { lastSyncedAt: true } },
      _count: { select: { users: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Count active users per tenant in one query
  const activeUserCounts = await prisma.user.groupBy({
    by: ['tenantId'],
    where: { isActive: true },
    _count: { id: true },
  });
  const activeCountMap = Object.fromEntries(
    activeUserCounts.map((r) => [r.tenantId, r._count.id])
  );

  const enriched = tenants.map((t) => ({
    ...t,
    activeUserCount: activeCountMap[t.id] ?? 0,
  }));

  return NextResponse.json({ tenants: enriched });
}

export async function PATCH(request: NextRequest) {
  const admin = await verifySuperAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { tenantId, status } = await request.json();
  const validStatuses = ['TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED'];
  if (!tenantId || !validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const tenant = await prisma.tenant.update({
    where: { id: tenantId },
    data: { status },
  });

  return NextResponse.json({ tenant });
}
