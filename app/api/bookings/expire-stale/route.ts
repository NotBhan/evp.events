import 'server-only';
import { expireAllStaleBookings } from '@/lib/expiry';

export async function POST(req: Request) {
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
    const expiredCount = await expireAllStaleBookings(50);

    return Response.json({
      success: true,
      expiredCount,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error('[Expire Stale Error]', err instanceof Error ? err.message : 'Unknown error');
    return Response.json(
      { success: false, error: 'Failed to process stale bookings.' },
      { status: 500 }
    );
  }
}
