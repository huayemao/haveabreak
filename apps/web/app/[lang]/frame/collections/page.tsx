import CollectionsPageClient from '@haveabreak/frame/components/CollectionsPageClient';
import { Suspense } from 'react';

export default async function CollectionsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CollectionsPageClient />
    </Suspense>
  );
}
