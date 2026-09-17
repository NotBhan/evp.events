'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Html5Qrcode } from 'html5-qrcode';
import { AlertTriangle, Camera, CheckCircle2, RefreshCw, XCircle } from 'lucide-react';

const READER_ELEMENT_ID = 'organiser-qr-reader';
const DUPLICATE_SCAN_WINDOW_MS = 3000;

interface EntryBookingView {
  bookingId: string;
  attendeeName: string;
  passType: string;
  quantity: number;
  bookingStatus: string;
  paymentStatus: string;
  entryStatus: 'NOT_CHECKED_IN' | 'CHECKED_IN';
  checkedInAt: string | null;
  scannedBy: string | null;
}

type ScannerState =
  | 'STARTING'
  | 'SCANNING'
  | 'VERIFYING'
  | 'VALID'
  | 'CONFIRMING'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'CAMERA_DENIED'
  | 'CAMERA_UNAVAILABLE'
  | 'UNSUPPORTED'
  | 'NETWORK_UNAVAILABLE';

const REASON_TEXT: Record<string, string> = {
  INVALID_QR: 'INVALID QR — this code is not a valid RAAS UTSAV pass.',
  BOOKING_NOT_FOUND: 'BOOKING NOT FOUND — no matching reservation exists.',
  BOOKING_EXPIRED: 'BOOKING EXPIRED — the reservation hold lapsed unpaid.',
  BOOKING_CANCELLED: 'BOOKING CANCELLED — this pass was cancelled.',
  PAYMENT_NOT_CONFIRMED: 'PAYMENT NOT CONFIRMED — the pass is not paid.',
  BOOKING_NOT_CONFIRMED: 'BOOKING NOT CONFIRMED — payment was never completed.',
  ALREADY_CHECKED_IN: 'ALREADY CHECKED IN — this pass has already been used.',
  ORGANISER_SESSION_EXPIRED: 'Your organiser session has expired. Please sign in again.',
  UNKNOWN: 'Unable to verify this pass. Please try again.',
};

