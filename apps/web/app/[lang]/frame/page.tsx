import FeedPageClient from './FeedPageClient';
import { Suspense } from 'react';

export default async function FramePage() {
  return (
    <Suspense fallback={null}>
      <FeedPageClient />
    </Suspense>
  );
}