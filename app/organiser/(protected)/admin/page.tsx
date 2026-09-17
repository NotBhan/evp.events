import { redirect } from 'next/navigation';
import { getActiveOrganiserFromRequest } from '@/lib/organiser-auth';
import OrganiserAdminPanel from '@/components/organiser/OrganiserAdminPanel';

export const dynamic = 'force-dynamic';

export default async function OrganiserAdminPage() {
  const organiser = await getActiveOrganiserFromRequest();
  if (!organiser) redirect('/organiser/login');

  // Server-side role gate: ENTRY_SCANNER can never reach the admin panel, and every
  // admin API independently re-validates the ADMIN role from Neon.
  if (organiser.role !== 'ADMIN') {
    return (
      <div className="max-w-md mx-auto p-5 rounded-2xl bg-vermilion/15 border border-vermilion/40 text-sm font-body">
        <div className="font-display text-xl text-vermilion uppercase mb-1">Not permitted</div>
        <p className="text-warm-cream/80">
          Organiser administration requires an ADMIN account. Contact an event administrator.
        </p>
      </div>
    );
  }

  return <OrganiserAdminPanel />;
}
