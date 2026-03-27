export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const { prompt, max_tokens, json_mode, image } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt ausente.' });

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ error: 'GROQ_API_KEY não configurada.' });
  }

  try {
    let messages;

    if (image && image.data) {
      messages = [{
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:${image.type || 'image/jpeg'};base64,${image.data}`
            }
          },
          { type: 'text', text: prompt }
        ]
      }];
    } else {
      messages = [{ role: 'user', content: prompt }];
    }

    const body = {
      model: image ? 'meta-llama/llama-4-scout-17b-16e-instruct' : 'llama-3.3-70b-versatile',
      max_tokens: max_tokens || 1024,
      messages,
    };

    if (json_mode && !image) {
      body.response_format = { type: 'json_object' };
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify(body),
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