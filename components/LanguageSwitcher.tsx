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
    <div className="flex items-center gap-2 bg-bg-base shadow-inset-sm rounded-full px-4 py-1.5 transition-all group hover:shadow-inset">
      <Globe className="w-4 h-4 text-accent transition-transform group-hover:rotate-12" />
      <div className="relative">
        <select
          value={locale}
          onChange={(e) => handleLocaleChange(e.target.value)}
          className="bg-transparent text-sm font-medium text-fg-primary outline-none cursor-pointer appearance-none pr-4 font-sans"
        >
          {locales.map((l) => (
            <option key={l} value={l} className="bg-bg-base text-fg-primary">
              {localeNames[l] || l.toUpperCase()}
            </option>
          ))}
        </select>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-3 h-3 text-fg-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
