import { Folder, PracticeStats, Page, ImageReference } from '../types';

export const MOCK_FOLDERS: Folder[] = [
  {
    id: '1',
    name: '初始相册',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    imageIds: Array.from({ length: 48 }, (_, i) => `h-${i}`),
    practiceCount: 12,
    completedCount: 10,
    references: Array.from({ length: 48 }).map((_, i) => ({
      id: `h-${i}`,
      folderId: '1',
      fileName: `hand_${i}.jpg`,
      fileType: 'image/jpeg',
      fileSize: 150000 + i * 1000,
      addedAt: new Date(Date.now() - (48 - i) * 24 * 60 * 60 * 1000),
      tags: [],
      isCompleted: i % 5 === 0,
      completed: i % 5 === 0,
      url: `https://picsum.photos/seed/hand${i}/600/800`,
      title: `手部练习 ${i + 1}`
    })),
    lastOpened: new Date(Date.now() - 24 * 60 * 60 * 1000),
    coverImage: 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?q=80&w=400&auto=format&fit=crop',
    imageCount: 48
  },
  {
    id: '2',
    name: '赛博朋克道具',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    imageIds: [],
    practiceCount: 5,
    completedCount: 2,
    references: [],
    lastOpened: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    coverImage: 'https://images.unsplash.com/photo-1605142859862-978be7eba909?q=80&w=400&auto=format&fit=crop',
    imageCount: 0
  },
  {
    id: '3',
    name: '风景研究',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    imageIds: [],
    practiceCount: 8,
    completedCount: 5,
    references: [],
    lastOpened: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    coverImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=400&auto=format&fit=crop',
    imageCount: 0
  },
  {
    id: '4',
    name: '希腊雕像',
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    imageIds: [],
    practiceCount: 3,
    completedCount: 1,
    references: [],
    lastOpened: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    coverImage: 'https://images.unsplash.com/photo-1549490349-8643362247b5?q=80&w=400&auto=format&fit=crop',
    imageCount: 0
  }
];

export const INITIAL_STATS: PracticeStats = {
  totalSessions: 28,
  totalDuration: 680,
  totalImagesCompleted: 342,
  averageSessionDuration: 24,
  weeklyGoal: 300,
  weeklyProgress: 240,
  streak: 5,
  totalHours: 11,
  totalMinutes: 20,
  totalWorks: 128,
  weeklyTrend: [
    { day: '周一', minutes: 45 },
    { day: '周二', minutes: 30 },
    { day: '周三', minutes: 60 },
    { day: '周四', minutes: 20 },
    { day: '周五', minutes: 55 },
    { day: '周六', minutes: 90 },
    { day: '周日', minutes: 40 }
  ]
};
