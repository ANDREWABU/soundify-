// Spotify Web API — Client Credentials flow (no user login required)
// Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env

let cachedToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
    throw new Error('SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET not set');
  }

  const creds = Buffer
    .from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`)
    .toString('base64');

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) throw new Error(`Spotify token HTTP ${res.status}`);
  const json = await res.json();

  cachedToken = json.access_token;
  tokenExpiry = Date.now() + (json.expires_in - 60) * 1000;
  return cachedToken;
}

// Search Spotify for a track by title + artist.
// Returns the raw Spotify track object (or null if not found / not configured).
async function searchSpotify(title, artist) {
  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
    return null;
  }
  try {
    const token = await getAccessToken();

    // Use field filters for precision
    const q = artist
      ? `track:${title} artist:${artist}`
      : `track:${title}`;

    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=1`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

    if (!res.ok) throw new Error(`Spotify search HTTP ${res.status}`);
    const json = await res.json();

    return json.tracks?.items?.[0] ?? null;
  } catch (err) {
    console.warn('[spotify] Search failed:', err.message);
    return null;
  }
}

module.exports = { searchSpotify };
