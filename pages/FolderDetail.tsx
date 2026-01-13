
import React, { useState, useRef } from 'react';
import { Folder, Page, ImageReference } from '../types';

interface FolderDetailProps {
  folder: Folder;
  onNavigate: (page: Page, folder?: Folder) => void;
  onUpdateFolder: (folder: Folder) => void;
}

type ViewMode = 'grid' | 'list';

const FolderDetail: React.FC<FolderDetailProps> = ({ folder, onNavigate, onUpdateFolder }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [toast, setToast] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === folder.references.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(folder.references.map(r => r.id)));
    }
  };

  const handleDelete = () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`确定要删除选中的 ${selectedIds.size} 张素材吗？`)) return;
    
    const nextRefs = folder.references.filter(r => !selectedIds.has(r.id));
    onUpdateFolder({
      ...folder,
      references: nextRefs
    });
    setSelectedIds(new Set());
    showToast(`已删除 ${selectedIds.size} 张素材`);
  };

  const handleMarkComplete = () => {
    if (selectedIds.size === 0) return;
    const nextRefs = folder.references.map(r => 
      selectedIds.has(r.id) ? { ...r, completed: !r.completed } : r
    );
    onUpdateFolder({ ...folder, references: nextRefs });
    setSelectedIds(new Set());
    showToast(`状态已更新`);
  };

  const handleShare = () => {
    if (selectedIds.size === 0) return;
    showToast(`已成功分享 ${selectedIds.size} 张素材！`);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  // 将文件转换为 Base64 字符串的辅助函数
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
          url: base64Data, // 存入 Base64 字符串实现永久化
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
      console.error("图片转换失败:", err);
      showToast("图片处理失败，请重试");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const realCount = folder.references.length;

  return (
    <div className="flex flex-col min-h-screen">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        multiple 
        accept="image/*" 
        onChange={handleFileChange}
      />

      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] bg-black/80 text-white px-6 py-3 rounded-full text-xs font-bold animate-bounce shadow-xl">
          {isImporting && (
            <span className="inline-block animate-spin mr-2">⏳</span>
          )}
          {toast}
        </div>
      )}

      <header className="sticky top-0 z-30 bg-bg-serenity/90 backdrop-blur-md border-b border-black/5 px-6 pt-12 pb-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => onNavigate(Page.HOME)}
              className="flex items-center justify-center size-10 rounded-full bg-white shadow-sm hover:bg-slate-50 transition-colors active:scale-90"
            >
              <span className="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
            </button>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-text-main truncate max-w-[150px]">{folder.name}</h1>
              <p className="text-xs font-medium text-slate-500 mt-0.5">{realCount} 张素材</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
             <button 
              onClick={handleImportClick}
              className="flex items-center justify-center size-10 rounded-full hover:bg-white/50 text-primary transition-colors"
              title="导入图片"
            >
              <span className="material-symbols-outlined text-2xl">add_photo_alternate</span>
            </button>
            <button 
              onClick={handleSelectAll}
              className={`flex items-center justify-center size-10 rounded-full hover:bg-white/50 transition-colors ${selectedIds.size > 0 ? 'text-primary' : ''}`}
            >
              <span className="material-symbols-outlined text-2xl">select_all</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pb-40">
        <div className="flex items-center justify-between py-5 px-2">
          <h3 className="text-sm font-bold tracking-widest text-primary uppercase">
            {viewMode === 'grid' ? '网格视图' : '列表视图'}
          </h3>
          <div className="flex gap-4">
             <button 
              onClick={() => setViewMode('grid')}
              className={`material-symbols-outlined text-xl transition-colors ${viewMode === 'grid' ? 'text-primary' : 'text-slate-300'}`}
            >
              grid_view
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`material-symbols-outlined text-xl transition-colors ${viewMode === 'list' ? 'text-primary' : 'text-slate-300'}`}
            >
              format_list_bulleted
            </button>
          </div>
        </div>

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
          <div className="bg-white rounded-3xl p-3 border border-black/5 shadow-sm">
            <div className={viewMode === 'grid' ? "grid grid-cols-3 gap-2" : "space-y-2"}>
              {folder.references.map((ref) => (
                <div 
                  key={ref.id}
                  onClick={() => toggleSelect(ref.id)}
                  className={`relative group cursor-pointer overflow-hidden transition-all ${
                    viewMode === 'grid' 
                    ? `aspect-square rounded-xl ${selectedIds.has(ref.id) ? 'ring-4 ring-primary ring-inset' : ''}`
                    : `flex items-center gap-4 p-2 rounded-xl border border-transparent ${selectedIds.has(ref.id) ? 'bg-primary/5 border-primary/20' : 'hover:bg-slate-50'}`
                  }`}
                >
                  <div 
                    className={viewMode === 'grid' ? "w-full h-full bg-center bg-cover" : "size-14 rounded-lg bg-center bg-cover flex-shrink-0"} 
                    style={{ backgroundImage: `url(${ref.url})` }}
                  />
                  
                  {viewMode === 'list' && (
                    <div className="flex-1">
                      <p className="text-xs font-bold text-text-main truncate pr-2">{ref.title || `素材 #${ref.id.slice(-4)}`}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{ref.completed ? '已标记为完成' : '待练习'}</p>
                    </div>
                  )}

                  {ref.completed && (
                    <div className={viewMode === 'grid' 
                      ? "absolute inset-0 bg-white/40 backdrop-blur-[1px] flex flex-col items-center justify-center gap-1"
                      : "mr-4"
                    }>
                      <span className="material-symbols-outlined text-secondary text-2xl filled">check_circle</span>
                      {viewMode === 'grid' && <span className="text-[10px] text-secondary font-bold">已完成</span>}
                    </div>
                  )}

                  {selectedIds.has(ref.id) && (
                    <div className={viewMode === 'grid' 
                      ? "absolute top-2 right-2 bg-primary text-white rounded-full size-6 flex items-center justify-center shadow-sm"
                      : "flex items-center justify-center size-6 rounded-full bg-primary text-white mr-2 shadow-sm"
                    }>
                      <span className="material-symbols-outlined text-sm font-bold">check</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* 悬浮操作按钮区 */}
      <div className="fixed bottom-28 right-6 z-40 flex items-center gap-3">
        {/* 新增：导入按钮 */}
        <button 
          onClick={handleImportClick}
          className="flex items-center justify-center size-12 rounded-full bg-white text-primary border border-primary/10 shadow-lg active:scale-95 transition-all hover:bg-primary/5"
          title="导入更多素材"
        >
          <span className="material-symbols-outlined text-2xl">add_photo_alternate</span>
        </button>

        {/* 练习按钮：仅在有素材时显示 */}
        {realCount > 0 && (
          <button 
            onClick={() => onNavigate(Page.PRACTICE_CONFIG, folder)}
            className="flex items-center justify-center size-14 rounded-full bg-primary text-white shadow-lg shadow-primary/30 active:scale-95 transition-transform"
            title="开始练习"
          >
            <span className="material-symbols-outlined text-3xl filled">play_arrow</span>
          </button>
        )}
      </div>

      {/* 选择操作条 */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 px-4 pb-10 pt-4 bg-white border-t border-black/5 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] transition-transform duration-300 ${selectedIds.size > 0 ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button 
            onClick={handleDelete}
            className="flex flex-col items-center gap-1.5 px-6 group cursor-pointer transition-opacity"
          >
            <div className="flex items-center justify-center size-11 rounded-full bg-slate-50 group-active:bg-rose-50 transition-colors">
              <span className="material-symbols-outlined text-slate-400 group-active:text-rose-400">delete</span>
            </div>
            <span className="text-[11px] font-bold tracking-wide text-slate-400">删除</span>
          </button>
          
          <div className="h-8 w-[1px] bg-slate-100" />
          
          <button 
            onClick={handleMarkComplete}
            className="flex flex-col items-center gap-1.5 px-6 group cursor-pointer"
          >
            <div className="flex items-center justify-center size-11 rounded-full bg-slate-50 group-active:bg-secondary/20 transition-colors">
              <span className="material-symbols-outlined text-secondary">check_circle</span>
            </div>
            <span className="text-[11px] font-bold tracking-wide text-slate-400">标记状态</span>
          </button>
          
          <div className="h-8 w-[1px] bg-slate-100" />
          
          <button 
            onClick={handleShare}
            className="flex flex-col items-center gap-1.5 px-6 group cursor-pointer"
          >
            <div className="flex items-center justify-center size-11 rounded-full bg-slate-50 group-active:bg-primary/20 transition-colors">
              <span className="material-symbols-outlined text-primary">share</span>
            </div>
            <span className="text-[11px] font-bold tracking-wide text-slate-400">分享</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FolderDetail;
