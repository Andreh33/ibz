'use client';

import { useGLTF } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import { Box3, Color, MeshStandardMaterial, Vector3 } from 'three';

const ANCHOR_URL = '/models/ancla.final.glb';
const CHAIN_URL = '/models/cadenaparaelancla.final.glb';

useGLTF.preload(ANCHOR_URL);
useGLTF.preload(CHAIN_URL);

// Neutral near-black base — the HDRI sunset provides warmth via specular reflection.
// Tinting toward brand-deep cooled the metal too much.
const METAL_BASE = new Color('#1a1a1a');

// World-space target: anchor centered around (0, 0, 0), about 3 units tall
const TARGET_HEIGHT = 3;

// Ring center as a fraction of the anchor's total height (0 = bottom of crown, 1 = very top tip).
// The ring sits just below the small protrusion at the top — empirically ~0.92 from the bottom.
// The chain's bottom link is placed at this Y so it threads INTO the ring with no gap.
const ANCHOR_RING_Y_FRAC = 0.92;

export function AnchorChain() {
  const anchor = useGLTF(ANCHOR_URL);
  const chain = useGLTF(CHAIN_URL);

  const brandMat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: METAL_BASE,
        metalness: 0.9,
        roughness: 0.18,
      }),
    [],
  );

  // Normalize each GLB to scene origin and a sensible size — model coords come from
  // Sketchfab in arbitrary world units (anchor bbox ~ (39, -158, 165))
  const anchorTransform = useMemo(() => {
    const box = new Box3().setFromObject(anchor.scene);
    const size = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());
    const scale = TARGET_HEIGHT / Math.max(size.y, 0.001);
    return { center, scale };
  }, [anchor.scene]);

  const chainTransform = useMemo(() => {
    const box = new Box3().setFromObject(chain.scene);
    const size = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());
    const scale = TARGET_HEIGHT / Math.max(size.y, 0.001);
    return { center, scale };
  }, [chain.scene]);

  useEffect(() => {
    for (const root of [anchor.scene, chain.scene]) {
      root.traverse((node) => {
        if ((node as { isMesh?: boolean }).isMesh) {
          (node as unknown as { material: MeshStandardMaterial }).material = brandMat;
        }
      });
    }
  }, [anchor.scene, chain.scene, brandMat]);

  // Both bboxes, post-centering and post-scaling, span ±TARGET_HEIGHT/2 around origin Y.
  // Ring world Y (in the inner-group frame):
  const anchorRingY = -TARGET_HEIGHT / 2 + TARGET_HEIGHT * ANCHOR_RING_Y_FRAC;
  // Chain's bottom Y in its centered+scaled frame is -TARGET_HEIGHT/2.
  // To make chain's bottom land at anchorRingY, lift the chain group by (anchorRingY + TARGET_HEIGHT/2).
  const chainLiftY = anchorRingY + TARGET_HEIGHT / 2;

  return (
    // CLAUDE.md §4: the anchor sits on the LEFT side of the viewport during the descent.
    // Anchor and chain share the same X/Z so the chain falls vertical onto the ring.
    // x=-4 keeps the shaft clear of the centred wordmark on a 1920px viewport.
    <group position={[-4, 0, 0]}>
      <group
        position={[
          -anchorTransform.center.x * anchorTransform.scale,
          -anchorTransform.center.y * anchorTransform.scale,
          -anchorTransform.center.z * anchorTransform.scale,
        ]}
        scale={anchorTransform.scale}
      >
        <primitive object={anchor.scene} />
      </group>
      <group
        position={[
          -chainTransform.center.x * chainTransform.scale,
          -chainTransform.center.y * chainTransform.scale + chainLiftY,
          -chainTransform.center.z * chainTransform.scale,
        ]}
        scale={chainTransform.scale}
      >
        <primitive object={chain.scene} />
      </group>
    </group>
  );
}
