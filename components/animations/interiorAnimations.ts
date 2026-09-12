import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Check if user prefers reduced motion
 */
export function isReducedMotion(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * PageHero Intro Entrance Animation
 *
 * Sequence:
 * 1. Decorative gold divider lines draw from center
 * 2. Dandiya sticks badge flourishes
 * 3. Eyebrow badge enters (opacity 0 -> 1, y: 18px -> 0)
 * 4. Main display title rises (opacity 0 -> 1, y: 36px -> 0)
 * 5. Narrative subtitle follows (opacity 0 -> 1, y: 20px -> 0)
 * 6. Badge / metadata pill settles (opacity 0 -> 1, y: 15px -> 0)
 */
export interface PageHeroElements {
  container: HTMLElement | null;
  eyebrow: HTMLElement | null;
  title: HTMLElement | null;
  subtitle: HTMLElement | null;
  dividerLines: (HTMLElement | null)[];
  sticksIcon: HTMLElement | null;
  badge?: HTMLElement | null;
}

export function animatePageHero(elements: PageHeroElements): () => void {
  if (typeof window === 'undefined' || !elements.container) {
    return () => {};
  }

  const { container, eyebrow, title, subtitle, dividerLines, sticksIcon, badge } = elements;

  // Immediate fallback for reduced-motion
  if (isReducedMotion()) {
    const all = [eyebrow, title, subtitle, sticksIcon, badge, ...dividerLines].filter(Boolean) as HTMLElement[];
    gsap.set(all, { opacity: 1, y: 0, x: 0, scale: 1, scaleX: 1 });
    return () => {};
  }

  const ctx = gsap.context(() => {
    // Initial states
    const validLines = dividerLines.filter(Boolean) as HTMLElement[];
    if (validLines.length > 0) {
      gsap.set(validLines, { scaleX: 0, transformOrigin: 'center center' });
    }
    if (sticksIcon) gsap.set(sticksIcon, { opacity: 0, scale: 0.8 });
    if (eyebrow) gsap.set(eyebrow, { opacity: 0, y: 18 });
    if (title) gsap.set(title, { opacity: 0, y: 36 });
    if (subtitle) gsap.set(subtitle, { opacity: 0, y: 20 });
    if (badge) gsap.set(badge, { opacity: 0, y: 15 });

    const tl = gsap.timeline({
      delay: 0.08,
      defaults: { ease: 'power2.out' },
    });

    // 1. Line draws + Dandiya sticks
    if (validLines.length > 0) {
      tl.to(validLines, {
        scaleX: 1,
        duration: 0.65,
        ease: 'power2.inOut',
      }, 0);
    }
    if (sticksIcon) {
      tl.to(sticksIcon, {
        opacity: 1,
        scale: 1,
        duration: 0.5,
      }, 0.1);
    }

    // 2. Eyebrow badge enters
    if (eyebrow) {
      tl.to(eyebrow, {
        opacity: 1,
        y: 0,
        duration: 0.6,
      }, 0.15);
    }

    // 3. Main title rises with regal weight
    if (title) {
      tl.to(title, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
      }, 0.28);
    }

    // 4. Subtitle follows
    if (subtitle) {
      tl.to(subtitle, {
        opacity: 1,
        y: 0,
        duration: 0.65,
      }, 0.42);
    }

    // 5. Badge settles
    if (badge) {
      tl.to(badge, {
        opacity: 1,
        y: 0,
        duration: 0.5,
      }, 0.52);
    }
  }, container);

  return () => ctx.revert();
}

/**
 * Image vertical parallax within a masked boundary
 * Maximum subtle movement: 4% - 6%
 */
export function createSubtleParallax(
  image: HTMLElement | null,
  trigger: HTMLElement | null,
  movementPercent = 6
): () => void {
  if (typeof window === 'undefined' || !image || !trigger) return () => {};
  if (isReducedMotion()) return () => {};

  const isMobile = window.innerWidth < 768;
  const movement = isMobile ? movementPercent * 0.5 : movementPercent;

  const ctx = gsap.context(() => {
    gsap.fromTo(
      image,
      { yPercent: -movement },
      {
        yPercent: movement,
        ease: 'none',
        scrollTrigger: {
          trigger,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.2,
        },
      }
    );
  }, trigger);

  return () => ctx.revert();
}

/**
 * Gold keyline / border line drawing animation
 */
export function createLineDraw(
  line: HTMLElement | null,
  trigger: HTMLElement | null,
  origin: 'left' | 'center' | 'right' = 'center'
): () => void {
  if (typeof window === 'undefined' || !line || !trigger) return () => {};
  if (isReducedMotion()) {
    gsap.set(line, { scaleX: 1 });
    return () => {};
  }

  const origins = {
    left: 'left center',
    center: 'center center',
    right: 'right center',
  };

  const ctx = gsap.context(() => {
    gsap.fromTo(
      line,
      { scaleX: 0, transformOrigin: origins[origin] },
      {
        scaleX: 1,
        duration: 0.75,
        ease: 'power2.inOut',
        scrollTrigger: {
          trigger,
          start: 'top 88%',
          once: true,
        },
      }
    );
  }, trigger);

  return () => ctx.revert();
}
