
import React, { useState, useRef } from 'react';
import { Folder, Page } from '../types';

interface HomeProps {
  folders: Folder[];
  onNavigate: (page: Page, folder?: Folder) => void;
  onAddFolder: (name: string) => void;
  onCopyFolder: (id: string) => void;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
}

type ViewMode = 'grid' | 'list';

const Home: React.FC<HomeProps> = ({ folders, onNavigate, onAddFolder, onCopyFolder, onRenameFolder, onDeleteFolder }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [activeMenuFolderId, setActiveMenuFolderId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  
  const longPressTimer = useRef<number | null>(null);
  const isLongPressActive = useRef(false);

  // Handle Long Press to show menu
  const startLongPress = (folderId: string) => {
    isLongPressActive.current = false;
    longPressTimer.current = window.setTimeout(() => {
      isLongPressActive.current = true;
      setActiveMenuFolderId(folderId);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 600);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleFolderClick = (folder: Folder) => {
    if (isLongPressActive.current) {
      isLongPressActive.current = false;
      return;
    }
    onNavigate(Page.FOLDER_DETAIL, folder);
  };

  const confirmAdd = () => {
    if (inputValue.trim()) {
      onAddFolder(inputValue.trim());
      setInputValue('');
      setIsAdding(false);
    }
  };

  const confirmRename = () => {
    if (inputValue.trim() && isRenaming) {
      onRenameFolder(isRenaming, inputValue.trim());
      setInputValue('');
      setIsRenaming(null);
    }
  };

  const executeDelete = () => {
    if (showDeleteConfirm) {
      onDeleteFolder(showDeleteConfirm);
      setShowDeleteConfirm(null);
      setActiveMenuFolderId(null);
    }
  };

  const pinnedFolder = folders.length > 0 ? folders[0] : null;

  return (
    <div className="flex flex-col min-h-screen pb-32">
      {/* Delete Confirmation Modal (Custom UI instead of window.confirm) */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-6">
          <div className="w-full max-w-xs bg-white rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-200 text-center">
            <div className="size-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-rose-500 text-3xl">delete_forever</span>
            </div>
            <h3 className="text-xl font-black mb-2 text-text-main">确认删除？</h3>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              确定要删除 <span className="text-text-main font-bold">"{folders.find(f => f.id === showDeleteConfirm)?.name}"</span> 吗？此操作无法撤销。
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={executeDelete}
                className="w-full py-4 font-bold text-white bg-rose-500 rounded-2xl shadow-lg shadow-rose-200 active:scale-95 transition-transform"
              >
                彻底删除
              </button>
              <button 
                onClick={() => setShowDeleteConfirm(null)}
                className="w-full py-4 font-bold text-slate-400 bg-slate-50 rounded-2xl active:scale-95 transition-transform"
              >
                留着它
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Menu Modal */}
      {activeMenuFolderId && !showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setActiveMenuFolderId(null)}>
          <div className="w-full max-w-sm bg-white rounded-[2rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-50">
              <h3 className="text-center font-black text-slate-400 text-xs uppercase tracking-widest">图库操作</h3>
            </div>
            <button 
              onClick={() => {
                const f = folders.find(f => f.id === activeMenuFolderId);
                if (f) {
                  setInputValue(f.name);
                  setIsRenaming(activeMenuFolderId);
                }
                setActiveMenuFolderId(null);
              }}
              className="w-full p-5 flex items-center gap-4 hover:bg-slate-50 transition-colors"
            >
              <span className="material-symbols-outlined text-primary">edit</span>
              <span className="font-bold">重命名图库</span>
            </button>
            <button 
              onClick={() => {
                onCopyFolder(activeMenuFolderId!);
                setActiveMenuFolderId(null);
              }}
              className="w-full p-5 flex items-center gap-4 hover:bg-slate-50 transition-colors"
            >
              <span className="material-symbols-outlined text-primary">content_copy</span>
              <span className="font-bold">复制副本</span>
            </button>
            <button 
              onClick={() => setShowDeleteConfirm(activeMenuFolderId)}
              className="w-full p-5 flex items-center gap-4 hover:bg-rose-50 transition-colors text-rose-500"
            >
              <span className="material-symbols-outlined">delete</span>
              <span className="font-bold">彻底删除</span>
            </button>
            <div className="p-4 bg-slate-50">
              <button 
                onClick={() => setActiveMenuFolderId(null)}
                className="w-full py-4 bg-white rounded-2xl font-black text-slate-400 shadow-sm"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Rename Input Modal */}
      {(isAdding || isRenaming) && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6">
          <div className="w-full max-w-xs bg-white rounded-[2rem] p-8 shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-xl font-black mb-6">{isAdding ? '新建图库' : '重命名图库'}</h3>
            <input 
              autoFocus
              type="text" 
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="请输入名称"
              className="w-full p-4 bg-slate-50 border-none rounded-2xl mb-6 focus:ring-2 focus:ring-primary/20 font-bold outline-none"
              onKeyDown={e => e.key === 'Enter' && (isAdding ? confirmAdd() : confirmRename())}
            />
            <div className="flex gap-3">
              <button 
                onClick={() => { setIsAdding(false); setIsRenaming(null); setInputValue(''); }}
                className="flex-1 py-4 font-bold text-slate-400 bg-slate-100 rounded-2xl"
              >
                取消
              </button>
              <button 
                onClick={isAdding ? confirmAdd : confirmRename}
                className="flex-1 py-4 font-bold text-white bg-primary rounded-2xl shadow-lg shadow-primary/30"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-20 bg-bg-serenity/80 backdrop-blur-md px-6 pt-10 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-xl">palette</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-text-main">我的图库</h1>
        </div>
      </header>

      <main className="px-6 space-y-8 mt-4">
        {/* Pinned Practice Card */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold tracking-widest text-slate-400 uppercase">置顶</h2>
            <span className="text-xs font-semibold text-primary cursor-pointer">查看历史</span>
          </div>
          {pinnedFolder ? (
            <div 
              onClick={() => handleFolderClick(pinnedFolder)}
              onContextMenu={(e) => { e.preventDefault(); startLongPress(pinnedFolder.id); }}
              onTouchStart={() => startLongPress(pinnedFolder.id)}
              onTouchEnd={cancelLongPress}
              onMouseDown={() => startLongPress(pinnedFolder.id)}
              onMouseUp={cancelLongPress}
              className="relative overflow-hidden rounded-2xl bg-white border border-white shadow-sm active:scale-[0.98] transition-transform cursor-pointer select-none"
            >
              <div className="flex flex-col sm:flex-row h-full">
                <div className="flex-1 p-6 flex flex-col justify-between items-start gap-4">
                  <div>
                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white mb-3">
                      最近练习
                    </div>
                    <h3 className="text-xl font-bold leading-tight truncate w-full">
                      {pinnedFolder.name}
                    </h3>
                    <p className="text-slate-400 text-xs mt-1">更新于: {pinnedFolder.lastUpdated}</p>
                  </div>
                  <button className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-primary/20">
                    <span className="material-symbols-outlined text-xl filled">play_arrow</span>
                    <span>继续练习</span>
                  </button>
                </div>
                <div 
                  className="h-32 sm:h-auto sm:w-1/3 bg-cover bg-center" 
                  style={{ backgroundImage: `url(${pinnedFolder.coverImage})` }}
                />
              </div>
            </div>
          ) : (
            <div 
              onClick={() => setIsAdding(true)}
              className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/50 transition-colors"
            >
              <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">add_circle</span>
              <p className="text-slate-400 text-sm font-bold">暂无图库，点击新建</p>
            </div>
          )}
        </section>

        {/* Folders List/Grid */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xs font-bold tracking-widest text-slate-400 uppercase">所有文件夹</h2>
            {folders.length > 0 && (
              <div className="flex gap-4">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`material-symbols-outlined text-lg cursor-pointer transition-colors ${viewMode === 'grid' ? 'text-primary' : 'text-slate-300'}`}
                >
                  grid_view
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`material-symbols-outlined text-lg cursor-pointer transition-colors ${viewMode === 'list' ? 'text-primary' : 'text-slate-300'}`}
                >
                  format_list_bulleted
                </button>
              </div>
            )}
          </div>

          {folders.length === 0 ? (
            <div className="py-20 flex flex-col items-center opacity-20">
               <span className="material-symbols-outlined text-6xl mb-4">inventory_2</span>
               <p className="font-black tracking-widest uppercase text-xs">列表为空</p>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? "grid grid-cols-2 gap-x-4 gap-y-8" : "space-y-4"}>
              {folders.map((folder) => (
                <div 
                  key={folder.id} 
                  onClick={() => handleFolderClick(folder)}
                  onContextMenu={(e) => { e.preventDefault(); startLongPress(folder.id); }}
                  onTouchStart={() => startLongPress(folder.id)}
                  onTouchEnd={cancelLongPress}
                  onMouseDown={() => startLongPress(folder.id)}
                  onMouseUp={cancelLongPress}
                  className={`group cursor-pointer select-none transition-all ${viewMode === 'list' ? 'flex items-center gap-4 bg-white p-3 rounded-2xl border border-black/5 shadow-sm active:scale-[0.99]' : 'flex flex-col'}`}
                >
                  <div className={`relative overflow-hidden rounded-2xl bg-white shadow-sm transition-transform ${viewMode === 'grid' ? 'aspect-[4/5] group-active:scale-[0.97]' : 'size-20 flex-shrink-0'}`}>
                    <div 
                      className="absolute inset-0 bg-cover bg-center" 
                      style={{ backgroundImage: `url(${folder.coverImage})` }}
                    />
                    {viewMode === 'grid' && (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                        <div className="absolute bottom-3 left-3 text-white">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/20 backdrop-blur-sm">
                            {folder.references.length} 参考
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                  <div className={viewMode === 'list' ? "flex-1" : "mt-3"}>
                    <h4 className="font-bold text-sm leading-tight text-text-main truncate">{folder.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {viewMode === 'list' ? `${folder.references.length} 张素材 • ` : ""}更新于 {folder.lastUpdated}
                    </p>
                  </div>
                  {viewMode === 'list' && (
                    <span className="material-symbols-outlined text-slate-200 pr-2">chevron_right</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <button 
        onClick={() => setIsAdding(true)}
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30 active:scale-90 transition-transform z-30"
      >
        <span className="material-symbols-outlined text-3xl">add</span>
      </button>
    </div>
  );
};

export default Home;
