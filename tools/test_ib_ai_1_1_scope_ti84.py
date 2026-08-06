#!/usr/bin/env python3
"""Regression checks for IB AI SL Lesson 1.1 core scope and TI-84 classroom v6.2."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT_REL = Path("lessons/ib-math-ai/unit-1")
HTML = ROOT_REL / "lessons/IB_AI_SL_1.1_standard_form_ECHS.html"
START_HERE = ROOT_REL / "START_HERE.html"
SCOPE = ROOT_REL / "data/lesson-1.1-ib-sl-scope-v6-2.js"
SCOPE_RUNTIME = ROOT_REL / "data/lesson-1.1-ib-sl-scope-runtime-v6-2.js"
TI_WORKFLOWS = ROOT_REL / "data/lesson-1.1-ti84-classroom-workflows-v6-2.js"
TI_RUNTIME = ROOT_REL / "data/lesson-1.1-ti84-classroom-runtime-v6-2.js"
SCOPE_CSS = ROOT_REL / "assets/css/lesson-1.1-scope-v6-2.css"
PACING = ROOT_REL / "data/ib-ai-sl-pacing-markers.js"
DATA = [
    ROOT_REL / "data/lesson-1.1.js",
    ROOT_REL / "data/lesson-1.1-v5-01.js",
    ROOT_REL / "data/lesson-1.1-v5-02.js",
    ROOT_REL / "data/lesson-1.1-v5-03.js",
    ROOT_REL / "data/lesson-1.1-v5-04.js",
    ROOT_REL / "data/lesson-1.1-v5-05.js",
    ROOT_REL / "data/lesson-1.1-number-foundations-v6-content.js",
    ROOT_REL / "data/lesson-1.1-number-foundations-v6-polish.js",
    ROOT_REL / "data/lesson-1.1-number-foundations-v6-1-precision-fix.js",
    SCOPE,
]


def read(root: Path, path: Path, errors: list[str]) -> str:
    target = root / path
    if not target.is_file():
        errors.append(f"Missing file: {path}")
        return ""
    return target.read_text(encoding="utf-8", errors="replace")


def node_check(root: Path, path: Path, errors: list[str]) -> None:
    result = subprocess.run(["node", "--check", str(root / path)], text=True, capture_output=True)
    if result.returncode:
        errors.append(f"JavaScript syntax failed in {path}: {result.stderr.strip()}")


def assemble(root: Path, search: str, errors: list[str]) -> dict:
    program = f"""
const fs=require('fs'),vm=require('vm');
const files={json.dumps([str(path) for path in DATA])};
const sandbox={{window:{{location:{{search:{json.dumps(search)}}}}}};
sandbox.window.window=sandbox.window;
vm.createContext(sandbox);
for(const file of files)vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{{filename:file}});
const d=sandbox.window.LESSON_DATA;
process.stdout.write(JSON.stringify({{
  lesson:d.lesson,slides:d.slides,practice:d.practice,quiz:d.quiz,exam:d.exam,
  scopeCollections:d.scopeCollections,audit:d.v6Audit
}}));
"""
    result = subprocess.run(["node", "-e", program], cwd=root, text=True, capture_output=True)
    if result.returncode:
        errors.append(f"Data assembly failed for {search!r}: {result.stderr.strip()}")
        return {}
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        errors.append(f"Data assembly returned invalid JSON for {search!r}: {exc}")
        return {}


def load_workflows(root: Path, errors: list[str]) -> dict:
    program = f"""
