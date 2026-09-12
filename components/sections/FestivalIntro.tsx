'use client';

import React from 'react';
import Link from 'next/link';
import { eventData } from '@/data/eventData';
import DandiyaSticks from '../decorations/DandiyaSticks';
import FolkBorder from '../decorations/FolkBorder';
import EventImage from '../ui/EventImage';
import CurtainReveal from '../ui/CurtainReveal';
import { Music, Users, Heart, Calendar, Clock, MapPin, ArrowRight, Ticket } from 'lucide-react';

export default function FestivalIntro() {
  return (
    <section
      id="festival-intro"
      className="relative z-40 w-full bg-deep-plum py-20 md:py-28 px-4 sm:px-6 lg:px-8 border-t-2 border-antique-gold/30"
      aria-label="Festival Introduction & Highlights"
    >
      <div className="max-w-6xl mx-auto">
        {/* Decorative Section Header with Dandiya Sticks */}
        <div className="flex flex-col items-center text-center mb-16">
          <div className="flex items-center justify-center mb-4">
            <DandiyaSticks size={80} className="text-bright-gold" />
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-royal-maroon/70 border border-antique-gold/40 text-bright-gold font-body text-xs uppercase tracking-widest mb-3">
            <span className="text-vermilion text-xs">✦</span>
            <span>JHARKHAND&apos;S GRANDEST DANDIYA NIGHT</span>
          </div>

          <h2 className="font-display text-4xl sm:text-6xl md:text-7xl text-warm-cream tracking-wide mb-4 uppercase">
            A NIGHT OF <span className="text-vermilion">DEVOTION</span> & <span className="text-bright-gold">RAAS</span>
          </h2>

          <p className="font-body text-base md:text-xl text-warm-cream/85 max-w-2xl mx-auto leading-relaxed">
            {eventData.heroSupportingText}
          </p>

          <div className="w-48 mt-6 mb-12 opacity-80">
            <FolkBorder />
          </div>

          {/* Grand Atmospheric Festival Crowd Image: Theatrical Curtain Reveal */}
          <div className="w-full max-w-5xl mx-auto mb-20">
            <CurtainReveal
              src={eventData.gallery.crowdCelebration.src}
              alt={eventData.gallery.crowdCelebration.alt}
              caption={eventData.gallery.crowdCelebration.caption}
              badge={eventData.gallery.crowdCelebration.badge}
              aspectRatio="16/9"
              priority={true}
            />
          </div>
        </div>

        {/* 3 Core Experience Highlights with Supporting Photography */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-16">
          {/* Highlight 1: Live Folk Percussion */}
          <div className="rounded-2xl bg-royal-maroon/40 border border-antique-gold/30 backdrop-blur-xs flex flex-col justify-between overflow-hidden transition-transform hover:-translate-y-1 hover:border-bright-gold">
            <div className="p-2 pb-0">
              <EventImage
                src={eventData.gallery.liveDholMaster.src}
                alt={eventData.gallery.liveDholMaster.alt}
                aspectRatio="4/3"
                className="rounded-xl border-none"
              />
            </div>
            <div className="p-6 text-center flex flex-col flex-1 justify-between">
              <h3 className="font-display text-2xl text-bright-gold tracking-wide mb-2 uppercase">
                LIVE DHOL & PERCUSSION
              </h3>
              <p className="font-body text-xs sm:text-sm text-warm-cream/75 leading-relaxed mb-3 flex-1 flex items-center justify-center">
                Electrifying master percussion ensembles driving thunderous heartbeat Garba rhythms across the open-air festival lawns.
              </p>
              <div className="inline-flex items-center justify-center gap-1.5 text-xs text-vermilion font-semibold uppercase tracking-wider font-body mt-auto">
                <Music className="w-3.5 h-3.5" />
                <span>Rhythm & Dhol</span>
              </div>
            </div>
          </div>

          {/* Highlight 2: Dandiya & Raas */}
          <div className="rounded-2xl bg-royal-maroon/40 border border-antique-gold/30 backdrop-blur-xs flex flex-col justify-between overflow-hidden transition-transform hover:-translate-y-1 hover:border-bright-gold">
            <div className="p-2 pb-0">
              <EventImage
                src={eventData.gallery.dandiyaAction.src}
                alt={eventData.gallery.dandiyaAction.alt}
                aspectRatio="4/3"
                className="rounded-xl border-none"
              />
            </div>
            <div className="p-6 text-center flex flex-col flex-1 justify-between">
              <h3 className="font-display text-2xl text-bright-gold tracking-wide mb-2 uppercase">
                DANDIYA & MAA DURGA AARTI
              </h3>
              <p className="font-body text-xs sm:text-sm text-warm-cream/75 leading-relaxed mb-3 flex-1 flex items-center justify-center">
                Step into concentric synchronized Garba circles and experience the grand ceremonial Maha Aarti honoring Goddess Durga.
              </p>
              <div className="inline-flex items-center justify-center gap-1.5 text-xs text-bright-gold font-semibold uppercase tracking-wider font-body mt-auto">
                <Users className="w-3.5 h-3.5" />
                <span>Synchronised Circles</span>
              </div>
            </div>
          </div>

          {/* Highlight 3: Heritage Atmosphere */}
          <div className="rounded-2xl bg-royal-maroon/40 border border-antique-gold/30 backdrop-blur-xs flex flex-col justify-between overflow-hidden transition-transform hover:-translate-y-1 hover:border-bright-gold">
            <div className="p-2 pb-0">
              <EventImage
                src={eventData.gallery.garbaDancers.src}
                alt={eventData.gallery.garbaDancers.alt}
                aspectRatio="4/3"
                className="rounded-xl border-none"
              />
            </div>
            <div className="p-6 text-center flex flex-col flex-1 justify-between">
              <h3 className="font-display text-2xl text-bright-gold tracking-wide mb-2 uppercase">
                HERITAGE AMBIENCE & FOOD
              </h3>
              <p className="font-body text-xs sm:text-sm text-warm-cream/75 leading-relaxed mb-3 flex-1 flex items-center justify-center">
                Vibrant traditional attire, artisanal food zone, and royal heritage hospitality at the iconic Chanakya BNR Hotel.
              </p>
              <div className="inline-flex items-center justify-center gap-1.5 text-xs text-amber-glow font-semibold uppercase tracking-wider font-body mt-auto">
                <Heart className="w-3.5 h-3.5" />
                <span>Joy & Tradition</span>
              </div>
            </div>
          </div>
        </div>

        {/* Event Snapshot Placard */}
        <div id="snapshot" className="mb-16 p-8 sm:p-10 rounded-2xl bg-royal-maroon/60 border-2 border-antique-gold/40 max-w-4xl mx-auto shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-vermilion/15 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
            <div className="flex-1">
              <span className="font-body text-xs text-bright-gold uppercase tracking-[0.25em] font-bold block mb-1">
                FESTIVAL SNAPSHOT
              </span>
              <h3 className="font-display text-3xl sm:text-4xl text-warm-cream tracking-wide mb-3 uppercase">
                EXPERIENCE RAAS UTSAV 2026
              </h3>
              <p className="font-body text-sm text-warm-cream/80 max-w-md">
                One unforgettable evening of devotion, dance, and cultural fusion in the heart of Ranchi. Secure your festival pass now.
              </p>

              {/* Logistics Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-antique-gold/25 font-body text-xs">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-vermilion shrink-0" />
                  <div>
                    <span className="text-bright-gold font-bold block">DATE</span>
                    <span className="text-warm-cream/90">{eventData.dateDisplay}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-glow shrink-0" />
                  <div>
                    <span className="text-bright-gold font-bold block">TIME</span>
                    <span className="text-warm-cream/90">{eventData.timeDisplay}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-bright-gold shrink-0" />
                  <div>
                    <span className="text-bright-gold font-bold block">VENUE</span>
                    <span className="text-warm-cream/90">{eventData.venueDisplay}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0 w-full sm:w-auto">
              <Link
                href="/booking"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg bg-gradient-to-r from-vermilion to-amber-glow text-warm-cream font-display text-lg tracking-wider uppercase border border-antique-gold/70 shadow-lg transition-transform hover:scale-105 active:scale-95 font-bold"
              >
                <Ticket className="w-4 h-4 text-bright-gold" />
                <span>{eventData.ctas.primary}</span>
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-deep-plum/90 hover:bg-deep-plum text-warm-cream font-display text-base tracking-wider uppercase border border-antique-gold/40 hover:border-bright-gold transition-colors"
              >
                <span>READ THE STORY</span>
                <ArrowRight className="w-4 h-4 text-bright-gold" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
