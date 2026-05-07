'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { DoubleSide, type Mesh, type ShaderMaterial, Vector3 } from 'three';
import { useDescentStore } from '@/lib/store/descent';

// Animated water surface for Act 4 onward. Custom shader replaces the
// imported aguanueva.glb material so we own the wave displacement, fresnel
// reflection, specular highlight, and underside underwater appearance. The
// procedural PlaneGeometry is densely subdivided (128×128) so the vertex
// displacement reads as real waves rather than block translation.
//
// Position: fixed at Y = +5 (above camera). The cross-water moment is
// implemented purely via material.opacity fading in from a4=0.45 → 0.55,
// so we avoid the "fishbowl floor" effect of having a low-poly plane sit
// in the lower viewport during Acts 1–3. Underwater reads as the wavy
// ceiling above the camera.

const WATER_VERTEX = /* glsl */ `
  uniform float uTime;
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying vec2 vUv;

  void main() {
    vUv = uv;

    // Three superposed sine waves with different frequencies / phases so the
    // surface never reads as periodic. Amplitudes summed ≈ 0.35 — enough to
    // create visible peaks/troughs at the camera's zoom without blowing
    // through the camera frustum.
    float wave1 = sin(position.x * 0.4 + uTime * 0.8) * 0.15;
    float wave2 = sin(position.z * 0.6 + uTime * 0.6) * 0.12;
    float wave3 = sin((position.x + position.z) * 0.3 + uTime * 1.1) * 0.08;

    vec3 displaced = position;
    displaced.y += wave1 + wave2 + wave3;

    // Finite-difference normal recalculation so the lighting actually
    // responds to the wave shape. dx and dz are partial derivatives of the
    // height field at the current point; -dx and -dz form the local normal
    // (with up = +1).
    float h = 0.01;
    float dx =
      (sin((position.x + h) * 0.4 + uTime * 0.8) * 0.15
        - sin((position.x - h) * 0.4 + uTime * 0.8) * 0.15) / (2.0 * h)
      + (sin((position.x + h + position.z) * 0.3 + uTime * 1.1) * 0.08
        - sin((position.x - h + position.z) * 0.3 + uTime * 1.1) * 0.08) / (2.0 * h);
    float dz =
      (sin((position.z + h) * 0.6 + uTime * 0.6) * 0.12
        - sin((position.z - h) * 0.6 + uTime * 0.6) * 0.12) / (2.0 * h)
      + (sin((position.x + position.z + h) * 0.3 + uTime * 1.1) * 0.08
        - sin((position.x + position.z - h) * 0.3 + uTime * 1.1) * 0.08) / (2.0 * h);
    // Object-space wave normal, then promote to world-space so fresnel +
    // specular (which use the world-space camera position) are computed in
    // the same coordinate frame.
    vec3 objNormal = normalize(vec3(-dx, 1.0, -dz));
    vNormal = normalize(mat3(modelMatrix) * objNormal);

    vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const WATER_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform vec3 uCameraPos;
  uniform float uOpacity;
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying vec2 vUv;

  // Pseudo-detail normal — two layers of cheap sin lattice that stand in for
  // a tiling normal map. Amplitude small so the macro waves still drive the
  // overall shape; this layer just adds surface "tooth" to the highlights.
  vec3 detailNormal(vec2 uv, float t) {
    vec2 a = uv * 4.0 + vec2(t * 0.03, t * 0.02);
    vec2 b = uv * 8.0 + vec2(-t * 0.04, t * 0.025);
    float nx = sin(a.x * 6.0 + cos(a.y * 5.0)) * 0.5
             + sin(b.x * 7.0 + cos(b.y * 4.0)) * 0.25;
    float nz = cos(a.y * 6.0 + sin(a.x * 5.0)) * 0.5
             + cos(b.y * 7.0 + sin(b.x * 4.0)) * 0.25;
    return normalize(vec3(nx * 0.4, 1.0, nz * 0.4));
  }

  void main() {
    vec3 viewDir = normalize(uCameraPos - vWorldPos);
    vec3 nWave = vNormal;
    vec3 nDetail = detailNormal(vUv, uTime);
    vec3 finalNormal = normalize(nWave + (nDetail - vec3(0.0, 1.0, 0.0)) * 0.5);

    // Fresnel — surfaces facing away from the camera (low dot product) lean
    // toward the sky/specular reflection; surfaces facing the camera show
    // the deeper water colour. ^3 keeps the transition broad and natural.
    float fresnel = pow(1.0 - max(dot(viewDir, finalNormal), 0.0), 3.0);

    vec3 waterDeep = vec3(0.04, 0.16, 0.26);
    vec3 waterShallow = vec3(0.18, 0.42, 0.55);
    vec3 skyTint = vec3(0.55, 0.72, 0.88);

    // Mix between deep and shallow based on local normal Y so peaks read
    // brighter than troughs.
    vec3 base = mix(waterDeep, waterShallow, smoothstep(-0.5, 0.5, finalNormal.y));
    vec3 colour = mix(base, skyTint, fresnel * 0.65);

    // Specular highlight — a soft sun position. pow 80 keeps it tight so the
    // highlights read as glints rather than a broad shine.
    vec3 sunDir = normalize(vec3(0.6, 0.85, 0.3));
    vec3 halfDir = normalize(sunDir + viewDir);
    float spec = pow(max(dot(finalNormal, halfDir), 0.0), 80.0);
    colour += vec3(1.0, 0.96, 0.88) * spec * 0.55;

    gl_FragColor = vec4(colour, uOpacity);
  }
`;

export function WaterPlane() {
  const meshRef = useRef<Mesh>(null);
  const matRef = useRef<ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uCameraPos: { value: new Vector3() },
      uOpacity: { value: 0 },
    }),
    [],
  );

  useFrame((state) => {
    const a4 = useDescentStore.getState().act4Progress;
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      // Camera position changes per frame (especially in dev with debug
      // controls); keep the uniform fresh so fresnel + specular track the
      // viewer accurately.
      (matRef.current.uniforms.uCameraPos.value as Vector3).copy(state.camera.position);
      // Opacity ramp: invisible during Acts 1–3 (a4 = 0). Fades in across the
      // cross-water beat, peaks ~0.85 once submerged so the surface reads as
      // a translucent ceiling without occluding the editorial copy below.
      const t = Math.max(0, Math.min(1, (a4 - 0.45) / 0.15));
      matRef.current.uniforms.uOpacity.value = t * 0.85;
      if (meshRef.current) meshRef.current.visible = t > 0.001;
    }
  });

  return (
    // Tilted ~20° around Y so the surface reads at an angle (avoids the
    // foreshortened mirror look) and positioned at Y = +5 so it sits as a
    // wavy ceiling above the camera once submerged. No "fishbowl floor"
    // visible during Acts 1–3 — opacity gates that.
    <mesh
      ref={meshRef}
      position={[0, 5, 0]}
      rotation={[-Math.PI / 2, 0, -0.35]}
      visible={false}
    >
      <planeGeometry args={[60, 60, 128, 128]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={WATER_VERTEX}
        fragmentShader={WATER_FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={DoubleSide}
      />
    </mesh>
  );
}
