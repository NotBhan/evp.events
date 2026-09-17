'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { LogOut, QrCode, LayoutDashboard, ShieldCheck } from 'lucide-react';

export interface OrganiserShellIdentity {
  name: string;
  role: 'ENTRY_SCANNER' | 'ADMIN';
  gateId: string;
}

export default function OrganiserShell({
  organiser,
  children,
}: {
  organiser: OrganiserShellIdentity;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await fetch('/api/organiser/logout', { method: 'POST' });
    } finally {
      router.replace('/organiser/login');
      router.refresh();
    }
  };

  const links = [
    { href: '/organiser', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/organiser/scan', label: 'Scanner', icon: QrCode },
    ...(organiser.role === 'ADMIN'
      ? [{ href: '/organiser/admin', label: 'Admin', icon: ShieldCheck }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-deep-plum text-warm-cream">
      <header className="border-b border-antique-gold/30 bg-royal-maroon/80">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
          <div className="min-w-0">
            <div className="font-display text-2xl tracking-wider text-bright-gold uppercase">
              Entry Control
            </div>
            <div className="text-xs text-warm-cream/70 font-body break-words">
              {organiser.name} · {organiser.gateId} ·{' '}
              <span className="uppercase">{organiser.role.replace('_', ' ')}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center gap-2 px-3 py-2.5 sm:px-4 rounded-xl border text-sm font-body font-bold transition-colors ${
                    isActive
                      ? 'bg-bright-gold text-deep-plum border-bright-gold'
                      : 'bg-deep-plum text-warm-cream border-antique-gold/40 hover:border-bright-gold/70'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="inline-flex items-center gap-2 px-3 py-2.5 sm:px-4 rounded-xl border border-vermilion/60 bg-vermilion/20 text-warm-cream text-sm font-body font-bold hover:bg-vermilion/30 disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              <span>{isLoggingOut ? 'Signing out…' : 'Sign out'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
