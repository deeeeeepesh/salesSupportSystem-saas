-- AlterTable
ALTER TABLE "users" ADD COLUMN     "activeSessionId" TEXT,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3);
