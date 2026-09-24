import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { ProfileProvider, useProfile } from './ProfileContext';
import { I18nProvider } from './i18n/I18nContext';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import SyllabusPicker from './pages/SyllabusPicker';
import ClassRoom from './pages/ClassRoom';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { hasProfile } = useProfile();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!hasProfile) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/class/:courseId/syllabus"
        element={
          <ProtectedRoute>
            <SyllabusPicker />
          </ProtectedRoute>
        }
      />
      <Route
        path="/class/:courseId"
        element={
          <ProtectedRoute>
            <ClassRoom />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <I18nProvider>
          <AppRoutes />
        </I18nProvider>
      </ProfileProvider>
    </AuthProvider>
  );
}
