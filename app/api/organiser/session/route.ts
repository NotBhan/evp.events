import 'server-only';
import { getActiveOrganiserFromRequest } from '@/lib/organiser-auth';

export async function GET() {
  const organiser = await getActiveOrganiserFromRequest();
  if (!organiser) {
    return Response.json(
      { success: false, code: 'ORGANISER_SESSION_EXPIRED', error: 'Organiser session required.' },
      { status: 401 }
    );
  }

  return Response.json({
    success: true,
    organiser: {
      name: organiser.name,
      loginId: organiser.loginId,
      role: organiser.role,
      gateId: organiser.gateId,
    },
  });
}
