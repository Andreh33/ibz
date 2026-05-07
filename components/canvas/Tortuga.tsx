'use client';

import { useAnimations, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { Box3, type Group, MathUtils, Vector3 } from 'three';
import { useDescentStore } from '@/lib/store/descent';

const TURTLE_URL = '/models/tortuganueva.glb';
useGLTF.preload(TURTLE_URL);

// Turtle swims across viewport during Act 5 — kitchen + menu. The crossing
// is AUTONOMOUS (~6 s per pass), not scroll-bound — even if the user pauses,
// the turtle keeps swimming. We only ENABLE the animation while Act 5 is
// engaged (act5Progress > 0); outside that window the turtle parks off-
// screen so it never bleeds into other acts.
//
// World coords:
//   x: lerp(+10, -10) over CYCLE_SECONDS, then loops with a long off-screen
//      pause so the turtle isn't constantly on screen
//   y: -0.2 (slightly below the eye-line so dishes sit centred)
//   z: 2 (in front of dish plates, behind editorial copy via the
//      ForegroundCanvas z-30 layer)
// Rotation Y: π so the model faces left.
const TURTLE_TARGET_LENGTH = 3.2;
const TURTLE_FROM_X = 8;
const TURTLE_TO_X = -8;
const CYCLE_SECONDS = 6;
const PAUSE_SECONDS = 4; // off-screen pause before next pass

// tortuganueva.glb is a self-contained Sketchfab export with proper
// baseColorTexture + normalTexture linked into the single material — no
// material override needed. The previous tortuga.final.glb required
// per-name colour tints because its materials had no pbrMetallicRoughness
// at all. With the new model we keep the imported PBR exactly as exported.

export function Tortuga() {
  const turtle = useGLTF(TURTLE_URL);
  const { actions, names } = useAnimations(turtle.animations, turtle.scene);
  const groupRef = useRef<Group>(null);

  // Normalize the turtle scene to a uniform length we control (Sketchfab
  // exports come in arbitrary world units).
  const transform = useMemo(() => {
    const box = new Box3().setFromObject(turtle.scene);
    const size = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());
    const longest = Math.max(size.x, size.y, size.z, 0.001);
    const scale = TURTLE_TARGET_LENGTH / longest;
    return { center, scale };
  }, [turtle.scene]);

  // No material override on tortuganueva.glb — the imported PBR (with proper
  // baseColorTexture + normalTexture) is what we want. Left as a no-op so
  // the previous broken-model code path is documented in git history.

  // Play the bundled swim animation. Some Sketchfab exports name the clip
  // differently, so play whichever first action exists.
  useEffect(() => {
    if (!names.length) return;
    const action = actions[names[0]];
    action?.reset().play();
    return () => {
      action?.stop();
    };
  }, [actions, names]);

  // Autonomous swim cycle: position x advances on real time, with a pause
  // off-screen between passes so the turtle isn't always present. While the
  // user is outside Act 5 (a5 = 0) we park it far off-screen.
  useFrame((state) => {
    if (!groupRef.current) return;
    const a5 = useDescentStore.getState().act5Progress;
    const t = state.clock.elapsedTime;
    if (a5 < 0.01) {
      groupRef.current.position.x = TURTLE_FROM_X + 5;
      return;
    }
    const total = CYCLE_SECONDS + PAUSE_SECONDS;
    const phase = t % total;
    let x: number;
    if (phase < CYCLE_SECONDS) {
      const k = phase / CYCLE_SECONDS;
      x = MathUtils.lerp(TURTLE_FROM_X, TURTLE_TO_X, k);
    } else {
      // Off-screen left during the pause, ready to re-enter from the right.
      x = TURTLE_FROM_X + 5;
    }
    groupRef.current.position.x = x;
    groupRef.current.position.y = 0 + Math.sin(t * 0.6) * 0.08;
    groupRef.current.position.z = 2 + Math.sin(t * 0.4 + 1.0) * 0.15;
    groupRef.current.rotation.x = Math.sin(t * 0.6) * 0.06;
  });

  // tortuganueva.glb native orientation (verified empirically): rest pose
  // has head pointing +Y (up). Swim animation tilts forward along +Z, so
  // the swimmer's "forward" is +Z in object space. To make the turtle
  // swim right→left across the viewport with the head pointing -X, we
  // rotate X = +π/2 first (tilt the upright pose down to horizontal,
  // mapping +Y → +Z), then Y = -π/2 (rotate that horizontal +Z forward
  // to -X). Three.js Euler order XYZ applies X rotation first.
  return (
    <group ref={groupRef} rotation={[Math.PI / 2, -Math.PI / 2, 0]}>
      <group
        position={[
          -transform.center.x * transform.scale,
          -transform.center.y * transform.scale,
          -transform.center.z * transform.scale,
        ]}
        scale={transform.scale}
      >
        <primitive object={turtle.scene} />
      </group>
    </group>
  );
}
