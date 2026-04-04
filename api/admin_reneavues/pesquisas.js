/*
  ══ CRIE ESSA TABELA NO SUPABASE (SQL Editor) ══════════════

  CREATE TABLE pesquisas (
    id        BIGSERIAL PRIMARY KEY,
    ip        VARCHAR(45)   NOT NULL,
    termo     VARCHAR(500)  NOT NULL,
    nivel     TEXT          NOT NULL DEFAULT 'safe',
    criado_em TIMESTAMPTZ   NOT NULL DEFAULT NOW()
  );

  ═══════════════════════════════════════════════════════════
*/

import sql from './connection.js';

const MAX = 500;

const ADMIN_IPS = (process.env.ADMIN_IPS || '')
  .split(',').map(s => s.trim()).filter(Boolean);

function getIp(req) {
  return (req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || '')
    .split(',')[0].trim();
}

const PERIGO  = ['script','<script','select ','drop ','insert ','delete ','update ','union ','exec(','eval(','base64','alert(','document.','window.','fetch(','xmlhttp','--','or 1=1','1=1'];
const ATENCAO = ['hack','sql','admin','password','senha','root','token','api key','xss','csrf','injection','bypass','exploit','shell','curl'];

function classify(termo) {
  const t = termo.toLowerCase();
  if (PERIGO.some(p  => t.includes(p))) return 'danger';
  if (ATENCAO.some(p => t.includes(p))) return 'warn';
  return 'safe';
}

async function trimIfOver() {
  const [{ total }] = await sql`SELECT COUNT(*)::int AS total FROM pesquisas`;
  if (total >= MAX) {
    await sql`DELETE FROM pesquisas WHERE id IN (SELECT id FROM pesquisas ORDER BY criado_em ASC LIMIT ${total - MAX + 1})`;
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  const ip = getIp(req);
  const { action, periodo, search, nivel } = req.query;
  const dias = Number({ '1d': 1, '7d': 7, '30d': 30 }[periodo] || 1);

  try {
    if (req.method === 'POST' && action === 'registrar') {
      const { termo } = req.body || {};
      if (!termo) return res.status(400).json({ error: 'termo obrigatório' });
      const nivelCalc = classify(termo);
      await trimIfOver();
      await sql`INSERT INTO pesquisas (ip, termo, nivel, criado_em) VALUES (${ip}, ${termo.slice(0,500)}, ${nivelCalc}, NOW())`;
      return res.status(200).json({ ok: true, nivel: nivelCalc });
    }

    if (ADMIN_IPS.length && !ADMIN_IPS.includes(ip)) {
      return res.status(403).json({ error: 'Acesso negado.' });
    }

    if (req.method === 'GET') {
      if (action === 'historico') {
        let rows;
        const hasSearch = search && search.trim();
        const hasNivel  = nivel && nivel !== 'all';

        if (hasSearch && hasNivel) {
          rows = await sql`SELECT * FROM pesquisas WHERE criado_em >= NOW() - (${dias} || ' days')::interval AND (termo ILIKE ${'%'+search+'%'} OR ip LIKE ${'%'+search+'%'}) AND nivel = ${nivel} ORDER BY criado_em DESC LIMIT 500`;
        } else if (hasSearch) {
          rows = await sql`SELECT * FROM pesquisas WHERE criado_em >= NOW() - (${dias} || ' days')::interval AND (termo ILIKE ${'%'+search+'%'} OR ip LIKE ${'%'+search+'%'}) ORDER BY criado_em DESC LIMIT 500`;
        } else if (hasNivel) {
          rows = await sql`SELECT * FROM pesquisas WHERE criado_em >= NOW() - (${dias} || ' days')::interval AND nivel = ${nivel} ORDER BY criado_em DESC LIMIT 500`;
        } else {
          rows = await sql`SELECT * FROM pesquisas WHERE criado_em >= NOW() - (${dias} || ' days')::interval ORDER BY criado_em DESC LIMIT 500`;
        }
        return res.status(200).json({ pesquisas: rows, total: rows.length });
      }

      if (action === 'stats') {
        const [{ total }]          = await sql`SELECT COUNT(*)::int AS total FROM pesquisas WHERE criado_em >= NOW() - (${dias} || ' days')::interval`;
        const [{ total: danger }]  = await sql`SELECT COUNT(*)::int AS total FROM pesquisas WHERE nivel = 'danger' AND criado_em >= NOW() - (${dias} || ' days')::interval`;
        const [{ total: warn }]    = await sql`SELECT COUNT(*)::int AS total FROM pesquisas WHERE nivel = 'warn' AND criado_em >= NOW() - (${dias} || ' days')::interval`;
        const [{ total: banco }]   = await sql`SELECT COUNT(*)::int AS total FROM pesquisas`;
        return res.status(200).json({ total, danger, warn, total_banco: banco });
      }
    }

    if (req.method === 'POST' && action === 'resetar') {
      await sql`DELETE FROM pesquisas`;
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'Ação inválida.' });
  } catch (e) {
    console.error('[pesquisas]', e.message);
    return res.status(500).json({ error: e.message });
  }
}