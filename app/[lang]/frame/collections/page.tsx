import { getDictionary, Locale } from '@/dictionaries';
import CollectionsPageClient from './CollectionsPageClient';
import { Suspense } from 'react';

export default async function CollectionsPage({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang as Locale;
  const dict = await getDictionary(lang);
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CollectionsPageClient dict={dict} />
    </Suspense>
  );
}
