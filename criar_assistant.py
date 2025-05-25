import openai
import os
from dotenv import load_dotenv

# Carregar variáveis do .env
load_dotenv()

# Obter a chave da OpenAI
openai.api_key = os.getenv("OPENAI_API_KEY")

# Lê o conteúdo do prompt
with open("prompt_ablute.txt", "r", encoding="utf-8") as f:
    prompt_instructions = f.read()

# Criar Assistant com prompt
assistant = openai.beta.assistants.create(
    name="Relatório Clínico ablute_",
    instructions=prompt_instructions,
    model="gpt-4o",
    tools=[]
)

print("✅ Assistant criado com sucesso!")
print("Assistant ID:", assistant.id)

# (opcional) guardar numa variável
assistant_id = assistant.id
