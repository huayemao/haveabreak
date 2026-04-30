import { getDictionary, Locale } from '@/dictionaries';
import GalleryPageClient from './GalleryPageClient';

export default async function GalleryPage({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang as Locale;
  const dict = await getDictionary(lang);
  return <GalleryPageClient dict={dict} />;
}
