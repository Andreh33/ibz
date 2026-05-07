import { create } from 'zustand';

// Progress 0–1 for each act of the descent. Subscribed by both the DOM
// (ScrollHint fade, eyebrow text) and r3f canvases (Boeing position, sky tint).
// High-frequency writers (ScrollTrigger onUpdate) should call setActNProgress
// directly; readers inside useFrame should pull via useDescentStore.getState()
// to avoid re-rendering React on every scroll tick.
type DescentState = {
  act1Progress: number;
  setAct1Progress: (n: number) => void;
  // act4Progress drives the cross-water moment: water plane Y, sky cobalt →
  // turquoise lerp, anchor/chain underwater tint, caustics + god rays
  // intensity, and the headline fade-in. 0 = above water (cobalt sky), 1 =
  // submerged (turquoise environment).
  act4Progress: number;
  setAct4Progress: (n: number) => void;
};

export const useDescentStore = create<DescentState>((set) => ({
  act1Progress: 0,
  setAct1Progress: (act1Progress) => set({ act1Progress }),
  act4Progress: 0,
  setAct4Progress: (act4Progress) => set({ act4Progress }),
}));
