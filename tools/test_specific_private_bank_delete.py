#!/usr/bin/env python3
"""Static regression checks for administrator-scoped private bank deletion."""
from pathlib import Path

root = Path(__file__).resolve().parents[1]
api = (root / "supabase/functions/private-bank-api/index.ts").read_text(encoding="utf-8")
ui = (root / "question-bank/official/admin/js/private-bank-center.js").read_text(encoding="utf-8")
html = (root / "question-bank/official/admin/private-bank-center.html").read_text(encoding="utf-8")
worker = (root / "sw.js").read_text(encoding="utf-8")

required_api = (
    'async function deletePackageStep',
    'current.role !== "admin"',
    '.eq("package_id", packageRow.id)',
    'deleteOrphanTrustRecords(questionIds)',
    'removeStorageObjects(String(packageRow.storage_bucket || PRIVATE_BUCKET), mediaPaths)',
    '.eq("bank_code", bankCode).select("id")',
    'packageMatch && req.method === "DELETE"',
)
required_ui = (
    'data-delete-bank=',
    'Delete this bank and package',
    'async function deleteSpecificBank',
    'confirmation!==bankCode',
    'Student learning history was preserved',
)
errors = []
for token in required_api:
    if token not in api:
        errors.append(f"API missing: {token}")
for token in required_ui:
    if token not in ui:
        errors.append(f"UI missing: {token}")
if "multicourse-banks" not in html or "multicourse-banks" not in worker:
    errors.append("Cache-busting markers are incomplete")
if errors:
    raise SystemExit("\n".join(errors))
print("Specific private-bank deletion checks: PASS")
