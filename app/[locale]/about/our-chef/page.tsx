import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';

type Props = { params: Promise<{ locale: string }> };

// Chef portrait page — long-form, editorial, no carousels. Pulled from
// the existing site's chef bio, expanded into chapters: training, the
// pass, philosophy, signature dishes. Photo + pull-quotes + small
// timeline of formation kitchens.

const TRAINING = [
  { city: 'Amsterdam', year: '2010', kitchen: 'Het Bosch' },
  { city: 'Madrid', year: '2013', kitchen: 'DiverXO' },
  { city: 'Bangkok', year: '2016', kitchen: 'Gaggan' },
  { city: 'Cala San Vicente', year: '2018', kitchen: 'The Boat House' },
];

export default async function OurChefPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <main className="bg-ivory pb-32 pt-32 text-deep">
      <section className="mx-auto max-w-5xl px-6 pt-12 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-deep/60">
          {t('chef.eyebrow')}
        </p>
        <h1 className="mt-6 font-display text-[clamp(48px,7vw,96px)] font-light leading-[1.05] tracking-[-0.02em]">
          {t('chef.headline')}
        </h1>
        <p className="mx-auto mt-8 max-w-2xl font-sans text-base leading-relaxed text-deep/75">
          {t('chef.intro')}
        </p>
      </section>

      {/* Portrait + pull-quote */}
      <section className="mx-auto mt-20 grid max-w-6xl grid-cols-1 gap-12 px-6 md:grid-cols-12 md:gap-16">
        <div className="md:col-span-5">
          <div className="relative aspect-[3/4] overflow-hidden rounded-sm shadow-[0_30px_80px_rgba(4,16,29,0.18)]">
            <img
              src="/images/About-12-1080.avif"
              alt={t('chef.name')}
              className="h-full w-full object-cover"
              loading="eager"
            />
          </div>
        </div>
        <div className="md:col-span-7">
          <blockquote className="font-display text-[clamp(22px,2.6vw,34px)] font-light italic leading-relaxed text-deep">
            &ldquo;{t('chef.pullQuote')}&rdquo;
          </blockquote>
          <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.3em] text-deep/55">
            {t('chef.name')} — {t('chef.role')}
          </p>
        </div>
      </section>

      {/* Long-form bio */}
      <section className="mx-auto mt-32 max-w-3xl px-6">
        <p className="font-display text-xl font-light leading-relaxed text-deep">
          {t('chef.body1')}
        </p>
        <p className="mt-8 font-sans text-base leading-relaxed text-deep/80">
          {t('chef.body2')}
        </p>
        <p className="mt-8 font-sans text-base leading-relaxed text-deep/80">
          {t('chef.body3')}
        </p>
      </section>

      {/* Training timeline */}
      <section className="mx-auto mt-32 max-w-5xl px-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-deep/55">
          {t('chef.trainingLabel')}
        </p>
        <ol className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          {TRAINING.map((stop, i) => (
            <li
              key={stop.city}
              className="border-t border-deep/15 pt-6"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-deep/55">
                {`0${i + 1}`} · {stop.year}
              </p>
              <p className="mt-3 font-display text-2xl font-light text-deep">
                {stop.city}
              </p>
              <p className="mt-2 font-sans text-sm text-deep/65">
                {stop.kitchen}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* Signatures */}
      <section className="mx-auto mt-32 max-w-5xl px-6">
        <div className="border-t border-deep/15 pt-16">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-deep/55">
            {t('chef.signaturesLabel')}
          </p>
          <h2 className="mt-6 font-display text-[clamp(32px,4.5vw,56px)] font-light leading-tight tracking-[-0.02em]">
            {t('chef.signaturesHeadline')}
          </h2>
          <ul className="mt-12 grid grid-cols-1 gap-12 sm:grid-cols-2">
            <li className="flex gap-6">
              <div className="aspect-square w-32 shrink-0 overflow-hidden rounded-sm bg-deep/5">
                <img src="/images/Mains-1-1080.avif" alt="" className="h-full w-full object-cover" loading="lazy" />
              </div>
              <div>
                <p className="font-display text-xl font-light">Paella melosa</p>
                <p className="mt-2 font-sans text-sm text-deep/70">{t('chef.sigPaella')}</p>
              </div>
            </li>
            <li className="flex gap-6">
              <div className="aspect-square w-32 shrink-0 overflow-hidden rounded-sm bg-deep/5">
                <img src="/images/Mains-3-1080.avif" alt="" className="h-full w-full object-cover" loading="lazy" />
              </div>
              <div>
                <p className="font-display text-xl font-light">Friesian Tomahawk</p>
                <p className="mt-2 font-sans text-sm text-deep/70">{t('chef.sigTomahawk')}</p>
              </div>
            </li>
            <li className="flex gap-6">
              <div className="aspect-square w-32 shrink-0 overflow-hidden rounded-sm bg-deep/5">
                <img src="/images/Main-A-1080.avif" alt="" className="h-full w-full object-cover" loading="lazy" />
              </div>
              <div>
                <p className="font-display text-xl font-light">Thai Fish &amp; Seafood Curry</p>
                <p className="mt-2 font-sans text-sm text-deep/70">{t('chef.sigCurry')}</p>
              </div>
            </li>
            <li className="flex gap-6">
              <div className="aspect-square w-32 shrink-0 overflow-hidden rounded-sm bg-deep/5">
                <img src="/images/Salad-1-1080.avif" alt="" className="h-full w-full object-cover" loading="lazy" />
              </div>
              <div>
                <p className="font-display text-xl font-light">Cove farm leaves</p>
                <p className="mt-2 font-sans text-sm text-deep/70">{t('chef.sigLeaves')}</p>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <section className="mx-auto mt-32 max-w-4xl px-6 text-center">
        <Link
          href={`/${locale}/contact`}
          className="rounded-full bg-deep px-8 py-3 font-mono text-[11px] uppercase tracking-[0.25em] text-ivory transition hover:bg-gold hover:text-deep"
        >
          {t('home.cta')}
        </Link>
      </section>
    </main>
  );
}
