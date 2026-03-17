import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create a demo tenant
  const tenantSlug = process.env.SEED_TENANT_SLUG || 'demo';
  const tenantEmail = process.env.ADMIN_EMAIL || 'admin@example.com';

  let tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
  if (!tenant) {
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    tenant = await prisma.tenant.create({
      data: {
        name: 'Demo Store',
        slug: tenantSlug,
        email: tenantEmail,
        status: 'TRIAL',
        trialEndsAt,
      },
    });

    // Create subscription for demo tenant
    await prisma.subscription.create({
      data: {
        tenantId: tenant.id,
        status: 'TRIAL',
        adminSeats: 1,
        salesSeats: 1,
        managerSeats: 0,
        monthlyAmount: 100000, // ₹1000 (1 admin + 1 sales)
      },
    });

    // Create default price list meta
    await prisma.priceListMeta.create({
      data: { tenantId: tenant.id },
    });

    console.log('Created demo tenant:', tenant.slug);
  }

  // Create initial admin user for demo tenant
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email_tenantId: { email: tenantEmail, tenantId: tenant.id } },
    update: {},
    create: {
      email: tenantEmail,
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
      tenantId: tenant.id,
    },
  });

  console.log('Created admin user:', admin.email);

  // Create a sample sales user
  const salesEmail = 'sales@example.com';
  const salesPassword = 'Sales@123';
  const salesHashedPassword = await bcrypt.hash(salesPassword, 10);

  const sales = await prisma.user.upsert({
    where: { email_tenantId: { email: salesEmail, tenantId: tenant.id } },
    update: {},
    create: {
      email: salesEmail,
      name: 'Sales User',
      password: salesHashedPassword,
      role: 'SALES',
      isActive: true,
      tenantId: tenant.id,
    },
  });

  console.log('Created sales user:', sales.email);

  // Create super admin if SUPER_ADMIN_EMAIL is set
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;
  if (superAdminEmail && superAdminPassword) {
    const saHashedPassword = await bcrypt.hash(superAdminPassword, 10);
    await prisma.superAdmin.upsert({
      where: { email: superAdminEmail },
      update: {},
      create: {
        email: superAdminEmail,
        name: 'Super Admin',
        password: saHashedPassword,
      },
    });
    console.log('Created super admin:', superAdminEmail);
  }

  console.log('\n=== Seed Complete ===');
  console.log(`Tenant slug: ${tenantSlug}`);
  console.log(`Admin: ${tenantEmail} / ${adminPassword}`);
  console.log(`Sales: ${salesEmail} / Sales@123`);
  console.log(`Login URL: http://localhost:3000?tenant=${tenantSlug}`);
  console.log('=====================\n');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
