import type Lenis from 'lenis';

/**
 * Typed access to the shared Lenis instance parked on `window.lenis` by
 * SmoothScroll. The `lenis` package declares `window.lenis` with its own
 * metadata shape, so the instance has to be read/written through a narrow
 * local cast instead of the ambient declaration.
 */
interface LenisGlobal {
  lenis?: Lenis;
}

export function getLenisInstance(): Lenis | null {
  if (typeof window === 'undefined') return null;
  return (window as unknown as LenisGlobal).lenis ?? null;
}

export function setLenisInstance(instance: Lenis): void {
  if (typeof window === 'undefined') return;
  (window as unknown as LenisGlobal).lenis = instance;
}
