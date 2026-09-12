import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export interface HeroAnimationRefs {
  heroContainer: HTMLElement;
  heroStage: HTMLElement;
  leftDancer: HTMLElement;
  rightDancer: HTMLElement;
  durgaAura: HTMLElement;
  leftDiya?: HTMLElement | null;
  rightDiya?: HTMLElement | null;
  leftPillar?: HTMLElement | null;
  rightPillar?: HTMLElement | null;
  topFrame?: HTMLElement | null;
  cornerMedallions?: (HTMLElement | null)[];
  foregroundSticks?: (HTMLElement | null)[];
  heroTitle: HTMLElement;
  heroCTA: HTMLElement;
}

export function initHeroScrollAnimation(refs: HeroAnimationRefs): () => void {
  const {
    heroContainer,
    leftDancer,
    rightDancer,
    durgaAura,
    leftDiya,
    rightDiya,
    leftPillar,
    rightPillar,
    topFrame,
    cornerMedallions = [],
    foregroundSticks = [],
    heroTitle,
    heroCTA,
  } = refs;

  const validCorners = cornerMedallions.filter(Boolean) as HTMLElement[];
  const validSticks = foregroundSticks.filter(Boolean) as HTMLElement[];
  const validDiyas = [leftDiya, rightDiya].filter(Boolean) as HTMLElement[];
  const validPillars = [leftPillar, rightPillar].filter(Boolean) as HTMLElement[];

  // Sub-layer elements inside DurgaAura (Chakri rotational mechanism)
  const outerChakriEl = durgaAura.querySelector('[data-chakri-outer], [data-mandala]') as HTMLElement | null;
  const innerChakriEl = durgaAura.querySelector('[data-chakri-inner], [data-halo]') as HTMLElement | null;
  const auraRaysEl = durgaAura.querySelector('[data-aura-rays]') as HTMLElement | null;
  const glowEl = durgaAura.querySelector('[data-glow]') as HTMLElement | null;
  const portraitEl = durgaAura.querySelector('[data-portrait]') as HTMLElement | null;

  const mm = gsap.matchMedia();

  // =========================================================================
  // 1. Reduced Motion: Completely static, accessible, unpinned poster layout
  // =========================================================================
  mm.add('(prefers-reduced-motion: reduce)', () => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    gsap.set([leftDancer, rightDancer], {
      y: isMobile ? '8vh' : 0,
      x: 0,
      opacity: 1,
      scale: isMobile ? 0.92 : 1,
      rotation: 0,
    });
    gsap.set(
      [
        durgaAura,
        heroTitle,
        heroCTA,
        ...validDiyas,
        ...validPillars,
        ...(topFrame ? [topFrame] : []),
        ...validCorners,
        ...validSticks,
      ],
      {
        opacity: 1,
      }
    );
    if (outerChakriEl) gsap.set(outerChakriEl, { rotation: 0, scale: 1 });
    if (innerChakriEl) gsap.set(innerChakriEl, { rotation: 0, scale: 1 });
    if (auraRaysEl) gsap.set(auraRaysEl, { rotation: 0, scale: 1 });
    if (glowEl) gsap.set(glowEl, { scale: 1.2, opacity: 0.85 });
    if (portraitEl) gsap.set(portraitEl, { scale: 1, y: 0 });
  });

  // =========================================================================
  // 2. Desktop Theatrical Choreography (>= 768px)
  // Continuous full-viewport occupancy across 200svh CSS-sticky scroll track
  // - High visual occupancy at open & peak
  // - Dynamic multi-ring chakri rotation
  // - Upward theatrical ascent (no compressed band, no empty void)
  // - True seamless handoff to Editorial Statement
  // =========================================================================
  mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
    // Initial Setup (Zero flash: Dancers start staged gracefully at stage wings)
    gsap.set(leftDancer, {
      y: '10vh',
      x: 0,
      scale: 0.98,
      opacity: 0.95,
      rotation: 0,
      transformOrigin: 'bottom center',
    });
    gsap.set(rightDancer, {
      y: '12vh',
      x: 0,
      scale: 0.98,
      opacity: 0.95,
      rotation: 0,
      transformOrigin: 'bottom center',
    });
    gsap.set(durgaAura, { y: 0, scale: 1, opacity: 1 });
    if (outerChakriEl) gsap.set(outerChakriEl, { rotation: 0, scale: 1, opacity: 0.9, transformOrigin: 'center center' });
    if (innerChakriEl) gsap.set(innerChakriEl, { rotation: 0, scale: 1, opacity: 0.9, transformOrigin: 'center center' });
    if (auraRaysEl) gsap.set(auraRaysEl, { rotation: 0, scale: 1, opacity: 0.7, transformOrigin: 'center center' });
    if (glowEl) gsap.set(glowEl, { scale: 1.2, opacity: 0.85 });
    if (portraitEl) gsap.set(portraitEl, { scale: 1, y: 0, opacity: 1 });

    gsap.set(heroTitle, { y: 0, opacity: 1, scale: 1 });
    gsap.set(heroCTA, { y: 0, opacity: 1 });

    if (topFrame) gsap.set(topFrame, { y: 0, opacity: 1 });
    if (validCorners.length) gsap.set(validCorners, { scale: 1, opacity: 1 });
    if (validDiyas.length) gsap.set(validDiyas, { y: 0, opacity: 1 });
    if (validPillars.length) gsap.set(validPillars, { opacity: 1, x: 0 });
    if (validSticks.length) gsap.set(validSticks, { y: 0, opacity: 0.85 });

    // Master GSAP Timeline tied to 200svh CSS-sticky scroll space
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: heroContainer,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
        invalidateOnRefresh: true,
      },
    });

    // -----------------------------------------------------------------
    // Phase 1 (0% -> 35% progress): Theatrical Rise & Full Engagement
    // Dancers rise into composition, chakri rings rotate and scale
    // -----------------------------------------------------------------
    tl.to(
      leftDancer,
      {
        y: '0vh',
        opacity: 1,
        scale: 1.03,
        ease: 'power1.out',
        duration: 0.35,
      },
      0
    )
      .to(
        rightDancer,
        {
          y: '0vh',
          opacity: 1,
          scale: 1.03,
          ease: 'power1.out',
          duration: 0.35,
        },
        0
      )
      .to(
        heroTitle,
        {
          y: '-1vh',
          scale: 1.02,
          ease: 'power1.out',
          duration: 0.35,
        },
        0
      );

    if (outerChakriEl) {
      tl.to(outerChakriEl, { rotation: 90, scale: 1.08, duration: 0.35, ease: 'none' }, 0);
    }
    if (innerChakriEl) {
      tl.to(innerChakriEl, { rotation: -70, scale: 1.08, duration: 0.35, ease: 'none' }, 0);
    }
    if (auraRaysEl) {
      tl.to(auraRaysEl, { rotation: 45, scale: 1.12, duration: 0.35, ease: 'none' }, 0);
    }
    if (glowEl) {
      tl.to(glowEl, { scale: 1.38, opacity: 1, duration: 0.35, ease: 'power1.out' }, 0);
    }
    if (portraitEl) {
      tl.to(portraitEl, { scale: 1.04, y: '-0.5vh', duration: 0.35, ease: 'power1.out' }, 0);
    }
    if (validDiyas.length) {
      tl.to(validDiyas, { y: '4px', duration: 0.35, ease: 'power1.out' }, 0);
    }

    // -----------------------------------------------------------------
    // Phase 2 (35% -> 55% progress): Peak Theatrical Poster Climax
    // Dancers strike full celebratory posture, Chakri reaches apex glory
    // -----------------------------------------------------------------
    tl.to(
      leftDancer,
      {
        y: '-2vh',
        rotation: -2,
        scale: 1.06,
        ease: 'sine.inOut',
        duration: 0.2,
      },
      0.35
    )
      .to(
        rightDancer,
        {
          y: '-2vh',
          rotation: 2,
          scale: 1.06,
          ease: 'sine.inOut',
          duration: 0.2,
        },
        0.35
      )
      .to(
        heroTitle,
        {
          y: '-3vh',
          scale: 1.04,
          opacity: 1,
          duration: 0.2,
          ease: 'sine.inOut',
        },
        0.35
      );

    if (outerChakriEl) {
      tl.to(outerChakriEl, { rotation: 180, scale: 1.14, opacity: 1, duration: 0.2, ease: 'none' }, 0.35);
    }
    if (innerChakriEl) {
      tl.to(innerChakriEl, { rotation: -140, scale: 1.14, opacity: 1, duration: 0.2, ease: 'none' }, 0.35);
    }
    if (auraRaysEl) {
      tl.to(auraRaysEl, { rotation: 90, scale: 1.2, opacity: 0.85, duration: 0.2, ease: 'none' }, 0.35);
    }
    if (glowEl) {
      tl.to(glowEl, { scale: 1.48, opacity: 1, duration: 0.2 }, 0.35);
    }
    if (portraitEl) {
      tl.to(portraitEl, { scale: 1.06, y: '-1vh', duration: 0.2 }, 0.35);
    }

    // -----------------------------------------------------------------
    // Phase 3 (55% -> 70% progress): Hero Disassembly & Settling
    // Dancers exit outward/upward to wings.
    // Durga & Chakri move upward and settle into final rest position.
    // Title settles upward with separate parallax.
    // Decorative frame, diyas, and pillars settle out.
    // By 70%, all expensive animated work finishes and holds its settled state!
    // -----------------------------------------------------------------
    tl.to(
      leftDancer,
      {
        x: '-18vw',
        y: '-24vh',
        rotation: -4,
        scale: 0.94,
        opacity: 0,
        ease: 'power1.in',
        duration: 0.15,
      },
      0.55
    )
      .to(
        rightDancer,
        {
          x: '18vw',
          y: '-24vh',
          rotation: 4,
          scale: 0.94,
          opacity: 0,
          ease: 'power1.in',
          duration: 0.15,
        },
        0.55
      )
      .to(
        durgaAura,
        {
          y: '-26vh',
          scale: 1.0,
          opacity: 0.85,
          ease: 'power1.inOut',
          duration: 0.15,
        },
        0.55
      )
      .to(
        heroTitle,
        {
          y: '-28vh',
          scale: 0.96,
          opacity: 0,
          ease: 'power1.in',
          duration: 0.15,
        },
        0.55
      )
      .to(
        heroCTA,
        {
          y: '-8vh',
          opacity: 0,
          ease: 'power1.out',
          duration: 0.12,
        },
        0.55
      );

    if (outerChakriEl) {
      tl.to(outerChakriEl, { rotation: 270, scale: 1.04, opacity: 0.85, duration: 0.15, ease: 'none' }, 0.55);
    }
    if (innerChakriEl) {
      tl.to(innerChakriEl, { rotation: -210, scale: 1.04, opacity: 0.85, duration: 0.15, ease: 'none' }, 0.55);
    }
    if (auraRaysEl) {
      tl.to(auraRaysEl, { rotation: 135, scale: 1.1, opacity: 0.7, duration: 0.15, ease: 'none' }, 0.55);
    }
    if (glowEl) {
      tl.to(glowEl, { scale: 1.25, opacity: 0.7, duration: 0.15 }, 0.55);
    }
    if (portraitEl) {
      tl.to(portraitEl, { scale: 1.0, y: '-1.5vh', duration: 0.15 }, 0.55);
    }
    if (validDiyas.length) {
      tl.to(validDiyas, { y: '-20px', opacity: 0, duration: 0.15 }, 0.55);
    }
    if (topFrame) {
      tl.to(topFrame, { y: '-25px', opacity: 0, duration: 0.15 }, 0.55);
    }
    if (validPillars.length) {
      tl.to(validPillars, { opacity: 0, duration: 0.15 }, 0.55);
    }
    if (validCorners.length) {
      tl.to(validCorners, { scale: 0.85, opacity: 0, duration: 0.15 }, 0.55);
    }

    // -----------------------------------------------------------------
    // Phase 4 (70% -> 100% progress): Hold Settled State
    // All expensive layers remain settled and stable at their 70% state.
    // Zero further tweens mutate transforms, rotations, or filters.
    // Editorial Statement cleanly takes over the visual frame.
    // -----------------------------------------------------------------
  });

  // =========================================================================
  // 3. Mobile Choreography (< 768px): Vertical adaptation, 0 horizontal drift
  // =========================================================================
  mm.add('(max-width: 767px) and (prefers-reduced-motion: no-preference)', () => {
    gsap.set(leftDancer, { y: '10vh', x: 0, scale: 0.92, opacity: 0.95 });
    gsap.set(rightDancer, { y: '12vh', x: 0, scale: 0.92, opacity: 0.95 });
    gsap.set(durgaAura, { y: 0, scale: 0.96, opacity: 1 });
    if (outerChakriEl) gsap.set(outerChakriEl, { rotation: 0, scale: 1 });
    if (innerChakriEl) gsap.set(innerChakriEl, { rotation: 0, scale: 1 });
    if (auraRaysEl) gsap.set(auraRaysEl, { rotation: 0, scale: 1 });
    gsap.set(heroTitle, { y: 0, opacity: 1 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: heroContainer,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.8,
        invalidateOnRefresh: true,
      },
    });

    // 0-35%: Rise into position
    tl.to(
      [leftDancer, rightDancer],
      {
        y: '0vh',
        opacity: 1,
        scale: 0.95,
        duration: 0.35,
        ease: 'power1.out',
      },
      0
    ).to(
      heroTitle,
      {
        y: '-1vh',
        duration: 0.35,
      },
      0
    );

    if (outerChakriEl) {
      tl.to(outerChakriEl, { rotation: 80, scale: 1.04, duration: 0.35, ease: 'none' }, 0);
    }
    if (innerChakriEl) {
      tl.to(innerChakriEl, { rotation: -65, scale: 1.04, duration: 0.35, ease: 'none' }, 0);
    }
    if (auraRaysEl) {
      tl.to(auraRaysEl, { rotation: 40, duration: 0.35, ease: 'none' }, 0);
    }

    // 35-55%: Celebratory peak
    tl.to(
      leftDancer,
      {
        y: '-1vh',
        rotation: -1,
        duration: 0.2,
        ease: 'sine.inOut',
      },
      0.35
    ).to(
      rightDancer,
      {
        y: '-1vh',
        rotation: 1,
        duration: 0.2,
        ease: 'sine.inOut',
      },
      0.35
    );

    if (outerChakriEl) {
      tl.to(outerChakriEl, { rotation: 160, duration: 0.2, ease: 'none' }, 0.35);
    }
    if (innerChakriEl) {
      tl.to(innerChakriEl, { rotation: -130, duration: 0.2, ease: 'none' }, 0.35);
    }
    if (auraRaysEl) {
      tl.to(auraRaysEl, { rotation: 80, duration: 0.2, ease: 'none' }, 0.35);
    }

    // -----------------------------------------------------------------
    // Phase 3 (55% -> 70% progress): Mobile Upward Disassembly & Settling
    // Dancers exit cleanly without horizontal overflow.
    // Durga & Chakri settle into upper viewport.
    // By 70%, all expensive animated work completes and holds its settled state!
    // -----------------------------------------------------------------
    tl.to(
      [leftDancer, rightDancer],
      {
        y: '-26vh',
        x: 0,
        opacity: 0,
        duration: 0.15,
        ease: 'power1.in',
      },
      0.55
    )
      .to(
        durgaAura,
        {
          y: '-24vh',
          opacity: 0.85,
          duration: 0.15,
          ease: 'power1.inOut',
        },
        0.55
      )
      .to(
        heroTitle,
        {
          y: '-26vh',
          opacity: 0,
          duration: 0.15,
          ease: 'power1.in',
        },
        0.55
      )
      .to(
        heroCTA,
        {
          y: '-8vh',
          opacity: 0,
          duration: 0.12,
          ease: 'power1.out',
        },
        0.55
      );

    if (outerChakriEl) {
      tl.to(outerChakriEl, { rotation: 240, duration: 0.15, ease: 'none' }, 0.55);
    }
    if (innerChakriEl) {
      tl.to(innerChakriEl, { rotation: -180, duration: 0.15, ease: 'none' }, 0.55);
    }

    // -----------------------------------------------------------------
    // Phase 4 (70% -> 100% progress): Hold Settled State
    // All layers remain stable at their 70% settled position. Zero further tweens.
    // Editorial Statement reveals cleanly on mobile without GPU contention.
    // -----------------------------------------------------------------
  });

  return () => {
    mm.revert();
  };
}
