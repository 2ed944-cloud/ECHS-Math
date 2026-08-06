#!/usr/bin/env python3
"""Regression checks for the retained IB AI SL Lesson 1.1 content foundation."""
from __future__ import annotations

import json
import math
import re
import subprocess
import sys
from collections import Counter
from pathlib import Path

U1 = Path("lessons/ib-math-ai/unit-1")
HTML = U1 / "lessons/IB_AI_SL_1.1_standard_form_ECHS.html"
CATALOG = Path("data/ib-math-ai-unit-1-delivery-catalog.json")
DATA = [
    U1 / "data/lesson-1.1.js",
    U1 / "data/lesson-1.1-v5-01.js",
    U1 / "data/lesson-1.1-v5-02.js",
    U1 / "data/lesson-1.1-v5-03.js",
    U1 / "data/lesson-1.1-v5-04.js",
    U1 / "data/lesson-1.1-v5-05.js",
    U1 / "data/lesson-1.1-number-foundations-v6-content.js",
    U1 / "data/lesson-1.1-number-foundations-v6-polish.js",
]
INTERACTIONS = U1 / "data/lesson-1.1-number-foundations-v6-interactions.js"
CSS = [
    U1 / "assets/css/lesson-1.1-number-foundations-v6-core.css",
    U1 / "assets/css/lesson-1.1-number-foundations-v6-precision.css",
    U1 / "assets/css/lesson-1.1-number-foundations-v6-responsive.css",
]


def read(root: Path, path: Path, errors: list[str]) -> str:
    target = root / path
    if not target.is_file():
        errors.append(f"Missing file: {path}")
        return ""
    return target.read_text(encoding="utf-8", errors="replace")


def assemble(root: Path, errors: list[str]) -> dict:
    program = f"""
const fs=require('fs'),vm=require('vm');
const files={json.dumps([str(p) for p in DATA])};
const sandbox={{window:{{}}}};sandbox.window.window=sandbox.window;vm.createContext(sandbox);
for(const file of files)vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{{filename:file}});
const d=sandbox.window.LESSON_DATA;if(!d)throw new Error('LESSON_DATA missing');
process.stdout.write(JSON.stringify({{version:d.version,slides:d.slides,practice:d.practice,quiz:d.quiz,exam:d.exam,audit:d.v6Audit}}));
"""
    result = subprocess.run(["node", "-e", program], cwd=root, text=True, capture_output=True)
    if result.returncode:
        errors.append(f"Data assembly failed: {result.stderr.strip()}")
        return {}
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        errors.append(f"Data assembly returned invalid JSON: {exc}")
        return {}


def validate_catalog(catalog_text: str, errors: list[str]) -> None:
    try:
        catalog = json.loads(catalog_text)
        lessons = catalog["lessons"]
        lesson = next(item for item in lessons if item["number"] == "1.1")
        expected_lesson = {
            "release": "6.8.0",
            "learn_slides": 79,
            "practice_questions": 96,
            "timed_quiz_questions": 14,
            "extended_tasks": 5,
        }
        for key, expected_value in expected_lesson.items():
            if lesson.get(key) != expected_value:
                errors.append(f"Catalog {key} is {lesson.get(key)!r}; expected {expected_value!r}")
        if lesson.get("title") != "Scientific Notation, Approximation and Error":
            errors.append(f"Catalog title is {lesson.get('title')!r}")
        if lesson.get("calculator", {}).get("external_dependency") is not False:
            errors.append("Catalog local calculator dependency flag is incorrect")

        computed_totals = {
            "lessons": len(lessons),
            "learn_slides": sum(item.get("learn_slides", 0) for item in lessons),
            "practice_questions": sum(item.get("practice_questions", 0) for item in lessons),
            "timed_quiz_questions": sum(item.get("timed_quiz_questions", 0) for item in lessons),
            "extended_tasks": sum(item.get("extended_tasks", 0) for item in lessons),
        }
        if catalog.get("totals") != computed_totals:
            errors.append(
                f"Catalog totals {catalog.get('totals')} do not equal the sum of lesson metadata {computed_totals}"
            )
    except (json.JSONDecodeError, KeyError, StopIteration) as exc:
        errors.append(f"Catalog validation failed: {exc}")


