#!/usr/bin/env python3
"""Verify the exact deployed revision, protected lesson, graph assets and metadata."""
import concurrent.futures
import hashlib
import json
import os
from pathlib import Path
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
SITE = os.environ.get("SITE_ROOT", "https://2ed944-cloud.github.io/ECHS-Math").rstrip("/")
EXPECTED = os.environ["EXPECTED_SHA"]
BASE = "lessons/ap-precalculus/unit-1/"
LESSON = BASE + "AP_Precalculus_1.2_Rates_of_Change_ECHS_Refined.html"
LEGACY = "lessons/ap-precalculus/1-2-rates-of-change.html"
ASSETS = [BASE + f"assets/rates-1-2-{part}-v3.js" for part in ("model", "graphs", "questions", "labs", "core")]
ASSETS += [BASE + "assets/rates-1-2-ideas-model-v4.js", BASE + "assets/rates-1-2-ideas-v4.js", BASE + "assets/rates-1-2-classroom-v4.js", BASE + "assets/rates-1-2-classroom-data-v4.js", BASE + "assets/rates-1-2-classroom-v4.css", BASE + "assets/rates-1-2-v3.css", "data/ap-precalculus-update.js", "sw.js"]


def fetch(path):
    request = urllib.request.Request(SITE + "/" + path + "?release=" + EXPECTED, headers={"Cache-Control": "no-cache", "User-Agent": "ECHS-release-verification"})
    with urllib.request.urlopen(request, timeout=25) as response:
        assert response.status == 200, path
        return path, response.read()


with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    files = dict(pool.map(fetch, ["deployment.json", LESSON, LEGACY] + ASSETS))
assert json.loads(files["deployment.json"])["sha"] == EXPECTED, "Deployment commit differs"
html = files[LESSON].decode()
for marker in ('data-echs-lesson-guard="1"', 'name="echs-course" content="ap-precalculus"', 'data-framework="fall-2026"', 'rates-1-2-core-v3.js', 'rates-1-2-classroom-v4.js', '24 AP-style MCQs', '6 challenge MCQs'):
    assert marker in html, marker
assert html.count('class="slide"') == 55
assert html.count('data-rates-lab="') == 10
assert html.count('data-question="') == 38
assert html.count('data-frq="') == 6
plan_source = files[BASE + "assets/rates-1-2-classroom-data-v4.js"].decode()
plan = json.loads(plan_source.split("const plan=", 1)[1].split(";\nif(typeof module", 1)[0])
assert len(plan["slides"]) + html.count('class="slide"') == 82
assert len(plan["questions"]) + html.count('data-question="') == 59
assert plan["order"][:6] == ["warm-up", "tank-lab", "quotient", "secant-lab", "graph-rate", "your-turn-1"]
assert "engine.js" not in html
legacy = files[LEGACY].decode()
assert "target.search=location.search" in legacy and "target.hash=location.hash" in legacy
for path in ASSETS:
    assert hashlib.sha256(files[path]).digest() == hashlib.sha256((ROOT / path).read_bytes()).digest(), "Asset differs: " + path
assert '"written_points": 36' in files["data/ap-precalculus-update.js"].decode()
assert 'ap-precalculus-12-ap-scope-v3' in files['sw.js'].decode()
print("Live AP Precalculus 1.2: PASS — exact commit, protected entry, 55 retained + 27 classroom slides, 14 investigations, 59 checks, 6 FRQs and matching versioned assets.")
