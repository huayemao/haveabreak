import CollectionsPageClient from '../CollectionsPageClient';
import { Suspense } from 'react';

export default async function CollectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  return (
    <Suspense fallback={null}>
      <CollectionsPageClient selectedCollectionId={id} />
    </Suspense>
  );
}
