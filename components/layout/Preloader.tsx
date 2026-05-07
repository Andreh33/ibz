'use client';

import { useEffect, useRef, useState } from 'react';
import { usePreloaderStore } from '@/lib/store/preloader';

const SETTLE_MS = 400;
const WIPE_MS = 800;
const MIN_DISPLAY_MS = 1000;

export function Preloader() {
  const progress = usePreloaderStore((s) => s.progress);
  const loaded = usePreloaderStore((s) => s.loaded);

  const mountedAt = useRef(Date.now());
  const [exiting, setExiting] = useState(false);
  const [unmount, setUnmount] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(m.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    m.addEventListener('change', onChange);
    return () => m.removeEventListener('change', onChange);
  }, []);

  // Hard fallback — if the 3D shell never reports progress (cached GLBs, WebGL failure,
  // user disabled JS for the canvas) the preloader still has to exit. After 3.5s force it.
  useEffect(() => {
    const t = setTimeout(() => {
      const s = usePreloaderStore.getState();
      if (!s.loaded) {
        s.setProgress(100);
        s.setLoaded(true);
      }
    }, 3500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!loaded || exiting) return;
    const elapsed = Date.now() - mountedAt.current;
    const settle = Math.max(SETTLE_MS, MIN_DISPLAY_MS - elapsed);
    const t1 = setTimeout(() => setExiting(true), settle);
    const t2 = setTimeout(() => setUnmount(true), settle + WIPE_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [loaded, exiting]);

  if (unmount) return null;

  const exitStyle = reducedMotion
    ? { opacity: exiting ? 0 : 1, transition: `opacity ${WIPE_MS}ms ease-out` }
    : {
        transform: exiting ? 'translateY(-100%)' : 'translateY(0)',
        transition: `transform ${WIPE_MS}ms ease-out`,
      };

  return (
    <div
      aria-busy={!loaded}
      aria-live="polite"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ivory will-change-transform"
      style={exitStyle}
    >
      <div className="flex w-full max-w-[60vw] flex-col items-center">
        <h1 className="font-display text-[8vw] font-light leading-none tracking-[-0.02em] text-deep">
          The Boat House
        </h1>
        <div className="mt-8 h-px w-full overflow-hidden bg-gold/15">
          <div
            className="h-full origin-left bg-gold transition-transform duration-200 ease-out"
            style={{ transform: `scaleX(${Math.min(progress, 100) / 100})` }}
          />
        </div>
        <p className="mt-4 font-mono text-[11px] uppercase tracking-widest text-sea/40 tabular-nums">
          {Math.round(progress)}%
        </p>
        <svg
          className={`mt-12 h-10 w-10 text-gold transition-opacity duration-500 ${
            progress >= 100 ? 'opacity-100' : 'opacity-0'
          }`}
          viewBox="0 0 32 40"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.8"
          strokeLinecap="round"
          aria-hidden
        >
          <circle cx="16" cy="6" r="2.5" />
          <line x1="16" y1="9" x2="16" y2="30" />
          <line x1="11" y1="13" x2="21" y2="13" />
          <path d="M5 28 Q5 34 11 35" />
          <path d="M27 28 Q27 34 21 35" />
        </svg>
      </div>
    </div>
  );
}
