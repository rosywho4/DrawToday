
import React, { useState, useRef, useEffect } from 'react';
import { Folder, Page, ImageReference } from '../types';

const DB_NAME = 'SketchSerenityDB';
const STORE_NAME = 'FolderHandles';

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
  });
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

interface FolderDetailProps {
  folder: Folder;
  onNavigate: (page: Page, folder?: Folder) => void;
  onUpdateFolder: (folder: Folder) => void;
}

const FolderDetail: React.FC<FolderDetailProps> = ({ folder, onNavigate, onUpdateFolder }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [needsPermission, setNeedsPermission] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<number | null>(null);

  // Viewer zoom state
  const [vScale, setVScale] = useState(1);
  const vTouchState = useRef({ dist: 0, scale: 1 });

  useEffect(() => {
    const checkHandle = async () => {
      if (folder.linkedPath) {
        const handle = await getHandle(folder.id);
        if (handle) {
          try {
            const permission = await (handle as any).queryPermission();
            if (permission !== 'granted') setNeedsPermission(true);
            else syncLocalFolder(handle, true);
          } catch (e) { console.warn("Permission API not supported"); }
        }
      }
    };
    checkHandle();
  }, [folder.id]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleLinkFolder = async () => {
    if (!('showDirectoryPicker' in window)) {
      showToast("此浏览器不支持目录选择，已为您开启多选导入");
      fileInputRef.current?.click();
      return;
    }
    try {
      // @ts-ignore
      const handle = await window.showDirectoryPicker();
      await saveHandle(folder.id, handle);
      await syncLocalFolder(handle);
    } catch (err: any) {
      if (err.name !== 'AbortError') showToast("无法访问文件夹，请检查权限");
    }
  };

  const syncLocalFolder = async (handle: FileSystemDirectoryHandle, silent = false) => {
    setIsSyncing(true);
    const newRefs: ImageReference[] = [];
    const supportedExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    try {
      // @ts-ignore
      for await (const entry of handle.values()) {
        if (entry.kind === 'file') {
          const file = await (entry as any).getFile();
          if (supportedExts.some(ext => file.name.toLowerCase().endsWith(ext))) {
            newRefs.push({
              id: `fs-${entry.name}-${file.lastModified}`,
              url: URL.createObjectURL(file),
              completed: folder.references.find(r => r.title === entry.name)?.completed || false,
              title: entry.name,
              isLocalFile: true
            });
          }
        }
      }
      onUpdateFolder({
        ...folder,
        references: [...newRefs, ...folder.references.filter(r => !r.isLocalFile)],
        coverImage: newRefs.length > 0 ? newRefs[0].url : folder.coverImage,
        linkedPath: handle.name,
        lastUpdated: '刚刚同步'
      });
      if (!silent) showToast(`同步完成：找到 ${newRefs.length} 张素材`);
    } catch (err) {
      if (!silent) showToast("同步失败");
    } finally { setIsSyncing(false); }
  };

  const handleManualImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsSyncing(true);
    const newRefs: ImageReference[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Use createObjectURL for performance on mobile instead of base64
      const url = URL.createObjectURL(file);
      newRefs.push({ 
        id: `m-${Date.now()}-${i}-${file.size}`, 
        url, 
        completed: false, 
        title: file.name 
      });
    }
    
    onUpdateFolder({
      ...folder,
      references: [...folder.references, ...newRefs],
      coverImage: folder.references.length === 0 ? newRefs[0].url : folder.coverImage
    });
    
    setIsSyncing(false);
    showToast(`成功导入 ${newRefs.length} 张图片`);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (folderInputRef.current) folderInputRef.current.value = '';
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
    setIsSelectionMode(next.size > 0);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === folder.references.length) {
      setSelectedIds(new Set());
      setIsSelectionMode(false);
    } else {
      setSelectedIds(new Set(folder.references.map(r => r.id)));
      setIsSelectionMode(true);
    }
  };

  const handleToggleComplete = () => {
    if (selectedIds.size === 0) return;
    const nextRefs = folder.references.map(r => 
      selectedIds.has(r.id) ? { ...r, completed: !r.completed } : r
    );
    onUpdateFolder({ ...folder, references: nextRefs });
    setIsSelectionMode(false);
    setSelectedIds(new Set());
    showToast("状态已更新");
  };

  const startLongPress = (id: string) => {
    if (isSelectionMode) return;
    longPressTimer.current = window.setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(50);
      setIsSelectionMode(true);
      setSelectedIds(new Set([id]));
    }, 600);
  };

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // Viewer touch handlers
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
      <input type="file" ref={folderInputRef} {...({webkitdirectory: '', directory: ''} as any)} className="hidden" onChange={handleManualImport} />

      {/* 图片查看器 */}
      {viewerIndex !== null && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 touch-none"
             onTouchStart={vTouchStart} onTouchMove={vTouchMove}>
          <button 
            onClick={() => { setViewerIndex(null); setVScale(1); }} 
            className="absolute top-14 right-6 size-11 flex items-center justify-center rounded-full bg-white/20 text-white z-[110] active:scale-90 transition-transform"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden" onClick={() => { setViewerIndex(null); setVScale(1); }}>
            {vScale === 1 && (
              <>
                <button 
                  disabled={viewerIndex === 0}
                  onClick={(e) => { e.stopPropagation(); setViewerIndex(viewerIndex - 1); }}
                  className="absolute left-4 size-14 flex items-center justify-center rounded-full bg-black/40 text-white disabled:opacity-10 transition-all active:scale-90 z-[110]"
                >
                  <span className="material-symbols-outlined text-3xl">chevron_left</span>
                </button>

                <button 
                  disabled={viewerIndex === folder.references.length - 1}
                  onClick={(e) => { e.stopPropagation(); setViewerIndex(viewerIndex + 1); }}
                  className="absolute right-4 size-14 flex items-center justify-center rounded-full bg-black/40 text-white disabled:opacity-10 transition-all active:scale-90 z-[110]"
                >
                  <span className="material-symbols-outlined text-3xl">chevron_right</span>
                </button>
              </>
            )}

            <img 
              src={folder.references[viewerIndex].url} 
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl transition-transform duration-100 ease-out" 
              style={{ transform: `scale(${vScale})` }}
              alt="Preview" 
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="absolute bottom-12 px-6 py-2 bg-black/40 rounded-full text-white/80 text-sm font-black tracking-widest tabular-nums z-[110]">
            {viewerIndex + 1} / {folder.references.length}
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
            {folder.linkedPath && !isSelectionMode && <p className="text-[10px] font-black text-primary uppercase tracking-wider">本地：{folder.linkedPath}</p>}
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
          {isSelectionMode && folder.references.length > 0 && (
            <button 
              onClick={handleSelectAll} 
              className={`material-symbols-outlined transition-colors ${selectedIds.size === folder.references.length ? 'text-primary' : 'text-slate-400'}`}
            >
              {selectedIds.size === folder.references.length ? 'deselect' : 'select_all'}
            </button>
          )}
        </div>
      </header>

      {needsPermission && (
        <div className="bg-primary/10 p-4 flex items-center justify-between border-b border-primary/5">
          <span className="text-sm font-black text-primary">连接已断开</span>
          <button onClick={async () => {
            const h = await getHandle(folder.id);
            if (h && await (h as any).requestPermission({mode: 'readwrite'}) === 'granted') { setNeedsPermission(false); syncLocalFolder(h); }
          }} className="bg-primary text-white text-[11px] px-4 py-2 rounded-full font-black uppercase tracking-wider">恢复访问</button>
        </div>
      )}

      {toast && <div className="fixed top-28 left-1/2 -translate-x-1/2 z-[120] bg-black/80 text-white px-5 py-2.5 rounded-full text-xs font-black animate-in fade-in slide-in-from-top-2">{toast}</div>}

      <main className="flex-1 p-4 pb-40">
        {folder.references.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="size-24 rounded-full bg-white flex items-center justify-center shadow-sm opacity-20 mb-8">
              <span className="material-symbols-outlined text-5xl">folder_zip</span>
            </div>
            <p className="text-slate-400 text-sm font-black mb-10">此图库尚无素材</p>
            <div className="flex flex-col gap-4 w-56">
              <button onClick={handleLinkFolder} className="bg-primary text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-primary/20">导入图片</button>
              <button onClick={() => fileInputRef.current?.click()} className="bg-white text-slate-400 py-4 rounded-2xl font-black text-sm border border-black/5">从相册添加</button>
            </div>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? "grid grid-cols-3 gap-3" : "space-y-3"}>
            {folder.references.map((ref, idx) => (
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

      {/* 多选模式 */}
      {isSelectionMode && (
        <div className="fixed bottom-0 inset-x-0 bg-white p-6 pb-12 rounded-t-[3rem] shadow-[0_-15px_40px_rgba(0,0,0,0.1)] z-50 flex justify-around animate-in slide-in-from-bottom duration-300">
          <button 
            onClick={() => { 
              const nextRefs = folder.references.filter(r => !selectedIds.has(r.id));
              onUpdateFolder({...folder, references: nextRefs}); 
              setIsSelectionMode(false); 
              setSelectedIds(new Set()); 
              showToast("已移除选中项");
            }} 
            className="flex flex-col items-center gap-2"
          >
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
