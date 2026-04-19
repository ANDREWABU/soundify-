const { lookupHashes, getSong } = require('./database');

const MIN_MATCHES = 5; // minimum aligned hash pairs to consider a match

// Core matching logic: query DB with recording hashes, score each candidate song.
// queryHashes: [{hash, offset}]
// Returns { song, score, confidence } or null
async function matchFingerprints(queryHashes) {
  const dbRows = await lookupHashes(queryHashes);
  if (dbRows.length === 0) return null;

  // Build a lookup: hash → queryOffset for the recording
  const queryMap = new Map();
  for (const { hash, offset } of queryHashes) {
    if (!queryMap.has(hash)) queryMap.set(hash, []);
    queryMap.get(hash).push(offset);
  }

  // For each DB hit, compute the time alignment offset (db_time - query_time).
  // True matches cluster at a single alignment offset.
  // Key: `${song_id}:${alignment}` → count
  const alignmentCounts = new Map();

  for (const row of dbRows) {
    const queryOffsets = queryMap.get(row.hash);
    if (!queryOffsets) continue;
    for (const qOffset of queryOffsets) {
      const alignment = row.time_offset - qOffset;
      const key = `${row.song_id}:${alignment}`;
      alignmentCounts.set(key, (alignmentCounts.get(key) || 0) + 1);
    }
  }

  if (alignmentCounts.size === 0) return null;

  // Find the (song_id, alignment) pair with the highest count
  let bestKey = null;
  let bestCount = 0;
  for (const [key, count] of alignmentCounts) {
    if (count > bestCount) { bestCount = count; bestKey = key; }
  }

  if (bestCount < MIN_MATCHES) return null;

  const [songId] = bestKey.split(':');
  const song = await getSong(songId);

  // Confidence: ratio of aligned matches to total query hashes
  const confidence = Math.min(1, bestCount / queryHashes.length);

  return { song, score: bestCount, confidence };
}

module.exports = { matchFingerprints };