const fs=require('fs'),vm=require('vm');
const sandbox={{window:{{LESSON_DATA:{{lesson:{{number:'1.1'}}}}}}}};
sandbox.window.window=sandbox.window;vm.createContext(sandbox);
vm.runInContext(fs.readFileSync({json.dumps(str(TI_WORKFLOWS))},'utf8'),sandbox);
process.stdout.write(JSON.stringify({{workflows:sandbox.window.ECHS_TI84_CLASSROOM_WORKFLOWS,meta:sandbox.window.LESSON_DATA.ti84Classroom}}));
"""
    result = subprocess.run(["node", "-e", program], cwd=root, text=True, capture_output=True)
    if result.returncode:
        errors.append(f"TI-84 workflow assembly failed: {result.stderr.strip()}")
        return {}
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        errors.append(f"TI-84 workflow assembly returned invalid JSON: {exc}")
        return {}


def slide(snapshot: dict, title: str) -> dict:
    return next((item for item in snapshot.get("slides", []) if item.get("title") == title), {})


def validate(root: Path, errors: list[str]) -> None:
    html = read(root, HTML, errors)
    start_here = read(root, START_HERE, errors)
    scope_source = read(root, SCOPE, errors)
    scope_runtime = read(root, SCOPE_RUNTIME, errors)
    workflow_source = read(root, TI_WORKFLOWS, errors)
    ti_runtime = read(root, TI_RUNTIME, errors)
    css = read(root, SCOPE_CSS, errors)
    pacing = read(root, PACING, errors)

    for path in (SCOPE, SCOPE_RUNTIME, TI_WORKFLOWS, TI_RUNTIME, PACING):
        node_check(root, path, errors)

    required_html = [
        "lesson-1.1-scope-v6-2.css?v=6.2.0",
        "lesson-1.6-ti84-classroom-coach-v6-2.css?v=6.2.0",
        "lesson-1.1-ib-sl-scope-v6-2.js?v=6.2.0",
        "lesson-1.1-ti84-classroom-workflows-v6-2.js?v=6.2.0",
        "ib-ai-sl-pacing-markers.js?v=1.1.0",
        "lesson-1.1-ib-sl-scope-runtime-v6-2.js?v=6.2.0",
        "lesson-1.1-ti84-classroom-runtime-v6-2.js?v=6.2.0",
        "Scientific Notation, Approximation and Error",
    ]
    for marker in required_html:
        if marker not in html:
            errors.append(f"Lesson HTML missing marker: {marker}")
    for marker in ("Scientific Notation, Approximation and Error", "TI‑84 Classroom", "scope v6.2", "Teaching release 6.2.0"):
        if marker not in start_here:
            errors.append(f"Unit landing page missing Lesson 1.1 release marker: {marker}")
    ordered = [
        "lesson-1.1-number-foundations-v6-1-precision-fix.js",
        "lesson-1.1-ib-sl-scope-v6-2.js",
        "lesson-1.1-ti84-classroom-workflows-v6-2.js",
        "ib-ai-sl-pacing-markers.js",
        "engine.js",
        "lesson-1.1-ib-sl-scope-runtime-v6-2.js",
        "lesson-1.1-ti84-classroom-runtime-v6-2.js",
    ]
    positions = [html.find(marker) for marker in ordered]
    if any(position < 0 for position in positions) or positions != sorted(positions):
        errors.append(f"Lesson asset order is unsafe: {dict(zip(ordered, positions))}")

    for marker in ("scope-focus-grid", "scope-extension-ribbon", "number-scope-toggle", "nf-ti84-core-note"):
        if marker not in css:
            errors.append(f"Scope CSS missing: {marker}")
    for marker in ("scopeCollections", "SL 1.1", "SL 1.6", "NFV6-1.1-E06", "ibNaturalNumberConvention"):
        if marker not in scope_source:
            errors.append(f"Scope data patch missing: {marker}")
    for marker in ("visibleIndices", "core-only weighted learning evidence", "scope-extension-ribbon"):
        if marker not in scope_runtime:
            errors.append(f"Scope runtime missing: {marker}")
    for marker in ("EE", "SCI", "NORM", "guard-digits", "ti84calc.com/ti84calc"):
        if marker not in workflow_source + ti_runtime:
            errors.append(f"TI-84 implementation missing: {marker}")
    if "slide.scope==='extension'" not in pacing or "explicitScopePrecedence:true" not in pacing:
        errors.append("Pacing markers do not honour explicit core/extension scope")

    core = assemble(root, "", errors)
    complete = assemble(root, "?scope=all", errors)
    if not core or not complete:
        return

    if core["lesson"].get("active_scope") != "core" or complete["lesson"].get("active_scope") != "all":
        errors.append("Scope query does not switch lesson mode")
    if core["lesson"].get("scope_release") != "6.2.0":
        errors.append("Lesson scope release is not 6.2.0")
    if core["lesson"].get("title") != "Scientific Notation, Approximation and Error":
        errors.append(f"Unexpected lesson title: {core['lesson'].get('title')}")
    if core["lesson"].get("official_scope", {}).get("core_sections", [{}])[0].get("code") != "SL 1.1":
        errors.append("SL 1.1 official scope metadata missing")

    collections = complete.get("scopeCollections") or {}
    expected_totals = {"slides": 79, "practice": 96, "quiz": 14, "exam": 6}
    actual_totals = {key: len(collections.get(key, [])) for key in expected_totals}
    if actual_totals != expected_totals:
        errors.append(f"All-content totals {actual_totals}; expected {expected_totals}")
    if len(core.get("exam", [])) != 5:
        errors.append(f"Core exam task count is {len(core.get('exam', []))}; expected 5")
    if any(item.get("scope") != "core" for key in ("practice", "quiz", "exam") for item in core.get(key, [])):
        errors.append("Default assessment route contains extension content")

    complex_slide = slide(core, "Complex numbers beyond the real line")
    bounds_slide = slide(core, "Bounds in sums, differences, products and powers")
    calculator_slide = slide(core, "Calculator fluency")
    if complex_slide.get("scope") != "extension":
        errors.append("Complex numbers were not moved to extension")
    if bounds_slide.get("scope") != "core":
        errors.append("Calculated bounds were incorrectly removed from the SL core")
    if calculator_slide.get("scope") != "core" or "nf-ti84-core-note" not in calculator_slide.get("html", ""):
        errors.append("Calculator fluency is not a TI-84-enabled core screen")

    natural = slide(core, "Natural numbers and integers").get("html", "")
    if "\\mathbb N=\\{0,1,2,3,\\ldots\\}" not in natural or "0\\notin\\mathbb N" in natural:
        errors.append("IB natural-number convention was not repaired")
    checkpoint = slide(core, "Mastery checkpoint · number sets").get("html", "")
    if "smallest IB set" not in checkpoint or "\\mathbb N\\), because IB" not in checkpoint:
        errors.append("Number-set checkpoint still uses the non-IB convention")

    e05 = next((item for item in collections.get("exam", []) if item.get("id") == "NFV6-1.1-E05"), {})
    e06 = next((item for item in collections.get("exam", []) if item.get("id") == "NFV6-1.1-E06"), {})
    if not e05 or "normalized scientific notation" not in e05.get("parts", [{}])[0].get("prompt", ""):
        errors.append("Core optical task was not repaired to assess SL 1.1")
    if not e06 or e06.get("scope") != "extension" or e06.get("total_marks") != 5:
        errors.append("Moved number-set task is not preserved as a 5-mark extension")
    if any(item.get("id") == "NFV6-1.1-E06" for item in core.get("exam", [])):
        errors.append("Extension task appears in default core exam route")

    counts = core["lesson"].get("scope_counts", {})
    if counts.get("learn", {}).get("core", 0) <= 0 or counts.get("learn", {}).get("extension", 0) <= 0:
        errors.append(f"Invalid learn scope counts: {counts.get('learn')}")
    for flag in (
        "numberSetsMovedToExtension", "complexNumbersMovedToExtension", "ibNaturalNumberConvention",
        "calculatorNotationRuleExplicit", "extensionExcludedFromDefaultMastery",
    ):
        if core.get("audit", {}).get(flag) is not True:
            errors.append(f"Scope audit flag is not true: {flag}")

    ti = load_workflows(root, errors)
    workflows = ti.get("workflows", {})
    if set(workflows) != {"ee-operation", "sci-display", "guard-digits"}:
        errors.append(f"Unexpected TI-84 workflows: {sorted(workflows)}")
    if ti.get("meta", {}).get("workflowCount") != 3:
        errors.append("TI-84 workflow count is not 3")
    keys = json.dumps(workflows, ensure_ascii=False)
    for marker in ("EE", "SCI", "NORM", "(−)", "8.0×10¹", "4.99×10²"):
        if marker not in keys:
            errors.append(f"TI-84 workflow evidence missing: {marker}")


def main() -> int:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
    errors: list[str] = []
    validate(root, errors)
    print("IB AI SL Lesson 1.1 core scope + TI-84 classroom v6.2")
    print(f"Errors: {len(errors)}")
    for error in errors:
        print(f"  ERROR: {error}")
    if errors:
        return 1
    print("Status: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
