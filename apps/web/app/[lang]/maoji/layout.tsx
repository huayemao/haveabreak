import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

export const metadata: Metadata = {
  title: '猫记 – 墨水屏 NFC 刷屏工具',
  description: '为 Goodisplay NFC 墨水屏设计内容并一键刷写',
};

export default async function MaojiLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  setRequestLocale(lang);
  return <>{children}</>;
}
