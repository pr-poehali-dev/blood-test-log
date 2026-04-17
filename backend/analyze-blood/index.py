"""
Распознавание показателей крови из фото/PDF бланка с помощью GPT-4 Vision.
Принимает base64-изображение, возвращает структурированные данные анализа.
"""
import json
import os
import base64
import urllib.request
import urllib.error


def handler(event: dict, context) -> dict:
    cors_headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers, "body": ""}

    if event.get("httpMethod") != "POST":
        return {
            "statusCode": 405,
            "headers": cors_headers,
            "body": json.dumps({"error": "Method not allowed"}),
        }

    body = json.loads(event.get("body") or "{}")
    image_data = body.get("image")
    mime_type = body.get("mimeType", "image/jpeg")

    if not image_data:
        return {
            "statusCode": 400,
            "headers": cors_headers,
            "body": json.dumps({"error": "Поле image обязательно"}),
        }

    api_key = os.environ.get("OPENAI_API_KEY", "")
    if not api_key:
        return {
            "statusCode": 500,
            "headers": cors_headers,
            "body": json.dumps({"error": "OPENAI_API_KEY не настроен"}),
        }

    prompt = """Ты — медицинская система распознавания анализов крови.
Внимательно изучи изображение бланка с результатами анализа крови.

Извлеки ВСЕ показатели, которые видишь на бланке.

Верни ТОЛЬКО JSON объект без каких-либо пояснений, в следующем формате:
{
  "date": "дата анализа в формате DD.MM.YYYY или null",
  "lab": "название лаборатории или null",
  "patient": "имя пациента или null",
  "results": [
    {
      "name": "Название показателя на русском",
      "value": числовое_значение,
      "unit": "единица измерения",
      "normMin": минимальное_значение_нормы_или_null,
      "normMax": максимальное_значение_нормы_или_null,
      "status": "normal" | "high" | "low" | "unknown"
    }
  ]
}

Если на изображении нет бланка анализа крови — верни {"error": "Не удалось распознать бланк анализа"}.
Не добавляй ничего кроме JSON."""

    payload = {
        "model": "gpt-4o",
        "max_tokens": 2000,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{mime_type};base64,{image_data}",
                            "detail": "high",
                        },
                    },
                ],
            }
        ],
    }

    req_data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=req_data,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            response_data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        return {
            "statusCode": 502,
            "headers": cors_headers,
            "body": json.dumps({"error": f"OpenAI API ошибка: {error_body}"}),
        }

    raw_content = response_data["choices"][0]["message"]["content"].strip()

    # Убираем markdown code block если есть
    if raw_content.startswith("```"):
        lines = raw_content.split("\n")
        lines = [l for l in lines if not l.startswith("```")]
        raw_content = "\n".join(lines)

    parsed = json.loads(raw_content)

    if "error" in parsed:
        return {
            "statusCode": 422,
            "headers": cors_headers,
            "body": json.dumps(parsed),
        }

    return {
        "statusCode": 200,
        "headers": cors_headers,
        "body": json.dumps(parsed, ensure_ascii=False),
    }
