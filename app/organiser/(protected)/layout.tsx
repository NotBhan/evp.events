import { redirect } from 'next/navigation';
import { getActiveOrganiserFromRequest } from '@/lib/organiser-auth';
import OrganiserShell from '@/components/organiser/OrganiserShell';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Organiser Entry Control | RAAS UTSAV 2026',
  robots: { index: false, follow: false },
};

export default async function OrganiserProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const organiser = await getActiveOrganiserFromRequest();
  if (!organiser) redirect('/organiser/login');

  return (
    <OrganiserShell
      organiser={{ name: organiser.name, role: organiser.role, gateId: organiser.gateId }}
    >
      {children}
    </OrganiserShell>
  );
}
