'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface BilingualModeContextType {
  isBilingualMode: boolean;
  toggleBilingualMode: () => void;
}

const BilingualModeContext = createContext<BilingualModeContextType | undefined>(undefined);

const STORAGE_KEY = 'bilingual-mode-enabled';

export function BilingualModeProvider({ children }: { children: ReactNode }) {
  const [isBilingualMode, setIsBilingualMode] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setIsBilingualMode(stored === 'true');
    }
    setIsInitialized(true);
  }, []);

  // Save to localStorage when changed
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_KEY, String(isBilingualMode));
    }
  }, [isBilingualMode, isInitialized]);

  // Sync across tabs via storage event
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue !== null) {
        setIsBilingualMode(e.newValue === 'true');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const toggleBilingualMode = () => {
    setIsBilingualMode((prev) => !prev);
  };

  return (
    <BilingualModeContext.Provider value={{ isBilingualMode, toggleBilingualMode }}>
      {children}
    </BilingualModeContext.Provider>
  );
}

export function useBilingualMode() {
  const context = useContext(BilingualModeContext);
  if (context === undefined) {
    throw new Error('useBilingualMode must be used within a BilingualModeProvider');
  }
  return context;
}
