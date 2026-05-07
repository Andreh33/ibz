import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { DisintegrationTransition } from '@/components/canvas/DisintegrationTransition';
import { IbizaSilhouette } from '@/components/canvas/IbizaSilhouette';
import { CausticsOverlay } from '@/components/canvas/CausticsOverlay';
import { Act1Trigger } from '@/components/layout/Act1Trigger';
import { Act4Banner } from '@/components/layout/Act4Banner';
import { Act4Trigger } from '@/components/layout/Act4Trigger';
import { Act5Header } from '@/components/layout/Act5Header';
import { Act5Trigger } from '@/components/layout/Act5Trigger';
import { DishesTrack } from '@/components/layout/DishesTrack';
import { ScrollHint } from '@/components/layout/ScrollHint';
import { WaterCrossFlash } from '@/components/layout/WaterCrossFlash';
import { WordmarkReveal } from '@/components/layout/WordmarkReveal';
import Link from 'next/link';

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <main>
      {/* === ACT 1 — Sky + Boeing crossing + scroll-locked pin === */}
      <Act1Trigger>
        {/* Centering wrapper lives OUTSIDE DisintegrationTransition so the
            sentinel ScrollTrigger measures the actual banner content (the
            wordmark + tagline + CTA), not the full-viewport flex container.
            The DisintegrationTransition uses a sentinel ScrollTrigger
            anchored to its own contentRef + a fixed-duration timeline:
            no hardcoded scroll positions even with the parent pin spacer,
            and the dissolve always plays for ~1s regardless of scroll
            speed. */}
        <div className="flex h-full w-full flex-col items-center justify-center px-6 text-center">
          {/* Act 1 lives inside Act1Trigger's pin. Child ScrollTriggers
              don't get pin-spacer compensation, so we drive the dissolve
              from the pin's own progress instead, mapping pin progress
              [0.55, 0.95] to dissolve progress [0, 1]. The user has read
              the wordmark by 0.55; the dissolve completes by 0.95 so the
              banner is fully gone before the pin releases. */}
          <DisintegrationTransition act1ProgressRange={[0.55, 0.95]}>
            <WordmarkReveal>
              {/* Block-level h1 inherits text-center from the outer wrapper.
                  The p uses mx-auto in addition to max-w-xl: max-width
                  alone leaves the block left-aligned within contentRef
                  (which is sized to the wordmark's wider content), so
                  we must auto-center the block itself. The button sits
                  in its own flex centring wrapper because inline-block
                  buttons inherit text-align but don't always center
                  consistently across browsers when nested in a relative
                  parent. */}
              <h1 className="text-center font-display text-[12vw] font-light leading-none tracking-[-0.02em] text-ivory drop-shadow-[0_2px_24px_rgba(4,16,29,0.35)]">
                {t('home.wordmark')}
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-center font-display text-xl text-ivory/85">
                {t('home.tagline')}
              </p>
              <div className="mt-10 flex justify-center">
                <button
                  type="button"
                  className="rounded-full border border-ivory/30 bg-ivory/95 px-8 py-3 font-sans text-sm uppercase tracking-widest text-deep shadow-[0_8px_24px_rgba(4,16,29,0.45)] transition hover:bg-ivory"
                >
                  {t('home.cta')}
                </button>
              </div>
            </WordmarkReveal>
          </DisintegrationTransition>
        </div>
        <ScrollHint />
      </Act1Trigger>

      {/* === ACT 2 — Heritage: 40 years + timeline + family quote === */}
      {/* Section sized 130vh + tighter gap-16 between editorial elements
          packs the eyebrow / "40" / subtitle / timeline / quote stack into
          a vertically balanced layout. Previous min-h-[180vh] + gap-24 left
          the "40" sitting low in viewport with too much breathing room. */}
      <section className="relative flex min-h-[130vh] flex-col items-center justify-center px-6 py-24 text-center">
        <DisintegrationTransition>
          <div className="flex flex-col items-center gap-16">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-ivory/70">
              {t('heritage.eyebrow')}
            </p>
            <h2 className="mt-6 font-display text-[clamp(180px,22vw,380px)] font-extralight leading-[0.85] tracking-[-0.04em] text-ivory">
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

      {/* === ACT 3 — Hidden cove: location + Ibiza silhouette trace + pin === */}
      {/* Body height bookkeeping — ACT 1 pin spacer ends at scroll 2580, ACT 2
          (180vh) ends at 4524, ACT 3 (1400px fixed) ends at 5924. The SVG
          trace runs 4500–4750 so the pin lands while the silhouette is still
          mid-viewport. The disintegration is now sentinel-driven, no
          hardcoded scrolls. */}
      <section
        className="relative flex flex-col px-6 py-24"
        style={{ minHeight: '1400px' }}
      >
        {/* Decorative cloud — opposite side from the anchor column for balance.
            Two overlapping ellipses give a soft cumulus shape; cloud-drift CSS
            keyframes nudge it laterally over 60s. */}
        <svg
          aria-hidden
          viewBox="0 0 200 80"
          className="cloud-drift pointer-events-none absolute right-[8%] top-[18%] w-48 sm:w-72"
          style={{ opacity: 0.5 }}
        >
          <g fill="#F5F0E6">
            <ellipse cx="50" cy="50" rx="22" ry="14" />
            <ellipse cx="80" cy="40" rx="28" ry="20" />
            <ellipse cx="118" cy="48" rx="32" ry="22" />
            <ellipse cx="150" cy="52" rx="22" ry="15" />
          </g>
        </svg>

        {/* Horizon hint — bottom 15% bleeds toward a paler blue, signalling the
            sea is approaching for Act 4. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[15%]"
          style={{
            background:
              'linear-gradient(to bottom, transparent, rgba(180, 200, 220, 0.12))',
          }}
        />

        {/* DisintegrationTransition wraps just the editorial banner (auto
            sized) so the sentinel ScrollTrigger measures the actual visible
            content. The 3-band layout is achieved with explicit margins
            instead of an h-full → flex-1 chain so the contentRef can size
            itself to the children naturally. */}
        <DisintegrationTransition>
          <div className="mx-auto w-full max-w-6xl">
            {/* Top band — eyebrow + headline */}
            <header className="max-w-3xl">
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-ivory/95">
                {t('act3.eyebrow')}
              </p>
              <h2 className="mt-6 font-display text-[clamp(40px,5.5vw,76px)] font-light leading-[1.05] tracking-[-0.02em] text-ivory drop-shadow-[0_2px_24px_rgba(4,16,29,0.4)]">
                {t('act3.headline')}
              </h2>
            </header>

            {/* Middle band — body left, silhouette right. */}
            <div className="mt-16 grid grid-cols-12 items-center gap-x-8 gap-y-12 sm:mt-24">
              <p className="col-span-12 max-w-[52ch] font-sans text-[17px] leading-[1.7] text-ivory/95 sm:col-span-7">
                {t('act3.body')}
              </p>
              <div className="col-span-12 flex justify-center sm:col-span-5 sm:col-start-8 sm:justify-end">
                <IbizaSilhouette
                  startScroll={4500}
                  endScroll={4750}
                  pinLabel={t('act3.pinLabel')}
                />
              </div>
            </div>

            {/* Bottom band — data grid */}
            <dl className="mt-24 grid grid-cols-1 gap-6 sm:mt-40 sm:grid-cols-3">
              {(['locatedIn', 'coordinates', 'driving'] as const).map((key) => (
                <div key={key} className="text-left">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.25em] text-ivory/70">
                    {t(`act3.${key}`)}
                  </dt>
                  <dd className="mt-1 font-sans text-sm text-ivory/95">
                    {t(`act3.${key}Value` as 'locatedInValue' | 'coordinatesValue' | 'drivingValue')}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </DisintegrationTransition>
      </section>

      {/* === ACT 4 — Breaking the surface === */}
      {/* Pinned 1500px so the user has scroll runway for: above water (0–30%),
          cross-water flash (30–50%), submerged with caustics + god rays
          (50–100%). The Act4Banner inside fades in once a4 ≥ 0.5. The
          fixed-position overlays (caustics, god rays, flash) live at the
          page level so they're not bound to the pinned section's transform. */}
      <Act4Trigger>
        <Act4Banner>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-ivory/95 drop-shadow-[0_2px_18px_rgba(4,16,29,0.55)]">
            {t('act4.eyebrow')}
          </p>
          <h2 className="mt-6 max-w-[18ch] font-display text-[clamp(40px,5.5vw,76px)] font-light leading-[1.1] tracking-[-0.02em] text-ivory drop-shadow-[0_2px_24px_rgba(4,16,29,0.5)]">
            {t('act4.headline')}
          </h2>
          <p className="mt-8 max-w-[36ch] font-sans text-[17px] leading-[1.7] text-ivory/95 drop-shadow-[0_2px_18px_rgba(4,16,29,0.55)]">
            {t('act4.body')}
          </p>
        </Act4Banner>
      </Act4Trigger>

      {/* === ACT 5 — Kitchen + tortuga + dishes carousel === */}
      {/* Pinned section. Tortuga (in ForegroundCanvas) sweeps R→L scrubbing
          act5Progress. The DishesTrack horizontally translates 6 plates so
          the user reads them left-to-right while the page is locked. The
          underwater sky tint + caustics + god rays from Act 4 carry through
          unchanged — Act 5 is a continuation of the underwater world. */}
      <Act5Trigger pinDistance={3500}>
        <Act5Header
          eyebrow={t('act5.eyebrow')}
          headline={t('act5.headline')}
          intro={t('act5.intro')}
        />
        <DishesTrack />
      </Act5Trigger>

      {/* === ACT 6 — On the water (catering / boat delivery) === */}
      <section className="relative px-6 py-32 sm:py-40">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 md:grid-cols-12 md:gap-20">
          <div className="md:col-span-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-ivory/80">
              {t('act6.eyebrow')}
            </p>
            <h2 className="mt-6 font-display text-[clamp(36px,5vw,68px)] font-light leading-[1.05] tracking-[-0.02em] text-ivory drop-shadow-[0_2px_24px_rgba(4,16,29,0.5)]">
              {t('act6.headline')}
            </h2>
            <p className="mt-8 max-w-[44ch] font-sans text-base leading-relaxed text-ivory/85 drop-shadow-[0_2px_18px_rgba(4,16,29,0.55)]">
              {t('act6.body')}
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href={`/${locale}/contact`}
                className="rounded-full bg-ivory/95 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.25em] text-deep transition hover:bg-gold hover:text-deep"
              >
                {t('act6.ctaCatering')}
              </Link>
              <Link
                href={`/${locale}/contact`}
                className="rounded-full border border-ivory/40 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.25em] text-ivory transition hover:bg-ivory/10"
              >
                {t('act6.ctaTable')}
              </Link>
            </div>
          </div>
          <div className="md:col-span-6">
            <div className="relative aspect-[4/5] overflow-hidden rounded-sm shadow-[0_30px_80px_rgba(4,16,29,0.55)]">
              <img
                src="/images/GR2C2341-scaled-1600.avif"
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* === ACT 7 — Where every story settles (close + CTA) === */}
      <section className="relative px-6 py-32 sm:py-40">
        <div className="mx-auto max-w-4xl text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-ivory/80">
            {t('act7.eyebrow')}
          </p>
          <h2 className="mt-6 font-display text-[clamp(40px,6vw,84px)] font-light leading-[1.05] tracking-[-0.02em] text-ivory drop-shadow-[0_2px_24px_rgba(4,16,29,0.5)]">
            {t('act7.headline')}
          </h2>
          <p className="mx-auto mt-8 max-w-[48ch] font-sans text-base leading-relaxed text-ivory/85 drop-shadow-[0_2px_18px_rgba(4,16,29,0.55)]">
            {t('act7.body')}
          </p>
          <p className="mt-10 font-mono text-[11px] uppercase tracking-[0.3em] text-ivory/70">
            {t('act7.address')}
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href={`/${locale}/contact`}
              className="rounded-full bg-ivory/95 px-8 py-3 font-mono text-[11px] uppercase tracking-[0.25em] text-deep transition hover:bg-gold hover:text-deep"
            >
              {t('act7.ctaReserve')}
            </Link>
            <a
              href="https://maps.google.com/?q=Cala+San+Vicente+Ibiza+The+Boat+House"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-ivory/40 px-8 py-3 font-mono text-[11px] uppercase tracking-[0.25em] text-ivory transition hover:bg-ivory/10"
            >
              {t('act7.ctaDirections')}
            </a>
          </div>
        </div>
      </section>

      {/* Page-level overlays scrubbed by act4Progress. The god-rays canvas
          was removed per editorial direction — fake sun-shafts under water
          read as plastic 3D-stock and undersold the brand. The cross-flash
          + caustics still carry the moment without them. */}
      <CausticsOverlay />
      <WaterCrossFlash />
    </main>
  );
}
