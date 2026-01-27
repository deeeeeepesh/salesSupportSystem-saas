import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create initial admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('✓ Created admin user:', admin.email);

  // Create a sample sales user
  const salesEmail = 'sales@example.com';
  const salesPassword = 'Sales@123';
  const salesHashedPassword = await bcrypt.hash(salesPassword, 10);

  const sales = await prisma.user.upsert({
    where: { email: salesEmail },
    update: {},
    create: {
      email: salesEmail,
      name: 'Sales User',
      password: salesHashedPassword,
      role: 'SALES',
      isActive: true,
    },
  });

  console.log('✓ Created sales user:', sales.email);

  console.log('\n=== Seed Complete ===');
  console.log(`Admin: ${adminEmail} / ${adminPassword}`);
  console.log(`Sales: ${salesEmail} / ${salesPassword}`);
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
