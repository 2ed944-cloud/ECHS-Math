#!/usr/bin/env python3
"""Validate the ECHS Phase 1 platform foundation without external dependencies."""
from __future__ import annotations

import json
import re
import sys
import xml.etree.ElementTree as ET
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
        "404.html",
        "privacy.html",
        "accessibility.html",
        "sources-and-rights.html",
        "robots.txt",
        "sitemap.xml",
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
        "platform/PHASE_1_FOUNDATION.md",
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
    shortcuts = manifest.get("shortcuts", [])
    if len(shortcuts) < 3:
        warning("manifest.json has fewer than three application shortcuts")


def validate_calculus_only_banks() -> None:
    catalog = load_json("question-bank/data/catalog.json")
    addon = load_json("question-bank/data/blackboard-addon.json")
    expected = {"CALCT3BC", "ADAMS10", "PEARSON_CH0"}
    actual = {str(row.get("code")) for row in catalog.get("banks", [])}
    if actual != expected:
        error(f"Static catalog must contain only Calculus banks: found {sorted(actual)}")
    if addon.get("banks") or addon.get("bundles") or addon.get("courseAllAugments") or addon.get("courseUnitAugments"):
        error("Blackboard add-on must be empty after the Calculus-only reset")
    if {row.get("key") for row in catalog.get("courses", [])} != {"ap-calculus"}:
        error("Practice catalog must expose only AP Calculus until curated banks are uploaded")
    if {row.get("course_key") for row in catalog.get("coverage", [])} != {"ap-calculus"}:
        error("Practice coverage must not advertise removed course banks")
    removed = (
        "question-bank/data/courses/ap-precalculus",
        "question-bank/data/courses/ib-math-ai",
        "question-bank/data/courses/algebra-2",
        "question-bank/data/courses/grade-9",
        "question-bank/data/imported/pcalrt5s",
        "question-bank/data/imported/caf5s",
    )
    for relative in removed:
        if (ROOT / relative).exists():
            error(f"Removed non-Calculus bank data returned: {relative}")


def validate_html_links() -> None:
    pages = [
        ROOT / "index.html",
        ROOT / "offline.html",
        ROOT / "404.html",
        ROOT / "privacy.html",
        ROOT / "accessibility.html",
        ROOT / "sources-and-rights.html",
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
            if clean.startswith("/ECHS-Math/"):
                target = ROOT / clean.removeprefix("/ECHS-Math/")
            else:
                target = (page.parent / clean).resolve()
            try:
                target.resolve().relative_to(ROOT.resolve())
            except ValueError:
                warning(f"Link leaves repository root in {page.relative_to(ROOT)}: {value}")
                continue
            if not target.exists():
                error(f"Broken local reference in {page.relative_to(ROOT)}: {value}")


def validate_discovery_files() -> None:
    robots = ROOT / "robots.txt"
    if robots.is_file():
        text = robots.read_text(encoding="utf-8")
        if "Sitemap: https://2ed944-cloud.github.io/ECHS-Math/sitemap.xml" not in text:
            error("robots.txt does not identify the production sitemap")
        if "Disallow: /question-bank/official/data/" not in text:
            warning("robots.txt does not explicitly exclude Official AP data payloads")

    sitemap = ROOT / "sitemap.xml"
    if sitemap.is_file():
        try:
            tree = ET.parse(sitemap)
            namespace = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
            locations = [node.text or "" for node in tree.findall(".//sm:loc", namespace)]
            if len(locations) < 10:
                warning(f"sitemap.xml contains only {len(locations)} public URLs")
            for location in locations:
                if not location.startswith("https://2ed944-cloud.github.io/ECHS-Math/"):
                    error(f"Unexpected sitemap origin: {location}")
        except ET.ParseError as exc:
            error(f"Invalid sitemap.xml: {exc}")


def main() -> int:
    validate_required_files()
    validate_manifest()
    validate_calculus_only_banks()
    validate_html_links()
    validate_discovery_files()

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
