#!/usr/bin/env python3
"""Regression checks for the Lesson 1.1 v6.0.1 graphics and KaTeX hotfix."""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
LESSON = ROOT / "lessons/ib-math-ai/unit-1"
HTML = LESSON / "lessons/IB_AI_SL_1.1_standard_form_ECHS.html"
CSS = LESSON / "assets/css/lesson-1.1-number-foundations-v6-1-precision-fix.css"
FIX_JS = LESSON / "data/lesson-1.1-number-foundations-v6-1-precision-fix.js"
DATA_FILES = [
    LESSON / "data/lesson-1.1.js",
    LESSON / "data/lesson-1.1-v5-01.js",
    LESSON / "data/lesson-1.1-v5-02.js",
    LESSON / "data/lesson-1.1-v5-03.js",
    LESSON / "data/lesson-1.1-v5-04.js",
    LESSON / "data/lesson-1.1-v5-05.js",
    LESSON / "data/lesson-1.1-number-foundations-v6-content.js",
    LESSON / "data/lesson-1.1-number-foundations-v6-polish.js",
    FIX_JS,
]

errors: list[str] = []


def read(path: Path) -> str:
    if not path.is_file():
        errors.append(f"Missing file: {path.relative_to(ROOT)}")
        return ""
    return path.read_text(encoding="utf-8", errors="replace")


html = read(HTML)
css = read(CSS)
fix_js = read(FIX_JS)

for marker in (
    "lesson-1.1-number-foundations-v6-1-precision-fix.css?v=6.0.1",
    "lesson-1.1-number-foundations-v6-1-precision-fix.js?v=6.0.1",
):
    if html.count(marker) != 1:
        errors.append(f"HTML must load exactly one cache-safe marker: {marker}")

if html.find("lesson-1.1-number-foundations-v6-1-precision-fix.js") > html.find("assets/js/engine.js"):
    errors.append("Data-level precision fix must load before the lesson engine")
if html.find("lesson-1.1-number-foundations-v6-1-precision-fix.css") > html.find("assets/css/katex.css"):
    errors.append("Graphics hotfix must load before the canonical KaTeX stylesheet")

syntax = subprocess.run(["node", "--check", str(FIX_JS)], text=True, capture_output=True)
if syntax.returncode:
    errors.append(f"JavaScript syntax failure: {syntax.stderr.strip()}")

paths_json = json.dumps([str(path.relative_to(ROOT)) for path in DATA_FILES])
node_program = f"""
const fs=require('fs');
const vm=require('vm');
const files={paths_json};
const sandbox={{window:{{}}}};
sandbox.window.window=sandbox.window;
vm.createContext(sandbox);
for(const file of files) vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{{filename:file}});
const d=sandbox.window.LESSON_DATA;
if(!d) throw new Error('LESSON_DATA missing');
process.stdout.write(JSON.stringify({{
  counts:[d.slides.length,d.practice.length,d.quiz.length,d.exam.length],
  slides:Object.fromEntries(d.slides.map(slide=>[slide.title,slide.html])),
  audit:d.v6Audit||{{}}
}}));
"""
assembled = subprocess.run(
    ["node", "-e", node_program], cwd=ROOT, text=True, capture_output=True
)
if assembled.returncode:
    errors.append(f"Lesson assembly failed: {assembled.stderr.strip()}")
    lesson_data = {"counts": [], "slides": {}, "audit": {}}
else:
    try:
        lesson_data = json.loads(assembled.stdout)
    except json.JSONDecodeError as exc:
        errors.append(f"Lesson assembly did not return JSON: {exc}")
        lesson_data = {"counts": [], "slides": {}, "audit": {}}

if lesson_data.get("counts") != [79, 96, 14, 5]:
    errors.append(f"Delivery counts changed unexpectedly: {lesson_data.get('counts')}")

slides: dict[str, str] = lesson_data.get("slides", {})
required_screen_markers = {
    "Decimal places measure distance from the decimal point": (
        "nf-digit-diagram nf-dp-diagram",
        "1st d.p.",
        "guard digit",
    ),
    "Significant figures measure meaningful digits": (
        "nf-digit-diagram nf-sf-diagram",
        "1st significant figure",
        "leading zero",
    ),
    "Rounding creates an interval of possible exact values": (
        r"x_0-\frac h2\leq x\lt x_0+\frac h2",
        "filled point belongs",
        "half-unit",
    ),
    "Bounds in sums, differences, products and powers": (
        "nf-bound-rule-grid",
        "nf-bound-rule-card",
        "nf-bound-example",
        r"16.81\leq r^2\lt17.64",
    ),
    "Bounds in quotients": (
        "nf-quotient-example",
        r"3.2\lt x/y\lt4.5",
        "positive denominator interval",
    ),
}
for title, markers in required_screen_markers.items():
    block = slides.get(title, "")
    if not block:
        errors.append(f"Missing repaired screen: {title}")
        continue
    for marker in markers:
        if marker not in block:
            errors.append(f"Screen {title!r} missing marker: {marker}")

