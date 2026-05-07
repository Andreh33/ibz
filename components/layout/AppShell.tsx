'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { LenisProvider } from './LenisProvider';
import { Preloader } from './Preloader';
import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';
import { StaticHomeBackground } from './StaticHomeBackground';

// SSR-disabled: r3f / WebGL only meaningful on the client.
const SceneRoot = dynamic(
  () => import('@/components/canvas/SceneRoot').then((m) => m.SceneRoot),
  { ssr: false },
);
const ForegroundCanvas = dynamic(
  () => import('@/components/canvas/ForegroundCanvas').then((m) => m.ForegroundCanvas),
  { ssr: false },
);

// Routes that get the descent canvases + static brand background. Anything
// outside this list is treated as an editorial subpage with header + footer
// against the ivory page bg.
const HOME_ROUTES = /^\/[a-z]{2}\/?$/;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '/';
  const isHome = HOME_ROUTES.test(pathname);

  return (
    <LenisProvider>
      <Preloader />
      {/* Brand-static background photograph — visible on home only, sits
          BELOW the WebGL scene root so it shows through the alpha sky. */}
      {isHome && <StaticHomeBackground />}
      {/* CLAUDE.md §9 z-5 — sky, anchor, chain, water on home; off on
          editorial subpages so the ivory canvas reads cleanly. */}
      {isHome && <SceneRoot />}
      {/* Floating header on every page — transparent over home, solid on
          subpages. */}
      <SiteHeader />
      {/* CLAUDE.md §9 z-20 — wordmark, CTAs, copy. */}
      <div className="relative z-20">{children}</div>
      {/* Site-wide footer for every page. The home descent ends with Act 7
          which scrolls naturally into the footer. */}
      <SiteFooter />
      {/* CLAUDE.md §9 z-30 — Boeing in Act 1, turtle in Act 5, anything
          that must fly OVER text. Mounted last so its fixed/z-30 wins
          stacking. Off on subpages where there's no descent. */}
      {isHome && <ForegroundCanvas />}
    </LenisProvider>
  );
}
