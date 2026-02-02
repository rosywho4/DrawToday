# DrawToday 重构方案 - 借鉴Android架构模式

## 📋 当前问题分析

### 1. **状态管理分散**
```typescript
// ❌ 当前：多个useState分散管理
const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
const [isSelectionMode, setIsSelectionMode] = useState(false);
const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
```

### 2. **业务逻辑混杂在组件中**
- 选择逻辑、完成状态切换、批量操作都在FolderDetailPage中
- 组件文件过大（500+ 行）
- 难以测试和复用

### 3. **缺少统一的操作接口**
- IndexedDB操作分散
- 没有批量更新支持
- 状态同步复杂

---

## 🎯 重构目标

### 参考Android架构实现：
1. **状态密封类** → TypeScript Union Types
2. **SelectionManager** → 自定义Hook
3. **Repository模式** → 统一数据访问层
4. **ViewModel逻辑** → 业务逻辑Hook
5. **批量操作支持** → 优化IndexedDB

---

## 🏗️ 新架构设计

### 第一层：类型定义（types/gallery.ts）

```typescript
// 1. 图库状态（类似Android密封类）
export type GalleryMode = 
  | { type: 'browse' }
  | { type: 'selection'; selectedIds: Set<string> };

// 2. 筛选类型
export enum FilterType {
  ALL = 'all',
  INCOMPLETE = 'incomplete',
  COMPLETED = 'completed'
}

// 3. 批量操作类型
export enum BatchAction {
  MARK_COMPLETE = 'mark_complete',
  MARK_INCOMPLETE = 'mark_incomplete',
  DELETE = 'delete',
  ADD_TAG = 'add_tag'
}

// 4. 图片状态增强
export interface ImageReference {
  id: string;
  url: string;
  completed: boolean;
  completedAt?: Date;
  tags: string[];
  title?: string;
  folderId: string;
  // ... 其他属性
}
```

---

### 第二层：选择管理器（hooks/useSelectionManager.ts）

```typescript
/**
 * 选择管理器 - 负责选择状态的增删改查
 * 类似Android的SelectionManager
 */
export function useSelectionManager() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<GalleryMode>({ type: 'browse' });

  // 切换单个项的选择状态
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // 全选
  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  // 清空选择
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // 进入选择模式（可选：默认选中某项）
  const enterSelectionMode = useCallback((defaultId?: string) => {
    if (defaultId) {
      setSelectedIds(new Set([defaultId]));
    }
    setMode({ type: 'selection', selectedIds });
  }, [selectedIds]);

  // 退出选择模式
  const exitSelectionMode = useCallback(() => {
    clearSelection();
    setMode({ type: 'browse' });
  }, [clearSelection]);

  // 自动检测：如果没有选中项，自动退出选择模式
  useEffect(() => {
    if (mode.type === 'selection' && selectedIds.size === 0) {
      setMode({ type: 'browse' });
    }
  }, [selectedIds.size, mode.type]);

  return {
    // 状态
    mode,
    selectedIds,
    isSelectionMode: mode.type === 'selection',
    selectedCount: selectedIds.size,
    
    // 操作
    toggleSelection,
    selectAll,
    clearSelection,
    enterSelectionMode,
    exitSelectionMode
  };
}
```

---

### 第三层：图库业务逻辑（hooks/useGalleryManager.ts）

