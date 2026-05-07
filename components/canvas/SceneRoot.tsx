'use client';

import { Environment } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect, useRef, useState } from 'react';
import { AnchorChain } from './AnchorChain';
import { SceneLoader } from './SceneLoader';
import { SkyEnvironment } from './SkyEnvironment';
import { WaterPlane } from './WaterPlane';

export function SceneRoot() {
  const [hidden, setHidden] = useState(false);
  const [eventSource, setEventSource] = useState<HTMLElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEventSource(document.body);
    const onChange = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);

  return (
    <div
      ref={wrapperRef}
      aria-hidden
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: 5 }}
    >
      <Canvas
        dpr={[1, 1.75]}
        frameloop={hidden ? 'demand' : 'always'}
        camera={{ position: [0, 0, 12], fov: 35, near: 0.1, far: 200 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        eventSource={eventSource ?? undefined}
        eventPrefix="client"
      >
        <SceneLoader />
        <SkyEnvironment />
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 8, 5]} intensity={2.5} castShadow={false} />
        {/* HDRI feeds PBR reflections only (background={false}); the procedural
            <Sky> above paints the actual canvas background. */}
        <Suspense fallback={null}>
          <Environment preset="sunset" background={false} />
        </Suspense>
        <Suspense fallback={null}>
          <AnchorChain />
        </Suspense>
        <Suspense fallback={null}>
          <WaterPlane />
        </Suspense>
      </Canvas>
    </div>
  );
}
