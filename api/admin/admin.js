import postgres from 'postgres';

const sqlClient = postgres({
  host:     'aws-1-us-east-1.pooler.supabase.com',
  port:      5432,
  database: 'postgres',
  username: 'postgres.pxjgpblwibzozgniumix',
  password: process.env.DB_PASSWORD || 'Paodequeij0.',
  ssl:      'require',
  prepare:  false,
  max:      1,
});

const ADMIN_IPS = (process.env.ADMIN_IPS || '')
  .split(',').map(s => s.trim()).filter(Boolean);

function getIp(req) {
  return (req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || '')
    .split(',')[0].trim();
}

// ====== IPS HANDLER ======
async function handleIps(req, res, ip, action) {
  try {
    if (action === 'check') {
      const rows = await sqlClient`SELECT ip, motivo FROM ips_bloqueados WHERE ip = ${ip} LIMIT 1`;
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
      const rows = await sqlClient`SELECT ip, motivo, criado_em FROM ips_bloqueados ORDER BY criado_em DESC LIMIT 200`;
      return res.status(200).json({ ips: rows, total: rows.length });
    }

    if (req.method === 'POST') {
      if (action === 'bloquear') {
        const { ip: alvo, motivo } = req.body || {};
        if (!alvo) return res.status(400).json({ error: 'IP obrigatório' });
        if (ADMIN_IPS.includes(alvo)) return res.status(400).json({ error: 'Não é possível bloquear IP admin.' });
        const result = await sqlClient`
          INSERT INTO ips_bloqueados (ip, motivo, criado_em)
          VALUES (${alvo}, ${motivo || 'bloqueado manualmente'}, NOW())
          ON CONFLICT (ip) DO UPDATE SET motivo = EXCLUDED.motivo, criado_em = NOW()
          RETURNING *
        `;
        console.log('IP bloqueado:', result[0]);
        return res.status(200).json({ ok: true });

      }

      if (action === 'desbloquear') {
        const { ip: alvo } = req.body || {};
        if (!alvo) return res.status(400).json({ error: 'IP obrigatório' });
        await sqlClient`DELETE FROM ips_bloqueados WHERE ip = ${alvo}`;
        return res.status(200).json({ ok: true });
      }
    }

      if (action === 'resetar') {
        await sqlClient`DELETE FROM ips_bloqueados`;
        return res.status(200).json({ ok: true });
      }

    return res.status(400).json({ error: 'Ação inválida ips.' });
  } catch (e) {
    console.error('[admin-ips]', e.message);
    return res.status(500).json({ error: e.message });
  }
}

// ====== ANUNCIOS HANDLER ======
async function handleAnuncios(req, res, ip, action, periodo) {
  const dias = Number({ '1d': 1, '7d': 7, '30d': 30 }[periodo] || 1);
  const MAX = 500;

  try {
    if (req.method === 'POST' && action === 'registrar') {
      await sqlClient`
        INSERT INTO informacao_anuncios (anuncios_rodados, criado_em) VALUES (1, NOW())
      `;
      const [{ total }] = await sqlClient`SELECT COUNT(*)::int AS total FROM informacao_anuncios`;
      if (total > MAX) {
        await sqlClient`DELETE FROM informacao_anuncios WHERE id IN (SELECT id FROM informacao_anuncios ORDER BY criado_em ASC LIMIT 1)`;
      }
      return res.status(200).json({ ok: true });
    }

    if (ADMIN_IPS.length && !ADMIN_IPS.includes(ip)) {
      return res.status(403).json({ error: 'Acesso negado.' });
    }

    if (req.method === 'GET' && action === 'stats') {
      const [{ total }] = await sqlClient`SELECT COALESCE(SUM(anuncios_rodados),0)::int AS total FROM informacao_anuncios WHERE criado_em >= NOW() - (${dias} || ' days')::interval`;
      const hist = await sqlClient`SELECT DATE(criado_em) AS data, SUM(anuncios_rodados)::int AS total FROM informacao_anuncios WHERE criado_em >= NOW() - (${dias} || ' days')::interval GROUP BY DATE(criado_em) ORDER BY data DESC`;
      const [{ total: banco }] = await sqlClient`SELECT COUNT(*)::int AS total FROM informacao_anuncios`;
      return res.status(200).json({ total, historico: hist, total_banco: banco, dias });
    }

    if (req.method === 'POST' && action === 'resetar') {
      await sqlClient`DELETE FROM informacao_anuncios`;
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'Ação inválida anuncios.' });
  } catch (e) {
    console.error('[admin-anuncios]', e.message);
    return res.status(500).json({ error: e.message });
  }
}

