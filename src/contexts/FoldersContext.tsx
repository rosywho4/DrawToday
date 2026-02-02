import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Folder, ImageReference } from '../types';
import { MOCK_FOLDERS } from '../data/mockData';

interface FoldersContextType {
  folders: Folder[];
  addFolder: (name: string) => void;
  updateFolder: (folder: Folder) => void;
  deleteFolder: (id: string) => void;
  copyFolder: (id: string) => void;
  renameFolder: (id: string, newName: string) => void;
  markImageComplete: (folderId: string, imageId: string) => void;
  addImagesToFolder: (folderId: string, images: { id: string; url: string; title?: string }[]) => void;
}

const STORAGE_KEY = 'drawtoday_folders_v1';

const FoldersContext = createContext<FoldersContextType | undefined>(undefined);

export function FoldersProvider({ children }: { children: ReactNode }) {
  const [folders, setFolders] = useState<Folder[]>(() => {
    if (typeof window === 'undefined') return MOCK_FOLDERS;
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : MOCK_FOLDERS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(folders));
  }, [folders]);

  const addFolder = (name: string) => {
    const newFolder: Folder = {
      id: Date.now().toString(),
      name,
      createdAt: new Date(),
      updatedAt: new Date(),
      imageIds: [],
      practiceCount: 0,
      completedCount: 0,
      references: [],
      lastOpened: new Date(),
      coverImage: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=400&auto=format&fit=crop'
    };
    setFolders(prev => [newFolder, ...prev]);
  };

  const updateFolder = (folder: Folder) => {
    setFolders(prev => prev.map(f => f.id === folder.id ? folder : f));
  };

  const deleteFolder = (id: string) => {
    setFolders(prev => prev.filter(f => f.id !== id));
  };

  const copyFolder = (id: string) => {
    const target = folders.find(f => f.id === id);
    if (!target) return;
    const copied: Folder = {
      ...target,
      id: Date.now().toString(),
      name: `${target.name} (副本)`,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastOpened: new Date()
    };
    setFolders(prev => [copied, ...prev]);
  };

  const renameFolder = (id: string, newName: string) => {
    setFolders(prev => prev.map(f => f.id === id ? { ...f, name: newName } : f));
  };

  const markImageComplete = (folderId: string, imageId: string) => {
    setFolders(prev => prev.map(f => {
      if (f.id === folderId) {
        return {
          ...f,
          references: f.references.map(img =>
            img.id === imageId ? { ...img, isCompleted: true, completed: true } : img
          ),
          completedCount: f.completedCount + 1
        };
      }
      return f;
    }));
  };

  const addImagesToFolder = (folderId: string, images: { id: string; url: string; title?: string }[]) => {
    setFolders(prev => prev.map(f => {
      if (f.id === folderId) {
        const newCoverImage = f.references.length === 0 && images.length > 0 ? images[0].url : f.coverImage;
        const newReferences: ImageReference[] = images.map(img => ({
          id: img.id,
          folderId: folderId,
          fileName: img.title || 'unknown.jpg',
          fileType: 'image/jpeg',
          fileSize: 0,
          addedAt: new Date(),
          tags: [],
          isCompleted: false,
          completed: false,
          url: img.url,
          title: img.title,
          completionTime: 0,
          notes: undefined
        }));
        return {
          ...f,
          references: [...f.references, ...newReferences],
          coverImage: newCoverImage
        };
      }
      return f;
    }));
  };

  return (
    <FoldersContext.Provider value={{
      folders,
      addFolder,
      updateFolder,
      deleteFolder,
      copyFolder,
      renameFolder,
      markImageComplete,
      addImagesToFolder
    }}>
      {children}
    </FoldersContext.Provider>
  );
}

export function useFolders() {
  const context = useContext(FoldersContext);
  if (context === undefined) {
    throw new Error('useFolders must be used within a FoldersProvider');
  }
  return context;
}
