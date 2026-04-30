import { getDictionary, Locale } from '@/dictionaries';
import SettingsPageClient from './SettingsPageClient';

export default async function SettingsPage({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang as Locale;
  const dict = await getDictionary(lang);
  return <SettingsPageClient dict={dict} />;
}
