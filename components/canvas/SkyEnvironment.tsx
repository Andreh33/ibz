'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { BackSide, Color, ShaderMaterial } from 'three';
import { useDescentStore } from '@/lib/store/descent';

// Inside-out sphere with a vertical-gradient ShaderMaterial. Drei's <Sky> uses
// physical scattering (turbidity, rayleigh, mie...) and won't accept brand hex
// values, so we hand-roll a simple two-stop gradient driven by world-Y direction.
// The HDRI Environment in SceneRoot/ForegroundCanvas provides the actual scene
// lighting — this mesh is purely the visible backdrop.
//
// During Act 4 the gradient lerps from cobalt-sky to turquoise-underwater so
// the camera-cross-water moment reads as a real environment shift, not just
// a foreground overlay.
const VERTEX = /* glsl */ `
  varying vec3 vWorldPosition;
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const FRAGMENT = /* glsl */ `
  varying vec3 vWorldPosition;
  uniform vec3 topColor;
  uniform vec3 horizonColor;
  uniform float exponent;
  void main() {
    float h = normalize(vWorldPosition).y;
    float t = pow(max(h, 0.0), exponent);
    vec3 color = mix(horizonColor, topColor, t);
    gl_FragColor = vec4(color, 1.0);
  }
`;

// Sky palette — Ibiza cobalt overhead, soft pale-blue horizon.
const SKY_TOP = new Color('#1B3A4B');
const SKY_HORIZON = new Color('#B5D4F4');
// Underwater palette — deeper Mediterranean turquoise overhead, lighter
// turquoise-cyan toward the surface (which during Act 4 visually reads as
// "looking up through water at the sun").
const UW_TOP = new Color('#0A3B4D');
const UW_HORIZON = new Color('#3A8DAD');

export function SkyEnvironment() {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          topColor: { value: SKY_TOP.clone() },
          horizonColor: { value: SKY_HORIZON.clone() },
          exponent: { value: 0.6 },
        },
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        side: BackSide,
        depthWrite: false,
        depthTest: false,
      }),
    [],
  );
  const topRef = useRef(material.uniforms.topColor.value as Color);
  const horRef = useRef(material.uniforms.horizonColor.value as Color);

  useFrame(() => {
    const a4 = useDescentStore.getState().act4Progress;
    topRef.current.copy(SKY_TOP).lerp(UW_TOP, a4);
    horRef.current.copy(SKY_HORIZON).lerp(UW_HORIZON, a4);
  });

  return (
    <mesh material={material} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[100, 32, 16]} />
    </mesh>
  );
}
