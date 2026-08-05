#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import subprocess
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
errors: list[str] = []


def req(path: str) -> str:
    target = ROOT / path
    if not target.is_file():
        errors.append(f"Missing {path}")
        return ""
    return target.read_text(encoding="utf-8", errors="replace")


def require(text: str, marker: str, label: str) -> None:
    if marker not in text:
        errors.append(f"{label} missing {marker}")


def normalize(value: str) -> str:
    value = re.sub(r"<[^>]+>", " ", str(value)).lower()
    value = value.replace("−", "-").replace("–", "-").replace("—", "-")
    return re.sub(r"\s+", " ", value).strip()


def run(args: list[str], label: str, timeout: int = 120) -> subprocess.CompletedProcess[str] | None:
    try:
        result = subprocess.run(args, cwd=ROOT, text=True, capture_output=True, timeout=timeout)
    except (OSError, subprocess.TimeoutExpired) as exc:
        errors.append(f"{label}: {exc}")
        return None
    if result.returncode:
        errors.append(f"{label}: {result.stderr.strip() or result.stdout.strip()}")
    return result


# The retained base packs remain parseable and preserve the historical 36-screen sources.
raw = req("lessons/ib-math-ai/unit-1/data/unit-1-v5-content-data.js")
prefix = "window.ECHS_UNIT1_V5_CONTENT="
packs: dict[str, object] = {}
if raw.startswith(prefix) and raw.rstrip().endswith(";"):
    try:
        packs = json.loads(raw[len(prefix):].rstrip()[:-1])
    except Exception as exc:
        errors.append(f"Content JSON parse: {exc}")
else:
    errors.append("Content data assignment wrapper is invalid")
expected_packs = [f"1.{index}" for index in range(2, 9)]
if sorted(packs) != expected_packs:
    errors.append(f"Expected retained base packs {expected_packs}, got {sorted(packs)}")
for number, pack in packs.items():
    slides = pack.get("slides", []) if isinstance(pack, dict) else []
    if len(slides) != 36:
        errors.append(f"{number}: expected 36 retained base slides, got {len(slides)}")

# Stable production wrappers and definitive overlays.
wrappers = {
    "1.1": "IB_AI_SL_1.1_standard_form_ECHS.html",
    "1.2": "IB_AI_SL_1.2_arithmetic_sequences_ECHS.html",
    "1.3": "IB_AI_SL_1.3_geometric_sequences_ECHS.html",
    "1.4": "IB_AI_SL_1.4_financial_models_ECHS.html",
    "1.5": "IB_AI_SL_1.5_logarithms_ECHS.html",
    "1.6": "IB_AI_SL_1.6_technology_equations_ECHS.html",
}
wrapper_text: dict[str, str] = {}
for number, filename in wrappers.items():
    text = req(f"lessons/ib-math-ai/unit-1/lessons/{filename}")
    wrapper_text[number] = text
    for marker in ("ap-screen-lesson", 'class="topbar"', 'class="routebar"', 'data-route="practice"', "../assets/js/engine.js", "unit-1-v5-runtime.js"):
        require(text, marker, f"Lesson {number} wrapper")

for marker in (
    "lesson-1.5-exponents-logarithms-v6.css?v=6.0.0",
    "lesson-1.5-exponents-logarithms-definitive-v6.js?v=6.0.0",
    "1.5 · Exponent Laws and Logarithms",
):
    require(wrapper_text["1.5"], marker, "Lesson 1.5 wrapper")

for marker in (
    "lesson-1.6-technology-equations-v6.css?v=6.0.0",
    "lesson-1.6-technology-v6-foundations.js?v=6.0.0",
    "lesson-1.6-technology-v6-systems.js?v=6.0.0",
    "lesson-1.6-technology-v6-polynomials.js?v=6.0.0",
    "lesson-1.6-technology-v6-practice.js?v=6.0.0",
    "lesson-1.6-technology-v6-assessment.js?v=6.0.0",
    "lesson-1.6-technology-v6-corrections.js?v=6.0.0",
    "lesson-1.6-technology-v6-interactions.js?v=6.0.0",
    "1.6 · Technology for Equations and Systems",
):
    require(wrapper_text["1.6"], marker, "Lesson 1.6 wrapper")
if "lesson-1.6-technology-renumber-v6.js" in wrapper_text["1.6"]:
    errors.append("Lesson 1.6 wrapper still loads the legacy renumber-only patch")

redirects = {
    "IB_AI_SL_1.6_approximation_error_ECHS.html": "IB_AI_SL_1.1_standard_form_ECHS.html",
    "IB_AI_SL_1.7_loans_annuities_ECHS.html": "IB_AI_SL_1.4_financial_models_ECHS.html",
    "IB_AI_SL_1.8_technology_equations_ECHS.html": "IB_AI_SL_1.6_technology_equations_ECHS.html",
}
for source, target in redirects.items():
    text = req(f"lessons/ib-math-ai/unit-1/lessons/{source}")
    if target not in text or "location.replace" not in text:
        errors.append(f"Legacy redirect invalid: {source}")

# Delivery catalog and portal metadata.
try:
    catalog = json.loads(req("data/ib-math-ai-unit-1-delivery-catalog.json") or "{}")
except Exception as exc:
    catalog = {}
    errors.append(f"Catalog JSON parse: {exc}")
expected_totals = {
    "lessons": 6,
    "learn_slides": 471,
    "practice_questions": 600,
    "timed_quiz_questions": 86,
    "extended_tasks": 31,
}
if catalog.get("schema_version") != "1.7.0":
    errors.append("Catalog schema version mismatch")
