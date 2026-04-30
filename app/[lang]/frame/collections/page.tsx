import { getDictionary, Locale } from '@/dictionaries';
import CollectionsPageClient from './CollectionsPageClient';

export default async function CollectionsPage({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang as Locale;
  const dict = await getDictionary(lang);
  return <CollectionsPageClient dict={dict} />;
}
