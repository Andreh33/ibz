'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Color, type ShaderMaterial } from 'three';
import { useDescentStore } from '@/lib/store/descent';

// Full-viewport caustics overlay — fired during the underwater half of Act 4
// onward. Uses a cellular-noise (Voronoi-like) GLSL pattern animated with
// uTime to mimic refracted light shimmering on submerged surfaces. Mixes
// onto the page with mix-blend-mode: screen via the overlay div, so it
// brightens the underlying scene without darkening it.
//
// Activation curve: smoothstep(0.5, 1.0, act4Progress) — fully off until
// the user crosses the surface (a4 = 0.5), reaches full at the end of
// the Act 4 pin (a4 = 1.0).
//
// Cost: one fullscreen quad with cheap snoise, runs only when overlay is
// mounted (always-on for now, but the Canvas's own frameloop can be set to
// 'demand' if needed). Color cream-gold (#F0E6CC) at ~15–20 % alpha so it
// reads as light-on-water rather than a solid tint.

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uTint;
  varying vec2 vUv;

  // Cheap pseudo-Voronoi: two layers of sin/cos lattice sums approximating
  // shimmering light cells. Faster than true Voronoi and visually close
  // enough for a translucent overlay.
  float caustic(vec2 uv, float t) {
    vec2 p = uv * 8.0;
    float v = 0.0;
    for (int i = 0; i < 3; i++) {
      float fi = float(i) + 1.0;
      vec2 q = p + vec2(sin(t * 0.5 + fi * 1.3), cos(t * 0.4 + fi * 0.7));
      v += sin(q.x * fi) * cos(q.y * fi);
    }
    v = abs(v) / 3.0;
    // Sharpen highlights so the pattern reads as discrete light cells.
    v = pow(v, 1.6);
    return v;
  }

  void main() {
    // Time-shifted second layer adds parallax movement and breaks the
    // periodicity of the first.
    float a = caustic(vUv, uTime);
    float b = caustic(vUv * 1.3 + vec2(0.5, 0.3), uTime * 0.8 + 4.0);
    float c = clamp((a + b) * 0.6, 0.0, 1.0);
    // Vignette toward the corners so the overlay doesn't fight the editorial
    // copy in the centre of the viewport.
    vec2 d = vUv - 0.5;
    float v = 1.0 - smoothstep(0.35, 0.7, length(d));
    float alpha = c * v * uIntensity * 0.6;
    gl_FragColor = vec4(uTint, alpha);
  }
`;

function CausticsMesh() {
  const matRef = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: 0 },
      uTint: { value: new Color('#F0E6CC') },
    }),
    [],
  );

  useFrame((state) => {
    if (!matRef.current) return;
    const a4 = useDescentStore.getState().act4Progress;
    // Smoothstep from the cross-water moment to the end of the pin.
    const target = Math.max(0, Math.min(1, (a4 - 0.5) / 0.5));
    const u = matRef.current.uniforms;
    if (u.uTime) u.uTime.value = state.clock.elapsedTime;
    if (u.uIntensity) u.uIntensity.value = target;
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={VERTEX}
        fragmentShader={FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

export function CausticsOverlay() {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const onChange = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: 10, mixBlendMode: 'screen' }}
    >
      <Canvas
        orthographic
        camera={{ position: [0, 0, 1], near: 0, far: 10, zoom: 1 }}
        gl={{ alpha: true, antialias: false }}
        dpr={[1, 1.5]}
        frameloop={hidden ? 'demand' : 'always'}
      >
        <CausticsMesh />
      </Canvas>
    </div>
  );
}
