'use client';

import { useState, useEffect, useRef } from 'react';
import { Link, usePathname } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from './LanguageSwitcher';
import { Home, Frame, ScrollText, Info, Timer, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavbar } from '@/context/NavbarContext';
import { isTauriBuild } from '@/lib/utils';

interface VersionInfo {
  revision: string;
  shortRevision: string;
}

async function fetchVersion(): Promise<VersionInfo> {
  const res = await fetch('/api/version');
  return res.json();
}

export default function Navbar() {
  const t = useTranslations();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { isHidden } = useNavbar();
  const [version, setVersion] = useState<string | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    fetchVersion()
      .then((data) => {
        setVersion(data.shortRevision);
      })
      .catch(() => {});
  }, []);

  const isRoot = pathname === '/' || pathname === '';
  const isTimer = pathname.includes('/timer');
  const isFrame = pathname.includes('/frame');
  const isCard = pathname.includes('/card');

  // Close menu on navigation
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Close when clicking/tapping outside
  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setIsOpen(false);
    }, 450);
  };

  const navLinks = [
    { href: '/', label: t('nav.home'), icon: Home, active: isRoot },
    { href: '/timer', label: t('nav.timer'), icon: Timer, active: isTimer },
    { href: '/card', label: t('nav.card'), icon: ScrollText, active: isCard },
    { href: '/frame', label: t('nav.frame'), icon: Frame, active: isFrame },
  ];

  if (isHidden) return null;

  return (
    <nav
      ref={containerRef}
      style={{ marginTop: 'env(safe-area-inset-top)' }}
      onMouseEnter={clearCloseTimer}
      onMouseLeave={scheduleClose}
      className="fixed top-0 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center pointer-events-none"
    >
      {/* Concealed Top-Edge Handle: subtle 4px pill that never interferes with app UI */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        onMouseEnter={() => {
          clearCloseTimer();
          setIsOpen(true);
        }}
        aria-label="Toggle Global Navigation"
        className="group pointer-events-auto pt-2 pb-3 px-8 flex items-center justify-center cursor-pointer focus:outline-none"
      >
        <span
          className={`block rounded-full transition-all duration-300 ${
            isOpen
              ? 'w-12 h-1.5 bg-accent/70'
              : 'w-9 h-1 bg-fg-muted/20 group-hover:w-12 group-hover:h-1.5 group-hover:bg-fg-muted/50'
          }`}
        />
      </button>

      {/* Expandable Global App Switcher & Settings Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{ type: 'spring', damping: 24, stiffness: 340 }}
            className="pointer-events-auto w-[min(92vw,420px)] p-3.5 rounded-3xl bg-bg-base/95 backdrop-blur-xl shadow-extruded border border-white/15"
          >
            {!isTauriBuild && (
              <div className="grid grid-cols-4 gap-1.5 mb-3">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl text-xs transition-all ${
                        link.active
                          ? 'bg-accent text-white shadow-extruded-sm font-semibold'
                          : 'text-fg-muted hover:text-fg-primary hover:bg-muted/40'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="truncate max-w-full">{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-2.5 px-1.5 border-t border-fg-muted/10">
              <div className="flex items-center gap-1.5 text-fg-muted text-xs font-mono">
                <Info className="w-3.5 h-3.5" />
                <span>v{version ?? '...'}</span>
              </div>

              <div className="flex items-center gap-2">
                <LanguageSwitcher />
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-full text-fg-muted hover:text-fg-primary hover:bg-muted/40 transition-colors cursor-pointer"
                  aria-label="Close menu"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
