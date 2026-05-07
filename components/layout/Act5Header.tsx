'use client';

import { useEffect, useRef } from 'react';
import { useDescentStore } from '@/lib/store/descent';

// Act 5 editorial header — "The kitchen" eyebrow + headline + intro
// paragraph anchored to the top of the pinned section. Fades out as the
// dish carousel takes over (act5Progress > 0.15 ⇒ fade so the centre of
// the viewport belongs to the plates).
export function Act5Header({
  eyebrow,
  headline,
  intro,
}: {
  eyebrow: string;
  headline: string;
  intro: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const a5 = useDescentStore.getState().act5Progress;
      // Fully visible at a5=0, fades out by a5=0.15 so the dishes own
      // the rest of the section.
      const t = Math.max(0, Math.min(1, (a5 - 0.0) / 0.15));
      const op = 1 - t;
      if (ref.current) {
        ref.current.style.opacity = String(op);
        ref.current.style.transform = `translate3d(0, ${t * -24}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={ref}
      className="absolute inset-x-0 top-[10%] mx-auto max-w-2xl px-6 text-center"
      style={{ willChange: 'opacity, transform' }}
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-ivory/95 drop-shadow-[0_2px_18px_rgba(4,16,29,0.55)]">
        {eyebrow}
      </p>
      <h2 className="mt-6 font-display text-[clamp(36px,4.5vw,64px)] font-light leading-[1.1] tracking-[-0.02em] text-ivory drop-shadow-[0_2px_24px_rgba(4,16,29,0.5)]">
        {headline}
      </h2>
      <p className="mt-6 font-sans text-[15px] leading-[1.7] text-ivory/90 drop-shadow-[0_2px_18px_rgba(4,16,29,0.55)]">
        {intro}
      </p>
    </div>
  );
}
