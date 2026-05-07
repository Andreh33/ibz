'use client';

import { type ReactNode, useEffect, useRef } from 'react';
import { useDescentStore } from '@/lib/store/descent';

// Centred Act 4 editorial banner. Stays invisible until the user crosses
// the water (act4Progress ≈ 0.5), then fades in over the second half of
// the pin so it lands when caustics + god rays are at full intensity.
// Lives inside the pinned Act4Trigger section so it stays at viewport
// center for the full pin duration.
export function Act4Banner({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const a4 = useDescentStore.getState().act4Progress;
      // Smoothstep 0.5 → 0.85, slight ease so the headline materialises
      // rather than blunt-fading.
      const lin = Math.max(0, Math.min(1, (a4 - 0.5) / 0.35));
      const eased = lin * lin * (3 - 2 * lin);
      if (ref.current) {
        ref.current.style.opacity = String(eased);
        ref.current.style.transform = `translate3d(0, ${(1 - eased) * 18}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={ref}
      className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
      style={{ opacity: 0, willChange: 'opacity, transform' }}
    >
      {children}
    </div>
  );
}
