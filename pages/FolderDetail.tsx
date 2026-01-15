
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Folder, Page, ImageReference } from '../types';

// IndexedDB 配置，用于持久化存储 FileSystemDirectoryHandle 和图片
const DB_NAME = 'SketchSerenityDB';
const STORE_NAME = 'FolderHandles';
const IMAGES_STORE_NAME = 'Images';
const DB_VERSION = 3; // 升级版本，添加图片存储

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
      // 创建文件夹句柄存储
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      // 创建图片存储
      if (!db.objectStoreNames.contains(IMAGES_STORE_NAME)) {
        const imagesStore = db.createObjectStore(IMAGES_STORE_NAME, { keyPath: 'id' });
        // 创建文件夹ID索引，方便按文件夹查询图片
        imagesStore.createIndex('folderId', 'folderId', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveHandle(folderId: string, handle: FileSystemDirectoryHandle) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await tx.objectStore(STORE_NAME).put(handle, folderId);
}

async function getHandle(folderId: string): Promise<FileSystemDirectoryHandle | null> {
  const db = await openDB();
  return new Promise((resolve) => {
    const request = db.transaction(STORE_NAME).objectStore(STORE_NAME).get(folderId);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => resolve(null);
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
  // 使用Blob URL，在应用会话期间有效
  // 我们将通过IndexedDB持久化实际文件，以便在刷新后重新生成URL
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
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [toast, setToast] = useState<string | null>(null);
  const [showSetCoverMenu, setShowSetCoverMenu] = useState<string | null>(null); // 存储要设为封面的图片ID
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<number | null>(null);

  // 缩放状态
  const [vScale, setVScale] = useState(1);
  const vTouchState = useRef({ dist: 0, scale: 1 });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // 核心功能：同步本地文件夹并生成预览 URL
  const syncLocalFolder = useCallback(async (handle: FileSystemDirectoryHandle, silent = false) => {
    if (isSyncing) return;
    setIsSyncing(true);
    
    const newSessionImages: SessionImage[] = [];
    const supportedExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    
    try {
      // @ts-ignore
      for await (const entry of handle.values()) {
        if (entry.kind === 'file') {
          const file = await (entry as any).getFile();
          if (supportedExts.some(ext => file.name.toLowerCase().endsWith(ext))) {
            const url = URL.createObjectURL(file);
            // 匹配已有的完成状态
            const existingRef = folder.references.find(r => r.title === entry.name);
            newSessionImages.push({
              id: `fs-${entry.name}-${file.size}`,
              url: url,
              title: entry.name,
              completed: existingRef?.completed || false,
              isLocalFile: true,
              file: file
            });
          }
        }
      }

      // 更新全局状态，持久化 meta 信息（但不持久化 URL，因为 URL 会失效）
      const updatedRefs: ImageReference[] = newSessionImages.map(({file, ...rest}) => ({...rest}));
      
      // 如果是第一次导入图片，将第一张图片设为封面
      const newCoverImage = updatedRefs.length > 0 && folder.references.length === 0 ? updatedRefs[0].url : folder.coverImage;
      
      onUpdateFolder({
        ...folder,
        references: updatedRefs,
        coverImage: newCoverImage,
        linkedPath: handle.name,
      });

      setSessionImages(newSessionImages);
      setPermissionState('granted');
      if (!silent) showToast(`成功读取 ${newSessionImages.length} 张本地原图`);
    } catch (err) {
      console.error(err);
      setPermissionState('denied');
      if (!silent) showToast("读取失败，请检查文件夹访问权限");
    } finally {
      setIsSyncing(false);
    }
  }, [folder, onUpdateFolder, isSyncing]);

  // 初始化：从IndexedDB加载图片并恢复强连接
  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      if (folder.linkedPath) {
        const handle = await getHandle(folder.id);
        if (handle) {
          try {
            // @ts-ignore
            const permission = await handle.queryPermission({ mode: 'readwrite' });
            if (permission === 'granted') {
              if (isMounted) syncLocalFolder(handle, true);
            } else {
              if (isMounted) setPermissionState('prompt');
            }
          } catch (e) {
            if (isMounted) setPermissionState('denied');
          }
        }
      } else {
          // 非强连接模式：合并IndexedDB图片和初始默认图片
          const storedImages = await getImagesByFolderId(folder.id);
          if (isMounted) {
            if (storedImages.length > 0) {
              // 从IndexedDB加载的图片，重新生成URL
              const indexedDBImages = storedImages.map(storedImg => ({
                id: storedImg.id,
                url: createPersistentURL(storedImg.file),
                title: storedImg.file.name,
                completed: folder.references.find(ref => ref.id === storedImg.id)?.completed || false,
                isLocalFile: false,
                file: storedImg.file
              }));
              
              // 获取初始默认图片（那些不在IndexedDB中的图片）
              const defaultImages = folder.references.filter(ref => 
                !storedImages.some(storedImg => storedImg.id === ref.id)
              );
              
              // 合并两种图片，保持顺序：默认图片在前，IndexedDB图片在后
              const mergedImages = [...defaultImages, ...indexedDBImages];
              setSessionImages(mergedImages);
            } else {
              // 没有存储的图片，直接使用已有的引用（可能是临时URL）
              setSessionImages(folder.references);
            }
          }
        }
    };
    init();
    return () => { isMounted = false; };
  }, [folder.id, folder.linkedPath, folder.references]);

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

  // 处理点击导入/强连接
  const handleRequestStrongConnection = async () => {
    // 检测设备类型
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile || !('showDirectoryPicker' in window)) {
      // 移动端或不支持showDirectoryPicker API的浏览器，直接使用手动导入
      showToast("已切换至批量导入模式");
      fileInputRef.current?.click();
      return;
    }
    try {
      // @ts-ignore
      const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
      await saveHandle(folder.id, handle);
      await syncLocalFolder(handle);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        showToast("无法访问文件夹，已切换至批量导入模式");
        fileInputRef.current?.click();
      }
    }
  };

  // 恢复现有强连接的权限
  const handleRestorePermission = async () => {
    const handle = await getHandle(folder.id);
    if (handle) {
      try {
        // @ts-ignore
        const permission = await handle.requestPermission({ mode: 'readwrite' });
        if (permission === 'granted') syncLocalFolder(handle);
      } catch (e) {
        showToast("授权失败");
      }
    }
  };

  // 手动批量导入（兼容移动端，支持持久化存储）
  const handleManualImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsSyncing(true);
    
    const newRefs: SessionImage[] = [];
    const storedImages: StoredImage[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const id = `m-${Date.now()}-${i}`;
      const url = createPersistentURL(file);
      
      // 创建图片引用
      newRefs.push({
        id: id,
        url: url,
        title: file.name,
        completed: false,
        isLocalFile: false,
        file: file
      });
      
      // 准备存储到IndexedDB
      storedImages.push({
        id: id,
        file: file,
        folderId: folder.id
      });
    }

    // 存储图片到IndexedDB
    for (const storedImg of storedImages) {
      await saveImageToDB(storedImg);
    }

    // 更新文件夹引用
    const updatedRefs = [...folder.references, ...newRefs.map(({file, ...rest}) => ({...rest}))];
    
    // 如果是第一次导入图片，将第一张图片设为封面
    const newCoverImage = folder.references.length === 0 && newRefs.length > 0 ? newRefs[0].url : folder.coverImage;
    
    onUpdateFolder({
      ...folder,
      references: updatedRefs,
      coverImage: newCoverImage
    });
    
    // 更新会话图片
    setSessionImages(prev => [...prev, ...newRefs]);
    
    setIsSyncing(false);
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
      <input type="file" ref={fileInputRef} multiple accept="image/*" className="hidden" onChange={handleManualImport} />

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
            {folder.linkedPath && !isSelectionMode && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="material-symbols-outlined text-[10px] text-primary filled">link</span>
                <p className="text-[10px] font-black text-primary uppercase tracking-wider truncate max-w-[120px]">强连接：{folder.linkedPath}</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {folder.linkedPath && !isSelectionMode && (
             <button onClick={() => {
                getHandle(folder.id).then(h => h && syncLocalFolder(h));
             }} className={`material-symbols-outlined text-primary ${isSyncing ? 'animate-spin' : ''}`}>
               sync
             </button>
          )}
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

      {/* 强连接权限恢复提示 */}
      {folder.linkedPath && permissionState === 'prompt' && (
        <div className="bg-primary/10 px-6 py-4 flex items-center justify-between border-b border-primary/5 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">security</span>
            <span className="text-xs font-black text-primary">需要授权以直接读取本地原图</span>
          </div>
          <button onClick={handleRestorePermission} className="bg-primary text-white text-[11px] px-5 py-2.5 rounded-full font-black uppercase tracking-wider shadow-lg shadow-primary/20 active:scale-95 transition-transform">重新授权</button>
        </div>
      )}

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
            <div className="flex flex-col gap-4 w-64">
              <button onClick={handleRequestStrongConnection} className="bg-primary text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-primary/20 flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-lg">folder_open</span> 强连接本地目录
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="bg-white text-slate-400 py-4 rounded-2xl font-black text-sm border border-black/5 flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-lg">add_photo_alternate</span> 批量导入图片
              </button>
            </div>
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
