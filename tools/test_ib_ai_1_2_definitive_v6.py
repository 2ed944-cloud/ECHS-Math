#!/usr/bin/env python3
"""Definitive structural and mathematical regression checks for IB AI SL Lesson 1.2 v6."""
from __future__ import annotations

import json
import re
import subprocess
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
LESSON = Path("lessons/ib-math-ai/unit-1")
HTML = LESSON / "lessons/IB_AI_SL_1.2_arithmetic_sequences_ECHS.html"
CSS = LESSON / "assets/css/lesson-1.2-arithmetic-definitive-v6.css"
OVERLAY = LESSON / "data/lesson-1.2-arithmetic-definitive-v6.js"
INTERACTIONS = LESSON / "data/lesson-1.2-arithmetic-v6-interactions.js"
PAGER = LESSON / "data/lesson-1.2-exam-focus-v6.js"
POLISH = LESSON / "data/lesson-1.2-arithmetic-v6-polish.js"
DATA_FILES = [
    LESSON / "data/lesson-1.2.js",
    LESSON / "data/lesson-1.2-v3.js",
    LESSON / "data/unit-1-v5-content-data.js",
    LESSON / "data/unit-1-v5-apply.js",
    OVERLAY,
    POLISH,
]
errors: list[str] = []


def read(path: Path) -> str:
    full = ROOT / path
    if not full.is_file():
        errors.append(f"Missing file: {path}")
        return ""
    return full.read_text(encoding="utf-8", errors="replace")


html = read(HTML)
css = read(CSS)
overlay = read(OVERLAY)
interactions = read(INTERACTIONS)
pager = read(PAGER)

for path in (*DATA_FILES, INTERACTIONS, PAGER):
    result = subprocess.run(["node", "--check", str(ROOT / path)], text=True, capture_output=True)
    if result.returncode:
        errors.append(f"JavaScript syntax failure in {path}: {result.stderr.strip()}")

for marker in (
    "lesson-1.2-arithmetic-definitive-v6.css?v=6.0.0",
    "lesson-1.2-arithmetic-definitive-v6.js?v=6.0.0",
    "lesson-1.2-arithmetic-v6-polish.js?v=6.0.0",
    "lesson-1.2-exam-focus-v6.js?v=6.0.0",
    "lesson-1.2-arithmetic-v6-interactions.js?v=6.0.0",
):
    if marker not in html:
        errors.append(f"HTML missing cache-safe asset: {marker}")

if not (
    html.index("lesson-1.2-arithmetic-definitive-v6.js?v=6.0.0")
    < html.index("lesson-1.2-arithmetic-v6-polish.js?v=6.0.0")
    < html.index("../assets/js/engine.js")
    < html.index("lesson-1.2-arithmetic-v6-interactions.js?v=6.0.0")
):
    errors.append("Lesson data must load before engine and interactions after engine")
if html.index("lesson-1.2-arithmetic-definitive-v6.css?v=6.0.0") > html.index("katex.css"):
    errors.append("Lesson CSS must load before canonical KaTeX CSS")

for forbidden in (
    r"\.katex[^{]*span",
    r"\.katex-display[^{]*span",
    r"display\s*:\s*revert",
):
    if re.search(forbidden, css):
        errors.append(f"KaTeX-destructive CSS pattern found: {forbidden}")

paths_json = json.dumps([str(path) for path in DATA_FILES])
program = f"""
const fs=require('fs');
const vm=require('vm');
const files={paths_json};
const sandbox={{window:{{}},console}};
sandbox.window.window=sandbox.window;
vm.createContext(sandbox);
for(const file of files)vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{{filename:file}});
const d=sandbox.window.LESSON_DATA;
if(!d)throw new Error('LESSON_DATA missing');
process.stdout.write(JSON.stringify({{
 version:d.version,
 title:d.lesson.title,
 slides:d.slides.map(s=>({{title:s.title,section:s.section,kind:s.kind,html:s.html}})),
 practice:d.practice.map(q=>({{id:q.id,level:q.level,prompt:q.prompt,answer:q.answer,solution:q.solution}})),
 quiz:d.quiz.map(q=>({{id:q.id,prompt:q.prompt,answer:q.answer,solution:q.solution}})),
 exam:d.exam.map(t=>({{id:t.id,total:t.total_marks,context:t.context,parts:t.parts.map(p=>({{label:p.label,marks:p.marks,prompt:p.prompt,answer:p.answer,markscheme:p.markscheme}}))}})),
 audit:d.v6Audit
}}));
"""
result = subprocess.run(["node", "-e", program], cwd=ROOT, text=True, capture_output=True)
if result.returncode:
    errors.append(f"Final lesson assembly failed: {result.stderr.strip()}")
    data = {}
else:
    try:
        data = json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        errors.append(f"Final lesson JSON invalid: {exc}")
        data = {}

expected = {"version": "6.0.0", "title": "Arithmetic Sequences and Series"}
for key, value in expected.items():
    if data.get(key) != value:
        errors.append(f"Unexpected {key}: {data.get(key)!r}; expected {value!r}")

slides = data.get("slides", [])
practice = data.get("practice", [])
quiz = data.get("quiz", [])
exam = data.get("exam", [])
for label, actual, expected_count in (
    ("slides", slides, 73),
    ("practice", practice, 96),
    ("quiz", quiz, 14),
    ("exam", exam, 5),
):
    if len(actual) != expected_count:
        errors.append(f"Expected {expected_count} {label}, found {len(actual)}")