// ====== PROGAMAS HANDLER ======
async function handleProgamas(req, res, ip, action, periodo, search) {
  const dias = Number({ '1d': 1, '7d': 7, '30d': 30 }[periodo] || 1);
  const MAX = 500;

  const trimIfOver = async () => {
    const [{ total }] = await sqlClient`SELECT COUNT(*)::int AS total FROM informacoes_progama`;
    if (total >= MAX) {
      await sqlClient`DELETE FROM informacoes_progama WHERE id IN (SELECT id FROM informacoes_progama ORDER BY criado_em ASC LIMIT ${total - MAX + 1})`;
    }
  };

  try {
    if (req.method === 'POST' && action === 'registrar') {
      const { nome } = req.body || {};
      if (!nome) return res.status(400).json({ error: 'nome obrigatório' });
      if (ADMIN_IPS.length && !ADMIN_IPS.includes(ip)) return res.status(403).end();
      await trimIfOver();
      await sqlClient`INSERT INTO informacoes_progama (data_progama, ip, progama_nome, criado_em) VALUES (NOW(), ${ip}, ${nome}, NOW())`;
      return res.status(200).json({ ok: true });
    }

    if (ADMIN_IPS.length && !ADMIN_IPS.includes(ip)) {
      return res.status(403).json({ error: 'Acesso negado.' });
    }

    if (req.method === 'GET') {
      if (action === 'historico') {
        let rows;
        if (search) {
          rows = await sqlClient`SELECT id, data_progama, ip, progama_nome, criado_em FROM informacoes_progama WHERE criado_em >= NOW() - (${dias} || ' days')::interval AND (progama_nome ILIKE ${'%' + search + '%'} OR ip LIKE ${'%' + search + '%'}) ORDER BY criado_em DESC LIMIT 500`;
        } else {
          rows = await sqlClient`SELECT id, data_progama, ip, progama_nome, criado_em FROM informacoes_progama WHERE criado_em >= NOW() - (${dias} || ' days')::interval ORDER BY criado_em DESC LIMIT 500`;
        }
        return res.status(200).json({ historico: rows, total: rows.length });
      }

      if (action === 'ranking') {
        const rows = await sqlClient`SELECT progama_nome, COUNT(*)::int AS usos FROM informacoes_progama WHERE criado_em >= NOW() - (${dias} || ' days')::interval GROUP BY progama_nome ORDER BY usos DESC LIMIT 20`;
        return res.status(200).json({ ranking: rows });
      }

      if (action === 'stats') {
        const [{ total }] = await sqlClient`SELECT COUNT(*)::int AS total FROM informacoes_progama WHERE criado_em >= NOW() - (${dias} || ' days')::interval`;
        const [{ total: unicos }] = await sqlClient`SELECT COUNT(DISTINCT progama_nome)::int AS total FROM informacoes_progama WHERE criado_em >= NOW() - (${dias} || ' days')::interval`;
        const top = await sqlClient`SELECT progama_nome FROM informacoes_progama WHERE criado_em >= NOW() - (${dias} || ' days')::interval GROUP BY progama_nome ORDER BY COUNT(*) DESC LIMIT 1`;
        const [{ total: banco }] = await sqlClient`SELECT COUNT(*)::int AS total FROM informacoes_progama`;
        return res.status(200).json({ acessos: total, unicos, top: top[0]?.progama_nome || '—', total_banco: banco });
      }
    }

    if (req.method === 'POST' && action === 'resetar') {
      await sqlClient`DELETE FROM informacoes_progama`;
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'Ação inválida progamas.' });
  } catch (e) {
    console.error('[admin-progamas]', e.message);
    return res.status(500).json({ error: e.message });
  }
}

