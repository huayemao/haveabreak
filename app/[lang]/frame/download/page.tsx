import DownloadPageClient from './DownloadPageClient';
import { Suspense } from 'react';

export default async function DownloadPage() {
  return (
    <Suspense fallback={null}>
      <DownloadPageClient />
    </Suspense>
  );
}