titles = [slide.get("title") for slide in slides]
if len(titles) != len(set(titles)):
    errors.append(f"Duplicate slide titles: {[t for t,c in Counter(titles).items() if c>1]}")
for group_name, items in (("practice", practice), ("quiz", quiz), ("exam", exam)):
    ids = [item.get("id") for item in items]
    if len(ids) != len(set(ids)):
        errors.append(f"Duplicate {group_name} IDs")

levels = Counter(item.get("level") for item in practice)
if levels != Counter({"Foundation": 24, "Application": 24, "Reasoning": 24, "Challenge": 24}):
    errors.append(f"Practice distribution mismatch: {dict(levels)}")

for task in exam:
    labels = [part["label"] for part in task["parts"]]
    if len(labels) != len(set(labels)):
        errors.append(f"Duplicate part labels in {task['id']}")
    mark_sum = sum(part["marks"] for part in task["parts"])
    if mark_sum != task["total"]:
        errors.append(f"{task['id']} parts total {mark_sum}; declared {task['total']}")

joined = "\n".join(slide.get("html", "") for slide in slides)
for title in (
    "Sequence, term, series and partial sum",
    "Constant first difference",
    "Why there are n−1 jumps",
    "Sigma notation anatomy",
    "Deriving the arithmetic-series sum",
    "Least n for a cumulative threshold",
    "Recover terms from a formula for Sₙ",
    "Interactive arithmetic-sequence explorer",
    "Generative Arithmetic Studio",
    "Integrated IB-style arithmetic model",
):
    if title not in titles:
        errors.append(f"Missing required instructional screen: {title}")

for marker in (
    r"u_n=u_1+(n-1)d",
    r"S_n=\frac n2(u_1+u_n)",
    r"u_n=S_n-S_{n-1}",
    r"S_{54}=9693",
    "data-as-explorer",
    "data-as-generator",
    "data-sigma-builder",
):
    if marker not in joined:
        errors.append(f"Required lesson marker missing: {marker}")

if "<svg" in joined.lower():
    errors.append("Lesson uses inline SVG despite the stable HTML/CSS graphics contract")

math_pattern = re.compile(r"\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]")
for slide in slides:
    for segment in math_pattern.findall(slide.get("html", "")):
        if "<" in segment or ">" in segment:
            errors.append(f"Raw comparison character remains in math: {slide['title']}")

for item in practice:
    prompt = item.get("prompt", "").lower()
    if "previous question" in prompt or prompt.startswith("for the same"):
        errors.append(f"Practice prompt is not self-contained: {item['id']}")

all_math_sources = []
for slide in slides:
    all_math_sources.append((f"slide {slide.get('title')}", slide.get("html", "")))
for item in practice:
    for field in ("prompt", "answer", "solution"):
        all_math_sources.append((f"practice {item.get('id')} {field}", item.get(field, "")))
for item in quiz:
    for field in ("prompt", "answer", "solution"):
        all_math_sources.append((f"quiz {item.get('id')} {field}", item.get(field, "")))
for task in exam:
    all_math_sources.append((f"exam {task.get('id')} context", task.get("context", "")))
    for part in task.get("parts", []):
        for field in ("prompt", "answer", "markscheme"):
            all_math_sources.append((f"exam {task.get('id')} part {part.get('label')} {field}", part.get(field, "")))
for label, source in all_math_sources:
    for segment in math_pattern.findall(source):
        if "<" in segment or ">" in segment:
            errors.append(f"Raw comparison character remains in math: {label}")

practice_prompts = {re.sub(r"\s+", " ", item["prompt"]).strip().lower() for item in practice}
for item in quiz:
    normalized = re.sub(r"\s+", " ", item["prompt"]).strip().lower()
    if normalized in practice_prompts:
        errors.append(f"Quiz prompt duplicates Practice Studio: {item['id']}")

for marker in (
    "renderInlineMath",
    "\\text{number of terms}",
    "\\quad d=",
    "data-as-explorer",
    "data-as-generator",
    "data-sigma-preset",
    "generatorFactories",
):
    if marker not in interactions:
        errors.append(f"Interaction layer missing marker: {marker}")
for marker in ("exam-task-tabs", "exam-part-tabs", "exam-step-footer-nav", "exam-task-index"):
    if marker not in pager:
        errors.append(f"Assessment pager missing marker: {marker}")

audit = data.get("audit") or {}
for flag in ("htmlCssGraphics", "arithmeticExplorer", "generativeStudio", "sigmaNotation", "inverseProblems", "integerThresholdChecks", "selfContainedPracticePrompts"):
    if audit.get(flag) is not True:
        errors.append(f"Audit flag not true: {flag}")

spot_checks = {
    "ASV6-1.2-E01": (12, [2,2,2,3,2,1]),
    "ASV6-1.2-E02": (13, [2,3,2,3,2,1]),
    "ASV6-1.2-E03": (13, [2,3,2,3,3]),
    "ASV6-1.2-E04": (14, [2,2,2,3,3,2]),
    "ASV6-1.2-E05": (12, [2,2,3,2,2,1]),
}
for task in exam:
    expected_task = spot_checks.get(task["id"])
    if expected_task and (task["total"], [p["marks"] for p in task["parts"]]) != expected_task:
        errors.append(f"Unexpected mark structure for {task['id']}")

print("IB AI SL Lesson 1.2 definitive v6 validation")
print(f"Root: {ROOT}")
print(f"Errors: {len(errors)}")
for error in errors:
    print(f"  ERROR: {error}")
if errors:
    raise SystemExit(1)
print("Status: PASS")
