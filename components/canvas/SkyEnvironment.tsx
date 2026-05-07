'use client';

import { useMemo } from 'react';
import { BackSide, Color, ShaderMaterial } from 'three';

// Inside-out sphere with a vertical-gradient ShaderMaterial. Drei's <Sky> uses
// physical scattering (turbidity, rayleigh, mie...) and won't accept brand hex
// values, so we hand-roll a simple two-stop gradient driven by world-Y direction.
// The HDRI Environment in SceneRoot/ForegroundCanvas provides the actual scene
// lighting — this mesh is purely the visible backdrop.
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

export function SkyEnvironment() {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          topColor: { value: new Color('#1B3A4B') }, // brand "sea" — Ibiza cobalt overhead
          horizonColor: { value: new Color('#B5D4F4') }, // soft pale-blue horizon
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

  return (
    <mesh material={material} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[100, 32, 16]} />
    </mesh>
  );
}
