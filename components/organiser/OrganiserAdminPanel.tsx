'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw, ShieldCheck, UserPlus } from 'lucide-react';

interface OrganiserRecord {
  loginId: string;
  name: string;
  role: 'ENTRY_SCANNER' | 'ADMIN';
  gateId: string;
  active: boolean;
  lastLoginAt: string | null;
  lockedUntil: string | null;
  createdAt: string;
}

export default function OrganiserAdminPanel() {
  const [organisers, setOrganisers] = useState<OrganiserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [gateDrafts, setGateDrafts] = useState<Record<string, string>>({});
  const [passwordDrafts, setPasswordDrafts] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    name: '',
    loginId: '',
    role: 'ENTRY_SCANNER',
    gateId: 'GATE-01',
    password: '',
  });

  const loadOrganisers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/organiser/admin/organisers');
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setMessage({ kind: 'error', text: data.error || 'Unable to load organisers.' });
        return;
      }
      setOrganisers(data.organisers || []);
      setMessage(null);
    } catch {
      setMessage({ kind: 'error', text: 'Network error while loading organisers.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Kick the initial load after the effect body so loading state updates do not
    // happen synchronously inside React's effect phase.
    const loadTimer = setTimeout(() => {
      void loadOrganisers();
    }, 0);

    return () => clearTimeout(loadTimer);
  }, [loadOrganisers]);

  const runAction = async (loginId: string, payload: Record<string, unknown>, successText: string) => {
    setPendingAction(`${loginId}:${String(payload.action)}`);
    setMessage(null);
    try {
      const res = await fetch('/api/organiser/admin/organisers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginId, ...payload }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setMessage({ kind: 'error', text: data.error || 'Action failed.' });
        return;
      }
      setMessage({ kind: 'success', text: successText });
      await loadOrganisers();
    } catch {
      setMessage({ kind: 'error', text: 'Network error while applying the action.' });
    } finally {
      setPendingAction(null);
    }
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);

    try {
      const res = await fetch('/api/organiser/admin/organisers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setMessage({ kind: 'error', text: data.error || 'Unable to create organiser.' });
        return;
      }
      setMessage({ kind: 'success', text: `Created organiser "${data.organiser.loginId}".` });
      setForm({ name: '', loginId: '', role: 'ENTRY_SCANNER', gateId: 'GATE-01', password: '' });
      await loadOrganisers();
    } catch {
      setMessage({ kind: 'error', text: 'Network error while creating the organiser.' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl tracking-wider text-bright-gold uppercase flex items-center gap-2">
          <ShieldCheck className="w-7 h-7" />
          <span>Organiser admin</span>
        </h1>
        <button
          type="button"
          onClick={loadOrganisers}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-deep-plum border border-antique-gold/40 text-warm-cream text-sm font-body font-bold"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {message && (
        <div
          id="admin-message"
          data-kind={message.kind}
          className={`flex items-start gap-2 p-3 rounded-xl border text-sm font-body ${
            message.kind === 'error'
              ? 'bg-vermilion/15 border-vermilion/40'
              : 'bg-emerald-900/30 border-emerald-400/40'
          }`}
        >
          {message.kind === 'error' && <AlertTriangle className="w-4 h-4 text-vermilion shrink-0 mt-0.5" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Organiser list */}
      <section id="admin-organiser-list" className="space-y-3">
        {organisers.map((organiser) => (
          <div
            key={organiser.loginId}
            data-login-id={organiser.loginId}
            className="p-4 rounded-2xl bg-royal-maroon/60 border border-antique-gold/30 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-body font-bold text-warm-cream">
                  {organiser.name}{' '}
                  <span className="text-warm-cream/50 font-normal">({organiser.loginId})</span>
                </div>
                <div className="text-xs text-warm-cream/60 font-body">
                  {organiser.role} · Gate {organiser.gateId} · Last login:{' '}
                  {organiser.lastLoginAt ? new Date(organiser.lastLoginAt).toLocaleString('en-IN') : 'never'}
                  {organiser.lockedUntil && new Date(organiser.lockedUntil) > new Date()
                    ? ` · Locked until ${new Date(organiser.lockedUntil).toLocaleTimeString('en-IN')}`
                    : ''}
                </div>
              </div>
              <span
                data-active={organiser.active}
                className={`px-3 py-1 rounded-full text-xs font-body font-bold uppercase ${
                  organiser.active
                    ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-400/40'
                    : 'bg-vermilion/20 text-vermilion border border-vermilion/40'
                }`}
              >
                {organiser.active ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={pendingAction !== null}
                onClick={() =>
                  runAction(
                    organiser.loginId,
                    { action: organiser.active ? 'deactivate' : 'reactivate' },
                    organiser.active ? 'Organiser deactivated.' : 'Organiser reactivated.'
                  )
                }
                className="px-4 py-2 rounded-xl bg-deep-plum border border-antique-gold/40 text-warm-cream text-xs font-body font-bold disabled:opacity-50"
              >
                {organiser.active ? 'Deactivate' : 'Reactivate'}
              </button>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="GATE-02"
                  value={gateDrafts[organiser.loginId] ?? ''}
                  onChange={(e) =>
                    setGateDrafts((prev) => ({ ...prev, [organiser.loginId]: e.target.value }))
                  }
                  className="w-28 px-3 py-2 rounded-xl bg-deep-plum border border-antique-gold/40 text-warm-cream text-xs font-body"
                />
                <button
                  type="button"
                  disabled={pendingAction !== null || !(gateDrafts[organiser.loginId] || '').trim()}
                  onClick={() =>
                    runAction(
                      organiser.loginId,
                      { action: 'set-gate', gateId: gateDrafts[organiser.loginId] },
                      'Gate updated.'
                    )
                  }
                  className="px-4 py-2 rounded-xl bg-deep-plum border border-antique-gold/40 text-warm-cream text-xs font-body font-bold disabled:opacity-50"
                >
                  Set gate
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="password"
                  placeholder="New password"
                  value={passwordDrafts[organiser.loginId] ?? ''}
                  onChange={(e) =>
                    setPasswordDrafts((prev) => ({ ...prev, [organiser.loginId]: e.target.value }))
                  }
                  className="w-36 px-3 py-2 rounded-xl bg-deep-plum border border-antique-gold/40 text-warm-cream text-xs font-body"
                />
                <button
                  type="button"
                  disabled={pendingAction !== null || (passwordDrafts[organiser.loginId] || '').length < 8}
                  onClick={() =>
                    runAction(
                      organiser.loginId,
                      { action: 'reset-credential', password: passwordDrafts[organiser.loginId] },
                      'Credential reset.'
                    )
                  }
                  className="px-4 py-2 rounded-xl bg-deep-plum border border-antique-gold/40 text-warm-cream text-xs font-body font-bold disabled:opacity-50"
                >
                  Reset credential
                </button>
              </div>
            </div>
          </div>
        ))}

        {!isLoading && organisers.length === 0 && (
          <div className="p-4 rounded-2xl bg-deep-plum/80 border border-antique-gold/30 text-sm font-body text-warm-cream/70">
            No organisers provisioned yet.
          </div>
        )}
      </section>

      {/* Create organiser */}
      <section className="p-5 rounded-2xl bg-royal-maroon/60 border border-antique-gold/30">
        <h2 className="font-display text-xl tracking-wider text-bright-gold uppercase flex items-center gap-2 mb-4">
          <UserPlus className="w-5 h-5" />
          <span>Create organiser</span>
        </h2>

        <form id="create-organiser-form" onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-4">
          <input
            type="text"
            required
            placeholder="Full name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="px-4 py-3 rounded-xl bg-deep-plum border border-antique-gold/40 text-warm-cream font-body"
          />
          <input
            type="text"
            required
            placeholder="Login id (e.g. gate1)"
            value={form.loginId}
            onChange={(e) => setForm((f) => ({ ...f, loginId: e.target.value }))}
            className="px-4 py-3 rounded-xl bg-deep-plum border border-antique-gold/40 text-warm-cream font-body"
          />
          <select
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            className="px-4 py-3 rounded-xl bg-deep-plum border border-antique-gold/40 text-warm-cream font-body"
          >
            <option value="ENTRY_SCANNER">ENTRY_SCANNER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          <input
            type="text"
            required
            placeholder="Gate id (e.g. GATE-01)"
            value={form.gateId}
            onChange={(e) => setForm((f) => ({ ...f, gateId: e.target.value }))}
            className="px-4 py-3 rounded-xl bg-deep-plum border border-antique-gold/40 text-warm-cream font-body"
          />
          <input
            type="password"
            required
            minLength={8}
            placeholder="Initial password (min 8 chars)"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className="px-4 py-3 rounded-xl bg-deep-plum border border-antique-gold/40 text-warm-cream font-body sm:col-span-2"
          />
          <button
            id="create-organiser-submit"
            type="submit"
            className="sm:col-span-2 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-vermilion to-amber-glow text-warm-cream font-display text-lg tracking-wider uppercase border border-antique-gold/70"
          >
            <UserPlus className="w-5 h-5" />
            <span>Create organiser</span>
          </button>
        </form>
      </section>
    </div>
  );
}
