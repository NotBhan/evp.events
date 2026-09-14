'use client';

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface BookingCountdownProps {
  expiresAt: string;
  onExpired?: () => void;
}

export default function BookingCountdown({
  expiresAt,
  onExpired,
}: BookingCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    isElapsed: boolean;
  }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isElapsed: false,
  });

  useEffect(() => {
    let triggered = false;

    const calculateTime = () => {
      const targetTime = new Date(expiresAt).getTime();
      const now = Date.now();
      const diffMs = targetTime - now;

      if (diffMs <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isElapsed: true });
        if (!triggered && onExpired) {
          triggered = true;
          onExpired();
        }
        return;
      }

      const totalSec = Math.floor(diffMs / 1000);
      const hours = Math.floor(totalSec / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      const seconds = totalSec % 60;

      setTimeLeft({ hours, minutes, seconds, isElapsed: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  if (timeLeft.isElapsed) {
    return (
      <span className="inline-flex items-center gap-1 text-vermilion font-mono text-xs font-bold uppercase tracking-wider">
        <Clock className="w-3.5 h-3.5" />
        <span>Reservation Window Elapsed</span>
      </span>
    );
  }

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-deep-plum/90 border border-antique-gold/40 text-bright-gold font-mono text-xs font-bold tracking-wider">
      <Clock className="w-3.5 h-3.5 text-amber-glow animate-pulse" />
      <span>{pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}</span>
      <span className="text-[10px] text-warm-cream/60 font-body uppercase font-normal">left to pay</span>
    </span>
  );
}
