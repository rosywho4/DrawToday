import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { X, Check, Image as ImageIcon, Filter, Circle, Play, Plus } from 'lucide-react';
import { useGalleryManager } from '../hooks/useGalleryManager';
import { FilterType } from '../types/gallery';
import Header from '../components/layout/Header';
import ImageCard from '../components/ui/ImageCard';

/**
 * 文件夹详情页 - 重构版
 * 使用Android架构模式，业务逻辑已抽离到useGalleryManager
 */
export default function FolderDetailPage() {
  const { folderId } = useParams();
  const navigate = useNavigate();
  
  // 🎯 核心：使用统一的图库管理器
  const gallery = useGalleryManager(folderId || '');
  
  // UI状态（与业务逻辑无关）
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [toast, setToast] = useState<string | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ========== 图片导入 ==========
  
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    await gallery.importImages(acceptedFiles as unknown as FileList, () => {
      showToast(`成功导入 ${acceptedFiles.length} 张素材`);
    });
  }, [gallery, showToast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif'] },
    multiple: true
  });

  // ========== 事件处理（简化） ==========
  
  const handleImageClick = useCallback((imageId: string, index: number) => {
    const result = gallery.handleImageClick(imageId, index);
    if (result && result.action === 'openLightbox') {
      setLightboxIndex(result.index!);
    }
  }, [gallery]);

  const handleDeleteSelected = useCallback(async () => {
    await gallery.batchDelete();
    showToast(`已删除 ${gallery.selection.selectedCount} 项`);
  }, [gallery, showToast]);

  const handleMarkComplete = useCallback(async () => {
    const count = gallery.selection.selectedCount;
    await gallery.batchMarkComplete(true);
    showToast(`已标记 ${count} 项为完成`);
  }, [gallery, showToast]);

  const handleMarkIncomplete = useCallback(async () => {
    const count = gallery.selection.selectedCount;
    await gallery.batchMarkComplete(false);
    showToast(`已标记 ${count} 项为未完成`);
  }, [gallery, showToast]);

  // ========== 键盘快捷键 ==========
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape: 退出选择模式或关闭灯箱
      if (e.key === 'Escape') {
        if (lightboxIndex !== null) {
          setLightboxIndex(null);
          e.preventDefault();
        } else if (gallery.handleBackPress()) {
          e.preventDefault();
        }
      }
      
      // Ctrl/Cmd + A: 全选
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        gallery.selectAllFiltered();
        showToast('已全选');
      }
      
      // Delete: 删除选中项
      if (e.key === 'Delete' && gallery.selection.isSelectionMode) {
        e.preventDefault();
        handleDeleteSelected();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gallery, lightboxIndex, handleDeleteSelected, showToast]);

  // ========== 返回处理 ==========
  
  const handleBack = useCallback(() => {
    if (gallery.selection.isSelectionMode) {
      gallery.selection.exitSelectionMode();
    } else {
      navigate('/');
    }
  }, [gallery, navigate]);

  if (!gallery.folder) {
    return (
      <div className="flex flex-col min-h-screen bg-bg-serenity items-center justify-center">
        <p className="text-slate-400">图库不存在</p>
        <button onClick={() => navigate('/')} className="mt-4 text-primary font-bold">
          返回首页
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen select-none bg-bg-serenity">
      {/* Toast通知 */}
      {toast && (
        <div className="fixed top-28 left-1/2 -translate-x-1/2 z-[120] bg-black/80 text-white px-5 py-2.5 rounded-full text-xs font-black animate-in fade-in slide-in-from-top-2 text-center shadow-2xl">
          {toast}
        </div>
      )}

      {/* Header */}
      <Header
        title={
          gallery.selection.isSelectionMode
            ? `已选 ${gallery.selection.selectedCount} 项`
            : gallery.folder.name
        }
        showBack
        onBack={handleBack}
        actions={
          !gallery.selection.isSelectionMode && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="material-symbols-outlined text-slate-400 hover:text-slate-600"
                title="切换视图"
              >
                {viewMode === 'grid' ? 'format_list_bulleted' : 'grid_view'}
              </button>
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className="material-symbols-outlined text-slate-400 hover:text-slate-600"
                title="筛选"
              >
                <Filter className="w-5 h-5" />
              </button>
              <button
                onClick={() => gallery.selection.enterSelectionMode()}
                className="material-symbols-outlined text-slate-400 hover:text-slate-600"
                title="选择"
              >
                checklist
              </button>
            </div>
          )
        }
      />

      {/* 筛选菜单 */}
      {showFilterMenu && !gallery.selection.isSelectionMode && (
        <div className="bg-white border-b shadow-sm px-4 py-3">
          <div className="flex gap-2">
            {Object.values(FilterType).map(type => (
              <button
                key={type}
                onClick={() => {
                  gallery.setFilterType(type);
                  setShowFilterMenu(false);
                }}
                className={`
                  px-4 py-2 rounded-xl text-sm font-bold transition-all
                  ${gallery.filterType === type 
                    ? 'bg-primary text-white shadow-md' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}
                `}
              >
                {type === FilterType.ALL && '全部'}
                {type === FilterType.INCOMPLETE && '未完成'}
                {type === FilterType.COMPLETED && '已完成'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 主内容区 */}
      <main className="flex-1 p-4 pb-40">
        {gallery.isLoading && gallery.images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-slate-400 text-sm font-black">正在读取本地图库...</p>
          </div>
        ) : (
          <>
            {/* 导入区域 */}
            <div
              {...getRootProps()}
              className={`
                mb-6 border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all
                ${isDragActive 
                  ? 'border-primary bg-primary/5 scale-[0.98]' 
                  : 'border-slate-200 hover:border-primary/50'}
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
                  <p className="text-sm text-slate-400 mt-1">点击选择或拖拽文件</p>
                </div>
              </div>
            </div>

            {/* 图片列表 */}
            {gallery.images.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="size-24 rounded-full bg-white flex items-center justify-center shadow-sm opacity-20 mb-8">
                  <ImageIcon className="w-12 h-12 text-slate-300" />
                </div>
                <p className="text-slate-400 text-sm font-black mb-2">
                  {gallery.filterType === FilterType.ALL 
                    ? '此图库尚无素材' 
                    : gallery.filterType === FilterType.COMPLETED
                    ? '暂无已完成的素材'
                    : '暂无未完成的素材'}
                </p>
                {gallery.filterType !== FilterType.ALL && (
                  <button
                    onClick={() => gallery.setFilterType(FilterType.ALL)}
                    className="mt-4 text-primary font-bold hover:underline"
                  >
                    查看全部
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* 选择模式工具栏 */}
                {gallery.selection.isSelectionMode && (
                  <div className="mb-4 flex justify-between items-center px-2">
                    <button
                      onClick={gallery.selectAllFiltered}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-colors text-primary hover:bg-primary/10"
                    >
                      <Check className="w-4 h-4" />
                      {gallery.selection.selectedCount === gallery.images.length ? '取消全选' : '全选'}
                    </button>
                    <span className="text-sm text-slate-500">
                      共 {gallery.images.length} 项
                    </span>
                  </div>
                )}

                {/* 图片网格/列表 */}
                <div className={viewMode === 'grid' ? 'grid grid-cols-3 gap-3' : 'space-y-3'}>
                  {gallery.images.map((img, idx) => (
                    <ImageCard
                      key={img.id}
                      image={img}
                      index={idx}
                      isSelected={gallery.selection.isSelected(img.id)}
                      isSelectionMode={gallery.selection.isSelectionMode}
                      viewMode={viewMode}
                      onClick={() => handleImageClick(img.id, idx)}
                      onLongPress={() => gallery.handleImageLongPress(img.id)}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </main>

      {/* 选择模式底部操作栏 */}
      {gallery.selection.isSelectionMode && (
        <div className="fixed bottom-0 inset-x-0 bg-white p-6 pb-12 rounded-t-[3rem] shadow-[0_-15px_40px_rgba(0,0,0,0.1)] z-50 animate-in slide-in-from-bottom duration-300">
          <div className="flex justify-around max-w-md mx-auto">
            <button
              onClick={handleDeleteSelected}
              className="flex flex-col items-center gap-2"
              disabled={gallery.selection.selectedCount === 0}
            >
              <div className="size-15 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center active:scale-90 transition-transform disabled:opacity-50">
                <X className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                删除
              </span>
            </button>
            
            <button
              onClick={handleMarkComplete}
              className="flex flex-col items-center gap-2"
              disabled={gallery.selection.selectedCount === 0}
            >
              <div className="size-15 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center active:scale-90 transition-transform disabled:opacity-50">
                <Check className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                已完成
              </span>
            </button>
            
            <button
              onClick={handleMarkIncomplete}
              className="flex flex-col items-center gap-2"
              disabled={gallery.selection.selectedCount === 0}
            >
              <div className="size-15 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center active:scale-90 transition-transform disabled:opacity-50">
                <Circle className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                未完成
              </span>
            </button>
            
            <button
              onClick={() => gallery.selection.exitSelectionMode()}
              className="flex flex-col items-center gap-2"
            >
              <div className="size-15 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center active:scale-90 transition-transform">
                <X className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                取消
              </span>
            </button>
          </div>
        </div>
      )}

      {/* 浮动操作按钮（浏览模式） */}
      {!gallery.selection.isSelectionMode && gallery.images.length > 0 && (
        <div className="fixed bottom-28 right-6 flex flex-col items-center gap-4 z-40">
          {/* 导入图片按钮 */}
          <button
            onClick={() => document.querySelector('input[type="file"]')?.click()}
            className="size-16 rounded-full bg-white text-primary shadow-lg shadow-black/10 flex items-center justify-center active:scale-95 transition-transform border-2 border-primary/20 hover:border-primary/40"
            title="导入图片"
          >
            <Plus className="w-8 h-8" />
          </button>
          
          {/* 开始练习按钮 */}
          <button
            onClick={() => navigate(`/folder/${folderId}/practice`)}
            className="size-16 rounded-full bg-primary text-white shadow-xl shadow-primary/30 flex items-center justify-center active:scale-95 transition-transform"
            title="开始练习"
          >
            <Play className="w-8 h-8" />
          </button>
        </div>
      )}

      {/* 灯箱 */}
      {lightboxIndex !== null && (
        <Lightbox
          open={lightboxIndex !== null}
          index={lightboxIndex}
          close={() => setLightboxIndex(null)}
          slides={gallery.images.map(img => ({ src: img.url }))}
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
