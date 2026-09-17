import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getActiveOrganiserFromRequest } from '@/lib/organiser-auth';
import { QrCode, ShieldCheck, WifiOff } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function OrganiserDashboardPage() {
  const organiser = await getActiveOrganiserFromRequest();
  if (!organiser) return null;

  const [totalCheckedIn, checkedInByMe] = await Promise.all([
    prisma.booking.count({ where: { checkInStatus: 'CHECKED_IN' } }),
    prisma.booking.count({
      where: { checkInStatus: 'CHECKED_IN', checkedInById: organiser.organiserId },
    }),
  ]);

  return (
    <div className="space-y-6">
      <section className="bg-royal-maroon/60 border border-antique-gold/30 rounded-2xl p-5">
        <h1 className="font-display text-3xl tracking-wider text-bright-gold uppercase">
          Welcome, {organiser.name}
        </h1>
        <p className="text-sm text-warm-cream/70 font-body mt-1">
          Gate <span className="font-bold text-warm-cream">{organiser.gateId}</span> · Role{' '}
          <span className="font-bold text-warm-cream uppercase">{organiser.role.replace('_', ' ')}</span>
        </p>
      </section>

      <section className="grid grid-cols-2 gap-4">
        <div className="bg-royal-maroon/60 border border-antique-gold/30 rounded-2xl p-5">
          <div className="text-xs uppercase tracking-wider text-warm-cream/60 font-body">
            Passes checked in (event total)
          </div>
          <div className="font-display text-4xl text-bright-gold mt-1">{totalCheckedIn}</div>
        </div>
        <div className="bg-royal-maroon/60 border border-antique-gold/30 rounded-2xl p-5">
          <div className="text-xs uppercase tracking-wider text-warm-cream/60 font-body">
            Checked in by you
          </div>
          <div className="font-display text-4xl text-bright-gold mt-1">{checkedInByMe}</div>
        </div>
      </section>

      <section className="grid sm:grid-cols-2 gap-4">
        <Link
          href="/organiser/scan"
          className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-vermilion to-amber-glow text-warm-cream border border-antique-gold/70"
        >
          <QrCode className="w-8 h-8" />
          <div>
            <div className="font-display text-xl tracking-wider uppercase">Open scanner</div>
            <div className="text-xs font-body text-warm-cream/90">
              Verify a pass and confirm entry
            </div>
          </div>
        </Link>

        {organiser.role === 'ADMIN' && (
          <Link
            href="/organiser/admin"
            className="flex items-center gap-4 p-5 rounded-2xl bg-deep-plum border border-antique-gold/40 text-warm-cream"
          >
            <ShieldCheck className="w-8 h-8 text-bright-gold" />
            <div>
              <div className="font-display text-xl tracking-wider uppercase">Organiser admin</div>
              <div className="text-xs font-body text-warm-cream/70">
                Manage accounts, gates and credentials
              </div>
            </div>
          </Link>
        )}
      </section>

      <section className="flex items-start gap-3 p-4 rounded-2xl bg-deep-plum/80 border border-antique-gold/30 text-xs font-body text-warm-cream/80">
        <WifiOff className="w-4 h-4 text-bright-gold shrink-0 mt-0.5" />
        <p>
          Entry verification is online-only. There is no offline admission — if the connection is
          unavailable, passes cannot be verified until it is restored.
        </p>
      </section>
    </div>
  );
}