bounds_block = slides.get("Bounds in sums, differences, products and powers", "")
if bounds_block.count("nf-bound-rule-card") != 4:
    errors.append("Calculated-bounds screen must contain four operation cards")
if bounds_block.count("nf-bound-example") != 4:
    errors.append("Every calculated-bounds operation must contain an example")

math_segment = re.compile(r"\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]")
for title, block in slides.items():
    for segment in math_segment.findall(block):
        if "<" in segment:
            errors.append(f"Raw less-than sign remains inside math on screen: {title}")
        if r"\\lt" in segment:
            errors.append(f"Double-backslash lt command remains on screen: {title}")

for flag in (
    "numberSetContainmentGeometry",
    "decimalPlaceLabelsSeparated",
    "significantFigureLabelsSeparated",
    "calculatedBoundsExamples",
    "rawLessThanMathSanitized",
):
    if lesson_data.get("audit", {}).get(flag) is not True:
        errors.append(f"Missing audit flag: {flag}")

if "grid-template-columns:repeat(5" not in css.replace(" ", ""):
    errors.append("Cover path is not a five-column equal-step layout")
if ".nf-cover-path>i" not in css or "display:none" not in css:
    errors.append("Legacy cover arrows are not removed from the grid flow")
if "grid-template-rows:minmax(67px,auto) minmax(48px,auto)" not in css:
    errors.append("Digit labels do not have a dedicated second grid row")
if re.search(r"\.nf-digit-cell>small\s*\{[^}]*position\s*:\s*absolute", css, re.S):
    errors.append("Digit labels must not use absolute positioning")


def box(selector: str) -> tuple[float, float, float, float] | None:
    pattern = re.compile(
        rf"{re.escape(selector)}\s*\{{(?P<body>[^}}]+)\}}", re.S
    )
    matches = list(pattern.finditer(css))
    if not matches:
        errors.append(f"Missing geometry selector: {selector}")
        return None
    for match in matches:
        body = match.group("body")
        values: dict[str, float] = {}
        for key in ("left", "top", "width", "height"):
            found = re.search(rf"{key}\s*:\s*([0-9.]+)%", body)
            if found:
                values[key] = float(found.group(1))
        if len(values) == 4:
            return values["left"], values["top"], values["width"], values["height"]
    errors.append(f"{selector} has no complete percentage geometry rule")
    return None


def contains(outer: tuple[float, float, float, float], inner: tuple[float, float, float, float]) -> bool:
    ox, oy, ow, oh = outer
    ix, iy, iw, ih = inner
    return ix >= ox and iy >= oy and ix + iw <= ox + ow and iy + ih <= oy + oh

boxes = {
    name: box(f"html.ap-screen-lesson .nf-ring-{name}")
    for name in ("c", "r", "q", "z", "n")
}
irrational = box("html.ap-screen-lesson .nf-irrational-pocket")
if all(boxes.values()):
    if not contains(boxes["c"], boxes["r"]):
        errors.append("Real-number region is not contained in the complex region")
    if not contains(boxes["r"], boxes["q"]):
        errors.append("Rational-number region is not contained in the real region")
    if not contains(boxes["q"], boxes["z"]):
        errors.append("Integer region is not contained in the rational region")
    if not contains(boxes["z"], boxes["n"]):
        errors.append("Natural-number region is not contained in the integer region")
if irrational and boxes.get("r"):
    if not contains(boxes["r"], irrational):
        errors.append("Irrational region is not contained in the real region")
if irrational and boxes.get("q"):
    q_right = boxes["q"][0] + boxes["q"][2]
    irrational_left = irrational[0]
    if q_right > irrational_left:
        errors.append("Irrational region overlaps the rational region in the desktop geometry")

print("IB AI SL Lesson 1.1 v6.0.1 graphics and KaTeX regression")
print(f"Root: {ROOT}")
print(f"Errors: {len(errors)}")
for error in errors:
    print(f"  ERROR: {error}")
if errors:
    raise SystemExit(1)
print("Status: PASS")
