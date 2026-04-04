import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { ip } = req.query;
  if (!ip) {
    return res.status(400).json({ error: 'IP requerido' });
  }

  try {
    const bannedFile = path.join(process.cwd(), 'api/banned-ips.json');
    const bannedData = JSON.parse(fs.readFileSync(bannedFile, 'utf8'));
    
    const isBlocked = bannedData.ips.includes(ip);
    const motivo = isBlocked ? bannedData.motivos[ip] || 'IP bloqueado por violação de políticas' : null;

    res.status(200).json({
      bloqueado: isBlocked,
      motivo,
      ip
    });
  } catch (error) {
    console.error('Erro block-check:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
}

