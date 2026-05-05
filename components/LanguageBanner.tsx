'use client';

import { useState, useEffect, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { routing } from '@/i18n/routing';
import { useRouter, usePathname } from '@/i18n/routing';
import { motion, AnimatePresence } from 'motion/react';
import { Globe } from 'lucide-react';
import { useNavbar } from '@/context/NavbarContext';
import { toast } from 'sonner';

const { locales } = routing;

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

export default function LanguageBanner() {
  const currentLocale = useLocale();
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const [detectedLocale, setDetectedLocale] = useState<string | null>(null);
  const { isHidden, isPageTransitioning, setIsPageTransitioning } = useNavbar();
  const toastShownRef = useRef(false);

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
    }
  }, [currentLocale, pathname, router, setIsPageTransitioning]);

  // Show/dismiss the toast based on visibility conditions
  useEffect(() => {
    if (!detectedLocale || isHidden || isPageTransitioning) return;
    if (toastShownRef.current) return;

    toastShownRef.current = true;

    const targetName = localeNames[detectedLocale] ?? detectedLocale;
    const title =
      currentLocale === 'en'
        ? `Switch to ${targetName}?`
        : `是否切换到 ${targetName}?`;
    const description =
      currentLocale === 'en'
        ? `We detected your browser language is ${targetName}.`
        : `我们检测到您的浏览器语言为 ${targetName}。`;

    toast(title, {
      description,
      duration: Infinity,
      action: {
        label: currentLocale === 'en' ? 'Switch' : '切换',
        onClick: () => {
          localStorage.setItem('user-locale', detectedLocale);
          setIsPageTransitioning(true);
          setTimeout(() => {
            router.replace(pathname, { locale: detectedLocale });
          }, 500);
        },
      },
      onDismiss: () => {
        localStorage.setItem('language-banner-dismissed', 'true');
      },
      cancel: {
        label: currentLocale === 'en' ? 'Dismiss' : '忽略',
        onClick: () => {
          localStorage.setItem('language-banner-dismissed', 'true');
        },
      },
    });
  }, [detectedLocale, isHidden, isPageTransitioning, currentLocale, pathname, router, setIsPageTransitioning]);

  // Page transition overlay — keep this intact
  return (
    <AnimatePresence>
      {isPageTransitioning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-[#E0E5EC]/80 backdrop-blur-xl flex flex-col items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="w-16 h-16 rounded-3xl bg-[#E0E5EC] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] flex items-center justify-center animate-pulse">
              <Globe className="w-8 h-8 text-[#6C63FF]" />
            </div>
            <p className="text-xl font-display font-bold text-[#3D4852]">
              {currentLocale === 'en' ? 'Switching Language...' : '正在切换语言...'}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
