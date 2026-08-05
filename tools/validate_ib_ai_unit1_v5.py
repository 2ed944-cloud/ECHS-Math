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

def normalize_prompt(value: str) -> str:
    value = re.sub(r"<[^>]+>", " ", str(value))
    value = value.lower().replace("−", "-").replace("–", "-").replace("—", "-")
    return re.sub(r"\s+", " ", value).strip()

def math_segments(value: str):
    for match in re.finditer(r"\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]", str(value)):
        yield match.group(1) if match.group(1) is not None else match.group(2)

def run_node(args: list[str], label: str) -> subprocess.CompletedProcess[str] | None:
    try:
        result = subprocess.run(args, cwd=ROOT, text=True, capture_output=True, timeout=90)
    except (OSError, subprocess.TimeoutExpired) as exc:
        errors.append(f"{label}: {exc}")
        return None
    if result.returncode:
        errors.append(f"{label}: {result.stderr.strip() or result.stdout.strip()}")
    return result

# Retained unit data must remain parseable.
raw = req("lessons/ib-math-ai/unit-1/data/unit-1-v5-content-data.js")
prefix = "window.ECHS_UNIT1_V5_CONTENT="
packs = {}
if raw.startswith(prefix) and raw.rstrip().endswith(";"):
    try:
        packs = json.loads(raw[len(prefix):].rstrip()[:-1])
    except Exception as exc:
        errors.append(f"Content JSON parse: {exc}")
else:
    errors.append("Content data assignment wrapper is invalid")
expected_packs = [f"1.{i}" for i in range(2, 9)]
if sorted(packs) != expected_packs:
    errors.append(f"Expected retained base packs {expected_packs}, got {sorted(packs)}")
for number, pack in packs.items():
    retained = pack.get("slides", [])
    if len(retained) != 36:
        errors.append(f"{number}: expected 36 retained base slides, got {len(retained)}")
    for index, item in enumerate(retained):
        if not item.get("title") or not item.get("html"):
            errors.append(f"{number}: empty retained slide {index + 1}")

# Stable production wrappers and routes.
active_wrappers = {
    "1.2": "IB_AI_SL_1.2_arithmetic_sequences_ECHS.html",
    "1.3": "IB_AI_SL_1.3_geometric_sequences_ECHS.html",
    "1.4": "IB_AI_SL_1.4_financial_models_ECHS.html",
    "1.5": "IB_AI_SL_1.5_logarithms_ECHS.html",
    "1.6": "IB_AI_SL_1.6_technology_equations_ECHS.html",
}
for number, name in active_wrappers.items():
    text = req(f"lessons/ib-math-ai/unit-1/lessons/{name}")
    for marker in (
        "ap-screen-lesson",
        'class="topbar"',
        'class="routebar"',
        'data-route="practice"',
        "../assets/js/engine.js",
        "unit-1-v5-runtime.js",
    ):
        require(text, marker, f"Lesson {number} wrapper")

lesson12 = req("lessons/ib-math-ai/unit-1/lessons/IB_AI_SL_1.2_arithmetic_sequences_ECHS.html")
for marker in (
    "lesson-1.2-arithmetic-definitive-v6.js?v=6.0.0",
    "lesson-1.2-arithmetic-v6-interactions.js?v=6.0.0",
    "lesson-1.2-exam-focus-v6.js?v=6.0.0",
):
    require(lesson12, marker, "Lesson 1.2 wrapper")

lesson13 = req("lessons/ib-math-ai/unit-1/lessons/IB_AI_SL_1.3_geometric_sequences_ECHS.html")
for marker in (
    "lesson-1.3-geometric-definitive-v6.js?v=6.0.0",
    "lesson-1.3-geometric-v6-interactions.js?v=6.0.0",
    "lesson-1.2-exam-focus-v6.js?v=6.0.0",
):
    require(lesson13, marker, "Lesson 1.3 wrapper")

lesson14 = req("lessons/ib-math-ai/unit-1/lessons/IB_AI_SL_1.4_financial_models_ECHS.html")
for marker in (
    "lesson-1.4-financial-v6-foundations.js?v=6.0.0",
    "lesson-1.4-financial-v6-cashflows.js?v=6.0.0",
    "lesson-1.4-financial-v6-practice.js?v=6.0.0",
    "lesson-1.4-financial-v6-assessment.js?v=6.0.0",
    "lesson-1.4-financial-v6-polish.js?v=6.0.0",
    "lesson-1.4-teaching-blocks-v6-1.js?v=6.1.0",
    "lesson-1.4-financial-v6-interactions.js?v=6.0.0",
):
    require(lesson14, marker, "Lesson 1.4 wrapper")

