require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const multer  = require('multer');
const { createClient } = require('@supabase/supabase-js');

const { decodeAudio, bufferToTempFile, cleanupTemp } = require('./src/audio');
const { fingerprintSamples }                          = require('./src/fingerprint');
const { insertSong, insertFingerprints, listSongs, deleteSong } = require('./src/database');
const { matchFingerprints }   = require('./src/matcher');
const { searchSpotify }       = require('./src/spotify');
const { ingestPlaylist, SEED_PLAYLISTS } = require('./src/spotifyIngest');

const app    = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
const db     = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

app.use(cors());
app.use(express.json());

// ─── Health ────────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', service: 'soundify-recognition-api' }));

// ─── Songs list ────────────────────────────────────────────────────────────
app.get('/songs', async (_, res) => {
  try { res.json({ songs: await listSongs() }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Manual audio ingest ───────────────────────────────────────────────────
app.post('/songs/ingest', upload.single('audio'), async (req, res) => {
  let tmpPath = null;
  try {
    if (!req.file)   return res.status(400).json({ error: 'audio file required' });
    if (!req.body.title) return res.status(400).json({ error: 'title required' });
    const { title, artist, album } = req.body;

    const ext = req.file.originalname ? `.${req.file.originalname.split('.').pop()}` : '.bin';
    tmpPath = await bufferToTempFile(req.file.buffer, ext);

    const samples  = await decodeAudio(tmpPath);
    const hashes   = fingerprintSamples(samples);
    const songId   = await insertSong({ title, artist, album, duration: samples.length / 8000 });
    await insertFingerprints(songId, hashes);

    res.json({ success: true, song_id: songId, hashes: hashes.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (tmpPath) await cleanupTemp(tmpPath);
  }
});

// ─── Recognize ─────────────────────────────────────────────────────────────
app.post('/recognize', upload.single('audio'), async (req, res) => {
  let tmpPath = null;
  try {
    if (!req.file) return res.status(400).json({ error: 'audio file required' });

    const ext = req.file.mimetype.includes('webm') ? '.webm'
              : req.file.mimetype.includes('ogg')  ? '.ogg'
              : req.file.mimetype.includes('mp4')  ? '.mp4'
              : '.bin';

    tmpPath = await bufferToTempFile(req.file.buffer, ext);
    const samples = await decodeAudio(tmpPath);
    const hashes  = fingerprintSamples(samples);
    const match   = await matchFingerprints(hashes);

    if (!match) return res.json({ result: 'no_match', message: 'No song found in database' });

    const spotifyTrack = await searchSpotify(match.song.title, match.song.artist);
    res.json({
      result:     'match',
      score:      match.score,
      confidence: match.confidence,
      song:       { ...match.song, spotify: spotifyTrack },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (tmpPath) await cleanupTemp(tmpPath);
  }
});

// ─── Delete song ───────────────────────────────────────────────────────────
app.delete('/songs/:id', async (req, res) => {
  try { await deleteSong(req.params.id); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Sync status ───────────────────────────────────────────────────────────
app.get('/sync/status', async (_, res) => {
  try {
    const { count: songCount } = await db.from('fp_songs').select('*', { count: 'exact', head: true });
    const { data: lastSync }   = await db
      .from('fp_sync_log')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(5);
    res.json({
      songs_in_db:   songCount,
      seed_playlists: SEED_PLAYLISTS.map(p => p.name),
      recent_syncs:  lastSync || [],
      next_auto_sync: new Date(lastAutoSync + AUTO_SYNC_INTERVAL).toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Sync a specific Spotify playlist ─────────────────────────────────────
// POST /sync/playlist/:id  — or send { playlist_url } in body
app.post('/sync/playlist/:playlistId?', async (req, res) => {
  // Accept playlist ID from URL param or extract from full Spotify URL in body
  let playlistId = req.params.playlistId;
  const name     = req.body?.name || playlistId;

  if (!playlistId && req.body?.playlist_url) {
    const match = req.body.playlist_url.match(/playlist\/([A-Za-z0-9]+)/);
    if (match) playlistId = match[1];
  }
  if (!playlistId) return res.status(400).json({ error: 'playlist ID required' });

  // Log the start
  const { data: logRow } = await db
    .from('fp_sync_log')
    .insert({ playlist_id: playlistId, playlist_name: name })
    .select('id')
    .single();
  const logId = logRow?.id;

  // Run in background so the response returns immediately
  res.json({ message: 'Sync started', playlist_id: playlistId, log_id: logId });

  runPlaylistSync(playlistId, name, logId).catch(err =>
    console.error(`[sync] playlist ${playlistId} failed:`, err.message)
  );
});

// ─── Seed the full database from all built-in playlists ───────────────────
app.post('/sync/seed', async (_, res) => {
  res.json({ message: 'Full seed started', playlists: SEED_PLAYLISTS.length });
  runFullSeed().catch(err => console.error('[sync] seed failed:', err.message));
});

// ─── Helpers ───────────────────────────────────────────────────────────────
async function runPlaylistSync(playlistId, name, logId) {
  console.log(`[sync] Starting playlist "${name}" (${playlistId})`);
  const results = await ingestPlaylist(playlistId, {
    onProgress: (done, total, title) =>
      console.log(`[sync] ${name}: ${done}/${total} — ${title}`),
  });
  console.log(`[sync] "${name}" done:`, results);

  if (logId) {
    await db.from('fp_sync_log').update({
      ingested:    results.ingested,
      skipped:     results.skipped,
      failed:      results.failed,
      total:       results.total,
      finished_at: new Date().toISOString(),
    }).eq('id', logId);
  }
  return results;
}

async function runFullSeed() {
  console.log(`[sync] Full seed: ${SEED_PLAYLISTS.length} playlists`);
  for (const playlist of SEED_PLAYLISTS) {
    const { data: logRow } = await db
      .from('fp_sync_log')
      .insert({ playlist_id: playlist.id, playlist_name: playlist.name })
      .select('id')
      .single();
    await runPlaylistSync(playlist.id, playlist.name, logRow?.id);
  }
  console.log('[sync] Full seed complete');
}

// ─── Auto-sync every 24 hours ──────────────────────────────────────────────
const AUTO_SYNC_INTERVAL = 24 * 60 * 60 * 1000; // 24 h
let lastAutoSync = Date.now();

setInterval(() => {
  lastAutoSync = Date.now();
  console.log('[sync] Auto-sync triggered (24h interval)');
  runFullSeed().catch(err => console.error('[sync] Auto-sync failed:', err.message));
}, AUTO_SYNC_INTERVAL);

// ─── Start ─────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Soundify Recognition API running on port ${PORT}`);
  console.log(`Auto-sync: every 24h | Seed playlists: ${SEED_PLAYLISTS.length}`);
});
