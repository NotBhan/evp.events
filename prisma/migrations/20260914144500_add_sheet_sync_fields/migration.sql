-- CreateEnum
CREATE TYPE "SheetSyncStatus" AS ENUM ('PENDING', 'SYNCED', 'FAILED');

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN "sheet_sync_status" "SheetSyncStatus",
ADD COLUMN "sheet_synced_at" TIMESTAMP(3),
ADD COLUMN "sheet_sync_attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "sheet_last_error" TEXT;

-- CreateIndex
CREATE INDEX "bookings_sheet_sync_status_idx" ON "bookings"("sheet_sync_status");