lesson15 = req("lessons/ib-math-ai/unit-1/lessons/IB_AI_SL_1.5_logarithms_ECHS.html")
for marker in (
    "lesson-1.5-exponents-logarithms-v6.css?v=6.0.0",
    "lesson-1.5-exponents-logarithms-definitive-v6.js?v=6.0.0",
    "lesson-1.2-exam-focus-v6.js?v=6.0.0",
    "lesson-1.1-exam-scroll-v5-2-3.js?v=5.2.3",
    "1.5 · Exponent Laws and Logarithms",
):
    require(lesson15, marker, "Lesson 1.5 wrapper")

lesson16 = req("lessons/ib-math-ai/unit-1/lessons/IB_AI_SL_1.6_technology_equations_ECHS.html")
for marker in (
    "lesson-1.8.js",
    "lesson-1.8-v3.js",
    "lesson-1.6-technology-renumber-v6.js",
    "1.6 · Technology for Equations and Systems",
):
    require(lesson16, marker, "Lesson 1.6 wrapper")

redirects = {
    "IB_AI_SL_1.6_approximation_error_ECHS.html": "IB_AI_SL_1.1_standard_form_ECHS.html",
    "IB_AI_SL_1.7_loans_annuities_ECHS.html": "IB_AI_SL_1.4_financial_models_ECHS.html",
    "IB_AI_SL_1.8_technology_equations_ECHS.html": "IB_AI_SL_1.6_technology_equations_ECHS.html",
}
for source, target in redirects.items():
    text = req(f"lessons/ib-math-ai/unit-1/lessons/{source}")
    if target not in text or "location.replace" not in text:
        errors.append(f"Legacy redirect invalid: {source}")

# Catalog and portal release synchronization.
try:
    catalog = json.loads(req("data/ib-math-ai-unit-1-delivery-catalog.json") or "{}")
except Exception as exc:
    catalog = {}
    errors.append(f"Catalog JSON parse: {exc}")

expected_totals = {
    "lessons": 6,
    "learn_slides": 434,
    "practice_questions": 556,
    "timed_quiz_questions": 86,
    "extended_tasks": 29,
}
if catalog.get("release") != "6.0.0":
    errors.append("Catalog release mismatch")
if catalog.get("schema_version") != "1.7.0":
    errors.append("Catalog schema version mismatch")
if catalog.get("totals") != expected_totals:
    errors.append(f"Catalog totals mismatch: {catalog.get('totals')}")
lessons = catalog.get("lessons", [])
if [item.get("number") for item in lessons] != ["1.1", "1.2", "1.3", "1.4", "1.5", "1.6"]:
    errors.append("Catalog does not use the six-lesson sequence")
expected_meta = {
    "1.1": ("Number Foundations, Scientific Notation and Approximation", "6.0.0", 79, 96, 14, 5),
    "1.2": ("Arithmetic Sequences and Series", "6.0.0", 73, 96, 14, 5),
    "1.3": ("Geometric Sequences and Series", "6.0.0", 73, 96, 14, 5),
    "1.4": ("Financial Applications", "6.0.0", 100, 120, 16, 6),
    "1.5": ("Exponent Laws and Logarithms", "6.0.0", 73, 96, 14, 5),
    "1.6": ("Technology for Equations and Systems", "5.3.3-renumbered", 36, 52, 14, 3),
}
for number, expected in expected_meta.items():
    item = next((entry for entry in lessons if entry.get("number") == number), {})
    actual = (
        item.get("title"),
        item.get("release"),
        item.get("learn_slides"),
        item.get("practice_questions"),
        item.get("timed_quiz_questions"),
        item.get("extended_tasks"),
    )
    if actual != expected:
        errors.append(f"Lesson {number} metadata mismatch: {actual}")

lesson14_meta = next((entry for entry in lessons if entry.get("number") == "1.4"), {})
if lesson14_meta.get("organization_release") != "6.1.0":
    errors.append("Lesson 1.4 organization release is missing")
