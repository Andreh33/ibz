import { setRequestLocale, getTranslations } from 'next-intl/server';

type Props = { params: Promise<{ locale: string }> };

export default async function GalleryPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <main className="min-h-screen px-6 py-32">
      <h1 className="font-display text-6xl">{t('nav.gallery')}</h1>
      <p className="mt-4 font-mono text-xs uppercase tracking-widest text-deep/50">
        placeholder &middot; /{locale}/gallery
      </p>
    </main>
  );
}
