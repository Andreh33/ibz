import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { ScrollTriggerProbe } from '@/components/dev/ScrollTriggerProbe';

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <main>
      <section className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-deep/50 mb-8">
          {t('scaffold.stepLabel')} &middot; /{locale}
        </p>
        <h1 className="font-display text-[12vw] font-light leading-none tracking-[-0.02em]">
          {t('home.wordmark')}
        </h1>
        <p className="mt-6 max-w-xl font-display text-xl text-sea/80">{t('home.tagline')}</p>
        <button
          type="button"
          className="mt-10 rounded-full border border-sea bg-sea px-8 py-3 font-sans text-sm uppercase tracking-widest text-ivory transition hover:bg-deep"
        >
          {t('home.cta')}
        </button>
        <p className="mt-16 font-mono text-xs uppercase tracking-widest text-deep/40">
          {t('home.scrollHint')} ↓
        </p>
      </section>

      <ScrollTriggerProbe label={t('scaffold.probeLabel')} />

      <section className="min-h-screen bg-bone flex items-center justify-center">
        <p className="font-mono text-xs uppercase tracking-widest text-deep/40">
          end of scaffold &middot; canvas + descenso = paso 3
        </p>
      </section>
    </main>
  );
}
