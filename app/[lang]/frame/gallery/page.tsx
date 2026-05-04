import GalleryPageClient from './GalleryPageClient';
import { Suspense } from 'react';

export default async function GalleryPage() {
  return (
    <Suspense fallback={null}>
      <GalleryPageClient />
    </Suspense>
  );
}
