'use client';

import { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { routing } from '@/i18n/routing';
import { useRouter, usePathname } from '@/i18n/routing';
import { motion, AnimatePresence } from 'motion/react';
import { X, Globe } from 'lucide-react';

const { locales } = routing;

export default function LanguageBanner() {
  const currentLocale = useLocale();
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [detectedLocale, setDetectedLocale] = useState<string | null>(null);

  useEffect(() => {
    // 1. Check if user has a stored preference
    const storedLocale = localStorage.getItem('user-locale');
    if (storedLocale && storedLocale !== currentLocale && locales.includes(storedLocale as any)) {
      // Auto-redirect to stored preference
      router.replace(pathname, { locale: storedLocale });
      return;
    }

    // 2. Check if banner was dismissed persistently
    const isDismissed = localStorage.getItem('language-banner-dismissed');
    if (isDismissed || storedLocale) return;

    const browserLang = navigator.language.split('-')[0];
    if (browserLang !== currentLocale && locales.includes(browserLang as any)) {
      setDetectedLocale(browserLang);
      setIsVisible(true);
    }
  }, [currentLocale, pathname, router]);

  const handleSwitch = () => {
    if (detectedLocale) {
      localStorage.setItem('user-locale', detectedLocale);
      router.replace(pathname, { locale: detectedLocale });
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('language-banner-dismissed', 'true');
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

  if (!isVisible || !detectedLocale) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-0 inset-x-0 z-[100] p-4 flex justify-center pointer-events-none"
      >
        <div className="bg-white/90 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl p-4 flex items-center gap-4 max-w-lg pointer-events-auto">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900">
              {currentLocale === 'en' 
                ? `Switch to ${localeNames[detectedLocale]}?` 
                : `是否切换到 ${localeNames[detectedLocale]}?`}
            </p>
            <p className="text-xs text-slate-500 truncate">
              We detected your browser language is {localeNames[detectedLocale]}.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSwitch}
              className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Switch
            </button>
            <button
              onClick={handleDismiss}
              className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
