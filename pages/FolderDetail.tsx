
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Folder, Page, ImageReference } from '../types';

// IndexedDB 配置，用于持久化存储图片
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

// 图片存储函数
async function saveImageToDB(image: StoredImage) {
  const db = await openDB();
  const tx = db.transaction(IMAGES_STORE_NAME, 'readwrite');
  await tx.objectStore(IMAGES_STORE_NAME).put(image);
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

// 按文件夹ID获取所有图片
async function getImagesByFolderId(folderId: string): Promise<StoredImage[]> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(IMAGES_STORE_NAME);
    const store = tx.objectStore(IMAGES_STORE_NAME);
    const index = store.index('folderId');
    const request = index.getAll(folderId);
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => resolve([]);
  });
}

// 删除图片
async function deleteImageFromDB(imageId: string) {
  const db = await openDB();
  const tx = db.transaction(IMAGES_STORE_NAME, 'readwrite');
  await tx.objectStore(IMAGES_STORE_NAME).delete(imageId);
}

// 生成持久化URL
function createPersistentURL(file: File): string {
  return URL.createObjectURL(file);
}

interface FolderDetailProps {
  folder: Folder;
  onNavigate: (page: Page, folder?: Folder) => void;
  onUpdateFolder: (folder: Folder) => void;
}

// 定义一个内部扩展类型，用于在内存中管理临时 URL
interface SessionImage extends ImageReference {
  file?: File;
}

