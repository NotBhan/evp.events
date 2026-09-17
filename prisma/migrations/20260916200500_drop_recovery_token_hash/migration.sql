-- Drop the unused booking recovery-token column.
-- The key-recovery flow was removed; email + mobile lookup is now the only
-- retrieval path, and email is required at booking time. All values were NULL.
ALTER TABLE "bookings" DROP COLUMN IF EXISTS "recovery_token_hash";
