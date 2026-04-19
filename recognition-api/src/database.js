const { createClient } = require('@supabase/supabase-js');

let _client = null;
function db() {
  if (!_client) _client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  return _client;
}

async function insertSong({ title, artist, album, duration, spotify_id }) {
  const { data, error } = await db()
    .from('fp_songs')
    .insert({ title, artist, album, duration, spotify_id: spotify_id || null })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

async function insertFingerprints(songId, hashes) {
  const BATCH = 1000;
  for (let i = 0; i < hashes.length; i += BATCH) {
    const rows = hashes.slice(i, i + BATCH).map(({ hash, offset }) => ({
      hash,
      time_offset: offset,
      song_id: songId,
    }));
    const { error } = await db().from('fp_fingerprints').insert(rows);
    if (error) throw error;
  }
}

async function lookupHashes(hashes) {
  if (hashes.length === 0) return [];
  const hashValues = hashes.map(h => h.hash);
  const results = [];
  const CHUNK = 500;
  for (let i = 0; i < hashValues.length; i += CHUNK) {
    const chunk = hashValues.slice(i, i + CHUNK);
    const { data, error } = await db()
      .from('fp_fingerprints')
      .select('hash, time_offset, song_id')
      .in('hash', chunk);
    if (error) throw error;
    results.push(...(data || []));
  }
  return results;
}

async function getSong(id) {
  const { data, error } = await db()
    .from('fp_songs')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

async function listSongs() {
  const { data, error } = await db()
    .from('fp_songs')
    .select('id, title, artist, album, duration, spotify_id, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

async function deleteSong(id) {
  const { error } = await db().from('fp_songs').delete().eq('id', id);
  if (error) throw error;
}

module.exports = { insertSong, insertFingerprints, lookupHashes, getSong, listSongs, deleteSong };
