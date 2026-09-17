import 'server-only';
import { getActiveOrganiserFromRequest } from '@/lib/organiser-auth';
import { clearOrganiserSessionCookie } from '@/lib/organiser-session';
import { isSameOriginRequest } from '@/lib/request-origin';

export async function POST(req: Request) {
  if (!isSameOriginRequest(req)) {
    return Response.json(
      { success: false, code: 'ORIGIN_REJECTED', error: 'Request origin validation failed.' },
      { status: 403 }
    );
  }

  const organiser = await getActiveOrganiserFromRequest();
  if (!organiser) {
    return Response.json(
      { success: false, code: 'ORGANISER_SESSION_EXPIRED', error: 'Organiser session required.' },
      { status: 401 }
    );
  }

  await clearOrganiserSessionCookie();
  return Response.json({ success: true });
}