```typescript
/**
 * 图库管理器 - 整合所有业务逻辑
 * 类似Android的ViewModel
 */
export function useGalleryManager(folderId: string) {
  const { folders, updateFolder } = useFolders();
  const folder = folders.find(f => f.id === folderId);
  
  // 选择管理
  const selection = useSelectionManager();
  
  // 图片数据
  const { images, isLoading, importImages, removeImage, reload } = useFolderImages(
    folderId,
    folder?.references || []
  );
  
  // 筛选状态
  const [filterType, setFilterType] = useState<FilterType>(FilterType.ALL);
  
  // 筛选后的图片列表
  const filteredImages = useMemo(() => {
    switch (filterType) {
      case FilterType.INCOMPLETE:
        return images.filter(img => !img.completed);
      case FilterType.COMPLETED:
        return images.filter(img => img.completed);
      default:
        return images;
    }
  }, [images, filterType]);

  // ========== 单项操作 ==========
  
  // 切换完成状态
  const toggleComplete = useCallback(async (imageId: string) => {
    const image = images.find(img => img.id === imageId);
    if (!image || !folder) return;
    
    const newCompleted = !image.completed;
    
    // 更新IndexedDB
    await updateImageMetadata(imageId, {
      completed: newCompleted,
      completedAt: newCompleted ? new Date() : undefined
    });
    
    // 更新Context
    const nextRefs = folder.references.map(r =>
      r.id === imageId ? { ...r, completed: newCompleted } : r
    );
    updateFolder({ ...folder, references: nextRefs });
    
    await reload();
  }, [images, folder, updateFolder, reload]);

  // ========== 批量操作 ==========
  
  // 批量标记完成状态
  const batchMarkComplete = useCallback(async (completed: boolean) => {
    if (selection.selectedCount === 0 || !folder) return;
    
    // 批量更新IndexedDB
    await batchUpdateImageMetadata(
      Array.from(selection.selectedIds),
      { 
        completed,
        completedAt: completed ? new Date() : undefined
      }
    );
    
    // 更新Context
    const nextRefs = folder.references.map(r =>
      selection.selectedIds.has(r.id) ? { ...r, completed } : r
    );
    updateFolder({ ...folder, references: nextRefs });
    
    // 退出选择模式
    selection.exitSelectionMode();
    await reload();
  }, [selection, folder, updateFolder, reload]);

  // 批量删除
  const batchDelete = useCallback(async () => {
    if (selection.selectedCount === 0 || !folder) return;
    
    // 批量删除IndexedDB
    await batchDeleteImages(Array.from(selection.selectedIds));
    
    // 更新Context
    const nextRefs = folder.references.filter(
      r => !selection.selectedIds.has(r.id)
    );
    updateFolder({ 
      ...folder, 
      references: nextRefs,
      imageCount: Math.max(0, (folder.imageCount || 0) - selection.selectedCount)
    });
    
    // 退出选择模式
    selection.exitSelectionMode();
    await reload();
  }, [selection, folder, updateFolder, reload]);

  // 批量添加标签
  const batchAddTag = useCallback(async (tagId: string) => {
    if (selection.selectedCount === 0 || !folder) return;
    
    const updates = Array.from(selection.selectedIds).map(async (imageId) => {
      const image = images.find(img => img.id === imageId);
      if (!image) return;
      
      const newTags = image.tags.includes(tagId)
        ? image.tags
        : [...image.tags, tagId];
      
      await updateImageMetadata(imageId, { tags: newTags });
    });
    
    await Promise.all(updates);
    
    // 更新Context
    const nextRefs = folder.references.map(r => {
      if (!selection.selectedIds.has(r.id)) return r;
      const newTags = r.tags?.includes(tagId) ? r.tags : [...(r.tags || []), tagId];
      return { ...r, tags: newTags };
    });
    updateFolder({ ...folder, references: nextRefs });
    
    await reload();
  }, [selection, images, folder, updateFolder, reload]);

  // ========== 交互处理 ==========
  
  // 处理图片点击
  const handleImageClick = useCallback((imageId: string, index: number) => {
    if (selection.isSelectionMode) {
      // 选择模式：切换选择
      selection.toggleSelection(imageId);
    } else {
      // 浏览模式：打开灯箱
      return { action: 'openLightbox', index };
    }
  }, [selection]);

  // 处理图片长按
  const handleImageLongPress = useCallback((imageId: string) => {
    selection.enterSelectionMode(imageId);
  }, [selection]);

  // 处理返回键（退出选择模式）
  const handleBackPress = useCallback(() => {
    if (selection.isSelectionMode) {
      selection.exitSelectionMode();
      return true; // 已处理
    }
    return false; // 未处理，继续默认行为
  }, [selection]);

  return {
    // 数据
    folder,
    images: filteredImages,
    allImages: images,
    isLoading,
    
    // 选择状态
    selection,
    
    // 筛选
    filterType,
    setFilterType,
    
    // 单项操作
    toggleComplete,
    importImages,
    removeImage,
    
    // 批量操作
    batchMarkComplete,
    batchDelete,
    batchAddTag,
    
    // 交互处理
    handleImageClick,
    handleImageLongPress,
    handleBackPress,
    
    // 工具
    reload
  };
}
```

