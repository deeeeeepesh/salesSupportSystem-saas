import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

// Map role to the subscription seat field
const ROLE_TO_SEAT: Record<string, 'adminSeats' | 'managerSeats' | 'salesSeats'> = {
  ADMIN: 'adminSeats',
  STORE_MANAGER: 'managerSeats',
  SALES: 'salesSeats',
};

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'admin',
  STORE_MANAGER: 'manager',
  SALES: 'staff',
};

async function checkSeatAvailable(tenantId: string, role: string): Promise<string | null> {
  const seatField = ROLE_TO_SEAT[role];
  if (!seatField) return null; // unknown role, let role validation catch it

  const [subscription, usedCount] = await Promise.all([
    prisma.subscription.findUnique({ where: { tenantId }, select: { [seatField]: true } }),
    prisma.user.count({ where: { tenantId, role, isActive: true } }),
  ]);

  if (!subscription) return 'No subscription found for this tenant';

  const allocated = (subscription as Record<string, number>)[seatField];
  if (usedCount >= allocated) {
    return `${ROLE_LABEL[role]} seat limit reached (${usedCount}/${allocated}). Upgrade your plan to add more.`;
  }
  return null;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const tenantId = session.user.tenantId;

    const users = await prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        totalVisits: true,
        totalPageViews: true,
        totalDuration: true,
        totalRefreshes: true,
        lastActiveAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const tenantId = session.user.tenantId;

    const body = await request.json();
    const { email, name, password, role } = body;

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: 'Email, name, and password are required' },
        { status: 400 }
      );
    }

    const targetRole = role || 'SALES';

    // Check seat limit before creating
    const seatError = await checkSeatAvailable(tenantId, targetRole);
    if (seatError) {
      return NextResponse.json({ error: seatError }, { status: 403 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email_tenantId: { email, tenantId } },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: targetRole,
        tenantId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const tenantId = session.user.tenantId;

    const body = await request.json();
    const { id, isActive, password, role } = body;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const targetUser = await prisma.user.findFirst({
      where: { id, tenantId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (role && id === session.user.id) {
      return NextResponse.json(
        { error: 'You cannot change your own role' },
        { status: 400 }
      );
    }

    if (role && !['SALES', 'STORE_MANAGER', 'ADMIN'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be SALES, STORE_MANAGER, or ADMIN' },
        { status: 400 }
      );
    }

    // Check seat limit when changing to a different role
    if (role && role !== targetUser.role) {
      const seatError = await checkSeatAvailable(tenantId, role);
      if (seatError) {
        return NextResponse.json({ error: seatError }, { status: 403 });
      }
    }

    // Check seat limit when reactivating a user (isActive: false → true)
    if (isActive === true && targetUser.isActive === false) {
      const roleToCheck = role || targetUser.role;
      const seatError = await checkSeatAvailable(tenantId, roleToCheck);
      if (seatError) {
        return NextResponse.json({ error: seatError }, { status: 403 });
      }
    }

    const updateData: Record<string, boolean | string> = {};
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    if (password) updateData.password = await bcrypt.hash(password, 10);
    if (role) updateData.role = role;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const tenantId = session.user.tenantId;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (id === session.user.id) {
      return NextResponse.json(
        { error: 'You cannot delete yourself' },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findFirst({
      where: { id, tenantId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
