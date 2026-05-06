'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { type ReactNode, useEffect } from 'react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export function LenisProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({ autoRaf: false });

    const update = () => ScrollTrigger.update();
    lenis.on('scroll', update);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.off('scroll', update);
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
