import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FoldersProvider, useFolders } from './contexts/FoldersContext';
import { SessionProvider } from './contexts/SessionContext';
import { OnboardingProvider, useOnboarding } from './contexts/OnboardingContext';
import OnboardingGuide from './components/features/OnboardingGuide';
import BottomNav from './components/layout/BottomNav';
import HomePage from './pages/HomePage';
import FolderDetailPage from './pages/FolderDetailPage';
import PracticeConfigPage from './pages/PracticeConfigPage';
import PracticeSessionPage from './pages/PracticeSessionPage';
import StatisticsPage from './pages/StatisticsPage';
import SettingsPage from './pages/SettingsPage';
import { Page } from './types';

function AppContent() {
  const { showOnboarding, completeOnboarding } = useOnboarding();
  const { folders } = useFolders();

  const showBottomNav = folders.length > 0;

  return (
    <div className="max-w-md mx-auto min-h-screen bg-bg-serenity relative">
      {showOnboarding && <OnboardingGuide onComplete={completeOnboarding} />}
      <Routes>
        <Route path="/" element={<><HomePage />{showBottomNav && <BottomNav currentPage={Page.HOME} />}</>} />
        <Route path="/folder/:folderId" element={<><FolderDetailPage /></>} />
        <Route path="/folder/:folderId/practice" element={<><PracticeConfigPage /></>} />
        <Route path="/folder/:folderId/session" element={<><PracticeSessionPage /></>} />
        <Route path="/statistics" element={<><StatisticsPage /><BottomNav currentPage={Page.STATS} /></>} />
        <Route path="/settings" element={<><SettingsPage /><BottomNav currentPage={Page.SETTINGS} /></>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <FoldersProvider>
        <SessionProvider>
          <OnboardingProvider>
            <AppContent />
          </OnboardingProvider>
        </SessionProvider>
      </FoldersProvider>
    </BrowserRouter>
  );
}
