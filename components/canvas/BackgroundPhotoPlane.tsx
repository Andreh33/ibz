'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { type Mesh, type MeshBasicMaterial, SRGBColorSpace, TextureLoader } from 'three';
import { useDescentStore } from '@/lib/store/descent';

// Static brand-cover photograph rendered as a Three.js plane INSIDE the
// SceneRoot canvas. Sits in front of the SkyEnvironment sphere (the
// cobalt gradient), behind the anchor + chain via the shared depth
// buffer — the descending anchor naturally occludes parts of the photo.
//
// Camera fixed at (0,0,12) looking along -Z. Plane positioned at z=-30
// (further from camera than anchor at z=0) → anchor renders in front.
// Default depth test + write so the layering behaves like a real 3D
// scene with the photo as a backdrop.

const PHOTO_URL = '/images/fondohome.webp';

// Plane sized to fill the camera's view at z = -30. Camera at (0,0,12)
// FOV 35° → at distance 42 the visible vertical extent is 2*42*tan(17.5°)
// ≈ 26.5. Width with 16:9-ish coverage ≈ 50. We oversize to 80×45 so the
// plane bleeds past the viewport edges on every aspect ratio.
const PLANE_WIDTH = 80;
const PLANE_HEIGHT = 45;
const PLANE_Z = -30;

export function BackgroundPhotoPlane() {
  const meshRef = useRef<Mesh>(null);
  const matRef = useRef<MeshBasicMaterial>(null);

  // sRGB colour-space tag so Three.js gamma-corrects the photo at sample
  // time (Three's default render pipeline expects linear textures; jpeg/
  // webp from a designer's machine are sRGB-encoded).
  const texture = useMemo(() => {
    const tex = new TextureLoader().load(PHOTO_URL);
    tex.colorSpace = SRGBColorSpace;
    return tex;
  }, []);

  // Per-frame opacity ramp tied to act4Progress. Photo fully visible
  // during the sky descent (Acts 1-3), fades during the cross-water
  // beat, gone once submerged.
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
      // Plane normal +Z faces the camera at z=12 with no rotation.
      // z=-30 puts it well behind the anchor (z=0) so the depth test
      // naturally orders them correctly.
      position={[0, 0, PLANE_Z]}
      // renderOrder -0.5 sits AFTER the SkyEnvironment sphere
      // (renderOrder -1) but BEFORE the default-renderOrder anchor +
      // chain. With normal depth test/write the photo composes like a
      // real 3D backdrop.
      renderOrder={-0.5}
      frustumCulled={false}
    >
      <planeGeometry args={[PLANE_WIDTH, PLANE_HEIGHT]} />
      <meshBasicMaterial
        ref={matRef}
        map={texture}
        transparent
        toneMapped={false}
      />
    </mesh>
  );
}
