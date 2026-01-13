
import React, { useState, useRef, useEffect } from 'react';
import { Folder, Page, ImageReference } from '../types';

interface FolderDetailProps {
  folder: Folder;
  onNavigate: (page: Page, folder?: Folder) => void;
  onUpdateFolder: (folder: Folder) => void;
}

type ViewMode = 'grid' | 'list';

const FolderDetail: React.FC<FolderDetailProps> = ({ folder, onNavigate, onUpdateFolder }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<number | null>(null);

  // 退出选择模式时清空已选
  useEffect(() => {
    if (!isSelectionMode) {
      setSelectedIds(new Set());
    }
  }, [isSelectionMode]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // --- 处理选择逻辑 ---
  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
    
    if (next.size === 0) setIsSelectionMode(false);
  };

  const handleLongPress = (id: string) => {
    if (isSelectionMode) return;
    if (navigator.vibrate) navigator.vibrate(50);
    setIsSelectionMode(true);
    setSelectedIds(new Set([id]));
  };

  const startPress = (id: string) => {
    longPressTimer.current = window.setTimeout(() => handleLongPress(id), 600);
  };

  const clearPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleImageClick = (id: string, index: number) => {
    if (isSelectionMode) {
      toggleSelect(id);
    } else {
      setViewerIndex(index);
    }
  };

  // --- 操作逻辑 ---
  const handleDelete = () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`确定要删除选中的 ${selectedIds.size} 张素材吗？`)) return;
    
    const nextRefs = folder.references.filter(r => !selectedIds.has(r.id));
    onUpdateFolder({ ...folder, references: nextRefs });
    setIsSelectionMode(false);
    showToast(`已删除 ${selectedIds.size} 张素材`);
  };

  const handleToggleComplete = () => {
    if (selectedIds.size === 0) return;
    // 逻辑：如果选中的图里有未完成的，则全部标记为完成；否则全部标记为未完成
    const selectedRefs = folder.references.filter(r => selectedIds.has(r.id));
    const hasIncomplete = selectedRefs.some(r => !r.completed);
    
    const nextRefs = folder.references.map(r => 
      selectedIds.has(r.id) ? { ...r, completed: hasIncomplete } : r
    );
    
    onUpdateFolder({ ...folder, references: nextRefs });
    setIsSelectionMode(false);
    showToast(hasIncomplete ? "已标记为完成" : "已重置为未完成");
  };

  // --- 导入逻辑 ---
  const handleImportClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsImporting(true);
    showToast("正在处理图片...");

    try {
      const newRefs: ImageReference[] = [];
      for (let i = 0; i < files.length; i++) {
        const base64Data = await readFileAsBase64(files[i]);
        newRefs.push({
          id: `imported-${Date.now()}-${i}`,
          url: base64Data,
          completed: false,
          title: files[i].name
        });
      }
      const nextRefs = [...newRefs, ...folder.references];
      onUpdateFolder({
        ...folder,
        references: nextRefs,
        coverImage: newRefs[0].url,
        lastUpdated: '刚刚'
      });
      showToast(`成功导入 ${newRefs.length} 张素材`);
    } catch (err) {
      showToast("图片导入失败");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const realCount = folder.references.length;

  return (
    <div className="flex flex-col min-h-screen select-none">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        multiple 
        accept="image/*" 
        onChange={handleFileChange}
      />

      {/* 图片查看器 Modal */}
      {viewerIndex !== null && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center animate-in fade-in duration-200">
          <button 
            onClick={() => setViewerIndex(null)}
            className="absolute top-12 right-6 size-12 flex items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md z-10"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          
          <div className="w-full h-full flex items-center justify-center p-4">
            <img 
              src={folder.references[viewerIndex].url} 
              className="max-w-full max-h-[80vh] object-contain shadow-2xl rounded-lg"
              alt="Preview"
            />
          </div>

          <div className="absolute bottom-12 flex items-center gap-8 text-white">
            <button 
              disabled={viewerIndex === 0}
              onClick={() => setViewerIndex(viewerIndex - 1)}
              className="size-14 rounded-full bg-white/5 flex items-center justify-center disabled:opacity-20"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <span className="font-bold tracking-widest text-sm">{viewerIndex + 1} / {realCount}</span>
            <button 
              disabled={viewerIndex === realCount - 1}
              onClick={() => setViewerIndex(viewerIndex + 1)}
              className="size-14 rounded-full bg-white/5 flex items-center justify-center disabled:opacity-20"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] bg-black/80 text-white px-6 py-3 rounded-full text-xs font-bold shadow-xl animate-in slide-in-from-top-4">
          {isImporting && <span className="inline-block animate-spin mr-2">⏳</span>}
          {toast}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 bg-bg-serenity/90 backdrop-blur-md border-b border-black/5 px-6 pt-12 pb-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => isSelectionMode ? setIsSelectionMode(false) : onNavigate(Page.HOME)}
              className="flex items-center justify-center size-10 rounded-full bg-white shadow-sm active:scale-90 transition-all"
            >
              <span className="material-symbols-outlined text-2xl">
                {isSelectionMode ? 'close' : 'arrow_back_ios_new'}
              </span>
            </button>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-text-main truncate max-w-[150px]">
                {isSelectionMode ? `已选择 ${selectedIds.size} 项` : folder.name}
              </h1>
              {!isSelectionMode && <p className="text-xs font-medium text-slate-500 mt-0.5">{realCount} 张素材</p>}
            </div>
          </div>
          
          {!isSelectionMode && (
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="flex items-center justify-center size-10 rounded-full hover:bg-white/50 text-slate-400 transition-colors"
              >
                <span className="material-symbols-outlined text-2xl">
                  {viewMode === 'grid' ? 'format_list_bulleted' : 'grid_view'}
                </span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pb-40">
        <div className="h-6" />
        
        {realCount === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-30">
            <span className="material-symbols-outlined text-6xl mb-4">folder_off</span>
            <p className="font-bold text-sm">此图库还是空的</p>
            <button 
              onClick={handleImportClick}
              className="mt-4 px-6 py-2 bg-primary/10 text-primary rounded-full font-bold text-xs"
            >
              立即导入素材
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] p-4 border border-black/5 shadow-sm">
            <div className={viewMode === 'grid' ? "grid grid-cols-3 gap-3" : "space-y-3"}>
              {folder.references.map((ref, idx) => (
                <div 
                  key={ref.id}
                  onClick={() => handleImageClick(ref.id, idx)}
                  onMouseDown={() => startPress(ref.id)}
                  onMouseUp={clearPress}
                  onMouseLeave={clearPress}
                  onTouchStart={() => startPress(ref.id)}
                  onTouchEnd={clearPress}
                  className={`relative group cursor-pointer overflow-hidden transition-all duration-300 ${
                    viewMode === 'grid' 
                    ? `aspect-square rounded-2xl ${selectedIds.has(ref.id) ? 'scale-90 ring-4 ring-primary ring-offset-2' : 'hover:scale-[1.02]'}`
                    : `flex items-center gap-4 p-3 rounded-2xl border ${selectedIds.has(ref.id) ? 'bg-primary/5 border-primary/20' : 'border-transparent hover:bg-slate-50'}`
                  }`}
                >
                  <div 
                    className={viewMode === 'grid' ? "w-full h-full bg-center bg-cover" : "size-16 rounded-xl bg-center bg-cover flex-shrink-0"} 
                    style={{ backgroundImage: `url(${ref.url})` }}
                  />
                  
                  {viewMode === 'list' && (
                    <div className="flex-1">
                      <p className="text-sm font-bold text-text-main truncate">{ref.title || `素材 #${idx + 1}`}</p>
                      <p className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${ref.completed ? 'text-secondary' : 'text-slate-300'}`}>
                        {ref.completed ? '已完成练习' : '待练习'}
                      </p>
                    </div>
                  )}

                  {/* 完成状态遮罩 */}
                  {ref.completed && !selectedIds.has(ref.id) && (
                    <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="material-symbols-outlined text-secondary text-3xl filled">check_circle</span>
                    </div>
                  )}

                  {/* 选中状态指示器 */}
                  {selectedIds.has(ref.id) && (
                    <div className="absolute top-2 right-2 bg-primary text-white rounded-full size-6 flex items-center justify-center shadow-lg animate-in zoom-in duration-200">
                      <span className="material-symbols-outlined text-sm font-bold">check</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* 悬浮操作按钮区 (仅非多选模式下显示) */}
      {!isSelectionMode && (
        <div className="fixed bottom-28 right-6 z-40 flex items-center gap-4">
          <button 
            onClick={handleImportClick}
            className="flex items-center justify-center size-12 rounded-full bg-white text-primary border border-primary/10 shadow-xl active:scale-95 transition-all hover:bg-primary/5"
            title="导入素材"
          >
            <span className="material-symbols-outlined text-2xl">add_photo_alternate</span>
          </button>

          {realCount > 0 && (
            <button 
              onClick={() => onNavigate(Page.PRACTICE_CONFIG, folder)}
              className="flex items-center justify-center size-16 rounded-full bg-primary text-white shadow-xl shadow-primary/30 active:scale-95 transition-transform"
              title="开始练习"
            >
              <span className="material-symbols-outlined text-4xl filled">play_arrow</span>
            </button>
          )}
        </div>
      )}

      {/* 多选模式操作条 */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 px-4 pb-12 pt-6 bg-white border-t border-black/5 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] transition-all duration-500 ease-out ${isSelectionMode ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="max-w-2xl mx-auto flex items-center justify-around">
          <button 
            onClick={handleDelete}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="flex items-center justify-center size-14 rounded-2xl bg-rose-50 text-rose-500 group-active:scale-90 transition-all">
              <span className="material-symbols-outlined text-2xl">delete</span>
            </div>
            <span className="text-[11px] font-black tracking-widest text-slate-400 uppercase">彻底删除</span>
          </button>
          
          <button 
            onClick={handleToggleComplete}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="flex items-center justify-center size-14 rounded-2xl bg-primary/5 text-primary group-active:scale-90 transition-all">
              <span className="material-symbols-outlined text-2xl">check_circle</span>
            </div>
            <span className="text-[11px] font-black tracking-widest text-slate-400 uppercase">标记状态</span>
          </button>

          <button 
            onClick={() => setIsSelectionMode(false)}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="flex items-center justify-center size-14 rounded-2xl bg-slate-50 text-slate-400 group-active:scale-90 transition-all">
              <span className="material-symbols-outlined text-2xl">close</span>
            </div>
            <span className="text-[11px] font-black tracking-widest text-slate-400 uppercase">取消选择</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FolderDetail;
