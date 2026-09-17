'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Mandala from '@/components/decorations/Mandala';
import DandiyaSticks from '@/components/decorations/DandiyaSticks';
import { eventData } from '@/data/eventData';
import {
  Home,
  Ticket,
  Search,
  ArrowLeft,
  HelpCircle,
  ShieldCheck,
  Phone,
  Sparkles,
  Info,
  Utensils,
  ChevronRight,
  MessageCircle,
} from 'lucide-react';

const popularDestinations = [
  {
    title: 'Festival Overview & Highlights',
    description: 'Explore live orchestral Garba, devotional Maa Durga aura, DJ line-up & celebration details.',
    href: '/about',
    icon: Sparkles,
    badge: 'ABOUT EVENT',
  },
  {
    title: 'Services & Attractions',
    description: 'Royal food court, VIP lounges, professional security, family amenities & parking setup.',
    href: '/services',
    icon: Utensils,
    badge: 'EXPERIENCE',
  },
  {
    title: 'Pass Pricing & Categories',
    description: 'Single, Couple, and Group passes with transparent tier breakdowns and benefits.',
    href: '/pricing',
    icon: Ticket,
    badge: 'TICKETING',
  },
  {
    title: 'Find & Recover Your Pass',
    description: 'Retrieve confirmed booking receipts, print QR entry passes or complete pending holds.',
    href: '/find-pass',
    icon: Search,
    badge: 'PASS DESK',
  },
  {
    title: 'Frequently Asked Questions',
    description: 'Dress code, timings, entry rules, gate policies, food arrangements & venue directions.',
    href: '/faq',
    icon: HelpCircle,
    badge: 'HELP DESK',
  },
  {
    title: 'Policies & Terms',
    description: 'Official terms & conditions, cancellation & refund rules, and entry verification guidelines.',
    href: '/policies',
    icon: ShieldCheck,
    badge: 'COMPLIANCE',
  },
];

