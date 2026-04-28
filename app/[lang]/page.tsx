import { getDictionary, Locale } from '@/dictionaries';
import TimerApp from './page-client';

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang as Locale;
  const dict = await getDictionary(lang);

  return <TimerApp dict={dict} />;
}
