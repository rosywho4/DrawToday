import React, { useEffect, useState as useReactState } from 'react';
import { Link } from 'react-router-dom';
import useHomePage from '../hooks/useHomePage';
import { useFolders } from '../contexts/FoldersContext';
import { useFolderImages } from '../hooks/useFolderImages';
import { getImageFromDB, createPersistentURL } from '../utils/indexedDB';
import Header from '../components/layout/Header';
import { X, Check } from 'lucide-react';

export default function HomePage() {
  const {
    folders,
    pinnedFolder,
    viewMode,
    setViewMode,
    activeMenuFolderId,
    setActiveMenuFolderId,
    showDeleteConfirm,
    setShowDeleteConfirm,
    isAdding,
    setIsAdding,
    isRenaming,
    setIsRenaming,
    inputValue,
    setInputValue,
    startLongPress,
    cancelLongPress,
    handleFolderClick,
    confirmAdd,
    confirmRename,
    handleCopyFolder,
    handleDeleteFolder,
    showCoverSelector,
    setShowCoverSelector
  } = useHomePage();

  const { updateFolder } = useFolders();
  
  // 用于存储从 IndexedDB 加载的封面图片 URL
  const [coverUrls, setCoverUrls] = useReactState<Record<string, string>>({});
  const [loadedFolderIds, setLoadedFolderIds] = useReactState<Set<string>>(new Set());

  // 加载所有文件夹的封面图片
  useEffect(() => {
    const loadCovers = async () => {
      const newCoverUrls: Record<string, string> = {};
      const newLoadedIds = new Set<string>();
      
      for (const folder of folders) {
        // 如果已经加载过且 coverId 没变，跳过
        if (loadedFolderIds.has(folder.id) && coverUrls[folder.id]) {
          newCoverUrls[folder.id] = coverUrls[folder.id];
          newLoadedIds.add(folder.id);
          continue;
        }
        
        if (folder.coverId) {
          const imageData = await getImageFromDB(folder.coverId);
          if (imageData?.file) {
            newCoverUrls[folder.id] = createPersistentURL(imageData.file);
          } else if (folder.coverImage) {
            // 如果没有找到 IndexedDB 中的图片，使用默认封面
            newCoverUrls[folder.id] = folder.coverImage;
          }
        } else if (folder.coverImage) {
          newCoverUrls[folder.id] = folder.coverImage;
        }
        newLoadedIds.add(folder.id);
      }
      
      setCoverUrls(newCoverUrls);
      setLoadedFolderIds(newLoadedIds);
    };
    
    loadCovers();
  }, [folders.length]); // 只在文件夹数量变化时重新加载
  
  // 获取文件夹的封面 URL
  const getFolderCoverUrl = (folder: any) => {
    return coverUrls[folder.id] || folder.coverImage || 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=400&auto=format&fit=crop';
  };
  
  // 获取封面选择器对应文件夹的图片
  const selectedFolder = folders.find(f => f.id === showCoverSelector);
  const { images: coverImages } = useFolderImages(
    showCoverSelector || '',
    selectedFolder?.references || []
  );

  // 为每个folder获取完整的图片数量
  const getTotalImageCount = (folder: any) => {
    const baseCount = folder.references.length;
    // 注意：这里我们不能直接获取导入的图片数量，因为需要hook实例
    // 但我们可以通过检查folder对象是否有imageCount字段
    return folder.imageCount || baseCount;
  };

  return (
    <div className="flex flex-col min-h-screen pb-32">
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-6">
          <div className="w-full max-w-xs bg-white rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-200 text-center">
            <h3 className="text-xl font-black mb-2">确认删除？</h3>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              确定要删除 <span className="text-text-main font-bold">"{folders.find(f => f.id === showDeleteConfirm)?.name}"</span> 吗？
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => { handleDeleteFolder(showDeleteConfirm); setShowDeleteConfirm(null); setActiveMenuFolderId(null); }}
                className="w-full py-4 font-bold text-white bg-rose-500 rounded-2xl shadow-lg shadow-rose-200"
              >
                彻底删除
              </button>
              <button onClick={() => setShowDeleteConfirm(null)} className="w-full py-4 font-bold text-slate-400 bg-slate-50 rounded-2xl">
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {activeMenuFolderId && !showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setActiveMenuFolderId(null)}>
          <div className="w-full max-w-sm bg-white rounded-[2rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-50 text-center">
              <h3 className="font-black text-slate-400 text-[10px] uppercase tracking-widest">图库管理</h3>
            </div>
            <button
              onClick={() => { const f = folders.find(f => f.id === activeMenuFolderId); if (f) { setInputValue(f.name); setIsRenaming(activeMenuFolderId); } setActiveMenuFolderId(null); }}
              className="w-full p-5 flex items-center gap-4 hover:bg-slate-50 border-b border-slate-50 font-bold"
            >
              <span className="material-symbols-outlined text-primary">edit</span> 重命名
            </button>
            <button onClick={() => { handleCopyFolder(activeMenuFolderId!); setActiveMenuFolderId(null); }} className="w-full p-5 flex items-center gap-4 hover:bg-slate-50 border-b border-slate-50 font-bold">
              <span className="material-symbols-outlined text-primary">content_copy</span> 复制副本
            </button>
            <button onClick={() => { setShowCoverSelector(activeMenuFolderId); setActiveMenuFolderId(null); }} className="w-full p-5 flex items-center gap-4 hover:bg-slate-50 border-b border-slate-50 font-bold">
              <span className="material-symbols-outlined text-primary">image</span> 设置封面
            </button>
            <button onClick={() => setShowDeleteConfirm(activeMenuFolderId)} className="w-full p-5 flex items-center gap-4 hover:bg-rose-50 text-rose-500 font-bold">
              <span className="material-symbols-outlined">delete</span> 彻底删除
            </button>
            <div className="p-4 bg-slate-50">
              <button onClick={() => setActiveMenuFolderId(null)} className="w-full py-4 bg-white rounded-2xl font-black text-slate-400 shadow-sm">取消</button>
            </div>
          </div>
        </div>
      )}

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
              className="w-full p-4 bg-slate-50 border-none rounded-2xl mb-6 font-bold outline-none focus:ring-2 focus:ring-primary/20"
            />
            <div className="flex gap-3">
              <button onClick={() => { setIsAdding(false); setIsRenaming(null); setInputValue(''); }} className="flex-1 py-4 font-bold text-slate-400 bg-slate-100 rounded-2xl">取消</button>
              <button onClick={isAdding ? confirmAdd : confirmRename} className="flex-1 py-4 font-bold text-white bg-primary rounded-2xl shadow-lg">确定</button>
            </div>
          </div>
        </div>
      )}

      <Header title="我的图库" />

      <main className="px-6 space-y-8 mt-4">
        {pinnedFolder && (
          <section>
            <h2 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-4 px-1">最近打开</h2>
            <div
              onClick={() => handleFolderClick(pinnedFolder)}
              onContextMenu={e => { e.preventDefault(); setActiveMenuFolderId(pinnedFolder.id); }}
              onTouchStart={() => startLongPress(pinnedFolder.id)}
              onTouchEnd={cancelLongPress}
              onMouseDown={() => startLongPress(pinnedFolder.id)}
              onMouseUp={cancelLongPress}
              className="relative overflow-hidden rounded-3xl bg-white border border-black/5 shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
            >
              <div className="flex h-32">
                <div className="flex-1 p-5 flex flex-col justify-between items-start">
                  <h3 className="text-lg font-bold leading-tight truncate w-full">{pinnedFolder.name}</h3>
                  <Link to={`/folder/${pinnedFolder.id}/practice`} className="flex items-center gap-2 text-primary px- bg-primary/104 py-2 rounded-xl font-bold text-xs">
                    <span className="material-symbols-outlined text-sm filled">play_arrow</span>
                    继续练习
                  </Link>
                </div>
                <div className="w-1/3 bg-cover bg-center" style={{ backgroundImage: `url(${getFolderCoverUrl(pinnedFolder)})` }} />
              </div>
            </div>
          </section>
        )}

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase px-1">所有图库</h2>
            <div className="flex gap-4">
              <button onClick={() => setViewMode('grid')} className={`material-symbols-outlined text-lg ${viewMode === 'grid' ? 'text-primary' : 'text-slate-300'}`}>grid_view</button>
              <button onClick={() => setViewMode('list')} className={`material-symbols-outlined text-lg ${viewMode === 'list' ? 'text-primary' : 'text-slate-300'}`}>format_list_bulleted</button>
            </div>
          </div>

          <div className={viewMode === 'grid' ? "grid grid-cols-2 gap-4" : "space-y-4"}>
            {folders.map((folder) => (
              <div
                key={folder.id}
                onClick={() => handleFolderClick(folder)}
                onContextMenu={e => { e.preventDefault(); setActiveMenuFolderId(folder.id); }}
                onTouchStart={() => startLongPress(folder.id)}
                onTouchEnd={cancelLongPress}
                onMouseDown={() => startLongPress(folder.id)}
                onMouseUp={cancelLongPress}
                className={`group cursor-pointer select-none transition-all ${viewMode === 'list' ? 'flex items-center gap-4 bg-white p-3 rounded-2xl border border-black/5 shadow-sm' : 'flex flex-col'}`}
              >
                <div className={`relative overflow-hidden rounded-2xl bg-slate-100 shadow-sm ${viewMode === 'grid' ? 'aspect-square mb-2' : 'size-16 flex-shrink-0'}`}>
                  <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${getFolderCoverUrl(folder)})` }} />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-text-main truncate">{folder.name}</h4>
                  <p className="text-[10px] text-slate-400">{getTotalImageCount(folder)} 参考</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <button onClick={() => setIsAdding(true)} className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30 active:scale-90 transition-transform z-30">
        <span className="material-symbols-outlined text-3xl">add</span>
      </button>

      {/* 封面选择弹窗 */}
      {showCoverSelector && selectedFolder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-6">
          <div className="w-full max-w-2xl max-h-[80vh] bg-white rounded-[2rem] shadow-2xl animate-in zoom-in duration-200 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black">选择封面</h3>
                <p className="text-sm text-slate-400 mt-1">{selectedFolder.name}</p>
              </div>
              <button onClick={() => setShowCoverSelector(null)} className="size-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {coverImages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="size-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-4xl text-slate-300">image</span>
                  </div>
                  <p className="text-slate-400 font-bold">此图库暂无图片</p>
                  <p className="text-sm text-slate-300 mt-2">请先导入图片后再设置封面</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {coverImages.map((image) => (
                    <button
                      key={image.id}
                      onClick={() => {
                        const updatedFolder = { 
                          ...selectedFolder, 
                          coverImage: image.url,
                          coverId: image.id,
                          updatedAt: new Date()
                        };
                        updateFolder(updatedFolder);
                        // 立即更新封面 URL，避免闪烁
                        setCoverUrls(prev => ({
                          ...prev,
                          [selectedFolder.id]: image.url
                        }));
                        setShowCoverSelector(null);
                      }}
                      className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 hover:ring-4 hover:ring-primary/50 transition-all active:scale-95 group"
                    >
                      <img 
                        src={image.url} 
                        alt={image.title || ''} 
                        className="w-full h-full object-cover"
                      />
                      {selectedFolder.coverImage === image.url && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <div className="size-12 rounded-full bg-primary flex items-center justify-center shadow-lg">
                            <Check className="w-7 h-7 text-white" />
                          </div>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
