import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PracticeSession, PracticePreset, DEFAULT_PRESETS } from '../types';

interface SessionContextType {
  activeSession: PracticeSession | null;
  setActiveSession: (session: PracticeSession | null) => void;
  presets: PracticePreset[];
  savePreset: (preset: PracticePreset) => void;
  deletePreset: (id: string) => void;
}

const PRESETS_STORAGE_KEY = 'drawtoday_presets_v1';

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [activeSession, setActiveSession] = useState<PracticeSession | null>(null);
  const [presets, setPresets] = useState<PracticePreset[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_PRESETS;
    const saved = localStorage.getItem(PRESETS_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const customs = parsed.filter((p: PracticePreset) => !DEFAULT_PRESETS.some(dp => dp.id === p.id));
        return [...DEFAULT_PRESETS, ...customs];
      } catch {
        return DEFAULT_PRESETS;
      }
    }
    return DEFAULT_PRESETS;
  });

  useEffect(() => {
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
  }, [presets]);

  const savePreset = (preset: PracticePreset) => {
    setPresets(prev => [...prev, preset]);
  };

  const deletePreset = (id: string) => {
    if (DEFAULT_PRESETS.some(p => p.id === id)) return;
    setPresets(prev => prev.filter(p => p.id !== id));
  };

  return (
    <SessionContext.Provider value={{ activeSession, setActiveSession, presets, savePreset, deletePreset }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
