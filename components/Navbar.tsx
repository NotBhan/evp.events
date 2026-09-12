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
        className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-18 lg:h-20 flex items-center justify-between"
        aria-label="Festival Navigation Masthead"
      >
        {/* ============================================================== */}
        {/* Zone A (Left): Authentic Event Point & Raas Utsav Branding      */}
        {/* ============================================================== */}
        <Link
          href="/"
          onClick={() => handleNavClick('/')}
          className="group flex items-center gap-2.5 sm:gap-3.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-bright-gold rounded-lg py-1 pr-2 select-none shrink-0"
          aria-label="Raas Utsav 2026 — Home"
        >
          {/* Authentic Client-Derived Event Point Emblem (Extracted from RAASCDR) */}
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 shrink-0">
            <Image
              src="/images/client/raascdr/web/eventpoint-logo-nav.webp"
              alt="Event Point Official Insignia"
              fill
              sizes="36px"
              className="object-contain"
              priority
            />
          </div>

          {/* Thin Antique-Gold Vertical Keyline Rule */}
          <span className="hidden sm:block h-7 w-[1px] bg-antique-gold/35 shrink-0" aria-hidden="true" />

          {/* Authentic Festival Masthead Typography */}
          <div className="flex flex-col text-left leading-none">
            <div className="flex items-center gap-1.5">
              <span className="font-display text-lg sm:text-xl md:text-2xl text-warm-cream tracking-wide group-hover:text-bright-gold transition-colors">
                {eventData.eventName}
              </span>
              <span className="text-vermilion text-[10px] sm:text-xs" aria-hidden="true">♦</span>
            </div>
            <span className="font-body text-[9px] sm:text-[10px] text-antique-gold tracking-[0.22em] uppercase mt-1 font-semibold">
              {eventData.year} · RANCHI
            </span>
          </div>
        </Link>

        {/* ============================================================== */}
        {/* Zone B (Center): Refined Editorial Navigation Links             */}
        {/* ============================================================== */}
        <div className="hidden md:flex items-center gap-4 lg:gap-8 text-xs font-body font-semibold tracking-[0.18em] uppercase">
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
                  className={`relative py-1.5 px-2 transition-colors flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-bright-gold rounded-sm ${
                    active
                      ? 'text-bright-gold font-bold'
                      : 'text-warm-cream/80 hover:text-bright-gold'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <span>{link.label}</span>
                  {active && (
                    <span
                      className="absolute -bottom-0.5 left-2 right-2 h-[2px] bg-gradient-to-r from-transparent via-bright-gold to-transparent rounded-full"
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
        <div className="hidden md:flex items-center gap-4 shrink-0">
          <Link
            href="/booking"
            id="navbar-booking-cta"
            onClick={() => handleNavClick('/booking')}
            className="group relative inline-flex items-center justify-center gap-2 px-4 py-2 lg:px-5 lg:py-2.5 min-h-[44px] rounded-md bg-gradient-to-r from-vermilion via-amber-glow to-vermilion bg-[length:200%_auto] text-warm-cream font-display text-sm lg:text-base tracking-wider uppercase border border-antique-gold/80 shadow-[0_2px_14px_rgba(217,37,36,0.4)] transition-[border-color,box-shadow,background-position,color] duration-300 hover:border-bright-gold hover:shadow-[0_4px_20px_rgba(255,148,41,0.55)] hover:bg-right focus:outline-none focus-visible:ring-2 focus-visible:ring-bright-gold cursor-pointer"
            aria-label="Book festival pass for Raas Utsav 2026"
          >
            <Ticket className="w-4 h-4 text-bright-gold transition-colors group-hover:text-warm-cream shrink-0" aria-hidden="true" />
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
          {/* Authentic Organizer Provenance Line */}
          <div className="flex items-center justify-center gap-2 mb-2 pb-2 border-b border-antique-gold/20">
            <div className="relative w-5 h-5 shrink-0">
              <Image
                src="/images/client/raascdr/web/eventpoint-logo-nav.webp"
                alt="Event Point Logo"
                fill
                sizes="20px"
                className="object-contain"
              />
            </div>
            <span className="text-[10px] font-body text-antique-gold uppercase tracking-[0.2em] font-semibold">
              EVENT POINT PRESENTS
            </span>
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
