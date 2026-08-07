#!/usr/bin/env python3
"""Regression checks for the focused IB assessment experience in Lesson 1.1."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

LESSON_ROOT = Path("lessons/ib-math-ai/unit-1")
HTML = LESSON_ROOT / "lessons/IB_AI_SL_1.1_standard_form_ECHS.html"
CSS = LESSON_ROOT / "assets/css/lesson-1.1-exam-v5-2-1.css"
JS = LESSON_ROOT / "data/lesson-1.1-exam-v5-2-1.js"
CATALOG = Path("data/ib-math-ai-unit-1-delivery-catalog.json")
DATA_FILES = [
    LESSON_ROOT / "data/lesson-1.1.js",
    LESSON_ROOT / "data/lesson-1.1-v5-01.js",
    LESSON_ROOT / "data/lesson-1.1-v5-02.js",
    LESSON_ROOT / "data/lesson-1.1-v5-03.js",
    LESSON_ROOT / "data/lesson-1.1-v5-04.js",
    LESSON_ROOT / "data/lesson-1.1-v5-05.js",
    LESSON_ROOT / "data/lesson-1.1-number-foundations-v6-content.js",
    LESSON_ROOT / "data/lesson-1.1-number-foundations-v6-polish.js",
]


def read(root: Path, relative: Path, errors: list[str]) -> str:
    path = root / relative
    if not path.is_file():
        errors.append(f"Missing file: {relative}")
        return ""
    return path.read_text(encoding="utf-8", errors="replace")


def require(text: str, markers: tuple[str, ...], label: str, errors: list[str]) -> None:
    for marker in markers:
        if marker not in text:
            errors.append(f"{label} missing marker: {marker}")


def validate(root: Path, errors: list[str]) -> None:
    html = read(root, HTML, errors)
    css = read(root, CSS, errors)
    script = read(root, JS, errors)
    catalog_text = read(root, CATALOG, errors)

    require(
        html,
        (
            "lesson-1.1-exam-v5-2-1.css?v=5.2.2",
            "lesson-1.1-exam-v5-2-1.js?v=5.2.2",
            "lesson-1.1-number-foundations-v6-content.js?v=6.0.0",
        ),
        "Lesson HTML",
        errors,
    )
    require(
        css,
        (
            "body.exam-assessment-active .footer",
            ".exam-task-tabs",
            ".exam-part-tabs",
            ".exam-part-tab[aria-selected=\"true\"]",
            ".exam-task-panel[hidden]",
            ".exam-part-card[hidden]",
            ".exam-part-stage",
            ".exam-step-footer-nav",
            "grid-template-areas:",
            '"prompt response"',
        ),
        "Assessment stylesheet",
        errors,
    )
    require(
        script,
        (
            "exam-route-part-paged",
            "data-exam-task-tab",
            "data-exam-part-tab",
            "exam-part-stage",
            "exam-step-footer-nav",
            "showTaskPart",
            "moveStep",
            "part.hidden = !active",
            "document.body.classList.toggle('exam-assessment-active'",
            "MutationObserver",
            "This response is saved automatically.",
        ),
        "Assessment controller",
        errors,
    )

    syntax = subprocess.run(["node", "--check", str(root / JS)], text=True, capture_output=True)
    if syntax.returncode:
        errors.append(f"Assessment controller JavaScript syntax failed: {syntax.stderr.strip()}")

    try:
        catalog = json.loads(catalog_text)
        lesson = next(item for item in catalog["lessons"] if item["number"] == "1.1")
        if lesson.get("release") != "6.9.0":
            errors.append(f"Catalog release is {lesson.get('release')!r}; expected '6.9.0'")
        if lesson.get("extended_tasks") != 5:
            errors.append("Catalog must declare exactly 5 extended tasks")
    except (json.JSONDecodeError, KeyError, StopIteration) as exc:
        errors.append(f"Could not validate delivery catalog: {exc}")

    data_paths = json.dumps([str(path) for path in DATA_FILES])
    node_program = f"""
const fs=require('fs');
const vm=require('vm');
const files={data_paths};
const sandbox={{window:{{}}}};
sandbox.window.window=sandbox.window;
vm.createContext(sandbox);
for(const file of files) vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{{filename:file}});
const d=sandbox.window.LESSON_DATA;
if(!d) throw new Error('LESSON_DATA missing');
process.stdout.write(JSON.stringify({{
  tasks:d.exam.length,
  parts:d.exam.map(task=>task.parts.length),
  marks:d.exam.map(task=>task.total_marks),
  ids:d.exam.map(task=>task.id),
  titles:d.exam.map(task=>task.title),
  labels:d.exam.map(task=>task.parts.map(part=>part.label)),
  partMarks:d.exam.map(task=>task.parts.reduce((sum,part)=>sum+part.marks,0))
}}));
"""
    assembled = subprocess.run(["node", "-e", node_program], cwd=root, text=True, capture_output=True)
    if assembled.returncode:
        errors.append(f"Assessment data assembly failed: {assembled.stderr.strip()}")
        return
    try:
        data = json.loads(assembled.stdout)
    except json.JSONDecodeError as exc:
        errors.append(f"Assessment data output was not JSON: {exc}")
        return
    if data.get("tasks") != 5:
        errors.append(f"Expected 5 assessment tasks; found {data.get('tasks')}")
    if any(parts < 3 for parts in data.get("parts", [])):
        errors.append(f"Every assessment task must contain at least 3 parts: {data.get('parts')}")
    if len(data.get("ids", [])) != len(set(data.get("ids", []))):
        errors.append("Assessment task IDs are not unique")
    if len(data.get("titles", [])) != len(set(data.get("titles", []))):
        errors.append("Assessment task titles are not unique")
    for task_labels in data.get("labels", []):
        if len(task_labels) != len(set(task_labels)):
            errors.append(f"Assessment part labels are not unique within a task: {task_labels}")
    if data.get("marks") != data.get("partMarks"):
        errors.append(f"Declared task marks do not match part totals: {data.get('marks')} vs {data.get('partMarks')}")


def main() -> int:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
    errors: list[str] = []
    validate(root, errors)
    print("IB AI SL Lesson 1.1 assessment layout")
    print(f"Root: {root}")
    print(f"Errors: {len(errors)}")
    for error in errors:
        print(f"  ERROR: {error}")
    if errors:
        return 1
    print("Status: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
