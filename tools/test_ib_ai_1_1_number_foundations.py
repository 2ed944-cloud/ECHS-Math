#!/usr/bin/env python3
"""Definitive regression checks for the expanded IB AI SL Lesson 1.1 v6."""
from __future__ import annotations

import json
import math
import re
import subprocess
import sys
from collections import Counter
from pathlib import Path

ROOT = Path("lessons/ib-math-ai/unit-1")
HTML = ROOT / "lessons/IB_AI_SL_1.1_standard_form_ECHS.html"
CONTENT = ROOT / "data/lesson-1.1-number-foundations-v6-content.js"
POLISH = ROOT / "data/lesson-1.1-number-foundations-v6-polish.js"
INTERACTIONS = ROOT / "data/lesson-1.1-number-foundations-v6-interactions.js"
CSS = [
    ROOT / "assets/css/lesson-1.1-number-foundations-v6-core.css",
    ROOT / "assets/css/lesson-1.1-number-foundations-v6-precision.css",
    ROOT / "assets/css/lesson-1.1-number-foundations-v6-responsive.css",
]
CATALOG = Path("data/ib-math-ai-unit-1-delivery-catalog.json")
DATA_FILES = [
    ROOT / "data/lesson-1.1.js",
    ROOT / "data/lesson-1.1-v5-01.js",
    ROOT / "data/lesson-1.1-v5-02.js",
    ROOT / "data/lesson-1.1-v5-03.js",
    ROOT / "data/lesson-1.1-v5-04.js",
    ROOT / "data/lesson-1.1-v5-05.js",
    CONTENT,
    POLISH,
]


def read(base: Path, path: Path, errors: list[str]) -> str:
    target = base / path
    if not target.is_file():
        errors.append(f"Missing file: {path}")
        return ""
    return target.read_text(encoding="utf-8", errors="replace")


def require(text: str, markers: tuple[str, ...], label: str, errors: list[str]) -> None:
    for marker in markers:
        if marker not in text:
            errors.append(f"{label} missing marker: {marker}")


def assemble(base: Path, errors: list[str]) -> dict:
    paths = json.dumps([str(path) for path in DATA_FILES])
    program = f"""
const fs=require('fs');
const vm=require('vm');
const files={paths};
const sandbox={{window:{{}}}};
sandbox.window.window=sandbox.window;
vm.createContext(sandbox);
for(const file of files) vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{{filename:file}});
const d=sandbox.window.LESSON_DATA;
if(!d) throw new Error('LESSON_DATA missing');
process.stdout.write(JSON.stringify({{
  version:d.version,
  title:d.lesson.title,
  slides:d.slides,
  practice:d.practice,
  quiz:d.quiz,
  exam:d.exam,
  assessmentDesign:d.assessmentDesign,
  audit:d.v6Audit
}}));
"""
    result = subprocess.run(["node", "-e", program], cwd=base, text=True, capture_output=True)
    if result.returncode:
        errors.append(f"Lesson assembly failed: {result.stderr.strip()}")
        return {}
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        errors.append(f"Lesson assembly was not valid JSON: {exc}")
        return {}


