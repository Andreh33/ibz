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
const ForegroundCanvas = dynamic(
  () => import('@/components/canvas/ForegroundCanvas').then((m) => m.ForegroundCanvas),
  { ssr: false },
);

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <LenisProvider>
      <Preloader />
      {/* CLAUDE.md §9 z-5 — sky, anchor, chain, future water/floor/corals */}
      <SceneRoot />
      {/* CLAUDE.md §9 z-20 — wordmark, CTAs, copy */}
      <div className="relative z-20">{children}</div>
      {/* CLAUDE.md §9 z-30 — Boeing in Act 1, turtle in Act 5, anything that must
          fly OVER text. Mounted last so its fixed/z-30 wins the stacking order. */}
      <ForegroundCanvas />
    </LenisProvider>
  );
}
