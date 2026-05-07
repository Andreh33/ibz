import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';

type Props = { params: Promise<{ locale: string }> };

// Editorial menu page. Six sections, each with a small image header (mapped
// from public/images) and 4–6 dishes. Sanity integration will replace the
// hardcoded copy when the chef uploads the full menu — for now the data is
// pulled from sanity/seed/menu.json + the spec.
type MenuItem = { title: string; price: string; note?: string };
type SectionId = 'tapas' | 'starters' | 'mains' | 'salads' | 'desserts' | 'drinks';
type Section = { id: SectionId; image: string; items: MenuItem[] };

const SECTIONS: Section[] = [
  {
    id: 'tapas',
    image: '/images/Tapas-A-1080.avif',
    items: [
      { title: 'Marinated olives, citrus, fennel', price: '7,50 €' },
      { title: 'Pan con tomate, Mallorcan oil', price: '6 €' },
      { title: 'Padrón peppers, sea salt flakes', price: '8,50 €' },
      { title: 'Iberian ham, 24-month aged', price: '14 €' },
    ],
  },
  {
    id: 'starters',
    image: '/images/Starter-B-1080.avif',
    items: [
      { title: 'Burrata, heritage tomato, basil oil', price: '15 €' },
      { title: 'Tuna tartare, avocado, sesame', price: '18 €' },
      { title: 'Local octopus, smoked paprika', price: '17 €' },
      { title: 'Soft-shell crab, lime mayo', price: '16 €' },
    ],
  },
  {
    id: 'mains',
    image: '/images/Mains-1-1080.avif',
    items: [
      { title: 'Paella melosa', price: '29,50 €', note: 'seafood & fish — for two' },
      { title: '50-day dry-aged Friesian beef loin', price: '46,50 €' },
      { title: 'Frisian Tomahawk steak (Galicia)', price: '90 €', note: '/ kg, for two' },
      { title: 'Wagyu Boat House Burger', price: '32 €' },
      { title: 'Thai Fish & Seafood Curry', price: '28 €' },
      { title: 'Slow lamb shoulder, salsa verde', price: '34 €' },
    ],
  },
  {
    id: 'salads',
    image: '/images/Salad-1-1080.avif',
    items: [
      { title: 'Cove farm leaves, citrus, sherry', price: '12 €' },
      { title: 'Watermelon, feta, mint', price: '13 €' },
      { title: 'Niçoise, tuna confit, anchovy', price: '17 €' },
      { title: 'Roasted beet, goat cheese, walnut', price: '14 €' },
    ],
  },
  {
    id: 'desserts',
    image: '/images/Dessert-A-1080.avif',
    items: [
      { title: 'Lemon tart, Eivissa basil', price: '9 €' },
      { title: 'Dark chocolate, sea salt, olive oil', price: '10 €' },
      { title: 'Crema catalana', price: '8 €' },
      { title: 'Sorbets — three scoops', price: '8 €' },
    ],
  },
  {
    id: 'drinks',
    image: '/images/Drinks-4-1102x624-1080.avif',
    items: [
      { title: 'House negroni', price: '14 €' },
      { title: 'Hierbas ibicencas, soda, lime', price: '12 €' },
      { title: 'Local rosé, by the glass', price: '8 €' },
      { title: 'Mediterranean Sour', price: '13 €' },
      { title: 'Espresso martini, vanilla', price: '14 €' },
    ],
  },
];

export default async function MenuPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <main className="bg-ivory pb-32 pt-32 text-deep">
      <section className="mx-auto max-w-5xl px-6 pt-12 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-deep/60">
          {t('menu.eyebrow')}
        </p>
        <h1 className="mt-6 font-display text-[clamp(48px,7vw,96px)] font-light leading-[1.05] tracking-[-0.02em]">
          {t('menu.headline')}
        </h1>
        <p className="mx-auto mt-8 max-w-2xl font-sans text-base leading-relaxed text-deep/75">
          {t('menu.intro')}
        </p>
      </section>

      <div className="mx-auto mt-16 max-w-6xl px-6">
        <div className="relative aspect-[16/7] overflow-hidden rounded-sm">
          <img
            src="/images/5K3A0609-scaled-1600.avif"
            alt=""
            className="h-full w-full object-cover"
            loading="eager"
          />
        </div>
      </div>

      <div className="mx-auto mt-24 max-w-6xl px-6">
        {SECTIONS.map((section, idx) => (
          <section
            key={section.id}
            className="border-t border-deep/10 py-16 first:border-t-0 sm:py-24"
          >
            <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-16">
              <div className={`md:col-span-5 ${idx % 2 === 1 ? 'md:order-last' : ''}`}>
                <div className="relative aspect-[4/5] overflow-hidden rounded-sm">
                  <img
                    src={section.image}
                    alt={t(`menu.sections.${section.id}`)}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
              <div className="md:col-span-7">
                <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-deep/55">
                  {`0${idx + 1}`} · {String(section.id).toUpperCase()}
                </p>
                <h2 className="mt-4 font-display text-[clamp(32px,4.5vw,56px)] font-light tracking-[-0.02em]">
                  {t(`menu.sections.${section.id}`)}
                </h2>
                <ul className="mt-8 flex flex-col gap-5">
                  {section.items.map((item) => (
                    <li
                      key={item.title}
                      className="flex items-baseline justify-between gap-6 border-b border-deep/10 pb-4 last:border-b-0"
                    >
                      <div>
                        <p className="font-display text-lg font-light leading-snug">
                          {item.title}
                        </p>
                        {item.note && (
                          <p className="mt-1 font-sans text-xs text-deep/55">{item.note}</p>
                        )}
                      </div>
                      <p className="shrink-0 font-display text-lg font-light tabular-nums text-deep/85">
                        {item.price}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        ))}
      </div>

      <section className="mx-auto mt-32 max-w-4xl px-6">
        <div className="rounded-sm bg-deep px-8 py-16 text-center text-ivory sm:px-16 sm:py-20">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-ivory/60">
            {t('menu.callout.label')}
          </p>
          <h2 className="mt-6 font-display text-[clamp(28px,3.5vw,42px)] font-light leading-tight tracking-[-0.02em]">
            {t('menu.callout.title')}
          </h2>
          <p className="mx-auto mt-6 max-w-xl font-sans text-base leading-relaxed text-ivory/80">
            {t('menu.callout.body')}
          </p>
          <Link
            href={`/${locale}/contact`}
            className="mt-10 inline-block rounded-full border border-ivory/30 bg-ivory px-8 py-3 font-mono text-xs uppercase tracking-[0.25em] text-deep transition hover:bg-gold hover:text-deep"
          >
            {t('menu.callout.cta')}
          </Link>
        </div>
      </section>
    </main>
  );
}
