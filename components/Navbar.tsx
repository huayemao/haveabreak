'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from './LanguageSwitcher';
import { usePathname } from 'next/navigation';
import { Home, Frame, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavbar } from '@/context/NavbarContext';

export default function Navbar() {
  const t = useTranslations();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { isHidden } = useNavbar();

  const isRoot = !pathname.includes('/frame');
  const isFrame = pathname.includes('/frame');

  // Close menu on navigation
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: '/', label: t('nav.home'), icon: Home, active: isRoot },
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
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-7xl px-4 flex flex-col items-center pointer-events-none"
    >
      {/* Desktop & Mobile Main Pill */}
      <div className="flex items-center gap-2 sm:gap-6 px-4 sm:px-6 py-2.5 rounded-full bg-bg-base shadow-extruded backdrop-blur-md bg-opacity-90 border border-white/10 relative z-50 pointer-events-auto mx-auto">

        {/* Brand / Logo (Always visible) */}
        <Link
          href="/"
          className={`flex items-center gap-2 px-3 py-2 rounded-2xl transition-all duration-300 text-accent hover:scale-105 active:scale-95`}
        >
          <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center shadow-extruded-sm">
            <span className="text-white font-bold text-xs font-display">HB</span>
          </div>
        </Link>

        {/* Desktop Links (Hidden on mobile) */}
        <div className="hidden md:flex items-center gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition-all duration-300 ${link.active
                  ? 'shadow-inset bg-bg-base text-accent font-bold scale-[0.98]'
                  : 'text-fg-muted hover:text-fg-primary hover:scale-105'
                }`}
            >
              <link.icon className={`w-5 h-5 ${link.active ? 'text-accent' : 'text-fg-muted'}`} />
              <span className="font-display">{link.label}</span>
            </Link>
          ))}
          <div className="w-px h-6 bg-fg-muted opacity-20 mx-2" />
          <LanguageSwitcher />
        </div>

        {/* Mobile Hamburger Button (Hidden on desktop) */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden flex items-center justify-center w-10 h-10 rounded-2xl neumorphic-button p-0 shadow-none hover:shadow-none active:shadow-inset"
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

              <div className="flex justify-between items-center px-2">
                <span className="text-sm font-medium text-fg-muted">{t('settingsTitle')}</span>
                <LanguageSwitcher />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
