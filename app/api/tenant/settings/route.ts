import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { googleSheetId: true, name: true, email: true, phone: true },
  });

  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }

  return NextResponse.json(tenant);
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { googleSheetId } = body;

  // Validate format: Google Sheet IDs are alphanumeric with hyphens/underscores
  if (googleSheetId !== null && googleSheetId !== undefined && googleSheetId !== '') {
    if (typeof googleSheetId !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(googleSheetId)) {
      return NextResponse.json({ error: 'Invalid Google Sheet ID format' }, { status: 400 });
    }
  }

  const updated = await prisma.tenant.update({
    where: { id: session.user.tenantId },
    data: { googleSheetId: googleSheetId || null },
    select: { googleSheetId: true, name: true, email: true, phone: true },
  });

  return NextResponse.json(updated);
}
