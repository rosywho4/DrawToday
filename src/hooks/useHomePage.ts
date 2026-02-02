import React, { useState, useEffect, useRef } from 'react';
import { useFolders } from '../contexts/FoldersContext';
import { useNavigate } from 'react-router-dom';
import { Folder } from '../types';

type ViewMode = 'grid' | 'list';

interface HomePageProps {
  onNavigate?: (page: string, folder?: Folder) => void;
}

export default function useHomePage() {
  const { folders, addFolder, copyFolder, renameFolder, deleteFolder } = useFolders();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [activeMenuFolderId, setActiveMenuFolderId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [showCoverSelector, setShowCoverSelector] = useState<string | null>(null);

  const longPressTimer = useRef<number | null>(null);
  const isLongPressActive = useRef(false);

  const startLongPress = (folderId: string) => {
    isLongPressActive.current = false;
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
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
    navigate(`/folder/${folder.id}`);
  };

  const confirmAdd = () => {
    if (inputValue.trim()) {
      addFolder(inputValue.trim());
      setInputValue('');
      setIsAdding(false);
    }
  };

  const confirmRename = () => {
    if (inputValue.trim() && isRenaming) {
      renameFolder(isRenaming, inputValue.trim());
      setInputValue('');
      setIsRenaming(null);
    }
  };

  const sortedFolders = [...folders].sort(
    (a, b) => new Date(b.lastOpened).getTime() - new Date(a.lastOpened).getTime()
  );
  const pinnedFolder = sortedFolders.length > 0 ? sortedFolders[0] : null;

  return {
    folders: sortedFolders,
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
    handleCopyFolder: copyFolder,
    handleDeleteFolder: deleteFolder,
    handleSetShowDeleteConfirm: setShowDeleteConfirm,
    showCoverSelector,
    setShowCoverSelector
  };
}
