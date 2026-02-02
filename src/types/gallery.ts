/**
 * 图库相关类型定义
 * 借鉴Android架构模式
 */

// 图库模式（类似Android密封类）
export type GalleryMode = 
  | { type: 'browse' }
  | { type: 'selection'; selectedIds: Set<string> };

// 筛选类型
export enum FilterType {
  ALL = 'all',
  INCOMPLETE = 'incomplete',
  COMPLETED = 'completed'
}

// 批量操作类型
export enum BatchAction {
  MARK_COMPLETE = 'mark_complete',
  MARK_INCOMPLETE = 'mark_incomplete',
  DELETE = 'delete',
  ADD_TAG = 'add_tag'
}

// 视图模式
export type ViewMode = 'grid' | 'list';

// 操作结果
export interface OperationResult {
  success: boolean;
  message?: string;
  action?: string;
  data?: any;
}

// 图片交互结果
export interface ImageClickResult {
  action: 'openLightbox' | 'toggleSelection';
  index?: number;
}
