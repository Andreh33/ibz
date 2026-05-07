'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef } from 'react';

if (typeof window !== 'undefined') gsap.registerPlugin(ScrollTrigger);

// Inline SVG sourcing map of the western Mediterranean. Five lines draw
// themselves one after another via stroke-dashoffset scrub when the
// section enters the viewport. Each origin city has a small pulsing
// gold dot. The cove farm is highlighted in brighter gold.
//
// Coordinates in the viewBox are loose, "decorative" geography — not a
// real projection — but they read as Mediterranean for any visitor.

type Origin = { id: string; label: string; product: string; x: number; y: number; gold?: boolean };
type Line = { from: { x: number; y: number }; to: { x: number; y: number } };

const COVE = { x: 540, y: 280 };

const ORIGINS: Origin[] = [
  { id: 'galicia',    label: 'Galicia',          product: '50-day dry-aged beef',         x: 230, y: 230 },
  { id: 'cove',       label: 'Cala San Vicente', product: 'Catch of the day',             x: COVE.x, y: COVE.y, gold: true },
  { id: 'farm',       label: 'Cove farm',        product: 'Vegetables, herbs (zero-km)',  x: 560, y: 305, gold: true },
  { id: 'italy',      label: 'Naples',           product: 'Buffalo mozzarella',           x: 730, y: 240 },
  { id: 'lebanon',    label: 'Beirut',           product: 'Mezze influence',              x: 920, y: 290 },
];

const LINES: Line[] = ORIGINS
  .filter((o) => o.id !== 'cove' && o.id !== 'farm')
  .map((o) => ({ from: { x: o.x, y: o.y }, to: COVE }));

export function SourcingMap({
  eyebrow,
  headline,
  intro,
  legend,
}: {
  eyebrow: string;
  headline: string;
  intro: string;
  legend: { partner: string; estate: string };
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    const lines = linesRef.current;
    if (!el || !lines) return;
    const paths = Array.from(lines.querySelectorAll('path'));
    paths.forEach((p) => {
      const len = p.getTotalLength();
      p.style.strokeDasharray = String(len);
      p.style.strokeDashoffset = String(len);
    });

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top 70%',
      end: 'bottom 30%',
      scrub: 1,
      onUpdate: (self) => {
        const total = paths.length;
        paths.forEach((p, i) => {
          const segment = 1 / total;
          const localT = Math.max(0, Math.min(1, (self.progress - i * segment * 0.85) / segment));
          const len = p.getTotalLength();
          p.style.strokeDashoffset = String(len * (1 - localT));
        });
      },
    });

    return () => {
      trigger.kill();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative px-6 py-32 sm:py-40"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center sm:mb-16">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-ivory/80">
            {eyebrow}
          </p>
          <h2 className="mt-6 font-display text-[clamp(36px,5vw,68px)] font-light leading-[1.05] tracking-[-0.02em] text-ivory drop-shadow-[0_2px_24px_rgba(4,16,29,0.5)]">
            {headline}
          </h2>
          <p className="mx-auto mt-6 max-w-2xl font-sans text-base leading-relaxed text-ivory/85 drop-shadow-[0_2px_18px_rgba(4,16,29,0.55)]">
            {intro}
          </p>
        </div>

        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-sm border border-ivory/10 bg-deep/30 backdrop-blur-sm">
          <svg
            viewBox="0 0 1100 500"
            className="absolute inset-0 h-full w-full"
            aria-hidden
          >
            {/* Decorative coastline shapes — abstract, evocative not literal. */}
            <g fill="none" stroke="rgba(245,240,230,0.12)" strokeWidth="1">
              {/* Iberia outline (loose) */}
              <path d="M 80 130 Q 200 110, 320 180 Q 380 240, 360 310 Q 380 380, 290 410 Q 180 400, 110 340 Q 60 240, 80 130 Z" />
              {/* Balearic Islands cluster */}
              <path d="M 510 270 Q 540 260, 560 280 Q 555 305, 530 305 Q 510 295, 510 270 Z" />
              <path d="M 590 270 Q 612 268, 615 285 Q 605 295, 588 290 Z" />
              {/* Italy boot */}
              <path d="M 650 150 Q 720 180, 740 240 Q 770 320, 800 380 Q 820 410, 800 430" />
              {/* North Africa edge */}
              <path d="M 100 440 L 1050 440" />
              {/* Lebanon hint */}
              <path d="M 870 250 Q 920 240, 950 280 Q 940 310, 905 310" />
            </g>

            {/* Origin → cove sourcing lines (drawn via stroke-dashoffset) */}
            <g ref={linesRef}>
              {LINES.map((l, i) => {
                const cx = (l.from.x + l.to.x) / 2;
                const cy = Math.min(l.from.y, l.to.y) - 50;
                const d = `M ${l.from.x} ${l.from.y} Q ${cx} ${cy}, ${l.to.x} ${l.to.y}`;
                return (
                  <path
                    key={i}
                    d={d}
                    fill="none"
                    stroke="#C9A86B"
                    strokeOpacity={0.6}
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                );
              })}
            </g>

            {/* Origin pins */}
            {ORIGINS.map((o) => (
              <g key={o.id}>
                <circle
                  cx={o.x}
                  cy={o.y}
                  r={o.gold ? 9 : 6}
                  fill={o.gold ? '#D4B477' : '#C9A86B'}
                  fillOpacity={o.gold ? 0.25 : 0.2}
                />
                <circle
                  cx={o.x}
                  cy={o.y}
                  r={o.gold ? 4 : 3}
                  fill={o.gold ? '#E8CB8B' : '#C9A86B'}
                />
                <text
                  x={o.x}
                  y={o.y - 14}
                  fill="#F5F0E6"
                  fontFamily="var(--font-mono, monospace)"
                  fontSize="10"
                  letterSpacing="0.18em"
                  textAnchor="middle"
                  style={{ textTransform: 'uppercase' }}
                >
                  {o.label}
                </text>
                <text
                  x={o.x}
                  y={o.y + 22}
                  fill="rgba(245,240,230,0.7)"
                  fontFamily="var(--font-fraunces, serif)"
                  fontSize="11"
                  textAnchor="middle"
                >
                  {o.product}
                </text>
              </g>
            ))}
          </svg>
        </div>

        <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 font-mono text-[10px] uppercase tracking-[0.3em] text-ivory/70">
          <li className="flex items-center gap-2">
            <span aria-hidden className="block h-1 w-6 rounded-full bg-gold/70" />
            <span>{legend.partner}</span>
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden className="block h-2 w-2 rounded-full bg-[#E8CB8B]" />
            <span>{legend.estate}</span>
          </li>
        </ul>
      </div>
    </section>
  );
}
