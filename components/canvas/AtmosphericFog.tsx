'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useMemo } from 'react';
import { Color, FogExp2 } from 'three';
import { useDescentStore } from '@/lib/store/descent';

// Exponential fog whose colour interpolates with act4Progress so the
// horizon-cut between the sky shader and the empty space below the camera
// disappears, AND the underwater volume picks up a deep-turquoise tint that
// makes the chain + light shafts feel surrounded by water rather than
// hovering in a void. Density 0.012 is conservative — visually noticeable
// at the horizon edge without obscuring the central scene.
const ABOVE_WATER = new Color('#1B3A4B');
const UNDERWATER = new Color('#0E2D3F');
const FOG_DENSITY = 0.012;

export function AtmosphericFog() {
  const { scene } = useThree();
  const fog = useMemo(() => new FogExp2(ABOVE_WATER.getHex(), FOG_DENSITY), []);

  // Attach once on mount; we mutate fog.color per frame.
  useMemo(() => {
    scene.fog = fog;
  }, [scene, fog]);

  useFrame(() => {
    const a4 = useDescentStore.getState().act4Progress;
    fog.color.copy(ABOVE_WATER).lerp(UNDERWATER, a4);
  });

  return null;
}
