'use client';

import gsap from 'gsap';
import { type ReactNode, useEffect, useRef } from 'react';
import { usePreloaderStore } from '@/lib/store/preloader';

// Wraps the Act 1 banner content (wordmark + tagline + CTA) and animates it in
// from below + transparent once the Preloader has reported `loaded`. Uses public
// gsap only — no Club plugins required.
//
// Stagger across the three children gives a gentle cascade reveal:
//   h1 wordmark   → fades up first
//   p  tagline    → 100ms after
//   button CTA    → 100ms after
//
// Timing is gated on `loaded` rather than mount time so the animation runs only
// after the preloader's wipe-up exit, not behind the still-visible preloader.
// The 0.2s delay matches the spec — it leaves a beat between the wipe revealing
// the banner area and the copy materialising.
export function WordmarkReveal({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let triggered = false;
    const animate = () => {
      if (triggered || !ref.current) return;
      triggered = true;
      gsap.from(ref.current.children, {
        y: 30,
        opacity: 0,
        duration: 1.2,
        ease: 'power3.out',
        stagger: 0.1,
        delay: 0.2,
      });
    };

    if (usePreloaderStore.getState().loaded) {
      animate();
      return;
    }
    const unsub = usePreloaderStore.subscribe((s) => {
      if (s.loaded) animate();
    });
    return unsub;
  }, []);

  return (
    <div ref={ref} className="contents">
      {children}
    </div>
  );
}
