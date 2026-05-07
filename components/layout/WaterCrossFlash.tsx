'use client';

import { useEffect, useRef } from 'react';
import { useDescentStore } from '@/lib/store/descent';

// Brief flash overlay during the cross-water moment (Act 4 ≈ 0.30–0.50).
// Cheaper than a full EffectComposer post-pass while still giving the
// "camera slamming through the surface" beat the spec asks for. The flash
// uses two stacked layers:
//   – Outer: white-cyan radial gradient that brightens the centre of the
//     viewport for ~200 ms as the user crosses.
//   – Inner: ultra-thin RGB shift (chromatic-aberration approximation) via
//     two slightly offset coloured rectangles set to mix-blend-mode: screen.
// Driven by a polled act4Progress; we map [0.30, 0.50] → [0, 1] then to a
// triangle pulse so the flash crests at the very moment of crossing.
export function WaterCrossFlash() {
  const flashRef = useRef<HTMLDivElement>(null);
  const aberRRef = useRef<HTMLDivElement>(null);
  const aberCRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const a4 = useDescentStore.getState().act4Progress;
      // Triangle pulse: 0 below 0.3, peak at 0.4, back to 0 by 0.5.
      const lin = Math.max(0, Math.min(1, (a4 - 0.3) / 0.2));
      const tri = 1 - Math.abs(lin * 2 - 1);
      // Power 1.5 sharpens the peak so the flash reads as a beat, not a fade.
      const intensity = tri ** 1.5;
      if (flashRef.current) flashRef.current.style.opacity = String(intensity);
      // Chromatic aberration peaks slightly before the white flash so the
      // user perceives the colour fringes as causing the brightness, like a
      // real camera capturing a flash through fluid.
      const aber = Math.max(0, Math.min(1, (a4 - 0.27) / 0.18)) - Math.max(0, Math.min(1, (a4 - 0.42) / 0.1));
      if (aberRRef.current) aberRRef.current.style.opacity = String(aber * 0.6);
      if (aberCRef.current) aberCRef.current.style.opacity = String(aber * 0.6);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <>
      {/* Bright radial flash, mix-blend screen so it brightens without
          completely blowing out the underlying scene. */}
      <div
        ref={flashRef}
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          zIndex: 15,
          opacity: 0,
          background:
            'radial-gradient(ellipse at center, rgba(220, 240, 255, 0.85) 0%, rgba(180, 220, 255, 0.4) 35%, transparent 75%)',
          mixBlendMode: 'screen',
        }}
      />
      {/* Chromatic aberration: red shifted left, cyan shifted right. The two
          full-bleed rects with screen blend create coloured fringes that
          peak around the flash and fade. */}
      <div
        ref={aberRRef}
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          zIndex: 14,
          opacity: 0,
          transform: 'translateX(-3px)',
          background:
            'radial-gradient(ellipse at center, rgba(255, 80, 80, 0.0) 30%, rgba(255, 80, 80, 0.18) 60%, transparent 80%)',
          mixBlendMode: 'screen',
        }}
      />
      <div
        ref={aberCRef}
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          zIndex: 14,
          opacity: 0,
          transform: 'translateX(3px)',
          background:
            'radial-gradient(ellipse at center, rgba(80, 220, 255, 0.0) 30%, rgba(80, 220, 255, 0.18) 60%, transparent 80%)',
          mixBlendMode: 'screen',
        }}
      />
    </>
  );
}
