'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { RefreshCwIcon } from 'lucide-react';

/**
 * ServiceWorkerUpdate
 *
 * Watches for a new Service Worker entering the "waiting" state and shows
 * a sonner toast that lets the user apply the update immediately.
 *
 * Detection strategy (fastest possible without a library):
 *  1. Check the registration immediately on mount.
 *  2. Listen to the SW's `updatefound` + `statechange` events.
 *  3. Poll via `registration.update()` every 5 minutes.
 *  4. Re-trigger `registration.update()` on every `visibilitychange` so
 *     that returning to the tab almost instantly catches a new version.
 */
export function ServiceWorkerUpdate() {
  const t = useTranslations();

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    let toastShown = false;

    const showUpdateToast = () => {
      if (toastShown) return;
      toastShown = true;

      toast(t('pwaUpdateTitle'), {
        description: t('pwaUpdateDesc'),
        duration: Infinity,
        action: {
          label: t('pwaUpdateBtn'),
          onClick: () => {
            applyUpdate();
          },
        },
        icon: <RefreshCwIcon className="size-4 text-[#6C63FF]" />,
      });
    };

    let waitingWorker: ServiceWorker | null = null;

    const applyUpdate = () => {
      if (waitingWorker) {
        waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      } else {
        window.location.reload();
      }
    };

    let isRefreshing = false;
    const onControllerChange = () => {
      if (isRefreshing) return;
      isRefreshing = true;
      window.location.reload();
    };

    const onMessageFromSW = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SW_UPDATED') {
        if (isRefreshing) return;
        isRefreshing = true;
        window.location.reload();
      }
    };

    const trackWorker = (sw: ServiceWorker) => {
      if (sw.state === 'installed') {
        // A new SW is installed and waiting — the old one is still active.
        waitingWorker = sw;
        showUpdateToast();
        return;
      }
      sw.addEventListener('statechange', () => {
        if (sw.state === 'installed') {
          waitingWorker = sw;
          showUpdateToast();
        }
      });
    };

    const onUpdateFound = (registration: ServiceWorkerRegistration) => {
      const newWorker = registration.installing;
      if (newWorker) trackWorker(newWorker);
    };

    navigator.serviceWorker.ready.then((registration) => {
      // 1. Check right away — maybe a SW is already waiting
      if (registration.waiting) {
        waitingWorker = registration.waiting;
        showUpdateToast();
      }

      // 2. Listen for future updates detected by the browser
      registration.addEventListener('updatefound', () =>
        onUpdateFound(registration)
      );

      // 3. Poll every 5 minutes
      const pollInterval = setInterval(() => {
        registration.update().catch(() => {});
      }, 5 * 60 * 1000);

      // 4. Check on tab focus / visibility restore
      const handleVisibility = () => {
        if (document.visibilityState === 'visible') {
          registration.update().catch(() => {});
        }
      };
      document.addEventListener('visibilitychange', handleVisibility);

      return () => {
        clearInterval(pollInterval);
        document.removeEventListener('visibilitychange', handleVisibility);
      };
    });

    // Listen to the controllerchange event — when the new SW takes control
    // after skipWaiting, this event fires and we can safely reload.
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    // Listen to messages from Service Worker - for delayed refresh after SW activation
    navigator.serviceWorker.addEventListener('message', onMessageFromSW);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      navigator.serviceWorker.removeEventListener('message', onMessageFromSW);
    };
  }, [t]);

  return null;
}
