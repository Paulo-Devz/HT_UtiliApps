// HT_UtiliApps/api/ai.js
// Rota genérica — use em qualquer app futuro com:
// fetch('/api/ai', { method: 'POST', body: JSON.stringify({ prompt }) })

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const { prompt, max_tokens } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt ausente.' });

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model:      'llama-3.3-70b-versatile',
        max_tokens: max_tokens || 1000,
        messages:   [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Erro na API.');

    const result = data.choices?.[0]?.message?.content?.trim();
    if (!result) throw new Error('Resposta vazia.');

    res.status(200).json({ result });
  } catch (e) {
    console.error('[api/ai]', e.message);
    res.status(500).json({ error: e.message });
  }
}