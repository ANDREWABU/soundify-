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

function Guard({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div style={{ height: '100dvh', background: '#000' }} />;
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
