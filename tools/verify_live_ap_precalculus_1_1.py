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
LESSON = BASE + "AP_Precalculus_1.1_Change_in_Tandem_ECHS_Refined.html"
LEGACY = "lessons/ap-precalculus/1-1-change-in-tandem.html"
ASSETS = [BASE + f"assets/tandem-1-1-{part}-v3.js" for part in ("model", "graphs", "questions", "labs", "core")]
ASSETS += [BASE + "assets/tandem-1-1-v3.css", "data/ap-precalculus-update.js", "sw.js"]


def fetch(path):
    request = urllib.request.Request(SITE + "/" + path + "?release=" + EXPECTED, headers={"Cache-Control": "no-cache", "User-Agent": "ECHS-release-verification"})
    with urllib.request.urlopen(request, timeout=25) as response:
        assert response.status == 200, path
        return path, response.read()


with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    files = dict(pool.map(fetch, ["deployment.json", LESSON, LEGACY] + ASSETS))
assert json.loads(files["deployment.json"])["sha"] == EXPECTED, "Deployment commit differs"
html = files[LESSON].decode()
for marker in ('data-echs-lesson-guard="1"', 'name="echs-course" content="ap-precalculus"', 'data-framework="fall-2026"', 'tandem-1-1-core-v3.js', '24 AP-style MCQs', '4 challenge MCQs'):
    assert marker in html, marker
assert html.count('class="slide"') == 48
assert html.count('data-tandem-lab="') == 8
assert html.count('data-question="') == 34
assert html.count('data-frq="') == 6
assert "engine.js" not in html
legacy = files[LEGACY].decode()
assert "target.search=location.search" in legacy and "target.hash=location.hash" in legacy
for path in ASSETS:
    assert hashlib.sha256(files[path]).digest() == hashlib.sha256((ROOT / path).read_bytes()).digest(), "Asset differs: " + path
assert '"written_points": 36' in files["data/ap-precalculus-update.js"].decode()
assert 'ap-precalculus-11-ap-scope-v3' in files['sw.js'].decode()
print("Live AP Precalculus 1.1: PASS — exact commit, protected entry, 48 slides, 8 investigations, 34 checks, 6 FRQs and eight matching assets.")
