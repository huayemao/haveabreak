'use client';

import { useSearchParams } from 'next/navigation';
import CollectionsPageClient from '@haveabreak/frame/components/CollectionsPageClient';
import { Suspense } from 'react';

function CollectionDetailContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('collection');
  return <CollectionsPageClient selectedCollectionId={id} />;
}

export default function CollectionDetailPage() {
  return (
    <Suspense fallback={null}>
      <CollectionDetailContent />
    </Suspense>
  );
}
