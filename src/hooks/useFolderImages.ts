import { useState, useEffect, useCallback, useRef } from 'react';
import { ImageReference } from '../types';
import { getImagesByFolderId, saveImageToDB, deleteImageFromDB, createPersistentURL, updateImageMetadata } from '../utils/indexedDB';

interface IndexedDBImage {
  id: string;
  blob: Blob;
  createdAt: Date;
  file?: File;
  folderId?: string;
  metadata?: Partial<ImageReference>;
}

export function useFolderImages(folderId: string, initialReferences: ImageReference[]) {
  const [images, setImages] = useState<ImageReference[]>(initialReferences);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingImportCount, setPendingImportCount] = useState(0);

  const loadImages = useCallback(async () => {
    if (!folderId) return;
    setIsLoading(true);
    try {
      const storedImages = await getImagesByFolderId(folderId);
      if (storedImages.length > 0) {
        const indexedDBImages: ImageReference[] = storedImages.map(storedImg => {
          // 应用元数据到图片引用
          const metadata = storedImg.metadata || {};
          const defaultValues = {
            id: storedImg.id,
            folderId,
            fileName: storedImg.file?.name || 'unknown.jpg',
            fileType: storedImg.file?.type || 'image/jpeg',
            fileSize: storedImg.file?.size || 0,
            addedAt: storedImg.createdAt,
            tags: [],
            isCompleted: false,
            completed: false,
            url: storedImg.file ? createPersistentURL(storedImg.file) : '',
            title: storedImg.file?.name || 'Unknown',
            completionTime: 0,
            notes: undefined
          };
          
          // 先从 initialReferences 查找对应的引用（优先使用最新的状态）
          const refFromContext = initialReferences.find(ref => ref.id === storedImg.id);
          
          // 合并：Context 状态 > IndexedDB 元数据 > 默认值
          return {
            ...defaultValues,
            ...metadata,
            ...(refFromContext ? {
              isCompleted: refFromContext.isCompleted,
              completed: refFromContext.completed,
              completedAt: refFromContext.completedAt
            } : {})
          };
        });
        
        const defaultImages = initialReferences.filter(ref =>
          !storedImages.some(storedImg => storedImg.id === ref.id)
        );
        setImages([...defaultImages, ...indexedDBImages]);
      } else {
        setImages(initialReferences);
      }
    } finally {
      setIsLoading(false);
    }
  }, [folderId, initialReferences]);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  const importImages = useCallback(async (files: FileList, onComplete: () => void) => {
    setIsLoading(true);
    setPendingImportCount(files.length);
    const newImages: ImageReference[] = [];
    const timestamp = Date.now();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const uniqueId = `m-${timestamp}-${i}-${Math.random().toString(36).substr(2, 9)}`;
      const url = createPersistentURL(file);

      const newImage: ImageReference = {
        id: uniqueId,
        folderId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        addedAt: new Date(),
        tags: [],
        isCompleted: false,
        completed: false,
        url,
        title: file.name,
        completionTime: 0,
        notes: undefined
      };
      newImages.push(newImage);

      await saveImageToDB({
        id: uniqueId,
        folderId: folderId,
        blob: file,
        createdAt: new Date(),
        file
      });
    }

    setImages(prev => [...prev, ...newImages]);
    setIsLoading(false);
    setPendingImportCount(0);
    onComplete();
  }, [folderId]);

  const removeImage = useCallback(async (imageId: string) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
    await deleteImageFromDB(imageId);
  }, []);

  const toggleComplete = useCallback(async (imageId: string) => {
    setImages(prev => prev.map(img =>
      img.id === imageId ? { ...img, completed: !img.completed } : img
    ));
    
    // 持久化状态变更
    const image = images.find(img => img.id === imageId);
    if (image) {
      const newCompleted = !image.completed;
      await updateImageMetadata(imageId, { 
        completed: newCompleted,
        isCompleted: newCompleted,
        completedAt: newCompleted ? new Date() : undefined
      });
    }
  }, [images]);

  const cleanup = useCallback(() => {
    images.forEach(img => {
      if (img.url.startsWith('blob:')) {
        URL.revokeObjectURL(img.url);
      }
    });
  }, [images]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    images,
    isLoading,
    pendingImportCount,
    importImages,
    removeImage,
    toggleComplete,
    reload: loadImages
  };
}
