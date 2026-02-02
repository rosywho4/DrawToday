import { Folder, ImageReference } from '../types';

export interface IndexedDBImage {
  id: string;
  blob: Blob;
  createdAt: Date;
  file?: File;
  folderId?: string;
  
  // 扩展属性
  metadata?: Partial<ImageReference>;
}

const DB_NAME = 'DrawTodayDB';
const IMAGES_STORE_NAME = 'Images';
const DB_VERSION = 1;

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(IMAGES_STORE_NAME)) {
        const imagesStore = db.createObjectStore(IMAGES_STORE_NAME, { keyPath: 'id' });
        imagesStore.createIndex('folderId', 'folderId', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveImageToDB(image: IndexedDBImage): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(IMAGES_STORE_NAME, 'readwrite');
  await tx.objectStore(IMAGES_STORE_NAME).put(image);
}

export async function getImageFromDB(imageId: string): Promise<IndexedDBImage | null> {
  const db = await openDB();
  return new Promise((resolve) => {
    const request = db.transaction(IMAGES_STORE_NAME).objectStore(IMAGES_STORE_NAME).get(imageId);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => resolve(null);
  });
}

export async function getImagesByFolderId(folderId: string): Promise<IndexedDBImage[]> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(IMAGES_STORE_NAME);
    const store = tx.objectStore(IMAGES_STORE_NAME);
    const index = store.index('folderId');
    const request = index.getAll(folderId);
    request.onsuccess = () => {
      console.log('Found images for folder:', folderId, request.result);
      resolve(request.result || []);
    };
    request.onerror = () => {
      console.error('Error getting images:', request.error);
      resolve([]);
    };
  });
}

export async function deleteImageFromDB(imageId: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(IMAGES_STORE_NAME, 'readwrite');
  await tx.objectStore(IMAGES_STORE_NAME).delete(imageId);
}

export async function updateImageMetadata(imageId: string, metadata: Partial<ImageReference>): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IMAGES_STORE_NAME, 'readwrite');
    const store = tx.objectStore(IMAGES_STORE_NAME);
    
    // 先获取现有数据
    const getRequest = store.get(imageId);
    getRequest.onsuccess = () => {
      const existingImage = getRequest.result;
      if (existingImage) {
        // 合并元数据
        existingImage.metadata = {
          ...existingImage.metadata,
          ...metadata
        };
        // 保存更新后的数据
        const putRequest = store.put(existingImage);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        resolve();
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

export function createPersistentURL(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * 批量更新图片元数据
 * @param imageIds 图片ID数组
 * @param metadata 要更新的元数据
 */
export async function batchUpdateImageMetadata(
  imageIds: string[],
  metadata: Partial<ImageReference>
): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(IMAGES_STORE_NAME, 'readwrite');
  const store = tx.objectStore(IMAGES_STORE_NAME);
  
  const promises = imageIds.map(async (imageId) => {
    return new Promise<void>((resolve, reject) => {
      const getRequest = store.get(imageId);
      getRequest.onsuccess = () => {
        const existingImage = getRequest.result;
        if (existingImage) {
          existingImage.metadata = {
            ...existingImage.metadata,
            ...metadata
          };
          const putRequest = store.put(existingImage);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  });
  
  await Promise.all(promises);
}

/**
 * 批量删除图片
 * @param imageIds 要删除的图片ID数组
 */
export async function batchDeleteImages(imageIds: string[]): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(IMAGES_STORE_NAME, 'readwrite');
  const store = tx.objectStore(IMAGES_STORE_NAME);
  
  const promises = imageIds.map(imageId => {
    return new Promise<void>((resolve, reject) => {
      const request = store.delete(imageId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  });
  
  await Promise.all(promises);
}

/**
 * 按完成状态查询图片
 * @param folderId 文件夹ID
 * @param completed 完成状态
 */
export async function getImagesByCompletionStatus(
  folderId: string,
  completed: boolean
): Promise<IndexedDBImage[]> {
  const allImages = await getImagesByFolderId(folderId);
  return allImages.filter(img => img.metadata?.completed === completed);
}
