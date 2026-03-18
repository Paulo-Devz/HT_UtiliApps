// HT_UtiliApps/api/ai.js

export const config = {
  maxDuration: 30, // aumenta o limite pro Vercel não cortar
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const { prompt, max_tokens } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt ausente.' });

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ error: 'GROQ_API_KEY não configurada.' });
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model:      'llama-3.1-8b-instant', // modelo mais rápido, evita timeout
        max_tokens: max_tokens || 1000,
        messages:   [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: `Groq: ${data.error?.message || JSON.stringify(data)}` });
    }

    const result = data.choices?.[0]?.message?.content?.trim();
    if (!result) throw new Error('Resposta vazia.');

    res.status(200).json({ result });
  } catch (e) {
    console.error('[api/ai]', e.message);
    res.status(500).json({ error: e.message });
  }
}