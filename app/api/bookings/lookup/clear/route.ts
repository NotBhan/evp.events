import 'server-only';
import { clearLookupSessionCookie } from '@/lib/session';

export async function POST() {
  await clearLookupSessionCookie();
  return Response.json({
    success: true,
    message: 'Lookup session cleared successfully.',
  });
}
