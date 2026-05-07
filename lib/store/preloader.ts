import { create } from 'zustand';

type PreloaderState = {
  progress: number;
  loaded: boolean;
  setProgress: (n: number) => void;
  setLoaded: (b: boolean) => void;
};

export const usePreloaderStore = create<PreloaderState>((set) => ({
  progress: 0,
  loaded: false,
  setProgress: (progress) => set({ progress }),
  setLoaded: (loaded) => set({ loaded }),
}));
