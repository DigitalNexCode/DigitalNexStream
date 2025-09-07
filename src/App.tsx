import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { MusicPlayer } from '@/components/player/MusicPlayer';
import { DiscoverPage } from '@/components/pages/DiscoverPage';
import { UploadPage } from '@/components/pages/UploadPage';
import { DashboardPage } from '@/components/pages/DashboardPage';
import { AuthPage } from '@/components/pages/AuthPage';
import { LandingPage } from '@/components/pages/LandingPage';
import { AudioProvider } from '@/context/AudioContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import './App.css';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AudioProvider>
        <Router>
          <AppRoutes />
        </Router>
        <Toaster />
      </AudioProvider>
    </AuthProvider>
  );
};

const AppRoutes: React.FC = () => {
  const { session } = useAuth();

  return (
    <Routes>
      <Route path="/auth" element={!session ? <AuthPage /> : <Navigate to="/discover" />} />
      <Route path="/" element={!session ? <LandingPage /> : <Navigate to="/discover" />} />
      <Route
        path="/*"
        element={
          session ? <MainAppLayout /> : <Navigate to="/" />
        }
      />
    </Routes>
  );
};

const MainAppLayout: React.FC = () => (
  <div className="h-screen flex flex-col bg-background">
    <Header />
    <div className="flex-1 flex overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 pb-24">
        <Routes>
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="*" element={<Navigate to="/discover" />} />
        </Routes>
      </main>
    </div>
    <MusicPlayer />
  </div>
);

export default App;
