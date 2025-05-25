import openai
import os
from dotenv import load_dotenv

# Carrega variáveis do .env
load_dotenv()

# Configura a API
openai.api_key = os.getenv("OPENAI_API_KEY")
assistant_id = os.getenv("ABLUTE_ASSISTANT_ID", "asst_NU2o8LJA9DSwcYdNctzDEBMH")

# Exemplo de mensagem de input com valores simulados
input_mensagem = """
Segue o ficheiro CSV simplificado com histórico de análises. A última linha é a mais recente:

data,sexo,idade,Bristol,pH,Nitritos,NGAL,CRP,8-OHdG,Creatinina,Albumina,Glicose
2025-03-01,feminino,34,2,6.1,negativo,38,0.5,2.3,0.89,17,74
2025-05-24,feminino,34,2,6.3,negativo,43,0.7,2.1,0.92,18,68
"""

# Criar um novo thread
thread = openai.beta.threads.create()

# Enviar mensagem para o thread
openai.beta.threads.messages.create(
    thread_id=thread.id,
    role="user",
    content=input_mensagem
)

# Criar um "run" com o assistant
run = openai.beta.threads.runs.create(
    thread_id=thread.id,
    assistant_id=assistant_id,
    response_format="json"
)

# Esperar até a execução estar completa
import time
while True:
    status = openai.beta.threads.runs.retrieve(thread_id=thread.id, run_id=run.id)
    if status.status == "completed":
        break
    elif status.status in ["failed", "cancelled"]:
        print("❌ A execução falhou:", status.status)
        exit()
    time.sleep(1)

# Obter a resposta final
messages = openai.beta.threads.messages.list(thread_id=thread.id)
resposta = messages.data[0].content[0].text.value

print("📋 RESPOSTA:")
print(resposta)
