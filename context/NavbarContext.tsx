'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface NavbarContextType {
  isHidden: boolean;
  setIsHidden: (hidden: boolean) => void;
  isPageTransitioning: boolean;
  setIsPageTransitioning: (transitioning: boolean) => void;
}

const NavbarContext = createContext<NavbarContextType | undefined>(undefined);

export function NavbarProvider({ children }: { children: ReactNode }) {
  const [isHidden, setIsHidden] = useState(false);
  const [isPageTransitioning, setIsPageTransitioning] = useState(false);

  return (
    <NavbarContext.Provider value={{ isHidden, setIsHidden, isPageTransitioning, setIsPageTransitioning }}>
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
