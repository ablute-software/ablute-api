import os
import json
import time
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

ASSISTANT_ID = "asst_buwHpaxeKRuwZeNqsJujKtJJ"

def gerarRelatorioAblute_final(dados_exame: dict) -> dict:
    thread = client.beta.threads.create()
    print("✅ Thread criada:", thread.id)

    input_msg = f"Dados da análise:\n{json.dumps(dados_exame, ensure_ascii=False)}"
    client.beta.threads.messages.create(
        thread_id=thread.id,
        role="user",
        content=input_msg
    )
    print("📩 Mensagem enviada.")

    run = client.beta.threads.runs.create(
        thread_id=thread.id,
        assistant_id=ASSISTANT_ID
    )
    print("🚀 Run iniciado:", run.id)

    print("⏳ A aguardar conclusão...")
    for _ in range(30):  # timeout de 30 segundos
        run_status = client.beta.threads.runs.retrieve(thread_id=thread.id, run_id=run.id)
        if run_status.status == "completed":
            break
        elif run_status.status == "failed":
            raise RuntimeError("Execução do assistant falhou.")
        time.sleep(1)

    messages = client.beta.threads.messages.list(thread_id=thread.id)
    response_text = messages.data[0].content[0].text.value

    print("📤 Resposta bruta recebida:")
    print(response_text)

    try:
        resultado = json.loads(response_text)
    except json.JSONDecodeError as e:
        print("❌ Erro ao converter resposta em JSON:", e)
        raise ValueError("A resposta do Assistant não é JSON válido.")

    with open("relatorio_output.json", "w", encoding="utf-8") as f:
        json.dump(resultado, f, indent=2, ensure_ascii=False)

    print("✅ Relatório guardado em relatorio_output.json")
    return resultado


if __name__ == "__main__":
    dados_exemplo = {
        "user_id": "U001",
        "exam_id": "EX20240522",
        "profile": {
            "age": 47,
            "sex": "feminino",
            "last_exam_weeks_ago": 8,
            "symptoms": ["pele seca"],
            "notes": ["sedentarismo moderado", "stress laboral"]
        },
        "biomarkers": {
            "nitritos": "negativo",
            "NGAL": "78 ng/mL",
            "CRP": "0.9 mg/L",
            "8-OHdG": "4.4 ng/mL",
            "creatinina": "0.74 mg/dL",
            "albumina": "40 g/L",
            "glicose": "92 mg/dL",
            "pH": "6.1"
        },
        "feces": {
            "bristol": 2,
            "volume": "pequeno",
            "consistencia": "fragmentada"
        },
        "historico": {
            "data_ultima_analise": "2025-03-27",
            "resumo_anterior": {
                "interpretacao_inicial": "Stress oxidativo leve e obstipação funcional.",
                "tema_principal": "pele seca + digestão lenta",
                "alertas": ["8-OHdG no limite", "Bristol tipo 2"],
                "acao_recomendada": "hidratar melhor e melhorar trânsito intestinal",
                "foi_repetido_rapidamente": True
            }
        }
    }

    try:
        gerarRelatorioAblute_final(dados_exemplo)
    except Exception as e:
        print(f"❌ Erro final: {e}")