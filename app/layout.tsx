import type { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  // Per next-intl docs, the locale-aware <html> + <body> live in app/[locale]/layout.tsx.
  // This wrapper is required by the App Router but stays passthrough.
  return children;
}
