'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useIsMobile } from '@/hooks/use-mobile';

export default function InterruptedDisplay() {
  const t = useTranslations();
  const toastIdRef = useRef<string | number | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    toastIdRef.current = toast.error(t('timer.moveWarning'), {
      description: isMobile ? t('timer.moveWarningDescMobile') : t('timer.moveWarningDesc'),
      duration: Infinity, // Keep visible as long as component is mounted
    });

    return () => {
      if (toastIdRef.current !== null) {
        toast.dismiss(toastIdRef.current);
      }
    };
  }, [t, isMobile]);

  return null;
}