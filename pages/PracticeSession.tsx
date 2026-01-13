
import React, { useState, useEffect, useRef } from 'react';
import { Folder, PracticeSession as SessionParams } from '../types';

interface PracticeSessionProps {
  folder: Folder;
  session: SessionParams;
  onMarkComplete: (imageId: string) => void;
  onFinish: () => void;
  onQuit: () => void;
}

const PracticeSession: React.FC<PracticeSessionProps> = ({ folder, session, onMarkComplete, onFinish, onQuit }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(session.timePerImage);
  const [isPaused, setIsPaused] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showUI, setShowUI] = useState(true);

  // Zoom and Pan state
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  
  const timerRef = useRef<number | null>(null);
  const uiTimeoutRef = useRef<number | null>(null);
  const touchState = useRef({
    initialDistance: 0,
    initialScale: 1,
    lastTouch: { x: 0, y: 0 },
    isZooming: false,
    isPanning: false,
    lastTapTime: 0
  });

  const images = React.useMemo(() => {
    let list = folder.references.filter(r => !r.completed);
    if (session.mode === 'random') {
      list = [...list].sort(() => Math.random() - 0.5);
    }
    return list.slice(0, session.imageCount);
  }, [folder, session]);

  useEffect(() => {
    if (images.length === 0) {
      onQuit();
      return;
    }
    
    if (!isPaused && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleMarkCurrentComplete();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, timeLeft, images]);

  useEffect(() => {
    if (!isPaused && showUI) {
      if (uiTimeoutRef.current) clearTimeout(uiTimeoutRef.current);
      uiTimeoutRef.current = window.setTimeout(() => setShowUI(false), 3000);
    }
  }, [currentIndex, isPaused, showUI, scale, offset]);

  const resetView = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setRotation(0);
    setFlipped(false);
  };

  const handleMarkCurrentComplete = () => {
    const currentImgId = images[currentIndex]?.id;
    if (currentImgId) onMarkComplete(currentImgId);
    handleNext();
  };

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setTimeLeft(session.timePerImage);
      resetView();
    } else {
      onFinish();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setTimeLeft(session.timePerImage);
      resetView();
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Improved Touch handlers for Zoom and Pan
  const handleTouchStart = (e: React.TouchEvent) => {
    const now = Date.now();
    
    // Double Tap detection to Reset
    if (now - touchState.current.lastTapTime < 300) {
      resetView();
      touchState.current.lastTapTime = 0;
      return;
    }
    touchState.current.lastTapTime = now;

    if (e.touches.length === 2) {
      touchState.current.isZooming = true;
      touchState.current.isPanning = false;
      const dist = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      touchState.current.initialDistance = dist;
      touchState.current.initialScale = scale;
    } else if (e.touches.length === 1) {
      touchState.current.isPanning = true;
      touchState.current.lastTouch = { x: e.touches[0].pageX, y: e.touches[0].pageY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchState.current.isZooming) {
      const dist = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      if (touchState.current.initialDistance > 0) {
        const newScale = Math.min(5, Math.max(1, (dist / touchState.current.initialDistance) * touchState.current.initialScale));
        setScale(newScale);
      }
    } else if (e.touches.length === 1 && touchState.current.isPanning && scale > 1) {
      const dx = e.touches[0].pageX - touchState.current.lastTouch.x;
      const dy = e.touches[0].pageY - touchState.current.lastTouch.y;
      
      // Basic bounding for pan
      setOffset(prev => ({
        x: Math.abs(prev.x + dx) < window.innerWidth * scale ? prev.x + dx : prev.x,
        y: Math.abs(prev.y + dy) < window.innerHeight * scale ? prev.y + dy : prev.y,
      }));
      
      touchState.current.lastTouch = { x: e.touches[0].pageX, y: e.touches[0].pageY };
    }
  };

  const handleTouchEnd = () => {
    touchState.current.isZooming = false;
    touchState.current.isPanning = false;
    if (scale <= 1.05) {
      setOffset({ x: 0, y: 0 });
      setScale(1);
    }
  };

  const toggleUI = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    if (scale > 1.1) return; // Prevent toggle when zoomed in to focus on detail
    setShowUI(!showUI);
  };

  const currentImage = images[currentIndex];
  if (!currentImage) return null;

  return (
    <div 
      className="fixed inset-0 w-full h-full bg-black flex items-center justify-center overflow-hidden touch-none"
      onClick={toggleUI}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Image Container */}
      <div 
        className="absolute inset-0 w-full h-full flex items-center justify-center origin-center will-change-transform"
        style={{ 
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`
        }}
      >
        <img 
          src={currentImage.url} 
          alt="Reference" 
          className="max-w-full max-h-full object-contain select-none pointer-events-none transition-transform duration-500 ease-out"
          style={{
            transform: `rotate(${rotation}deg) scaleX(${flipped ? -1 : 1})`
          }}
        />
      </div>

      {/* Mini Floating Timer (Corner) */}
      <div className={`absolute top-12 right-6 z-50 transition-all duration-700 pointer-events-none ${showUI ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`}>
        <div className="bg-black/40 backdrop-blur-xl px-4 py-2 rounded-full border border-white/5 flex items-center gap-3">
          <div className="size-2 rounded-full bg-primary animate-pulse" />
          <span className="text-white font-bold text-sm tabular-nums tracking-[0.1em]">
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {/* Top Header UI */}
      <header className={`absolute top-0 left-0 right-0 p-6 pt-12 flex items-center justify-between z-[100] transition-all duration-500 bg-gradient-to-b from-black/70 to-transparent ${showUI ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8 pointer-events-none'}`}>
        <button 
          onClick={(e) => { e.stopPropagation(); onQuit(); }} 
          className="size-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md text-white active:scale-90 transition-transform"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
        <div className="text-center">
          <h1 className="text-[9px] uppercase tracking-[0.4em] font-black text-white/30 truncate max-w-[120px]">{folder.name}</h1>
          <div className="text-white text-sm font-bold mt-1">
            {currentIndex + 1} / {images.length}
          </div>
        </div>
        <div className="size-10" />
      </header>

      {/* Bottom Controls UI */}
      <div className={`absolute bottom-0 left-0 right-0 px-6 pb-12 pt-24 transition-all duration-500 bg-gradient-to-t from-black/80 to-transparent flex flex-col items-center z-[100] ${showUI ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12 pointer-events-none'}`}>
        
        <div className="text-7xl font-extralight tracking-[0.15em] text-white tabular-nums mb-12 drop-shadow-2xl">
          {formatTime(timeLeft)}
        </div>

        <div className="w-full max-w-sm bg-black/50 backdrop-blur-3xl rounded-[3rem] p-4 flex items-center justify-between gap-2 border border-white/5 shadow-2xl">
          <div className="flex items-center gap-1">
            <button 
              onClick={(e) => { e.stopPropagation(); setRotation(r => r + 90); }}
              className="size-11 flex items-center justify-center rounded-full text-white/30 hover:text-white active:scale-90 transition-all"
            >
              <span className="material-symbols-outlined">rotate_right</span>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setFlipped(f => !f); }}
              className="size-11 flex items-center justify-center rounded-full text-white/30 hover:text-white active:scale-90 transition-all"
            >
              <span className="material-symbols-outlined">flip</span>
            </button>
          </div>

          <div className="flex items-center gap-3 bg-white/5 rounded-full p-1.5">
            <button 
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              className="size-11 flex items-center justify-center rounded-full text-white/30 active:scale-90"
            >
              <span className="material-symbols-outlined">skip_previous</span>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setIsPaused(!isPaused); }}
              className="size-14 rounded-full bg-primary text-white flex items-center justify-center shadow-xl shadow-primary/20 active:scale-90 transition-transform"
            >
              <span className="material-symbols-outlined text-4xl filled">
                {isPaused ? 'play_arrow' : 'pause'}
              </span>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="size-11 flex items-center justify-center rounded-full text-white/30 active:scale-90"
            >
              <span className="material-symbols-outlined">skip_next</span>
            </button>
          </div>

          <button 
            onClick={(e) => { e.stopPropagation(); handleMarkCurrentComplete(); }}
            className="size-11 flex items-center justify-center rounded-full text-secondary hover:text-white active:scale-90 transition-all"
          >
            <span className="material-symbols-outlined text-4xl filled">check_circle</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PracticeSession;
