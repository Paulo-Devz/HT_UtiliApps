import sql from './connection.js';

const MAX = 500;

const ADMIN_IPS = (process.env.ADMIN_IPS || '')
  .split(',').map(s => s.trim()).filter(Boolean);

function getIp(req) {
  return (req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || '')
    .split(',')[0].trim();
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  const ip = getIp(req);

  if (req.method === 'POST' && req.query.action === 'registrar') {
    await sql`
      INSERT INTO informacao_anuncios (anuncios_rodados, criado_em) VALUES (1, NOW())
    `;
    const [{ total }] = await sql`SELECT COUNT(*)::int AS total FROM informacao_anuncios`;
    if (total > MAX) {
      await sql`DELETE FROM informacao_anuncios WHERE id IN (SELECT id FROM informacao_anuncios ORDER BY criado_em ASC LIMIT 1)`;
    }
    return res.status(200).json({ ok: true });
  }

  if (ADMIN_IPS.length && !ADMIN_IPS.includes(ip)) {
    return res.status(403).json({ error: 'Acesso negado.' });
  }

  const { action, periodo } = req.query;
  const dias = Number({ '1d': 1, '7d': 7, '30d': 30 }[periodo] || 1);

  try {
    if (req.method === 'GET' && action === 'stats') {
      const [{ total }]       = await sql`SELECT COALESCE(SUM(anuncios_rodados),0)::int AS total FROM informacao_anuncios WHERE criado_em >= NOW() - (${dias} || ' days')::interval`;
      const hist               = await sql`SELECT DATE(criado_em) AS data, SUM(anuncios_rodados)::int AS total FROM informacao_anuncios WHERE criado_em >= NOW() - (${dias} || ' days')::interval GROUP BY DATE(criado_em) ORDER BY data DESC`;
      const [{ total: banco }] = await sql`SELECT COUNT(*)::int AS total FROM informacao_anuncios`;
      return res.status(200).json({ total, historico: hist, total_banco: banco, dias });
    }

    if (req.method === 'POST' && action === 'resetar') {
      await sql`DELETE FROM informacao_anuncios`;
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'Ação inválida.' });
  } catch (e) {
    console.error('[anuncios]', e.message);
    return res.status(500).json({ error: e.message });
  }
}