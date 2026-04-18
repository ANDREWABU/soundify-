import { useNavigate } from 'react-router-dom';
import { useLibrary } from '../context/LibraryContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';

export default function Settings() {
  const navigate = useNavigate();
  const { songs, clearLibrary } = useLibrary();
  const { profile, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Delete your account? This cannot be undone.')) return;
    await clearLibrary();
    await supabase.from('profiles').delete().eq('id', (await supabase.auth.getUser()).data.user.id);
    await supabase.auth.admin?.deleteUser?.();
    await logout();
    navigate('/login');
  };

  return (
    <div style={s.page}>
      <div style={s.gradient} />

      <div style={s.header}>
        <button style={s.backBtn} onClick={() => navigate(-1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span style={s.title}>Settings</span>
      </div>

      <div style={s.scroll}>
        {/* Account */}
        {profile && (
          <>
            <div style={s.label}>Account</div>
            <div style={s.profileCard}>
              <div style={s.avatar}>{profile.name?.[0]?.toUpperCase()}</div>
              <div>
                <div style={s.profileName}>{profile.name}</div>
                <div style={s.profileUsername}>@{profile.username}</div>
              </div>
            </div>
          </>
        )}

        {/* Library */}
        <div style={s.label}>Library</div>
        <Row
          icon={<TrashIcon color="#ff4d4d" />}
          iconBg="rgba(255,77,77,0.12)"
          label={`Clear Library (${songs.length} songs)`}
          labelColor="#ff4d4d"
          onClick={() => { if (confirm(`Remove all ${songs.length} saved songs?`)) clearLibrary(); }}
        />

        <div style={s.label}>About</div>
        <a style={s.row} href="https://open.spotify.com" target="_blank" rel="noreferrer">
          <div style={s.rowIcon}><SpotifyIcon /></div>
          <span style={s.rowLabel}>Open Spotify</span>
          <Chevron />
        </a>
        <a style={s.row} href="https://dashboard.audd.io" target="_blank" rel="noreferrer">
          <div style={s.rowIcon}><KeyIcon /></div>
          <span style={s.rowLabel}>AudD Dashboard</span>
          <Chevron />
        </a>

        {/* Session */}
        <div style={s.label}>Session</div>
        <Row
          icon={<LogoutIcon />}
          label="Log Out"
          onClick={handleLogout}
        />
        <Row
          icon={<DeleteIcon />}
          iconBg="rgba(255,77,77,0.12)"
          label="Delete Account"
          labelColor="#ff4d4d"
          onClick={handleDeleteAccount}
        />
      </div>

      <div style={s.footer}>Soundify · Powered by AudD &amp; Claude AI</div>
    </div>
  );
}

function Row({ icon, iconBg, label, labelColor, onClick }) {
  return (
    <div style={s.row} onClick={onClick}>
      <div style={{ ...s.rowIcon, ...(iconBg ? { background: iconBg } : {}) }}>{icon}</div>
      <span style={{ ...s.rowLabel, ...(labelColor ? { color: labelColor } : {}) }}>{label}</span>
      <Chevron />
    </div>
  );
}

function Chevron() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#535353" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;
}
function TrashIcon({ color = '#fff' }) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
}
function LogoutIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}
function DeleteIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff4d4d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>;
}
function KeyIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>;
}
function SpotifyIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="#1DB954"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>;
}

const s = {
  page: { display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden' },
  gradient: { position: 'absolute', inset: 0, zIndex: 0, background: 'radial-gradient(ellipse at 50% 30%, #071a0f 0%, #000 65%)', pointerEvents: 'none' },
  header: { position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '16px 20px' },
  backBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' },
  title: { fontSize: 22, fontWeight: 800, color: '#fff' },
  scroll: { flex: 1, overflowY: 'auto', padding: '0 16px 24px', position: 'relative', zIndex: 1 },
  label: { fontSize: 11, fontWeight: 700, color: '#535353', letterSpacing: 1, textTransform: 'uppercase', marginTop: 20, marginBottom: 8, paddingLeft: 4 },
  profileCard: { display: 'flex', alignItems: 'center', gap: 14, background: '#1a1a1a', borderRadius: 12, padding: '14px 16px' },
  avatar: { width: 44, height: 44, borderRadius: '50%', background: '#1DB954', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#000', flexShrink: 0 },
  profileName: { fontSize: 16, fontWeight: 700, color: '#fff' },
  profileUsername: { fontSize: 13, color: '#b3b3b3', marginTop: 2 },
  row: { display: 'flex', alignItems: 'center', background: '#1a1a1a', borderRadius: 12, padding: '14px 16px', gap: 12, cursor: 'pointer', textDecoration: 'none', color: 'inherit', marginBottom: 8 },
  rowIcon: { width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowLabel: { flex: 1, fontSize: 15, color: '#fff' },
  footer: { position: 'relative', zIndex: 1, padding: '16px 24px 28px', fontSize: 12, color: '#535353', textAlign: 'center' },
};
