'use client';

import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import {
  Box3,
  type Group,
  MathUtils,
  type Material,
  type Mesh,
  type MeshStandardMaterial,
  SRGBColorSpace,
  Vector3,
} from 'three';
import { useDescentStore } from '@/lib/store/descent';

// Self-contained user-supplied GLB with 5 materials preserved + 1024×1024 JPEG
// texture embedded. The previous boeing.final.glb had its 5 materials merged
// into 1 by gltf-transform optimize's `--palette` default and authored extreme
// metalness=1/roughness=1 onto the merge, washing the livery out under any
// PBR renderer.
const BOEING_URL = '/models/boeing/nuevoboeing.glb';
useGLTF.preload(BOEING_URL);

// Target nose-to-tail length in world units. Camera frustum at z=0 is ~13 wide
// at 1920×1080 fov 35, so 6 units ≈ 46% of viewport width when centered.
const TARGET_LENGTH = 6;

// Buffer past the visible edge so the plane fully clears before pin releases.
const OFFSCREEN_BUFFER = 4;

export function Boeing() {
  const ref = useRef<Group>(null);
  const gltf = useGLTF(BOEING_URL);
  const { viewport } = useThree();

  // Clone the GLB scene + every material before mutation. useGLTF caches the
  // gltf object globally; mutating gltf.scene's materials in place was unreliable
  // because drei reuses the cached scene across remounts and any inherited
  // environment from sibling canvases stayed glued to the material instance.
  // scene.clone(true) gives us a private hierarchy, material.clone() per mesh
  // gives us materials no other consumer touches.
  const clonedScene = useMemo(() => {
    const cloned = gltf.scene.clone(true);
    cloned.traverse((node) => {
      const mesh = node as Mesh;
      if (!mesh.isMesh || !mesh.material) return;
      const list: Material[] = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      const newMats = list.map((m) => {
        const c = (m as MeshStandardMaterial).clone() as MeshStandardMaterial;
        // Opacity / depth — keep canvas compositing clean so the foreground
        // canvas doesn't bleed-through onto the background canvas.
        c.transparent = false;
        c.opacity = 1;
        c.depthWrite = true;
        c.depthTest = true;
        c.alphaTest = 0;
        // PBR rebalance — let the baseColorTexture dominate.
        // - metalness 0.1: aircraft paint is mostly diffuse, not metallic.
        // - roughness 0.65: real airline livery is matte; high roughness kills
        //   specular highlights so the texture colors read true.
        // - envMapIntensity 0.15: ForegroundCanvas mounts no <Environment>, so
        //   this only governs residual reflectivity from any inherited envMap.
        if ('metalness' in c) {
          c.metalness = 0.1;
          c.roughness = 0.65;
          c.envMapIntensity = 0.15;
          if (c.map) c.map.colorSpace = SRGBColorSpace;
        }
        c.needsUpdate = true;
        return c;
      });
      if (Array.isArray(mesh.material)) {
        mesh.material = newMats;
      } else if (newMats[0]) {
        mesh.material = newMats[0];
      }
    });
    return cloned;
  }, [gltf.scene]);

  // Boeing GLB nose-tail axis is Z with the nose at +Z. Rotation Y = +π/2 maps
  // local +Z onto world +X so the plane points RIGHT for L→R flight.
  const transform = useMemo(() => {
    const box = new Box3().setFromObject(clonedScene);
    const size = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());
    const sc = TARGET_LENGTH / Math.max(size.z, 0.001);
    return { center, scale: sc };
  }, [clonedScene]);

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
        <primitive object={clonedScene} />
      </group>
    </group>
  );
}
