#!/usr/bin/env python3
"""Regression checks for real private-bank inventory counters."""
from pathlib import Path

root = Path(__file__).resolve().parents[1]
ui = (root / "question-bank/official/admin/js/private-bank-center.js").read_text(encoding="utf-8")
html = (root / "question-bank/official/admin/private-bank-center.html").read_text(encoding="utf-8")
worker = (root / "sw.js").read_text(encoding="utf-8")

required_ui = (
    "largestMetric",
    "const totals=all.reduce",
    'document.getElementById("bankTotal").textContent=number(all.length)',
    '["ap-calculus","calc"]',
    '["ap-precalculus","precalc"]',
    '["ib-math-ai","ib"]',
    "const questions=declaredQuestions(bank)",
    "const pools=declaredPools(bank)",
    "const media=declaredMedia(bank)",
)
required_html = (
    'id="precalcBanks"',
    'id="precalcReadiness"',
    'id="precalcVerified"',
    'id="ibBanks"',
    'id="ibReadiness"',
    'id="ibVerified"',
    "registered banks",
    "multicourse-banks",
)
errors = [f"UI missing {token}" for token in required_ui if token not in ui]
errors += [f"HTML missing {token}" for token in required_html if token not in html]
if "isComplete?declaredQuestions(bank):0" in ui:
    errors.append("Uploading packages are still forced to zero")
if "multicourse-banks" not in worker:
    errors.append("Service-worker cache version was not refreshed")
if errors:
    raise SystemExit("\n".join(errors))
print("Private bank real inventory counters: PASS")
