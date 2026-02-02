import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFolders } from '../contexts/FoldersContext';
import { useSession } from '../contexts/SessionContext';
import { useFolderImages } from '../hooks/useFolderImages';
import { useImageViewer } from '../hooks/useImageViewer';
import { PracticeSession } from '../types';

export default function PracticeSessionPage() {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const { folders, markImageComplete } = useFolders();
  const { activeSession, setActiveSession, addPracticeHistory } = useSession();

  const folder = folders.find(f => f.id === folderId);
  const { images: allImages, isLoading } = useFolderImages(folderId || '', folder?.references || []);
  
  // 只使用未完成的图片
  const images = allImages.filter(img => !img.isCompleted && !img.completed);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(activeSession?.timePerImage || 60);
  const [isPaused, setIsPaused] = useState(false);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [startTime] = useState(new Date());

  const timerRef = useRef<number | null>(null);
  const {
    scale, offset, rotation, flipped, showUI, setRotation, setFlipped, setShowUI,
    resetTransform, fullReset, handleTouchStart, handleTouchMove, handleTouchEnd,
    handleContainerClick, autoHideUI
  } = useImageViewer();

  useEffect(() => {
    if (activeSession) {
      setTimeLeft(activeSession.timePerImage);
    }
  }, [activeSession]);

  useEffect(() => {
    if (!isLoading && images.length === 0) {
      navigate(`/folder/${folderId}`);
      return;
    }

    if (!isLoading && !isPaused && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // 倒计时结束，标记为已完成
            const currentImgId = images[currentIndex]?.id;
            if (currentImgId && folderId) {
              markImageComplete(folderId, currentImgId);
              setCompletedIds(prev => [...prev, currentImgId]);
            }
            // 返回0以触发下一次检查
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (!isLoading && timeLeft === 0) {
      // 倒计时已结束，跳转到下一张
      handleNext();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLoading, isPaused, timeLeft, images, navigate, folderId]);

  useEffect(() => {
    if (!isPaused && showUI) {
      return autoHideUI(3000);
    }
  }, [currentIndex, isPaused, showUI, autoHideUI]);

  const handleMarkCurrentComplete = () => {
    const currentImgId = images[currentIndex]?.id;
    if (currentImgId && folderId) {
      markImageComplete(folderId, currentImgId);
      setCompletedIds(prev => [...prev, currentImgId]);
    }
    handleNext();
  };

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setTimeLeft(activeSession?.timePerImage || 60);
      fullReset();
    } else {
      // 练习结束，保存历史记录
      const endTime = new Date();
      const durationMinutes = Math.ceil((endTime.getTime() - startTime.getTime()) / 60000);
      
      if (folder && completedIds.length > 0) {
        addPracticeHistory({
          id: Date.now().toString(),
          folderId: folder.id,
          folderName: folder.name,
          date: endTime,
          duration: durationMinutes,
          imageCount: completedIds.length,
          completedImageIds: completedIds
        });
      }
      
      setActiveSession(null);
      navigate('/statistics');
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setTimeLeft(activeSession?.timePerImage || 60);
      fullReset();
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 w-full h-full bg-black flex flex-col items-center justify-center overflow-hidden touch-none">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
        <p className="text-white font-black text-lg">加载图片中...</p>
      </div>
    );
  }

  const currentImage = images[currentIndex];
  if (!currentImage) return null;

  // 计算旋转后的适配尺寸
  // 当旋转90度或270度时，需要交换宽高比的适配方式
  const isRotated90or270 = rotation % 180 !== 0;
  const imageStyle = isRotated90or270 
    ? { 
        maxWidth: '100vh', 
        maxHeight: '100vw',
        transform: `rotate(${rotation}deg) scaleX(${flipped ? -1 : 1})`
      }
    : { 
        maxWidth: '100%', 
        maxHeight: '100%',
        transform: `rotate(${rotation}deg) scaleX(${flipped ? -1 : 1})`
      };

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
        style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
      >
        <img
          src={currentImage.url}
          alt="Reference"
          className="object-contain select-none pointer-events-none transition-transform duration-300 ease-out"
          style={imageStyle}
        />
      </div>

      <div className={`absolute top-12 right-6 z-50 transition-all duration-700 pointer-events-none ${showUI ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`}>
        <div className="bg-black/40 backdrop-blur-xl px-5 py-2.5 rounded-full border border-white/5 flex items-center gap-3">
          <div className="size-2.5 rounded-full bg-primary animate-pulse" />
          <span className="text-white font-black text-sm tabular-nums tracking-[0.1em]">{formatTime(timeLeft)}</span>
        </div>
      </div>

      <header className={`absolute top-0 left-0 right-0 p-6 pt-14 flex items-center justify-between z-[100] transition-all duration-500 bg-gradient-to-b from-black/80 to-transparent ${showUI ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-12 pointer-events-none'}`}>
        <button onClick={() => { setActiveSession(null); navigate(`/folder/${folderId}`); }} className="size-11 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md text-white active:scale-90 transition-transform">
          <span className="material-symbols-outlined">close</span>
        </button>
        <div className="text-center">
          <h1 className="text-[10px] uppercase tracking-[0.4em] font-black text-white/40 truncate max-w-[140px]">{folder?.name}</h1>
          <div className="text-white text-base font-black mt-1">{currentIndex + 1} / {images.length}</div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); resetTransform(); }} className="size-11 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md text-white/40 active:text-white transition-all">
          <span className="material-symbols-outlined">center_focus_strong</span>
        </button>
      </header>

      <div className={`absolute bottom-0 left-0 right-0 px-6 pb-14 pt-24 transition-all duration-500 bg-gradient-to-t from-black/90 to-transparent flex flex-col items-center z-[100] ${showUI ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12 pointer-events-none'}`}>
        <div className="text-6xl font-thin tracking-[0.1em] text-white tabular-nums mb-8 drop-shadow-xl opacity-90">{formatTime(timeLeft)}</div>

        <div className="w-full max-w-xs bg-black/40 backdrop-blur-[40px] rounded-[3rem] p-2.5 flex items-center justify-between gap-1.5 border border-white/10 shadow-xl shadow-black/50">
          <div className="flex items-center gap-0.5">
            <button onClick={(e) => { e.stopPropagation(); setRotation(r => r + 90); }} className="size-9 flex items-center justify-center rounded-full text-white/40 hover:text-white active:scale-90 transition-all bg-white/5">
              <span className="material-symbols-outlined text-base">rotate_right</span>
            </button>
            <button onClick={(e) => { e.stopPropagation(); setFlipped(f => !f); }} className="size-9 flex items-center justify-center rounded-full text-white/40 hover:text-white active:scale-90 transition-all bg-white/5">
              <span className="material-symbols-outlined text-base">flip</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-white/5 rounded-full p-1">
            <button onClick={(e) => { e.stopPropagation(); handlePrev(); }} className="size-8 flex items-center justify-center rounded-full text-white/30 active:text-white active:scale-90">
              <span className="material-symbols-outlined text-lg">skip_previous</span>
            </button>
            <button onClick={(e) => { e.stopPropagation(); setIsPaused(!isPaused); }} className="size-13 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/40 active:scale-90 transition-transform">
              <span className="material-symbols-outlined text-3xl filled leading-none">{isPaused ? 'play_arrow' : 'pause'}</span>
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleNext(); }} className="size-8 flex items-center justify-center rounded-full text-white/30 active:text-white active:scale-90">
              <span className="material-symbols-outlined text-lg">skip_next</span>
            </button>
          </div>

          <button onClick={(e) => { e.stopPropagation(); handleMarkCurrentComplete(); }} className="size-11 flex items-center justify-center rounded-full text-secondary active:scale-90 transition-all">
            <span className="material-symbols-outlined text-2xl filled">check_circle</span>
          </button>
        </div>
      </div>
    </div>
  );
}
