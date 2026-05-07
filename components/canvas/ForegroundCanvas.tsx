'use client';

import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect, useState } from 'react';
import { Boeing } from './Boeing';
import { Tortuga } from './Tortuga';

// Foreground 3D layer per CLAUDE.md §9 — z-30, sits ABOVE banner text (z-20)
// and the background canvas (z-5). The Boeing in Act 1 and the turtle in Act 5
// will live here. Pointer-events stay disabled so DOM clicks pass through.
//
// Lighting deliberately omits drei's <Environment> HDRI here. A uniform HDRI
// flood washed the Boeing's painted livery against the cobalt skydome — the
// indirect light from the HDRI lifted every surface toward white-cream and
// erased the navy/gold contrast. Painted aircraft skin reads better with a
// physical three-point setup whose colors echo the scene (sky-blue fill,
// warm sun key, sea rim). The BackgroundCanvas keeps its HDRI sunset for the
// metallic anchor + chain — those genuinely need image-based reflections.
export function ForegroundCanvas() {
  const [hidden, setHidden] = useState(false);
  const [eventSource, setEventSource] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setEventSource(document.body);
    const onChange = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0" style={{ zIndex: 30 }}>
      <Canvas
        dpr={[1, 1.75]}
        frameloop={hidden ? 'demand' : 'always'}
        camera={{ position: [0, 0, 12], fov: 35, near: 0.1, far: 200 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        eventSource={eventSource ?? undefined}
        eventPrefix="client"
      >
        {/* Two-light setup, deliberately conservative.
            Ambient 1.4 white = lifts the texture toward visible without saturating
            (sum of all lights stays below the clamp point on the white fuselage).
            Directional 0.4 warm = just enough for a gentle lit/shadow side so the
            plane reads as 3D. Total ~1.8 < 2.0 = navy/gold on the texture
            survive without bleaching to cream. */}
        <ambientLight intensity={1.4} color="#FFFFFF" />
        <directionalLight
          position={[6, 8, 4]}
          intensity={0.4}
          color="#FFF4E0"
          castShadow={false}
        />
        <Suspense fallback={null}>
          <Boeing />
        </Suspense>
        <Suspense fallback={null}>
          <Tortuga />
        </Suspense>
      </Canvas>
    </div>
  );
}
