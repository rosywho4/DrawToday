export interface ImageReference {
  id: string;
  uri: string;
  localUri?: string;
  completed: boolean;
  title?: string;
}

export interface Folder {
  id: string;
  name: string;
  lastUpdated: string;
  lastOpened: string;
  coverImage: string;
  coverImageId?: string;
  references: ImageReference[];
  mediaIds?: string[];
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
  timePerImage: number;
  mode: 'random' | 'sequential';
}

export interface PracticeStats {
  streak: number;
  totalHours: number;
  totalMinutes: number;
  totalWorks: number;
  weeklyTrend: { day: string; minutes: number }[];
}

export type RootStackParamList = {
  Home: undefined;
  FolderDetail: { folder: Folder };
  PracticeConfig: { folder: Folder };
  PracticeSession: { session: PracticeSession };
  Statistics: undefined;
  Settings: undefined;
};

export type TabParamList = {
  HomeTab: undefined;
  StatsTab: undefined;
  SettingsTab: undefined;
};
