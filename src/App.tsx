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
import { SettingsPage } from '@/components/pages/SettingsPage';
import { FeaturesPage } from '@/components/pages/FeaturesPage';
import { ArtistPage } from '@/components/pages/ArtistPage';
import { AudioProvider } from '@/context/AudioContext';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import './App.css';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AudioProvider>
        <Router>
          <AppContent />
        </Router>
        <Toaster />
      </AudioProvider>
    </AuthProvider>
  );
};

const AppContent: React.FC = () => {
  return (
    <Routes>
      {/* Public routes that are always accessible */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/features" element={<FeaturesPage />} />

      {/* Protected routes are wrapped in the ProtectedRoute component */}
      <Route element={<ProtectedRoute />}>
        <Route path="/*" element={<MainAppLayout />} />
      </Route>
    </Routes>
  );
};

const MainAppLayout: React.FC = () => (
  <div className="h-screen flex flex-col bg-background">
    <Header />
    <div className="flex-1 flex overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 pb-24">
        {/* Nested routes for the authenticated part of the app */}
        <Routes>
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/artist/:artistId" element={<ArtistPage />} />
          {/* Fallback route for any other authenticated path */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
    <MusicPlayer />
  </div>
);

export default App;
