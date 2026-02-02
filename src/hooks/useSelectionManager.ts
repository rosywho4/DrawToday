import { useState, useCallback, useEffect } from 'react';
import { GalleryMode } from '../types/gallery';

/**
 * 选择管理器 Hook
 * 类似Android的SelectionManager，负责选择状态的增删改查
 * 
 * @returns 选择管理器接口
 */
export function useSelectionManager() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<GalleryMode>({ type: 'browse' });

  /**
   * 切换单个项的选择状态
   */
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  /**
   * 选择多个项
   */
  const selectMultiple = useCallback((ids: string[]) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.add(id));
      return next;
    });
  }, []);

  /**
   * 取消选择多个项
   */
  const deselectMultiple = useCallback((ids: string[]) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.delete(id));
      return next;
    });
  }, []);

  /**
   * 全选
   */
  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
    if (ids.length > 0 && mode.type === 'browse') {
      setMode({ type: 'selection', selectedIds: new Set(ids) });
    }
  }, [mode.type]);

  /**
   * 清空选择
   */
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  /**
   * 进入选择模式（可选：默认选中某项）
   */
  const enterSelectionMode = useCallback((defaultId?: string) => {
    if (defaultId) {
      setSelectedIds(new Set([defaultId]));
    }
    setMode({ type: 'selection', selectedIds: defaultId ? new Set([defaultId]) : new Set() });
  }, []);

  /**
   * 退出选择模式
   */
  const exitSelectionMode = useCallback(() => {
    clearSelection();
    setMode({ type: 'browse' });
  }, [clearSelection]);

  /**
   * 检查某项是否被选中
   */
  const isSelected = useCallback((id: string) => {
    return selectedIds.has(id);
  }, [selectedIds]);

  /**
   * 同步mode中的selectedIds
   */
  useEffect(() => {
    if (mode.type === 'selection') {
      setMode({ type: 'selection', selectedIds });
    }
  }, [selectedIds, mode.type]);

  return {
    // 状态
    mode,
    selectedIds,
    isSelectionMode: mode.type === 'selection',
    selectedCount: selectedIds.size,
    
    // 查询
    isSelected,
    
    // 操作
    toggleSelection,
    selectMultiple,
    deselectMultiple,
    selectAll,
    clearSelection,
    enterSelectionMode,
    exitSelectionMode
  };
}
