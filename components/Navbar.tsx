'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { eventData } from '@/data/eventData';
import { Menu, X, Ticket } from 'lucide-react';

/**
 * Navbar - Royal Indian Festival Architectural Masthead
 *
 * Implements a solid, opaque horizontal band:
 * - 100% Solid deep plum (#12080D) at all times (ZERO translucency, zero backdrop-filter/blur)
 * - 1px Antique-gold bottom border keyline reading as distinct site chrome
 * - Zone A (Left): Authentic client-derived Event Point insignia + "RAAS UTSAV 2026 · RANCHI"
 * - Zone B (Center): Editorial navigation links (HOME | ABOUT | SERVICES | CONTACT)
 * - Zone C (Right): Festival ticket campaign CTA ("BOOK YOUR PASS") with semantic ticket icon
 * - Mobile: Dedicated solid #12080D drawer with 44px+ touch targets and full keyboard accessibility
 */
export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Keyboard accessibility: Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Services', href: '/services' },
    { label: 'Contact', href: '/contact' },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const handleNavClick = (href: string) => {
    if (href === pathname || (href === '/' && pathname === '/')) {
      if (typeof window !== 'undefined') {
        const lenis = (window as any).lenis;
        if (lenis) {
          lenis.scrollTo(0, { immediate: false, duration: 0.8 });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    }
  };

  return (
    <header
      id="main-masthead"
      className={`fixed top-0 left-0 right-0 z-50 w-full bg-[#12080D] transition-[border-color,box-shadow] duration-200 ${
        isScrolled
          ? 'border-b border-antique-gold/45 shadow-[0_6px_28px_rgba(0,0,0,0.85)]'
          : 'border-b border-antique-gold/25 shadow-[0_2px_12px_rgba(0,0,0,0.5)]'
      }`}
    >
      <nav
        className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-[72px] lg:h-20 flex items-center justify-between"
        aria-label="Festival Navigation Masthead"
      >
        {/* ============================================================== */}
        {/* Zone A (Left): Authoritative Event Point Brand Mark            */}
        {/* ============================================================== */}
        <Link
          href="/"
          onClick={() => handleNavClick('/')}
          className="group flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-bright-gold rounded-lg py-1 select-none shrink-0"
          aria-label="Event Point — Home"
        >
          {/* Authoritative Client Brand Asset (Emblem + Wordmark + Tagline) */}
          <div className="relative h-8 sm:h-9 md:h-10 lg:h-12 w-[169px] sm:w-[190px] md:w-[211px] lg:w-[254px] shrink-0 transition-transform duration-200 group-hover:scale-[1.02]">
            <Image
              src="/images/client/raascdr/web/eventpoint-navbrand.webp"
              alt="Event Point — A Shop for complete Event Solution"
              fill
              sizes="(max-width: 640px) 169px, (max-width: 768px) 190px, (max-width: 1024px) 211px, 254px"
              className="object-contain object-left"
              priority
            />
          </div>
        </Link>

        {/* ============================================================== */}
        {/* Zone B (Center): Refined Editorial Navigation Links             */}
        {/* ============================================================== */}
        <div className="hidden md:flex items-center gap-2.5 lg:gap-6 xl:gap-8 text-[11px] lg:text-xs font-body font-semibold tracking-[0.08em] lg:tracking-[0.1em] uppercase">
          {navLinks.map((link, idx) => {
            const active = isActive(link.href);
            return (
              <React.Fragment key={link.href}>
                {idx > 0 && (
                  <span className="text-antique-gold/35 text-[8px]" aria-hidden="true">
                    ♦
                  </span>
                )}
                <Link
                  href={link.href}
                  onClick={() => handleNavClick(link.href)}
                  className={`relative py-1.5 px-1.5 lg:px-2 transition-colors flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-bright-gold rounded-sm ${
                    active
                      ? 'text-bright-gold font-bold'
                      : 'text-warm-cream/80 hover:text-bright-gold'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <span>{link.label}</span>
                  {active && (
                    <span
                      className="absolute -bottom-0.5 left-1.5 right-1.5 lg:left-2 lg:right-2 h-[2px] bg-gradient-to-r from-transparent via-bright-gold to-transparent rounded-full"
                      aria-hidden="true"
                    />
                  )}
                </Link>
              </React.Fragment>
            );
          })}
        </div>

        {/* ============================================================== */}
        {/* Zone C (Right): Festival Ticket Campaign Action Button         */}
        {/* ============================================================== */}
        <div className="hidden md:flex items-center gap-3 lg:gap-4 shrink-0">
          <Link
            href="/booking"
            id="navbar-booking-cta"
            onClick={() => handleNavClick('/booking')}
            className="group relative inline-flex items-center justify-center gap-1.5 lg:gap-2 px-3.5 py-1.5 lg:px-5 lg:py-2.5 min-h-[40px] lg:min-h-[44px] rounded-md bg-gradient-to-r from-vermilion via-amber-glow to-vermilion bg-[length:200%_auto] text-warm-cream font-display text-xs lg:text-base tracking-wider uppercase border border-antique-gold/80 shadow-[0_2px_14px_rgba(217,37,36,0.4)] transition-[border-color,box-shadow,background-position,color] duration-300 hover:border-bright-gold hover:shadow-[0_4px_20px_rgba(255,148,41,0.55)] hover:bg-right focus:outline-none focus-visible:ring-2 focus-visible:ring-bright-gold cursor-pointer"
            aria-label="Book festival pass for Raas Utsav 2026"
          >
            <Ticket className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-bright-gold transition-colors group-hover:text-warm-cream shrink-0" aria-hidden="true" />
            <span className="font-bold whitespace-nowrap">{eventData.ctas.primary}</span>
          </Link>
        </div>

        {/* ============================================================== */}
        {/* Mobile Menu Toggle Button                                      */}
        {/* ============================================================== */}
        <div className="flex md:hidden">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-warm-cream hover:text-bright-gold hover:bg-royal-maroon/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-bright-gold cursor-pointer transition-colors"
            aria-expanded={isOpen}
            aria-controls="mobile-navbar-drawer"
            aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {isOpen ? <X className="w-6 h-6 text-bright-gold" /> : <Menu className="w-6 h-6 text-bright-gold" />}
          </button>
        </div>
      </nav>

      {/* ================================================================ */}
      {/* Mobile Drawer Menu (Solid Deep Plum, zero blur, fully accessible) */}
      {/* ================================================================ */}
      {isOpen && (
        <div
          id="mobile-navbar-drawer"
          className="md:hidden bg-[#12080D] border-b-2 border-antique-gold/40 px-6 py-6 flex flex-col gap-2 text-center shadow-2xl animate-in fade-in duration-150"
        >
          {/* Authoritative Event Point Brand Header */}
          <div className="flex items-center justify-center mb-3 pb-3 border-b border-antique-gold/20">
            <div className="relative h-10 w-[212px]">
              <Image
                src="/images/client/raascdr/web/eventpoint-navbrand.webp"
                alt="Event Point — A Shop for complete Event Solution"
                fill
                sizes="212px"
                className="object-contain"
              />
            </div>
          </div>

          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => {
                  setIsOpen(false);
                  handleNavClick(link.href);
                }}
                className={`font-display text-xl tracking-wide py-3 min-h-[44px] flex items-center justify-center gap-2 border-b border-antique-gold/15 transition-colors ${
                  active ? 'text-bright-gold font-bold bg-royal-maroon/30' : 'text-warm-cream hover:text-bright-gold'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                {active && <span className="text-bright-gold text-xs">♦</span>}
                <span>{link.label}</span>
                {active && <span className="text-bright-gold text-xs">♦</span>}
              </Link>
            );
          })}

          <Link
            href="/booking"
            onClick={() => {
              setIsOpen(false);
              handleNavClick('/booking');
            }}
            className="mt-3 w-full py-3.5 min-h-[48px] rounded-md bg-gradient-to-r from-vermilion via-amber-glow to-vermilion text-warm-cream font-display text-base tracking-wider uppercase border border-antique-gold/80 shadow-lg flex items-center justify-center gap-2 font-bold cursor-pointer"
          >
            <Ticket className="w-5 h-5 text-bright-gold shrink-0" />
            <span>{eventData.ctas.primary}</span>
          </Link>
        </div>
      )}
    </header>
  );
}
