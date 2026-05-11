'use client';

import { Link, usePathname } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import React from 'react';

export interface NavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
  variant?: 'default' | 'action';
  activePath?: string;
}

interface NeumorphicBottomNavProps {
  items: NavItem[];
}

export default function NeumorphicBottomNav({ items }: NeumorphicBottomNavProps) {
  const pathname = usePathname();

  const isActive = (item: NavItem) => {
    if (item.activePath) {
      return pathname.startsWith(item.activePath);
    }
    return pathname === item.href;
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[50] flex items-center p-2 rounded-full bg-bg-base/80 backdrop-blur-lg shadow-extruded border border-white/5">
      {items.map((item, index) => (
        <React.Fragment key={item.href}>
          {index > 0 && (
            <div className="w-px h-6 bg-fg-muted/20 mx-2" />
          )}
          
          {item.variant === 'action' ? (
            <Link
              href={item.href}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-bg-base text-accent shadow-extruded-sm hover:scale-110 active:shadow-inset transition-all"
              title={item.label}
            >
              {item.icon}
            </Link>
          ) : (
            <Link
              href={item.href}
              className={cn(
                'flex items-center gap-2 px-6 py-3 rounded-full transition-all',
                isActive(item)
                  ? 'bg-accent text-white shadow-extruded-sm scale-105'
                  : 'text-fg-muted hover:text-fg-primary'
              )}
            >
              {item.icon}
              <span className="font-bold text-sm hidden sm:inline">{item.label}</span>
            </Link>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
