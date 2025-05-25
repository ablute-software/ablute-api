# ablute_ – Criação do Assistant GPT-4o via API

Este diretório permite gerar automaticamente um Assistant da OpenAI com o prompt clínico da ablute_.

## 📁 Ficheiros incluídos

- `prompt_ablute.txt` → Instruções completas para o Assistant
- `criar_assistant.py` → Script para criar o Assistant via API
- `.env.example` → Exemplo de variáveis (não incluir chaves reais em commits)

## 🚀 Como usar

1. Copia `.env.example` para `.env`
2. Adiciona a tua `OPENAI_API_KEY` e, se quiseres, o `ABLUTE_ASSISTANT_ID`
3. Instala as dependências:

```bash
pip install openai python-dotenv
