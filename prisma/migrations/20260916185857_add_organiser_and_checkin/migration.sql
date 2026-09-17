-- CreateEnum
CREATE TYPE "CheckInStatus" AS ENUM ('NOT_CHECKED_IN', 'CHECKED_IN');

-- CreateEnum
CREATE TYPE "OrganiserRole" AS ENUM ('ENTRY_SCANNER', 'ADMIN');

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "check_in_status" "CheckInStatus" NOT NULL DEFAULT 'NOT_CHECKED_IN',
ADD COLUMN     "checked_in_at" TIMESTAMP(3),
ADD COLUMN     "checked_in_by" TEXT,
ADD COLUMN     "checked_in_by_id" TEXT;

-- CreateTable
CREATE TABLE "organisers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "login_id" TEXT NOT NULL,
    "credential_hash" TEXT NOT NULL,
    "role" "OrganiserRole" NOT NULL DEFAULT 'ENTRY_SCANNER',
    "gate_id" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_login_at" TIMESTAMP(3),

    CONSTRAINT "organisers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organisers_login_id_key" ON "organisers"("login_id");
