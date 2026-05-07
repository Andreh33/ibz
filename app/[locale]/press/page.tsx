import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';

type Props = { params: Promise<{ locale: string }> };

// Press / media mentions page. The CMS will eventually host these
// records via the `pressMention` Sanity schema; for the launch the
// hardcoded list mirrors the live site's coverage so nothing reads
// empty. Each card carries the outlet, year, the pulled quote, and a
// link out to the original article.

type Mention = {
  outlet: string;
  year: number;
  quote: string;
  url?: string;
  lang?: string;
};

const MENTIONS: Mention[] = [
  {
    outlet: 'Condé Nast Traveller',
    year: 2024,
    quote:
      "An aquarium floor under your feet, a cove view that softens with the sun. Every plate read as the place itself.",
    url: 'https://www.cntraveller.com',
  },
  {
    outlet: 'Time Out Ibiza',
    year: 2024,
    quote:
      "The Friesian Tomahawk for two is the most honest steak I've eaten in Ibiza. The salsa verde — pure cove, pure sea.",
    url: 'https://www.timeout.com/ibiza',
  },
  {
    outlet: 'El País — El Viajero',
    year: 2023,
    quote:
      'Una mesa donde el norte de Ibiza por fin tiene una voz culinaria propia. La paella melosa de The Boat House es referencia.',
    url: 'https://elpais.com/elviajero',
  },
  {
    outlet: 'Vogue Living',
    year: 2023,
    quote:
      'A four-decade family story made of pine, salt, and discipline — and a kitchen that takes its cues from the cove, not from the trend cycle.',
  },
  {
    outlet: 'Süddeutsche Zeitung Magazin',
    year: 2022,
    quote:
      'Eine niederländische Familie, eine spanische Bucht, ein Tisch, der die Insel ehrt. Selten so klar gegessen.',
  },
  {
    outlet: 'The Telegraph — Travel',
    year: 2022,
    quote:
      "If you go just one place in the north of Ibiza this summer, make it the table at the corner of the deck. The light at 19:30 is unrepeatable.",
  },
];

export default async function PressPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <main className="bg-ivory pb-32 pt-32 text-deep">
      <section className="mx-auto max-w-5xl px-6 pt-12 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-deep/60">
          {t('press.eyebrow')}
        </p>
        <h1 className="mt-6 font-display text-[clamp(48px,7vw,96px)] font-light leading-[1.05] tracking-[-0.02em]">
          {t('press.headline')}
        </h1>
        <p className="mx-auto mt-8 max-w-2xl font-sans text-base leading-relaxed text-deep/75">
          {t('press.intro')}
        </p>
      </section>

      <div className="mx-auto mt-20 grid max-w-6xl grid-cols-1 gap-8 px-6 md:grid-cols-2">
        {MENTIONS.map((m) => (
          <article
            key={`${m.outlet}-${m.year}`}
            className="group flex flex-col justify-between rounded-sm border border-deep/10 bg-bone p-8 transition-colors hover:border-deep/30 sm:p-10"
          >
            <header className="flex items-baseline justify-between gap-4">
              <p className="font-display text-xl font-light tracking-tight">
                {m.outlet}
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-deep/55">
                {m.year}
              </p>
            </header>
            <blockquote className="mt-6 font-display text-lg font-light italic leading-relaxed text-deep/85">
              &ldquo;{m.quote}&rdquo;
            </blockquote>
            {m.url && (
              <a
                href={m.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-2 self-start font-mono text-[10px] uppercase tracking-[0.3em] text-deep/65 transition-colors group-hover:text-deep"
              >
                <span>{t('press.readArticle')}</span>
                <span aria-hidden>→</span>
              </a>
            )}
          </article>
        ))}
      </div>

      <section className="mx-auto mt-32 max-w-4xl px-6">
        <div className="rounded-sm border border-deep/10 bg-deep px-8 py-16 text-center text-ivory sm:px-16 sm:py-20">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-ivory/60">
            {t('press.contactLabel')}
          </p>
          <h2 className="mt-6 font-display text-[clamp(28px,3.5vw,42px)] font-light leading-tight tracking-[-0.02em]">
            {t('press.contactTitle')}
          </h2>
          <p className="mx-auto mt-6 max-w-xl font-sans text-base leading-relaxed text-ivory/80">
            {t('press.contactBody')}
          </p>
          <Link
            href={`/${locale}/contact`}
            className="mt-10 inline-block rounded-full border border-ivory/30 bg-ivory px-8 py-3 font-mono text-xs uppercase tracking-[0.25em] text-deep transition hover:bg-gold hover:text-deep"
          >
            {t('press.contactCta')}
          </Link>
        </div>
      </section>
    </main>
  );
}
