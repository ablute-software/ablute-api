const fs = require("fs/promises");
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método não permitido" });
    return;
  }

  let data;
  try {
    const buffers = [];
    for await (const chunk of req) {
      buffers.push(chunk);
    }
    const raw = Buffer.concat(buffers).toString("utf8");
    data = JSON.parse(raw);
  } catch (err) {
    res.status(400).json({ error: "Erro ao interpretar JSON do pedido" });
    return;
  }

  if (!data || !data.biomarkers || !data.profileCode) {
    res.status(400).json({ error: "Dados em falta (biomarkers/profileCode)" });
    return;
  }

  let prompt;
  try {
    prompt = await fs.readFile("prompt_resultados.txt", "utf-8");
  } catch (err) {
    res.status(500).json({ error: "Erro ao ler o prompt_resultados.txt" });
    return;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-1106-preview",
      temperature: 0,
      messages: [
        { role: "system", content: prompt },
        {
          role: "user",
          content: `Aqui estão os dados da nova análise em formato JSON:\n${JSON.stringify(data, null, 2)}`,
        },
      ],
    });

    const output = completion.choices[0].message.content;

    try {
      const parsed = JSON.parse(output);
      res.status(200).json({ relatorio: parsed });
    } catch (err) {
      res.status(500).json({ error: "A resposta do GPT não é um JSON válido", raw: output });
    }
  } catch (err) {
    res.status(500).json({ error: "Erro ao gerar resposta via OpenAI", detail: err.message });
  }
};
