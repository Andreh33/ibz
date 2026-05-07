'use client';

import { useEffect, useRef } from 'react';
import { useDescentStore } from '@/lib/store/descent';

// Static brand-cover photograph that sits behind the entire home descent.
// `fondohome.webp` is the only static visual layer — every other element
// (Boeing, anchor, chain, banners, water, dishes, turtle) animates over it.
// The image fades out as the user crosses into Act 4 (underwater) so the
// turquoise environment isn't fighting the warm exterior shot.
//
// The image is fixed-positioned at z-0, so it sits BELOW the SceneRoot
// canvas (z-5) but is fully visible during Acts 1–3 because the canvas
// uses `alpha: true` and the SkyEnvironment sphere becomes increasingly
// translucent as Act 4 fog ramps up. We'd use Next/Image but a fixed
// full-bleed background reads more naturally with plain <img> + object-
// cover at the root.
export function StaticHomeBackground() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      // Fade out starting at Act 4 cross (a4 = 0.3) and fully out by mid-
      // submerged (a4 = 0.7). Once the user is underwater the warm Ibiza
      // exterior would clash with the turquoise environment.
      const a4 = useDescentStore.getState().act4Progress;
      const t = Math.max(0, Math.min(1, (a4 - 0.3) / 0.4));
      if (ref.current) ref.current.style.opacity = String(1 - t);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: 0, willChange: 'opacity' }}
    >
      <img
        src="/images/fondohome.webp"
        alt=""
        className="h-full w-full object-cover"
        loading="eager"
        decoding="async"
      />
      {/* Soft top vignette so the wordmark and copy lift cleanly off the
          photo without darkening the centre of the composition. */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-40"
        style={{
          background:
            'linear-gradient(to bottom, rgba(4, 16, 29, 0.45), transparent)',
        }}
      />
      {/* Bottom vignette mirrors it, used for legibility of CTA + scroll
          hint over warm sky. */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-40"
        style={{
          background:
            'linear-gradient(to top, rgba(4, 16, 29, 0.4), transparent)',
        }}
      />
    </div>
  );
}
