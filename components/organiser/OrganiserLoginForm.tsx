'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, LogIn } from 'lucide-react';

export default function OrganiserLoginForm() {
  const router = useRouter();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;

    setError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/organiser/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginId, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        setError(data.error || 'Sign-in failed. Please try again.');
        setIsSubmitting(false);
        return;
      }

      router.replace('/organiser');
      router.refresh();
    } catch {
      setError('Network error — unable to reach the sign-in service.');
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-royal-maroon/70 border border-antique-gold/40 rounded-2xl p-6 space-y-4"
    >
      <div>
        <label htmlFor="organiser-login-id" className="block text-xs uppercase tracking-wider text-warm-cream/70 mb-2 font-body">
          Login ID
        </label>
        <input
          id="organiser-login-id"
          name="loginId"
          type="text"
          autoComplete="username"
          required
          value={loginId}
          onChange={(e) => setLoginId(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-deep-plum border border-antique-gold/40 text-warm-cream font-body focus:outline-none focus:border-bright-gold"
        />
      </div>

      <div>
        <label htmlFor="organiser-password" className="block text-xs uppercase tracking-wider text-warm-cream/70 mb-2 font-body">
          Password
        </label>
        <input
          id="organiser-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-deep-plum border border-antique-gold/40 text-warm-cream font-body focus:outline-none focus:border-bright-gold"
        />
      </div>

      {error && (
        <div
          id="organiser-login-error"
          role="alert"
          className="flex items-start gap-2 p-3 rounded-xl bg-vermilion/20 border border-vermilion/40 text-sm font-body"
        >
          <AlertTriangle className="w-4 h-4 text-vermilion shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <button
        id="organiser-login-submit"
        type="submit"
        disabled={isSubmitting}
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-vermilion to-amber-glow text-warm-cream font-display text-lg tracking-wider uppercase border border-antique-gold/70 disabled:opacity-60"
      >
        <LogIn className="w-5 h-5" />
        <span>{isSubmitting ? 'Signing in…' : 'Sign in'}</span>
      </button>

      <p className="text-[11px] text-warm-cream/50 font-body">
        Organiser credentials are issued by the event administrators. Entry verification requires an
        online connection.
      </p>
    </form>
  );
}
