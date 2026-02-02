import React from 'react';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  actions?: React.ReactNode;
  className?: string;
}

export default function Header({ title, showBack, onBack, actions, className = '' }: HeaderProps) {
  return (
    <header className={`sticky top-0 z-30 bg-bg-serenity/90 backdrop-blur-md px-6 pt-12 pb-4 flex items-center justify-between border-b border-black/5 ${className}`}>
      <div className="flex items-center gap-4">
        {showBack && (
          <button
            onClick={onBack}
            className="size-10 rounded-full bg-white flex items-center justify-center shadow-sm active:scale-90 transition-transform"
          >
            <span className="material-symbols-outlined">arrow_back_ios_new</span>
          </button>
        )}
        <h1 className="text-xl font-bold tracking-tight text-text-main">{title}</h1>
      </div>
      {actions}
    </header>
  );
}
