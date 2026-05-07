import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';

type Props = { params: Promise<{ locale: string }> };

const CHAPTERS = ['1985', '2005', '2016', '2025'] as const;

const CHAPTER_IMAGES: Record<(typeof CHAPTERS)[number], string> = {
  '1985': '/images/About-1-1080.avif',
  '2005': '/images/About-11-1-1080.avif',
  '2016': '/images/About-12-1080.avif',
  '2025': '/images/About-5-1080.avif',
};

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <main className="bg-ivory pb-32 pt-32 text-deep">
      <section className="mx-auto max-w-5xl px-6 pt-12 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-deep/60">
          {t('about.eyebrow')}
        </p>
        <h1 className="mt-6 font-display text-[clamp(48px,7vw,96px)] font-light leading-[1.05] tracking-[-0.02em]">
          {t('about.headline')}
        </h1>
        <p className="mx-auto mt-8 max-w-2xl font-sans text-base leading-relaxed text-deep/75">
          {t('about.intro')}
        </p>
      </section>

      <div className="mx-auto mt-16 max-w-6xl px-6">
        <div className="relative aspect-[16/7] overflow-hidden rounded-sm">
          <img
            src="/images/GR2C2341-scaled-1600.avif"
            alt=""
            className="h-full w-full object-cover"
            loading="eager"
          />
        </div>
      </div>

      <div className="mx-auto mt-24 max-w-5xl px-6">
        {CHAPTERS.map((year, idx) => (
          <article
            key={year}
            className="border-t border-deep/10 py-16 first:border-t-0 sm:py-24"
          >
            <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-16">
              <div className={`md:col-span-5 ${idx % 2 === 1 ? 'md:order-last' : ''}`}>
                <div className="relative aspect-[4/5] overflow-hidden rounded-sm">
                  <img
                    src={CHAPTER_IMAGES[year]}
                    alt={t(`about.chapters.${year}.title`)}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
              <div className="md:col-span-7">
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-deep/55">
                  {t(`about.chapters.${year}.year`)}
                </p>
                <h2 className="mt-4 font-display text-[clamp(28px,3.8vw,52px)] font-light tracking-[-0.02em]">
                  {t(`about.chapters.${year}.title`)}
                </h2>
                <p className="mt-6 max-w-prose font-sans text-base leading-relaxed text-deep/80">
                  {t(`about.chapters.${year}.body`)}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <section className="mx-auto mt-32 max-w-5xl border-t border-deep/10 px-6 pt-24">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-16">
          <div className="md:col-span-5">
            <div className="relative aspect-[3/4] overflow-hidden rounded-sm">
              <img
                src="/images/About-12-1080.avif"
                alt={t('about.chefName')}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
          <div className="md:col-span-7">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-deep/55">
              {t('about.chefLabel')}
            </p>
            <h2 className="mt-4 font-display text-[clamp(32px,4.5vw,56px)] font-light tracking-[-0.02em]">
              {t('about.chefName')}
            </h2>
            <p className="mt-6 max-w-prose font-sans text-base leading-relaxed text-deep/80">
              {t('about.chefBio')}
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href={`/${locale}/menu`}
                className="rounded-full border border-deep/20 px-6 py-2.5 font-mono text-[11px] uppercase tracking-[0.25em] text-deep transition hover:bg-deep hover:text-ivory"
              >
                {t('nav.menu')}
              </Link>
              <Link
                href={`/${locale}/contact`}
                className="rounded-full bg-deep px-6 py-2.5 font-mono text-[11px] uppercase tracking-[0.25em] text-ivory transition hover:bg-gold hover:text-deep"
              >
                {t('home.cta')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
