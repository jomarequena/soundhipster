// Vercel Serverless Function — proxy para Deezer API
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { q, limit = 25, index = 0 } = req.query;
  if (!q) return res.status(400).json({ error: 'Missing query parameter q' });

  try {
    const url = `https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=${limit}&index=${index}&output=json`;
    const response = await fetch(url);
    if (!response.ok) return res.status(502).json({ error: `Deezer returned ${response.status}` });
    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
