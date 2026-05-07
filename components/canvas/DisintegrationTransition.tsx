'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import html2canvas from 'html2canvas-pro';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import {
  CanvasTexture,
  Color,
  type Mesh,
  type ShaderMaterial,
  SRGBColorSpace,
  type Texture,
} from 'three';
import { DISINTEGRATION_FRAGMENT, DISINTEGRATION_VERTEX } from '@/lib/shaders/disintegration';
import { useDescentStore } from '@/lib/store/descent';
import { usePreloaderStore } from '@/lib/store/preloader';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

type Props = {
  children: ReactNode;
  /** Hex color for the disintegrating particles. */
  particleColor?: string;
  /** Max upward drift in pixels at progress 1. */
  yDrift?: number;
  /** Max horizontal jitter in pixels at progress 1. */
  xJitter?: number;
  /** Damp smoothing factor: lower = slower catch-up = longer perceptible
   *  animation when the user scrolls fast. With 4.0 the progress takes
   *  ~250ms to converge, with 2.5 ~400ms. Default 3.0 gives a reliable
   *  ~330ms perception window even at 5000 px/s wheel speeds. */
  dampSmoothing?: number;
  /** ScrollTrigger start position (banner-relative). Default fires when the
   *  top of the banner is 25% into the viewport from the top — banner is
   *  clearly visible by the time the dissolve starts. */
  triggerStart?: string;
  /** ScrollTrigger end position. Default ends when the bottom of the banner
   *  is 10% above the viewport top (banner mostly scrolled past). */
  triggerEnd?: string;
  /** When set, skip ScrollTrigger and drive progress from Act 1 pin's
   *  descent store progress mapped from [from, to] to [0, 1]. Used for
   *  banners inside the Act1Trigger pin where child ScrollTriggers don't
   *  get pin-spacer compensation. */
  act1ProgressRange?: [number, number];
};

const REDUCED_MOTION_TRANSLATE = 12;

