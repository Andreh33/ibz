import { NextStudio } from 'next-sanity/studio';
import config from '@/sanity.config';

export const dynamic = 'force-static';
export const revalidate = false;

export default function StudioPage() {
  return <NextStudio config={config} />;
}