export default function NotFound() {
  const primaryPhone = eventData.business?.phone?.replace(/\D/g, '') || '919931503960';
  const displayPhone = eventData.business?.phone || '+91 9931503960';
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${primaryPhone}&text=${encodeURIComponent(
    'Hello Event Point team, I encountered an invalid link on the Raas Utsav website and need assistance.'
  )}`;

  return (
    <main className="relative min-h-screen bg-deep-plum text-warm-cream selection:bg-vermilion selection:text-warm-cream overflow-x-clip flex flex-col justify-between">
      {/* Universal Masthead */}
      <Navbar />

      {/* Main 404 Experience Stage */}
      <div className="relative z-10 flex-1 pt-28 pb-16 sm:pt-36 sm:pb-24 px-4 sm:px-6 lg:px-8">
        {/* Ambient Atmosphere Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[600px] h-[340px] sm:h-[600px] rounded-full bg-[radial-gradient(circle,_rgba(217,37,36,0.22)_0%,_rgba(243,198,76,0.12)_45%,_transparent_70%)] blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] sm:w-[500px] h-[280px] sm:h-[500px] pointer-events-none opacity-15 overflow-hidden flex items-center justify-center">
          <Mandala className="w-full h-full text-bright-gold animate-spin-slower" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-royal-maroon/90 border border-antique-gold/50 text-bright-gold font-body text-xs md:text-sm font-semibold tracking-wider uppercase shadow-lg">
            <span className="text-vermilion text-xs" aria-hidden="true">♦</span>
            <span>404 ERROR</span>
            <span className="text-antique-gold/40">♦</span>
            <span className="text-warm-cream">PAGE NOT FOUND</span>
          </div>

          {/* Bold 404 Headline */}
          <div className="space-y-2">
            <div className="relative inline-block">
              <span className="font-display text-8xl sm:text-9xl md:text-[11rem] leading-none font-bold bg-gradient-to-b from-bright-gold via-amber-glow to-vermilion bg-clip-text text-transparent drop-shadow-[0_8px_32px_rgba(217,37,36,0.5)] select-none">
                404
              </span>
              <div className="absolute -bottom-2 sm:-bottom-4 left-1/2 -translate-x-1/2 w-32 sm:w-48 h-1 bg-gradient-to-r from-transparent via-bright-gold to-transparent" />
            </div>

            <h1 className="font-display text-3xl sm:text-5xl md:text-6xl text-white font-bold tracking-wide uppercase mt-4 drop-shadow-md">
              THIS STEP WENT OFF-BEAT
            </h1>

            <p className="font-body text-sm sm:text-base md:text-lg text-warm-cream/80 max-w-2xl mx-auto leading-relaxed pt-2">
              The page or link you are looking for has moved, expired, or does not exist.
              Don&apos;t worry — the music is still playing and Jharkhand&apos;s Grandest Dandiya Celebration is right around the corner!
            </p>
          </div>

          {/* Dandiya Sticks Flourish */}
          <div className="flex items-center justify-center gap-3 w-full max-w-xs mx-auto opacity-80 py-1">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-antique-gold to-transparent" aria-hidden="true" />
            <DandiyaSticks size={26} className="text-bright-gold" />
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-antique-gold to-transparent" aria-hidden="true" />
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-vermilion via-amber-glow to-vermilion text-warm-cream font-display text-base sm:text-lg tracking-wider uppercase border border-antique-gold/70 shadow-[0_4px_20px_rgba(217,37,36,0.4)] transition-[transform,box-shadow] duration-200 hover:scale-[1.02] active:scale-[0.98] font-bold"
            >
              <Home className="w-5 h-5 text-warm-cream" />
              <span>RETURN TO HOME</span>
            </Link>

            <Link
              href="/booking"
              className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-royal-maroon/90 border-2 border-bright-gold/70 text-bright-gold font-display text-base sm:text-lg tracking-wider uppercase transition-[transform,background-color,border-color] duration-200 hover:bg-royal-maroon hover:border-bright-gold hover:text-white active:scale-[0.98] font-bold shadow-lg"
            >
              <Ticket className="w-5 h-5 text-bright-gold" />
              <span>BOOK YOUR PASS</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined' && window.history.length > 1) {
                  window.history.back();
                } else {
                  window.location.href = '/';
                }
              }}
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-card-surface/80 border border-antique-gold/40 text-warm-cream/90 font-body text-sm font-semibold tracking-wide transition-colors hover:text-bright-gold hover:border-bright-gold/70 active:scale-[0.98] cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Go Back</span>
            </button>
          </div>

          {/* Popular Destinations Directory */}
          <div className="pt-10 text-left">
            <div className="flex items-center justify-between border-b border-antique-gold/25 pb-3 mb-6">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-bright-gold" />
                <h2 className="font-display text-xl sm:text-2xl text-white tracking-wider uppercase">
                  EXPLORE RAAS UTSAV DESTINATIONS
                </h2>
              </div>
              <span className="text-xs font-body text-bright-gold/80 uppercase tracking-widest hidden sm:inline">
                OFFICIAL DIRECTORY
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {popularDestinations.map((dest) => {
                const IconComponent = dest.icon;
                return (
                  <Link
                    key={dest.href}
                    href={dest.href}
                    className="group relative p-5 rounded-2xl bg-card-surface/90 border border-antique-gold/30 hover:border-bright-gold/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-royal-maroon/40 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-royal-maroon text-[10px] font-bold text-bright-gold tracking-wider uppercase border border-antique-gold/30">
                          {dest.badge}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-deep-plum border border-antique-gold/30 flex items-center justify-center text-bright-gold group-hover:text-amber-glow group-hover:border-bright-gold/60 transition-colors">
                          <IconComponent className="w-4 h-4" />
                        </div>
                      </div>
                      <h3 className="font-display text-lg text-warm-cream group-hover:text-bright-gold transition-colors tracking-wide">
                        {dest.title}
                      </h3>
                      <p className="font-body text-xs text-warm-cream/70 mt-1.5 leading-relaxed">
                        {dest.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-bright-gold font-semibold pt-4 mt-2 border-t border-antique-gold/15 group-hover:translate-x-0.5 transition-transform">
                      <span>Visit Page</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Need Direct Help Plaque */}
          <div className="pt-6">
            <div className="p-6 rounded-2xl bg-gradient-to-r from-royal-maroon/90 via-[#260B1C]/90 to-royal-maroon/90 border border-antique-gold/50 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <div className="space-y-1">
                <h4 className="font-display text-lg text-bright-gold tracking-wider uppercase">
                  LOOKING FOR A SPECIFIC BOOKING OR HAVE QUESTIONS?
                </h4>
                <p className="font-body text-xs sm:text-sm text-warm-cream/80">
                  Our event coordinators are available 24/7 to help you locate passes, verify details, or resolve link issues.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2.5 shrink-0">
                <a
                  href={`tel:${primaryPhone}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-deep-plum border border-antique-gold/60 text-xs font-semibold text-warm-cream hover:text-bright-gold hover:border-bright-gold transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-bright-gold" />
                  <span>{displayPhone}</span>
                </a>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#25D366]/20 border border-[#25D366]/60 text-xs font-semibold text-white hover:bg-[#25D366]/30 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                  <span>WhatsApp Helpdesk</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Universal Footer */}
      <Footer />
    </main>
  );
}
