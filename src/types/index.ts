export enum Page {
  HOME = 'HOME',
  PRACTICE = 'PRACTICE',
  STATS = 'STATS',
  SETTINGS = 'SETTINGS',
  FOLDER_DETAIL = 'FOLDER_DETAIL',
  PRACTICE_CONFIG = 'PRACTICE_CONFIG',
  PRACTICE_SESSION = 'PRACTICE_SESSION'
}

export interface Folder {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  imageIds: string[];
  practiceCount: number;
  completedCount: number;
  references: ImageReference[];
  lastOpened: Date;
  coverImage?: string;
  coverId?: string; // 封面图片的ID，用于从IndexedDB加载
  imageCount?: number;
}

export interface ImageReference {
  id: string;
  folderId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  addedAt: Date;
  tags: string[];
  notes?: string;
  isCompleted: boolean;
  completedAt?: Date;
  completionTime?: number; // 秒
  completed?: boolean; // 兼容旧代码
  note?: string; // 兼容旧代码
  url: string; // 图片URL
  title?: string; // 图片标题
}

export interface PracticeSession {
  id: string;
  folderId: string;
  startTime: Date;
  endTime?: Date;
  targetDuration: number; // 分钟
  completedImageIds: string[];
  skippedImageIds: string[];
  totalDuration?: number; // 秒
  actualDuration?: number; // 秒
  timePerImage?: number; // 每张图片时间（秒）
  imageCount?: number; // 图片数量
  mode?: "random" | "sequential"; // 练习模式
  imageIds?: string[]; // 固定的图片列表（按练习顺序）
}

export interface PracticePreset {
  id: string;
  name: string;
  duration: number; // 分钟
  imageSelection: 'all' | 'incomplete' | 'completed';
  autoAdvance: boolean;
  notes?: string;
  imageCount?: number; // 图片数量
  timePerImage?: number; // 每张图片时间（秒）
}

export const DEFAULT_PRESETS: PracticePreset[] = [
  {
    id: 'quick-15',
    name: '快速练习 (15分钟)',
    duration: 15,
    imageSelection: 'incomplete',
    autoAdvance: true,
    imageCount: 5,
    timePerImage: 180
  },
  {
    id: 'focus-30',
    name: '专注练习 (30分钟)',
    duration: 30,
    imageSelection: 'all',
    autoAdvance: false,
    imageCount: 10,
    timePerImage: 180
  },
  {
    id: 'deep-60',
    name: '深度练习 (60分钟)',
    duration: 60,
    imageSelection: 'all',
    autoAdvance: false,
    imageCount: 12,
    timePerImage: 300
  }
];

export interface PracticeStats {
  totalSessions: number;
  totalDuration: number; // 分钟
  totalImagesCompleted: number;
  averageSessionDuration: number; // 分钟
  lastSessionDate?: Date;
  weeklyGoal: number; // 分钟
  weeklyProgress: number; // 分钟
  streak: number; // 连续天数
  totalHours: number; // 总小时数
  totalMinutes: number; // 总分钟数（用于显示）
  totalWorks: number; // 总作品数
  weeklyTrend: Array<{ day: string; minutes: number }>; // 每周趋势
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export const DEFAULT_TAGS: Tag[] = [
  { id: 'anatomy', name: '解剖', color: '#FF6B6B' },
  { id: 'structure', name: '结构', color: '#4ECDC4' },
  { id: 'lighting', name: '光影', color: '#45B7D1' },
  { id: 'perspective', name: '透视', color: '#96CEB4' },
  { id: 'dynamic', name: '动态', color: '#FFEAA7' },
  { id: 'expression', name: '表情', color: '#DDA0DD' },
  { id: 'clothing', name: '服装', color: '#98D8C8' },
  { id: 'props', name: '道具', color: '#F7DC6F' }
];

export const TAG_COLORS: Record<string, string> = {
  'anatomy': '#FF6B6B',
  'structure': '#4ECDC4',
  'lighting': '#45B7D1',
  'perspective': '#96CEB4',
  'dynamic': '#FFEAA7',
  'expression': '#DDA0DD',
  'clothing': '#98D8C8',
  'props': '#F7DC6F',
  // 向后兼容
  '解剖': '#FF6B6B',
  '结构': '#4ECDC4',
  '光影': '#45B7D1',
  '透视': '#96CEB4',
  '动态': '#FFEAA7',
  '表情': '#DDA0DD',
  '服装': '#98D8C8',
  '道具': '#F7DC6F'
};
