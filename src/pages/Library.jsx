import { useLibrary } from '../context/LibraryContext';

function timeAgo(ts) {
  const d = Date.now() - ts;
  const m = Math.floor(d / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function Library() {
  const { songs, removeSong, clearLibrary } = useLibrary();

  const open = (song) => {
    const url = song?.spotify?.external_urls?.spotify || song?.spotify?.uri;
    if (url) window.open(url, '_blank');
  };

  return (
    <div style={s.page}>
      <div style={s.gradient} />

      <div style={s.header}>
        <span style={s.title}>Library</span>
        {songs.length > 0 && (
          <button style={s.clearBtn} onClick={() => { if (confirm('Clear all saved songs?')) clearLibrary(); }}>
            Clear
          </button>
        )}
      </div>

      <div style={s.list}>
        {songs.length === 0 ? (
          <div style={s.empty}>
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#535353" strokeWidth="1.5" strokeLinecap="round">
              <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
            </svg>
            <div style={s.emptyTitle}>No songs yet</div>
            <div style={s.emptySub}>Songs you identify will appear here</div>
          </div>
        ) : (
          songs.map((song, i) => {
            const art = song?.spotify?.album?.images?.[0]?.url;
            return (
              <div
                key={i}
                style={s.card}
                onClick={() => open(song)}
                onContextMenu={(e) => { e.preventDefault(); if (confirm(`Remove "${song.title}"?`)) removeSong(song.id); }}
              >
                {/* Album art */}
                {art
                  ? <img src={art} alt={song.title} style={s.art} />
                  : <div style={s.artPlaceholder}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#535353" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
                      </svg>
                    </div>
                }

                {/* Info */}
                <div style={s.info}>
                  {song.savedAt && <div style={s.time}>{timeAgo(song.savedAt)}</div>}
                  <div style={s.songTitle}>{song.title}</div>
                  <div style={s.artist}>{song.artist}</div>
                </div>

                {/* Spotify dot */}
                {song.spotify && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#1DB954" style={{ flexShrink: 0 }}>
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const s = {
  page: { display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden' },
  gradient: { position: 'absolute', inset: 0, zIndex: 0, background: 'radial-gradient(ellipse at 50% 30%, #071a0f 0%, #000 65%)', pointerEvents: 'none' },

  header: {
    position: 'relative', zIndex: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 20px 12px',
  },
  title: { fontSize: 28, fontWeight: 800, color: '#fff' },
  clearBtn: { color: '#1DB954', fontSize: 15, fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit' },

  list: {
    flex: 1, overflowY: 'auto', padding: '0 16px 24px',
    position: 'relative', zIndex: 1,
    scrollbarWidth: 'none',
  },

  card: {
    display: 'flex', alignItems: 'center',
    background: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: '12px 14px',
    marginBottom: 10,
    gap: 14,
    cursor: 'pointer',
    transition: 'background 0.15s',
  },

  art: { width: 60, height: 60, borderRadius: 8, objectFit: 'cover', flexShrink: 0 },
  artPlaceholder: {
    width: 60, height: 60, borderRadius: 8, flexShrink: 0,
    background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },

  info: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 2 },
  time: { fontSize: 11, color: '#535353', fontWeight: 500 },
  songTitle: { fontSize: 16, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  artist: { fontSize: 13, color: '#b3b3b3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },

  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 120 },
  emptyTitle: { fontSize: 20, fontWeight: 700, color: '#b3b3b3' },
  emptySub: { fontSize: 14, color: '#535353' },
};
