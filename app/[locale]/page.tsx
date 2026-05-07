import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { DisintegrationTransition } from '@/components/canvas/DisintegrationTransition';
import { Act1Trigger } from '@/components/layout/Act1Trigger';
import { ScrollHint } from '@/components/layout/ScrollHint';
import { WordmarkReveal } from '@/components/layout/WordmarkReveal';

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <main>
      {/* === ACT 1 — Sky + Boeing crossing + scroll-locked pin === */}
      <Act1Trigger>
        {/* Scroll positions hardcoded because GSAP doesn't auto-compensate
            child triggers for the parent pin's spacer. Banner.docTop after pin
            shift ≈ 1840; trigger fires when banner.top reaches viewport_top -
            20%vh (scroll 1840), ends 500px later at 2340 while still partially
            in viewport so the dissolve is visible. */}
        <DisintegrationTransition startScroll={1840} endScroll={2340}>
          <div className="flex h-full w-full flex-col items-center justify-center px-6 text-center">
            <WordmarkReveal>
              <h1 className="font-display text-[12vw] font-light leading-none tracking-[-0.02em] text-ivory drop-shadow-[0_2px_24px_rgba(4,16,29,0.35)]">
                {t('home.wordmark')}
              </h1>
              <p className="mt-6 max-w-xl font-display text-xl text-ivory/85">{t('home.tagline')}</p>
              <button
                type="button"
                className="mt-10 rounded-full border border-ivory/30 bg-ivory/95 px-8 py-3 font-sans text-sm uppercase tracking-widest text-deep transition hover:bg-ivory"
              >
                {t('home.cta')}
              </button>
            </WordmarkReveal>
          </div>
        </DisintegrationTransition>
        <ScrollHint />
      </Act1Trigger>

      {/* === ACT 2 — Heritage: 40 years + timeline + family quote === */}
      {/* Hardcoded scroll positions: the section is 1944px (180vh) starting at
          doc scroll 2580 (after Act 1 pin spacer). Content is centered around
          doc 3552. Disintegration window 3500–4100 plays as the content is
          exiting the top of the viewport — by then the user has read through
          "40" + timeline + quote. */}
      <section className="relative flex min-h-[180vh] flex-col items-center justify-center px-6 py-32 text-center">
        <DisintegrationTransition startScroll={3500} endScroll={4100}>
          <div className="flex flex-col items-center gap-24">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-ivory/70">
              {t('heritage.eyebrow')}
            </p>
            <h2 className="mt-6 font-display text-[clamp(180px,22vw,380px)] font-extralight leading-[0.85] tracking-[-0.04em] text-ivory drop-shadow-[0_2px_24px_rgba(4,16,29,0.4)]">
              {t('heritage.headline')}
            </h2>
            <p className="mt-8 max-w-[24ch] font-display text-[clamp(28px,4vw,56px)] font-light leading-tight tracking-[-0.02em] text-ivory/85">
              {t('heritage.subtitle')}
            </p>

          {/* Mini timeline — three stacked entries on small screens, horizontal
              with thin gold connectors on >=sm breakpoints. */}
          <ol className="flex flex-col items-center gap-12 sm:flex-row sm:gap-12">
            {(['t1985', 't2005', 't2016'] as const).map((key, i) => (
              <li key={key} className="flex items-center gap-12">
                {i > 0 && (
                  <span aria-hidden className="hidden h-px w-16 bg-gold/40 sm:block" />
                )}
                <div className="text-center">
                  <p className="font-mono text-xs uppercase tracking-[0.25em] text-ivory/55">
                    {t(`heritage.timeline.${key}.year`)}
                  </p>
                  <p className="mt-2 font-display text-2xl font-light text-ivory">
                    {t(`heritage.timeline.${key}.label`)}
                  </p>
                  <p className="mt-1 font-sans text-sm text-ivory/65">
                    {t(`heritage.timeline.${key}.place`)}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <blockquote className="max-w-3xl">
            <p className="font-display text-[clamp(22px,3vw,36px)] font-light italic leading-relaxed text-ivory/95">
              &ldquo;{t('heritage.quote.body')}&rdquo;
            </p>
            <cite className="mt-6 block font-mono text-xs uppercase not-italic tracking-[0.25em] text-ivory/60">
              — {t('heritage.quote.attribution')}
            </cite>
          </blockquote>
          </div>
        </DisintegrationTransition>
      </section>

      {/* === ACT 3 placeholder === */}
      <section className="flex min-h-screen items-center justify-center px-6 text-center">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-ivory/55 mb-4">
            /{locale} &middot; {t('act3.eyebrow')}
          </p>
          <h2 className="font-display text-5xl font-light tracking-[-0.02em] text-ivory">
            {t('act3.headline')}
          </h2>
        </div>
      </section>
    </main>
  );
}
