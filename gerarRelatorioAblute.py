import json
import requests
import os
from dotenv import load_dotenv
from typing import Dict, Any

def gerarRelatorioAblute(dados_exame: Dict[str, Any]) -> Dict[str, Any]:
    """
    Gera um relatório usando a API do GPT-4 com base nos dados do exame.
    """
    load_dotenv()
    API_URL = "https://api.openai.com/v1/chat/completions"
    API_KEY = os.getenv("OPENAI_API_KEY")

    if not API_KEY:
        raise ValueError("OPENAI_API_KEY não encontrada nas variáveis de ambiente")

    try:
        with open("prompt_resultados.txt", "r", encoding="utf-8") as file:
            system_prompt = file.read().strip()
    except FileNotFoundError:
        raise FileNotFoundError("Arquivo prompt_resultados.txt não encontrado")

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}"
    }

    payload = {
        "model": "gpt-4-1106-preview",
        "temperature": 0.7,
        "messages": [
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": f"Aqui estão os dados da nova análise em formato JSON:\n{json.dumps(dados_exame, ensure_ascii=False)}"
            }
        ]
    }

    try:
        response = requests.post(API_URL, headers=headers, json=payload)
        response.raise_for_status()
        result = response.json()
        gpt_response = result["choices"][0]["message"]["content"]

        try:
            report_data = json.loads(gpt_response)
        except json.JSONDecodeError:
            raise ValueError("Resposta do GPT não é um JSON válido")

        relatorio = {
            "interpretacao_inicial": report_data.get("interpretacao_inicial"),
            "memoria_longitudinal": report_data.get("memoria_longitudinal"),
            "destaque_subclinico": report_data.get("destaque_subclinico"),
            "outras_informacoes_relevantes": report_data.get("outras_informacoes_relevantes"),
            "potenciais_otimizacao": report_data.get("potenciais_otimizacao"),
            "plano_otimizacao": report_data.get("plano_otimizacao"),
            "reforco_vigilancia": report_data.get("reforco_vigilancia"),
            "conclusao": report_data.get("conclusao"),
            "nova_analise": report_data.get("nova_analise")
        }

        with open("relatorio_output.json", "w", encoding="utf-8") as f:
            json.dump(relatorio, f, indent=2, ensure_ascii=False)

        return relatorio

    except requests.exceptions.RequestException as e:
        raise Exception(f"Erro na requisição à API: {str(e)}")
    except KeyError as e:
        raise Exception(f"Resposta da API em formato inesperado: {str(e)}")

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
        relatorio = gerarRelatorioAblute(dados_exemplo)
        print("Relatório estruturado:")
        print(json.dumps(relatorio, indent=2, ensure_ascii=False))
    except Exception as e:
        print(f"Erro ao gerar relatório: {str(e)}")