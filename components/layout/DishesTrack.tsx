'use client';

import { useEffect, useRef } from 'react';
import { useDescentStore } from '@/lib/store/descent';

// Five signature dishes per CLAUDE.md §3 Act 5. The Sanity dish schema has
// an `image` field but the seed (sanity/seed/menu.json) ships text only —
// no image assets staged yet. Until the chef provides editorial photos to
// upload to Sanity, we map each dish to one of the existing site images
// shipped under public/images (the originals from the live site). Each
// plate is a circular crop of the photograph with a slowly rotating gold
// ring around it.
type Dish = {
  id: string;
  name: string;
  price: string;
  origin: string;
  image: string; // /images/<base>-1080.avif
};

const DISHES: Dish[] = [
  {
    id: 'paella',
    name: 'Paella melosa',
    price: '29,50 €',
    origin: 'Seafood & fish — for two',
    image: '/images/Mains-1-1080.avif',
  },
  {
    id: 'tomahawk',
    name: 'Friesian Tomahawk',
    price: '90 € / kg',
    origin: 'Galicia — 50-day dry-aged',
    image: '/images/Mains-3-1080.avif',
  },
  {
    id: 'wagyu',
    name: 'Wagyu Boat House Burger',
    price: '32 €',
    origin: 'Boat House signature',
    image: '/images/Mains-4-1080.avif',
  },
  {
    id: 'curry',
    name: 'Thai Fish & Seafood Curry',
    price: '28 €',
    origin: 'Mediterranean catch',
    image: '/images/Main-A-1080.avif',
  },
  {
    id: 'lamb',
    name: 'Slow Lamb Shoulder',
    price: '34 €',
    origin: 'Estate-raised',
    image: '/images/Tapas-D-1080.avif',
  },
];

// Each dish takes one "viewport-equivalent" of horizontal track (38rem
// wide) with the plate itself rendered at 24rem (~384 px) so the food
// photo dominates each frame and is clearly identifiable.
const DISH_WIDTH_REM = 38;
const PLATE_SIZE_REM = 24;
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
  // per spec. The active plate (closest to viewport centre) signals focus
  // via a subtle scale bump driven by act5Progress.
  //
  // We deliberately do NOT modulate `opacity` on the wrapper: CSS opacity
  // applies to the entire subtree including the dish photo, and because
  // the SceneRoot canvas (anchor + chain at z-5) sits behind the dishes
  // wrapper (z-20), translucent photos let the chain bleed through and
  // ruin the editorial card look. If we ever want a focus dim again,
  // TODO: layer a solid `bg-deep` overlay as a `::after` on the image
  // wrapper with a variable opacity instead of fading the whole subtree.
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
        className="relative flex items-center justify-center"
        style={{
          width: `${PLATE_SIZE_REM}rem`,
          height: `${PLATE_SIZE_REM}rem`,
          willChange: 'transform, opacity',
        }}
      >
        {/* Outer slowly-rotating gold ring — gives the plate a sense of
            craft / ceremony without being literal food photography. */}
        <div
          ref={ringRef}
          aria-hidden
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(from 0deg, rgba(201, 168, 107, 0.0), rgba(201, 168, 107, 0.65), rgba(201, 168, 107, 0.0) 50%, rgba(201, 168, 107, 0.45) 75%, rgba(201, 168, 107, 0.0))`,
            mask: 'radial-gradient(circle, transparent 51%, #000 54%, #000 58%, transparent 61%)',
            WebkitMask: 'radial-gradient(circle, transparent 51%, #000 54%, #000 58%, transparent 61%)',
          }}
        />
        {/* Plate body — circular crop of the editorial dish photograph
            without an overlay so the food reads at full saturation. The
            dish title sits OUTSIDE the plate (below) instead of stamped
            on top. */}
        <div
          className="absolute inset-4 overflow-hidden rounded-full"
          style={{
            boxShadow: '0 24px 56px rgba(4, 16, 29, 0.6), inset 0 0 40px rgba(0, 0, 0, 0.25)',
          }}
        >
          <img
            src={dish.image}
            alt={dish.name}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
      {/* Title + origin + price below the plate. Larger plate + clear caption
          stack reads as an editorial menu card rather than a stamped Insta-
          gram-style overlay. */}
      <div className="mt-8 max-w-[24rem] text-center">
        <h3 className="font-display text-2xl font-light leading-tight text-ivory drop-shadow-[0_2px_12px_rgba(4,16,29,0.55)]">
          {dish.name}
        </h3>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.3em] text-ivory/70">
          {dish.origin}
        </p>
        <p className="mt-3 font-display text-2xl font-light text-ivory">{dish.price}</p>
      </div>
    </div>
  );
}
