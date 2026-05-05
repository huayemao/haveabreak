'use client';

import { useNavbar } from '@/context/NavbarContext';
import { ReactNode } from 'react';

export default function LayoutContent({ children }: { children: ReactNode }) {
  const { isHidden } = useNavbar();

  return (
    <div className={`transition-all duration-300 min-h-screen flex flex-col ${isHidden ? 'pt-0' : 'pt-28'}`}>
      {children}
    </div>
  );
}