export function DisintegrationTransition({
  children,
  particleColor = '#C9A86B',
  yDrift = 320,
  xJitter = 70,
  dampSmoothing = 3.0,
  triggerStart = 'top top+=25%',
  triggerEnd = 'bottom top+=10%',
  act1ProgressRange,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  // progressRef.current is the SMOOTHED, render-side progress that drives
  // the shader. progressTargetRef.current is the raw scroll-driven target
  // updated by ScrollTrigger / descent-store subscribers. useFrame eases
  // current toward target each frame so the dissolve always reads as a
  // ~300ms animation even when the user wheels through the trigger zone.
  const progressRef = useRef(0);
  const progressTargetRef = useRef(0);
  const [texture, setTexture] = useState<Texture | null>(null);
  const [bounds, setBounds] = useState<{ width: number; height: number } | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Detect prefers-reduced-motion.
  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(m.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    m.addEventListener('change', onChange);
    return () => m.removeEventListener('change', onChange);
  }, []);

  // ONE-TIME html2canvas snapshot of the children. Sequenced so the snapshot
  // captures the FINAL rendered state, after:
  //   1. Fonts are loaded (so glyphs match the live DOM).
  //   2. Preloader has reported `loaded` (so its wipe begins).
  //   3. The WordmarkReveal entrance animation has completed
  //      (gsap delay 0.2 + duration 1.2 + safety buffer = 2000ms).
  // Without this delay html2canvas could capture mid-animation, baking the
  // y-translated/transparent state into the disintegration texture.
  useEffect(() => {
    if (reducedMotion || !contentRef.current) return;
    let cancelled = false;
    let createdTex: Texture | null = null;

    const waitForLoaded = () =>
      new Promise<void>((resolve) => {
        if (usePreloaderStore.getState().loaded) {
          resolve();
          return;
        }
        const unsub = usePreloaderStore.subscribe((s) => {
          if (s.loaded) {
            unsub();
            resolve();
          }
        });
      });

    (async () => {
      try {
        if (process.env.NODE_ENV !== 'production') {
          // biome-ignore lint/suspicious/noConsole: dev only
          console.log('[disint] waiting for fonts + preloader + reveal animation');
        }
        await document.fonts.ready;
        await waitForLoaded();
        // 2000ms = preloader exit (settle 400 + wipe 800) + reveal animation
        // (delay 200 + duration 1200 + stagger 200) + 200ms safety buffer.
        await new Promise((r) => setTimeout(r, 2000));
        if (cancelled || !contentRef.current) return;
        if (process.env.NODE_ENV !== 'production') {
          // biome-ignore lint/suspicious/noConsole: dev only
          console.log('[disint] capturing banner');
        }
        const rect = contentRef.current.getBoundingClientRect();
        const canvas = await html2canvas(contentRef.current, {
          backgroundColor: null,
          scale: window.devicePixelRatio,
          logging: false,
          useCORS: true,
        });
        if (cancelled) return;
        const tex = new CanvasTexture(canvas);
        tex.colorSpace = SRGBColorSpace;
        tex.needsUpdate = true;
        createdTex = tex;
        setTexture(tex);
        setBounds({ width: rect.width, height: rect.height });
        if (process.env.NODE_ENV !== 'production') {
          // biome-ignore lint/suspicious/noConsole: dev only
          console.log(`[disint] captured ok rect=${rect.width}x${rect.height}`);
        }
      } catch (err) {
        // If html2canvas fails (e.g. tainted canvas), fall back to reduced-motion path.
        console.warn('[disintegration] capture failed', err);
        setReducedMotion(true);
      }
    })();

    return () => {
      cancelled = true;
      if (createdTex) createdTex.dispose();
    };
  }, [reducedMotion]);

  // Sentinel ScrollTrigger drives a TARGET progress; useFrame damps the
  // render-side progress toward it so even fast wheel-flicks produce a
  // visible animation duration. Two crucial differences from the original
  // scrub-only code:
  //   1. The trigger is the contentRef itself (sentinel), so adding/removing
  //      content above it doesn't break the trigger window — no hardcoded
  //      scroll positions to maintain.
  //   2. The progress is DAMPED in useFrame, decoupling perception from
  //      scroll velocity: even if scroll skips the trigger zone in 50ms,
  //      the visible dissolve plays out over the damp constant (~300ms).
  //
  // For Act 1 (inside the pinned Act1Trigger), child ScrollTriggers fire
  // mid-pin because their scroll position is reached during pin scrub. We
  // bypass that with the act1ProgressRange path, which subscribes to the
  // descent store's pin progress directly.
  useEffect(() => {
    if (!contentRef.current) return;
    if (reducedMotion) return;

    // Path A — Act 1 pin progress mapped to dissolve progress.
    if (act1ProgressRange) {
      const [from, to] = act1ProgressRange;
      const apply = (act1: number) => {
        const t = (act1 - from) / (to - from);
        progressTargetRef.current = Math.max(0, Math.min(1, t));
      };
      apply(useDescentStore.getState().act1Progress);
      const unsub = useDescentStore.subscribe((s) => apply(s.act1Progress));
      return () => {
        unsub();
      };
    }

    // Path B — sentinel ScrollTrigger for non-pinned banners.
    let trigger: ScrollTrigger | undefined;
    // Two rAFs: child useEffects run before parent's, so we wait one frame
    // for parent ScrollTriggers to register and another for refresh to
    // settle, then create our trigger with positions in the post-pin layout.
    const rafId = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        trigger = ScrollTrigger.create({
          trigger: contentRef.current!,
          start: triggerStart,
          end: triggerEnd,
          scrub: true,
          markers: process.env.NODE_ENV !== 'production',
          id: 'disint',
          onUpdate: (self) => {
            progressTargetRef.current = self.progress;
          },
        });
        if (process.env.NODE_ENV !== 'production' && trigger) {
          // biome-ignore lint/suspicious/noConsole: debug only in dev
          console.log(`[disint] registered start=${trigger.start} end=${trigger.end}`);
        }
      });
    });

    return () => {
      window.cancelAnimationFrame(rafId);
      trigger?.kill();
    };
  }, [triggerStart, triggerEnd, reducedMotion, act1ProgressRange]);

  // Damp loop: drive the smoothed progressRef toward the scroll-side target.
  // Synced with GSAP's ticker so it cooperates with Lenis. The DOM banner's
  // visibility flips when smoothed progress crosses the perceptible
  // threshold, eliminating the double-render flash where both the live
  // banner and the texture overlay would briefly show.
  useEffect(() => {
    if (reducedMotion) return;
    let prevTime = performance.now();
    const tick = () => {
      const now = performance.now();
      const dt = Math.min(0.1, (now - prevTime) / 1000);
      prevTime = now;
      const target = progressTargetRef.current;
      const current = progressRef.current;
      // Exponential damp: the higher dampSmoothing, the faster the catch-up.
      // Equivalent to: x += (target - x) * (1 - exp(-k*dt))
      const k = dampSmoothing;
      const next = current + (target - current) * (1 - Math.exp(-k * dt));
      progressRef.current = next;
      if (contentRef.current) {
        contentRef.current.style.visibility = next > 0.02 ? 'hidden' : 'visible';
      }
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
    };
  }, [dampSmoothing, reducedMotion]);

  // Reduced-motion fallback: simple opacity + translate scrub tied to the
  // contentRef's own ScrollTrigger position. No WebGL.
  useEffect(() => {
    if (!reducedMotion || !contentRef.current) return;
    let trigger: ScrollTrigger | undefined;
    const rafId = window.requestAnimationFrame(() => {
      trigger = ScrollTrigger.create({
        trigger: contentRef.current!,
        start: 'top top+=25%',
        end: 'bottom top+=10%',
        scrub: 1,
        onUpdate: (self) => {
          if (!contentRef.current) return;
          contentRef.current.style.opacity = String(1 - self.progress);
          contentRef.current.style.transform = `translateY(${-REDUCED_MOTION_TRANSLATE * self.progress}px)`;
        },
      });
    });
    return () => {
      window.cancelAnimationFrame(rafId);
      trigger?.kill();
    };
  }, [reducedMotion]);

  return (
    <div ref={containerRef} className="relative">
      {/* contentRef now sizes to its children (no h-full) so the
          ScrollTrigger sentinel measures the actual visible banner geometry,
          not the full section. Parent components are responsible for any
          full-section centering wrappers. */}
      <div
        ref={contentRef}
        className="relative"
        style={
          reducedMotion ? { transition: 'opacity 0.6s ease-out, transform 0.6s ease-out' } : undefined
        }
      >
        {children}
      </div>
      {/* Overlay is mounted as soon as the texture is ready and stays mounted
          for the page's lifetime so the WebGL context + shader program are
          ready BEFORE the first trigger fires. The mesh hides itself when
          smoothed progress is outside (0.02, 0.99), so an idle overlay
          costs only a transparent quad. */}
      {!reducedMotion && texture && bounds && (
        <DisintegrationOverlay
          texture={texture}
          bounds={bounds}
          progressRef={progressRef}
          particleColor={particleColor}
          yDrift={yDrift}
          xJitter={xJitter}
        />
      )}
    </div>
  );
}