const FolderDetail: React.FC<FolderDetailProps> = ({ folder, onNavigate, onUpdateFolder }) => {
  const [sessionImages, setSessionImages] = useState<SessionImage[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showSetCoverMenu, setShowSetCoverMenu] = useState<string | null>(null);
  const [pendingImportCount, setPendingImportCount] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<number | null>(null);

  // 缩放状态
  const [vScale, setVScale] = useState(1);
  const vTouchState = useRef({ dist: 0, scale: 1 });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // 初始化：从IndexedDB加载图片
  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      // 如果有待处理的导入操作，跳过这次加载
      if (pendingImportCount > 0) {
        console.log('Skipping load due to pending import');
        return;
      }
      
      const storedImages = await getImagesByFolderId(folder.id);
      if (isMounted) {
        if (storedImages.length > 0) {
          const indexedDBImages = storedImages.map(storedImg => ({
            id: storedImg.id,
            url: createPersistentURL(storedImg.file),
            title: storedImg.file.name,
            completed: folder.references.find(ref => ref.id === storedImg.id)?.completed || false,
            isLocalFile: false,
            file: storedImg.file
          }));
          
          const defaultImages = folder.references.filter(ref => 
            !storedImages.some(storedImg => storedImg.id === ref.id)
          );
          
          const mergedImages = [...defaultImages, ...indexedDBImages];
          console.log(`Loaded ${mergedImages.length} images from DB`);
          setSessionImages(mergedImages);
        } else {
          setSessionImages(folder.references);
        }
      }
    };
    init();
    return () => { isMounted = false; };
  }, [folder.id, folder.references, pendingImportCount]);

  // 组件卸载时释放所有Blob URL
  useEffect(() => {
    return () => {
      sessionImages.forEach(img => {
        if (img.url.startsWith('blob:')) {
          URL.revokeObjectURL(img.url);
        }
      });
    };
  }, [sessionImages]);

  // 手动导入图片（支持单张或批量导入）
  const handleManualImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      console.log('No files selected');
      return;
    }
    
    console.log(`Selected ${files.length} files`);
    setIsSyncing(true);
    setPendingImportCount(files.length);
    
    const newRefs: SessionImage[] = [];
    const storedImages: StoredImage[] = [];
    const timestamp = Date.now();
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const uniqueId = `m-${timestamp}-${i}-${Math.random().toString(36).substr(2, 9)}`;
      const url = createPersistentURL(file);
      
      newRefs.push({
        id: uniqueId,
        url: url,
        title: file.name,
        completed: false,
        isLocalFile: false,
        file: file
      });
      
      storedImages.push({
        id: uniqueId,
        file: file,
        folderId: folder.id
      });
    }

    console.log(`Processing ${newRefs.length} images`);
    
    for (const storedImg of storedImages) {
      await saveImageToDB(storedImg);
      console.log(`Saved to DB: ${storedImg.id}`);
    }

    const updatedRefs = [...folder.references, ...newRefs.map(({file, ...rest}) => ({...rest}))];
    console.log(`Updated refs count: ${updatedRefs.length}`);
    
    const newCoverImage = folder.references.length === 0 && newRefs.length > 0 ? newRefs[0].url : folder.coverImage;
    
    onUpdateFolder({
      ...folder,
      references: updatedRefs,
      coverImage: newCoverImage
    });
    
    // 直接更新sessionImages，不等待下一次useEffect
    setSessionImages(prev => [...prev, ...newRefs]);
    
    setIsSyncing(false);
    setPendingImportCount(0);
    showToast(`成功导入 ${newRefs.length} 张素材`);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 各种操作逻辑...
  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
    setIsSelectionMode(next.size > 0);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === sessionImages.length) {
      setSelectedIds(new Set());
      setIsSelectionMode(false);
    } else {
      setSelectedIds(new Set(sessionImages.map(r => r.id)));
      setIsSelectionMode(true);
    }
  };

  const handleToggleComplete = () => {
    if (selectedIds.size === 0) return;
    const nextRefs = folder.references.map(r => 
      selectedIds.has(r.id) ? { ...r, completed: !r.completed } : r
    );
    onUpdateFolder({ ...folder, references: nextRefs });
    setSessionImages(prev => prev.map(r => 
      selectedIds.has(r.id) ? { ...r, completed: !r.completed } : r
    ));
    setIsSelectionMode(false);
    setSelectedIds(new Set());
    showToast("状态已更新");
  };

  const startLongPress = (id: string) => {
    if (isSelectionMode) return;
    longPressTimer.current = window.setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(50);
      setShowSetCoverMenu(id);
    }, 600);
  };

  // 设置封面处理函数
  const handleSetAsCover = (imageId: string) => {
    const image = sessionImages.find(img => img.id === imageId);
    if (image) {
      onUpdateFolder({
        ...folder,
        coverImage: image.url,
        coverImageId: imageId // 存储封面图片的ID
      });
      showToast("封面已更新");
    }
    setShowSetCoverMenu(null);
  };

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const vTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      vTouchState.current.dist = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      vTouchState.current.scale = vScale;
    }
  };
  const vTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      const newScale = Math.min(5, Math.max(1, (dist / vTouchState.current.dist) * vTouchState.current.scale));
      setVScale(newScale);
    }
  };

  return (
    <div className="flex flex-col min-h-screen select-none">
      <input type="file" ref={fileInputRef} multiple accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleManualImport} />

      {/* 设置封面菜单 */}
      {showSetCoverMenu && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-6">
          <div className="w-full max-w-xs bg-white rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-200 text-center">
            <h3 className="text-xl font-black mb-2">设置封面</h3>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              确定要将这张图片设为图库封面吗？
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={() => handleSetAsCover(showSetCoverMenu)} className="w-full py-4 font-bold text-white bg-primary rounded-2xl shadow-lg shadow-primary/20">确定</button>
              <button onClick={() => setShowSetCoverMenu(null)} className="w-full py-4 font-bold text-slate-400 bg-slate-50 rounded-2xl">取消</button>
            </div>
          </div>
        </div>
      )}

      {/* 查看器 */}
      {viewerIndex !== null && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 touch-none"
             onTouchStart={vTouchStart} onTouchMove={vTouchMove}>
          <button onClick={() => { setViewerIndex(null); setVScale(1); }} className="absolute top-14 right-6 size-11 flex items-center justify-center rounded-full bg-white/20 text-white z-[110] active:scale-90 transition-transform">
            <span className="material-symbols-outlined">close</span>
          </button>
          
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden" onClick={() => { setViewerIndex(null); setVScale(1); }}>
            {vScale === 1 && (
              <>
                <button disabled={viewerIndex === 0} onClick={(e) => { e.stopPropagation(); setViewerIndex(viewerIndex - 1); }} className="absolute left-4 size-14 flex items-center justify-center rounded-full bg-black/40 text-white disabled:opacity-10 transition-all active:scale-90 z-[110]">
                  <span className="material-symbols-outlined text-3xl">chevron_left</span>
                </button>
                <button disabled={viewerIndex === sessionImages.length - 1} onClick={(e) => { e.stopPropagation(); setViewerIndex(viewerIndex + 1); }} className="absolute right-4 size-14 flex items-center justify-center rounded-full bg-black/40 text-white disabled:opacity-10 transition-all active:scale-90 z-[110]">
                  <span className="material-symbols-outlined text-3xl">chevron_right</span>
                </button>
              </>
            )}
            <img src={sessionImages[viewerIndex].url} className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl transition-transform duration-100 ease-out" style={{ transform: `scale(${vScale})` }} alt="Preview" onClick={(e) => e.stopPropagation()} />
          </div>
          <div className="absolute bottom-12 px-6 py-2 bg-black/40 rounded-full text-white/80 text-sm font-black tracking-widest tabular-nums z-[110]">
            {viewerIndex + 1} / {sessionImages.length}
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 bg-bg-serenity/90 backdrop-blur-md px-6 pt-12 pb-4 border-b border-black/5 flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <button onClick={() => isSelectionMode ? (setIsSelectionMode(false), setSelectedIds(new Set())) : onNavigate(Page.HOME)} className="size-10 rounded-full bg-white flex items-center justify-center shadow-sm active:scale-90 transition-transform">
            <span className="material-symbols-outlined">{isSelectionMode ? 'close' : 'arrow_back_ios_new'}</span>
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-black truncate">{isSelectionMode ? `已选 ${selectedIds.size} 项` : folder.name}</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {!isSelectionMode && (
            <>
              <button onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} className="material-symbols-outlined text-slate-400">
                {viewMode === 'grid' ? 'format_list_bulleted' : 'grid_view'}
              </button>
              <button onClick={() => setIsSelectionMode(true)} className="material-symbols-outlined text-slate-400">
                checklist
              </button>
            </>
          )}
          {isSelectionMode && sessionImages.length > 0 && (
            <button onClick={handleSelectAll} className={`material-symbols-outlined transition-colors ${selectedIds.size === sessionImages.length ? 'text-primary' : 'text-slate-400'}`}>
              {selectedIds.size === sessionImages.length ? 'deselect' : 'select_all'}
            </button>
          )}
        </div>
      </header>

      {toast && <div className="fixed top-28 left-1/2 -translate-x-1/2 z-[120] bg-black/80 text-white px-5 py-2.5 rounded-full text-xs font-black animate-in fade-in slide-in-from-top-2 text-center shadow-2xl">{toast}</div>}

      <main className="flex-1 p-4 pb-40">
        {isSyncing && sessionImages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
             <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
             <p className="text-slate-400 text-sm font-black">正在读取本地图库...</p>
          </div>
        ) : sessionImages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="size-24 rounded-full bg-white flex items-center justify-center shadow-sm opacity-20 mb-8">
              <span className="material-symbols-outlined text-5xl">folder_zip</span>
            </div>
            <p className="text-slate-400 text-sm font-black mb-10">此图库尚无素材</p>
            <button onClick={() => fileInputRef.current?.click()} className="bg-primary text-white py-4 px-8 rounded-2xl font-black text-sm shadow-xl shadow-primary/20 flex items-center justify-center gap-2 active:scale-95 transition-transform">
              <span className="material-symbols-outlined text-lg">add_photo_alternate</span>
              导入图片
            </button>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? "grid grid-cols-3 gap-3" : "space-y-3"}>
            {sessionImages.map((ref, idx) => (
              <div 
                key={ref.id} 
                onClick={() => isSelectionMode ? toggleSelect(ref.id) : setViewerIndex(idx)}
                onMouseDown={() => startLongPress(ref.id)}
                onMouseUp={clearLongPress}
                onMouseLeave={clearLongPress}
                onTouchStart={() => startLongPress(ref.id)}
                onTouchEnd={clearLongPress}
                className={`relative overflow-hidden rounded-xl bg-white border border-black/5 transition-all cursor-pointer ${viewMode === 'grid' ? 'aspect-square' : 'flex items-center p-2.5 gap-4'} ${selectedIds.has(ref.id) ? 'ring-4 ring-primary ring-offset-2 scale-90' : 'active:scale-95'}`}
              >
                <div className={viewMode === 'grid' ? "w-full h-full bg-center bg-cover" : "size-14 rounded-lg bg-center bg-cover flex-shrink-0"} style={{ backgroundImage: `url(${ref.url})` }} />
                {viewMode === 'list' && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-text-main truncate">{ref.title || `素材 #${idx + 1}`}</p>
                    <p className={`text-[10px] font-black uppercase mt-1 ${ref.completed ? 'text-secondary' : 'text-slate-300'}`}>{ref.completed ? '已完成' : '待练习'}</p>
                  </div>
                )}
                {ref.completed && !selectedIds.has(ref.id) && (
                  <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center">
                    <span className="material-symbols-outlined text-secondary text-3xl filled">check_circle</span>
                  </div>
                )}
                {selectedIds.has(ref.id) && (
                  <div className="absolute top-1.5 right-1.5 bg-primary text-white rounded-full size-7 flex items-center justify-center shadow-lg animate-in zoom-in duration-200">
                    <span className="material-symbols-outlined text-[16px] font-black">check</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {!isSelectionMode && (
        <div className="fixed bottom-28 right-6 flex flex-col items-center gap-5 z-40">
          <button onClick={() => fileInputRef.current?.click()} className="size-14 rounded-full bg-white text-slate-400 shadow-xl border border-black/5 flex items-center justify-center active:scale-90 transition-transform">
            <span className="material-symbols-outlined text-2xl">add_photo_alternate</span>
          </button>
          <button onClick={() => onNavigate(Page.PRACTICE_CONFIG, folder)} className="size-16 rounded-full bg-primary text-white shadow-xl shadow-primary/30 flex items-center justify-center active:scale-95 transition-transform">
            <span className="material-symbols-outlined text-4xl filled">play_arrow</span>
          </button>
        </div>
      )}

      {isSelectionMode && (
        <div className="fixed bottom-0 inset-x-0 bg-white p-6 pb-12 rounded-t-[3rem] shadow-[0_-15px_40px_rgba(0,0,0,0.1)] z-50 flex justify-around animate-in slide-in-from-bottom duration-300">
          <button onClick={async () => { 
              // 释放Blob URL并从IndexedDB删除图片
              for (const id of selectedIds) {
                const img = sessionImages.find(r => r.id === id);
                if (img) {
                  // 释放Blob URL
                  if (img.url.startsWith('blob:')) {
                    URL.revokeObjectURL(img.url);
                  }
                  // 从IndexedDB删除
                  await deleteImageFromDB(id);
                }
              }
              
              const nextRefs = folder.references.filter(r => !selectedIds.has(r.id));
              onUpdateFolder({...folder, references: nextRefs}); 
              setSessionImages(prev => prev.filter(r => !selectedIds.has(r.id)));
              setIsSelectionMode(false); 
              setSelectedIds(new Set()); 
              showToast("已移除选中项");
            }} className="flex flex-col items-center gap-2">
            <div className="size-15 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center active:scale-90 transition-transform"><span className="material-symbols-outlined text-2xl">delete</span></div>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">移除</span>
          </button>
          
          <button onClick={handleToggleComplete} className="flex flex-col items-center gap-2">
            <div className="size-15 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center active:scale-90 transition-transform"><span className="material-symbols-outlined text-2xl">check_circle</span></div>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">状态</span>
          </button>

          <button onClick={() => { setIsSelectionMode(false); setSelectedIds(new Set()); }} className="flex flex-col items-center gap-2">
            <div className="size-15 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center active:scale-90 transition-transform"><span className="material-symbols-outlined text-2xl">close</span></div>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">取消</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default FolderDetail;
