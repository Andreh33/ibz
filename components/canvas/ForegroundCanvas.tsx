'use client';

import { Environment } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect, useState } from 'react';
import { Boeing } from './Boeing';

// Foreground 3D layer per CLAUDE.md §9 — z-30, sits ABOVE banner text (z-20)
// and the background canvas (z-5). The Boeing in Act 1 and the turtle in Act 5
// will live here. Pointer-events stay disabled so DOM clicks pass through.
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
        {/* Low ambient preserves PBR contrast — high ambient washes out the
            baseColorTexture (Atlas Air livery). The HDRI Environment provides
            directional ambient via image-based lighting, so we don't need much
            artificial ambient on top. */}
        <ambientLight intensity={0.25} />
        <directionalLight position={[5, 8, 5]} intensity={2.5} castShadow={false} />
        {/* Same sunset HDRI as the background canvas, kept off the visible
            background ({background: false}) — the Sky shader in SceneRoot owns
            the visible sky; this is purely for image-based lighting on Boeing. */}
        <Suspense fallback={null}>
          <Environment preset="sunset" background={false} />
        </Suspense>
        <Suspense fallback={null}>
          <Boeing />
        </Suspense>
      </Canvas>
    </div>
  );
}
