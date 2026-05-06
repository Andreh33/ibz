import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { LenisProvider } from '@/components/layout/LenisProvider';
import { routing } from '@/lib/i18n/routing';
import '@/styles/globals.css';

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
    <html lang={locale}>
      <body className="bg-ivory text-deep antialiased">
        <NextIntlClientProvider>
          <LenisProvider>{children}</LenisProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
