-- Run this in your Supabase SQL editor to set up the fingerprinting tables.

CREATE TABLE IF NOT EXISTS fp_songs (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  title      TEXT        NOT NULL,
  artist     TEXT,
  album      TEXT,
  duration   FLOAT,
  spotify_id TEXT        UNIQUE,          -- prevents duplicate ingestion
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fp_fingerprints (
  hash        BIGINT  NOT NULL,
  time_offset INTEGER NOT NULL,
  song_id     UUID    NOT NULL REFERENCES fp_songs(id) ON DELETE CASCADE
);

-- Critical — all recognition queries filter on hash
CREATE INDEX IF NOT EXISTS idx_fp_hash       ON fp_fingerprints(hash);
CREATE INDEX IF NOT EXISTS idx_fp_song_id    ON fp_fingerprints(song_id);
CREATE INDEX IF NOT EXISTS idx_fp_spotify_id ON fp_songs(spotify_id);

-- Tracks each auto-sync run
CREATE TABLE IF NOT EXISTS fp_sync_log (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id TEXT        NOT NULL,
  playlist_name TEXT,
  ingested    INTEGER     DEFAULT 0,
  skipped     INTEGER     DEFAULT 0,
  failed      INTEGER     DEFAULT 0,
  total       INTEGER     DEFAULT 0,
  started_at  TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);
