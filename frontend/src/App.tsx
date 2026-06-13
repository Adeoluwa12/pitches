import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TrendingPage from './pages/TrendingPage';
import TopicDetailPage from './pages/TopicDetailPage';
import MorningBriefPage from './pages/MorningBriefPage';
import SavedIdeasPage from './pages/SavedIdeasPage';
import NotificationsPage from './pages/NotificationsPage';
import SettingsPage from './pages/SettingsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return !isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route
        path="/"
        element={<ProtectedRoute><Layout /></ProtectedRoute>}
      >
        <Route index element={<DashboardPage />} />
        <Route path="trending" element={<TrendingPage />} />
        <Route path="topics/:id" element={<TopicDetailPage />} />
        <Route path="morning-brief" element={<MorningBriefPage />} />
        <Route path="saved" element={<SavedIdeasPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
