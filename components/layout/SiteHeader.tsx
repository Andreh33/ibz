'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { routing } from '@/lib/i18n/routing';

// Floating site header. Stays transparent over the home descent (so the
// scroll-driven 3D narrative reads cleanly), gains a backdrop-blur + thin
// hairline as soon as the user is on a subpage OR has scrolled past the
// hero on home. Locale switcher + reservation CTA sit on the right.
//
// Brand voice: Boat House wordmark in display serif (peso 300), all caps
// nav links in mono with wide letter-spacing, gold accent on the active
// link. The CTA pill stays bone/ivory on every state for clear contrast.

const NAV_KEYS = ['menu', 'about', 'gallery', 'contact'] as const;

const LOCALE_LABELS: Record<string, string> = {
  en: 'EN',
  es: 'ES',
  de: 'DE',
  fr: 'FR',
  nl: 'NL',
  it: 'IT',
};

export function SiteHeader() {
  const t = useTranslations('nav');
  const tHome = useTranslations('home');
  const pathname = usePathname() ?? '/';
  const params = useParams();
  const locale = (params?.locale as string) ?? 'en';
  const isHome = pathname === `/${locale}` || pathname === '/';
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Headers float on the home descent so the wordmark and Acts breathe;
  // on subpages they're full-bleed against ivory.
  const solid = !isHome || scrolled;

  return (
    <header
      className="pointer-events-auto fixed inset-x-0 top-0 z-50 transition-colors duration-500"
      style={{
        background: solid
          ? 'rgba(14, 32, 44, 0.55)'
          : 'transparent',
        backdropFilter: solid ? 'blur(14px)' : 'none',
        borderBottom: solid
          ? '1px solid rgba(245, 240, 230, 0.08)'
          : '1px solid transparent',
      }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:h-20">
        <Link
          href={`/${locale}`}
          className="font-display text-xl font-light tracking-tight text-ivory transition-opacity hover:opacity-80 sm:text-2xl"
        >
          The Boat House
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_KEYS.map((key) => {
            const href = `/${locale}/${key}`;
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={key}
                href={href}
                className="font-mono text-[11px] uppercase tracking-[0.25em] text-ivory/85 transition-colors hover:text-ivory"
                style={{
                  color: isActive ? '#C9A86B' : undefined,
                }}
              >
                {t(key)}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 sm:gap-5">
          <LocaleSwitch currentLocale={locale} pathname={pathname} />
          <Link
            href={`/${locale}/contact`}
            className="hidden rounded-full border border-ivory/30 bg-ivory/95 px-5 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-deep transition hover:bg-ivory sm:inline-block"
          >
            {tHome('cta')}
          </Link>
          <button
            type="button"
            aria-label="Toggle menu"
            className="md:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            <svg width="22" height="14" viewBox="0 0 22 14" fill="none" aria-hidden>
              <line x1="0" y1="2" x2="22" y2="2" stroke="#F5F0E6" strokeWidth="1.4" />
              <line x1="0" y1="12" x2="22" y2="12" stroke="#F5F0E6" strokeWidth="1.4" />
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-ivory/10 bg-deep/85 px-6 py-6 md:hidden" style={{ backdropFilter: 'blur(16px)' }}>
          <ul className="flex flex-col gap-4">
            {NAV_KEYS.map((key) => (
              <li key={key}>
                <Link
                  href={`/${locale}/${key}`}
                  onClick={() => setOpen(false)}
                  className="font-mono text-xs uppercase tracking-[0.3em] text-ivory/90"
                >
                  {t(key)}
                </Link>
              </li>
            ))}
            <li className="pt-4">
              <Link
                href={`/${locale}/contact`}
                onClick={() => setOpen(false)}
                className="inline-block rounded-full bg-ivory/95 px-5 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-deep"
              >
                {tHome('cta')}
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}

function LocaleSwitch({ currentLocale, pathname }: { currentLocale: string; pathname: string }) {
  const [open, setOpen] = useState(false);

  // Strip the locale prefix from pathname so we can re-mount it under the
  // selected locale (e.g. /en/menu → /es/menu).
  const stripped = pathname.replace(new RegExp(`^/${currentLocale}`), '') || '/';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="font-mono text-[10px] uppercase tracking-[0.25em] text-ivory/85 transition-colors hover:text-ivory"
      >
        {LOCALE_LABELS[currentLocale] ?? currentLocale.toUpperCase()}
      </button>
      {open && (
        <ul
          className="absolute right-0 top-full mt-3 w-24 overflow-hidden rounded-md border border-ivory/15 bg-deep/95 backdrop-blur"
        >
          {routing.locales.map((loc) => (
            <li key={loc}>
              <Link
                href={`/${loc}${stripped}`}
                onClick={() => setOpen(false)}
                className="block px-4 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-ivory/85 transition-colors hover:bg-ivory/10 hover:text-ivory"
                style={{ color: loc === currentLocale ? '#C9A86B' : undefined }}
              >
                {LOCALE_LABELS[loc]}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
