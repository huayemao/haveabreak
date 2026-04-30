import { getDictionary, Locale } from '@/dictionaries';
import FrameLayoutClient from './FrameLayoutClient';

export default async function FrameLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>
}) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang as Locale;
  const dict = await getDictionary(lang);

  return (
    <FrameLayoutClient dict={dict} lang={lang}>
      {children}
    </FrameLayoutClient>
  );
}
