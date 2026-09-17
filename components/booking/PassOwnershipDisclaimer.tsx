import { ShieldAlert } from 'lucide-react';

/**
 * Pass ownership / sharing disclaimer. Single source of the wording so the booking
 * flow, the find-pass page and any other surface stay identical.
 *
 * Note: this does NOT restrict who may use a valid pass (transfer by possession is
 * unchanged) — it explains that the booking is registered to the booker's name and
 * that entry taken with shared credentials is final.
 */
export default function PassOwnershipDisclaimer({ className = '' }: { className?: string }) {
  return (
    <div
      data-disclaimer="pass-ownership"
      className={`p-4 rounded-xl bg-deep-plum/80 border border-antique-gold/25 text-[11px] font-body text-warm-cream/80 leading-relaxed space-y-1.5 ${className}`}
    >
      <div className="flex items-center gap-2 font-bold text-bright-gold uppercase tracking-wider">
        <ShieldAlert className="w-3.5 h-3.5 text-bright-gold shrink-0" />
        <span>Pass ownership &amp; sharing</span>
      </div>
      <p>
        Every pass is registered to the name provided at booking and admits{' '}
        <strong className="text-warm-cream">one entry</strong>. Keep your Booking ID, email address,
        mobile number and entry QR private: anyone you share them with can open your receipt and take
        entry with your pass.
      </p>
      <p>
        Once a pass has been used for entry, that entry is{' '}
        <strong className="text-warm-cream">final</strong> — it cannot be reversed, replaced or
        refunded, and we cannot take responsibility for entry taken using details you shared.
      </p>
    </div>
  );
}
