export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { title, artist, album } = await req.json();

  const prompt = `You are a music expert. For the song "${title}" by ${artist}${album ? ` from the album "${album}"` : ''}, return ONLY a JSON object with no markdown, no code blocks, just raw JSON:
{
  "story": "2-3 engaging sentences about this song: its meaning or theme, the emotional vibe, and one interesting fact about the song or artist.",
  "similar": [
    { "title": "Song Name", "artist": "Artist Name" },
    { "title": "Song Name", "artist": "Artist Name" },
    { "title": "Song Name", "artist": "Artist Name" },
    { "title": "Song Name", "artist": "Artist Name" },
    { "title": "Song Name", "artist": "Artist Name" }
  ]
}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const data = await response.json();
  const raw = data.content?.[0]?.text || '{}';
  // Strip markdown code fences if Claude wraps the JSON
  const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();

  try {
    const parsed = JSON.parse(text);
    return new Response(JSON.stringify(parsed), {
      headers: { 'content-type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ story: null, similar: [] }), {
      headers: { 'content-type': 'application/json' },
    });
  }
}
