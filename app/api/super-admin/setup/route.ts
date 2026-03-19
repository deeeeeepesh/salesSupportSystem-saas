import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

/**
 * One-time endpoint to create the first super admin account.
 * Completely disabled once any super admin exists.
 * Requires Authorization: Bearer <SUPER_ADMIN_SECRET>
 *
 * POST /api/super-admin/setup
 * Body: { email, password, name }
 */
export async function POST(request: NextRequest) {
  const secret = process.env.SUPER_ADMIN_SECRET;
  if (!secret || secret === 'change-me-super-secret') {
    return NextResponse.json(
      { error: 'SUPER_ADMIN_SECRET env var is not configured' },
      { status: 500 }
    );
  }

  // Verify the secret is passed as Bearer token
  const auth = request.headers.get('authorization') || '';
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Lock out permanently once any account exists
  const existing = await prisma.superAdmin.count();
  if (existing > 0) {
    return NextResponse.json(
      { error: 'Setup already completed. Use the login page.' },
      { status: 403 }
    );
  }

  const { email, password, name } = await request.json();
  if (!email || !password || !name) {
    return NextResponse.json(
      { error: 'email, password, and name are required' },
      { status: 400 }
    );
  }

  if (password.length < 10) {
    return NextResponse.json(
      { error: 'Password must be at least 10 characters' },
      { status: 400 }
    );
  }

  const hashed = await bcrypt.hash(password, 12);
  const admin = await prisma.superAdmin.create({
    data: { email, password: hashed, name },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  return NextResponse.json({
    success: true,
    message: 'Super admin account created. You can now log in at /super-admin.',
    admin,
  });
}
