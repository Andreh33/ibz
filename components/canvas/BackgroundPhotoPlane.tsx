'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { type Mesh, type MeshBasicMaterial, SRGBColorSpace, TextureLoader } from 'three';
import { useDescentStore } from '@/lib/store/descent';

// Static brand-cover photograph rendered as a Three.js plane INSIDE the
// SceneRoot canvas. Sits between the SkyEnvironment sphere (renderOrder
// -1, the cobalt gradient) and the anchor + chain (default renderOrder),
// so the photo reads as the actual sky/cove backdrop while the descending
// anchor passes in front of it. Camera is fixed at (0,0,12) so the plane
// stays static in viewport without any runtime tracking.
//
// Why a 3D plane and not an HTML <img>:
//   – DOM <img> at z-0 lives behind the WebGL canvas. The cobalt sky
//     shader is opaque, so the photo got hidden. Making the sky
//     transparent broke the underwater fade.
//   – As a 3D plane in the same canvas, the photo composes with the sky
//     shader (drawn first) and the metallic anchor (drawn after) using
//     the same depth buffer the rest of the scene uses.
//
// Activation: visible during Acts 1–3 (a4 = 0). Fades out as the user
// crosses into Act 4 — the warm exterior shot would clash with the
// turquoise underwater environment.

const PHOTO_URL = '/images/fondohome.webp';

// Plane sized to fill the camera's view at z = -30. Camera at (0,0,12)
// FOV 35° → at distance 42 the visible vertical extent is 2*42*tan(17.5°)
// ≈ 26.5. Width with 16:9-ish coverage ≈ 50. We oversize to 60×34 so the
// plane bleeds past the viewport edges on every aspect ratio.
const PLANE_WIDTH = 60;
const PLANE_HEIGHT = 34;
const PLANE_Z = -30;

export function BackgroundPhotoPlane() {
  const meshRef = useRef<Mesh>(null);
  const matRef = useRef<MeshBasicMaterial>(null);

  // sRGB colour-space tag so Three.js gamma-corrects the photo at sample
  // time (Three's default render pipeline expects linear textures; jpeg/
  // webp from a designer's machine are sRGB-encoded). Without this the
  // photo reads washed-out and de-saturated.
  const texture = useMemo(() => {
    const tex = new TextureLoader().load(PHOTO_URL);
    tex.colorSpace = SRGBColorSpace;
    return tex;
  }, []);

  // Per-frame opacity ramp tied to act4Progress (0 above water → 1 fully
  // submerged). Photo is fully visible during the sky descent, fades out
  // during the cross-water beat, gone by the time the user is underwater.
  useFrame(() => {
    if (!matRef.current) return;
    const a4 = useDescentStore.getState().act4Progress;
    const t = Math.max(0, Math.min(1, (a4 - 0.25) / 0.4));
    matRef.current.opacity = 1 - t;
    if (meshRef.current) meshRef.current.visible = matRef.current.opacity > 0.001;
  });

  return (
    <mesh
      ref={meshRef}
      // Camera is fixed at (0,0,12) facing -Z. PlaneGeometry's default
      // normal is +Z so it naturally faces the camera with no rotation
      // needed. Position at (0, 0, PLANE_Z) so it sits behind the
      // anchor (z≈0) but in front of the SkyEnvironment sphere
      // (radius 100).
      position={[0, 0, PLANE_Z]}
      // renderOrder 0 sits AFTER the sky sphere (-1, drawn first as
      // backdrop) and BEFORE the anchor/chain (default 1+). With
      // depthTest off the plane simply layers on top of the sky and the
      // anchor draws on top of it via its own depth test.
      renderOrder={0}
      frustumCulled={false}
    >
      <planeGeometry args={[PLANE_WIDTH, PLANE_HEIGHT]} />
      <meshBasicMaterial
        ref={matRef}
        map={texture}
        transparent
        depthWrite={false}
        depthTest={false}
        toneMapped={false}
      />
    </mesh>
  );
}
