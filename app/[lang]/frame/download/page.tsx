import { getDictionary, Locale } from '@/dictionaries';
import DownloadPageClient from './DownloadPageClient';
import { Suspense } from 'react';

export default async function DownloadPage({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang as Locale;
  const dict = await getDictionary(lang);
  return (
    <Suspense fallback={null}>
      <DownloadPageClient dict={dict} />
    </Suspense>
  );
}
