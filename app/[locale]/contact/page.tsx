import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ReservationForm } from '@/components/forms/ReservationForm';

type Props = { params: Promise<{ locale: string }> };

export default async function ContactPage({ params }: Props) {
  const { locale: _locale } = await params;
  setRequestLocale(_locale);
  const t = await getTranslations();

  return (
    <main className="bg-ivory pb-32 pt-32 text-deep">
      <section className="mx-auto max-w-5xl px-6 pt-12 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-deep/60">
          {t('contact.eyebrow')}
        </p>
        <h1 className="mt-6 font-display text-[clamp(48px,7vw,96px)] font-light leading-[1.05] tracking-[-0.02em]">
          {t('contact.headline')}
        </h1>
        <p className="mx-auto mt-8 max-w-2xl font-sans text-base leading-relaxed text-deep/75">
          {t('contact.intro')}
        </p>
      </section>

      <div className="mx-auto mt-20 grid max-w-6xl grid-cols-1 gap-12 px-6 md:grid-cols-12 md:gap-16">
        {/* Form column */}
        <div className="md:col-span-7">
          <ReservationForm
            labels={{
              name: t('contact.form.nameLabel'),
              email: t('contact.form.emailLabel'),
              date: t('contact.form.dateLabel'),
              guests: t('contact.form.guestsLabel'),
              message: t('contact.form.messageLabel'),
              submit: t('contact.form.submit'),
            }}
          />
        </div>

        {/* Info column */}
        <aside className="space-y-10 border-t border-deep/10 pt-8 md:col-span-5 md:border-t-0 md:pt-0">
          <ContactBlock label={t('contact.addressLabel')}>
            Calle del Calo 12<br />
            Cala San Vicente<br />
            07810 Sant Joan de Labritja<br />
            Eivissa, Illes Balears
          </ContactBlock>
          <ContactBlock label={t('contact.phoneLabel')}>
            <a className="hover:text-gold" href="tel:+34971334273">
              +34 971 334 273
            </a>
          </ContactBlock>
          <ContactBlock label={t('contact.emailLabel')}>
            <a className="hover:text-gold" href="mailto:hello@theboathouseibiza.com">
              hello@theboathouseibiza.com
            </a>
          </ContactBlock>
          <ContactBlock label={t('contact.hoursLabel')}>
            {t('footer.hoursValue')}
          </ContactBlock>
          <ContactBlock label={t('contact.directionsLabel')}>
            35 minutes via EI-200 → PM-810 toward Portinatx → bear right at km 13
            for Cala San Vicente. Free parking at the cove entrance.
          </ContactBlock>
        </aside>
      </div>

      <section className="mx-auto mt-24 max-w-7xl px-6">
        <div className="aspect-[16/8] overflow-hidden rounded-sm bg-deep/10">
          {/* Static map fallback. Replace src with Mapbox styled tile when
              the brand basemap is ready. */}
          <iframe
            title="The Boat House — Cala San Vicente"
            src="https://www.openstreetmap.org/export/embed.html?bbox=1.466%2C39.069%2C1.484%2C39.082&layer=mapnik&marker=39.0758%2C1.475"
            className="h-full w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>
    </main>
  );
}

function ContactBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-deep/55">
        {label}
      </p>
      <div className="mt-3 font-sans text-base leading-relaxed text-deep/85">
        {children}
      </div>
    </div>
  );
}
