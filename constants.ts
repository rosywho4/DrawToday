
import { Folder, PracticeStats } from './types';

export const MOCK_FOLDERS: Folder[] = [
  {
    id: '1',
    name: '解剖学 - 手部',
    lastUpdated: '昨天',
    coverImage: 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?q=80&w=400&auto=format&fit=crop',
    references: Array.from({ length: 48 }).map((_, i) => ({
      id: `h-${i}`,
      url: `https://picsum.photos/seed/hand${i}/600/800`,
      completed: i % 5 === 0
    }))
  },
  {
    id: '2',
    name: '赛博朋克道具',
    lastUpdated: '3天前',
    coverImage: 'https://images.unsplash.com/photo-1605142859862-978be7eba909?q=80&w=400&auto=format&fit=crop',
    references: []
  },
  {
    id: '3',
    name: '风景研究',
    lastUpdated: '1周前',
    coverImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=400&auto=format&fit=crop',
    references: []
  },
  {
    id: '4',
    name: '希腊雕像',
    lastUpdated: '2周前',
    coverImage: 'https://images.unsplash.com/photo-1549490349-8643362247b5?q=80&w=400&auto=format&fit=crop',
    references: []
  }
];

export const INITIAL_STATS: PracticeStats = {
  streak: 5,
  totalHours: 12,
  totalMinutes: 45,
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
