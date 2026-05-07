'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useMemo } from 'react';
import { Color, FogExp2 } from 'three';
import { useDescentStore } from '@/lib/store/descent';

// Exponential fog gated by Act 4 progress so it ONLY kicks in once the
// user begins crossing the water. During Acts 1–3 (a4 = 0) the density is 0
// → no fog at all, and the cobalt sky reads cleanly. As a4 grows toward 1
// (camera fully submerged) the density ramps up to MAX_DENSITY and the
// colour shifts to deep turquoise, creating the sense of a real underwater
// volume around the chain and the editorial copy.
const ABOVE_WATER = new Color('#1B3A4B');
const UNDERWATER = new Color('#0E2D3F');
const MAX_DENSITY = 0.012;

export function AtmosphericFog() {
  const { scene } = useThree();
  const fog = useMemo(() => new FogExp2(ABOVE_WATER.getHex(), 0), []);

  useMemo(() => {
    scene.fog = fog;
  }, [scene, fog]);

  useFrame(() => {
    const a4 = useDescentStore.getState().act4Progress;
    fog.color.copy(ABOVE_WATER).lerp(UNDERWATER, a4);
    fog.density = MAX_DENSITY * a4;
  });

  return null;
}
