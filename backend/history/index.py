"""
История анализов крови: сохранение и получение.
GET /  — список всех анализов с результатами
POST / — сохранить новый анализ
GET /?indicator=Гемоглобин — динамика конкретного показателя
"""
import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = "t_p83787157_blood_test_log"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}

    if method == "GET":
        indicator = params.get("indicator")
        if indicator:
            return get_indicator_trend(indicator)
        return get_history()

    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        return save_analysis(body)

    return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "Method not allowed"})}


def get_history():
    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    cur.execute(f"""
        SELECT
            a.id,
            a.created_at,
            a.analysis_date,
            a.lab,
            a.patient,
            a.file_name,
            json_agg(
                json_build_object(
                    'id', r.id,
                    'name', r.name,
                    'value', r.value::float,
                    'unit', r.unit,
                    'norm_min', r.norm_min::float,
                    'norm_max', r.norm_max::float,
                    'status', r.status
                ) ORDER BY r.name
            ) AS results
        FROM {SCHEMA}.analyses a
        LEFT JOIN {SCHEMA}.results r ON r.analysis_id = a.id
        GROUP BY a.id
        ORDER BY a.created_at DESC
        LIMIT 50
    """)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    analyses = []
    for row in rows:
        analyses.append({
            "id": str(row["id"]),
            "created_at": row["created_at"].isoformat(),
            "analysis_date": row["analysis_date"].isoformat() if row["analysis_date"] else None,
            "lab": row["lab"],
            "patient": row["patient"],
            "file_name": row["file_name"],
            "results": [r for r in (row["results"] or []) if r["name"] is not None],
        })

    return {"statusCode": 200, "headers": CORS, "body": json.dumps({"analyses": analyses}, ensure_ascii=False)}


def get_indicator_trend(indicator: str):
    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    cur.execute(f"""
        SELECT
            a.analysis_date,
            a.created_at,
            r.value::float,
            r.unit,
            r.norm_min::float,
            r.norm_max::float,
            r.status
        FROM {SCHEMA}.results r
        JOIN {SCHEMA}.analyses a ON a.id = r.analysis_id
        WHERE r.name = %s
        ORDER BY COALESCE(a.analysis_date, a.created_at::date) ASC
        LIMIT 24
    """, (indicator,))
    rows = cur.fetchall()
    cur.close()
    conn.close()

    points = []
    for row in rows:
        date = row["analysis_date"].isoformat() if row["analysis_date"] else row["created_at"].date().isoformat()
        points.append({
            "date": date,
            "value": row["value"],
            "unit": row["unit"],
            "norm_min": row["norm_min"],
            "norm_max": row["norm_max"],
            "status": row["status"],
        })

    return {"statusCode": 200, "headers": CORS, "body": json.dumps({"indicator": indicator, "points": points}, ensure_ascii=False)}


def save_analysis(body: dict):
    date_str = body.get("date")
    lab = body.get("lab")
    patient = body.get("patient")
    file_name = body.get("file_name")
    results = body.get("results", [])

    if not results:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Нет показателей для сохранения"})}

    conn = get_conn()
    cur = conn.cursor()

    analysis_date = None
    if date_str:
        try:
            from datetime import datetime
            for fmt in ("%d.%m.%Y", "%Y-%m-%d", "%d/%m/%Y"):
                try:
                    analysis_date = datetime.strptime(date_str, fmt).date()
                    break
                except ValueError:
                    continue
        except Exception:
            pass

    cur.execute(
        f"INSERT INTO {SCHEMA}.analyses (analysis_date, lab, patient, file_name) VALUES (%s, %s, %s, %s) RETURNING id",
        (analysis_date, lab, patient, file_name)
    )
    analysis_id = cur.fetchone()[0]

    for r in results:
        cur.execute(
            f"INSERT INTO {SCHEMA}.results (analysis_id, name, value, unit, norm_min, norm_max, status) VALUES (%s, %s, %s, %s, %s, %s, %s)",
            (
                analysis_id,
                r.get("name"),
                r.get("value"),
                r.get("unit"),
                r.get("normMin") or r.get("norm_min"),
                r.get("normMax") or r.get("norm_max"),
                r.get("status", "unknown"),
            )
        )

    conn.commit()
    cur.close()
    conn.close()

    return {
        "statusCode": 201,
        "headers": CORS,
        "body": json.dumps({"id": str(analysis_id), "saved": len(results)}, ensure_ascii=False),
    }
