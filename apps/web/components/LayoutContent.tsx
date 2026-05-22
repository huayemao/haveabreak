'use client';

import { useNavbar } from '@/context/NavbarContext';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

export default function LayoutContent({ children ,className}: { children: ReactNode,className?:string }) {
  const { isHidden } = useNavbar();

  return (
    <div className={cn("min-h-screen flex flex-col",className)}>
      {children}
    </div>
  );
}
