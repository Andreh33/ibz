'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import {
  DoubleSide,
  MathUtils,
  PlaneGeometry,
  RepeatWrapping,
  TextureLoader,
  Vector3,
} from 'three';
import { Water } from 'three/examples/jsm/objects/Water.js';

// Animated water surface using the official three.js Water example. The
// surface emerges progressively: during the last 25% of Act 3 the plane
// rises from far below the viewport to its bottom edge, during the Act 4
// cross-water beat it continues rising past the camera to settle as a wavy
// ceiling above. By the time the user reaches the editorial headline they
// already perceive the surface as a continuous element rather than a
// sudden pop-in.
//
// Camera frustum at (0,0,12) with FOV 35° clips Y at ±3.78. Combined with
// the 80×80 plane size, the plane is only visible to the camera when its Y
// is above ~ -12 (below that the plane corners fall outside the view
// frustum). So we use:
//   Y = -12 : just barely visible as a thin strip at the bottom of viewport
//             — the start of the emergence beat
//   Y = -3  : a wedge of water across the lower portion of viewport
//             (Act 3 end / Act 4 start)
//   Y =  3  : settled as a wavy ceiling above the camera (Act 4 mid +)
// We keep the plane mesh.visible=false during Acts 1–3 so the WebGL
// reflection pass doesn't run when there's nothing to show.
const WATER_EMERGE_FROM_Y = -12;
const WATER_BOTTOM_Y = -3;
const WATER_SETTLED_Y = 3;
const WATER_SIZE = 80;
// Hardcoded scroll thresholds tuned to the current page geometry (body
// ≈ 11.4k @ 720 viewport). They mark the start of Act 3's last quarter and
// the point at which the cross-water beat is roughly halfway through, so
// the Water plane has finished its rise just as the headline lands.
const EMERGE_START_SCROLL = 4206; // last 25% of Act 3
const EMERGE_END_SCROLL = 4556; // start of Act 4 pin
const CROSS_END_SCROLL = 5556; // midway through Act 4 pin

export function WaterPlane() {
  const { scene } = useThree();
  // Load the normal map once — RepeatWrapping is required for the Water
  // shader's tiling math, otherwise the texture clamps and the surface
  // looks like a single static patch.
  const normalMap = useMemo(() => {
    const t = new TextureLoader().load('/textures/waternormals.jpg', (loaded) => {
      loaded.wrapS = RepeatWrapping;
      loaded.wrapT = RepeatWrapping;
    });
    return t;
  }, []);

  const water = useMemo(() => {
    const geom = new PlaneGeometry(WATER_SIZE, WATER_SIZE);
    return new Water(geom, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: normalMap,
      sunDirection: new Vector3(0.6, 0.85, 0.3).normalize(),
      sunColor: 0xffffff,
      // Brand sea-deep brightened a touch — the Water shader's reflective
      // mirror is dim when viewed from below (we have no above-water scene
      // to reflect), so we lift the base water colour so the ceiling reads
      // as turquoise rather than near-black.
      waterColor: 0x14506b,
      distortionScale: 3.7,
      // Hook into the scene's FogExp2 if present so the water blends with
      // the AtmosphericFog at distance.
      fog: scene.fog !== undefined,
    });
  }, [normalMap, scene.fog]);

  const meshRef = useRef<Water>(water);

  useEffect(() => {
    water.rotation.x = -Math.PI / 2;
    water.position.set(0, WATER_EMERGE_FROM_Y, 0);
    water.visible = false;
    // Water's default front-side faces +Y (up). When we sit underwater
    // looking up, the camera sees the back face — DoubleSide makes the
    // plane render in both directions so the underside is visible too.
    (water.material as { side: number }).side = DoubleSide;
  }, [water]);

  useFrame((_, delta) => {
    // Always animate the ripples — cheap and gives life when the surface
    // is briefly visible during emergence.
    const m = water.material as unknown as { uniforms: { time: { value: number } } };
    m.uniforms.time.value += delta;

    // Drive Y position from raw scroll position so the plane begins
    // emerging during the last quarter of Act 3 and finishes its rise mid-
    // Act 4 cross. Using act4Progress alone wouldn't catch the pre-cross
    // emergence (a4 stays at 0 until the Act 4 pin engages).
    const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;
    if (scrollY < EMERGE_START_SCROLL) {
      water.visible = false;
      return;
    }
    water.visible = true;
    let yPos: number;
    if (scrollY < EMERGE_END_SCROLL) {
      const t = (scrollY - EMERGE_START_SCROLL) / (EMERGE_END_SCROLL - EMERGE_START_SCROLL);
      yPos = MathUtils.lerp(WATER_EMERGE_FROM_Y, WATER_BOTTOM_Y, t);
    } else if (scrollY < CROSS_END_SCROLL) {
      const t = (scrollY - EMERGE_END_SCROLL) / (CROSS_END_SCROLL - EMERGE_END_SCROLL);
      yPos = MathUtils.lerp(WATER_BOTTOM_Y, WATER_SETTLED_Y, t);
    } else {
      yPos = WATER_SETTLED_Y;
    }
    water.position.y = yPos;
  });

  return <primitive ref={meshRef} object={water} />;
}
