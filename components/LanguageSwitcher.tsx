'use client';

import { useLocale } from 'next-intl';
import { routing } from '@/i18n/routing';
import { useRouter, usePathname } from '@/i18n/routing';
import { Globe } from 'lucide-react';

const { locales } = routing;

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: string) => {
    localStorage.setItem('user-locale', newLocale);
    router.replace(pathname, { locale: newLocale });
  };

  const localeNames: Record<string, string> = {
    en: 'English',
    zh: '中文',
    es: 'Español',
    fr: 'Français',
    de: 'Deutsch',
    ja: '日本語',
    ko: '한국어',
    ru: 'Русский',
    pt: 'Português',
    it: 'Italiano',
  };

  return (
    <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1.5 shadow-sm">
      <Globe className="w-4 h-4 text-slate-500" />
      <select
        value={locale}
        onChange={(e) => handleLocaleChange(e.target.value)}
        className="bg-transparent text-sm font-medium text-slate-700 outline-none cursor-pointer"
      >
        {locales.map((l) => (
          <option key={l} value={l}>
            {localeNames[l] || l}
          </option>
        ))}
      </select>
    </div>
  );
}
