'use client';

import { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { routing } from '@/i18n/routing';
import { useRouter, usePathname } from '@/i18n/routing';
import { motion, AnimatePresence } from 'motion/react';
import { X, Globe } from 'lucide-react';
import { useNavbar } from '@/context/NavbarContext';

const { locales } = routing;

export default function LanguageBanner() {
  const currentLocale = useLocale();
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [detectedLocale, setDetectedLocale] = useState<string | null>(null);
  const { isHidden, isPageTransitioning, setIsPageTransitioning } = useNavbar();

  useEffect(() => {
    // 1. Check if user has a stored preference
    const storedLocale = localStorage.getItem('user-locale');
    if (storedLocale && storedLocale !== currentLocale && locales.includes(storedLocale as any)) {
      // Auto-redirect to stored preference
      setIsPageTransitioning(true);
      setTimeout(() => {
        router.replace(pathname, { locale: storedLocale });
      }, 500); // Give time for fade-out
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
  }, [currentLocale, pathname, router, setIsPageTransitioning]);

  const handleSwitch = () => {
    if (detectedLocale) {
      localStorage.setItem('user-locale', detectedLocale);
      setIsPageTransitioning(true);
      setTimeout(() => {
        router.replace(pathname, { locale: detectedLocale });
      }, 500);
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

  return (
    <>
      <AnimatePresence>
        {isPageTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-bg-base/80 backdrop-blur-xl flex flex-col items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-6"
            >
              <div className="w-16 h-16 rounded-3xl bg-accent shadow-extruded flex items-center justify-center animate-pulse">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <p className="text-xl font-display font-bold text-fg-primary">
                {currentLocale === 'en' ? 'Switching Language...' : '正在切换语言...'}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isVisible && detectedLocale && !isHidden && !isPageTransitioning && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 inset-x-0 z-[100] p-4 flex justify-center pointer-events-none"
          >
            <div className="bg-bg-base/90 backdrop-blur-md border border-white/10 shadow-extruded rounded-[24px] p-4 flex items-center gap-4 max-w-lg pointer-events-auto">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-extruded-sm">
                <Globe className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-fg-primary font-display">
                  {currentLocale === 'en'
                    ? `Switch to ${localeNames[detectedLocale]}?`
                    : `是否切换到 ${localeNames[detectedLocale]}?`}
                </p>
                <p className="text-xs text-fg-muted truncate">
                  We detected your browser language is {localeNames[detectedLocale]}.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSwitch}
                  className="px-4 py-2 bg-accent text-white text-xs font-bold rounded-xl hover:scale-105 active:scale-95 transition-all shadow-extruded-sm"
                >
                  Switch
                </button>
                <button
                  onClick={handleDismiss}
                  className="p-2 text-fg-muted hover:text-fg-primary transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
