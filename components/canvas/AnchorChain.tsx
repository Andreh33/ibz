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
  MeshStandardMaterial,
  Object3D,
  TorusGeometry,
  Vector3,
} from 'three';

const ANCHOR_URL = '/models/ancla.final.glb';
useGLTF.preload(ANCHOR_URL);

// Neutral near-black base — the HDRI sunset provides warmth via specular reflection.
const METAL_BASE = new Color('#1a1a1a');

// World-space target: anchor centered around (0, 0, 0), about 3 units tall
const TARGET_HEIGHT = 3;

// Ring center as a fraction of the anchor's total height (0 = bottom, 1 = top tip).
const ANCHOR_RING_Y_FRAC = 0.92;

// Scroll-driven descent — CLAUDE.md §3 / §4.
// During Act 1 (scroll 0..1500, the Boeing pin) the anchor stays at its initial
// world Y. From scroll PIN_END onwards it linearly descends through Acts 2..7.
const PIN_END = 1500;
const DESCENT_PX = 4000;
const DESCENT_FROM_Y = 0;
const DESCENT_TO_Y = -8;

// Procedural chain link — interlocking torus instances.
// The static GLB at public/models/cadenaparaelancla.final.glb bakes all links
// into a single fixed-length geometry that can't stretch with the descending
// anchor; the chain visually disconnected as the anchor moved down. Solution:
// build the chain dynamically from a torus template, instancing as many links
// as fit between the anchor ring and a fixed CHAIN_TOP_Y above the viewport.
const LINK_MAJOR_R = 0.18;
const LINK_TUBE_R = 0.04;
const LINK_SPACING = 0.32; // tighter than 2*(MAJOR+TUBE) so adjacent links interlock
const MAX_LINKS = 50;
const MIN_LINKS = 8;

// Top of chain stays at a fixed world Y (just off-screen above the viewport)
// so the chain reads as anchored to the sky / boeing cargo. As the anchor
// descends, more links spawn to fill the growing gap.
const CHAIN_TOP_Y = 5;

export function AnchorChain() {
  const anchor = useGLTF(ANCHOR_URL);
  const anchorGroupRef = useRef<Group>(null);
  const chainRef = useRef<InstancedMesh>(null);
  const linkDummy = useMemo(() => new Object3D(), []);

  const brandMat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: METAL_BASE,
        metalness: 0.9,
        roughness: 0.18,
      }),
    [],
  );

  const linkGeometry = useMemo(
    () => new TorusGeometry(LINK_MAJOR_R, LINK_TUBE_R, 8, 14),
    [],
  );

  // Ring world Y in the centered+scaled anchor's local frame (≈ 1.26 with
  // TARGET_HEIGHT=3, ANCHOR_RING_Y_FRAC=0.92). Used to attach the chain
  // bottom to the anchor ring as the anchor descends.
  const anchorRingLocalY = -TARGET_HEIGHT / 2 + TARGET_HEIGHT * ANCHOR_RING_Y_FRAC;

  // Normalize anchor GLB to scene origin and TARGET_HEIGHT — model coords come
  // from Sketchfab in arbitrary world units (anchor bbox ~ (39, -158, 165)).
  const anchorTransform = useMemo(() => {
    const box = new Box3().setFromObject(anchor.scene);
    const size = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());
    const scale = TARGET_HEIGHT / Math.max(size.y, 0.001);
    return { center, scale };
  }, [anchor.scene]);

  useEffect(() => {
    anchor.scene.traverse((node) => {
      if ((node as { isMesh?: boolean }).isMesh) {
        (node as unknown as { material: MeshStandardMaterial }).material = brandMat;
      }
    });
  }, [anchor.scene, brandMat]);

  // Per-frame: descend the anchor and rebuild the chain instance matrices so the
  // chain stays connected from the anchor ring up to CHAIN_TOP_Y.
  useFrame((state) => {
    if (!anchorGroupRef.current || !chainRef.current) return;

    const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;
    const t = Math.max(0, Math.min(1, (scrollY - PIN_END) / DESCENT_PX));
    const anchorY = MathUtils.lerp(DESCENT_FROM_Y, DESCENT_TO_Y, t);
    anchorGroupRef.current.position.y = anchorY;

    // Bottom link's Y in this group's local frame = anchor's group Y + ring offset.
    const ringWorldY = anchorY + anchorRingLocalY;
    const span = CHAIN_TOP_Y - ringWorldY;
    const linkCount = Math.min(
      MAX_LINKS,
      Math.max(MIN_LINKS, Math.ceil(span / LINK_SPACING)),
    );

    const time = state.clock.elapsedTime;

    for (let i = 0; i < linkCount; i++) {
      linkDummy.position.set(0, ringWorldY + i * LINK_SPACING, 0);
      // Lateral sway with phase offset per link → travelling-wave / soft-whip
      // feel. (i/linkCount) weight keeps the bottom link near the anchor still
      // and concentrates the motion toward the top end of the chain.
      linkDummy.position.x += Math.sin(time * 0.7 + i * 0.35) * 0.12 * (i / linkCount);
      // Alternate 90° around Y so adjacent links sit perpendicular — the
      // characteristic interlock of a real chain.
      linkDummy.rotation.set(0, (i % 2) * (Math.PI / 2), 0);
      linkDummy.updateMatrix();
      chainRef.current.setMatrixAt(i, linkDummy.matrix);
    }
    chainRef.current.count = linkCount;
    chainRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    // CLAUDE.md §4: the anchor sits on the LEFT side of the viewport during the descent.
    // x=-4 keeps the shaft clear of the centred wordmark on a 1920px viewport.
    <group position={[-4, 0, 0]}>
      {/* Descending group — its Y is updated per-frame from scroll position. */}
      <group ref={anchorGroupRef}>
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
      </group>
      {/* Chain links live in the parent group (not the descending one). Their
          per-frame position is computed in absolute Y so they stretch from the
          descending anchor ring up to CHAIN_TOP_Y. */}
      <instancedMesh ref={chainRef} args={[linkGeometry, brandMat, MAX_LINKS]} />
    </group>
  );
}