function DisintegrationOverlay({
  texture,
  bounds,
  progressRef,
  particleColor,
  yDrift,
  xJitter,
}: {
  texture: Texture;
  bounds: { width: number; height: number };
  progressRef: React.RefObject<number>;
  particleColor: string;
  yDrift: number;
  xJitter: number;
}) {
  // Inline overlay positioned absolute over the banner. The Canvas is sized
  // to the contentRef bounds so the orthographic camera maps 1 world unit
  // to 1 CSS pixel. Inline rendering avoids React-portal-into-transformed-
  // ancestor edge cases that the Act 1 pin introduces — the overlay simply
  // lives alongside contentRef and scrolls with the section. The damp loop
  // in the parent ensures the dissolve plays for ~330ms regardless of
  // scroll velocity, so the user always perceives the animation even when
  // wheeling fast.
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        // Above the ForegroundCanvas (z-30) so the dissolve isn't occluded
        // by the foreground 3D layer's WebGL canvas. The mesh inside hides
        // itself when idle, so an inactive overlay is invisible regardless.
        zIndex: 35,
      }}
    >
      <Canvas
        orthographic
        camera={{ position: [0, 0, 1], zoom: 1, near: 0, far: 10 }}
        gl={{ alpha: true, antialias: true }}
      >
        <DisintegrationMesh
          texture={texture}
          bounds={bounds}
          progressRef={progressRef}
          particleColor={particleColor}
          yDrift={yDrift}
          xJitter={xJitter}
        />
      </Canvas>
    </div>
  );
}

function DisintegrationMesh({
  texture,
  bounds,
  progressRef,
  particleColor,
  yDrift,
  xJitter,
}: {
  texture: Texture;
  bounds: { width: number; height: number };
  progressRef: React.RefObject<number>;
  particleColor: string;
  yDrift: number;
  xJitter: number;
}) {
  const meshRef = useRef<Mesh>(null);
  const matRef = useRef<ShaderMaterial>(null);

  useFrame((state) => {
    if (!matRef.current || !meshRef.current) return;
    const p = progressRef.current ?? 0;
    const u = matRef.current.uniforms;
    if (u.uProgress) u.uProgress.value = p;
    if (u.uTime) u.uTime.value = state.clock.elapsedTime;
    // Hide outside the perceptible band: below 0.02 the dissolve is
    // indistinguishable from the live DOM banner; above 0.99 the alpha
    // decay has already discarded everything.
    meshRef.current.visible = p > 0.02 && p < 0.99;
  });

  return (
    <mesh ref={meshRef} visible>
      <planeGeometry args={[bounds.width, bounds.height, 256, 256]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={DISINTEGRATION_VERTEX}
        fragmentShader={DISINTEGRATION_FRAGMENT}
        transparent
        depthWrite={false}
        depthTest={false}
        uniforms={{
          uTexture: { value: texture },
          uProgress: { value: 0 },
          uTime: { value: 0 },
          uGoldColor: { value: new Color(particleColor) },
          uYDrift: { value: yDrift },
          uXJitter: { value: xJitter },
        }}
      />
    </mesh>
  );
}
