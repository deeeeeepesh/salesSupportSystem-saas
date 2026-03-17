-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'SUSPENDED');

-- CreateTable: tenants
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "status" "TenantStatus" NOT NULL DEFAULT 'TRIAL',
    "trialEndsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "razorpayCustomerId" TEXT,
    "razorpaySubscriptionId" TEXT,
    "googleSheetId" TEXT,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex for tenants
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");
CREATE UNIQUE INDEX "tenants_email_key" ON "tenants"("email");

-- CreateTable: subscriptions
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "razorpaySubscriptionId" TEXT,
    "planId" TEXT,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "salesSeats" INTEGER NOT NULL DEFAULT 0,
    "managerSeats" INTEGER NOT NULL DEFAULT 0,
    "adminSeats" INTEGER NOT NULL DEFAULT 0,
    "monthlyAmount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex for subscriptions
CREATE UNIQUE INDEX "subscriptions_tenantId_key" ON "subscriptions"("tenantId");
CREATE UNIQUE INDEX "subscriptions_razorpaySubscriptionId_key" ON "subscriptions"("razorpaySubscriptionId");

-- CreateTable: super_admins
CREATE TABLE "super_admins" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "super_admins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex for super_admins
CREATE UNIQUE INDEX "super_admins_email_key" ON "super_admins"("email");

-- Alter users table: add tenantId column
-- Step 1: Drop existing unique constraint on email
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_key";

-- Step 2: Add tenantId column (nullable first to allow data migration)
ALTER TABLE "users" ADD COLUMN "tenantId" TEXT;

-- Step 3: Create a default tenant for existing users (migration helper)
-- In production, run data migration scripts before this step
-- INSERT INTO "tenants" ("id", "name", "slug", "email", "updatedAt")
-- VALUES ('default-tenant', 'Default Store', 'default', 'admin@default.com', NOW())
-- ON CONFLICT DO NOTHING;

-- Step 4: Update existing users to point to a tenant if needed
-- UPDATE "users" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;

-- Step 5: Make tenantId NOT NULL after data migration
-- ALTER TABLE "users" ALTER COLUMN "tenantId" SET NOT NULL;

-- Step 6: Add composite unique constraint
CREATE UNIQUE INDEX "users_email_tenantId_key" ON "users"("email", "tenantId");

-- Step 7: Add index on tenantId
CREATE INDEX "users_tenantId_idx" ON "users"("tenantId");

-- Step 8: Add FK constraint
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Alter cached_products: add tenantId column
ALTER TABLE "cached_products" ADD COLUMN "tenantId" TEXT;

-- Add index on tenantId + version
CREATE INDEX "cached_products_tenantId_version_idx" ON "cached_products"("tenantId", "version");

-- Add index on tenantId + brand
CREATE INDEX "cached_products_tenantId_brand_idx" ON "cached_products"("tenantId", "brand");

-- Drop old single-column indexes if they exist
DROP INDEX IF EXISTS "cached_products_version_idx";
DROP INDEX IF EXISTS "cached_products_brand_idx";

-- Add FK constraint on cached_products
ALTER TABLE "cached_products" ADD CONSTRAINT "cached_products_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Alter price_list_meta: change to cuid-based id and add tenantId
-- Drop old singleton constraint (id = 'current')
ALTER TABLE "price_list_meta" DROP CONSTRAINT IF EXISTS "price_list_meta_pkey";

-- Add new columns
ALTER TABLE "price_list_meta" ADD COLUMN "new_id" TEXT;
ALTER TABLE "price_list_meta" ADD COLUMN "tenantId" TEXT;

-- Generate IDs for existing rows
UPDATE "price_list_meta" SET "new_id" = gen_random_uuid()::text WHERE "new_id" IS NULL;

-- Drop old id column and rename
ALTER TABLE "price_list_meta" DROP COLUMN "id";
ALTER TABLE "price_list_meta" RENAME COLUMN "new_id" TO "id";

-- Make id primary key
ALTER TABLE "price_list_meta" ADD CONSTRAINT "price_list_meta_pkey" PRIMARY KEY ("id");

-- Add unique constraint on tenantId
CREATE UNIQUE INDEX "price_list_meta_tenantId_key" ON "price_list_meta"("tenantId");

-- Add FK on price_list_meta
ALTER TABLE "price_list_meta" ADD CONSTRAINT "price_list_meta_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add FK on subscriptions
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
