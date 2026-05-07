'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AdditiveBlending,
  type BufferGeometry,
  Color,
  type InstancedMesh,
  MathUtils,
  Object3D,
  type ShaderMaterial,
} from 'three';
import { useDescentStore } from '@/lib/store/descent';

// Volumetric god rays approximation. Replaces the earlier flat SVG trapezoids
// with shader-driven additive planes — each ray is a tilted PlaneGeometry
// rendered with AdditiveBlending so they pile light onto the underwater
// scene rather than darkening it. The fragment shader applies:
//   – exponential vertical gradient (bright at top, dim at bottom)
//   – horizontal smoothstep edges (no hard rectangle borders)
//   – per-ray time-shifted flicker (uTime + phase)
// And per-frame we apply lateral oscillation to the ray's group X so each
// shaft "breathes" asynchronously, mimicking refracted sunlight on a moving
// water surface. The whole rig fades in over act4Progress 0.5 → 1.

const RAY_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const RAY_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uPhase;
  uniform float uIntensity;
  uniform vec3 uTint;
  varying vec2 vUv;

  void main() {
    // Vertical falloff — bright at top of ray (origin near water surface),
    // tapers exponentially toward the bottom. pow ramp 2.5 sharpens the
    // fall so the ray reads as light "punching down" from above.
    float vert = pow(1.0 - vUv.y, 2.5);

    // Horizontal soft edges — smoothstep at both sides for ~10% of width
    // so the ray fades into the surrounding water rather than hard-cutting.
    float horiz = smoothstep(0.0, 0.10, vUv.x) * smoothstep(0.0, 0.10, 1.0 - vUv.x);

    // Asynchronous flicker — slow sin with per-ray phase offset gives each
    // shaft its own breathing rhythm.
    float flicker = 0.85 + sin(uTime * 1.3 + uPhase) * 0.15;

    float a = vert * horiz * flicker * uIntensity;
    gl_FragColor = vec4(uTint, a);
  }
`;

type RayConfig = {
  x: number; // world-X centre of the ray
  width: number;
  height: number;
  angleDeg: number;
  phase: number;
  oscAmp: number; // lateral oscillation amplitude
};

// Five to seven shafts per spec, distributed asymmetrically across the
// viewport with varied widths/angles. World units roughly match the
// orthographic camera's frustum (set to ±1 zoom-1 here, but we use a
// fullscreen ortho with manual sizing — see <Canvas orthographic />
// further down for the projection).
const RAYS: RayConfig[] = [
  { x: -1.55, width: 0.18, height: 2.6, angleDeg: -8, phase: 0.0, oscAmp: 0.025 },
  { x: -0.95, width: 0.32, height: 2.6, angleDeg: 4, phase: 1.3, oscAmp: 0.04 },
  { x: -0.30, width: 0.22, height: 2.6, angleDeg: -3, phase: 2.7, oscAmp: 0.03 },
  { x: 0.20, width: 0.40, height: 2.6, angleDeg: 6, phase: 4.1, oscAmp: 0.045 },
  { x: 0.85, width: 0.20, height: 2.6, angleDeg: 12, phase: 5.5, oscAmp: 0.03 },
  { x: 1.40, width: 0.28, height: 2.6, angleDeg: -5, phase: 6.9, oscAmp: 0.035 },
];

function Ray({ cfg }: { cfg: RayConfig }) {
  const matRef = useRef<ShaderMaterial>(null);
  const groupRef = useRef<Object3D>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPhase: { value: cfg.phase },
      uIntensity: { value: 0 },
      uTint: { value: new Color('#E8F4FF') },
    }),
    [cfg.phase],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const a4 = useDescentStore.getState().act4Progress;
    // Smoothstep fade: invisible until cross moment, full by end of pin.
    const fade = MathUtils.smoothstep(Math.max(0, Math.min(1, (a4 - 0.5) / 0.5)), 0, 1);
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = t;
      matRef.current.uniforms.uIntensity.value = fade;
    }
    if (groupRef.current) {
      // Lateral oscillation per ray, asynchronous (phase-offset).
      groupRef.current.position.x =
        cfg.x + Math.sin(t * 0.4 + cfg.phase) * cfg.oscAmp;
    }
  });

  return (
    <group
      ref={groupRef as React.RefObject<Object3D>}
      position={[cfg.x, 0.6, 0]}
      rotation={[0, 0, MathUtils.degToRad(cfg.angleDeg)]}
    >
      <mesh>
        <planeGeometry args={[cfg.width, cfg.height]} />
        <shaderMaterial
          ref={matRef}
          vertexShader={RAY_VERTEX}
          fragmentShader={RAY_FRAGMENT}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

// Suspended particles — small white dots drifting slowly upward + lateral
// sway so the underwater volume reads as a real medium rather than a flat
// painted backdrop. 40 instances, varied scales, varied Z so the ray light
// can rake across them and give a depth cue.
const PARTICLE_COUNT = 40;

type ParticleSeed = {
  x: number;
  y: number;
  z: number;
  scale: number;
  speed: number;
  phase: number;
};

function Particles() {
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const seeds = useMemo<ParticleSeed[]>(() => {
    const arr: ParticleSeed[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      arr.push({
        x: (Math.random() - 0.5) * 3.4,
        y: -0.6 + Math.random() * 1.6,
        z: -0.8 + Math.random() * 1.2,
        scale: 0.02 + Math.random() * 0.04,
        speed: 0.04 + Math.random() * 0.06,
        phase: Math.random() * Math.PI * 2,
      });
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    const a4 = useDescentStore.getState().act4Progress;
    // Particles only meaningful underwater.
    const fade = Math.max(0, Math.min(1, (a4 - 0.55) / 0.45));
    meshRef.current.visible = fade > 0.01;
    for (let i = 0; i < seeds.length; i++) {
      const s = seeds[i];
      // Slow upward drift with per-particle wrap so the column stays
      // populated even after several seconds.
      const drift = (t * s.speed) % 2.0;
      const y = s.y + drift - 1.0;
      const x = s.x + Math.sin(t * 0.3 + s.phase) * 0.05;
      dummy.position.set(x, y, s.z);
      dummy.scale.setScalar(s.scale * fade);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined as unknown as BufferGeometry, undefined, PARTICLE_COUNT]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#F0F8FF" transparent opacity={0.4} depthWrite={false} />
    </instancedMesh>
  );
}

export function GodRaysCanvas() {
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
      style={{ zIndex: 12 }}
    >
      <Canvas
        orthographic
        // Frustum width 4, height 2.4 → x in [-2,2], y in [-1.2, 1.2]. Rays
        // sit slightly above centre (y=0.6) so most of their length falls
        // through the lower viewport, mimicking sunlight hitting the surface
        // up top and shafts descending past the camera.
        camera={{ position: [0, 0, 1], near: 0.1, far: 10, zoom: 1, left: -2, right: 2, top: 1.2, bottom: -1.2 }}
        gl={{ alpha: true, antialias: false, premultipliedAlpha: true }}
        dpr={[1, 1.5]}
        frameloop={hidden ? 'demand' : 'always'}
      >
        {RAYS.map((cfg, i) => (
          <Ray key={i} cfg={cfg} />
        ))}
        <Particles />
      </Canvas>
    </div>
  );
}
