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

function App() {
  const { theme } = useStore();

  // Sync theme to DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

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
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/terms" element={<TermsPage />} />

        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
          <Route path="calendar" element={<ErrorBoundary><CalendarPage /></ErrorBoundary>} />
          <Route path="team" element={<ErrorBoundary><TeamPage /></ErrorBoundary>} />
          <Route path="settings" element={<ErrorBoundary><SettingsPage /></ErrorBoundary>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer />
    </ErrorBoundary>
  );
}

export default App;
