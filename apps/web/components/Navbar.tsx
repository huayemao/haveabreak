'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from './LanguageSwitcher';
import { usePathname } from 'i18n/routing';
import { Home, Frame, ScrollText, Menu, X, Info, Settings, LayoutGrid, Timer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavbar } from '@/context/NavbarContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

  useEffect(() => {
    fetchVersion().then((data) => {
      setVersion(data.shortRevision);
    });
  }, []);

  const isRoot = pathname === '/' || pathname === '';
  const isTimer = pathname.includes('/timer');
  const isFrame = pathname.includes('/frame');
  const isCard = pathname.includes('/card');

  // Close menu on navigation
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: '/', label: t('nav.home'), icon: Home, active: isRoot },
    { href: '/timer', label: t('nav.timer'), icon: Timer, active: isTimer },
    { href: '/card', label: t('nav.card'), icon: ScrollText, active: isCard },
    { href: '/frame', label: t('nav.frame'), icon: Frame, active: isFrame },
  ];

  return (
    <motion.nav
      initial={false}
      animate={{
        y: isHidden ? -100 : 0,
        opacity: isHidden ? 0 : 1,
        pointerEvents: isHidden ? 'none' : 'auto'
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed top-6 right-4 md:left-1/2 md:-translate-x-1/2 z-50 md:w-full max-w-7xl px-4 flex flex-col items-end md:items-center pointer-events-none"
    >
      {/* Desktop & Mobile Main Pill */}

      <div className="flex items-center gap-2 sm:gap-6 p-1 sm:px-6 sm:py-2.5 rounded-2xl sm:rounded-full bg-bg-base shadow-extruded backdrop-blur-md bg-opacity-90 border border-white/10 relative z-50 pointer-events-auto md:mx-auto">
        {/* Desktop Links (Hidden on mobile) */}
        {!isTauriBuild && (
          <div className="hidden md:flex items-center gap-4">
            {/* Home Link */}
            <Link
              href="/"
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition-all duration-300 ${isRoot
                ? 'shadow-inset bg-bg-base text-accent font-bold scale-[0.98]'
                : 'text-fg-muted hover:text-fg-primary hover:scale-105'
                }`}
            >
              <Home className={`w-5 h-5 ${isRoot ? 'text-accent' : 'text-fg-muted'}`} />
            </Link>
            {/* Apps Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger>
                <button className="flex items-center gap-2 px-4 py-2 rounded-2xl text-fg-muted hover:text-fg-primary hover:scale-105 transition-all duration-300">
                  <LayoutGrid className="w-5 h-5" />
                  <span className="font-display">{t('nav.apps', { defaultValue: 'Apps' })}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 bg-bg-base rounded-[24px] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] border-none p-3">
                <DropdownMenuGroup className="space-y-1">
                  <DropdownMenuLabel className="font-display text-fg-primary px-3 py-2">{t('nav.apps', { defaultValue: 'Apps' })}</DropdownMenuLabel>
                  <div className="h-px bg-fg-muted opacity-20 my-1" />
                  {navLinks.map((link) => (
                    <DropdownMenuItem key={link.href} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all duration-200 ${link.active
                      ? 'shadow-[inset_3px_3px_6px_rgb(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.5)] bg-bg-base text-accent font-medium'
                      : 'text-fg-muted hover:text-fg-primary hover:shadow-[inset_2px_2px_4px_rgb(163,177,198,0.4),inset_-2px_-2px_4px_rgba(255,255,255,0.4)] bg-bg-base'
                      }`}>
                      <Link href={link.href} className="flex items-center gap-2 w-full">
                        <link.icon className="w-4 h-4" />
                        <span className="font-display">{link.label}</span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="w-px h-6 bg-fg-muted opacity-20 mx-2" />

            {/* Settings Dropdown with Version */}
            <DropdownMenu>
              <DropdownMenuTrigger >
                <button className="flex items-center gap-2 px-4 py-2 rounded-2xl text-fg-muted hover:text-fg-primary hover:scale-105 transition-all duration-300">
                  <Settings className="w-5 h-5" />
                  <span className="font-display">{t('common.settingsTitle', { defaultValue: 'Settings' })}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 bg-bg-base rounded-[24px] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] border-none p-3">
                <DropdownMenuGroup className="space-y-1">
                  <DropdownMenuLabel className="font-display text-fg-primary px-3 py-2">{t('common.settingsTitle', { defaultValue: 'Settings' })}</DropdownMenuLabel>
                  <div className="h-px bg-fg-muted opacity-20 my-1" />
                  <DropdownMenuItem className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-fg-muted hover:text-fg-primary hover:shadow-[inset_2px_2px_4px_rgb(163,177,198,0.4),inset_-2px_-2px_4px_rgba(255,255,255,0.4)] bg-bg-base transition-all duration-200">
                    <Info className="w-4 h-4" />
                    <span className="text-xs font-mono">v{version ?? '...'}</span>
                  </DropdownMenuItem>
                  <div className="h-px bg-fg-muted opacity-20 my-1" />
                  <div className="px-3">
                    <LanguageSwitcher />
                  </div>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        {/* Mobile Hamburger Button (Hidden on desktop) */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden flex items-center justify-center w-10 h-10 rounded-2xl p-0 shadow-none hover:shadow-none active:shadow-inset"
          aria-label="Toggle Menu"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={isOpen ? 'close' : 'menu'}
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </motion.div>
          </AnimatePresence>
        </button>
      </div>
      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 12, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="md:hidden w-full max-w-[320px] p-6 rounded-[32px] bg-bg-base shadow-extruded border border-white/10 z-40 pointer-events-auto mt-4"
          >
            <div className="flex flex-col gap-4">
              {!isTauriBuild && (
                <>
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${link.active
                        ? 'shadow-inset bg-bg-base text-accent font-bold'
                        : 'neumorphic-button text-fg-muted border-none shadow-extruded-sm'
                        }`}
                    >
                      <div className={`p-2 rounded-xl ${link.active ? 'shadow-inset' : 'shadow-extruded-sm bg-bg-base'}`}>
                        <link.icon className="w-5 h-5" />
                      </div>
                      <span className="font-display text-lg">{link.label}</span>
                    </Link>
                  ))}
                  <div className="h-px bg-fg-muted opacity-10 my-2" />
                </>
              )}
              <div className="flex justify-between items-center px-2">
                <span className="text-sm font-medium text-fg-muted">{t('common.settingsTitle')}</span>
                <LanguageSwitcher />
              </div>
              <div className="flex justify-end items-center gap-2">
                <Info className="w-4 h-4" />
                <span className="text-xs font-mono">{version ?? '...'}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
