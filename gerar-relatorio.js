import fs from "fs/promises";
import path from "path";
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
    const filePath = path.join(process.cwd(), "public", "prompt_resultados.txt");
    prompt = await fs.readFile(filePath, "utf-8");
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

    // ⚠️ Tentamos fazer parse como JSON. Se falhar, devolvemos o texto diretamente.
    try {
      const parsed = JSON.parse(output);
      res.status(200).json({ relatorio: parsed });
    } catch {
      res.status(200).json({ relatorio: output });
    }
  } catch (err) {
    res.status(500).json({ error: "Erro OpenAI", detalhe: err.message });
  }
}