if [block.get("code") for block in lesson14_meta.get("teaching_blocks", [])] != [
    "1.4A", "1.4B", "1.4C", "1.4D", "1.4E", "1.4F", "1.4G"
]:
    errors.append("Lesson 1.4 teaching-block sequence is invalid")

lesson15_meta = next((entry for entry in lessons if entry.get("number") == "1.5"), {})
if lesson15_meta.get("organization_release") != "6.1.0":
    errors.append("Lesson 1.5 organization release is missing")
lesson15_blocks = lesson15_meta.get("teaching_blocks", [])
if [block.get("code") for block in lesson15_blocks] != ["1.5A", "1.5B", "1.5C", "1.5D"]:
    errors.append("Lesson 1.5 teaching-block sequence is invalid")
if any(block.get("estimated_classroom_time") != "60–75 minutes" for block in lesson15_blocks):
    errors.append("Lesson 1.5 pacing metadata is incomplete")

for field in ("learn_slides", "practice_questions", "timed_quiz_questions", "extended_tasks"):
    if sum(item.get(field, 0) for item in lessons) != expected_totals[field]:
        errors.append(f"Catalog lesson {field} sum mismatch")

# Assemble and independently inspect the definitive Lesson 1.5 overlay.
overlay_path = ROOT / "lessons/ib-math-ai/unit-1/data/lesson-1.5-exponents-logarithms-definitive-v6.js"
css_path = ROOT / "lessons/ib-math-ai/unit-1/assets/css/lesson-1.5-exponents-logarithms-v6.css"
run_node(["node", "--check", str(overlay_path)], "Lesson 1.5 JavaScript syntax")
node_script = (
    "global.window={LESSON_DATA:{lesson:{number:'1.5'}}};"
    "require(process.argv[1]);"
    "process.stdout.write(JSON.stringify(window.LESSON_DATA));"
)
result = run_node(["node", "-e", node_script, str(overlay_path)], "Lesson 1.5 assembly")
assembled = {}
if result and result.returncode == 0:
    try:
        assembled = json.loads(result.stdout)
    except Exception as exc:
        errors.append(f"Lesson 1.5 assembled data parse: {exc}")

slides = assembled.get("slides", [])
practice = assembled.get("practice", [])
quiz = assembled.get("quiz", [])
exam = assembled.get("exam", [])
if (len(slides), len(practice), len(quiz), len(exam)) != (73, 96, 14, 5):
    errors.append(f"Lesson 1.5 delivery counts are {(len(slides), len(practice), len(quiz), len(exam))}")

slide_titles = [slide.get("title") for slide in slides]
if any(not title for title in slide_titles):
    errors.append("Lesson 1.5 contains an untitled slide")
if len(set(slide_titles)) != len(slide_titles):
    duplicates = [title for title, count in Counter(slide_titles).items() if count > 1]
    errors.append(f"Lesson 1.5 duplicate slide titles: {duplicates}")
if any(not slide.get("html") or not slide.get("kind") for slide in slides):
    errors.append("Lesson 1.5 contains an incomplete slide record")

levels = Counter(item.get("level") for item in practice)
if levels != Counter({"Foundation": 24, "Application": 24, "Reasoning": 24, "Challenge": 24}):
    errors.append(f"Lesson 1.5 Practice level balance is {dict(levels)}")

all_items = practice + quiz
ids = [item.get("id") for item in all_items] + [task.get("id") for task in exam]
if any(not identifier for identifier in ids) or len(ids) != len(set(ids)):
    errors.append("Lesson 1.5 assessment IDs are missing or duplicated")

practice_prompts = [normalize_prompt(item.get("prompt", "")) for item in practice]
quiz_prompts = [normalize_prompt(item.get("prompt", "")) for item in quiz]
if len(practice_prompts) != len(set(practice_prompts)):
    errors.append("Lesson 1.5 Practice prompts are duplicated")
if len(quiz_prompts) != len(set(quiz_prompts)):
    errors.append("Lesson 1.5 Quiz prompts are duplicated")
if set(practice_prompts) & set(quiz_prompts):
    errors.append("Lesson 1.5 Quiz repeats a Practice Studio prompt")

