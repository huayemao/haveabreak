import { getDictionary, Locale } from '@/dictionaries';
import FrameApp from '@/apps/frame/FrameApp';

export default async function FramePage({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang as Locale;
  const dict = await getDictionary(lang);

  return <FrameApp dict={dict} />;
}