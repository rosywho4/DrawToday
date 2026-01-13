
import React, { useState, useEffect } from 'react';
import { Page, Folder, PracticeSession as SessionParams } from './types';
import Home from './pages/Home';
import FolderDetail from './pages/FolderDetail';
import PracticeConfig from './pages/PracticeConfig';
import PracticeSession from './pages/PracticeSession';
import Statistics from './pages/Statistics';
import Settings from './pages/Settings';
import BottomNav from './components/BottomNav';
import { MOCK_FOLDERS } from './constants';

const STORAGE_KEY = 'sketch_serenity_folders_v2';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.HOME);
  const [folders, setFolders] = useState<Folder[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : MOCK_FOLDERS;
  });
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<SessionParams | null>(null);

  // Persistence logic - Sync state to storage whenever folders change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(folders));
  }, [folders]);

  const activeFolder = folders.find(f => f.id === activeFolderId) || null;

  const handleNavigate = (page: Page, folder?: Folder) => {
    if (folder) setActiveFolderId(folder.id);
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleUpdateFolder = (updatedFolder: Folder) => {
    setFolders(prev => prev.map(f => f.id === updatedFolder.id ? updatedFolder : f));
  };

  const handleMarkImageComplete = (folderId: string, imageId: string) => {
    setFolders(prev => prev.map(f => {
      if (f.id === folderId) {
        return {
          ...f,
          references: f.references.map(img => 
            img.id === imageId ? { ...img, completed: true } : img
          )
        };
      }
      return f;
    }));
  };

  const handleAddFolder = (name: string) => {
    const newFolder: Folder = {
      id: Date.now().toString(),
      name,
      lastUpdated: '刚刚',
      coverImage: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=400&auto=format&fit=crop',
      references: []
    };
    setFolders(prev => [newFolder, ...prev]);
  };

  const handleCopyFolder = (folderId: string) => {
    const target = folders.find(f => f.id === folderId);
    if (!target) return;
    const copied: Folder = {
      ...target,
      id: Date.now().toString(),
      name: `${target.name} (副本)`,
      lastUpdated: '刚刚'
    };
    setFolders(prev => [copied, ...prev]);
  };

  const handleRenameFolder = (folderId: string, newName: string) => {
    setFolders(prev => prev.map(f => f.id === folderId ? { ...f, name: newName } : f));
  };

  const handleDeleteFolder = (folderId: string) => {
    setFolders(prev => prev.filter(f => f.id !== folderId));
    if (activeFolderId === folderId) {
      setActiveFolderId(null);
    }
  };

  const startSession = (session: SessionParams) => {
    setActiveSession(session);
    setCurrentPage(Page.PRACTICE_SESSION);
  };

  const renderPage = () => {
    const commonProps = {
      folders,
      onNavigate: handleNavigate,
      onAddFolder: handleAddFolder,
      onCopyFolder: handleCopyFolder,
      onRenameFolder: handleRenameFolder,
      onDeleteFolder: handleDeleteFolder
    };

    switch (currentPage) {
      case Page.HOME:
        return <Home {...commonProps} />;
      case Page.FOLDER_DETAIL:
        return activeFolder ? (
          <FolderDetail 
            folder={activeFolder} 
            onNavigate={handleNavigate} 
            onUpdateFolder={handleUpdateFolder}
          />
        ) : <Home {...commonProps} />;
      case Page.PRACTICE_CONFIG:
        return activeFolder ? (
          <PracticeConfig 
            folder={activeFolder} 
            onStart={startSession} 
            onBack={() => setCurrentPage(Page.FOLDER_DETAIL)} 
          />
        ) : <Home {...commonProps} />;
      case Page.PRACTICE_SESSION:
        return activeFolder && activeSession ? (
          <PracticeSession 
            folder={activeFolder} 
            session={activeSession} 
            onMarkComplete={(imageId) => handleMarkImageComplete(activeFolder.id, imageId)}
            onFinish={() => setCurrentPage(Page.STATS)}
            onQuit={() => setCurrentPage(Page.PRACTICE_CONFIG)}
          />
        ) : <Home {...commonProps} />;
      case Page.STATS:
        return <Statistics />;
      case Page.SETTINGS:
        return <Settings />;
      default:
        return <Home {...commonProps} />;
    }
  };

  const showBottomNav = [Page.HOME, Page.STATS, Page.SETTINGS, Page.PRACTICE].includes(currentPage);

  return (
    <div className="max-w-md mx-auto min-h-screen bg-bg-serenity relative">
      {renderPage()}
      {showBottomNav && (
        <BottomNav currentPage={currentPage} onNavigate={handleNavigate} />
      )}
    </div>
  );
};

export default App;
