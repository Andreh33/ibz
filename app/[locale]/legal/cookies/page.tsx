import { getTranslations, setRequestLocale } from 'next-intl/server';

type Props = { params: Promise<{ locale: string }> };

export default async function CookiesPage({ params }: Props) {
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
          {t('legal.cookies.title')}
        </h1>
        <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.3em] text-deep/45">
          {t('legal.lastUpdated')}: 2026-05-07
        </p>

        <p className="mt-12 font-display text-xl font-light leading-relaxed text-deep/85">
          {t('legal.cookies.intro')}
        </p>

        <table className="mt-10 w-full border-collapse">
          <thead>
            <tr className="border-b border-deep/20 text-left">
              <th className="py-3 font-mono text-[10px] uppercase tracking-[0.3em] text-deep/55">{t('legal.cookies.thName')}</th>
              <th className="py-3 font-mono text-[10px] uppercase tracking-[0.3em] text-deep/55">{t('legal.cookies.thPurpose')}</th>
              <th className="py-3 font-mono text-[10px] uppercase tracking-[0.3em] text-deep/55">{t('legal.cookies.thDuration')}</th>
            </tr>
          </thead>
          <tbody className="font-sans text-sm">
            <Row name="NEXT_LOCALE" purpose={t('legal.cookies.r1Purpose')} duration={t('legal.cookies.r1Duration')} />
            <Row name="vercel_analytics" purpose={t('legal.cookies.r2Purpose')} duration={t('legal.cookies.r2Duration')} />
            <Row name="reservation_session" purpose={t('legal.cookies.r3Purpose')} duration={t('legal.cookies.r3Duration')} />
          </tbody>
        </table>

        <p className="mt-12 font-sans text-base leading-relaxed text-deep/80">
          {t('legal.cookies.contact')}
        </p>
      </article>
    </main>
  );
}

function Row({ name, purpose, duration }: { name: string; purpose: string; duration: string }) {
  return (
    <tr className="border-b border-deep/10">
      <td className="py-4 font-mono text-xs text-deep">{name}</td>
      <td className="py-4 pr-4 text-deep/80">{purpose}</td>
      <td className="py-4 font-mono text-xs text-deep/60">{duration}</td>
    </tr>
  );
}