---

### 第四层：数据访问层优化（utils/indexedDB.ts）

```typescript
// 添加批量操作支持

/**
 * 批量更新图片元数据
 */
export async function batchUpdateImageMetadata(
  imageIds: string[],
  metadata: Partial<ImageReference>
): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(IMAGES_STORE_NAME, 'readwrite');
  const store = tx.objectStore(IMAGES_STORE_NAME);
  
  const promises = imageIds.map(async (imageId) => {
    return new Promise((resolve, reject) => {
      const getRequest = store.get(imageId);
      getRequest.onsuccess = () => {
        const existingImage = getRequest.result;
        if (existingImage) {
          existingImage.metadata = {
            ...existingImage.metadata,
            ...metadata
          };
          const putRequest = store.put(existingImage);
          putRequest.onsuccess = () => resolve(undefined);
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve(undefined);
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  });
  
  await Promise.all(promises);
}

/**
 * 批量删除图片
 */
export async function batchDeleteImages(imageIds: string[]): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(IMAGES_STORE_NAME, 'readwrite');
  const store = tx.objectStore(IMAGES_STORE_NAME);
  
  const promises = imageIds.map(imageId => {
    return new Promise((resolve, reject) => {
      const request = store.delete(imageId);
      request.onsuccess = () => resolve(undefined);
      request.onerror = () => reject(request.error);
    });
  });
  
  await Promise.all(promises);
}

/**
 * 按筛选条件查询图片
 */
export async function getImagesByFilter(
  folderId: string,
  filter: FilterType
): Promise<IndexedDBImage[]> {
  const allImages = await getImagesByFolderId(folderId);
  
  switch (filter) {
    case FilterType.INCOMPLETE:
      return allImages.filter(img => !img.metadata?.completed);
    case FilterType.COMPLETED:
      return allImages.filter(img => img.metadata?.completed);
    default:
      return allImages;
  }
}
```

---

### 第五层：组件简化（pages/FolderDetailPage.tsx）

```typescript
export default function FolderDetailPage() {
  const { folderId } = useParams();
  const navigate = useNavigate();
  
  // 🎯 核心：使用统一的管理器
  const gallery = useGalleryManager(folderId || '');
  
  // UI状态（与业务无关）
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [toast, setToast] = useState<string | null>(null);
  
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // ========== 事件处理（简化） ==========
  
  const handleImageClick = (imageId: string, index: number) => {
    const result = gallery.handleImageClick(imageId, index);
    if (result?.action === 'openLightbox') {
      setLightboxIndex(result.index);
    }
  };

  const handleDeleteSelected = async () => {
    await gallery.batchDelete();
    showToast('已删除');
  };

  const handleMarkComplete = async () => {
    await gallery.batchMarkComplete(true);
    showToast('已标记为完成');
  };

  // ========== 返回键处理 ==========
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (gallery.handleBackPress()) {
          e.preventDefault();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gallery]);

  if (!gallery.folder) {
    return <div>图库不存在</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg-serenity">
      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}

      {/* Header */}
      <Header
        title={
          gallery.selection.isSelectionMode
            ? `已选 ${gallery.selection.selectedCount} 项`
            : gallery.folder.name
        }
        showBack
        onBack={() =>
          gallery.selection.isSelectionMode
            ? gallery.selection.exitSelectionMode()
            : navigate('/')
        }
        actions={
          !gallery.selection.isSelectionMode && (
            <div className="flex items-center gap-3">
              <button onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
                切换视图
              </button>
              <button onClick={() => gallery.selection.enterSelectionMode()}>
                选择
              </button>
            </div>
          )
        }
      />

      {/* 筛选按钮 */}
      <div className="flex gap-2 p-4">
        {Object.values(FilterType).map(type => (
          <button
            key={type}
            onClick={() => gallery.setFilterType(type)}
            className={gallery.filterType === type ? 'active' : ''}
          >
            {type === FilterType.ALL ? '全部' : type === FilterType.INCOMPLETE ? '未完成' : '已完成'}
          </button>
        ))}
      </div>

      {/* 图片网格 */}
      <main className="flex-1 p-4">
        {gallery.isLoading ? (
          <div>加载中...</div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-3 gap-3' : 'space-y-3'}>
            {gallery.images.map((img, idx) => (
              <ImageCard
                key={img.id}
                image={img}
                index={idx}
                isSelected={gallery.selection.selectedIds.has(img.id)}
                isSelectionMode={gallery.selection.isSelectionMode}
                onClick={() => handleImageClick(img.id, idx)}
                onLongPress={() => gallery.handleImageLongPress(img.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* 选择模式底部工具栏 */}
      {gallery.selection.isSelectionMode && (
        <div className="fixed bottom-0 inset-x-0 bg-white p-6 shadow-lg">
          <div className="flex justify-around">
            <button onClick={handleDeleteSelected}>删除</button>
            <button onClick={handleMarkComplete}>标记完成</button>
            <button onClick={() => gallery.batchMarkComplete(false)}>标记未完成</button>
            <button onClick={() => gallery.selection.exitSelectionMode()}>取消</button>
          </div>
        </div>
      )}

      {/* 灯箱 */}
      {lightboxIndex !== null && (
        <Lightbox
          open={true}
          index={lightboxIndex}
          close={() => setLightboxIndex(null)}
          slides={gallery.images.map(img => ({ src: img.url }))}
        />
      )}
    </div>
  );
}
```

