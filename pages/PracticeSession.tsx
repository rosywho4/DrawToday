
import React, { useState, useEffect, useRef } from 'react';
import { Folder, PracticeSession as SessionParams, ImageReference } from '../types';

// IndexedDB 配置，用于从数据库加载图片
const DB_NAME = 'SketchSerenityDB';
const IMAGES_STORE_NAME = 'Images';
const DB_VERSION = 3;

interface StoredImage {
  id: string;
  file: File;
  folderId: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(IMAGES_STORE_NAME)) {
        const imagesStore = db.createObjectStore(IMAGES_STORE_NAME, { keyPath: 'id' });
        imagesStore.createIndex('folderId', 'folderId', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// 按ID获取图片
async function getImageFromDB(imageId: string): Promise<StoredImage | null> {
  const db = await openDB();
  return new Promise((resolve) => {
    const request = db.transaction(IMAGES_STORE_NAME).objectStore(IMAGES_STORE_NAME).get(imageId);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => resolve(null);
  });
}

// 生成持久化URL
function createPersistentURL(file: File): string {
  return URL.createObjectURL(file);
}

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
  const [processedImages, setProcessedImages] = useState<ImageReference[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    lastTapTime: 0,
    moved: false // 用于区分点击和拖拽
  });

  // 从IndexedDB加载图片并重新生成URL
  useEffect(() => {
    const loadImages = async () => {
      setIsLoading(true);
      // 获取未完成的图片列表
      const uncompletedImages = folder.references.filter(r => !r.completed);
      
      // 处理每张图片，从IndexedDB加载并重新生成URL
      const processed = await Promise.all(
        uncompletedImages.map(async (img) => {
          // 如果是本地文件（强连接模式），直接使用原始URL
          if (img.isLocalFile) {
            return img;
          }
          
          // 如果URL已经是有效的http/https链接，直接使用
          if (img.url && (img.url.startsWith('http://') || img.url.startsWith('https://'))) {
            return img;
          }
          
          // 否则从IndexedDB加载图片
          const storedImg = await getImageFromDB(img.id);
          if (storedImg) {
            // 从IndexedDB加载成功，生成新的URL
            return {
              ...img,
              url: createPersistentURL(storedImg.file)
            };
          }
          
          // 加载失败，返回原图片
          return img;
        })
      );
      
      // 应用随机或顺序模式
      let finalImages = [...processed];
      if (session.mode === 'random') {
        finalImages = finalImages.sort(() => Math.random() - 0.5);
      }
      
      // 限制图片数量
      finalImages = finalImages.slice(0, session.imageCount);
      
      setProcessedImages(finalImages);
      setIsLoading(false);
    };
    
    loadImages();
  }, [folder, session]);

  // 组件卸载时释放所有Blob URL
  useEffect(() => {
    return () => {
      processedImages.forEach(img => {
        if (img.url && img.url.startsWith('blob:')) {
          URL.revokeObjectURL(img.url);
        }
      });
    };
  }, [processedImages]);

  // 使用处理后的图片列表
  const images = processedImages;

  useEffect(() => {
    if (!isLoading && images.length === 0) {
      onQuit();
      return;
    }
    
    if (!isLoading && !isPaused && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (!isLoading && timeLeft === 0) {
      handleMarkCurrentComplete();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLoading, isPaused, timeLeft, images]);

  useEffect(() => {
    if (!isPaused && showUI) {
      if (uiTimeoutRef.current) clearTimeout(uiTimeoutRef.current);
      uiTimeoutRef.current = window.setTimeout(() => setShowUI(false), 3000);
    }
  }, [currentIndex, isPaused, showUI]);

  const resetTransform = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const fullReset = () => {
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
      fullReset();
    } else {
      onFinish();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setTimeLeft(session.timePerImage);
      fullReset();
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchState.current.moved = false;
    
    if (e.touches.length === 2) {
      e.preventDefault();
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
      touchState.current.isZooming = false;
      touchState.current.lastTouch = { x: e.touches[0].pageX, y: e.touches[0].pageY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchState.current.moved = true;
    
    if (e.touches.length === 2 && touchState.current.isZooming) {
      e.preventDefault();
      const dist = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      if (touchState.current.initialDistance > 0) {
        const newScale = Math.min(10, Math.max(0.8, (dist / touchState.current.initialDistance) * touchState.current.initialScale));
        setScale(newScale);
      }
    } else if (e.touches.length === 1 && touchState.current.isPanning) {
      const dx = e.touches[0].pageX - touchState.current.lastTouch.x;
      const dy = e.touches[0].pageY - touchState.current.lastTouch.y;
      
      setOffset(prev => ({
        x: prev.x + dx,
        y: prev.y + dy,
      }));
      
      touchState.current.lastTouch = { x: e.touches[0].pageX, y: e.touches[0].pageY };
    }
  };

  const handleTouchEnd = () => {
    touchState.current.isZooming = false;
    touchState.current.isPanning = false;
    
    if (scale < 1) {
      setScale(1);
      setOffset({ x: 0, y: 0 });
    }
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    // 如果刚刚发生了拖拽或缩放，不触发点击
    if (touchState.current.moved) return;
    
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    
    // 移除之前的缩放限制，现在任何状态都可以点击切换 UI
    setShowUI(prev => !prev);
  };

  const currentImage = images[currentIndex];

  // 显示加载状态
  if (isLoading) {
    return (
      <div className="fixed inset-0 w-full h-full bg-black flex flex-col items-center justify-center overflow-hidden touch-none">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
        <p className="text-white font-black text-lg">加载图片中...</p>
      </div>
    );
  }

  // 图片加载完成但没有图片，退出
  if (!currentImage) {
    onQuit();
    return null;
  }

  return (
    <div 
      className="fixed inset-0 w-full h-full bg-black flex items-center justify-center overflow-hidden touch-none"
      onClick={handleContainerClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        className="absolute inset-0 w-full h-full flex items-center justify-center origin-center will-change-transform transition-transform duration-75"
        style={{ 
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`
        }}
      >
        <img 
          src={currentImage.url} 
          alt="Reference" 
          className="max-w-full max-h-full object-contain select-none pointer-events-none transition-transform duration-300 ease-out"
          style={{
            transform: `rotate(${rotation}deg) scaleX(${flipped ? -1 : 1})`
          }}
        />
      </div>

      <div className={`absolute top-12 right-6 z-50 transition-all duration-700 pointer-events-none ${showUI ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`}>
        <div className="bg-black/40 backdrop-blur-xl px-5 py-2.5 rounded-full border border-white/5 flex items-center gap-3">
          <div className="size-2.5 rounded-full bg-primary animate-pulse" />
          <span className="text-white font-black text-sm tabular-nums tracking-[0.1em]">
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      <header className={`absolute top-0 left-0 right-0 p-6 pt-14 flex items-center justify-between z-[100] transition-all duration-500 bg-gradient-to-b from-black/80 to-transparent ${showUI ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-12 pointer-events-none'}`}>
        <button 
          onClick={(e) => { e.stopPropagation(); onQuit(); }} 
          className="size-11 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md text-white active:scale-90 transition-transform"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
        <div className="text-center">
          <h1 className="text-[10px] uppercase tracking-[0.4em] font-black text-white/40 truncate max-w-[140px]">{folder.name}</h1>
          <div className="text-white text-base font-black mt-1">
            {currentIndex + 1} / {images.length}
          </div>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); resetTransform(); }} 
          className="size-11 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md text-white/40 active:text-white transition-all"
        >
          <span className="material-symbols-outlined">center_focus_strong</span>
        </button>
      </header>

      <div className={`absolute bottom-0 left-0 right-0 px-6 pb-14 pt-24 transition-all duration-500 bg-gradient-to-t from-black/90 to-transparent flex flex-col items-center z-[100] ${showUI ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12 pointer-events-none'}`}>
        
        <div className="text-6xl font-thin tracking-[0.1em] text-white tabular-nums mb-8 drop-shadow-xl opacity-90">
          {formatTime(timeLeft)}
        </div>

        <div className="w-full max-w-xs bg-black/40 backdrop-blur-[40px] rounded-[3rem] p-2.5 flex items-center justify-between gap-1.5 border border-white/10 shadow-xl shadow-black/50">
          <div className="flex items-center gap-0.5">
            <button 
              onClick={(e) => { e.stopPropagation(); setRotation(r => r + 90); }}
              className="size-9 flex items-center justify-center rounded-full text-white/40 hover:text-white active:scale-90 transition-all bg-white/5"
            >
              <span className="material-symbols-outlined text-base">rotate_right</span>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setFlipped(f => !f); }}
              className="size-9 flex items-center justify-center rounded-full text-white/40 hover:text-white active:scale-90 transition-all bg-white/5"
            >
              <span className="material-symbols-outlined text-base">flip</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-white/5 rounded-full p-1">
            <button 
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              className="size-8 flex items-center justify-center rounded-full text-white/30 active:text-white active:scale-90"
            >
              <span className="material-symbols-outlined text-lg">skip_previous</span>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setIsPaused(!isPaused); }}
              className="size-13 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/40 active:scale-90 transition-transform"
            >
              <span className="material-symbols-outlined text-3xl filled leading-none">
                {isPaused ? 'play_arrow' : 'pause'}
              </span>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="size-8 flex items-center justify-center rounded-full text-white/30 active:text-white active:scale-90"
            >
              <span className="material-symbols-outlined text-lg">skip_next</span>
            </button>
          </div>

          <button 
            onClick={(e) => { e.stopPropagation(); handleMarkCurrentComplete(); }}
            className="size-11 flex items-center justify-center rounded-full text-secondary active:scale-90 transition-all"
          >
            <span className="material-symbols-outlined text-2xl filled">check_circle</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PracticeSession;