def validate(root: Path, errors: list[str]) -> None:
    html = read(root, HTML, errors)
    catalog_text = read(root, CATALOG, errors)
    interactions = read(root, INTERACTIONS, errors)
    css = "\n".join(read(root, path, errors) for path in CSS)

    for marker in (
        "lesson-1.1-number-foundations-v6-core.css?v=6.0.0",
        "lesson-1.1-number-foundations-v6-precision.css?v=6.0.0",
        "lesson-1.1-number-foundations-v6-responsive.css?v=6.0.0",
        "lesson-1.1-number-foundations-v6-content.js?v=6.0.0",
        "lesson-1.1-number-foundations-v6-polish.js?v=6.0.0",
        "lesson-1.1-number-foundations-v6-interactions.js?v=6.0.0",
        "lesson-1.1-ti84-local-v6-8.js?v=6.8.0",
        "lesson-1.1-ti84-local-input-v6-8-1.js?v=6.8.1",
    ):
        if marker not in html:
            errors.append(f"HTML missing Lesson 1.1 asset: {marker}")

    for path in (*DATA, INTERACTIONS):
        result = subprocess.run(["node", "--check", str(root / path)], text=True, capture_output=True)
        if result.returncode:
            errors.append(f"JavaScript syntax failed in {path}: {result.stderr.strip()}")

    for marker in ("data-number-set-explorer", "data-bound-explorer", "data-nf-generator", "countSignificantFigures"):
        if marker not in interactions:
            errors.append(f"Interactive controller missing: {marker}")
    for marker in (".nf-set-map-canvas", ".nf-bound-explorer", ".nf-generator-card", "@media(max-width:700px)"):
        if marker not in css:
            errors.append(f"v6 CSS missing: {marker}")
    if re.search(r"\.katex(?:-display)?[^\{]*\s+span", css) or re.search(r"display\s*:\s*revert", css):
        errors.append("v6 CSS contains a forbidden KaTeX/display reset")

    data = assemble(root, errors)
    if not data:
        return
    expected = {"version": "6.0.0", "slides": 79, "practice": 96, "quiz": 14, "exam": 5}
    if data.get("version") != expected["version"]:
        errors.append(f"Version {data.get('version')!r}; expected 6.0.0")
    for key in ("slides", "practice", "quiz", "exam"):
        if len(data.get(key, [])) != expected[key]:
            errors.append(f"{key} count {len(data.get(key, []))}; expected {expected[key]}")

    titles = [item["title"] for item in data["slides"]]
    if len(titles) != len(set(titles)):
        errors.append("Slide titles are not unique")
    required_sequence = [
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
    for title in required_sequence:
        if title not in titles:
            errors.append(f"Missing screen: {title}")
        else:
            positions.append(titles.index(title))
    if positions != sorted(positions):
        errors.append(f"Instructional sequence is incorrect: {positions}")
    if any("<svg" in item.get("html", "").lower() for item in data["slides"]):
        errors.append("Assembled slides contain inline SVG")

    levels = Counter(item["level"] for item in data["practice"])
    if levels != Counter({"Foundation": 24, "Application": 24, "Reasoning": 24, "Challenge": 24}):
        errors.append(f"Practice distribution is {dict(levels)}")
    for key in ("practice", "quiz", "exam"):
        ids = [item["id"] for item in data[key]]
        if len(ids) != len(set(ids)):
            errors.append(f"Duplicate IDs in {key}")
    for task in data["exam"]:
        if sum(part["marks"] for part in task["parts"]) != task["total_marks"]:
            errors.append(f"Mark total mismatch in {task['id']}")

    audit = data.get("audit") or {}
    for flag in ("numberSetMap", "boundsExplorer", "generatedQuestionStudio", "coverAlignedToFullScope", "learningGoalsAligned"):
        if audit.get(flag) is not True:
            errors.append(f"Audit flag is not true: {flag}")
    expected_water = [math.pi * 2.395**2 * 5.75, math.pi * 2.405**2 * 5.85]
    expected_optical = [math.pi * 4.195**2 / 4, math.pi * 4.205**2 / 4]
    for actual, expected_value in zip(audit.get("waterBounds", []), expected_water):
        if not math.isclose(actual, expected_value, rel_tol=1e-10):
            errors.append("Water bound audit failed")
    for actual, expected_value in zip(audit.get("opticalBounds", []), expected_optical):
        if not math.isclose(actual, expected_value, rel_tol=1e-10):
            errors.append("Optical bound audit failed")

    validate_catalog(catalog_text, errors)


def main() -> int:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
    errors: list[str] = []
    validate(root, errors)
    print("IB AI SL Lesson 1.1 retained content foundation")
    print(f"Errors: {len(errors)}")
    for error in errors:
        print(f"  ERROR: {error}")
    if errors:
        return 1
    print("Status: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
