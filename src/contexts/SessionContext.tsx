import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PracticeSession, PracticePreset, DEFAULT_PRESETS } from '../types';

export interface PracticeHistory {
  id: string;
  folderId: string;
  folderName: string;
  date: Date;
  duration: number; // 实际练习时长（分钟）
  imageCount: number; // 完成的图片数量
  completedImageIds: string[];
}

interface SessionContextType {
  activeSession: PracticeSession | null;
  setActiveSession: (session: PracticeSession | null) => void;
  presets: PracticePreset[];
  savePreset: (preset: PracticePreset) => void;
  deletePreset: (id: string) => void;
  practiceHistory: PracticeHistory[];
  addPracticeHistory: (history: PracticeHistory) => void;
  clearPracticeHistory: () => void;
}

const PRESETS_STORAGE_KEY = 'drawtoday_presets_v1';
const HISTORY_STORAGE_KEY = 'drawtoday_history_v1';

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

  const [practiceHistory, setPracticeHistory] = useState<PracticeHistory[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((h: any) => ({
          ...h,
          date: new Date(h.date)
        }));
      } catch {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
  }, [presets]);

  useEffect(() => {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(practiceHistory));
  }, [practiceHistory]);

  const savePreset = (preset: PracticePreset) => {
    setPresets(prev => [...prev, preset]);
  };

  const deletePreset = (id: string) => {
    if (DEFAULT_PRESETS.some(p => p.id === id)) return;
    setPresets(prev => prev.filter(p => p.id !== id));
  };

  const addPracticeHistory = (history: PracticeHistory) => {
    setPracticeHistory(prev => [history, ...prev]);
  };

  const clearPracticeHistory = () => {
    setPracticeHistory([]);
  };

  return (
    <SessionContext.Provider value={{ 
      activeSession, 
      setActiveSession, 
      presets, 
      savePreset, 
      deletePreset,
      practiceHistory,
      addPracticeHistory,
      clearPracticeHistory
    }}>
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
