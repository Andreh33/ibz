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
import { usePreloaderStore } from '@/lib/store/preloader';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

type Props = {
  children: ReactNode;
  /** GSAP ScrollTrigger start string. Defaults to the spec value. */
  triggerStart?: string;
  /** Scroll distance in px over which the dissolve plays from progress 0 → 1. */
  scrollDistance?: number;
  /** Hex color for the disintegrating particles. */
  particleColor?: string;
  /** Max upward drift in pixels at progress 1. */
  yDrift?: number;
  /** Max horizontal jitter in pixels at progress 1. */
  xJitter?: number;
  /** Optional CSS selector for the trigger element. Defaults to this component's
   *  own container. */
  triggerSelector?: string;
  /** Absolute scroll position (px) where progress=0. Use this when the children
   *  live inside a pinned ScrollTrigger parent — child triggers don't get
   *  automatic pin-spacing compensation, so pass a hardcoded position. */
  startScroll?: number;
  /** Absolute scroll position (px) where progress=1. */
  endScroll?: number;
};

const REDUCED_MOTION_TRANSLATE = 12;

export function DisintegrationTransition({
  children,
  triggerStart = 'top top-=20%',
  scrollDistance = 600,
  particleColor = '#C9A86B',
  yDrift = 320,
  xJitter = 70,
  triggerSelector,
  startScroll,
  endScroll,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
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

  // ScrollTrigger drives progress + DOM visibility. Direct style mutation (no
  // React state) so the visibility flip is instant and synchronous with scroll.
  //
  // Deferred to rAF: React runs child useEffects BEFORE parent useEffects, so
  // the parent Act1Trigger pin isn't registered yet when this effect fires
  // synchronously. We need the parent's pin to exist first so ScrollTrigger
  // accounts for the pin spacer when computing this trigger's start/end.
  useEffect(() => {
    if (!containerRef.current) return;
    const triggerEl = triggerSelector
      ? (document.querySelector(triggerSelector) as HTMLElement | null)
      : containerRef.current;
    if (!triggerEl) return;

    let trigger: ScrollTrigger | undefined;
    const rafId = window.requestAnimationFrame(() => {
      const useAbsolute =
        typeof startScroll === 'number' && typeof endScroll === 'number';
      trigger = ScrollTrigger.create({
        ...(useAbsolute
          ? { start: startScroll, end: endScroll }
          : {
              trigger: triggerEl,
              start: triggerStart,
              end: `${triggerStart}+=${scrollDistance}`,
            }),
        scrub: 1,
        markers: process.env.NODE_ENV !== 'production',
        id: 'disint',
        onUpdate: (self) => {
          progressRef.current = self.progress;
          if (contentRef.current && !reducedMotion) {
            contentRef.current.style.visibility =
              self.progress > 0.005 ? 'hidden' : 'visible';
          }
          if (reducedMotion && contentRef.current) {
            contentRef.current.style.opacity = String(1 - self.progress);
            contentRef.current.style.transform = `translateY(${-REDUCED_MOTION_TRANSLATE * self.progress}px)`;
          }
        },
      });
      ScrollTrigger.refresh();
      if (process.env.NODE_ENV !== 'production' && trigger) {
        // biome-ignore lint/suspicious/noConsole: debug only in dev
        console.log(`[disint] start=${trigger.start} end=${trigger.end}`);
      }
    });

    return () => {
      window.cancelAnimationFrame(rafId);
      trigger?.kill();
    };
  }, [triggerStart, scrollDistance, reducedMotion, triggerSelector, startScroll, endScroll]);

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <div
        ref={contentRef}
        className="relative h-full w-full"
        style={
          reducedMotion ? { transition: 'opacity 0.6s ease-out, transform 0.6s ease-out' } : undefined
        }
      >
        {children}
      </div>
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
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{ zIndex: 25 }} // between banner z-20 and foreground 3D z-30
    >
      <Canvas orthographic camera={{ position: [0, 0, 1], near: 0, far: 10 }} gl={{ alpha: true }}>
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
    meshRef.current.visible = p > 0.005 && p < 0.995;
  });

  return (
    <mesh ref={meshRef} visible={false}>
      <planeGeometry args={[bounds.width, bounds.height, 256, 256]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={DISINTEGRATION_VERTEX}
        fragmentShader={DISINTEGRATION_FRAGMENT}
        transparent
        depthWrite={false}
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
