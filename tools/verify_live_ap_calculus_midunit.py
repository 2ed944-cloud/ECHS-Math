#!/usr/bin/env python3
"""Verify the deployed checkpoint, protected entry, catalog order, and exact assets."""
import concurrent.futures
import hashlib
import json
import os
from pathlib import Path
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
SITE = os.environ.get("SITE_ROOT", "https://2ed944-cloud.github.io/ECHS-Math").rstrip("/")
EXPECTED = os.environ["EXPECTED_SHA"]
BASE = "lessons/ap-calculus/unit-1/"
LESSON = BASE + "middle-unit-important-checking-questions.html"
ASSETS = [BASE + "assets/" + name for name in (
    "midunit-questions.js", "midunit-graphs.js", "midunit-checkpoint.js", "midunit-checkpoint.css")]
ASSETS += ["data/ap-calculus-update.js", "js/portal.js", "js/lesson-access-guard.js", "sw.js"]


def fetch(path):
    request = urllib.request.Request(SITE + "/" + path + "?release=" + EXPECTED,
                                     headers={"Cache-Control": "no-cache", "User-Agent": "ECHS-release-verification"})
    with urllib.request.urlopen(request, timeout=25) as response:
        assert response.status == 200, path
        return path, response.read()


with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    files = dict(pool.map(fetch, ["deployment.json", LESSON] + ASSETS))
assert json.loads(files["deployment.json"])["sha"] == EXPECTED, "Deployment commit differs"
html = files[LESSON].decode()
for marker in ('data-echs-lesson-guard="1"', 'name="echs-course" content="ap-calculus"',
               'data-practice="embedded"', 'data-practice-start="question=q01"',
               'Middle Unit Important Checking Questions', 'midunit-checkpoint.js'):
    assert marker in html, marker
for path in ASSETS:
    assert hashlib.sha256(files[path]).digest() == hashlib.sha256((ROOT / path).read_bytes()).digest(), "Asset differs: " + path
catalog = files["data/ap-calculus-update.js"].decode()
assert catalog.index('"number": "1.6"') < catalog.index('"number": "1.M"') < catalog.index('"number": "1.7"')
questions = files[BASE + "assets/midunit-questions.js"].decode()
assert questions.count('"id": "q') >= 44
assert "midunit-batch2" in files["sw.js"].decode()
print("Live AP Calculus checkpoint: PASS — exact deployed revision, protected lesson, card after 1.6, 44 questions, and eight matching assets.")