if catalog.get("release") != "6.0.0":
    errors.append("Catalog release mismatch")
if catalog.get("totals") != expected_totals:
    errors.append(f"Catalog totals mismatch: {catalog.get('totals')}")
lessons = catalog.get("lessons", [])
if [item.get("number") for item in lessons] != ["1.1", "1.2", "1.3", "1.4", "1.5", "1.6"]:
    errors.append("Catalog does not expose the six-lesson sequence")
expected_meta = {
    "1.1": ("Number Foundations, Scientific Notation and Approximation", "6.0.0", 79, 96, 14, 5),
    "1.2": ("Arithmetic Sequences and Series", "6.0.0", 73, 96, 14, 5),
    "1.3": ("Geometric Sequences and Series", "6.0.0", 73, 96, 14, 5),
    "1.4": ("Financial Applications", "6.0.0", 100, 120, 16, 6),
    "1.5": ("Exponent Laws and Logarithms", "6.0.0", 73, 96, 14, 5),
    "1.6": ("Technology for Equations and Systems", "6.0.0", 73, 96, 14, 5),
}
for number, expected in expected_meta.items():
    item = next((entry for entry in lessons if entry.get("number") == number), {})
    actual = (item.get("title"), item.get("release"), item.get("learn_slides"), item.get("practice_questions"), item.get("timed_quiz_questions"), item.get("extended_tasks"))
    if actual != expected:
        errors.append(f"Lesson {number} metadata mismatch: {actual}")
for number, codes in {
    "1.4": ["1.4A", "1.4B", "1.4C", "1.4D", "1.4E", "1.4F", "1.4G"],
    "1.5": ["1.5A", "1.5B", "1.5C", "1.5D"],
    "1.6": ["1.6A", "1.6B", "1.6C", "1.6D"],
}.items():
    item = next((entry for entry in lessons if entry.get("number") == number), {})
    blocks = item.get("teaching_blocks", [])
    if [block.get("code") for block in blocks] != codes:
        errors.append(f"Lesson {number} teaching-block sequence is invalid")
    if any(block.get("estimated_classroom_time") != "60–75 minutes" for block in blocks):
        errors.append(f"Lesson {number} pacing metadata is incomplete")
if next((entry for entry in lessons if entry.get("number") == "1.6"), {}).get("official_section", {}).get("code") != "SL 1.8":
    errors.append("Lesson 1.6 official section is missing")
for field in ("learn_slides", "practice_questions", "timed_quiz_questions", "extended_tasks"):
    if sum(item.get(field, 0) for item in lessons) != expected_totals[field]:
        errors.append(f"Catalog lesson {field} sum mismatch")

portal = req("data/ib-math-ai-unit-1-update.js")
for marker in (
    "471 purposeful Learn screens",
    "600 studio questions",
    "31 extended tasks",
    '"1.6","Technology for Equations and Systems"',
    '"6.0.0",73,96,14,5',
    'code:"1.6A"',
    'code:"1.6D"',
):
    require(portal, marker, "Unit 1 portal metadata")
start = req("lessons/ib-math-ai/unit-1/START_HERE.html")
guide = req("lessons/ib-math-ai/unit-1/TEACHER_GUIDE.html")
for text, label in ((start, "START_HERE"), (guide, "Teacher Guide")):
    for marker in ("471", "600", "31", "1.6", "73", "96", "5 IB tasks"):
        require(text, marker, label)

# Preserve the independent definitive Lesson 1.5 contract.
overlay = ROOT / "lessons/ib-math-ai/unit-1/data/lesson-1.5-exponents-logarithms-definitive-v6.js"
run(["node", "--check", str(overlay)], "Lesson 1.5 JavaScript syntax")
node_script = "global.window={LESSON_DATA:{lesson:{number:'1.5'}}};require(process.argv[1]);process.stdout.write(JSON.stringify(window.LESSON_DATA));"
result = run(["node", "-e", node_script, str(overlay)], "Lesson 1.5 assembly")
if result and result.returncode == 0:
    try:
        lesson15 = json.loads(result.stdout)
        counts = (len(lesson15.get("slides", [])), len(lesson15.get("practice", [])), len(lesson15.get("quiz", [])), len(lesson15.get("exam", [])))
        if counts != (73, 96, 14, 5):
            errors.append(f"Lesson 1.5 delivery counts are {counts}")
        levels = Counter(item.get("level") for item in lesson15.get("practice", []))
        if levels != Counter({"Foundation": 24, "Application": 24, "Reasoning": 24, "Challenge": 24}):
            errors.append(f"Lesson 1.5 Practice balance is {dict(levels)}")
        prompts = [normalize(item.get("prompt", "")) for item in lesson15.get("practice", [])]
        if len(prompts) != len(set(prompts)):
            errors.append("Lesson 1.5 Practice prompts are duplicated")
    except Exception as exc:
        errors.append(f"Lesson 1.5 assembled data parse: {exc}")

# The definitive Lesson 1.6 validator is the source of truth for its assembled release.
run(["node", "tools/test_ib_ai_1_6_definitive_v6.mjs"], "Lesson 1.6 definitive validation")

print("IB AI SL Unit 1 consolidated release validation")
print(f"Root: {ROOT}")
print(f"Errors: {len(errors)}")
if errors:
    for error in errors:
        print(f"- {error}")
    print("Status: FAIL")
    raise SystemExit(1)
print("Status: PASS")
