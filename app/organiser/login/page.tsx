import { redirect } from 'next/navigation';
import { getActiveOrganiserFromRequest } from '@/lib/organiser-auth';
import OrganiserLoginForm from '@/components/organiser/OrganiserLoginForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Organiser Sign In | RAAS UTSAV 2026',
  robots: { index: false, follow: false },
};

export default async function OrganiserLoginPage() {
  const organiser = await getActiveOrganiserFromRequest();
  if (organiser) redirect('/organiser');

  return (
    <div className="min-h-screen bg-deep-plum text-warm-cream flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="font-display text-3xl tracking-wider text-bright-gold uppercase">
            RAAS UTSAV 2026
          </div>
          <div className="text-xs uppercase tracking-widest text-warm-cream/60 font-body mt-1">
            Organiser Entry Control
          </div>
        </div>

        <OrganiserLoginForm />
      </div>
    </div>
  );
}
