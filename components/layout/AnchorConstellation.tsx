'use client';

import { useEffect, useRef } from 'react';

// Decorative anchor silhouette assembled from gold dots that connect
// themselves with thin gold lines when the user reaches the very
// bottom of the page (per CLAUDE.md §3 Act 7 — footer constellation).
// Lives at the top of the SiteFooter as a brand close-out signature.
//
// 17 dots traced over an anchor outline, plus 16 line segments between
// adjacent dots. IntersectionObserver fires when the constellation
// enters viewport; we then animate dot opacity (staggered) and line
// stroke-dashoffset, giving the impression of the silhouette drawing
// itself out of the deep.
const DOTS: Array<{ x: number; y: number }> = [
  // Ring (top)
  { x: 50, y: 8 },
  { x: 56, y: 12 },
  { x: 56, y: 22 },
  { x: 50, y: 26 },
  { x: 44, y: 22 },
  { x: 44, y: 12 },
  // Stock (horizontal bar)
  { x: 28, y: 35 },
  { x: 50, y: 32 },
  { x: 72, y: 35 },
  // Shaft
  { x: 50, y: 48 },
  { x: 50, y: 64 },
  // Crown / arms (curved bottom)
  { x: 28, y: 78 },
  { x: 32, y: 86 },
  { x: 50, y: 92 },
  { x: 68, y: 86 },
  { x: 72, y: 78 },
  { x: 50, y: 70 },
];

// Segments linking the dots in drawing order (ring → stock → shaft →
// arms). Skips closing the ring back to the start so the path reads
// as one continuous trace rather than a polygon.
const SEGMENTS: Array<[number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], // ring loop
  [3, 7],                                          // ring → top of stock
  [6, 7], [7, 8],                                  // stock bar
  [7, 9], [9, 10],                                 // shaft
  [10, 16], [16, 11], [11, 12], [12, 13],          // left arm + bottom
  [13, 14], [14, 15], [15, 16],                    // right arm
];

export function AnchorConstellation() {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const dots = el.querySelectorAll<HTMLElement>('[data-dot]');
    const lines = el.querySelectorAll<SVGPathElement>('[data-line]');

    // Pre-set lines invisible (full dash).
    lines.forEach((line) => {
      const len = line.getTotalLength();
      line.style.strokeDasharray = String(len);
      line.style.strokeDashoffset = String(len);
    });
    dots.forEach((d) => {
      d.style.opacity = '0';
    });

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          // Stagger dots in.
          dots.forEach((d, i) => {
            d.style.transition = `opacity 0.6s ease-out ${i * 0.07}s`;
            d.style.opacity = '0.85';
          });
          // After dots settle, draw lines.
          setTimeout(() => {
            lines.forEach((line, i) => {
              line.style.transition = `stroke-dashoffset 1s ease-out ${i * 0.08}s`;
              line.style.strokeDashoffset = '0';
            });
          }, dots.length * 70 + 200);
          obs.disconnect();
          return;
        }
      },
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={wrapRef}
      aria-hidden
      className="mx-auto mt-12 mb-12 flex justify-center"
      style={{ width: 220, height: 220 }}
    >
      <svg
        viewBox="0 0 100 100"
        width="220"
        height="220"
        className="overflow-visible"
      >
        {/* Lines first so dots draw on top */}
        {SEGMENTS.map(([a, b], i) => {
          const A = DOTS[a];
          const B = DOTS[b];
          if (!A || !B) return null;
          const d = `M ${A.x} ${A.y} L ${B.x} ${B.y}`;
          return (
            <path
              key={`l-${i}`}
              data-line
              d={d}
              fill="none"
              stroke="#C9A86B"
              strokeOpacity={0.55}
              strokeWidth="0.4"
              strokeLinecap="round"
            />
          );
        })}
        {/* Dots */}
        {DOTS.map((p, i) => (
          <circle
            key={`d-${i}`}
            data-dot
            cx={p.x}
            cy={p.y}
            r="1.1"
            fill="#D4B477"
            style={{ opacity: 0 }}
          />
        ))}
      </svg>
    </div>
  );
}