// ====== PESQUISAS HANDLER ======
async function handlePesquisas(req, res, ip, action, periodo, search, nivel) {
  const dias = Number({ '1d': 1, '7d': 7, '30d': 30 }[periodo] || 1);
  const MAX = 500;

  const PERIGO = ['script','<script','select ','drop ','insert ','delete ','update ','union ','exec(','eval(','base64','alert(','document.','window.','fetch(','xmlhttp','--','or 1=1','1=1'];
  const ATENCAO = ['hack','sql','admin','password','senha','root','token','api key','xss','csrf','injection','bypass','exploit','shell','curl'];

  function classify(termo) {
    const t = termo.toLowerCase();
    if (PERIGO.some(p => t.includes(p))) return 'danger';
    if (ATENCAO.some(p => t.includes(p))) return 'warn';
    return 'safe';
  }

  const trimIfOver = async () => {
    const [{ total }] = await sqlClient`SELECT COUNT(*)::int AS total FROM pesquisas`;
    if (total >= MAX) {
      await sqlClient`DELETE FROM pesquisas WHERE id IN (SELECT id FROM pesquisas ORDER BY criado_em ASC LIMIT ${total - MAX + 1})`;
    }
  };

  try {
    if (req.method === 'POST' && action === 'registrar') {
      const { termo } = req.body || {};
      if (!termo) return res.status(400).json({ error: 'termo obrigatório' });
      const nivelCalc = classify(termo);
      await trimIfOver();
      await sqlClient`INSERT INTO pesquisas (ip, termo, nivel, criado_em) VALUES (${ip}, ${termo.slice(0,500)}, ${nivelCalc}, NOW())`;
      return res.status(200).json({ ok: true, nivel: nivelCalc });
    }

    if (ADMIN_IPS.length && !ADMIN_IPS.includes(ip)) {
      return res.status(403).json({ error: 'Acesso negado.' });
    }

    if (req.method === 'GET') {
      if (action === 'historico') {
        let rows;
        const hasSearch = search && search.trim();
        const hasNivel = nivel && nivel !== 'all';
        if (hasSearch && hasNivel) {
          rows = await sqlClient`SELECT * FROM pesquisas WHERE criado_em >= NOW() - (${dias} || ' days')::interval AND (termo ILIKE ${'%'+search+'%'} OR ip LIKE ${'%'+search+'%'}) AND nivel = ${nivel} ORDER BY criado_em DESC LIMIT 500`;
        } else if (hasSearch) {
          rows = await sqlClient`SELECT * FROM pesquisas WHERE criado_em >= NOW() - (${dias} || ' days')::interval AND (termo ILIKE ${'%'+search+'%'} OR ip LIKE ${'%'+search+'%'}) ORDER BY criado_em DESC LIMIT 500`;
        } else if (hasNivel) {
          rows = await sqlClient`SELECT * FROM pesquisas WHERE criado_em >= NOW() - (${dias} || ' days')::interval AND nivel = ${nivel} ORDER BY criado_em DESC LIMIT 500`;
        } else {
          rows = await sqlClient`SELECT * FROM pesquisas WHERE criado_em >= NOW() - (${dias} || ' days')::interval ORDER BY criado_em DESC LIMIT 500`;
        }
        return res.status(200).json({ pesquisas: rows, total: rows.length });
      }

      if (action === 'stats') {
        const [{ total }] = await sqlClient`SELECT COUNT(*)::int AS total FROM pesquisas WHERE criado_em >= NOW() - (${dias} || ' days')::interval`;
        const [{ total: danger }] = await sqlClient`SELECT COUNT(*)::int AS total FROM pesquisas WHERE nivel = 'danger' AND criado_em >= NOW() - (${dias} || ' days')::interval`;
        const [{ total: warn }] = await sqlClient`SELECT COUNT(*)::int AS total FROM pesquisas WHERE nivel = 'warn' AND criado_em >= NOW() - (${dias} || ' days')::interval`;
        const [{ total: banco }] = await sqlClient`SELECT COUNT(*)::int AS total FROM pesquisas`;
        return res.status(200).json({ total, danger, warn, total_banco: banco });
      }
    }

    if (req.method === 'POST' && action === 'resetar') {
      await sqlClient`DELETE FROM pesquisas`;
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'Ação inválida pesquisas.' });
  } catch (e) {
    console.error('[admin-pesquisas]', e.message);
    return res.status(500).json({ error: e.message });
  }
}

// ====== MAIN ROUTER ======
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  const ip = getIp(req);
  const { section, action, periodo, search, nivel } = req.query;

  if (!section) {
    return res.status(400).json({ error: 'section requerida (ips|anuncios|programas|pesquisas)' });
  }

  switch (section) {
    case 'ips':
      return handleIps(req, res, ip, action);
    case 'anuncios':
      return handleAnuncios(req, res, ip, action, periodo);
case 'programas':
      return handleProgamas(req, res, ip, action, periodo, search);
    case 'pesquisas':
      return handlePesquisas(req, res, ip, action, periodo, search, nivel);
    default:
      return res.status(400).json({ error: 'Section inválida' });
  }
}

