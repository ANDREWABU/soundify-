import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LibraryProvider } from './context/LibraryContext';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import Library from './pages/Library';
import Search from './pages/Search';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Signup from './pages/Signup';

function Splash() {
  return (
    <div style={{ height: '100dvh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#1DB954" strokeWidth="1.5" strokeLinecap="round">
        <path d="M2 12h1M5 8v8M9 5v14M13 3v18M17 6v12M21 9v6" />
      </svg>
      <div style={{ fontSize: 32, fontWeight: 900, color: '#1DB954', letterSpacing: 1 }}>Soundify</div>
    </div>
  );
}

function Guard({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Splash />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

function Shell() {
  const location = useLocation();
  const isAuth = location.pathname === '/login' || location.pathname === '/signup';

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div style={styles.shell}>
      <div style={styles.content}>
        <Routes>
          <Route path="/login"  element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<Guard><Home /></Guard>} />
          <Route path="/library" element={<Guard><Library /></Guard>} />
          <Route path="/search" element={<Guard><Search /></Guard>} />
          <Route path="/settings" element={<Guard><Settings /></Guard>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      {!isAuth && (
        <Routes>
          <Route path="/settings" element={null} />
          <Route path="/login"    element={null} />
          <Route path="/signup"   element={null} />
          <Route path="*"         element={<BottomNav />} />
        </Routes>
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LibraryProvider>
          <Shell />
        </LibraryProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

const styles = {
  shell: {
    display: 'flex', flexDirection: 'column',
    height: '100dvh', maxWidth: 430,
    margin: '0 auto', background: '#000',
  },
  content: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
};
