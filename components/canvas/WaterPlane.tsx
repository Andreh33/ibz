'use client';

import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import {
  Box3,
  Color,
  type Group,
  MathUtils,
  type Mesh,
  MeshStandardMaterial,
  Vector3,
} from 'three';
import { useDescentStore } from '@/lib/store/descent';

const WATER_URL = '/models/aguanueva.glb';
useGLTF.preload(WATER_URL);

// Water-surface plane positioned along the descending camera path. CLAUDE.md
// §3 Act 4 specifies a tilted plane (~20° around Y) that the camera passes
// through during the scroll-pinned cross. The actual world-Y placement here
// puts the water surface just above the anchor's terminal descent, so the
// chain visually breaches the surface and the anchor sinks below.
//
// The agua.glb shipped from the Sketchfab pipeline already comes with a
// reasonable PBR material (refraction-tinted blue-green). We override only:
//   – metalness/roughness (push toward water-like specular)
//   – color tint (lerp deeper turquoise as the user descends in Act 4)
//   – transparency so the underwater world reads through
//
// World coords. The camera is fixed at (0, 0, 12) looking at the origin so
// world Y = 0 is the viewport's vertical centre. The narrative is "camera
// descending through water", which since we don't actually translate the
// camera, we simulate by moving the water plane UP across the camera path:
//   a4 = 0   → Y = -5  (water far below camera; hidden during Acts 1–3)
//   a4 = 0.5 → Y =  0  (water meets camera — the cross moment)
//   a4 = 1.0 → Y =  5  (water above camera; we are submerged below it)
//
// Rotation Y: -0.35 rad (~20°) so the surface reads at a slight angle —
// avoids the foreshortened mirror look you get from a plane facing the
// camera dead-on.
const WATER_TARGET_WIDTH = 60; // generous so the plane fills any viewport
const WATER_ROTATION_Y = -0.35;
const WATER_FROM_Y = -5;
const WATER_TO_Y = 5;
const WATER_BASE_COLOR = new Color('#3A8DAD'); // Mediterranean turquoise
const WATER_DEEP_COLOR = new Color('#0F4A66'); // deeper underwater hue

export function WaterPlane() {
  const water = useGLTF(WATER_URL);
  const groupRef = useRef<Group>(null);
  const matRef = useRef<MeshStandardMaterial | null>(null);

  // Normalize the water GLB so its widest dimension hits WATER_TARGET_WIDTH.
  // The Sketchfab export coords are arbitrary; we measure once and apply.
  const transform = useMemo(() => {
    const box = new Box3().setFromObject(water.scene);
    const size = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());
    const widest = Math.max(size.x, size.z, 0.001);
    const scale = WATER_TARGET_WIDTH / widest;
    return { center, scale };
  }, [water.scene]);

  // Replace the imported material with a tunable PBR one we own. Saves a few
  // Sketchfab textures we don't need for the surface effect (we want the
  // shader-overlay caustics + god rays to do the work, not bake-in normals).
  useEffect(() => {
    const mat = new MeshStandardMaterial({
      color: WATER_BASE_COLOR.clone(),
      metalness: 0.4,
      roughness: 0.25,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      envMapIntensity: 0.8,
    });
    matRef.current = mat;
    water.scene.traverse((node) => {
      if ((node as { isMesh?: boolean }).isMesh) {
        (node as Mesh).material = mat;
      }
    });
  }, [water.scene]);

  // Per-frame: drive Y position + colour tint from act4Progress so the
  // surface arrives at viewport-centre exactly at the cross-water beat.
  useFrame(() => {
    if (!groupRef.current) return;
    const a4 = useDescentStore.getState().act4Progress;
    groupRef.current.position.y = MathUtils.lerp(WATER_FROM_Y, WATER_TO_Y, a4);

    if (matRef.current) {
      const c = matRef.current.color;
      c.copy(WATER_BASE_COLOR).lerp(WATER_DEEP_COLOR, a4);
      // Opacity ramps up slightly as the user enters the volume so the
      // surface reads as a defined boundary during the cross.
      matRef.current.opacity = 0.55 + a4 * 0.2;
    }
  });

  return (
    <group ref={groupRef} rotation={[0, WATER_ROTATION_Y, 0]}>
      <group
        position={[
          -transform.center.x * transform.scale,
          -transform.center.y * transform.scale,
          -transform.center.z * transform.scale,
        ]}
        scale={transform.scale}
      >
        <primitive object={water.scene} />
      </group>
    </group>
  );
}
