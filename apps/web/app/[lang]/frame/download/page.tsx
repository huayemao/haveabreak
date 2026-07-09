import DownloadPageClient from '@haveabreak/frame/components/DownloadPageClient';
import { Suspense } from 'react';

export default async function DownloadPage() {
  return (
    <Suspense fallback={null}>
      <DownloadPageClient />
    </Suspense>
  );
}
