'use client';

import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

/**
 * MusicToggle - Isolated Leaf Client Component
 *
 * Owns only audio playback state and user click handlers.
 * Completely decoupled from Hero markup and SSR paint path.
 */
export default function MusicToggle({ className = '' }: { className?: string }) {
  const [isPlaying, setIsPlaying] = useState(false);

  const toggleMusic = () => {
    setIsPlaying((prev) => !prev);
  };

  return (
    <button
      type="button"
      onClick={toggleMusic}
      className={`inline-flex items-center justify-center p-2 rounded-full bg-deep-plum/80 border border-antique-gold/50 text-bright-gold hover:text-warm-cream hover:border-bright-gold transition-colors focus:outline-none focus:ring-2 focus:ring-bright-gold cursor-pointer ${className}`}
      aria-label={isPlaying ? 'Mute ambient festival music' : 'Play ambient festival music'}
      title={isPlaying ? 'Mute music' : 'Play music'}
    >
      {isPlaying ? (
        <Volume2 className="w-4 h-4 text-bright-gold animate-pulse" />
      ) : (
        <VolumeX className="w-4 h-4 text-warm-cream/70" />
      )}
    </button>
  );
}
