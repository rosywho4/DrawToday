import { useState, useEffect, useCallback, useRef } from 'react';

interface TouchState {
  initialDistance: number;
  initialScale: number;
  lastTouch: { x: number; y: number };
  isZooming: boolean;
  isPanning: boolean;
  moved: boolean;
  lastTapTime: number;
}

export function useImageViewer() {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showUI, setShowUI] = useState(true);

  const touchState = useRef<TouchState>({
    initialDistance: 0,
    initialScale: 1,
    lastTouch: { x: 0, y: 0 },
    isZooming: false,
    isPanning: false,
    moved: false,
    lastTapTime: 0
  });

  const resetTransform = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const fullReset = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setRotation(0);
    setFlipped(false);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
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
  }, [scale]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
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
        y: prev.y + dy
      }));

      touchState.current.lastTouch = { x: e.touches[0].pageX, y: e.touches[0].pageY };
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    touchState.current.isZooming = false;
    touchState.current.isPanning = false;

    if (scale < 1) {
      setScale(1);
      setOffset({ x: 0, y: 0 });
    }
  }, [scale]);

  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    if (touchState.current.moved) return;

    const target = e.target as HTMLElement;
    if (target.closest('button')) return;

    setShowUI(prev => !prev);
  }, []);

  const autoHideUI = useCallback((delay: number = 3000) => {
    setShowUI(true);
    let timeout = setTimeout(() => setShowUI(false), delay);
    return () => clearTimeout(timeout);
  }, []);

  return {
    scale,
    offset,
    rotation,
    flipped,
    showUI,
    setRotation,
    setFlipped,
    setShowUI,
    resetTransform,
    fullReset,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleContainerClick,
    autoHideUI
  };
}
