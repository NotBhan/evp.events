/*
  Warnings:

  - The `status` column on the `payment_attempts` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "PaymentAttemptStatus" AS ENUM ('INITIATED', 'PENDING', 'FAILED', 'SUCCEEDED');

-- DropIndex
DROP INDEX "bookings_phone_idx";

-- AlterTable
ALTER TABLE "payment_attempts" DROP COLUMN "status",
ADD COLUMN     "status" "PaymentAttemptStatus" NOT NULL DEFAULT 'INITIATED';

-- CreateIndex
CREATE INDEX "bookings_phone_email_idx" ON "bookings"("phone", "email");

-- CreateIndex
CREATE INDEX "bookings_email_idx" ON "bookings"("email");

-- Inventory non-negative and capacity CHECK constraints
ALTER TABLE "passes" ADD CONSTRAINT "passes_reserved_quantity_non_negative" CHECK ("reserved_quantity" >= 0);
ALTER TABLE "passes" ADD CONSTRAINT "passes_sold_quantity_non_negative" CHECK ("sold_quantity" >= 0);
ALTER TABLE "passes" ADD CONSTRAINT "passes_inventory_capacity_check" CHECK ("reserved_quantity" + "sold_quantity" <= "total_quantity");

