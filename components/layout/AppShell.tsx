'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';
import { LenisProvider } from './LenisProvider';
import { Preloader } from './Preloader';

// SSR-disabled: r3f / WebGL only meaningful on the client.
const SceneRoot = dynamic(
  () => import('@/components/canvas/SceneRoot').then((m) => m.SceneRoot),
  { ssr: false },
);

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <LenisProvider>
      <Preloader />
      <SceneRoot />
      {/* Banner / text content stacking context — CLAUDE.md §9 z 20 */}
      <div className="relative z-20">{children}</div>
    </LenisProvider>
  );
}
