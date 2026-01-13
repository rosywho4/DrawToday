
import React from 'react';
import { Page } from '../types';

interface BottomNavProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentPage, onNavigate }) => {
  // Merged Gallery and Practice into one primary entry point
  const items = [
    { id: Page.HOME, label: '练习', icon: 'timer' },
    { id: Page.STATS, label: '统计', icon: 'analytics' },
    { id: Page.SETTINGS, label: '设置', icon: 'settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-black/5 px-8 pt-3 pb-8 flex justify-between items-center z-50">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          className={`flex flex-col items-center gap-1 transition-all active:scale-95 ${
            currentPage === item.id || (item.id === Page.HOME && currentPage === Page.FOLDER_DETAIL) 
              ? 'text-primary' 
              : 'text-slate-400'
          }`}
        >
          <span className={`material-symbols-outlined text-2xl ${(currentPage === item.id || (item.id === Page.HOME && currentPage === Page.FOLDER_DETAIL)) ? 'filled' : ''}`}>
            {item.icon}
          </span>
          <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default BottomNav;
