import { useState, useCallback, useMemo } from 'react';
import { useFolders } from '../contexts/FoldersContext';
import { useFolderImages } from './useFolderImages';
import { useSelectionManager } from './useSelectionManager';
import { FilterType, ImageClickResult } from '../types/gallery';
import { 
  updateImageMetadata, 
  batchUpdateImageMetadata, 
  batchDeleteImages,
  createPersistentURL
} from '../utils/indexedDB';

/**
 * 图库管理器 Hook
 * 类似Android的ViewModel，整合所有业务逻辑
 * 
 * @param folderId 文件夹ID
 * @returns 图库管理器接口
 */
export function useGalleryManager(folderId: string) {
  const { folders, updateFolder } = useFolders();
  const folder = folders.find(f => f.id === folderId);
  
  // 选择管理
  const selection = useSelectionManager();
  
  // 图片数据
  const { images, isLoading, importImages, removeImage, reload } = useFolderImages(
    folderId,
    folder?.references || []
  );
  
  // 筛选状态
  const [filterType, setFilterType] = useState<FilterType>(FilterType.ALL);
  
  // 筛选后的图片列表
  const filteredImages = useMemo(() => {
    switch (filterType) {
      case FilterType.INCOMPLETE:
        return images.filter(img => !img.completed);
      case FilterType.COMPLETED:
        return images.filter(img => img.completed);
      default:
        return images;
    }
  }, [images, filterType]);

  // ========== 单项操作 ==========
  
  /**
   * 切换单张图片的完成状态
   */
  const toggleComplete = useCallback(async (imageId: string) => {
    const image = images.find(img => img.id === imageId);
    if (!image || !folder) return;
    
    const newCompleted = !image.completed;
    
    // 更新IndexedDB
    await updateImageMetadata(imageId, {
      completed: newCompleted,
      isCompleted: newCompleted,
      completedAt: newCompleted ? new Date() : undefined
    });
    
    // 更新Context
    const nextRefs = folder.references.map(r =>
      r.id === imageId ? { ...r, completed: newCompleted, isCompleted: newCompleted } : r
    );
    updateFolder({ ...folder, references: nextRefs });
    
    await reload();
  }, [images, folder, updateFolder, reload]);

  /**
   * 更新图片标签
   */
  const updateImageTags = useCallback(async (imageId: string, tags: string[]) => {
    if (!folder) return;
    
    // 更新IndexedDB
    await updateImageMetadata(imageId, { tags });
    
    // 更新Context
    const nextRefs = folder.references.map(r =>
      r.id === imageId ? { ...r, tags } : r
    );
    updateFolder({ ...folder, references: nextRefs });
    
    await reload();
  }, [folder, updateFolder, reload]);

  /**
   * 切换图片标签
   */
  const toggleImageTag = useCallback(async (imageId: string, tagId: string) => {
    const image = images.find(img => img.id === imageId);
    if (!image || !folder) return;
    
    const currentTags = image.tags || [];
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter(t => t !== tagId)
      : [...currentTags, tagId];
    
    await updateImageTags(imageId, newTags);
  }, [images, folder, updateImageTags]);

  /**
   * 导入图片（包装原始importImages，同步到Context）
   */
  const handleImportImages = useCallback(async (files: FileList, onComplete: () => void) => {
    if (!folder) return;
    
    // 调用原始的importImages
    await importImages(files, async () => {
      // 重新加载图片以获取新的图片列表
      await reload();
      
      // 从IndexedDB获取所有该文件夹的图片来更新references
      const allImages = await import('../utils/indexedDB').then(m => m.getImagesByFolderId(folderId));
      const newReferences = allImages.map(img => ({
        id: img.id,
        folderId,
        fileName: img.file?.name || 'unknown.jpg',
        fileType: img.file?.type || 'image/jpeg',
        fileSize: img.file?.size || 0,
        addedAt: img.createdAt,
        tags: img.metadata?.tags || [],
        isCompleted: img.metadata?.isCompleted || false,
        completed: img.metadata?.completed || false,
        url: img.file ? createPersistentURL(img.file) : '',
        title: img.file?.name || 'Unknown',
        completionTime: img.metadata?.completionTime || 0,
        notes: img.metadata?.notes
      }));
      
      // 更新Context中的folder.references
      updateFolder({
        ...folder,
        references: newReferences,
        coverImage: folder.coverImage || (newReferences.length > 0 ? newReferences[0].url : '')
      });
      
      onComplete();
    });
  }, [folder, folderId, importImages, reload, updateFolder]);

  // ========== 批量操作 ==========
  
  /**
   * 批量标记完成状态
   */
  const batchMarkComplete = useCallback(async (completed: boolean) => {
    if (selection.selectedCount === 0 || !folder) return;
    
    // 批量更新IndexedDB
    await batchUpdateImageMetadata(
      Array.from(selection.selectedIds),
      { 
        completed,
        isCompleted: completed,
        completedAt: completed ? new Date() : undefined
      }
    );
    
    // 更新Context
    const nextRefs = folder.references.map(r =>
      selection.selectedIds.has(r.id) 
        ? { ...r, completed, isCompleted: completed } 
        : r
    );
    updateFolder({ ...folder, references: nextRefs });
    
    // 退出选择模式
    selection.exitSelectionMode();
    await reload();
  }, [selection, folder, updateFolder, reload]);

  /**
   * 批量删除
   */
  const batchDelete = useCallback(async () => {
    if (selection.selectedCount === 0 || !folder) return;
    
    // 批量删除IndexedDB
    await batchDeleteImages(Array.from(selection.selectedIds));
    
    // 更新Context
    const nextRefs = folder.references.filter(
      r => !selection.selectedIds.has(r.id)
    );
    updateFolder({ 
      ...folder, 
      references: nextRefs,
      imageCount: Math.max(0, (folder.imageCount || 0) - selection.selectedCount)
    });
    
    // 退出选择模式
    selection.exitSelectionMode();
    await reload();
  }, [selection, folder, updateFolder, reload]);

  /**
   * 批量添加标签
   */
  const batchAddTag = useCallback(async (tagId: string) => {
    if (selection.selectedCount === 0 || !folder) return;
    
    const updates = Array.from(selection.selectedIds).map(async (imageId) => {
      const image = images.find(img => img.id === imageId);
      if (!image) return;
      
      const newTags = image.tags?.includes(tagId)
        ? image.tags
        : [...(image.tags || []), tagId];
      
      await updateImageMetadata(imageId, { tags: newTags });
    });
    
    await Promise.all(updates);
    
    // 更新Context
    const nextRefs = folder.references.map(r => {
      if (!selection.selectedIds.has(r.id)) return r;
      const newTags = r.tags?.includes(tagId) 
        ? r.tags 
        : [...(r.tags || []), tagId];
      return { ...r, tags: newTags };
    });
    updateFolder({ ...folder, references: nextRefs });
    
    await reload();
  }, [selection, images, folder, updateFolder, reload]);

  /**
   * 批量移除标签
   */
  const batchRemoveTag = useCallback(async (tagId: string) => {
    if (selection.selectedCount === 0 || !folder) return;
    
    const updates = Array.from(selection.selectedIds).map(async (imageId) => {
      const image = images.find(img => img.id === imageId);
      if (!image) return;
      
      const newTags = (image.tags || []).filter(t => t !== tagId);
      await updateImageMetadata(imageId, { tags: newTags });
    });
    
    await Promise.all(updates);
    
    // 更新Context
    const nextRefs = folder.references.map(r => {
      if (!selection.selectedIds.has(r.id)) return r;
      const newTags = (r.tags || []).filter(t => t !== tagId);
      return { ...r, tags: newTags };
    });
    updateFolder({ ...folder, references: nextRefs });
    
    await reload();
  }, [selection, images, folder, updateFolder, reload]);

  // ========== 交互处理 ==========
  
  /**
   * 处理图片点击
   */
  const handleImageClick = useCallback((imageId: string, index: number): ImageClickResult | void => {
    if (selection.isSelectionMode) {
      // 选择模式：切换选择
      selection.toggleSelection(imageId);
      return { action: 'toggleSelection' };
    } else {
      // 浏览模式：打开灯箱
      return { action: 'openLightbox', index };
    }
  }, [selection]);

  /**
   * 处理图片长按
   */
  const handleImageLongPress = useCallback((imageId: string) => {
    selection.enterSelectionMode(imageId);
  }, [selection]);

  /**
   * 处理返回键（退出选择模式）
   */
  const handleBackPress = useCallback((): boolean => {
    if (selection.isSelectionMode) {
      selection.exitSelectionMode();
      return true; // 已处理
    }
    return false; // 未处理，继续默认行为
  }, [selection]);

  /**
   * 全选当前筛选的图片
   */
  const selectAllFiltered = useCallback(() => {
    selection.selectAll(filteredImages.map(img => img.id));
  }, [selection, filteredImages]);

  /**
   * 设置筛选类型
   */
  const changeFilter = useCallback((newFilter: FilterType) => {
    setFilterType(newFilter);
    // 切换筛选时，如果有选中项不在新筛选结果中，需要取消选择
    if (selection.isSelectionMode && newFilter !== FilterType.ALL) {
      const validIds = images
        .filter(img => {
          if (newFilter === FilterType.COMPLETED) return img.completed;
          if (newFilter === FilterType.INCOMPLETE) return !img.completed;
          return true;
        })
        .map(img => img.id);
      
      const invalidSelected = Array.from(selection.selectedIds).filter(
        id => !validIds.includes(id)
      );
      
      if (invalidSelected.length > 0) {
        selection.deselectMultiple(invalidSelected);
      }
    }
  }, [images, selection]);

  return {
    // 数据
    folder,
    images: filteredImages,
    allImages: images,
    isLoading,
    
    // 选择状态
    selection,
    
    // 筛选
    filterType,
    setFilterType: changeFilter,
    
    // 单项操作
    toggleComplete,
    updateImageTags,
    toggleImageTag,
    importImages: handleImportImages,
    removeImage,
    
    // 批量操作
    batchMarkComplete,
    batchDelete,
    batchAddTag,
    batchRemoveTag,
    selectAllFiltered,
    
    // 交互处理
    handleImageClick,
    handleImageLongPress,
    handleBackPress,
    
    // 工具
    reload
  };
}
