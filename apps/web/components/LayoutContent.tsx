'use client';

import { useNavbar } from '@/context/NavbarContext';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface LayoutContentProps {
  children: ReactNode;
  className?: string;
  safeAreaTop?: boolean;
}

export default function LayoutContent({ children, className }: LayoutContentProps) {
  const { isHidden } = useNavbar();

  return (
    <div className={cn(
      "min-h-screen flex flex-col",
      className
    )}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {children}
    </div>
  );
}
