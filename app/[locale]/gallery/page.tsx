import { getTranslations, setRequestLocale } from 'next-intl/server';

type Props = { params: Promise<{ locale: string }> };

// Editorial gallery — masonry-ish grid using the existing public/images
// archive. Each tile keeps a soft caption that fades in on hover. Images
// are intentionally varied in aspect ratio for a curated-archive feel.
type Tile = { src: string; alt: string; aspect: 'tall' | 'wide' | 'square' };

const TILES: Tile[] = [
  { src: '/images/5K3A0609-scaled-1600.avif', alt: 'Cove view at golden hour', aspect: 'wide' },
  { src: '/images/Mains-1-1080.avif', alt: 'Paella melosa', aspect: 'square' },
  { src: '/images/About-1-1080.avif', alt: 'Family on the terrace', aspect: 'tall' },
  { src: '/images/Tapas-A-1080.avif', alt: 'Olives and pan con tomate', aspect: 'square' },
  { src: '/images/Mains-3-1080.avif', alt: 'Tomahawk on the grill', aspect: 'wide' },
  { src: '/images/Salad-1-1080.avif', alt: 'Cove farm salad', aspect: 'tall' },
  { src: '/images/Drinks-4-1102x624-1080.avif', alt: 'House negroni', aspect: 'wide' },
  { src: '/images/Dessert-A-1080.avif', alt: 'Lemon tart, basil', aspect: 'square' },
  { src: '/images/About-11-1-1080.avif', alt: 'On the Beach, 2005', aspect: 'tall' },
  { src: '/images/Mains-4-1080.avif', alt: 'Wagyu burger', aspect: 'square' },
  { src: '/images/GR2C2341-scaled-1600.avif', alt: 'Sailing into the cove', aspect: 'wide' },
  { src: '/images/Tapas-D-1080.avif', alt: 'Iberian ham', aspect: 'square' },
  { src: '/images/About-12-1080.avif', alt: 'Cooking line at lunch', aspect: 'tall' },
  { src: '/images/Salad-2-1080.avif', alt: 'Watermelon, feta, mint', aspect: 'wide' },
  { src: '/images/Drinks-5-1102x624-1080.avif', alt: 'Hierbas with soda', aspect: 'square' },
  { src: '/images/Tapas-B-1080.avif', alt: 'Padrón peppers', aspect: 'tall' },
  { src: '/images/Dessert-B-1080.avif', alt: 'Dark chocolate, sea salt', aspect: 'square' },
  { src: '/images/About-5-1080.avif', alt: 'Service, late afternoon', aspect: 'wide' },
];

const ASPECT: Record<Tile['aspect'], string> = {
  tall: 'aspect-[3/4] row-span-2',
  wide: 'aspect-[16/9] sm:col-span-2',
  square: 'aspect-square',
};

export default async function GalleryPage({ params }: Props) {
  const { locale: _locale } = await params;
  setRequestLocale(_locale);
  const t = await getTranslations();

  return (
    <main className="bg-ivory pb-32 pt-32 text-deep">
      <section className="mx-auto max-w-5xl px-6 pt-12 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-deep/60">
          {t('gallery.eyebrow')}
        </p>
        <h1 className="mt-6 font-display text-[clamp(48px,7vw,96px)] font-light leading-[1.05] tracking-[-0.02em]">
          {t('gallery.headline')}
        </h1>
        <p className="mx-auto mt-8 max-w-2xl font-sans text-base leading-relaxed text-deep/75">
          {t('gallery.intro')}
        </p>
      </section>

      <div className="mx-auto mt-20 grid max-w-7xl grid-cols-1 gap-3 px-4 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {TILES.map((tile) => (
          <figure
            key={tile.src}
            className={`group relative overflow-hidden rounded-sm bg-deep/10 ${ASPECT[tile.aspect]}`}
          >
            <img
              src={tile.src}
              alt={tile.alt}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
              loading="lazy"
            />
            <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-deep/85 via-deep/40 to-transparent p-5 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ivory/90">
                {tile.alt}
              </p>
            </figcaption>
          </figure>
        ))}
      </div>
    </main>
  );
}