for item in all_items:
    if not item.get("prompt") or not item.get("answer") or not item.get("solution"):
        errors.append(f"Incomplete question record {item.get('id')}")
    if not isinstance(item.get("marks"), int) or item.get("marks", 0) <= 0:
        errors.append(f"Invalid marks for {item.get('id')}")
    choices = item.get("choices")
    if choices is not None:
        correct = item.get("correct")
        if not isinstance(choices, list) or len(choices) < 2 or not isinstance(correct, int) or not (0 <= correct < len(choices)):
            errors.append(f"Invalid multiple-choice contract for {item.get('id')}")

for task in exam:
    parts = task.get("parts", [])
    if not parts or sum(part.get("marks", 0) for part in parts) != task.get("total_marks"):
        errors.append(f"Task mark total mismatch for {task.get('id')}")
    for part in parts:
        if not all(part.get(key) not in (None, "") for key in ("label", "prompt", "marks", "answer", "markscheme")):
            errors.append(f"Incomplete task part in {task.get('id')}")

block_contract = [
    ("1.5A", 1, 28),
    ("1.5B", 29, 35),
    ("1.5C", 36, 61),
    ("1.5D", 62, 73),
]
actual_blocks = assembled.get("teachingBlocks", [])
if [(b.get("code"), b.get("beginSlide"), b.get("endSlide")) for b in actual_blocks] != block_contract:
    errors.append("Lesson 1.5 assembled teaching-block boundaries are invalid")

serialized = json.dumps(assembled, ensure_ascii=False)
if "<svg" in serialized.lower():
    errors.append("Lesson 1.5 contains inline SVG")
for segment in math_segments(serialized):
    if "<" in segment or ">" in segment:
        errors.append(f"Raw comparison character inside Lesson 1.5 math: {segment[:80]}")
        break
if re.search(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", serialized):
    errors.append("Lesson 1.5 contains control characters")

css = req("lessons/ib-math-ai/unit-1/assets/css/lesson-1.5-exponents-logarithms-v6.css")
for forbidden in (
    ".katex span{",
    ".katex span {",
    "display:revert",
    ".worked span{",
    ".worked span {",
):
    if forbidden in css.replace("\n", ""):
        errors.append(f"Lesson 1.5 CSS contains KaTeX-risk selector {forbidden}")
if "@media" not in css or ".el-cover" not in css or ".el-lab" not in css:
    errors.append("Lesson 1.5 CSS lacks required responsive/component coverage")

# Stable metadata surfaces and release documents.
required_files = (
    "lessons/ib-math-ai/unit-1/data/lesson-1.5-exponents-logarithms-definitive-v6.js",
    "lessons/ib-math-ai/unit-1/assets/css/lesson-1.5-exponents-logarithms-v6.css",
    "lessons/ib-math-ai/unit-1/START_HERE.html",
    "lessons/ib-math-ai/unit-1/TEACHER_GUIDE.html",
    "docs/releases/ib-ai-1-5-exponent-laws-logarithms-v6.md",
    "data/ib-math-ai-unit-1-update.js",
    "tools/test_ib_unit1_portal_update.mjs",
)
for path in required_files:
    req(path)

start = req("lessons/ib-math-ai/unit-1/START_HERE.html")
for marker in (
    "434",
    "556",
    "29",
    "73 Learn",
    "96 Practice",
    "5 IB tasks",
    "IB_AI_SL_1.5_logarithms_ECHS.html",
):
    require(start, marker, "Unit landing page")

guide = req("lessons/ib-math-ai/unit-1/TEACHER_GUIDE.html")
for marker in (
    "Lesson 1.5 multi-day route",
    "1.5A · Exponent laws and exact powers",
    "1.5D · Scales, modelling and mastery",
    "Lesson 1.5 · 73 screens",
    "556 Practice questions",
):
    require(guide, marker, "Teacher guide")

update = req("data/ib-math-ai-unit-1-update.js")
for marker in (
    "434 purposeful Learn screens",
    "556 studio questions",
    "29 extended tasks",
    '"1.5","Exponent Laws and Logarithms"',
    '"6.0.0",73,96,14,5',
    'code:"1.5A"',
    'code:"1.5D"',
):
    require(update, marker, "Portal update")

print("IB Mathematics AI Unit 1 consolidated structural validator")
print("Errors:", len(errors))
for error in errors:
    print(" ERROR:", error)
if errors:
    raise SystemExit(1)
print("Status: PASS")
