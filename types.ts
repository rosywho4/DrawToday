
export interface ImageReference {
  id: string;
  url: string;
  completed: boolean;
  title?: string;
  isLocalFile?: boolean; // 标记是否为本地文件系统资源
}

export interface Folder {
  id: string;
  name: string;
  lastUpdated: string;
  lastOpened: string; // 最近打开时间
  coverImage: string;
  coverImageId?: string; // 封面图片的ID，用于重新生成封面URL
  references: ImageReference[];
  linkedPath?: string; // 存储本地文件夹的友好路径名称
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
