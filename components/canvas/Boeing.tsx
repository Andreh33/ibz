'use client';

import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { Box3, type Group, MathUtils, type Material, Vector3 } from 'three';
import { useDescentStore } from '@/lib/store/descent';

const BOEING_URL = '/models/boeing/boeing.final.glb';
useGLTF.preload(BOEING_URL);

// Target nose-to-tail length in world units. Camera frustum at z=0 is ~13 wide
// at 1920×1080 fov 35, so 6 units = roughly 46% of viewport width when centered.
const TARGET_LENGTH = 6;

// Buffer past the visible edge so the plane fully clears before pin releases.
const OFFSCREEN_BUFFER = 4;

export function Boeing() {
  const ref = useRef<Group>(null);
  const gltf = useGLTF(BOEING_URL);
  const { viewport } = useThree();

  // Force every mesh's material to fully opaque + write+test depth. Without this,
  // gltf-transform's optimize pass occasionally leaves alphaMode hints that three.js
  // interprets as `transparent: true` — that breaks DOM-canvas compositing and the
  // background canvas (chain, sky) bleeds through the fuselage.
  useEffect(() => {
    gltf.scene.traverse((node) => {
      const maybeMesh = node as unknown as { isMesh?: boolean; material?: Material | Material[] };
      if (!maybeMesh.isMesh || !maybeMesh.material) return;
      const list = Array.isArray(maybeMesh.material) ? maybeMesh.material : [maybeMesh.material];
      for (const m of list) {
        m.transparent = false;
        m.opacity = 1;
        m.depthWrite = true;
        m.depthTest = true;
        m.alphaTest = 0;
        m.needsUpdate = true;
      }
    });
  }, [gltf.scene]);

  // Boeing GLB nose-tail axis is Z with the nose at +Z (verified via the QA side
  // render in step 1). Rotation Y = +π/2 maps local +Z onto world +X so the plane
  // points RIGHT, matching its left-to-right travel direction.
  const transform = useMemo(() => {
    const box = new Box3().setFromObject(gltf.scene);
    const size = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());
    // Length lives along Z in this GLB; scale to TARGET_LENGTH on Z.
    const scale = TARGET_LENGTH / Math.max(size.z, 0.001);
    return { center, scale };
  }, [gltf.scene]);

  useFrame(() => {
    if (!ref.current) return;
    const p = useDescentStore.getState().act1Progress;
    const halfWidth = viewport.width / 2 + OFFSCREEN_BUFFER;
    ref.current.position.x = MathUtils.lerp(-halfWidth, halfWidth, p);
  });

  return (
    <group ref={ref} position={[0, 1.5, 2]} rotation={[0, Math.PI / 2, 0]}>
      <group
        position={[
          -transform.center.x * transform.scale,
          -transform.center.y * transform.scale,
          -transform.center.z * transform.scale,
        ]}
        scale={transform.scale}
      >
        <primitive object={gltf.scene} />
      </group>
    </group>
  );
}
