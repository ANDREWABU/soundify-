import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { startRecording, stopAndRecognize } from '../services/recognitionService';
import { getSongInsights } from '../services/aiService';
import { useLibrary } from '../context/LibraryContext';
import { useAuth } from '../context/AuthContext';
import SongCard from '../components/SongCard';

const STATES = { idle: 'idle', listening: 'listening', processing: 'processing', result: 'result', error: 'error' };

function getGreeting(name) {
  const h = new Date().getHours();
  const time = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : h < 21 ? 'Good evening' : 'Good night';
  const firstName = name?.split(' ')[0] || name;
  return { time, firstName };
}

export default function Home() {
  const [state, setState] = useState(STATES.idle);
  const [result, setResult] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const timerRef = useRef(null);
  const { songs, addSong } = useLibrary();
  const { profile } = useAuth();
  const navigate = useNavigate();

  const reset = () => { setResult(null); setInsights(null); setErrorMsg(''); setState(STATES.idle); };

  // Reset when Home tab is tapped while already on home
  useEffect(() => {
    const handler = () => reset();
    window.addEventListener('soundify:home-reset', handler);
    return () => window.removeEventListener('soundify:home-reset', handler);
  }, []);

  const startIdentify = async () => {
    try {
      setState(STATES.listening);
      await startRecording();

      timerRef.current = setTimeout(async () => {
        setState(STATES.processing);
        try {
          const data = await stopAndRecognize();
          console.log('[Soundify] AudD response:', JSON.stringify(data));
          if (data.status === 'success' && data.result) {
            const song = { ...data.result, savedAt: Date.now() };
            setResult(song);
            setState(STATES.result);
            addSong(song);
            sendNotification(song);
            // Fetch AI insights in background
            setLoadingInsights(true);
            getSongInsights(song.title, song.artist, song.album).then((ai) => {
              setInsights(ai);
              setLoadingInsights(false);
            }).catch(() => setLoadingInsights(false));
          } else if (data.status === 'error') {
            setErrorMsg(data.error?.error_message || "Couldn't reach recognition service.");
            setState(STATES.error);
          } else {
            setErrorMsg("Song not recognized — try holding closer to the speaker.");
            setState(STATES.error);
          }
        } catch (err) {
          console.error('[Soundify] Recognition error:', err);
          setErrorMsg('Connection failed — check your internet and try again.');
          setState(STATES.error);
        }
      }, 6000);
    } catch (e) {
      setErrorMsg(e.message?.includes('denied') ? 'Microphone permission denied.' : 'Microphone error.');
      setState(STATES.error);
    }
  };

  const handleTap = () => {
    if (state === STATES.result) { reset(); return; }
    if (state === STATES.error) { tryAgain(); return; }
    if (state !== STATES.idle) return;
    startIdentify();
  };

  const tryAgain = () => {
    setResult(null);
    setErrorMsg('');
    setState(STATES.idle);
    setTimeout(() => startIdentify(), 100);
  };

  const openSpotify = () => {
    const url = result?.spotify?.external_urls?.spotify || result?.spotify?.uri;
    if (url) window.open(url, '_blank');
  };

  const albumArt = result?.spotify?.album?.images?.[0]?.url;
  const isListening = state === STATES.listening;
  const isResult = state === STATES.result;
  const isError = state === STATES.error;
  const isProcessing = state === STATES.processing;

  return (
    <div style={styles.page}>
      {/* Background gradient */}
      <div style={styles.gradient} />

      {/* Header */}
      <div style={styles.header}>
        <div style={{ flex: 1 }}>
          {profile?.name ? (() => {
            const { time, firstName } = getGreeting(profile.name);
            return (
              <>
                <div style={styles.greetingTime}>{time},</div>
                <div style={styles.greetingBig}>{firstName}</div>
              </>
            );
          })() : (
            <div style={styles.logo}>Soundify</div>
          )}
        </div>
        <button style={styles.settingsBtn} onClick={() => navigate('/settings')}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </div>

      {/* Center — idle/listening/processing/error */}
      {!isResult && (
        <div style={styles.center}>
          <div style={{ textAlign: 'center' }}>
            <p style={styles.instruction}>
              {state === STATES.idle ? 'Tap to identify a song'
                : isListening ? 'Listening to music...'
                : isProcessing ? 'Identifying song...'
                : errorMsg}
            </p>
          </div>

          <div style={styles.btnWrap} onClick={handleTap}>
            {isListening && (
              <>
                <div className="ring" />
                <div className="ring" />
                <div className="ring" />
              </>
            )}
            <div style={{
              ...styles.btn,
              ...(isListening ? styles.btnListening : {}),
              ...(isError ? styles.btnError : {}),
            }}>
              {isProcessing
                ? <div className="spinner" />
                : isError
                ? <RefreshIcon />
                : <WaveIcon color={isListening ? '#1DB954' : '#fff'} />
              }
            </div>
          </div>
        </div>
      )}

      {/* Result — full screen Shazam style */}
      {isResult && result && (
        <div style={styles.resultPage}>
          {/* Big album art */}
          <div style={styles.artWrap}>
            {albumArt
              ? <img src={albumArt} alt={result.title} style={styles.bigArt} />
              : <div style={styles.bigArtPlaceholder}><WaveIcon color="#535353" /></div>
            }
          </div>

          {/* Song info */}
          <div style={styles.resultInfo}>
            <div style={styles.resultTitle}>{result.title}</div>
            <div style={styles.resultArtist}>{result.artist}</div>
            {result.album && result.album !== result.title && (
              <div style={styles.resultAlbum}>{result.album}</div>
            )}
          </div>

          {/* Spotify button */}
          {result.spotify && (
            <button style={styles.spotifyBtn} onClick={openSpotify}>
              <SpotifyIcon /> Open in Spotify
            </button>
          )}

          {/* AI Story */}
          {loadingInsights && (
            <div style={styles.aiLoading}>
              <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
              <span style={{ color: '#535353', fontSize: 13 }}>Getting insights...</span>
            </div>
          )}
          {insights?.story && (
            <div style={styles.storyBox}>
              <div style={styles.storyLabel}>About this song</div>
              <p style={styles.storyText}>{insights.story}</p>
            </div>
          )}

          {/* Similar Songs */}
          {insights?.similar?.length > 0 && (
            <div style={styles.similarBox}>
              <div style={styles.storyLabel}>You might also like</div>
              {insights.similar.map((s, i) => (
                <div key={i} style={styles.similarRow}
                  onClick={() => window.open(`https://open.spotify.com/search/${encodeURIComponent(s.title + ' ' + s.artist)}`, '_blank')}
                >
                  <div style={styles.similarNum}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={styles.similarTitle}>{s.title}</div>
                    <div style={styles.similarArtist}>{s.artist}</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#535353" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              ))}
            </div>
          )}

          {/* Identify again */}
          <button style={styles.againBtn} onClick={reset}>Identify Again</button>
        </div>
      )}

      {/* Recently Found */}
      {state === STATES.idle && songs.length > 0 && (
        <div style={styles.recent}>
          <div style={styles.recentLabel}>Recently Found</div>
          <div style={styles.recentScroll}>
            {songs.slice(0, 8).map((song, i) => <SongCard key={i} song={song} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function WaveIcon({ color }) {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
      <path d="M2 12h1M5 8v8M9 5v14M13 3v18M17 6v12M21 9v6" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ff4d4d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  );
}

function SpotifyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#000">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  );
}

function sendNotification(song) {
  if (!('Notification' in window)) return;
  const art = song?.spotify?.album?.images?.[0]?.url;
  const url = song?.spotify?.external_urls?.spotify || song?.spotify?.uri;

  const fire = () => {
    const n = new Notification(song.title, { body: song.artist, icon: art, silent: true });
    if (url) n.onclick = () => { window.focus(); window.open(url, '_blank'); };
  };

  if (Notification.permission === 'granted') {
    fire();
  } else if (Notification.permission === 'default') {
    Notification.requestPermission().then((p) => { if (p === 'granted') fire(); });
  }
}

const styles = {
  page: { display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden' },
  gradient: {
    position: 'absolute', inset: 0, zIndex: 0,
    background: 'radial-gradient(ellipse at 50% 45%, #071a0f 0%, #000 70%)',
    pointerEvents: 'none',
  },
  header: {
    position: 'relative', zIndex: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 20px 8px',
  },
  logo: { fontSize: 22, fontWeight: 800, color: '#1DB954', letterSpacing: 0.5 },
  greeting: { fontSize: 13, color: '#b3b3b3', marginTop: 2 },
  greetingName: { color: '#1DB954', fontWeight: 700 },
  greetingTime: { fontSize: 13, color: '#b3b3b3', fontWeight: 500 },
  greetingBig: { fontSize: 26, fontWeight: 800, color: '#1DB954', marginTop: 2 },
  settingsBtn: {
    width: 38, height: 38, borderRadius: '50%',
    background: 'rgba(255,255,255,0.1)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', border: 'none',
  },

  center: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    position: 'relative', zIndex: 1, padding: '0 24px',
    gap: 32,
  },
  instruction: { fontSize: 17, fontWeight: 700, color: '#fff', textAlign: 'center' },

  btnWrap: {
    position: 'relative', width: 190, height: 190,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
  },
  btn: {
    width: 180, height: 180, borderRadius: '50%',
    background: 'rgba(255,255,255,0.07)',
    border: '1.5px solid rgba(255,255,255,0.15)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', transition: 'border-color 0.3s, background 0.3s',
    position: 'relative', zIndex: 1,
  },
  btnListening: { borderColor: '#1DB954', background: 'rgba(29,185,84,0.1)' },
  btnResult: { borderColor: '#1DB954', padding: 0 },
  btnError: { borderColor: '#ff4d4d' },
  albumArt: { width: '100%', height: '100%', objectFit: 'cover' },

  // Result page
  resultPage: {
    flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 16, padding: '16px 20px 32px',
    position: 'relative', zIndex: 1,
    scrollbarWidth: 'none',
  },
  artWrap: {
    width: 200, height: 200, borderRadius: 16,
    overflow: 'hidden', flexShrink: 0,
    boxShadow: '0 8px 40px rgba(29,185,84,0.25)',
  },
  bigArt: { width: '100%', height: '100%', objectFit: 'cover' },
  bigArtPlaceholder: {
    width: '100%', height: '100%', background: '#1a1a1a',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  resultInfo: { textAlign: 'center', width: '100%' },
  resultTitle: { fontSize: 26, fontWeight: 800, color: '#fff', textAlign: 'center' },
  resultArtist: { fontSize: 17, fontWeight: 600, color: '#1DB954', marginTop: 4 },
  resultAlbum: { fontSize: 13, color: '#b3b3b3', marginTop: 2 },
  spotifyBtn: {
    display: 'flex', alignItems: 'center', gap: 8, width: '100%', justifyContent: 'center',
    background: '#1DB954', color: '#000', fontWeight: 700,
    fontSize: 15, padding: '14px 22px', borderRadius: 30, cursor: 'pointer', border: 'none',
    fontFamily: 'inherit',
  },
  againBtn: {
    background: 'none', border: '1.5px solid #282828', color: '#fff',
    fontWeight: 600, fontSize: 14, padding: '12px 22px', borderRadius: 30,
    cursor: 'pointer', fontFamily: 'inherit', width: '100%',
  },

  aiLoading: { display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', padding: '8px 0' },
  storyBox: { background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px 14px', width: '100%', textAlign: 'left' },
  storyLabel: { fontSize: 11, fontWeight: 700, color: '#1DB954', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  storyText: { fontSize: 13, color: '#b3b3b3', lineHeight: 1.6, margin: 0 },
  similarBox: { width: '100%', textAlign: 'left' },
  similarRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', marginBottom: 6 },
  similarNum: { fontSize: 13, color: '#535353', fontWeight: 700, width: 16, textAlign: 'center', flexShrink: 0 },
  similarTitle: { fontSize: 14, fontWeight: 600, color: '#fff' },
  similarArtist: { fontSize: 12, color: '#b3b3b3', marginTop: 1 },
  recent: { position: 'relative', zIndex: 1, paddingBottom: 12, flexShrink: 0 },
  recentLabel: { fontSize: 15, fontWeight: 700, color: '#b3b3b3', padding: '0 20px 10px' },
  recentScroll: {
    display: 'flex', overflowX: 'auto', paddingLeft: 20,
    scrollbarWidth: 'none', gap: 0,
  },
};
