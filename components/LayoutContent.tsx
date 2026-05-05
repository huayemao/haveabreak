'use client';

import { useNavbar } from '@/context/NavbarContext';
import { ReactNode } from 'react';

export default function LayoutContent({ children }: { children: ReactNode }) {
  const { isHidden } = useNavbar();

  return (
    <div className="min-h-screen flex flex-col">
      {children}
    </div>
  );
}
