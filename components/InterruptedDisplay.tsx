'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

export default function InterruptedDisplay() {
  const t = useTranslations();
  const toastIdRef = useRef<string | number | null>(null);

  useEffect(() => {
    toastIdRef.current = toast.error(t('moveWarning'), {
      description: t('moveWarningDesc'),
      duration: Infinity, // Keep visible as long as component is mounted
    });

    return () => {
      if (toastIdRef.current !== null) {
        toast.dismiss(toastIdRef.current);
      }
    };
  }, [t]);

  return null;
}