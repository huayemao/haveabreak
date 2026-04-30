import { getDictionary, Locale } from '@/dictionaries';
import GalleryPageClient from './GalleryPageClient';
import { Suspense } from 'react';

export default async function GalleryPage({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang as Locale;
  const dict = await getDictionary(lang);
  return (
    <Suspense fallback={null}>
      <GalleryPageClient dict={dict} />
    </Suspense>
  );
}
