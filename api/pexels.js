// api/pexels.js
// Proxy para a API do Pexels — resolve o bloqueio de CORS
// Chave gratuita em: pexels.com/api (25.000 req/mês)

export default async function handler(req, res) {
  // Permite qualquer origem
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido.' });

  const { query, orientation = 'landscape', per_page = 5 } = req.query;
  if (!query) return res.status(400).json({ error: 'Query ausente.' });

  if (!process.env.PEXELS_API_KEY) {
    return res.status(500).json({ error: 'PEXELS_API_KEY não configurada.' });
  }

  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${per_page}&orientation=${orientation}`;

    const response = await fetch(url, {
      headers: { Authorization: process.env.PEXELS_API_KEY },
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error || 'Erro no Pexels.' });
    }

    // Retorna só o necessário — URL da imagem e crédito
    const photos = (data.photos || []).map(p => ({
      url:         p.src.large2x || p.src.large,
      url_medium:  p.src.medium,
      url_small:   p.src.small,
      photographer: p.photographer,
      alt:         p.alt,
    }));

    res.status(200).json({ photos });

  } catch (e) {
    console.error('[pexels]', e.message);
    res.status(500).json({ error: e.message });
  }
}