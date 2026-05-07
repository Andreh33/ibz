'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { type ReactNode, useEffect, useRef } from 'react';
import { useDescentStore } from '@/lib/store/descent';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// Pinned section driving Act 4 — Breaking the surface. Pin duration 1500px
// gives the camera-cross-water moment its own scroll runway:
//   0.0–0.3   above water, agua.glb visible below, cobalt sky still
//   0.3–0.5   crossing the surface — flash, sky cobalt → turquoise
//   0.5–1.0   submerged: caustics on, god rays descending, headline visible
// Subscribers: WaterPlane (camera/water Y), SkyEnvironment (color lerp),
// AnchorChain (underwater tint), Caustics + GodRays (opacity), Act4Banner
// (fade-in copy).
export function Act4Trigger({ children }: { children: ReactNode }) {
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
        useDescentStore.getState().setAct4Progress(self.progress);
      },
    });

    return () => {
      trigger.kill();
      useDescentStore.getState().setAct4Progress(0);
    };
  }, []);

  return (
    <section ref={ref} className="relative h-screen w-full overflow-hidden">
      {children}
    </section>
  );
}
