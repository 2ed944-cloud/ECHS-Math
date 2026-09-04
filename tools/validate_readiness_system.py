#!/usr/bin/env python3
"""Static release gates for the IB Mathematics readiness subsystem."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

REQUIRED = [
    "readiness/index.html",
    "readiness/readiness.css",
    "readiness/readiness.js",
    "readiness/diagnostic-demo.json",
    "readiness/templates/map-import-template.csv",
    "readiness/templates/myp-evidence-template.csv",
    "readiness/templates/ib-outcomes-template.csv",
    "docs/IB_READINESS_PATHWAY_SYSTEM.md",
    "supabase/functions/readiness-api/index.ts",
    "supabase/functions/readiness-api/readiness-engine.js",
    "supabase/functions/readiness-api/readiness-engine.test.mjs",
    "supabase/functions/readiness-api/diagnostic-bank.js",
    "supabase/migrations/202609050100_ib_readiness_pathway_engine.sql",
    "supabase/config.toml",
]

errors: list[str] = []

for rel in REQUIRED:
    if not (ROOT / rel).is_file():
        errors.append(f"missing required file: {rel}")


def read(rel: str) -> str:
    return (ROOT / rel).read_text(encoding="utf-8")

if not errors:
    html = read("readiness/index.html")
    js = read("readiness/readiness.js")
    api = read("supabase/functions/readiness-api/index.ts")
    engine = read("supabase/functions/readiness-api/readiness-engine.js")
    bank = read("supabase/functions/readiness-api/diagnostic-bank.js")
    migration = read("supabase/migrations/202609050100_ib_readiness_pathway_engine.sql")
    config = read("supabase/config.toml")
    docs = read("docs/IB_READINESS_PATHWAY_SYSTEM.md")

    for phrase in [
        "not an official IB or NWEA",
        "readiness index",
        "Synthetic demonstration data",
    ]:
        if phrase.lower() not in (html + engine + docs).lower():
            errors.append(f"required methodological guardrail missing: {phrase}")

    if "window.ECHSInstitution.api(\"readiness-api\"" not in js:
        errors.append("frontend is not wired to the institutional readiness-api client")
    if "?demo=1" not in docs or 'new URLSearchParams(location.search).get("demo")' not in js:
        errors.append("synthetic demo mode is not documented/wired")

    if 'admin.rpc("api_session_lookup"' not in api:
        errors.append("readiness-api does not validate the custom institutional bearer session")
    if 'createClient(SUPABASE_URL, SERVICE_ROLE_KEY' not in api:
        errors.append("readiness-api server-side Supabase client is missing")
    if "SERVICE_ROLE" in html or "SUPABASE_SERVICE_ROLE_KEY" in js:
        errors.append("service-role material must never appear in browser files")

    required_routes = [
        "/overview", "/students", "/schools", "/schools/assign", "/map/import",
        "/myp/evidence", "/myp/import", "/diagnostic", "/diagnostic/submit",
        "/preference", "/recompute", "/model", "/outcomes/import", "/validation",
    ]
    for route in required_routes:
        if route not in api:
            errors.append(f"API route missing: {route}")

    required_tables = [
        "readiness_schools", "readiness_student_schools", "readiness_models",
        "readiness_import_batches", "map_assessments", "myp_math_evidence",
        "readiness_diagnostic_attempts", "readiness_snapshots",
        "readiness_interventions", "readiness_preferences", "readiness_outcomes",
    ]
    for table in required_tables:
        if f"create table if not exists public.{table}" not in migration:
            errors.append(f"migration table missing: {table}")
        if f"alter table public.{table} enable row level security" not in migration:
            errors.append(f"RLS enablement missing: {table}")
        if f"revoke all on public.{table} from anon, authenticated" not in migration:
            errors.append(f"direct browser privilege revocation missing: {table}")

    if "[functions.readiness-api]" not in config or not re.search(r"\[functions\.readiness-api\]\s*\nverify_jwt\s*=\s*false", config):
        errors.append("supabase/config.toml must configure readiness-api for the custom session token")

    if "publicDiagnostic()" not in bank or "answer: _answer" not in bank:
        errors.append("diagnostic bank must strip answer keys before browser delivery")
    if "response_digest" not in api or "JSON.stringify(responses)" not in api:
        errors.append("diagnostic response digest control missing")

    demo = json.loads(read("readiness/diagnostic-demo.json"))
    questions = demo.get("questions", [])
    if len(questions) != 30:
        errors.append(f"synthetic diagnostic demo should expose 30 questions, got {len(questions)}")
    if any("answer" in question for question in questions):
        errors.append("diagnostic demo leaks answer keys")

    if "Math.random" in engine:
        errors.append("readiness engine must be deterministic")
    if "probability" in re.sub(r"probability reasoning", "", engine.lower()) and "not a probability" not in docs.lower():
        errors.append("probability wording requires an explicit non-probability readiness guardrail")

    for path in ["AA_HL", "AA_SL", "AI_HL", "AI_SL"]:
        if path not in engine or path not in migration or path not in js:
            errors.append(f"pathway missing across stack: {path}")

if errors:
    print("IB Mathematics readiness system: FAIL", file=sys.stderr)
    for item in errors:
        print(f" - {item}", file=sys.stderr)
    raise SystemExit(1)

print("IB Mathematics readiness system: PASS")
