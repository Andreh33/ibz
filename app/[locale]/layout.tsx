import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { Fraunces } from 'next/font/google';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { routing } from '@/lib/i18n/routing';
import '@/styles/globals.css';

// Self-hosted via next/font (no FOIT, automatic preload, zero runtime CDN call).
// Subsets latin + latin-ext cover en, es, de, fr, nl, it. Weights 300 + 400 only —
// CLAUDE.md §2 prescribes those two display weights and no others.
const fraunces = Fraunces({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400'],
  display: 'swap',
  variable: '--font-fraunces',
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale} className={fraunces.variable}>
      <body className="bg-ivory text-deep antialiased">
        <NextIntlClientProvider>
          <AppShell>{children}</AppShell>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
