import sql from './connection.js';

const MAX = 500;

const ADMIN_IPS = (process.env.ADMIN_IPS || '')
  .split(',').map(s => s.trim()).filter(Boolean);

function getIp(req) {
  return (req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || '')
    .split(',')[0].trim();
}

async function trimIfOver() {
  const [{ total }] = await sql`SELECT COUNT(*)::int AS total FROM informacoes_progama`;
  if (total >= MAX) {
    await sql`
      DELETE FROM informacoes_progama
      WHERE id IN (
        SELECT id FROM informacoes_progama ORDER BY criado_em ASC LIMIT ${total - MAX + 1}
      )
    `;
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  const ip  = getIp(req);
  const { action, periodo, search } = req.query;
  const dias = Number({ '1d': 1, '7d': 7, '30d': 30 }[periodo] || 1);

  try {
    if (req.method === 'POST' && action === 'registrar') {
      const { nome } = req.body || {};
      if (!nome) return res.status(400).json({ error: 'nome obrigatório' });
      if (ADMIN_IPS.length && !ADMIN_IPS.includes(ip)) return res.status(403).end();
      await trimIfOver();
      await sql`
        INSERT INTO informacoes_progama (data_progama, ip, progama_nome, criado_em)
        VALUES (NOW(), ${ip}, ${nome}, NOW())
      `;
      return res.status(200).json({ ok: true });
    }

    if (ADMIN_IPS.length && !ADMIN_IPS.includes(ip)) {
      return res.status(403).json({ error: 'Acesso negado.' });
    }

    if (req.method === 'GET') {
      if (action === 'historico') {
        const rows = search
          ? await sql`
              SELECT id, data_progama, ip, progama_nome, criado_em
              FROM informacoes_progama
              WHERE criado_em >= NOW() - (${dias} || ' days')::interval
                AND (progama_nome ILIKE ${'%' + search + '%'} OR ip LIKE ${'%' + search + '%'})
              ORDER BY criado_em DESC LIMIT 500`
          : await sql`
              SELECT id, data_progama, ip, progama_nome, criado_em
              FROM informacoes_progama
              WHERE criado_em >= NOW() - (${dias} || ' days')::interval
              ORDER BY criado_em DESC LIMIT 500`;
        return res.status(200).json({ historico: rows, total: rows.length });
      }

      if (action === 'ranking') {
        const rows = await sql`
          SELECT progama_nome, COUNT(*)::int AS usos
          FROM informacoes_progama
          WHERE criado_em >= NOW() - (${dias} || ' days')::interval
          GROUP BY progama_nome ORDER BY usos DESC LIMIT 20`;
        return res.status(200).json({ ranking: rows });
      }

      if (action === 'stats') {
        const [{ total }]        = await sql`SELECT COUNT(*)::int AS total FROM informacoes_progama WHERE criado_em >= NOW() - (${dias} || ' days')::interval`;
        const [{ total: unicos }] = await sql`SELECT COUNT(DISTINCT progama_nome)::int AS total FROM informacoes_progama WHERE criado_em >= NOW() - (${dias} || ' days')::interval`;
        const top                 = await sql`SELECT progama_nome FROM informacoes_progama WHERE criado_em >= NOW() - (${dias} || ' days')::interval GROUP BY progama_nome ORDER BY COUNT(*) DESC LIMIT 1`;
        const [{ total: banco }]  = await sql`SELECT COUNT(*)::int AS total FROM informacoes_progama`;
        return res.status(200).json({
          acessos: total, unicos, top: top[0]?.progama_nome || '—', total_banco: banco
        });
      }
    }

    if (req.method === 'POST' && action === 'resetar') {
      await sql`DELETE FROM informacoes_progama`;
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'Ação inválida.' });
  } catch (e) {
    console.error('[progamas]', e.message);
    return res.status(500).json({ error: e.message });
  }
}