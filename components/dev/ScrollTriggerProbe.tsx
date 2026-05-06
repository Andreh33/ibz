'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef } from 'react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export function ScrollTriggerProbe({ label }: { label: string }) {
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;

    const tween = gsap.fromTo(
      el,
      { autoAlpha: 0, y: 32 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.9,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 75%',
          toggleActions: 'play none none reverse',
          markers: process.env.NODE_ENV !== 'production',
          id: 'probe-fade',
        },
      },
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, []);

  return (
    <section className="min-h-[140vh] flex items-end justify-center pb-[20vh]">
      <div
        ref={targetRef}
        className="max-w-xl rounded border border-gold/40 bg-bone px-8 py-8 text-deep shadow-sm"
      >
        <p className="font-display text-2xl tracking-[-0.02em]">{label}</p>
        <p className="font-mono text-xs uppercase text-deep/60 mt-3">
          start: top 75% &middot; toggleActions: play none none reverse
        </p>
      </div>
    </section>
  );
}
