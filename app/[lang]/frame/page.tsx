import { getDictionary, Locale } from '@/dictionaries';
import CollectionPageClient from './collections/CollectionsPageClient';  
import { Suspense } from 'react';

export default async function FramePage({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang as Locale;
  const dict = await getDictionary(lang);

  return (
    <Suspense fallback={null}>
      <CollectionPageClient dict={dict} />
    </Suspense>
  );
}