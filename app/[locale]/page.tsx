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
      <Act1Trigger>
        {/* Scroll positions: Act1 pin spans 0–1500, banner sits ~340px from
            section top → banner.docTop ≈ 1840 after pin shift. Banner enters
            viewport-top at scroll 1840, fully exits at 2240 (banner ~400px tall).
            Disintegration must play WHILE the banner is still in viewport so
            the particles are visible — end before 2340 (banner +100px buffer).
            Hardcoded because GSAP doesn't auto-compensate child triggers for
            parent pin spacing. */}
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

      {/* Act 2 placeholder — real heritage content lands in step 6 */}
      <section className="flex min-h-screen items-center justify-center bg-bone/40 px-6">
        <div className="text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-deep/40 mb-4">
            /{locale} &middot; act 2 placeholder
          </p>
          <h2 className="font-display text-5xl font-light tracking-[-0.02em] text-deep">
            Heritage
          </h2>
        </div>
      </section>
    </main>
  );
}
