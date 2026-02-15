import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Layout } from './components/Layout';
import { ToastContainer } from './components/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Dashboard } from './pages/Dashboard';
import { LoginPage } from './pages/LoginPage';
import { CalendarPage } from './pages/CalendarPage';
import { TeamPage } from './pages/TeamPage';
import { SettingsPage } from './pages/SettingsPage';
import { DispatchPage } from './pages/DispatchPage';
import { useStore } from './store/useStore';
import { Loader2 } from 'lucide-react';
import { LandingPage } from './pages/LandingPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { TermsPage } from './pages/TermsPage';
import { AdMob } from '@capacitor-community/admob';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, _hasHydrated } = useStore();
  if (!_hasHydrated) return (
    <div className="h-screen flex items-center justify-center bg-[var(--bg-primary)]">
      <Loader2 size={32} className="animate-spin text-violet-400" />
    </div>
  );
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

import { CommandMenu } from './components/CommandMenu';
import { OnboardingTour } from './components/OnboardingTour';
import api from './lib/api';

// ... imports

function App() {
  const { theme, isAuthenticated } = useStore();

  // Sync theme to DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Register Service Worker for Push
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const registerSW = async () => {
        try {
          const register = await navigator.serviceWorker.register('/sw.js');
          console.log('SW Registered');

          // Request permission
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            const subscription = await register.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: 'BJmCsWmcExysXP0fCDSFO4zpqr_BN3HrcGpIU8OPU5LNqzugsuCDGFbnHmBHdlJpy9meXDsykhvR7QabwNoCXbs' // Public Key
            });

            // Send to backend
            await api.post('/notifications/subscribe', subscription);
            console.log('Push Subscribed');
          }
        } catch (e) {
          console.error('SW Error:', e);
        }
      };
      registerSW();
    }
  }, []);

  // Initialize AdMob
  useEffect(() => {
    const initAdMob = async () => {
      try {
        await AdMob.initialize({
          testingDevices: ['2077ef9a63d2b398840261c8221a0c9b'],
          initializeForTesting: true,
        });
        console.log('AdMob Initialized');
      } catch (e) {
        console.error('AdMob Init Failed:', e);
      }
    };
    initAdMob();
  }, []);

  return (
    <ErrorBoundary>
      <CommandMenu />
      <OnboardingTour />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />
        } />
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
        } />
        <Route path="/terms" element={<TermsPage />} />

        {/* Admin Route */}
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        {/* Protected Dashboard Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
          <Route path="calendar" element={<ErrorBoundary><CalendarPage /></ErrorBoundary>} />
          <Route path="team" element={<ErrorBoundary><TeamPage /></ErrorBoundary>} />
          <Route path="settings" element={<ErrorBoundary><SettingsPage /></ErrorBoundary>} />
          <Route path="dispatch" element={<ErrorBoundary><DispatchPage /></ErrorBoundary>} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer />
    </ErrorBoundary>
  );
}

export default App;
