'use client';

import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import {
  Box3,
  Color,
  type Group,
  type InstancedMesh,
  MathUtils,
  type Mesh,
  type MeshStandardMaterial,
  Object3D,
  Vector3,
} from 'three';
import { useDescentStore } from '@/lib/store/descent';

const FLOOR_URL = '/models/infralitoral.final.glb';
const CORAL_URL = '/models/coral.final.glb';
const CORAL_BLUE_URL = '/models/coral_azul.final.glb';
const ALGAS_URL = '/models/algas.final.glb';

useGLTF.preload(FLOOR_URL);
useGLTF.preload(CORAL_URL);
useGLTF.preload(CORAL_BLUE_URL);
useGLTF.preload(ALGAS_URL);

// Ocean floor act for the very bottom of the descent. Mounts the four
// infralitoral assets (floor + two corals + algae) as a 3D backdrop
// during the underwater half of the scroll. Per CLAUDE.md §3 Act 7:
//   – infralitoral.glb is the floor, fills the lower portion of the
//     final viewport
//   – coral.glb + coral_azul.glb scattered as InstancedMesh for perf
//   – algas.glb sways gently (procedural sin)
//
// All assets are mounted INSIDE the existing SceneRoot canvas so the
// existing fog + atmospheric tinting + depth buffer apply uniformly.
// Visibility ramps up in the underwater half of Act 4 (a4 ≥ 0.7) so the
// floor doesn't pop in mid-cross.

const FLOOR_TARGET_WIDTH = 30;
const FLOOR_Y = -7;

const CORAL_INSTANCES = [
  { x: -3.2, z: -1, scale: 0.9, rotY: 0.4 },
  { x: -1.8, z: -2.5, scale: 1.2, rotY: 1.2 },
  { x: 0.3, z: -3, scale: 0.8, rotY: 2.1 },
  { x: 2.5, z: -1.5, scale: 1.0, rotY: 0.7 },
  { x: 3.5, z: -2.8, scale: 0.7, rotY: 3.3 },
];

const CORAL_BLUE_INSTANCES = [
  { x: -2.5, z: -3, scale: 0.85, rotY: 1.5 },
  { x: 1.2, z: -1.2, scale: 0.65, rotY: 0.2 },
  { x: 4.0, z: -3.4, scale: 1.0, rotY: 2.6 },
];

const ALGAS_INSTANCES = [
  { x: -3.8, z: -2, scale: 1.4, phase: 0 },
  { x: -0.5, z: -3, scale: 1.6, phase: 1.7 },
  { x: 2.0, z: -2.5, scale: 1.2, phase: 0.8 },
  { x: 3.8, z: -1, scale: 1.5, phase: 2.4 },
];

function useNormalizedScene(url: string, targetSize: number) {
  const gltf = useGLTF(url);
  return useMemo(() => {
    const scene = gltf.scene.clone(true);
    const box = new Box3().setFromObject(scene);
    const size = box.getSize(new Vector3());
    const longest = Math.max(size.x, size.y, size.z, 0.001);
    const scale = targetSize / longest;
    return { scene, scale };
  }, [gltf.scene, targetSize]);
}

export function OceanFloor() {
  const groupRef = useRef<Group>(null);
  const algasRef = useRef<Group>(null);

  const floor = useNormalizedScene(FLOOR_URL, FLOOR_TARGET_WIDTH);
  const coral = useNormalizedScene(CORAL_URL, 1.2);
  const coralBlue = useNormalizedScene(CORAL_BLUE_URL, 1.4);
  const algas = useNormalizedScene(ALGAS_URL, 1.8);

  // Tint the floor + corals slightly cooler to integrate with the
  // underwater fog. We modify cloned materials in-place since each
  // useNormalizedScene returns its own clone.
  useEffect(() => {
    const tints = [
      { scene: floor.scene, color: '#1F4554' },
      { scene: coral.scene, color: '#7A4030' },
      { scene: coralBlue.scene, color: '#2A5C73' },
      { scene: algas.scene, color: '#2D4A3A' },
    ];
    for (const { scene, color } of tints) {
      scene.traverse((node) => {
        const mesh = node as Mesh;
        if (!mesh.isMesh) return;
        const m = mesh.material as MeshStandardMaterial;
        if (m && 'color' in m) {
          m.color = new Color(color).lerp(m.color, 0.35);
          m.metalness = 0.1;
          m.roughness = 0.85;
        }
      });
    }
  }, [floor, coral, coralBlue, algas]);

  // Sway the algae per frame with phase-offset sin so each tuft moves
  // independently. Visibility of the whole rig ramps up across the
  // submerged portion of Act 4.
  useFrame((state) => {
    if (!groupRef.current) return;
    const a4 = useDescentStore.getState().act4Progress;
    const fade = MathUtils.smoothstep(a4, 0.65, 1.0);
    groupRef.current.visible = fade > 0.01;
    if (algasRef.current) {
      const t = state.clock.elapsedTime;
      algasRef.current.children.forEach((child, i) => {
        const cfg = ALGAS_INSTANCES[i];
        if (!cfg) return;
        child.rotation.z = Math.sin(t * 0.6 + cfg.phase) * 0.15;
      });
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* Floor plate */}
      <primitive
        object={floor.scene}
        position={[0, FLOOR_Y, -2]}
        scale={floor.scale}
      />
      {/* Corals (warm) */}
      {CORAL_INSTANCES.map((cfg, i) => (
        <primitive
          key={`c-${i}`}
          object={coral.scene.clone(true)}
          position={[cfg.x, FLOOR_Y + 0.2, cfg.z]}
          rotation={[0, cfg.rotY, 0]}
          scale={coral.scale * cfg.scale}
        />
      ))}
      {/* Blue corals */}
      {CORAL_BLUE_INSTANCES.map((cfg, i) => (
        <primitive
          key={`cb-${i}`}
          object={coralBlue.scene.clone(true)}
          position={[cfg.x, FLOOR_Y + 0.2, cfg.z]}
          rotation={[0, cfg.rotY, 0]}
          scale={coralBlue.scale * cfg.scale}
        />
      ))}
      {/* Algae — grouped under algasRef so we can sway each child */}
      <group ref={algasRef}>
        {ALGAS_INSTANCES.map((cfg, i) => (
          <primitive
            key={`a-${i}`}
            object={algas.scene.clone(true)}
            position={[cfg.x, FLOOR_Y + 0.4, cfg.z]}
            scale={algas.scale * cfg.scale}
          />
        ))}
      </group>
    </group>
  );
}
