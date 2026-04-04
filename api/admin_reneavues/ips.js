import sql from './connection.js';

const ADMIN_IPS = (process.env.ADMIN_IPS || '')
  .split(',').map(s => s.trim()).filter(Boolean);

function getIp(req) {
  return (req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || '')
    .split(',')[0].trim();
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  const ip = getIp(req);
  const { action } = req.query;

  try {
    if (action === 'check') {
      const rows = await sql`SELECT ip, motivo FROM ips_bloqueados WHERE ip = ${ip} LIMIT 1`;
      const row = rows[0] || {};
      return res.status(200).json({ 
        bloqueado: rows.length > 0, 
        motivo: row.motivo || null,
        ip 
      });
    }

    if (ADMIN_IPS.length && !ADMIN_IPS.includes(ip)) {
      return res.status(403).json({ error: 'Acesso negado.' });
    }

    if (req.method === 'GET' && action === 'listar') {
      const rows = await sql`SELECT ip, motivo, criado_em FROM ips_bloqueados ORDER BY criado_em DESC LIMIT 200`;
      return res.status(200).json({ ips: rows, total: rows.length });
    }

    if (req.method === 'POST') {
      if (action === 'bloquear') {
        const { ip: alvo, motivo } = req.body || {};
        if (!alvo) return res.status(400).json({ error: 'IP obrigatório' });
        if (ADMIN_IPS.includes(alvo)) return res.status(400).json({ error: 'Não é possível bloquear um IP admin.' });
        await sql`
          INSERT INTO ips_bloqueados (ip, motivo, criado_em)
          VALUES (${alvo}, ${motivo || 'bloqueado manualmente'}, NOW())
          ON CONFLICT (ip) DO UPDATE SET motivo = EXCLUDED.motivo, criado_em = NOW()
        `;
        return res.status(200).json({ ok: true });
      }

      if (action === 'desbloquear') {
        const { ip: alvo } = req.body || {};
        if (!alvo) return res.status(400).json({ error: 'IP obrigatório' });
        await sql`DELETE FROM ips_bloqueados WHERE ip = ${alvo}`;
        return res.status(200).json({ ok: true });
      }
    }

    return res.status(400).json({ error: 'Ação inválida.' });
  } catch (e) {
    console.error('[ips]', e.message);
    return res.status(500).json({ error: e.message });
  }
}