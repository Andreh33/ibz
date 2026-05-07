import { getTranslations, setRequestLocale } from 'next-intl/server';

type Props = { params: Promise<{ locale: string }> };

export default async function PrivacyPage({ params }: Props) {
  const { locale: _locale } = await params;
  setRequestLocale(_locale);
  const t = await getTranslations();

  return (
    <main className="bg-ivory pb-32 pt-32 text-deep">
      <article className="mx-auto max-w-3xl px-6 pt-12">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-deep/55">
          {t('legal.eyebrow')}
        </p>
        <h1 className="mt-6 font-display text-[clamp(40px,5.5vw,72px)] font-light leading-[1.05] tracking-[-0.02em]">
          {t('legal.privacy.title')}
        </h1>
        <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.3em] text-deep/45">
          {t('legal.lastUpdated')}: 2026-05-07
        </p>

        <Section title={t('legal.privacy.s1Title')}>
          <p>{t('legal.privacy.s1Body')}</p>
        </Section>
        <Section title={t('legal.privacy.s2Title')}>
          <p>{t('legal.privacy.s2Body')}</p>
        </Section>
        <Section title={t('legal.privacy.s3Title')}>
          <p>{t('legal.privacy.s3Body')}</p>
        </Section>
        <Section title={t('legal.privacy.s4Title')}>
          <p>{t('legal.privacy.s4Body')}</p>
        </Section>
        <Section title={t('legal.privacy.s5Title')}>
          <p>{t('legal.privacy.s5Body')}</p>
        </Section>

        <p className="mt-16 border-t border-deep/15 pt-8 font-mono text-[11px] uppercase tracking-[0.3em] text-deep/55">
          The Boat House Ibiza S.L. — Calle del Calo 12, 07810 Sant Joan de Labritja, Eivissa
        </p>
      </article>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="font-display text-2xl font-light tracking-tight text-deep">{title}</h2>
      <div className="mt-4 space-y-4 font-sans text-base leading-relaxed text-deep/80">
        {children}
      </div>
    </section>
  );
}