export default function OrganiserScanner() {
  const router = useRouter();
  const [state, setState] = useState<ScannerState>('STARTING');
  const [booking, setBooking] = useState<EntryBookingView | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [cameraMessage, setCameraMessage] = useState<string>('');

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const busyRef = useRef(false);
  const lastScanRef = useRef<{ token: string; at: number } | null>(null);
  const tokenRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (!scanner) return;
    try {
      await scanner.stop();
    } catch {
      // Camera already stopped / never started — nothing to release.
    }
    try {
      scanner.clear();
    } catch {
      // Element already cleared.
    }
  }, []);

  const handleToken = useCallback(
    async (token: string) => {
      if (busyRef.current) return;

      const now = Date.now();
      const last = lastScanRef.current;
      if (last && last.token === token && now - last.at < DUPLICATE_SCAN_WINDOW_MS) {
        return;
      }
      lastScanRef.current = { token, at: now };

      busyRef.current = true;
      tokenRef.current = token;
      setReason(null);
      setBooking(null);
      setState('VERIFYING');

      // Release the camera while showing the result (privacy, battery, duplicate reads).
      await stopScanner();

      try {
        const res = await fetch('/api/entry/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qrToken: token }),
        });

        if (res.status === 401) {
          if (mountedRef.current) setState('REJECTED');
          setReason('ORGANISER_SESSION_EXPIRED');
          router.replace('/organiser/login');
          return;
        }

        const data = await res.json();
        if (!mountedRef.current) return;

        if (data.valid) {
          setBooking(data.booking);
          setState('VALID');
        } else {
          setBooking(data.booking ?? null);
          setReason(data.reason || 'UNKNOWN');
          setState('REJECTED');
        }
      } catch {
        if (mountedRef.current) setState('NETWORK_UNAVAILABLE');
      } finally {
        busyRef.current = false;
      }
    },
    [router, stopScanner]
  );

  const startScanner = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setState('UNSUPPORTED');
      return;
    }

    setCameraMessage('');
    setState('STARTING');

    try {
      const scanner = new Html5Qrcode(READER_ELEMENT_ID, { verbose: false });
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          // Adaptive scan box: 70% of the smaller viewfinder dimension. A fixed box
          // is too small for phone screens/printouts held close to the camera.
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const edge = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.7);
            return { width: edge, height: edge };
          },
        },
        (decodedText) => {
          void handleToken(decodedText.trim());
        },
        () => {
          // Per-frame decode misses are expected noise; ignore.
        }
      );

      if (mountedRef.current) setState('SCANNING');
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      const name = err instanceof Error ? err.name : '';
      const message = err instanceof Error ? err.message : 'Camera could not be started.';

      if (name === 'NotAllowedError' || /permission/i.test(message)) {
        setCameraMessage('Camera permission was denied. Allow camera access in your browser settings.');
        setState('CAMERA_DENIED');
      } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
        setCameraMessage('No usable camera was found on this device.');
        setState('CAMERA_UNAVAILABLE');
      } else {
        setCameraMessage(message);
        setState('CAMERA_UNAVAILABLE');
      }
    }
  }, [handleToken]);

  useEffect(() => {
    mountedRef.current = true;

    // Camera start is kicked off after the effect body so the scanner's state
    // transitions happen outside React's synchronous effect phase.
    const startTimer = setTimeout(() => {
      void startScanner();
    }, 0);

    return () => {
      clearTimeout(startTimer);
      mountedRef.current = false;
      void stopScanner();
    };
  }, [startScanner, stopScanner]);

  const handleConfirmEntry = async () => {
    const token = tokenRef.current;
    if (!token || busyRef.current) return;

    busyRef.current = true;
    setState('CONFIRMING');

    try {
      const res = await fetch('/api/entry/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrToken: token }),
      });

      if (res.status === 401) {
        router.replace('/organiser/login');
        return;
      }

      const data = await res.json();
      if (!mountedRef.current) return;

      if (data.success && data.result === 'ENTRY_CONFIRMED') {
        setBooking(data.booking);
        setState('CONFIRMED');
      } else {
        setBooking(data.booking ?? null);
        setReason(data.result || 'UNKNOWN');
        setState('REJECTED');
      }
    } catch {
      if (mountedRef.current) setState('NETWORK_UNAVAILABLE');
    } finally {
      busyRef.current = false;
    }
  };

  const handleScanNext = () => {
    setBooking(null);
    setReason(null);
    lastScanRef.current = null;
    tokenRef.current = null;
    void startScanner();
  };

  return (
    <div
      className={`space-y-5 ${
        state === 'CONFIRMED' || state === 'REJECTED' ? 'pb-32' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl tracking-wider text-bright-gold uppercase">Scanner</h1>
        <div className="text-xs font-body text-warm-cream/60" id="scanner-status" data-state={state}>
          {state === 'SCANNING' ? 'Camera active — point at the pass QR' : null}
          {state === 'STARTING' ? 'Starting camera…' : null}
          {state === 'VERIFYING' ? 'Verifying pass…' : null}
          {state === 'CONFIRMING' ? 'Confirming entry…' : null}
        </div>
      </div>

      {/* Camera viewport — always rendered so the scanner has a mount target */}
      <div
        id={READER_ELEMENT_ID}
        className={`w-full max-w-md mx-auto rounded-2xl overflow-hidden border border-antique-gold/40 bg-black ${
          state === 'SCANNING' || state === 'STARTING' ? 'block' : 'hidden'
        }`}
      />

      {(state === 'CAMERA_DENIED' || state === 'CAMERA_UNAVAILABLE' || state === 'UNSUPPORTED') && (
        <div
          id="camera-error"
          data-state={state}
          className="max-w-md mx-auto p-5 rounded-2xl bg-vermilion/15 border border-vermilion/40 text-sm font-body space-y-2"
        >
          <div className="flex items-center gap-2 font-bold text-warm-cream">
            <Camera className="w-4 h-4" />
            <span>
              {state === 'CAMERA_DENIED'
                ? 'CAMERA PERMISSION DENIED'
                : state === 'UNSUPPORTED'
                  ? 'CAMERA NOT SUPPORTED'
                  : 'CAMERA UNAVAILABLE'}
            </span>
          </div>
          <p className="text-warm-cream/80">
            {state === 'UNSUPPORTED'
              ? 'This browser does not expose camera access. Use a modern mobile browser or a desktop webcam.'
              : cameraMessage}
          </p>
          <button
            type="button"
            onClick={handleScanNext}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-deep-plum border border-antique-gold/40 text-warm-cream font-body font-bold"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry camera</span>
          </button>
        </div>
      )}

      {state === 'NETWORK_UNAVAILABLE' && (
        <div
          id="network-error"
          className="max-w-md mx-auto p-5 rounded-2xl bg-amber-glow/15 border border-amber-glow/50 text-sm font-body space-y-2"
        >
          <div className="flex items-center gap-2 font-bold text-warm-cream">
            <AlertTriangle className="w-4 h-4 text-amber-glow" />
            <span>CONNECTION UNAVAILABLE</span>
          </div>
          <p className="text-warm-cream/80">
            Cannot verify passes without a connection. There is no offline admission — restore the
            connection and scan again.
          </p>
          <button
            type="button"
            onClick={handleScanNext}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-deep-plum border border-antique-gold/40 text-warm-cream font-body font-bold"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* VALID — details + explicit confirmation */}
      {state === 'VALID' && booking && (
        <div
          id="verify-result"
          data-result="VALID"
          className="max-w-md mx-auto p-5 rounded-2xl bg-royal-maroon/70 border-2 border-bright-gold/70 space-y-4"
        >
          <div className="flex items-center gap-2 font-display text-2xl tracking-wider text-bright-gold uppercase">
            <CheckCircle2 className="w-6 h-6" />
            <span>Valid pass</span>
          </div>

          <dl className="text-sm font-body space-y-2">
            <div className="flex justify-between">
              <dt className="text-warm-cream/60">Booking ID</dt>
              <dd className="font-bold text-warm-cream" id="verify-booking-id">
                {booking.bookingId}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-warm-cream/60">Attendee</dt>
              <dd className="font-bold text-warm-cream">{booking.attendeeName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-warm-cream/60">Pass</dt>
              <dd className="font-bold text-warm-cream">{booking.passType}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-warm-cream/60">Quantity</dt>
              <dd className="font-bold text-warm-cream">{booking.quantity}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-warm-cream/60">Payment</dt>
              <dd className="font-bold text-emerald-300">{booking.paymentStatus}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-warm-cream/60">Booking status</dt>
              <dd className="font-bold text-emerald-300">{booking.bookingStatus}</dd>
            </div>
          </dl>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              id="confirm-entry-btn"
              type="button"
              onClick={handleConfirmEntry}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-vermilion to-amber-glow text-warm-cream font-display text-xl tracking-wider uppercase border border-antique-gold/70"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Confirm entry</span>
            </button>
            <button
              id="cancel-entry-btn"
              type="button"
              onClick={handleScanNext}
              className="px-6 py-4 rounded-xl bg-deep-plum border border-antique-gold/40 text-warm-cream font-body font-bold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* CONFIRMED */}
      {state === 'CONFIRMED' && booking && (
        <div
          id="verify-result"
          data-result="CONFIRMED"
          className="max-w-md mx-auto p-5 rounded-2xl bg-emerald-900/40 border-2 border-emerald-400/70 space-y-4"
        >
          <div className="flex items-center gap-2 font-display text-2xl tracking-wider text-emerald-300 uppercase">
            <CheckCircle2 className="w-6 h-6" />
            <span>Entry confirmed</span>
          </div>

          <dl className="text-sm font-body space-y-2">
            <div className="flex justify-between">
              <dt className="text-warm-cream/60">Booking ID</dt>
              <dd className="font-bold text-warm-cream">{booking.bookingId}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-warm-cream/60">Pass</dt>
              <dd className="font-bold text-warm-cream">{booking.passType}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-warm-cream/60">Entry time</dt>
              <dd className="font-bold text-warm-cream" id="confirmed-entry-time">
                {booking.checkedInAt ? new Date(booking.checkedInAt).toLocaleString('en-IN') : '—'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-warm-cream/60">Scanned by</dt>
              <dd className="font-bold text-warm-cream" id="confirmed-scanned-by">
                {booking.scannedBy || '—'}
              </dd>
            </div>
          </dl>
        </div>
      )}

      {/* REJECTED */}
      {state === 'REJECTED' && (
        <div
          id="verify-result"
          data-result="REJECTED"
          data-reason={reason || 'UNKNOWN'}
          className="max-w-md mx-auto p-5 rounded-2xl bg-vermilion/20 border-2 border-vermilion/60 space-y-4"
        >
          <div className="flex items-center gap-2 font-display text-2xl tracking-wider text-vermilion uppercase">
            <XCircle className="w-6 h-6" />
            <span id="scan-reason">{REASON_TEXT[reason || 'UNKNOWN'] || REASON_TEXT.UNKNOWN}</span>
          </div>

          {booking && (
            <dl className="text-sm font-body space-y-2">
              <div className="flex justify-between">
                <dt className="text-warm-cream/60">Booking ID</dt>
                <dd className="font-bold text-warm-cream">{booking.bookingId}</dd>
              </div>
              {booking.entryStatus === 'CHECKED_IN' && (
                <>
                  <div className="flex justify-between">
                    <dt className="text-warm-cream/60">Entry time</dt>
                    <dd className="font-bold text-warm-cream">
                      {booking.checkedInAt ? new Date(booking.checkedInAt).toLocaleString('en-IN') : '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-warm-cream/60">Scanned by</dt>
                    <dd className="font-bold text-warm-cream">{booking.scannedBy || '—'}</dd>
                  </div>
                </>
              )}
            </dl>
          )}
        </div>
      )}

      {/* Scan next pass — large, detached from the pass details, anchored to the
          bottom of the screen so it stays thumb-reachable at the gate. */}
      {(state === 'CONFIRMED' || state === 'REJECTED') && (
        <div
          id="scan-next-bar"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-antique-gold/40 bg-deep-plum/95 px-4 pt-4 backdrop-blur"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
          <div className="max-w-md mx-auto">
            <button
              id="scan-next-btn"
              type="button"
              onClick={handleScanNext}
              className="w-full inline-flex items-center justify-center gap-3 py-5 rounded-2xl bg-gradient-to-r from-vermilion to-amber-glow text-warm-cream font-display text-2xl tracking-wider uppercase border-2 border-antique-gold/70 shadow-[0_4px_24px_rgba(217,37,36,0.45)]"
            >
              <Camera className="w-7 h-7" />
              <span>Scan next pass</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