---

## 📊 重构效果对比

### 重构前
- ❌ 500+ 行组件代码
- ❌ 10+ 个useState混在一起
- ❌ 业务逻辑难以测试
- ❌ 状态同步复杂易出错
- ❌ 无批量操作支持

### 重构后
- ✅ 组件代码 < 200 行
- ✅ 状态管理清晰（3个Hook）
- ✅ 业务逻辑可独立测试
- ✅ 状态自动同步
- ✅ 完整的批量操作

---

## 🚀 实施步骤

### Phase 1: 基础重构（1-2天）
1. ✅ 创建类型定义 `src/types/gallery.ts`
2. ✅ 实现 `useSelectionManager.ts`
3. ✅ 优化 `indexedDB.ts` 添加批量操作

### Phase 2: 业务逻辑抽离（2-3天）
4. ✅ 实现 `useGalleryManager.ts`
5. ✅ 重构 `FolderDetailPage.tsx`
6. ✅ 创建独立的 `ImageCard` 组件

### Phase 3: 功能增强（1-2天）
7. ✅ 添加筛选功能UI
8. ✅ 完善批量操作UI
9. ✅ 添加键盘快捷键支持

### Phase 4: 测试和优化（1天）
10. ✅ 单元测试
11. ✅ 性能优化
12. ✅ 文档更新

---

## 🎯 额外优化建议

### 1. 添加撤销功能
```typescript
export function useUndoManager() {
  const [history, setHistory] = useState<Action[]>([]);
  
  const execute = (action: Action) => {
    action.execute();
    setHistory([...history, action]);
  };
  
  const undo = () => {
    const lastAction = history[history.length - 1];
    lastAction?.undo();
    setHistory(history.slice(0, -1));
  };
  
  return { execute, undo, canUndo: history.length > 0 };
}
```

### 2. 添加快捷键支持
```typescript
export function useKeyboardShortcuts(gallery: GalleryManager) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'a':
            e.preventDefault();
            gallery.selection.selectAll(gallery.images.map(img => img.id));
            break;
          case 'd':
            e.preventDefault();
            gallery.batchDelete();
            break;
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gallery]);
}
```

### 3. 性能优化
- 使用虚拟滚动（react-window）处理大量图片
- 图片懒加载
- 防抖/节流处理频繁操作

---

## 📝 总结

这次重构将Android的优秀架构模式成功移植到React项目中：

| Android概念 | React实现 | 作用 |
|------------|----------|------|
| Sealed Class | Union Types | 类型安全的状态 |
| SelectionManager | useSelectionManager | 选择逻辑封装 |
| ViewModel | useGalleryManager | 业务逻辑层 |
| Repository | indexedDB.ts | 数据访问层 |
| LiveData | useState + useEffect | 响应式数据 |
| Context Action Mode | 选择模式UI | 多选操作界面 |

重构后的代码将更加**清晰**、**可测试**、**可维护**！
