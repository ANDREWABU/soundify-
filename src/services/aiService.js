const PROMPT = (title, artist, album) =>
  `You are a music expert. For the song "${title}" by ${artist}${album ? ` from the album "${album}"` : ''}, return ONLY raw JSON with no markdown:
{
  "story": "2-3 engaging sentences: the song's meaning or theme, its emotional vibe, and one interesting fact about the song or artist.",
  "similar": [
    { "title": "Song Name", "artist": "Artist Name" },
    { "title": "Song Name", "artist": "Artist Name" },
    { "title": "Song Name", "artist": "Artist Name" },
    { "title": "Song Name", "artist": "Artist Name" },
    { "title": "Song Name", "artist": "Artist Name" }
  ]
}`;

export async function getSongInsights(title, artist, album) {
  try {
    // In local dev call Claude directly; in production use the serverless function
    if (import.meta.env.DEV) {
      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
      if (!apiKey) return null;

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 600,
          messages: [{ role: 'user', content: PROMPT(title, artist, album) }],
        }),
      });

      const data = await res.json();
      const raw = data.content?.[0]?.text || '{}';
      const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
      return JSON.parse(text);
    }

    // Production — use Vercel serverless function
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title, artist, album }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
