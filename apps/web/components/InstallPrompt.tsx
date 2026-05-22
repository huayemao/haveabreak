'use client';

import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface InstallPromptProps {
  appId?: string;
}

export default function InstallPrompt({ appId = '' }: InstallPromptProps) {
  const t = useTranslations();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const iconUrl = appId ? `/api/${appId}/icon?size=64` : '/api/icon?size=64';
  
  const getAppTitle = () => {
    if (!appId) return '';
    const titleKeys = [`${appId}.pageTitle`, `${appId}.appTitle`, `${appId}.title`];
    for (const key of titleKeys) {
      try {
        const title = t(key);
        if (title && title !== key) return title;
      } catch {
        continue;
      }
    }
    return '';
  };

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [dismissed]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
  };

  if (!showPrompt || !deferredPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className={cn(
          'fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50',
          'neumorphic-card p-4 rounded-2xl shadow-lg'
        )}
      >
        <div className="flex items-start gap-3">
          <img
            src={iconUrl}
            alt="App Icon"
            className="w-10 h-10 rounded-xl bg-bg-base shadow-md flex-shrink-0"
          />
          <div className="flex-1">
            <span className="text-xs text-fg-muted block mb-0.5">{getAppTitle()}</span>
            <h3 className="font-semibold text-fg-primary text-sm mb-1">
              {t('install.title', { defaultValue: 'Install App' })}
            </h3>
            <p className="text-xs text-fg-muted mb-3">
              {t('install.description', { defaultValue: 'Add this app to your home screen for the best experience' })}
            </p>
            <button
              onClick={handleInstall}
              className="neumorphic-button-primary px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 w-full justify-center"
            >
              <Download className="w-4 h-4" />
              {t('install.button', { defaultValue: 'Install' })}
            </button>
          </div>
          <button
            onClick={handleDismiss}
            className="text-fg-muted hover:text-fg-primary transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}