'use client';

import { useEffect, useRef } from 'react';
import { useDescentStore } from '@/lib/store/descent';

// Six signature dishes per CLAUDE.md §3 Act 5. Pulled from the published
// menu (sanity/seed/menu.json + the spec); prices in EUR. Each plate is
// a circular gradient + gold ring + dish name on top — no photos, since
// the brief deliberately avoids stock-style food shots and we don't yet
// have an editorial photoshoot to pull from. The visual is editorial
// menu-card, not Instagram bowl.
type Dish = {
  id: string;
  name: string;
  price: string;
  origin: string;
  hue: string; // base swatch driving the radial gradient
};

const DISHES: Dish[] = [
  { id: 'paella', name: 'Paella melosa', price: '29,50 €', origin: 'Seafood & fish — for two', hue: '#C8A06E' },
  { id: 'tomahawk', name: 'Friesian Tomahawk', price: '90 € / kg', origin: 'Galicia — 50-day dry-aged', hue: '#7A3A2A' },
  { id: 'wagyu', name: 'Wagyu Boat House Burger', price: '32 €', origin: 'Boat House signature', hue: '#9D4E3B' },
  { id: 'curry', name: 'Thai Fish & Seafood Curry', price: '28 €', origin: 'Mediterranean catch', hue: '#E2A83A' },
  { id: 'lamb', name: 'Slow Lamb Shoulder', price: '34 €', origin: 'Estate-raised', hue: '#A65A3F' },
  { id: 'vegan', name: 'Vegan Yellow Curry', price: '24 €', origin: 'From the cove farm', hue: '#D9B956' },
];

// Each dish takes one "viewport-equivalent" of horizontal track (28rem wide).
// 6 dishes → track width 6 × 28rem = 168rem ≈ 2688 px at 16 px root. The
// scrub maps act5Progress 0.05 → 0.95 across that width so the user gets
// a calm tail-in / tail-out at each end.
const DISH_WIDTH_REM = 28;
const SCRUB_FROM = 0.05;
const SCRUB_TO = 0.95;

export function DishesTrack() {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const a5 = useDescentStore.getState().act5Progress;
      const t = Math.max(0, Math.min(1, (a5 - SCRUB_FROM) / (SCRUB_TO - SCRUB_FROM)));
      // Translate so plate 0 is centred at t=0 and plate (n-1) at t=1.
      // Centred = the track's container offsets by 50% of the viewport
      // first, then we slide the track itself by -t × (n-1) plate-widths.
      const slideRem = -t * (DISHES.length - 1) * DISH_WIDTH_REM;
      if (trackRef.current) {
        trackRef.current.style.transform = `translate3d(${slideRem}rem, 0, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="absolute inset-0 flex items-center overflow-hidden">
      {/* Track is wider than the viewport. Centred horizontally by an
          inset of 50% viewport - half a plate, applied via padding-left. */}
      <div
        ref={trackRef}
        className="flex shrink-0 items-center"
        style={{
          paddingLeft: `calc(50vw - ${DISH_WIDTH_REM / 2}rem)`,
          willChange: 'transform',
        }}
      >
        {DISHES.map((d, i) => (
          <DishPlate key={d.id} dish={d} index={i} />
        ))}
      </div>
    </div>
  );
}

function DishPlate({ dish, index }: { dish: Dish; index: number }) {
  // Each plate slowly rotates its inner ring and tilts 15° in perspective
  // per spec. The active plate (closest to viewport centre) brightens
  // slightly via a subtle scale + opacity bump driven by act5Progress.
  const ringRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const a5 = useDescentStore.getState().act5Progress;
      const t = Math.max(0, Math.min(1, (a5 - SCRUB_FROM) / (SCRUB_TO - SCRUB_FROM)));
      const focus = 1 - Math.min(1, Math.abs(t * (DISHES.length - 1) - index) / 0.6);
      if (ringRef.current) {
        ringRef.current.style.transform = `rotate(${performance.now() * 0.005 + index * 60}deg)`;
      }
      if (wrapperRef.current) {
        const scale = 0.88 + focus * 0.12;
        wrapperRef.current.style.transform = `perspective(1200px) rotateX(15deg) scale(${scale})`;
        wrapperRef.current.style.opacity = String(0.55 + focus * 0.45);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [index]);

  return (
    <div
      className="flex shrink-0 flex-col items-center"
      style={{ width: `${DISH_WIDTH_REM}rem` }}
    >
      <div
        ref={wrapperRef}
        className="relative flex h-72 w-72 items-center justify-center"
        style={{ willChange: 'transform, opacity' }}
      >
        {/* Outer slowly-rotating gold ring — gives the plate a sense of
            craft / ceremony without being literal food photography. */}
        <div
          ref={ringRef}
          aria-hidden
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(from 0deg, rgba(201, 168, 107, 0.0), rgba(201, 168, 107, 0.65), rgba(201, 168, 107, 0.0) 50%, rgba(201, 168, 107, 0.45) 75%, rgba(201, 168, 107, 0.0))`,
            mask: 'radial-gradient(circle, transparent 53%, #000 56%, #000 60%, transparent 63%)',
            WebkitMask: 'radial-gradient(circle, transparent 53%, #000 56%, #000 60%, transparent 63%)',
          }}
        />
        {/* Plate body: radial gradient driven by the dish hue. The centre is
            warm and bright, edges fade into the deep underwater backdrop. */}
        <div
          className="absolute inset-4 rounded-full"
          style={{
            background: `radial-gradient(circle at 50% 40%, ${dish.hue}, ${dish.hue}99 35%, #0E2C3A66 75%, #0E2C3A33)`,
            boxShadow: '0 18px 48px rgba(4, 16, 29, 0.55), inset 0 0 30px rgba(0, 0, 0, 0.35)',
          }}
        />
        {/* Centre disk with the dish title — keeps the editorial typography
            visible without competing with photography we don't have. */}
        <div className="relative z-10 flex h-44 w-44 items-center justify-center rounded-full bg-deep/55 backdrop-blur-sm">
          <span className="px-3 text-center font-display text-base font-light leading-tight text-ivory drop-shadow-[0_2px_8px_rgba(4,16,29,0.6)]">
            {dish.name}
          </span>
        </div>
      </div>
      <div className="mt-8 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ivory/70">
          {dish.origin}
        </p>
        <p className="mt-3 font-display text-xl text-ivory">{dish.price}</p>
      </div>
    </div>
  );
}
