export default function handler(req, res) {
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.socket.remoteAddress ||
    '';

  console.log('IP RECEBIDO:', ip);
  
  const allowed = (process.env.ADMIN_IPS || '')
    .split(',')
    .map(ip => ip.trim())
    .filter(Boolean);

  if (!allowed.includes(ip)) {
    return res.status(403).json({ error: 'bloqueado' });
  }

  return res.status(200).json({ ok: true });
}