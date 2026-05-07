'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { type ReactNode, useEffect, useRef } from 'react';
import { useDescentStore } from '@/lib/store/descent';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// Pinned section driving Act 5 — Kitchen + dishes carousel + tortuga swim.
// Pin duration scales with the number of dishes (one viewport per dish gives
// each plate a comfortable reading window). 6 dishes ⇒ ~6 viewports of pin.
//
// Subscribers:
//   – Tortuga: x position lerps from off-screen-right → off-screen-left
//   – DishesTrack: translateX scrubs the horizontal track of plates
//   – sourcing/menu copy: fade-ins at specific progress thresholds
//
// CLAUDE.md §3 Act 5 keeps the user underwater for the entire act, so the
// SkyEnvironment + AnchorChain underwater tints set during Act 4 carry
// through unchanged here.
export function Act5Trigger({
  children,
  pinDistance = 4500,
}: {
  children: ReactNode;
  pinDistance?: number;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const trigger = ScrollTrigger.create({
      trigger: el,
      pin: true,
      pinSpacing: true,
      start: 'top top',
      end: `+=${pinDistance}`,
      scrub: 1,
      anticipatePin: 1,
      onUpdate: (self) => {
        useDescentStore.getState().setAct5Progress(self.progress);
      },
    });

    return () => {
      trigger.kill();
      useDescentStore.getState().setAct5Progress(0);
    };
  }, [pinDistance]);

  return (
    <section ref={ref} className="relative h-screen w-full overflow-hidden">
      {children}
    </section>
  );
}
