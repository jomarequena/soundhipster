// Vercel Serverless Function — proxy para Deezer API
// Corre en el servidor: no hay CORS, no hay ad-blockers
export default async function handler(req, res) {
  // CORS headers — permite peticiones desde cualquier origen
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { q, limit = 25, index = 0 } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Missing query parameter q' });
  }

  try {
    const url = `https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=${limit}&index=${index}&output=json`;
    const response = await fetch(url);

    if (!response.ok) {
      return res.status(502).json({ error: `Deezer returned ${response.status}` });
    }

    const data = await response.json();

    // Enriquecer cada track con release_date del álbum si no viene en el track
    // Deezer /search no devuelve release_date en el track, pero sí en /album/{id}
    // Para no hacer N peticiones, obtenemos álbumes únicos en paralelo (máx 8)
    if (data.data && Array.isArray(data.data)) {
      const albumIds = [...new Set(data.data.map(t => t.album?.id).filter(Boolean))].slice(0, 8);
      if (albumIds.length > 0) {
        try {
          const albumDates = {};
          await Promise.all(albumIds.map(async (aid) => {
            try {
              const ar = await fetch(`https://api.deezer.com/album/${aid}`);
              if (ar.ok) {
                const a = await ar.json();
                if (a.release_date) albumDates[aid] = a.release_date;
              }
            } catch {}
          }));
          data.data = data.data.map(t => {
            if (!t.release_date && t.album?.id && albumDates[t.album.id]) {
              return { ...t, release_date: albumDates[t.album.id] };
            }
            return t;
          });
        } catch {}
      }
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
