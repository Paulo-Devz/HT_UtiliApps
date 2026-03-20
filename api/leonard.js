export default async function handler(req, res) {
  const { prompt } = req.body;

  const response = await fetch("https://cloud.leonardo.ai/api/rest/v1/generations", {
    method: "POST",
    headers: {
      "Authorization": `Bearer SUA_API_KEY`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prompt: prompt,
      width: 512,
      height: 512
    })
  });

  const data = await response.json();

  res.status(200).json(data);
}