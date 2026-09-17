/**
 * Public booking-ID generation and the unique-assignment retry loop.
 *
 * Extracted from the booking creation route so the exact retry/exhaustion semantics
 * are exercised directly (including by the isolated namespace stress test). Pure
 * logic — no database imports.
 *
 * Rules (LOCKED):
 * - Range: RU26-REQ-1000..9999 (9,000 possible ids; 0000..0999 are never issued).
 * - A collision must retry with a NEW candidate — never overwrite/reassign/mutate
 *   an existing booking.
 * - Retry exhaustion returns an explicit failure; ids are never reused.
 */

export const BOOKING_ID_MIN = 1000;
export const BOOKING_ID_MAX = 9999;
export const MAX_COLLISION_RETRIES = 5;

export class BookingIdExhaustedError extends Error {
  constructor(
    message = 'Unable to assign a unique booking reference after repeated collisions.'
  ) {
    super(message);
    this.name = 'BookingIdExhaustedError';
  }
}

export function generatePublicBookingId(): string {
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `RU26-REQ-${randomDigits}`;
}

/**
 * Default collision detector: Prisma unique-constraint violation (P2002) on public_id.
 * Structured (not instanceof-based) so it behaves identically for any Prisma client
 * instance and can be replaced by tests exercising an isolated store.
 */
export function isPublicIdCollision(err: unknown): boolean {
  const code = (err as { code?: unknown } | null)?.code;
  if (code !== 'P2002') return false;

  const target = (err as { meta?: { target?: unknown } } | null)?.meta?.target;
  return Array.isArray(target)
    ? target.includes('public_id')
    : String(target ?? '').includes('public_id');
}

export interface UniqueBookingIdOptions {
  maxRetries?: number;
  isCollision?: (err: unknown) => boolean;
  onAttempt?: (publicId: string, attempt: number) => void;
  onCollision?: (publicId: string, attempt: number, err: unknown) => void;
}

/**
 * Runs `createOnce` with freshly generated ids until it succeeds or the retry
 * budget is exhausted. Non-collision errors propagate unchanged.
 */
export async function withUniqueBookingId<T>(
  createOnce: (publicId: string) => Promise<T>,
  options: UniqueBookingIdOptions = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? MAX_COLLISION_RETRIES;
  const isCollision = options.isCollision ?? isPublicIdCollision;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const publicId = generatePublicBookingId();
    options.onAttempt?.(publicId, attempt);

    try {
      return await createOnce(publicId);
    } catch (err) {
      if (isCollision(err)) {
        options.onCollision?.(publicId, attempt, err);
        continue;
      }
      throw err;
    }
  }

  throw new BookingIdExhaustedError();
}
