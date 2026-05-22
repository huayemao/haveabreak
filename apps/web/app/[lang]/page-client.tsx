'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'motion/react';
import { Link } from '@/i18n/routing';
import { Timer, Frame, ScrollText, ArrowRight } from 'lucide-react';

interface AppCardProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
}

function AppBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-xl shadow-[inset_3px_3px_6px_rgb(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.5)] bg-bg-base text-fg-muted text-xs font-medium">
      {children}
    </span>
  );
}

function AppCard({ href, icon, title, subtitle, description }: AppCardProps) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ scale: 1.02, y: -4 }}
        whileTap={{ scale: 0.98 }}
        className="group p-8 rounded-[32px] shadow-extruded bg-bg-base space-y-6 cursor-pointer transition-all duration-300 hover:shadow-[12px_12px_24px_rgb(163,177,198,0.5),-12px_-12px_24px_rgba(255,255,255,0.7)]"
      >
        <div className="flex items-start justify-between">
          <div className="w-16 h-16 rounded-2xl text-primary flex items-center justify-center shadow-[inset_10px_10px_20px_rgb(163,177,198,0.7),inset_-10px_-10px_20px_rgba(255,255,255,0.6)] bg-bg-base">
            {icon}
          </div>
          <ArrowRight className="w-6 h-6 text-fg-muted opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform group-hover:translate-x-1" />
        </div>
        <div className="space-y-3">
          <h3 className="font-display font-bold text-2xl text-fg-primary">{title}</h3>
          <AppBadge>{subtitle}</AppBadge>
        </div>
        <p className="text-fg-muted leading-relaxed">{description}</p>
      </motion.div>
    </Link>
  );
}

export default function HomePage() {
  const t = useTranslations('home');

  const apps = [
    {
      href: '/timer',
      icon: <Timer className="w-8 h-8 " />,
      titleKey: 'timer.title',
      subtitleKey: 'timer.subtitle',
      descriptionKey: 'timer.description',
    },
    {
      href: '/frame',
      icon: <Frame className="w-8 h-8 " />,
      titleKey: 'frame.title',
      subtitleKey: 'frame.subtitle',
      descriptionKey: 'frame.description',
    },
    {
      href: '/card',
      icon: <ScrollText className="w-8 h-8 " />,
      titleKey: 'card.title',
      subtitleKey: 'card.subtitle',
      descriptionKey: 'card.description',
    },
  ];

  return (
    <main className="flex-1 relative overflow-x-hidden flex flex-col">
      <div className="flex-1 flex flex-col p-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-6 mb-16"
        >
          <div className="w-24 h-24 mx-auto rounded-full shadow-extruded p-1 mb-8 bg-bg-base">
            <img src="/api/icon?size=96" alt="haveabreak logo" className="w-full h-full rounded-full" />
          </div>
          <h1 className="font-display text-5xl font-extrabold tracking-tight text-fg-primary">
            {t('title', { defaultValue: 'haveabreak' })}
          </h1>
          <p className="text-fg-muted text-lg max-w-md mx-auto">
            {t('subtitle', { defaultValue: '你的个人效率工具集' })}
          </p>
        </motion.div>

        {/* Apps Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-4xl mx-auto"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {apps.map((app, index) => (
              <motion.div
                key={app.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
              >
                <AppCard
                  href={app.href}
                  icon={app.icon}
                  title={t(app.titleKey)}
                  subtitle={t(app.subtitleKey)}
                  description={t(app.descriptionKey)}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </main>
  );
}
