import 'server-only';
import { syncBookingToSheets, syncAllUnsyncedBookings } from '@/lib/sheets';

/**
 * Protected maintenance and reconciliation endpoint for Google Sheets synchronization.
 *
 * Invariants:
 * 1. Secured via CRON_SECRET (Bearer token or x-cron-secret header).
 * 2. Compatible with Vercel Cron (GET) and maintenance scripts (POST).
 * 3. Supports single-booking retry or batch reconciliation for all unsynced (PENDING/FAILED) confirmed bookings.
 * 4. Runs server-to-server; never accessible to unauthorized callers.
 */
async function handleSyncRequest(req: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return Response.json(
      { success: false, error: 'Maintenance endpoint not configured.' },
      { status: 503 }
    );
  }

  const authHeader = req.headers.get('authorization');
  const customHeader = req.headers.get('x-cron-secret');

  const isAuthorized =
    authHeader === `Bearer ${cronSecret}` || customHeader === cronSecret;

  if (!isAuthorized) {
    return Response.json(
      { success: false, error: 'Unauthorized.' },
      { status: 401 }
    );
  }

  try {
    let targetBookingId: string | null = null;
    let limit = 25;

    // Inspect query parameters if GET
    const url = new URL(req.url);
    const queryBookingId = url.searchParams.get('bookingId');
    const queryLimit = url.searchParams.get('limit');
    if (queryBookingId) targetBookingId = queryBookingId.trim();
    if (queryLimit && !isNaN(parseInt(queryLimit, 10))) {
      limit = Math.min(Math.max(1, parseInt(queryLimit, 10)), 100);
    }

    // Inspect JSON body if POST
    if (req.method === 'POST') {
      try {
        const body = (await req.json()) as Record<string, unknown>;
        if (typeof body?.bookingId === 'string') {
          targetBookingId = body.bookingId.trim();
        }
        if (typeof body?.limit === 'number') {
          limit = Math.min(Math.max(1, body.limit), 100);
        }
      } catch {
        // Body is optional; empty payload is allowed for batch sync
      }
    }

    if (targetBookingId) {
      const result = await syncBookingToSheets(targetBookingId);
      return Response.json({
        success: result.success,
        mode: 'single',
        result,
        timestamp: new Date().toISOString(),
      });
    }

    const batchResult = await syncAllUnsyncedBookings(limit);
    return Response.json({
      success: true,
      mode: 'batch',
      ...batchResult,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error(
      '[Sheets Sync Maintenance Error]',
      err instanceof Error ? err.message : 'Unknown error'
    );
    return Response.json(
      { success: false, error: 'Failed to execute sheets synchronization reconciliation.' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  return handleSyncRequest(req);
}

export async function POST(req: Request) {
  return handleSyncRequest(req);
}
