import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './pages/landingPage';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Lesson from './pages/Lesson';
import Dashboard from './pages/Dashboard';
import Favorites from './pages/Favorites';
import Community from './pages/Community';
import Profile from './pages/Profile';
import Play from './pages/Play';
import { Toaster } from 'react-hot-toast';
import './App.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();

  if (loading) return <div className="min-h-screen bg-bg text-text flex items-center justify-center">Loading...</div>;

  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
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
            path="/favorites"
            element={
              <ProtectedRoute>
                <Favorites />
              </ProtectedRoute>
            }
          />
          <Route
            path="/community"
            element={
              <ProtectedRoute>
                <Community />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lesson/:scenarioId"
            element={
              <ProtectedRoute>
                <Lesson />
              </ProtectedRoute>
            }
          />
          <Route
            path="/play/:scenarioId"
            element={
              <ProtectedRoute>
                <Play />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
