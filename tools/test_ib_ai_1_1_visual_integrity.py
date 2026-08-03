#!/usr/bin/env python3
"""Static and data-level regression checks for IB AI SL Lesson 1.1."""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

LESSON_ROOT = Path("lessons/ib-math-ai/unit-1")
HTML = LESSON_ROOT / "lessons/IB_AI_SL_1.1_standard_form_ECHS.html"
CSS_FILES = [
    LESSON_ROOT / "assets/css/lesson-1.1-v5-02.css",
    LESSON_ROOT / "assets/css/lesson-1.1-v5-03.css",
    LESSON_ROOT / "assets/css/lesson-1.1-v5-05.css",
]
DATA_FILES = [
    LESSON_ROOT / "data/lesson-1.1.js",
    LESSON_ROOT / "data/lesson-1.1-v5-01.js",
    LESON_ROOT / "data/lesson-1.1-v5-02.js" if False else LESSON_ROOT / "data/lesson-1.1-v5-02.js",
    LESSON_ROOT / "data/lesson-1.1-v5-03.js",
    LESSON_ROOT / "data/lesson-1.1-v5-04.js",
    LESSON_ROOT / "data/lesson-1.1-v5-05.js",
]


def read(root: Path, relative: Path, errors: list[str]) -> str:
    path = root / relative
    if not path.is_file():
        errors.append(f"Missing file: {relative}")
        return ""
    return path.read_text(encoding="utf-8", errors="replace")


def validate_css(root: Path, errors: list[str]) -> None:
    html = read(root, HTML, errors)
    css = "\n".join(read(root, path, errors) for path in CSS_FILES)

    if html.count("assets/css/katex.css") != 1:
        errors.append("Lesson must load the canonical KaTeX stylesheet exactly once")
    for marker in (
        "lesson-1.1-v5-02.css?v=5.2.0",
        "lesson-1.1-v5-03.css?v=5.2.0",
        "lesson-1.1-v5-05.css?v=5.2.0",
        "lesson-1.1-v5-05.js?v=5.2.0",
        "katex.css?v=5.2.0",
    ):
        if marker not in html:
            errors.append(f"Lesson HTML missing cache-safe marker: {marker}")

    forbidden_patterns = {
        r"\.worked-head\s+span": "worked-head descendant span selector",
        r"\.student-head\s+span": "student-head descendant span selector",
        r"\.status-row\s+span": "status-row descendant span selector",
        r"\.validation-grid\s+span": "validation-grid descendant span selector",
        r"\.unit-grid\s+span": "unit-grid descendant span selector",
        r"\.application-head\s+span": "application-head descendant span selector",
        r"\.ib-task-head\s+span": "ib-task-head descendant span selector",
        r"\.operation-flow\s+span": "operation-flow descendant span selector",
        r"\.wrong-path\s+span": "wrong-path descendant span selector",
        r"\.right-path\s+span": "right-path descendant span selector",
        r"\.quantity-row\s+span": "quantity-row descendant span selector",
        r"\.move\s+span": "move descendant span selector",
        r"\.katex(?:-display)?[^\{]*\s+span": "direct styling of KaTeX internal spans",
        r"display\s*:\s*revert": "destructive display revert",
    }
    for pattern, label in forbidden_patterns.items():
        if re.search(pattern, css):
            errors.append(f"Forbidden CSS found: {label}")

    required_selectors = (
        ".worked-head>span",
        ".student-head>span",
        ".status-row>span",
        ".validation-grid>div>span",
        ".unit-grid>div>span",
        ".application-head>span",
        ".ib-task-head>span",
        ".operation-flow>div>span",
    )
    for selector in required_selectors:
        if selector not in css:
            errors.append(f"Missing direct-child selector: {selector}")


def validate_data(root: Path, errors: list[str]) -> None:
    for relative in DATA_FILES:
        path = root / relative
        result = subprocess.run(["node", "--check", str(path)], text=True, capture_output=True)
        if result.returncode:
            errors.append(f"JavaScript syntax failure in {relative}: {result.stderr.strip()}")

    paths_json = json.dumps([str(path) for path in DATA_FILES])
    node_program = f"""
const fs=require('fs');
const vm=require('vm');
const files={paths_json};
const sandbox={{window:{{}}}};
sandbox.window.window=sandbox.window;
vm.createContext(sandbox);
for(const file of files) vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{{filename:file}});
const d=sandbox.window.LESSON_DATA;
if(!d) throw new Error('LESSON_DATA not defined');
const out={{
 version:d.version,
 slides:d.slides.length,
 practice:d.practice.length,
 quiz:d.quiz.length,
 exam:d.exam.length,
 titles:d.slides.map(s=>s.title),
 html:d.slides.map(s=>s.html)
}};
process.stdout.write(JSON.stringify(out));
"""
    result = subprocess.run(["node", "-e", node_program], cwd=root, text=True, capture_output=True)
    if result.returncode:
        errors.append(f"Lesson data assembly failed: {result.stderr.strip()}")
        return
    try:
        data = json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        errors.append(f"Lesson data output was not valid JSON: {exc}")
        return

    expected = {"version": "5.2.0", "slides": 36, "practice": 52, "quiz": 14, "exam": 3}
    for key, value in expected.items():
        if data.get(key) != value:
            errors.append(f"Unexpected {key}: {data.get(key)!r}; expected {value!r}")

    titles = data.get("titles", [])
    if len(titles) != len(set(titles)):
        errors.append("Lesson slide titles are not unique")

    html_blocks = data.get("html", [])
    for index, block in enumerate(html_blocks, start=1):
        for left, right, label in ((r"\\(", r"\\)", "inline math"), (r"\\[", r"\\]", "display math")):
            if block.count(left) != block.count(right):
                errors.append(f"Slide {index} has unbalanced {label} delimiters")
        if "<svg" in block.lower():
            errors.append(f"Slide {index} contains an inline SVG")

    joined = "\n".join(html_blocks)
    required_math = (
        r"N=a\\times10^k",
        r"10^m10^n=10^{m+n}",
        r"72\\,900\\,000=7.29\\times10^7",
        r"0.000000438=4.38\\times10^{-7}",
        r"1.17\\times10^6\\text{ m}^2",
        r"2.4\\times10^6",
        r"4.26\\times10^{-3}",
        r"1\\text{ km}^2=(10^3\\text{ m})^2=10^6\\text{ m}^2",
    )
    for marker in required_math:
        if marker not in joined:
            errors.append(f"Required mathematical statement missing: {marker}")


def main() -> int:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
    errors: list[str] = []
    validate_css(root, errors)
    validate_data(root, errors)
    print("IB AI SL Lesson 1.1 visual integrity")
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