def validate(base: Path, errors: list[str]) -> None:
    html = read(base, HTML, errors)
    content = read(base, CONTENT, errors)
    polish = read(base, POLISH, errors)
    interactions = read(base, INTERACTIONS, errors)
    css = "\n".join(read(base, path, errors) for path in CSS)
    catalog_text = read(base, CATALOG, errors)

    require(
        html,
        (
            "Number Foundations, Scientific Notation and Approximation",
            "lesson-1.1-number-foundations-v6-core.css?v=6.0.0",
            "lesson-1.1-number-foundations-v6-precision.css?v=6.0.0",
            "lesson-1.1-number-foundations-v6-responsive.css?v=6.0.0",
            "lesson-1.1-number-foundations-v6-content.js?v=6.0.0",
            "lesson-1.1-number-foundations-v6-polish.js?v=6.0.0",
            "lesson-1.1-number-foundations-v6-interactions.js?v=6.0.0",
        ),
        "Lesson HTML",
        errors,
    )
    require(
        content,
        (
            "The number-set hierarchy",
            "Decimal places measure distance from the decimal point",
            "Significant figures measure meaningful digits",
            "One rounding algorithm for every scale",
            "Rounding creates an interval of possible exact values",
            "Absolute, relative and percentage error",
            "Generative Number Foundations Studio",
            "Water-tank precision audit",
            "Optical component quality control",
            "practiceLevels:{Foundation:24,Application:24,Reasoning:24,Challenge:24}",
        ),
        "Number Foundations content",
        errors,
    )
    require(
        interactions,
        (
            "data-number-set-explorer",
            "Reveal next set",
            "data-bound-explorer",
            "data-nf-generator",
            "generateRounding",
            "generateBounds",
            "generateError",
            "countSignificantFigures",
            "MutationObserver",
        ),
        "Interactive controller",
        errors,
    )
    require(
        css,
        (
            ".nf-set-map-canvas",
            ".nf-set-ring.is-revealed",
            ".nf-place-row",
            ".nf-bound-explorer",
            ".nf-generator-card",
            ".nf-ib-task",
            "@media(max-width:700px)",
        ),
        "Number Foundations styles",
        errors,
    )

    for path in (*DATA_FILES, INTERACTIONS):
        result = subprocess.run(["node", "--check", str(base / path)], text=True, capture_output=True)
        if result.returncode:
            errors.append(f"JavaScript syntax failed in {path}: {result.stderr.strip()}")

    if "<svg" in content.lower() or "<svg" in polish.lower():
        errors.append("v6 content must not introduce inline SVG")
    if re.search(r"\.katex(?:-display)?[^\{]*\s+span", css):
        errors.append("v6 CSS must not style KaTeX internal spans")
    if re.search(r"display\s*:\s*revert", css):
        errors.append("v6 CSS contains destructive display:revert")

    data = assemble(base, errors)
    if not data:
        return

    expected_counts = {
        "slides": 79,
        "practice": 96,
        "quiz": 14,
        "exam": 5,
    }
    if data.get("version") != "6.0.0":
        errors.append(f"Lesson version is {data.get('version')!r}; expected '6.0.0'")
    for key, expected in expected_counts.items():
        actual = len(data.get(key, []))
        if actual != expected:
            errors.append(f"{key} count is {actual}; expected {expected}")

    slides = data.get("slides", [])
    titles = [slide.get("title") for slide in slides]
    duplicates = [title for title, count in Counter(titles).items() if count > 1]
    if duplicates:
        errors.append(f"Duplicate slide titles: {sorted(duplicates)}")
    if any("<svg" in slide.get("html", "").lower() for slide in slides):
        errors.append("Assembled lesson contains inline SVG")

    sequence = [
        "The number-set hierarchy",
        "Decimal places measure distance from the decimal point",
        "Significant figures measure meaningful digits",
        "One rounding algorithm for every scale",
        "Exact values, approximations and estimates",
        "Rounding creates an interval of possible exact values",
        "Absolute, relative and percentage error",
        "The anatomy of normalized standard form",
    ]
    positions = []
    for title in sequence:
        if title not in titles:
            errors.append(f"Missing sequence title: {title}")
        else:
            positions.append(titles.index(title))
    if positions and positions != sorted(positions):
        errors.append(f"Pedagogical sequence is out of order: {positions}")

    practice = data.get("practice", [])
    level_counts = Counter(item.get("level") for item in practice)
    expected_levels = Counter({"Foundation":24, "Application":24, "Reasoning":24, "Challenge":24})
    if level_counts != expected_levels:
        errors.append(f"Practice distribution is {dict(level_counts)}; expected {dict(expected_levels)}")

    for label in ("practice", "quiz", "exam"):
        ids = [item.get("id") for item in data.get(label, [])]
        if len(ids) != len(set(ids)):
            errors.append(f"Duplicate IDs in {label}")

    for task in data.get("exam", []):
        part_total = sum(part.get("marks", 0) for part in task.get("parts", []))
        if part_total != task.get("total_marks"):
            errors.append(f"Task {task.get('id')} marks mismatch: {part_total} vs {task.get('total_marks')}")

    audit = data.get("audit") or {}
    if audit.get("sequence") != "number sets → decimal places → significant figures → rounding → approximation → bounds → percentage error → scientific notation":
        errors.append("v6 sequence audit is missing or incorrect")
    for flag in ("numberSetMap", "boundsExplorer", "generatedQuestionStudio", "coverAlignedToFullScope", "learningGoalsAligned"):
        if audit.get(flag) is not True:
            errors.append(f"v6 audit flag is not true: {flag}")

    # Independently recompute the high-risk contextual bounds recorded in the polish layer.
    expected_water = [math.pi * 2.395**2 * 5.75, math.pi * 2.405**2 * 5.85]
    expected_optical = [math.pi * 4.195**2 / 4, math.pi * 4.205**2 / 4]
    for actual, expected in zip(audit.get("waterBounds", []), expected_water):
        if not math.isclose(actual, expected, rel_tol=1e-10, abs_tol=1e-10):
            errors.append(f"Water bound mismatch: {actual} vs {expected}")
    for actual, expected in zip(audit.get("opticalBounds", []), expected_optical):
        if not math.isclose(actual, expected, rel_tol=1e-10, abs_tol=1e-10):
            errors.append(f"Optical bound mismatch: {actual} vs {expected}")

    try:
        catalog = json.loads(catalog_text)
        lesson = next(item for item in catalog["lessons"] if item["number"] == "1.1")
        expected_catalog = {
            "release":"6.0.0",
            "learn_slides":79,
            "practice_questions":96,
            "timed_quiz_questions":14,
            "extended_tasks":5,
        }
        for key, expected in expected_catalog.items():
            if lesson.get(key) != expected:
                errors.append(f"Catalog {key} is {lesson.get(key)!r}; expected {expected!r}")
        totals = catalog.get("totals", {})
        if totals != {"lessons":8,"learn_slides":506,"practice_questions":460,"timed_quiz_questions":112,"extended_tasks":26}:
            errors.append(f"Unit catalog totals are incorrect: {totals}")
    except (json.JSONDecodeError, KeyError, StopIteration) as exc:
        errors.append(f"Could not validate catalog: {exc}")


def main() -> int:
    base = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
    errors: list[str] = []
    validate(base, errors)
    print("IB AI SL Lesson 1.1 Number Foundations v6")
    print(f"Root: {base}")
    print(f"Errors: {len(errors)}")
    for error in errors:
        print(f"  ERROR: {error}")
    if errors:
        return 1
    print("Status: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
