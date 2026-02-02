import React, { useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { X, Check, MoreVertical, Tag, Trash2, Edit2, Image as ImageIcon, Plus, ChevronLeft, ChevronRight, ZoomIn, RotateCw, FlipHorizontal } from 'lucide-react';
import { useFolders } from '../contexts/FoldersContext';
import { useFolderImages } from '../hooks/useFolderImages';
import { DEFAULT_TAGS, TAG_COLORS, ImageReference } from '../types';
import Header from '../components/layout/Header';

export default function FolderDetailPage() {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const { folders, updateFolder } = useFolders();
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [editingImage, setEditingImage] = useState<ImageReference | null>(null);
  const [showTagMenu, setShowTagMenu] = useState<string | null>(null);
  const [lastClickTime, setLastClickTime] = useState(0);

  const folder = folders.find(f => f.id === folderId);
  const { images, isLoading, importImages, toggleComplete, reload, removeImage } = useFolderImages(
    folderId || '',
    folder?.references || []
  );

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    await importImages(acceptedFiles as unknown as FileList, () => {
      showToast(`成功导入 ${acceptedFiles.length} 张素材`);
      // 更新folder的imageCount
      if (folder) {
        const newImageCount = (folder.imageCount || folder.references.length) + acceptedFiles.length;
        updateFolder({ ...folder, imageCount: newImageCount });
      }
    });
  }, [importImages, showToast, folder, updateFolder]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif'] },
    multiple: true
  });

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
      if (next.size === 0) {
        setIsSelectionMode(false);
      }
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleImageClick = (ref: ImageReference, idx: number) => {
    const currentTime = Date.now();
    const timeDiff = currentTime - lastClickTime;
    
    // 检测双击（500ms内双击）
    if (timeDiff < 500) {
      setLightboxIndex(idx);
      setLastClickTime(0);
      return;
    }
    
    setLastClickTime(currentTime);
    
    // 单击：标记完成
    if (!isSelectionMode) {
      toggleComplete(ref.id);
      return;
    }
    
    // 选择模式下：切换选中状态
    toggleSelect(ref.id);
  };

  const handleImageLongPress = (ref: ImageReference) => {
    setIsSelectionMode(true);
    setSelectedIds(new Set([ref.id]));
    showToast('已进入选择模式');
  };

  const handleImageContextMenu = (e: React.MouseEvent, ref: ImageReference) => {
    e.preventDefault();
    setEditingImage(ref);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === images.length) {
      setSelectedIds(new Set());
      setIsSelectionMode(false);
    } else {
      setSelectedIds(new Set(images.map(r => r.id)));
      setIsSelectionMode(true);
    }
  };

  const handleToggleComplete = () => {
    if (selectedIds.size === 0) return;
    const nextRefs = folder?.references.map(r =>
      selectedIds.has(r.id) ? { ...r, completed: !r.completed } : r
    ) || [];
    if (folder) updateFolder({ ...folder, references: nextRefs });
    setIsSelectionMode(false);
    setSelectedIds(new Set());
    showToast("状态已更新");
    reload();
  };

  const handleDeleteSelected = async () => {
    for (const id of selectedIds) {
      await removeImage(id);
      // 更新folder的imageCount
      if (folder) {
        const newImageCount = Math.max(0, (folder.imageCount || folder.references.length) - 1);
        updateFolder({ ...folder, imageCount: newImageCount });
      }
    }
    const nextRefs = folder?.references.filter(r => !selectedIds.has(r.id)) || [];
    if (folder) updateFolder({ ...folder, references: nextRefs });
    setIsSelectionMode(false);
    setSelectedIds(new Set());
    showToast("已删除选中项");
    reload();
  };

  const toggleTag = (imageId: string, tagId: string) => {
    const image = images.find(img => img.id === imageId);
    if (!image || !folder) return;
    
    const currentTags = image.tags || [];
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter(t => t !== tagId)
      : [...currentTags, tagId];
    
    const nextRefs = folder.references.map(r =>
      r.id === imageId ? { ...r, tags: newTags } : r
    );
    updateFolder({ ...folder, references: nextRefs });
    showToast(newTags.length > currentTags.length ? "标签已添加" : "标签已移除");
    reload();
  };

  const updateImageNote = (imageId: string, note: string) => {
    if (!folder) return;
    const nextRefs = folder.references.map(r =>
      r.id === imageId ? { ...r, note } : r
    );
    updateFolder({ ...folder, references: nextRefs });
    setEditingImage(null);
    showToast("备注已更新");
    reload();
  };

  if (!folder) {
    return (
      <div className="flex flex-col min-h-screen bg-bg-serenity items-center justify-center">
        <p className="text-slate-400">图库不存在</p>
        <button onClick={() => navigate('/')} className="mt-4 text-primary font-bold">返回首页</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen select-none bg-bg-serenity">
      {toast && (
        <div className="fixed top-28 left-1/2 -translate-x-1/2 z-[120] bg-black/80 text-white px-5 py-2.5 rounded-full text-xs font-black animate-in fade-in slide-in-from-top-2 text-center shadow-2xl">
          {toast}
        </div>
      )}

      <Header
        title={isSelectionMode ? `已选 ${selectedIds.size} 项` : folder.name}
        showBack
        onBack={() => isSelectionMode ? (setIsSelectionMode(false), setSelectedIds(new Set())) : navigate('/')}
        actions={!isSelectionMode && (
          <div className="flex items-center gap-3">
            <button onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} className="material-symbols-outlined text-slate-400">
              {viewMode === 'grid' ? 'format_list_bulleted' : 'grid_view'}
            </button>
            <button onClick={() => setIsSelectionMode(true)} className="material-symbols-outlined text-slate-400">checklist</button>
            <button onClick={() => setShowTagMenu(folderId || '')} className="material-symbols-outlined text-slate-400">more_vert</button>
          </div>
        )}
      />

      <main className="flex-1 p-4 pb-40">
        {isLoading && images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-slate-400 text-sm font-black">正在读取本地图库...</p>
          </div>
        ) : (
          <>
            <div
              {...getRootProps()}
              className={`
                mb-6 border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all
                ${isDragActive ? 'border-primary bg-primary/5 scale-[0.98]' : 'border-slate-200 hover:border-primary/50'}
              `}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="font-black text-text-main">
                    {isDragActive ? '释放图片' : '导入图片'}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">点击选择文件</p>
                </div>
              </div>
            </div>

            {images.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="size-24 rounded-full bg-white flex items-center justify-center shadow-sm opacity-20 mb-8">
                  <ImageIcon className="w-12 h-12 text-slate-300" />
                </div>
                <p className="text-slate-400 text-sm font-black mb-10">此图库尚无素材</p>
              </div>
            ) : (
              <>
                {isSelectionMode && images.length > 0 && (
                  <div className="mb-4 flex justify-end px-2">
                    <button onClick={handleSelectAll} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-colors ${selectedIds.size === images.length ? 'text-primary bg-primary/10' : 'text-slate-400'}`}>
                      <Check className="w-4 h-4" />
                      {selectedIds.size === images.length ? '取消全选' : '全选'}
                    </button>
                  </div>
                )}

                <div className={viewMode === 'grid' ? "grid grid-cols-3 gap-3" : "space-y-3"}>
                  {images.map((ref, idx) => (
                    <div
                      key={ref.id}
                      onClick={() => handleImageClick(ref, idx)}
                      onContextMenu={(e) => handleImageContextMenu(e, ref)}
                      onTouchStart={() => {
                        // 移动端长按检测
                        setTimeout(() => handleImageLongPress(ref), 500);
                      }}
                      className={`
                        relative overflow-hidden rounded-xl bg-white border transition-all cursor-pointer
                        ${viewMode === 'grid' ? 'aspect-square' : 'flex items-center p-2.5 gap-4'}
                        ${selectedIds.has(ref.id) ? 'ring-4 ring-primary ring-offset-2 scale-90' : 'active:scale-95'}
                      `}
                    >
                      <div className={viewMode === 'grid' ? "w-full h-full" : "size-20 rounded-lg"} style={{ backgroundImage: `url(${ref.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                      
                      {viewMode === 'list' && (
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-text-main truncate">{ref.title || `素材 #${idx + 1}`}</p>
                          {ref.tags && ref.tags.length > 0 && (
                            <div className="flex gap-1 mt-2 flex-wrap">
                              {ref.tags.slice(0, 3).map(tagId => {
                                const tag = DEFAULT_TAGS.find(t => t.id === tagId);
                                return tag ? (
                                  <span key={tagId} className="text-[10px] px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: tag.color }}>
                                    {tag.name}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <p className={`text-[10px] font-black uppercase ${ref.completed ? 'text-secondary' : 'text-slate-300'}`}>
                              {ref.completed ? '已完成' : '待练习'}
                            </p>
                          </div>
                        </div>
                      )}

                      {ref.completed && !selectedIds.has(ref.id) && (
                        <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center">
                          <Check className="w-10 h-10 text-secondary drop-shadow-lg" />
                        </div>
                      )}

                      {selectedIds.has(ref.id) && (
                        <div className="absolute top-1.5 right-1.5 bg-primary text-white rounded-full w-7 h-7 flex items-center justify-center shadow-lg animate-in zoom-in duration-200">
                          <Check className="w-4 h-4" />
                        </div>
                      )}

                      {ref.tags && ref.tags.length > 0 && viewMode === 'grid' && (
                        <div className="absolute bottom-1 left-1 right-1 flex gap-0.5 flex-wrap">
                          {ref.tags.map(tagId => {
                            const tag = DEFAULT_TAGS.find(t => t.id === tagId);
                            return tag ? (
                              <span key={tagId} className="text-[8px] px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: tag.color }}>
                                {tag.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </main>

      {isSelectionMode && (
        <div className="fixed bottom-0 inset-x-0 bg-white p-6 pb-12 rounded-t-[3rem] shadow-[0_-15px_40px_rgba(0,0,0,0.1)] z-50 flex justify-around animate-in slide-in-from-bottom duration-300">
          <button onClick={handleDeleteSelected} className="flex flex-col items-center gap-2">
            <div className="size-15 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center active:scale-90 transition-transform">
              <Trash2 className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">删除</span>
          </button>
          <button onClick={handleToggleComplete} className="flex flex-col items-center gap-2">
            <div className="size-15 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center active:scale-90 transition-transform">
              <Check className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">状态</span>
          </button>
          <button onClick={() => { setIsSelectionMode(false); setSelectedIds(new Set()); }} className="flex flex-col items-center gap-2">
            <div className="size-15 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center active:scale-90 transition-transform">
              <X className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">取消</span>
          </button>
        </div>
      )}

      {!isSelectionMode && (
        <div className="fixed bottom-28 right-6 flex flex-col items-center gap-5 z-40">
          <button onClick={() => navigate(`/folder/${folderId}/practice`)} className="size-16 rounded-full bg-primary text-white shadow-xl shadow-primary/30 flex items-center justify-center active:scale-95 transition-transform">
            <ImageIcon className="w-8 h-8" />
          </button>
        </div>
      )}

      {showTagMenu && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-6" onClick={() => setShowTagMenu(null)}>
          <div className="w-full max-w-xs bg-white rounded-[2rem] p-6 shadow-2xl animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-black">管理标签</h3>
              <button onClick={() => setShowTagMenu(null)} className="p-2 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {DEFAULT_TAGS.map(tag => {
                const image = images.find(img => img.id === showTagMenu);
                const hasTag = image?.tags?.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(showTagMenu, tag.id)}
                    className={`
                      py-2 px-3 rounded-xl text-sm font-bold transition-all
                      ${hasTag ? 'ring-2 ring-offset-2' : ''}
                    `}
                    style={{ 
                      backgroundColor: hasTag ? tag.color : tag.color + '20',
                      color: hasTag ? 'white' : tag.color,
                      outlineColor: tag.color
                    }}
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
            {images.find(img => img.id === showTagMenu)?.note !== undefined && (
              <div className="border-t border-slate-100 pt-4 mt-2">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">备注</label>
                <textarea
                  className="w-full p-3 bg-slate-50 rounded-xl text-sm resize-none"
                  rows={2}
                  placeholder="添加备注..."
                  defaultValue={images.find(img => img.id === showTagMenu)?.note || ''}
                  onBlur={(e) => updateImageNote(showTagMenu, e.target.value)}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {lightboxIndex !== null && (
        <Lightbox
          open={lightboxIndex !== null}
          index={lightboxIndex}
          close={() => setLightboxIndex(null)}
          slides={images.map(img => ({ src: img.url }))}
          on={{
            view: ({ index }) => setLightboxIndex(index),
          }}
          render={{
            slide: ({ slide }) => (
              <div className="relative w-full h-full flex items-center justify-center bg-black">
                <img 
                  src={slide.src} 
                  alt="" 
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ),
          }}
          styles={{ 
            container: { backgroundColor: 'rgba(0,0,0,0.95)' },
            slide: { display: 'flex', alignItems: 'center', justifyContent: 'center' }
          }}
        />
      )}
    </div>
  );
}
