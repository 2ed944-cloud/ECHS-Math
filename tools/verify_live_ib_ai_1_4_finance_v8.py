#!/usr/bin/env python3
"""Verify the deployed commit, merged lesson, exact assets and protected entry."""
import concurrent.futures
import hashlib
import json
import os
from pathlib import Path
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
SITE = os.environ.get("SITE_ROOT", "https://2ed944-cloud.github.io/ECHS-Math").rstrip("/")
EXPECTED = os.environ["EXPECTED_SHA"]
BASE = "lessons/ib-math-ai/unit-1/"
LESSON = BASE + "lessons/IB_AI_SL_1.4_financial_models_ECHS.html"
LEGACY = BASE + "lessons/IB_AI_SL_1.7_loans_annuities_ECHS.html"
ASSETS = [BASE + f"data/lesson-1.4-finance-{part}-v8.js" for part in ("model", "questions", "labs", "core")]
ASSETS += [BASE + "assets/css/lesson-1.4-finance-v8.css", "data/ib-math-ai-unit-1-update.js", "data/ib-math-ai-unit-1-delivery-catalog.json", "sw.js"]

def fetch(path):
    request = urllib.request.Request(SITE + "/" + path + "?release=" + EXPECTED, headers={"Cache-Control": "no-cache", "User-Agent": "ECHS-release-verification"})
    with urllib.request.urlopen(request, timeout=25) as response:
        assert response.status == 200, path
        return path, response.read()

with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    files = dict(pool.map(fetch, ["deployment.json", LESSON, LEGACY] + ASSETS))
assert json.loads(files["deployment.json"])["sha"] == EXPECTED, "Deployment commit differs"
html = files[LESSON].decode()
for marker in ('data-echs-lesson-guard="1"', 'name="echs-course" content="ib-math-ai"', 'data-merged-sections="SL 1.4 + SL 1.7"', 'lesson-1.4-finance-core-v8.js', 'TI-Nspire CX / CX II'):
    assert marker in html, marker
assert html.count('class="slide"') == 67
assert html.count('data-lab="') == 12
assert html.count('data-question="') == 28
assert html.count('data-frq="') == 24
assert "ti84-real" not in html and "engine.js" not in html
assert "location.search+location.hash" in files[LEGACY].decode()
for path in ASSETS:
    assert hashlib.sha256(files[path]).digest() == hashlib.sha256((ROOT / path).read_bytes()).digest(), "Asset differs: " + path
catalog = json.loads(files["data/ib-math-ai-unit-1-delivery-catalog.json"])
entry = next(item for item in catalog["lessons"] if item["number"] == "1.4")
assert entry["release"] == "8.0.0"
assert entry["assessment"]["written_marks"] == 139
assert [section["code"] for section in entry["official_core_sections"]] == ["SL 1.4", "SL 1.7"]
print("Live IB AI SL 1.4 + 1.7: PASS — exact commit, protected merged lesson, 67 slides, 12 investigations, eight matching assets and preserved SL 1.7 redirect.")
