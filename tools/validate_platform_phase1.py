#!/usr/bin/env python3
"""Validate the ECHS Phase 1 platform foundation without external dependencies."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
ERRORS: list[str] = []
WARNINGS: list[str] = []


def error(message: str) -> None:
    ERRORS.append(message)


def warning(message: str) -> None:
    WARNINGS.append(message)


def load_json(relative: str):
    path = ROOT / relative
    if not path.is_file():
        error(f"Missing JSON file: {relative}")
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:  # noqa: BLE001
        error(f"Invalid JSON in {relative}: {exc}")
        return {}


def validate_required_files() -> None:
    required = [
        "index.html",
        "offline.html",
        "manifest.json",
        "sw.js",
        "css/platform-foundation.css",
        "js/platform-foundation.js",
        "question-bank/index.html",
        "question-bank/practice.html",
        "question-bank/exam.html",
        "question-bank/dashboard.html",
        "question-bank/data/catalog.json",
        "question-bank/data/blackboard-addon.json",
        "question-bank/js/bank.js",
        "question-bank/js/practice.js",
        "question-bank/js/precalculus-bank-audit.js",
    ]
    for relative in required:
        if not (ROOT / relative).is_file():
            error(f"Missing required platform file: {relative}")


def validate_manifest() -> None:
    manifest = load_json("manifest.json")
    for key in ("id", "name", "short_name", "start_url", "scope", "display", "icons"):
        if not manifest.get(key):
            error(f"manifest.json is missing {key}")
    icons = manifest.get("icons", [])
    sizes = {str(icon.get("sizes")) for icon in icons}
    if not {"192x192", "512x512"}.issubset(sizes):
        error("manifest.json must include 192x192 and 512x512 icons")
    for icon in icons:
        source = icon.get("src")
        if source and not (ROOT / source).is_file():
            error(f"Manifest icon is missing: {source}")


def validate_precalculus_bank() -> None:
    addon = load_json("question-bank/data/blackboard-addon.json")
    bank = next((row for row in addon.get("banks", []) if row.get("code") == "PCALRT5S"), None)
    if not bank:
        error("PCALRT5S is not registered in blackboard-addon.json")
        return
    if int(bank.get("question_count", 0)) != 4528:
        error(f"PCALRT5S must register 4,528 questions, found {bank.get('question_count')}")

    chapter_dir = ROOT / "question-bank/data/imported/pcalrt5s"
    media_dir = ROOT / "question-bank/assets/blackboard-packages/pcalrt5s"
    chapter_files = sorted(chapter_dir.glob("chapter_*.json"))
    media_files = sorted(media_dir.glob("chapter_*.zip"))
    if len(chapter_files) != 16:
        error(f"Expected 16 PCALRT5S chapter JSON files, found {len(chapter_files)}")
    if len(media_files) != 16:
        error(f"Expected 16 PCALRT5S media packages, found {len(media_files)}")

    ids: set[str] = set()
    total = 0
    for chapter_path in chapter_files:
        try:
            payload = json.loads(chapter_path.read_text(encoding="utf-8"))
        except Exception as exc:  # noqa: BLE001
            error(f"Invalid chapter JSON {chapter_path.relative_to(ROOT)}: {exc}")
            continue
        questions = payload if isinstance(payload, list) else payload.get("questions", [])
        if not isinstance(questions, list):
            error(f"Invalid questions array in {chapter_path.relative_to(ROOT)}")
            continue
        total += len(questions)
        for question in questions:
            question_id = str(question.get("id", "")).strip()
            if not question_id:
                error(f"Question without ID in {chapter_path.relative_to(ROOT)}")
            elif question_id in ids:
                error(f"Duplicate PCALRT5S question ID: {question_id}")
            else:
                ids.add(question_id)
    if total != 4528 or len(ids) != 4528:
        error(f"PCALRT5S inventory mismatch: total={total}, unique IDs={len(ids)}")


def validate_html_links() -> None:
    pages = [
        ROOT / "index.html",
        ROOT / "offline.html",
        ROOT / "question-bank/index.html",
        ROOT / "question-bank/practice.html",
        ROOT / "question-bank/exam.html",
        ROOT / "question-bank/dashboard.html",
    ]
    attribute = re.compile(r"(?:href|src)=['\"]([^'\"]+)['\"]", re.IGNORECASE)
    for page in pages:
        if not page.is_file():
            continue
        text = page.read_text(encoding="utf-8")
        if "<title>" not in text.lower():
            error(f"Missing title in {page.relative_to(ROOT)}")
        if "name=\"viewport\"" not in text and "name='viewport'" not in text:
            error(f"Missing viewport meta in {page.relative_to(ROOT)}")
        for value in attribute.findall(text):
            parsed = urlparse(value)
            if parsed.scheme or value.startswith(("#", "//", "data:", "mailto:", "javascript:")):
                continue
            clean = value.split("?", 1)[0].split("#", 1)[0]
            if not clean or "{" in clean:
                continue
            target = (page.parent / clean).resolve()
            try:
                target.relative_to(ROOT.resolve())
            except ValueError:
                warning(f"Link leaves repository root in {page.relative_to(ROOT)}: {value}")
                continue
            if not target.exists():
                error(f"Broken local reference in {page.relative_to(ROOT)}: {value}")


def main() -> int:
    validate_required_files()
    validate_manifest()
    validate_precalculus_bank()
    validate_html_links()

    print("ECHS Phase 1 platform validation")
    print(f"Warnings: {len(WARNINGS)}")
    for item in WARNINGS:
        print(f"  WARNING: {item}")
    print(f"Errors: {len(ERRORS)}")
    for item in ERRORS:
        print(f"  ERROR: {item}")
    if ERRORS:
        return 1
    print("Status: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
