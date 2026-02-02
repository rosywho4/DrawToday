import React, { useRef, useEffect } from 'react';
import { Check } from 'lucide-react';
import { ImageReference, DEFAULT_TAGS } from '../../types';

interface ImageCardProps {
  image: ImageReference;
  index: number;
  isSelected: boolean;
  isSelectionMode: boolean;
  viewMode?: 'grid' | 'list';
  onClick: () => void;
  onLongPress: () => void;
}

/**
 * 图片卡片组件
 * 支持网格和列表两种显示模式
 */
export default function ImageCard({
  image,
  index,
  isSelected,
  isSelectionMode,
  viewMode = 'grid',
  onClick,
  onLongPress
}: ImageCardProps) {
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  // 处理触摸开始
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    
    longPressTimer.current = setTimeout(() => {
      onLongPress();
      longPressTimer.current = null;
    }, 500);
  };

  // 处理触摸移动
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPos.current || !longPressTimer.current) return;
    
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);
    
    // 如果移动距离超过阈值，取消长按
    if (deltaX > 10 || deltaY > 10) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // 处理触摸结束
  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    touchStartPos.current = null;
  };

  // 处理鼠标按下（桌面端长按）
  const handleMouseDown = () => {
    longPressTimer.current = setTimeout(() => {
      onLongPress();
      longPressTimer.current = null;
    }, 500);
  };

  // 处理鼠标松开
  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  return (
    <div
      onClick={onClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={`
        relative overflow-hidden rounded-xl bg-white border transition-all cursor-pointer
        ${viewMode === 'grid' ? 'aspect-square' : 'flex items-center p-2.5 gap-4'}
        ${isSelected ? 'ring-4 ring-primary ring-offset-2 scale-95' : 'hover:shadow-md active:scale-[0.98]'}
      `}
    >
      {/* 图片 */}
      <div 
        className={`${viewMode === 'grid' ? 'w-full h-full' : 'w-20 h-20 rounded-lg flex-shrink-0'}`}
        style={{ 
          backgroundImage: `url(${image.url})`, 
          backgroundSize: 'cover', 
          backgroundPosition: 'center',
          opacity: image.completed && !isSelected ? 0.6 : 1
        }} 
      />
      
      {/* 列表模式信息 */}
      {viewMode === 'list' && (
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-text-main truncate">
            {image.title || `素材 #${index + 1}`}
          </p>
          
          {/* 标签 */}
          {image.tags && image.tags.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {image.tags.slice(0, 3).map(tagId => {
                const tag = DEFAULT_TAGS.find(t => t.id === tagId);
                return tag ? (
                  <span 
                    key={tagId} 
                    className="text-[10px] px-2 py-0.5 rounded-full text-white" 
                    style={{ backgroundColor: tag.color }}
                  >
                    {tag.name}
                  </span>
                ) : null;
              })}
              {image.tags.length > 3 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  +{image.tags.length - 3}
                </span>
              )}
            </div>
          )}
          
          {/* 状态 */}
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[10px] font-bold uppercase ${
              image.completed ? 'text-secondary' : 'text-slate-300'
            }`}>
              {image.completed ? '已完成' : '待练习'}
            </span>
          </div>
        </div>
      )}

      {/* 完成遮罩（网格模式） */}
      {image.completed && !isSelected && viewMode === 'grid' && (
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center">
          <Check className="w-10 h-10 text-secondary drop-shadow-lg" />
        </div>
      )}

      {/* 选中标记 */}
      {isSelected && (
        <div className="absolute top-1.5 right-1.5 bg-primary text-white rounded-full w-7 h-7 flex items-center justify-center shadow-lg animate-in zoom-in duration-200">
          <Check className="w-4 h-4" />
        </div>
      )}

      {/* 选择模式复选框（未选中时显示边框） */}
      {isSelectionMode && !isSelected && (
        <div className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full border-2 border-white shadow-md bg-white/50" />
      )}

      {/* 标签（网格模式底部） */}
      {image.tags && image.tags.length > 0 && viewMode === 'grid' && (
        <div className="absolute bottom-1 left-1 right-1 flex gap-0.5 flex-wrap">
          {image.tags.slice(0, 2).map(tagId => {
            const tag = DEFAULT_TAGS.find(t => t.id === tagId);
            return tag ? (
              <span 
                key={tagId} 
                className="text-[8px] px-1.5 py-0.5 rounded text-white shadow-sm" 
                style={{ backgroundColor: tag.color }}
              >
                {tag.name}
              </span>
            ) : null;
          })}
          {image.tags.length > 2 && (
            <span className="text-[8px] px-1.5 py-0.5 rounded bg-black/60 text-white shadow-sm">
              +{image.tags.length - 2}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
