
export interface ImageReference {
  id: string;
  url: string;
  completed: boolean;
  title?: string;
}

export interface Folder {
  id: string;
  name: string;
  lastUpdated: string;
  coverImage: string;
  references: ImageReference[];
}

export interface PracticePreset {
  id: string;
  name: string;
  imageCount: number;
  timePerImage: number;
}

export interface PracticeSession {
  folderId: string;
  imageCount: number;
  timePerImage: number; // in seconds
  mode: 'random' | 'sequential';
}

export interface PracticeStats {
  streak: number;
  totalHours: number;
  totalMinutes: number;
  totalWorks: number;
  weeklyTrend: { day: string; minutes: number }[];
}

export enum Page {
  HOME = 'HOME',
  PRACTICE = 'PRACTICE',
  STATS = 'STATS',
  SETTINGS = 'SETTINGS',
  FOLDER_DETAIL = 'FOLDER_DETAIL',
  PRACTICE_CONFIG = 'PRACTICE_CONFIG',
  PRACTICE_SESSION = 'PRACTICE_SESSION'
}
