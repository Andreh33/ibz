'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { type ReactNode, useEffect, useRef } from 'react';
import { useDescentStore } from '@/lib/store/descent';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// Pinned section that drives Act 1. While pinned, vertical scroll is captured
// by ScrollTrigger and translated into act1Progress (0 → 1). Boeing.tsx and
// ScrollHint.tsx subscribe to that store. End at +=1500 gives ~1.5 viewport
// heights of scroll runway before the pin releases and Act 2 enters frame.
export function Act1Trigger({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const trigger = ScrollTrigger.create({
      trigger: el,
      pin: true,
      pinSpacing: true,
      start: 'top top',
      end: '+=1500',
      scrub: 1,
      anticipatePin: 1,
      onUpdate: (self) => {
        useDescentStore.getState().setAct1Progress(self.progress);
      },
    });

    return () => {
      trigger.kill();
      // Reset progress so re-mount in dev doesn't leave stale state
      useDescentStore.getState().setAct1Progress(0);
    };
  }, []);

  return (
    <section ref={ref} className="relative h-screen w-full overflow-hidden">
      {children}
    </section>
  );
}
