import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const { login, loginAsGuest } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      setLeaving(true);
      setTimeout(() => navigate('/'), 420);
    } catch (err) {
      setError(friendlyError(err.message));
      setLoading(false);
    }
  };

  return (
    <div style={{ ...s.page, ...(leaving ? s.pageLeaving : {}) }}>
      <div style={s.gradient} />

      <div style={s.content}>
        <div style={s.logoWrap}>
          <div style={s.logo}>Soundify</div>
          <div style={s.logoSub}>Identify any song, instantly</div>
        </div>

        <form onSubmit={submit} style={s.form}>
          <input style={s.input} type="email" placeholder="Email" value={email}
            onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />

          <div style={s.pwWrap}>
            <input
              style={{ ...s.input, marginBottom: 0, paddingRight: 48 }}
              type={showPw ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <button type="button" style={s.eyeBtn} onClick={() => setShowPw(!showPw)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round">
                {showPw
                  ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
                  : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                }
              </svg>
            </button>
          </div>

          {error && <div style={s.error}>{error}</div>}

          <button type="submit" style={s.btn} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={s.divider}><span style={s.dividerText}>or</span></div>

        <button type="button" style={s.demoBtn} onClick={() => { loginAsGuest(); navigate('/'); }}>
          Try Demo — no account needed
        </button>

        <p style={s.switch}>
          Don't have an account?{' '}
          <Link to="/signup" style={s.link}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}

function friendlyError(msg = '') {
  if (msg.includes('Invalid login')) return 'Wrong email or password.';
  if (msg.includes('rate limit')) return 'Too many attempts. Try again later.';
  return 'Something went wrong. Please try again.';
}

const YELLOW = '#1DB954';

const s = {
  page: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    height: '100dvh', position: 'relative',
    padding: '0 28px', background: '#000',
    transition: 'transform 0.42s cubic-bezier(0.4,0,0.2,1), opacity 0.42s ease',
    opacity: 1, transform: 'translateY(0)',
  },
  pageLeaving: {
    opacity: 0, transform: 'translateY(-40px)',
  },
  gradient: {
    position: 'absolute', inset: 0, pointerEvents: 'none',
    background: 'radial-gradient(ellipse at 50% 35%, rgba(29,185,84,0.12) 0%, transparent 70%)',
  },
  content: {
    position: 'relative', zIndex: 1,
    width: '100%', maxWidth: 360,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
  },
  logoWrap: { marginBottom: 20, textAlign: 'center' },
  logo: { fontSize: 38, fontWeight: 900, color: YELLOW, letterSpacing: 1 },
  logoSub: { fontSize: 13, color: '#888', marginTop: 4 },

  form: { display: 'flex', flexDirection: 'column', gap: 14, width: '100%' },
  input: {
    background: '#1a1a1a', border: '1.5px solid #282828',
    borderRadius: 12, padding: '14px 16px',
    color: '#fff', fontSize: 15, fontFamily: 'inherit',
    outline: 'none', width: '100%',
    WebkitTextFillColor: '#fff',
    WebkitBoxShadow: '0 0 0px 1000px #1a1a1a inset',
  },
  pwWrap: { position: 'relative' },
  eyeBtn: {
    position: 'absolute', right: 14, top: '50%',
    transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex',
  },
  error: { color: '#ff4d4d', fontSize: 13, textAlign: 'center' },
  btn: {
    background: YELLOW, color: '#000', fontWeight: 800,
    fontSize: 16, padding: '15px', borderRadius: 30,
    cursor: 'pointer', border: 'none', fontFamily: 'inherit', marginTop: 4,
  },
  divider: { width: '100%', display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0' },
  dividerText: { color: '#444', fontSize: 13, flexShrink: 0 },
  demoBtn: {
    width: '100%', background: 'transparent',
    border: '1.5px solid #282828', color: '#b3b3b3',
    fontWeight: 600, fontSize: 15, padding: '14px',
    borderRadius: 30, cursor: 'pointer', fontFamily: 'inherit',
  },
  switch: { color: '#888', fontSize: 14, marginTop: 12 },
  link: { color: YELLOW, fontWeight: 700, textDecoration: 'none' },
};
