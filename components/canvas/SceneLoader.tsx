'use client';

import { useProgress } from '@react-three/drei';
import { useEffect } from 'react';
import { usePreloaderStore } from '@/lib/store/preloader';

export function SceneLoader() {
  const { progress, active } = useProgress();
  const setProgress = usePreloaderStore((s) => s.setProgress);
  const setLoaded = usePreloaderStore((s) => s.setLoaded);

  useEffect(() => {
    setProgress(progress);
    if (!active && progress >= 100) setLoaded(true);
  }, [progress, active, setProgress, setLoaded]);

  return null;
}
