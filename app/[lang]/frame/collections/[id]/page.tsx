import { getDictionary, Locale } from '@/dictionaries';
import CollectionsPageClient from '../CollectionsPageClient';
import { Suspense } from 'react';

export default async function CollectionDetailPage({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang as Locale;
  const id = resolvedParams.id;
  const dict = await getDictionary(lang);
  return (
    <Suspense fallback={null}>
      <CollectionsPageClient dict={dict} selectedCollectionId={id} />
    </Suspense>
  );
}
