'use client';

import { useEffect, useRef } from 'react';

// Tiny illustrated dinghy that drifts left → right across the Act 6
// section, position bound to the section's own scroll progress (not the
// global descent). Below the dinghy a wavy SVG path drifts horizontally
// for a sense of water motion. All inline SVG, no GLB or images — keeps
// the bundle small and works perfectly on retina at any size.
export function DinghySvg() {
  const dinghyRef = useRef<SVGGElement>(null);
  const sectionEl = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const wrap = sectionEl.current?.parentElement;
      if (!wrap) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const r = wrap.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 when section bottom is at viewport bottom, 1 when section top
      // is at viewport top. Maps to dinghy x: -10% → 110%.
      const t = Math.max(0, Math.min(1, (vh - r.top) / (vh + r.height)));
      if (dinghyRef.current) {
        const xPct = -10 + t * 120;
        dinghyRef.current.setAttribute(
          'transform',
          `translate(${xPct}, ${Math.sin(t * Math.PI * 4) * 1.5})`,
        );
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={sectionEl} aria-hidden className="pointer-events-none absolute inset-x-0 top-12 mx-auto w-full max-w-[1200px]">
      <svg
        viewBox="0 0 100 16"
        preserveAspectRatio="none"
        className="h-12 w-full opacity-60"
      >
        {/* Subtle wave under the dinghy */}
        <path
          d="M -2 12 Q 10 9, 22 12 T 50 12 T 80 12 T 110 12"
          fill="none"
          stroke="rgba(245,240,230,0.35)"
          strokeWidth="0.4"
        />
        <path
          d="M -2 14 Q 14 11, 30 14 T 60 14 T 90 14 T 120 14"
          fill="none"
          stroke="rgba(245,240,230,0.18)"
          strokeWidth="0.3"
        />
        {/* Dinghy — translated by useEffect each frame */}
        <g ref={dinghyRef} transform="translate(-10, 0)">
          {/* Hull */}
          <path
            d="M -3 9 L 3 9 L 4 11 L -4 11 Z"
            fill="#F5F0E6"
            opacity="0.92"
          />
          {/* Mast */}
          <line x1="0" y1="9" x2="0" y2="3" stroke="#C9A86B" strokeWidth="0.18" />
          {/* Sail */}
          <path d="M 0.2 3 L 0.2 8.5 L 2.4 8.5 Z" fill="rgba(245,240,230,0.85)" />
          {/* Pennant */}
          <path d="M 0 3 L 0.9 2.5 L 0 2.4 Z" fill="#C9A86B" />
        </g>
      </svg>
    </div>
  );
}
