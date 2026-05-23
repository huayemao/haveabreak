'use client';

import { useNavbar } from '@/context/NavbarContext';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface LayoutContentProps {
  children: ReactNode;
  className?: string;
  safeAreaTop?: boolean;
}

export default function LayoutContent({ children, className, safeAreaTop = true }: LayoutContentProps) {
  const { isHidden } = useNavbar();

  return (
    <div className={cn(
      "min-h-screen flex flex-col",
      safeAreaTop && "safe-area-top-mb",
      className
    )}>
      {children}
    </div>
  );
}
