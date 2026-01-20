
'use client';

import React, { createContext, useContext, useState } from 'react';

interface UIContextType {
  isSearchOpen: boolean;
  setSearchOpen: (isOpen: boolean) => void;
  toggleSearch: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};

export const UIProvider = ({ children }: { children: React.ReactNode }) => {
  const [isSearchOpen, setSearchOpen] = useState(false);

  const toggleSearch = () => {
    setSearchOpen((prev) => !prev);
  };

  return (
    <UIContext.Provider value={{ isSearchOpen, setSearchOpen, toggleSearch }}>
      {children}
    </UIContext.Provider>
  );
};
