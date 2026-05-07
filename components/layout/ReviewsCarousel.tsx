'use client';

import { useEffect, useState } from 'react';

type Review = { quote: string; source: string };

// Editorial review carousel — each review fades in/out one at a time
// (5 s per slide). Pure CSS opacity transitions on a stack of absolutely
// positioned blockquotes. No drag/swipe — designed to be ambient, not
// interactive.
export function ReviewsCarousel({ reviews }: { reviews: Review[] }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (reviews.length < 2) return;
    const id = setInterval(() => {
      setIdx((v) => (v + 1) % reviews.length);
    }, 5500);
    return () => clearInterval(id);
  }, [reviews.length]);

  return (
    <div className="relative mt-10 min-h-[280px] sm:min-h-[220px]">
      {reviews.map((r, i) => (
        <blockquote
          key={i}
          aria-hidden={i !== idx}
          className="absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-1000"
          style={{ opacity: i === idx ? 1 : 0 }}
        >
          <p className="font-display text-[clamp(22px,2.6vw,34px)] font-light italic leading-relaxed text-ivory/95 drop-shadow-[0_2px_18px_rgba(4,16,29,0.55)]">
            &ldquo;{r.quote}&rdquo;
          </p>
          <cite className="mt-6 block font-mono text-[11px] uppercase not-italic tracking-[0.3em] text-ivory/65">
            — {r.source}
          </cite>
        </blockquote>
      ))}

      {/* Pagination dots */}
      <div className="absolute -bottom-2 left-1/2 flex -translate-x-1/2 gap-2">
        {reviews.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Show review ${i + 1}`}
            onClick={() => setIdx(i)}
            className="h-1.5 w-6 rounded-full transition-colors"
            style={{
              backgroundColor: i === idx ? '#C9A86B' : 'rgba(245, 240, 230, 0.25)',
            }}
          />
        ))}
      </div>
    </div>
  );
}
