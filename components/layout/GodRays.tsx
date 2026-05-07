'use client';

import { useEffect, useRef } from 'react';
import { useDescentStore } from '@/lib/store/descent';

// Pragmatic god-rays fallback per spec — 5 SVG polygons descending from
// the top edge with a subtle gradient and slight oscillation. Less
// physically correct than a volumetric EffectComposer pass but ~free in
// performance terms and good enough to read as "light shafts piercing the
// water from above". Visibility scrubs with act4Progress (0 until cross,
// up to 0.6 by the end of Act 4 — the spec target).
//
// Each ray:
//   – Long thin trapezoid (top wider than bottom = caustic-like fan)
//   – Cream/white linear gradient, fading to transparent at the bottom
//   – CSS animation gives a gentle horizontal drift (different phase per ray)
//   – z-index 12, between the caustics overlay (z-10) and the editorial
//     copy (z-20) so the rays sit BEHIND the headline but IN FRONT of the
//     caustics colour wash.
const RAY_DEFS = [
  { left: '12%', delay: '-2s', skew: -8, width: 28 },
  { left: '28%', delay: '-7s', skew: -3, width: 22 },
  { left: '46%', delay: '-4s', skew: 5, width: 36 },
  { left: '66%', delay: '-9s', skew: -5, width: 20 },
  { left: '82%', delay: '-1s', skew: 8, width: 30 },
];

export function GodRays() {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const a4 = useDescentStore.getState().act4Progress;
      // Smoothstep from cross to end, capped at 0.6.
      const t = Math.max(0, Math.min(1, (a4 - 0.5) / 0.5));
      if (wrapperRef.current) {
        wrapperRef.current.style.opacity = String(t * 0.6);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={wrapperRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: 12, opacity: 0 }}
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="rayGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#E0F0FF" stopOpacity="0.55" />
            <stop offset="50%" stopColor="#E0F0FF" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#E0F0FF" stopOpacity="0" />
          </linearGradient>
        </defs>
        {RAY_DEFS.map((ray, i) => {
          const left = parseFloat(ray.left);
          const top = -10;
          const bottomWidth = ray.width;
          const topWidth = ray.width * 0.4;
          const dx = (bottomWidth - topWidth) / 2;
          // Trapezoid: narrow at top, wide at bottom, skewed slightly.
          const path = `M ${left + dx} ${top} L ${left + dx + topWidth} ${top} L ${left + bottomWidth + ray.skew} 110 L ${left + ray.skew} 110 Z`;
          return (
            <path
              key={i}
              d={path}
              fill="url(#rayGradient)"
              style={{
                animation: `god-ray-drift 14s ease-in-out infinite ${ray.delay}`,
                transformOrigin: '50% 0%',
              }}
            />
          );
        })}
      </svg>
    </div>
  );
}
