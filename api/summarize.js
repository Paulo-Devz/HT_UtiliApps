// HT_UtiliApps/api/summarize.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt ausente.' });

  // Checa se a chave existe
  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ error: 'GROQ_API_KEY não configurada no .env' });
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model:      'llama-3.3-70b-versatile',
        max_tokens: 1000,
        messages:   [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();

    // Mostra o erro exato do Groq se houver
    if (!response.ok) {
      return res.status(500).json({ error: `Groq: ${data.error?.message || JSON.stringify(data)}` });
    }

    const summary = data.choices?.[0]?.message?.content?.trim();
    if (!summary) {
      return res.status(500).json({ error: 'Groq retornou resposta vazia. Tente novamente.' });
    }

    res.status(200).json({ summary });

  } catch (e) {
    console.error('[summarize]', e.message);
    res.status(500).json({ error: e.message });
  }
}