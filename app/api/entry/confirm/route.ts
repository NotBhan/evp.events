import 'server-only';
import { getActiveOrganiserFromRequest } from '@/lib/organiser-auth';
import { verifyEntryQrToken } from '@/lib/entry-token';
import { confirmEntry } from '@/lib/checkin';
import { isSameOriginRequest } from '@/lib/request-origin';

/**
 * The ONLY admission mutation. Requires an authenticated active organiser session
 * and re-validates everything server-side:
 * - the QR signature is re-verified (never trusts a prior /api/entry/verify result),
 * - the booking is re-loaded from Neon and the atomic conditional UPDATE decides entry,
 * - `checkedInBy` / `checkedInById` are derived from the authenticated session and any
 *   client-supplied identity/status fields in the body are ignored entirely.
 */
export async function POST(req: Request) {
  const organiser = await getActiveOrganiserFromRequest();
  if (!organiser) {
    return Response.json(
      { success: false, result: 'ORGANISER_SESSION_EXPIRED' },
      { status: 401 }
    );
  }

  if (!isSameOriginRequest(req)) {
    return Response.json(
      { success: false, result: 'ORIGIN_REJECTED', error: 'Request origin validation failed.' },
      { status: 403 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { success: false, result: 'UNKNOWN', error: 'Invalid JSON request payload.' },
      { status: 400 }
    );
  }

  const parsed = verifyEntryQrToken(body.qrToken);
  if (!parsed) {
    return Response.json({ success: false, result: 'INVALID_QR', booking: null });
  }

  try {
    const result = await confirmEntry(parsed.publicId, organiser);

    if (result.ok) {
      return Response.json({
        success: true,
        result: 'ENTRY_CONFIRMED',
        booking: result.booking,
      });
    }

    return Response.json({
      success: false,
      result: result.reason,
      booking: result.booking,
    });
  } catch (err) {
    console.error(
      '[Entry Confirm] Unexpected failure:',
      err instanceof Error ? err.message : 'Unknown error'
    );
    return Response.json(
      { success: false, result: 'UNKNOWN' },
      { status: 500 }
    );
  }
}
