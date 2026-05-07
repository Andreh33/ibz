'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { routing } from '@/lib/i18n/routing';

const NAV_KEYS = ['menu', 'about', 'gallery', 'contact'] as const;
const LOCALE_LABELS: Record<string, string> = {
  en: 'EN', es: 'ES', de: 'DE', fr: 'FR', nl: 'NL', it: 'IT',
};

// Editorial site footer. Five columns at desktop: brand, navigation,
// hours/contact, language picker, copyright. Stays in the deep / abyss
// palette so the page closes the way the descent itself does — back to
// the ocean floor's mood.
export function SiteFooter() {
  const t = useTranslations();
  const params = useParams();
  const locale = (params?.locale as string) ?? 'en';
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-30 bg-deep text-ivory">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 py-20 sm:grid-cols-2 md:grid-cols-4 md:gap-8 md:py-24">
        <div className="md:col-span-1">
          <p className="font-display text-2xl font-light tracking-tight">The Boat House</p>
          <p className="mt-3 max-w-[24ch] font-sans text-sm text-ivory/70">
            {t('footer.tagline')}
          </p>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ivory/55">
            {t('footer.navigateLabel')}
          </p>
          <ul className="mt-4 flex flex-col gap-2">
            {NAV_KEYS.map((key) => (
              <li key={key}>
                <Link
                  href={`/${locale}/${key}`}
                  className="font-display text-base text-ivory transition-colors hover:text-gold"
                >
                  {t(`nav.${key}`)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ivory/55">
            {t('footer.findUsLabel')}
          </p>
          <address className="mt-4 not-italic font-sans text-sm leading-relaxed text-ivory/85">
            Calle del Calo 12<br />
            Cala San Vicente<br />
            07810 Sant Joan de Labritja<br />
            Eivissa, Illes Balears
          </address>
          <p className="mt-4 font-sans text-sm text-ivory/85">
            <a href="tel:+34971334273" className="transition-colors hover:text-gold">
              +34 971 334 273
            </a>
          </p>
          <p className="font-sans text-sm text-ivory/85">
            <a href="mailto:hello@theboathouseibiza.com" className="transition-colors hover:text-gold">
              hello@theboathouseibiza.com
            </a>
          </p>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ivory/55">
            {t('footer.languagesLabel')}
          </p>
          <ul className="mt-4 flex flex-wrap gap-3">
            {routing.locales.map((loc) => (
              <li key={loc}>
                <Link
                  href={`/${loc}`}
                  className="font-mono text-[11px] uppercase tracking-[0.25em] text-ivory/70 transition-colors hover:text-gold"
                  style={{ color: loc === locale ? '#C9A86B' : undefined }}
                >
                  {LOCALE_LABELS[loc]}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.3em] text-ivory/45">
            {t('footer.hoursLabel')}
          </p>
          <p className="mt-2 font-sans text-sm text-ivory/85">
            {t('footer.hoursValue')}
          </p>
        </div>
      </div>

      <div className="border-t border-ivory/10">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-3 px-6 py-6 text-xs text-ivory/55 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono uppercase tracking-[0.25em]">
            © {year} The Boat House Ibiza. {t('footer.rights')}
          </p>
          <p className="font-mono uppercase tracking-[0.25em]">
            {t('footer.craftedIn')} Cala San Vicente
          </p>
        </div>
      </div>
    </footer>
  );
}
