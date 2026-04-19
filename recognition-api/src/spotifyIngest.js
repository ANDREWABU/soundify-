// Spotify-based auto-ingestion
// Downloads 30s preview clips, fingerprints them, stores in DB

const { createClient } = require('@supabase/supabase-js');
const { fingerprintSamples } = require('./fingerprint');
const { decodeAudio, bufferToTempFile, cleanupTemp } = require('./audio');
const { insertSong, insertFingerprints } = require('./database');

let _client = null;
function db() {
  if (!_client) _client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  return _client;
}

let accessToken = null;
let tokenExpiry = 0;

async function getSpotifyToken() {
  if (accessToken && Date.now() < tokenExpiry) return accessToken;
  const creds = Buffer
    .from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`)
    .toString('base64');
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { Authorization: `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`Spotify token HTTP ${res.status}`);
  const json = await res.json();
  accessToken = json.access_token;
  tokenExpiry = Date.now() + (json.expires_in - 60) * 1000;
  return accessToken;
}

async function spotifyGet(path) {
  const token = await getSpotifyToken();
  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Spotify GET ${path} → HTTP ${res.status}`);
  return res.json();
}

// Check if a Spotify track ID is already in the DB
async function trackAlreadyIngested(spotifyId) {
  const { data } = await db()
    .from('fp_songs')
    .select('id')
    .eq('spotify_id', spotifyId)
    .maybeSingle();
  return !!data;
}

// Download a preview MP3, fingerprint it, insert into DB
// Returns true if ingested, false if skipped (no preview / already exists)
async function ingestTrack(track) {
  if (!track?.preview_url) return { status: 'skipped', reason: 'no_preview' };
  if (!track?.id) return { status: 'skipped', reason: 'no_id' };

  const already = await trackAlreadyIngested(track.id);
  if (already) return { status: 'skipped', reason: 'already_exists' };

  const title  = track.name;
  const artist = track.artists?.map(a => a.name).join(', ');
  const album  = track.album?.name;
  const duration = (track.duration_ms || 0) / 1000;

  // Download the 30s preview clip
  const previewRes = await fetch(track.preview_url);
  if (!previewRes.ok) return { status: 'skipped', reason: 'preview_download_failed' };
  const audioBuffer = Buffer.from(await previewRes.arrayBuffer());

  let tmpPath = null;
  try {
    tmpPath = await bufferToTempFile(audioBuffer, '.mp3');
    const samples = await decodeAudio(tmpPath);
    const hashes  = fingerprintSamples(samples);

    const songId = await insertSong({ title, artist, album, duration, spotify_id: track.id });
    await insertFingerprints(songId, hashes);

    return { status: 'ingested', title, artist, hashes: hashes.length };
  } finally {
    if (tmpPath) await cleanupTemp(tmpPath);
  }
}

// Fetch all tracks from a Spotify playlist (handles pagination)
async function getPlaylistTracks(playlistId) {
  const tracks = [];
  let url = `/playlists/${playlistId}/tracks?limit=50&fields=next,items(track(id,name,artists,album,preview_url,duration_ms))`;
  while (url) {
    const data = await spotifyGet(url);
    for (const item of data.items || []) {
      if (item.track) tracks.push(item.track);
    }
    // next is a full URL like https://api.spotify.com/v1/...
    url = data.next ? data.next.replace('https://api.spotify.com/v1', '') : null;
  }
  return tracks;
}

// Ingest every track in a playlist, return summary
async function ingestPlaylist(playlistId, { onProgress } = {}) {
  const tracks = await getPlaylistTracks(playlistId);
  const results = { ingested: 0, skipped: 0, failed: 0, total: tracks.length };

  for (let i = 0; i < tracks.length; i++) {
    try {
      const r = await ingestTrack(tracks[i]);
      if (r.status === 'ingested') results.ingested++;
      else results.skipped++;
      if (onProgress) onProgress(i + 1, tracks.length, tracks[i].name);
    } catch (err) {
      console.warn(`[ingest] Failed "${tracks[i]?.name}":`, err.message);
      results.failed++;
    }
    // Small delay to avoid hammering Spotify's CDN
    await new Promise(r => setTimeout(r, 150));
  }
  return results;
}

// Well-known Spotify playlist IDs to seed the database
const SEED_PLAYLISTS = [
  { id: '37i9dQZEVXbMDoHDwVN2tF', name: 'Top 50 Global'    },
  { id: '37i9dQZEVXbLRQDuF5jeBp', name: 'Top 50 USA'        },
  { id: '37i9dQZF1DX0XUsuxWHRQd', name: 'RapCaviar'         },
  { id: '37i9dQZF1DXcBWIGoYBM5M', name: 'Hot Country'        },
  { id: '37i9dQZF1DX4JAvHpjipBk', name: 'New Music Friday'  },
  { id: '37i9dQZF1DX1lVhptIYRda', name: 'Hot Hits USA'       },
  { id: '37i9dQZF1DXbTxeAdrVG2l', name: 'Viral Hits'         },
  { id: '37i9dQZF1DX4dyzvuaRJ0n', name: 'mint (Pop)'         },
  { id: '37i9dQZF1DX10zKzsJ2jva', name: 'Viva Latino'        },
  { id: '37i9dQZF1DWXRqgorJj26U', name: 'Rock Classics'      },
];

module.exports = { ingestPlaylist, ingestTrack, getPlaylistTracks, SEED_PLAYLISTS };
