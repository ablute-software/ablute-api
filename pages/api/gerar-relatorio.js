import fs from "fs/promises";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método não permitido" });
    return;
  }

  const data = req.body;

  if (!data?.biomarkers || !data?.profileCode) {
    res.status(400).json({ error: "Faltam dados (biomarkers/profileCode)" });
    return;
  }

  let prompt;
  try {
    prompt = await fs.readFile("prompt_resultados.txt", "utf-8");
  } catch (err) {
    res.status(500).json({ error: "Erro ao ler o prompt", detalhe: err.message });
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
          content: `Aqui estão os dados da nova análise em JSON:\n${JSON.stringify(data, null, 2)}`
        }
      ]
    });

    const output = completion.choices[0].message.content;

    try {
     res.status(200).json({ relatorio: output });
    } catch {
      res.status(500).json({ error: "A resposta não é JSON válido", raw: output });
    }
  } catch (err) {
    res.status(500).json({ error: "Erro OpenAI", detalhe: err.message });
  }
}
