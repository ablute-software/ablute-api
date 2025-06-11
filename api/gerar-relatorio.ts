import { NextRequest, NextResponse } from "next/server";
import { ChatCompletionMessageParam, OpenAI } from "openai";
import fs from "fs/promises";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    if (!data || !data.biomarkers || !data.profileCode) {
      return NextResponse.json({ error: "Dados em falta no corpo do pedido" }, { status: 400 });
    }

    // Carregar prompt
    const prompt = await fs.readFile("prompt_resultados.txt", "utf-8");

    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: prompt },
      {
        role: "user",
        content: `Aqui estão os dados da nova análise em formato JSON:\n${JSON.stringify(data, null, 2)}`,
      },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4-1106-preview",
      temperature: 0,
      messages,
    });

    const content = completion.choices[0].message?.content || "";

    let relatorio: any;
    try {
      relatorio = JSON.parse(content);
    } catch {
      return NextResponse.json({ error: "A resposta do GPT não é JSON válido", raw: content }, { status: 500 });
    }

    return NextResponse.json({ relatorio });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
