// Vercel Serverless Function — proxy para Deezer /album/{id}
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });

  try {
    const response = await fetch(`https://api.deezer.com/album/${id}`);
    if (!response.ok) return res.status(502).json({ error: `Deezer returned ${response.status}` });
    const data = await response.json();
    // Devolver solo lo necesario: release_date
    return res.status(200).json({ id: data.id, release_date: data.release_date || null });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
