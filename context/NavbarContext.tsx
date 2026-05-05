'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface NavbarContextType {
  isHidden: boolean;
  setIsHidden: (hidden: boolean) => void;
}

const NavbarContext = createContext<NavbarContextType | undefined>(undefined);

export function NavbarProvider({ children }: { children: ReactNode }) {
  const [isHidden, setIsHidden] = useState(false);

  return (
    <NavbarContext.Provider value={{ isHidden, setIsHidden }}>
      {children}
    </NavbarContext.Provider>
  );
}

export function useNavbar() {
  const context = useContext(NavbarContext);
  if (context === undefined) {
    throw new Error('useNavbar must be used within a NavbarProvider');
  }
  return context;
}
