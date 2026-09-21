'use client';

import React, { useState, useEffect } from 'react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const EVENT_TARGET_TIMESTAMP = new Date('2026-10-16T17:00:00+05:30').getTime();

function calculateTimeLeft(): TimeLeft {
  const difference = EVENT_TARGET_TIMESTAMP - Date.now();
  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

/**
 * CountdownTimer - Isolated Leaf Client Component
 *
 * Owns only its own timer tick state and DOM subtree.
 * Updates strictly every second within its own container without triggering
 * re-renders of the parent Hero Server Component or surrounding DOM.
 */
export default function CountdownTimer({ className = '' }: { className?: string }) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!hasMounted) {
    // Return static SSR placeholder to prevent hydration mismatch while remaining visible
    return (
      <div
        className={`inline-flex items-center justify-center gap-2 sm:gap-3 py-1 px-3 sm:px-4 rounded-full bg-deep-plum/90 border border-antique-gold/40 text-warm-cream text-xs font-mono select-none ${className}`}
        aria-label="Event Countdown Timer"
      >
        <span className="text-antique-gold font-bold">FESTIVAL OPENS IN:</span>
        <span className="text-bright-gold font-bold">16 OCT 2026</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center gap-1.5 sm:gap-2.5 py-1 px-3 sm:px-4 rounded-full bg-deep-plum/90 border border-antique-gold/50 shadow-[0_2px_12px_rgba(0,0,0,0.6)] text-warm-cream select-none ${className}`}
      aria-label={`Festival countdown: ${timeLeft.days} days ${timeLeft.hours} hours ${timeLeft.minutes} minutes ${timeLeft.seconds} seconds remaining`}
    >
      <span className="text-vermilion text-[10px]">♦</span>
      <span className="text-antique-gold text-[10px] sm:text-xs font-avenir uppercase tracking-wider font-semibold">
        Starts In:
      </span>
      <div className="flex items-center gap-1 font-mono text-[11px] sm:text-xs font-bold text-bright-gold">
        <span>{String(timeLeft.days).padStart(2, '0')}d</span>
        <span className="text-antique-gold/60">:</span>
        <span>{String(timeLeft.hours).padStart(2, '0')}h</span>
        <span className="text-antique-gold/60">:</span>
        <span>{String(timeLeft.minutes).padStart(2, '0')}m</span>
        <span className="text-antique-gold/60">:</span>
        <span className="text-vermilion">{String(timeLeft.seconds).padStart(2, '0')}s</span>
      </div>
      <span className="text-vermilion text-[10px]">♦</span>
    </div>
  );
}
