import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Page } from '../../types';

interface BottomNavProps {
  currentPage: Page | string;
}

export default function BottomNav({ currentPage }: BottomNavProps) {
  const navigate = useNavigate();

  const items = [
    { id: 'home', label: '练习', icon: 'timer', path: '/' },
    { id: 'stats', label: '统计', icon: 'analytics', path: '/statistics' },
    { id: 'settings', label: '设置', icon: 'settings', path: '/settings' }
  ];

  const isActive = (path: string) => {
    if (path === '/') return currentPage === 'home';
    return currentPage === path.substring(1);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-black/5 px-8 pt-3 pb-8 flex justify-between items-center z-50">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => navigate(item.path)}
          className={`flex flex-col items-center gap-1 transition-all active:scale-95 ${
            isActive(item.path) ? 'text-primary' : 'text-slate-400'
          }`}
        >
          <span className={`material-symbols-outlined text-2xl ${isActive(item.path) ? 'filled' : ''}`}>
            {item.icon}
          </span>
          <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
