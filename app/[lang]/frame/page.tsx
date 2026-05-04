import CollectionPageClient from './collections/CollectionsPageClient';
import { Suspense } from 'react';

export default async function FramePage() {
  return (
    <Suspense fallback={null}>
      <CollectionPageClient />
    </Suspense>
  );
}