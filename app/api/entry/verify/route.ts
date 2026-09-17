import 'server-only';
import { getActiveOrganiserFromRequest } from '@/lib/organiser-auth';
import { verifyEntryQrToken } from '@/lib/entry-token';
import { verifyEntry } from '@/lib/checkin';

/**
 * Read-only verification. Requires an authenticated active organiser session.
 * Never mutates admission state; the scanner UI must call /api/entry/confirm
 * to perform the actual entry transition.
 */
export async function POST(req: Request) {
  const organiser = await getActiveOrganiserFromRequest();
  if (!organiser) {
    return Response.json(
      { success: false, valid: false, reason: 'ORGANISER_SESSION_EXPIRED' },
      { status: 401 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { success: false, valid: false, reason: 'UNKNOWN', error: 'Invalid JSON request payload.' },
      { status: 400 }
    );
  }

  const parsed = verifyEntryQrToken(body.qrToken);
  if (!parsed) {
    return Response.json({ success: true, valid: false, reason: 'INVALID_QR', booking: null });
  }

  try {
    const result = await verifyEntry(parsed.publicId);

    if (result.valid) {
      return Response.json({
        success: true,
        valid: true,
        entryStatus: result.booking.entryStatus,
        booking: result.booking,
      });
    }

    return Response.json({
      success: true,
      valid: false,
      reason: result.reason,
      booking: result.booking,
    });
  } catch (err) {
    console.error(
      '[Entry Verify] Unexpected failure:',
      err instanceof Error ? err.message : 'Unknown error'
    );
    return Response.json(
      { success: false, valid: false, reason: 'UNKNOWN' },
      { status: 500 }
    );
  }
}
