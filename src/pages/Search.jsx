import { useState } from 'react';
import { useLibrary } from '../context/LibraryContext';

export default function Search() {
  const [query, setQuery] = useState('');
  const { songs } = useLibrary();

  const filtered = query.trim()
    ? songs.filter((s) =>
        s.title?.toLowerCase().includes(query.toLowerCase()) ||
        s.artist?.toLowerCase().includes(query.toLowerCase())
      )
    : songs;

  const open = (song) => {
    const url = song?.spotify?.external_urls?.spotify || song?.spotify?.uri;
    if (url) window.open(url, '_blank');
  };

  const searchSpotify = () => {
    window.open(`https://open.spotify.com/search/${encodeURIComponent(query)}`, '_blank');
  };

  return (
    <div style={styles.page}>
      <div style={styles.gradient} />
      <div style={styles.header}><span style={styles.title}>Search</span></div>

      <div style={styles.searchWrap}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#535353" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          style={styles.input}
          placeholder="Search your library..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && <button style={styles.clear} onClick={() => setQuery('')}>✕</button>}
      </div>

      <div style={styles.list}>
        {filtered.length === 0 && query ? (
          <div style={styles.empty}>
            <div style={styles.emptyTitle}>Not in your library</div>
            <button style={styles.spotifyBtn} onClick={searchSpotify}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#000"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
              Search on Spotify
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={styles.empty}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#535353" strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom: 12 }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <div style={styles.emptyTitle}>Search your library</div>
            <div style={styles.emptySub}>Songs you identify are saved here</div>
          </div>
        ) : filtered.map((song, i) => {
          const art = song?.spotify?.album?.images?.[0]?.url;
          return (
            <div key={i} style={styles.row} onClick={() => open(song)}>
              {art
                ? <img src={art} alt={song.title} style={styles.art} />
                : <div style={{ ...styles.art, background: '#282828', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#535353" strokeWidth="1.5" strokeLinecap="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg></div>
              }
              <div style={styles.info}>
                <div style={styles.songTitle}>{song.title}</div>
                <div style={styles.artist}>{song.artist}</div>
              </div>
              {song.spotify && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#1DB954" style={{ flexShrink: 0 }}>
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  page: { display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden' },
  gradient: { position: 'absolute', inset: 0, zIndex: 0, background: 'radial-gradient(ellipse at 50% 30%, #071a0f 0%, #000 65%)', pointerEvents: 'none' },
  header: { position: 'relative', zIndex: 1, padding: '16px 20px 8px' },
  title: { fontSize: 28, fontWeight: 800, color: '#fff' },
  searchWrap: {
    position: 'relative', zIndex: 1,
    display: 'flex', alignItems: 'center', gap: 10,
    background: '#1a1a1a', borderRadius: 12,
    margin: '8px 16px', padding: '10px 14px',
  },
  input: { flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 15, fontFamily: 'inherit' },
  clear: { color: '#535353', fontSize: 14, cursor: 'pointer', background: 'none', border: 'none', lineHeight: 1 },
  list: { flex: 1, overflowY: 'auto', padding: '8px 16px 24px', position: 'relative', zIndex: 1 },
  row: { display: 'flex', alignItems: 'center', background: '#1a1a1a', borderRadius: 12, padding: 12, marginBottom: 10, cursor: 'pointer', gap: 14 },
  art: { width: 50, height: 50, borderRadius: 6, objectFit: 'cover', flexShrink: 0 },
  info: { flex: 1, overflow: 'hidden' },
  songTitle: { fontSize: 15, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  artist: { fontSize: 13, color: '#b3b3b3', marginTop: 2 },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 80, gap: 14 },
  emptyTitle: { fontSize: 18, fontWeight: 700, color: '#b3b3b3' },
  emptySub: { fontSize: 14, color: '#535353' },
  spotifyBtn: { display: 'flex', alignItems: 'center', gap: 8, background: '#1DB954', color: '#000', fontWeight: 700, fontSize: 14, padding: '12px 24px', borderRadius: 30, cursor: 'pointer', border: 'none', fontFamily: 'inherit' },
};
