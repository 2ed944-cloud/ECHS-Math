#!/usr/bin/env python3
"""Regression checks for the Lesson 1.1 assessment scroll surface."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path("lessons/ib-math-ai/unit-1")
HTML = ROOT / "lessons/IB_AI_SL_1.1_standard_form_ECHS.html"
CSS = ROOT / "assets/css/lesson-1.1-exam-scroll-v5-2-3.css"
JS = ROOT / "data/lesson-1.1-exam-scroll-v5-2-3.js"
CATALOG = Path("data/ib-math-ai-unit-1-delivery-catalog.json")


def read(root: Path, path: Path, errors: list[str]) -> str:
    target = root / path
    if not target.is_file():
        errors.append(f"Missing file: {path}")
        return ""
    return target.read_text(encoding="utf-8", errors="replace")


def require(text: str, markers: tuple[str, ...], label: str, errors: list[str]) -> None:
    for marker in markers:
        if marker not in text:
            errors.append(f"{label} missing marker: {marker}")


def main() -> int:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
    errors: list[str] = []
    html = read(root, HTML, errors)
    css = read(root, CSS, errors)
    script = read(root, JS, errors)
    catalog_text = read(root, CATALOG, errors)

    require(
        html,
        (
            "lesson-1.1-exam-scroll-v5-2-3.css?v=5.2.3",
            "lesson-1.1-exam-scroll-v5-2-3.js?v=5.2.3",
        ),
        "Lesson HTML",
        errors,
    )
    require(
        css,
        (
            "body.exam-assessment-active .app-shell",
            "overflow-y:scroll!important",
            "scrollbar-gutter:stable",
            "touch-action:pan-y",
            ".app-shell::-webkit-scrollbar",
            ".app-shell::-webkit-scrollbar-thumb",
        ),
        "Assessment scroll stylesheet",
        errors,
    )
    require(
        script,
        (
            "Scrollable IB-style assessment",
            "PageDown",
            "PageUp",
            "app.scrollBy",
            "app.scrollTo",
            "exam-scroll-surface",
        ),
        "Assessment scroll controller",
        errors,
    )

    syntax = subprocess.run(["node", "--check", str(root / JS)], text=True, capture_output=True)
    if syntax.returncode:
        errors.append(f"Assessment scroll JavaScript syntax failed: {syntax.stderr.strip()}")

    try:
        catalog = json.loads(catalog_text)
        lesson = next(item for item in catalog["lessons"] if item["number"] == "1.1")
        if lesson.get("release") != "6.9.0":
            errors.append(f"Catalog release is {lesson.get('release')!r}; expected '6.9.0'")
    except (json.JSONDecodeError, KeyError, StopIteration) as exc:
        errors.append(f"Could not validate delivery catalog: {exc}")

    print("IB AI SL Lesson 1.1 assessment scroll")
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
