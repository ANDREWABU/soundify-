import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.username.includes(' ')) { setError('Username cannot contain spaces.'); return; }
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await signup(form.email, form.password, form.name, form.username);
      setLeaving(true);
      setTimeout(() => navigate('/'), 420);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{ ...s.page, ...(leaving ? s.pageLeaving : {}) }}>
      <div style={s.gradient} />
      <div style={s.content}>
        <div style={s.logoWrap}>
          <div style={s.logo}>Soundify</div>
          <div style={s.logoSub}>Create your account</div>
        </div>

        <form onSubmit={submit} style={s.form}>
          <Field placeholder="Full Name"        value={form.name}     onChange={set('name')}     type="text"     autoComplete="name" />
          <Field placeholder="Username"          value={form.username} onChange={set('username')} type="text"     autoComplete="username" />
          <Field placeholder="Email"             value={form.email}    onChange={set('email')}    type="email"    autoComplete="email" />
          <PasswordField placeholder="Password"         value={form.password} onChange={set('password')} show={showPw} onToggle={() => setShowPw(!showPw)} autoComplete="new-password" />
          <PasswordField placeholder="Verify Password"  value={form.confirm}  onChange={set('confirm')}  show={showPw} onToggle={() => setShowPw(!showPw)} autoComplete="new-password" />

          {error && <div style={s.error}>{error}</div>}

          <button type="submit" style={s.btn} disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={s.switch}>
          Already have an account?{' '}
          <Link to="/login" style={s.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

function Field({ placeholder, value, onChange, type, autoComplete }) {
  return (
    <input
      style={s.input}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required
      autoComplete={autoComplete}
    />
  );
}

function PasswordField({ placeholder, value, onChange, show, onToggle, autoComplete }) {
  return (
    <div style={s.pwWrap}>
      <input
        style={{ ...s.input, paddingRight: 48 }}
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required
        minLength={6}
        autoComplete={autoComplete}
      />
      <button type="button" style={s.eyeBtn} onClick={onToggle}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round">
          {show
            ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
            : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
          }
        </svg>
      </button>
    </div>
  );
}

const GREEN = '#1DB954';

const s = {
  page: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    minHeight: '100dvh', position: 'relative',
    padding: '32px 28px', background: '#000', overflowY: 'auto',
    transition: 'transform 0.42s cubic-bezier(0.4,0,0.2,1), opacity 0.42s ease',
    opacity: 1, transform: 'translateY(0)',
  },
  pageLeaving: { opacity: 0, transform: 'translateY(-40px)' },
  gradient: {
    position: 'fixed', inset: 0, pointerEvents: 'none',
    background: 'radial-gradient(ellipse at 50% 35%, rgba(29,185,84,0.1) 0%, transparent 70%)',
  },
  content: {
    position: 'relative', zIndex: 1,
    width: '100%', maxWidth: 360,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
  },
  logoWrap: { marginBottom: 16, textAlign: 'center' },
  logo: { fontSize: 38, fontWeight: 900, color: GREEN, letterSpacing: 1 },
  logoSub: { fontSize: 13, color: '#888', marginTop: 4 },
  form: { display: 'flex', flexDirection: 'column', gap: 12, width: '100%' },
  input: {
    background: '#1a1a1a',
    border: '1.5px solid #282828',
    borderRadius: 12, padding: '14px 16px',
    color: '#fff', fontSize: 15, fontFamily: 'inherit',
    outline: 'none', width: '100%',
    WebkitTextFillColor: '#fff',
    WebkitBoxShadow: '0 0 0px 1000px #1a1a1a inset',
  },
  pwWrap: { position: 'relative', width: '100%' },
  eyeBtn: {
    position: 'absolute', right: 14, top: '50%',
    transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex',
  },
  error: { color: '#ff4d4d', fontSize: 13, textAlign: 'center' },
  btn: {
    background: GREEN, color: '#000', fontWeight: 800,
    fontSize: 16, padding: '15px', borderRadius: 30,
    cursor: 'pointer', border: 'none', fontFamily: 'inherit', marginTop: 4,
  },
  switch: { color: '#888', fontSize: 14, marginTop: 12 },
  link: { color: GREEN, fontWeight: 700, textDecoration: 'none' },
};
