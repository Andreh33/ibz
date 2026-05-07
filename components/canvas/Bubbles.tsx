'use client';

import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { Box3, type Group, type Mesh, MeshStandardMaterial, Vector3 } from 'three';
import { useDescentStore } from '@/lib/store/descent';

const BUBBLES_URL = '/models/burbujas.final.glb';
useGLTF.preload(BUBBLES_URL);

// Ambient rising bubbles for Acts 6 + 7. The GLB ships with its own
// keyframe animation; we just play it. Visibility is gated by
// act4Progress so bubbles only appear once the user is submerged.
//
// We instance the GLB three times across the scene at different X / Z
// positions so the underwater volume reads as populated rather than
// empty. Each instance uses a clone of the scene (own animation mixer)
// to keep the GLB's bake intact.
const INSTANCES = [
  { x: -3.5, y: -2, z: -2, scale: 1.0, phase: 0 },
  { x: 4, y: -3, z: -4, scale: 0.7, phase: 1.5 },
  { x: 0.5, y: -1.5, z: -1, scale: 0.85, phase: 0.8 },
];

export function Bubbles() {
  const gltf = useGLTF(BUBBLES_URL);
  const groupRef = useRef<Group>(null);

  // Scale the imported GLB once and repaint to a translucent pearl tone
  // so the bubbles read as glass beads rather than solid spheres.
  const { centeredScene, scale } = useMemo(() => {
    const cloned = gltf.scene.clone(true);
    const box = new Box3().setFromObject(cloned);
    const size = box.getSize(new Vector3());
    const longest = Math.max(size.x, size.y, size.z, 0.001);
    const targetSize = 1.6;
    const s = targetSize / longest;
    cloned.traverse((node) => {
      const mesh = node as Mesh;
      if (!mesh.isMesh) return;
      mesh.material = new MeshStandardMaterial({
        color: '#A8D8E8',
        transparent: true,
        opacity: 0.35,
        roughness: 0.05,
        metalness: 0.1,
        depthWrite: false,
      });
    });
    return { centeredScene: cloned, scale: s };
  }, [gltf.scene]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const a4 = useDescentStore.getState().act4Progress;
    // Visible only once submerged. Smooth in across the cross-water beat.
    const fade = Math.max(0, Math.min(1, (a4 - 0.5) / 0.3));
    groupRef.current.visible = fade > 0.01;
    if (!groupRef.current.visible) return;
    const t = state.clock.elapsedTime;
    // Each bubble cluster rises slowly with phase-offset oscillation.
    groupRef.current.children.forEach((child, i) => {
      const cfg = INSTANCES[i];
      if (!cfg) return;
      child.position.y = cfg.y + ((t * 0.4 + cfg.phase) % 6) - 1;
      child.position.x = cfg.x + Math.sin(t * 0.3 + cfg.phase) * 0.2;
    });
  });

  return (
    <group ref={groupRef} visible={false}>
      {INSTANCES.map((cfg, i) => (
        <primitive
          key={i}
          object={centeredScene.clone(true)}
          position={[cfg.x, cfg.y, cfg.z]}
          scale={scale * cfg.scale}
        />
      ))}
    </group>
  );
}
