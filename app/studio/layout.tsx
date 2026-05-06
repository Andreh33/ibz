import type { ReactNode } from 'react';

// Sanity Studio renders its own <html>/<body> via NextStudio. Override the locale layout.
export const metadata = { title: 'Studio — The Boat House' };

export default function StudioLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
