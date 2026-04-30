import { getDictionary, Locale } from '@/dictionaries';
import DownloadPageClient from './DownloadPageClient';

export default async function DownloadPage({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang as Locale;
  const dict = await getDictionary(lang);
  return <DownloadPageClient dict={dict} />;
}
