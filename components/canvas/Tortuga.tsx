'use client';

import { useAnimations, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { Box3, type Group, MathUtils, Vector3 } from 'three';
import { useDescentStore } from '@/lib/store/descent';

const TURTLE_URL = '/models/tortuga.final.glb';
useGLTF.preload(TURTLE_URL);

// Turtle swims across viewport during Act 5 — kitchen + menu. Per CLAUDE.md
// §3 Act 5: enters from the right, swims left across the screen in front of
// the dish content. The GLB ships with a swimming animation we play via
// drei's useAnimations.
//
// World coords:
//   x: lerp(+10, -10, act5Progress)  — far right off-screen → far left off-screen
//   y: -0.2 (slightly below the eye-line so the dishes can sit centred)
//   z: 2 (in front of the editorial menu, behind the dish plates)
// Rotation Y: π so the model faces left (the GLB's native forward is +Z).
const TURTLE_TARGET_LENGTH = 3.2;
const TURTLE_FROM_X = 10;
const TURTLE_TO_X = -10;

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

  // X position scrubs with act5Progress; Y has a gentle bob + slight Z drift
  // so the swim animation reads as "moving through water" rather than just
  // sliding on a horizontal rail.
  useFrame((state) => {
    if (!groupRef.current) return;
    const a5 = useDescentStore.getState().act5Progress;
    const t = state.clock.elapsedTime;
    groupRef.current.position.x = MathUtils.lerp(TURTLE_FROM_X, TURTLE_TO_X, a5);
    groupRef.current.position.y = -0.2 + Math.sin(t * 0.6) * 0.08;
    groupRef.current.position.z = 2 + Math.sin(t * 0.4 + 1.0) * 0.15;
    // Slight pitch as it strokes — looks more lifelike than a flat plane.
    groupRef.current.rotation.x = Math.sin(t * 0.6) * 0.06;
  });

  return (
    <group
      ref={groupRef}
      // Native forward is +Z; rotate π to face -Z (left across the viewport).
      rotation={[0, Math.PI, 0]}
    >
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
