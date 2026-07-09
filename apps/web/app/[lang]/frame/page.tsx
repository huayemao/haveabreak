'use client';
import FeedPageClient from '@haveabreak/frame/components/FeedPageClient';
import { Suspense } from 'react';

export default function FramePage() {
  return (
    <Suspense fallback={null}>
      <FeedPageClient />
    </Suspense>
  );
}
