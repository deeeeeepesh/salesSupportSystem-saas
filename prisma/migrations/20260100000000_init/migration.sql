-- Initial migration: create base Role enum and users table
-- This was the original migration run locally but never committed to the repo.
-- All subsequent migrations (add_session_fields, add_store_manager_and_analytics,
-- add_price_authority_tables, add_multitenancy) ALTER or extend these base objects.

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SALES', 'ADMIN');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'SALES',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
