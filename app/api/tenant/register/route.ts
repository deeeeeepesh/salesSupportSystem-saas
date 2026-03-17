import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import slugify from 'slugify';

const RegisterSchema = z.object({
  storeName: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  adminName: z.string().min(2),
  phone: z.string().optional(),
  googleSheetId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = RegisterSchema.parse(body);

    // Generate unique slug from store name
    let slug = slugify(data.storeName, { lower: true, strict: true });
    const existing = await prisma.tenant.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    // Check email not already used as tenant owner
    const emailExists = await prisma.tenant.findUnique({ where: { email: data.email } });
    if (emailExists) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Trial ends in 14 days
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    // Create tenant + admin user + subscription atomically
    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: data.storeName,
          slug,
          email: data.email,
          phone: data.phone,
          status: 'TRIAL',
          trialEndsAt,
          googleSheetId: data.googleSheetId,
        },
      });

      const adminUser = await tx.user.create({
        data: {
          email: data.email,
          name: data.adminName,
          password: hashedPassword,
          role: 'ADMIN',
          tenantId: tenant.id,
        },
      });

      const subscription = await tx.subscription.create({
        data: {
          tenantId: tenant.id,
          status: 'TRIAL',
          adminSeats: 1,
          salesSeats: 0,
          managerSeats: 0,
          monthlyAmount: 70000, // ₹700 for 1 admin in paise
        },
      });

      // Create default price list meta for tenant
      await tx.priceListMeta.create({
        data: {
          tenantId: tenant.id,
        },
      });

      return { tenant, adminUser, subscription };
    });

    return NextResponse.json({
      success: true,
      slug: result.tenant.slug,
      url: `https://${slug}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'salessupportapp.dedasystems.com'}`,
      trialEndsAt,
      message: `Your store is ready! Visit ${slug}.salessupportapp.dedasystems.com to get started.`,
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
