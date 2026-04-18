import React from 'react';

function MusicNote() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#535353" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>;
}

function timeAgo(ts) {
  const d = Date.now() - ts;
  const m = Math.floor(d / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function SongCard({ song, onClick }) {
  const art = song?.spotify?.album?.images?.[0]?.url;
  const url = song?.spotify?.external_urls?.spotify || song?.spotify?.uri;

  const open = () => {
    if (onClick) { onClick(song); return; }
    if (url) window.open(url, '_blank');
  };

  return (
    <div onClick={open} style={styles.card}>
      {art
        ? <img src={art} alt={song.title} style={styles.art} />
        : <div style={{ ...styles.art, background: '#282828', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MusicNote /></div>
      }
      <div style={styles.info}>
        {song.savedAt && <div style={styles.time}>{timeAgo(song.savedAt)}</div>}
        <div style={styles.title}>{song.title}</div>
        <div style={styles.artist}>{song.artist}</div>
      </div>
    </div>
  );
}

const styles = {
  card: {
    display: 'flex', alignItems: 'center',
    background: '#1a1a1a', borderRadius: 12,
    padding: 12, marginRight: 12, minWidth: 260,
    cursor: 'pointer', flexShrink: 0,
    transition: 'background 0.15s',
  },
  art: { width: 52, height: 52, borderRadius: 6, marginRight: 12, objectFit: 'cover', flexShrink: 0 },
  info: { overflow: 'hidden' },
  time: { fontSize: 11, color: '#535353', marginBottom: 2 },
  title: { fontSize: 15, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  artist: { fontSize: 13, color: '#b3b3b3', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
};
