import { useLocation } from 'react-router-dom';
import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/',        label: 'Home',    icon: HomeIcon },
  { to: '/library', label: 'Library', icon: LibraryIcon },
  { to: '/search',  label: 'Search',  icon: SearchIcon },
];

export default function BottomNav() {
  const location = useLocation();

  const handleHomeClick = (e, to) => {
    if (to === '/' && location.pathname === '/') {
      e.preventDefault();
      window.dispatchEvent(new Event('soundify:home-reset'));
    }
  };

  return (
    <nav style={styles.nav}>
      {tabs.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to} to={to} end
          style={({ isActive }) => ({ ...styles.tab, color: isActive ? '#1DB954' : '#535353' })}
          onClick={(e) => handleHomeClick(e, to)}
        >
          <Icon />
          <span style={styles.label}>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function HomeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="2" /><path d="M12 2a10 10 0 0 1 10 10" /><path d="M12 6a6 6 0 0 1 6 6" /><path d="M2 12a10 10 0 0 1 10-10" /><path d="M6 12a6 6 0 0 1 6-6" />
    </svg>
  );
}

function LibraryIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

const styles = {
  nav: {
    display: 'flex', background: '#0a0a0a',
    borderTop: '1px solid #1a1a1a',
    paddingBottom: 'env(safe-area-inset-bottom)',
    flexShrink: 0,
  },
  tab: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '10px 0', gap: 3,
    textDecoration: 'none', transition: 'color 0.15s',
  },
  label: { fontSize: 10, fontWeight: 600 },
};
