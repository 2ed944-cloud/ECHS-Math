#!/usr/bin/env python3
"""Deterministic completion gate for the authoritative Grade 9/10 pathways."""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
MANIFESTS = {
    "Grade 9": ROOT / "curriculum/pathways/grade-9-2026-2027.json",
    "Grade 10": ROOT / "curriculum/pathways/grade-10-2026-2027.json",
}
EXPECTED = {
    "g9-ap-precalculus-readiness": (10, 49),
    "g10-ap-precalculus-path-a": (4, 48),
    "g10-algebra2-ap-readiness-path-b": (6, 51),
}
EXPECTED_PACKAGES = {
    "g9-ap-precalculus-readiness": 0,
    "g10-ap-precalculus-path-a": 1,
    "g10-algebra2-ap-readiness-path-b": 2,
}
AP_CORE_UNIT_COUNTS = {1: 14, 2: 15, 3: 15}
AP_SUPPLEMENTAL_UNIT_COUNTS = {4: 14}
REQUIRED_FIELDS = ("id", "title", "subtopics", "learningOutcomes", "deliveryStatus")
VALID_STATES = {"curriculum_ready", "ready", "blocked"}
GENERIC_VIEWER = "lessons/pathways/lesson.html"
PRODUCTION_PATHWAYS = {
    "g9-ap-precalculus-readiness",
    "g10-algebra2-ap-readiness-path-b",
}
HTML_SIGNALS = {
    "viewport": re.compile(r'name=["\']viewport["\']', re.I),
    "learning objective": re.compile(r"learning\s+objective|learning\s+outcome", re.I),
    "worked example": re.compile(r"worked\s+example|example\s+\d", re.I),
    "student practice": re.compile(r"your\s+turn|guided\s+practice|independent\s+practice|practice", re.I),
    "exit evidence": re.compile(r"exit\s+ticket|check\s+for\s+understanding|mastery\s+check", re.I),
}


class Audit:
    def __init__(self) -> None:
        self.errors: list[str] = []
        self.warnings: list[str] = []
        self.queue: list[dict] = []
        self.rows: list[dict] = []

    def error(self, message: str) -> None:
        self.errors.append(message)

    def warn(self, message: str) -> None:
        self.warnings.append(message)


def local_path(url: str) -> Path | None:
    if not url or url.startswith(("http://", "https://", "mailto:", "#")):
        return None
    return ROOT / urlsplit(url).path.lstrip("/")


def inspect_html(path: Path) -> tuple[int, list[str]]:
    text = path.read_text(encoding="utf-8", errors="replace")
    missing = [name for name, pattern in HTML_SIGNALS.items() if not pattern.search(text)]
    return round(100 * (len(HTML_SIGNALS) - len(missing)) / len(HTML_SIGNALS)), missing


def validate_ready(pathway_id: str, item_id: str, url: str, audit: Audit) -> None:
    normalized = urlsplit(url).path.lstrip("/")
    if normalized == GENERIC_VIEWER:
        audit.error(f"{pathway_id} {item_id}: generic pathway viewer cannot count as a dedicated ready module")
        return
    path = local_path(url)
    if path is None or not path.is_file():
        audit.error(f"{pathway_id} {item_id}: claims ready but has no existing dedicated lesson URL")
        return
    _, missing = inspect_html(path)
    if missing:
        audit.warn(f"{pathway_id} {item_id}: quality signals missing: {', '.join(missing)}")


def audit_item(pathway_id: str, item: dict, unit: str, kind: str, audit: Audit) -> str:
    required = REQUIRED_FIELDS if kind == "lesson" else ("id", "title", "deliveryStatus")
    missing = [field for field in required if not item.get(field)]
    if missing:
        audit.error(f"{pathway_id} {item.get('id', '?')}: missing {', '.join(missing)}")
    status = item.get("deliveryStatus", "missing")
    if status not in VALID_STATES:
        audit.error(f"{pathway_id} {item.get('id', '?')}: invalid deliveryStatus `{status}`")
    if status == "ready":
        validate_ready(pathway_id, str(item.get("id")), item.get("url", ""), audit)
    else:
        audit.queue.append({
            "kind": kind,
            "pathway": pathway_id,
            "unit": unit,
            "lesson": item.get("id"),
            "title": item.get("title"),
            "status": status,
        })
    return status


def audit_manifest(label: str, path: Path, audit: Audit) -> None:
    if not path.exists():
        audit.error(f"Missing {label} manifest: `{path.relative_to(ROOT)}`")
        return
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        audit.error(f"Cannot parse {label} manifest: {exc}")
        return
    if data.get("schemaVersion") != 2:
        audit.error(f"{label}: expected authoritative manifest schemaVersion 2")
    if "Final_Share_Ready_2026-2027" not in data.get("sourceDocument", ""):
        audit.error(f"{label}: sourceDocument is not the final share-ready pathway source")

    for pathway in data.get("paths", {}).values():
        pathway_id = pathway.get("id", "unknown")
        units = pathway.get("units", [])
        lessons = [(unit, lesson) for unit in units for lesson in unit.get("lessons", [])]
        packages = pathway.get("requiredPackages", [])
        expected = EXPECTED.get(pathway_id)
        if expected and (len(units), len(lessons)) != expected:
            audit.error(f"{pathway_id}: expected {expected[0]} units/{expected[1]} lessons; found {len(units)}/{len(lessons)}")
        if pathway.get("unitCount") != len(units) or pathway.get("lessonCount") != len(lessons):
            audit.error(f"{pathway_id}: declared counts do not match manifest contents")
        if len(packages) != EXPECTED_PACKAGES.get(pathway_id, 0):
            audit.error(f"{pathway_id}: expected {EXPECTED_PACKAGES.get(pathway_id, 0)} required packages; found {len(packages)}")
        ids = [lesson.get("id") for _, lesson in lessons] + [package.get("id") for package in packages]
        duplicates = [item for item, count in Counter(ids).items() if count > 1]
        if duplicates:
            audit.error(f"{pathway_id}: duplicate required IDs: {', '.join(map(str, duplicates))}")

        lesson_statuses = Counter(
            audit_item(pathway_id, lesson, unit.get("code", "?"), "lesson", audit)
            for unit, lesson in lessons
        )
        package_statuses = Counter(
            audit_item(pathway_id, package, package.get("unit", "Course level"), "course package", audit)
            for package in packages
        )
        ready = lesson_statuses.get("ready", 0)
        audit.rows.append({
            "pathway": pathway_id,
            "units": len(units),
            "lessons": len(lessons),
            "ready": ready,
            "remaining": len(lessons) - ready,
            "required_packages": len(packages),
            "packages_ready": package_statuses.get("ready", 0),
        })


def extract_ap_urls() -> dict[int, set[str]]:
    units = {**AP_CORE_UNIT_COUNTS, **AP_SUPPLEMENTAL_UNIT_COUNTS}
    result = {unit: set() for unit in units}
    pattern = re.compile(r"lessons/ap-precalculus/unit-([1-4])/([A-Za-z0-9_.-]+\.html)")
    for name in ("ap-precalculus-update.js", "ap-precalculus-unit-3-update.js", "ap-precalculus-unit-4-update.js"):
        path = ROOT / "data" / name
        if path.exists():
            for unit, filename in pattern.findall(path.read_text(encoding="utf-8", errors="replace")):
                if filename.lower() != "index.html":
                    result[int(unit)].add(f"lessons/ap-precalculus/unit-{unit}/{filename}")
    for unit in units:
        folder = ROOT / f"lessons/ap-precalculus/unit-{unit}"
        if folder.is_dir():
            result[unit].update(str(path.relative_to(ROOT)) for path in folder.glob("*.html") if path.name != "index.html")
    return result


def audit_ap_runtime(audit: Audit) -> None:
    urls = extract_ap_urls()
    scores = []
    for unit, expected in AP_CORE_UNIT_COUNTS.items():
        if len(urls[unit]) != expected:
            audit.error(f"AP Precalculus core Unit {unit}: expected {expected} dedicated lessons; found {len(urls[unit])}")
        for url in sorted(urls[unit]):
            score, missing = inspect_html(ROOT / url)
            scores.append(score)
            if missing:
                audit.warn(f"AP core `{url}`: missing automated quality signals: {', '.join(missing)}")
    for unit, expected in AP_SUPPLEMENTAL_UNIT_COUNTS.items():
        if len(urls[unit]) != expected:
            audit.warn(f"AP supplemental Unit {unit}: expected existing inventory {expected}; found {len(urls[unit])}")
    total = sum(len(urls[unit]) for unit in AP_CORE_UNIT_COUNTS)
    audit.rows.append({
        "pathway": "ap-precalculus-core-runtime",
        "units": 3,
        "lessons": total,
        "ready": total,
        "remaining": 0,
        "required_packages": 0,
        "packages_ready": 0,
        "average_signal_score": round(sum(scores) / len(scores), 1) if scores else 0,
    })


def render_report(audit: Audit) -> str:
    lesson_queue = [item for item in audit.queue if item["kind"] == "lesson"]
    package_queue = [item for item in audit.queue if item["kind"] == "course package"]
    production_lessons = [item for item in lesson_queue if item["pathway"] in PRODUCTION_PATHWAYS]
    production_packages = [item for item in package_queue if item["pathway"] in PRODUCTION_PATHWAYS]
    lines = [
        "# ECHS Curriculum Agent Report", "",
        f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}", "",
        "## Release decision", "",
        f"- Structural errors: **{len(audit.errors)}**",
        f"- Quality warnings: **{len(audit.warnings)}**",
        f"- Required lesson blocks awaiting dedicated completion: **{len(lesson_queue)}**",
        f"- Required course-level packages awaiting dedicated completion: **{len(package_queue)}**", "",
        f"- Current Grade 9 + Path B production backlog: **{len(production_lessons)} lessons + {len(production_packages)} gateway packages**", "",
        "The authoritative scope is Grade 9 (49 blocks), Grade 10 Path A (48 blocks plus the cumulative AP review/mock package), and Grade 10 Path B (51 blocks plus two transfer-gateway assessments). AP Unit 4 remains supplemental enrichment.", "",
        "A course card, catalog row, generic pathway route, or unmapped older file does not count as completion.", "",
        "## Coverage", "",
        "| Pathway | Units | Required lessons | Ready | Remaining | Packages ready | Signal score |",
        "|---|---:|---:|---:|---:|---:|---:|",
    ]
    for row in audit.rows:
        packages = f"{row['packages_ready']}/{row['required_packages']}"
        lines.append(f"| {row['pathway']} | {row['units']} | {row['lessons']} | {row['ready']} | {row['remaining']} | {packages} | {row.get('average_signal_score', '—')} |")
    lines.extend(["", "## Structural errors", ""])
    lines.extend([f"- {item}" for item in audit.errors] or ["- None."])
    lines.extend(["", "## Priority production queue", ""])
    for item in audit.queue[:25]:
        lines.append(f"- `{item['pathway']}` · `{item['unit']}` · **{item['lesson']} {item['title']}** ({item['kind']}; {item['status']})")
    if len(audit.queue) > 25:
        lines.append(f"- …and {len(audit.queue) - 25} more required items in authoritative order.")
    lines.extend(["", "## Quality warnings (first 50)", ""])
    lines.extend([f"- {item}" for item in audit.warnings[:50]] or ["- None."])
    if len(audit.warnings) > 50:
        lines.append(f"- …and {len(audit.warnings) - 50} more warnings.")
    lines.extend(["", "## Definition of done", "", "A lesson may move to `ready` only when it has:", "",
        "1. The authoritative subtopics and observable learning outcomes.",
        "2. Prerequisite retrieval, purposeful launch, precise concept development, and an explicit AP-readiness bridge.",
        "3. Multiple fully worked examples, each followed by a genuine student turn.",
        "4. Guided, independent, cumulative-retrieval, challenge/HOT, and misconception/error-analysis work.",
        "5. Calculator/no-calculator labels and multiple representations where relevant.",
        "6. Click-to-reveal complete solutions and exit/mastery evidence.",
        "7. Responsive, keyboard/touch-accessible HTML, readable mathematics, accurate figures, and valid links.",
        "8. Original ECHS-authored or publication-safe content only.", ""])
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--report", default="reports/echs-curriculum-agent.md")
    parser.add_argument("--json", dest="json_report", default="reports/echs-curriculum-agent.json")
    parser.add_argument("--require-complete", action="store_true", help="Fail while any required lesson or package lacks a dedicated ready module.")
    args = parser.parse_args()
    audit = Audit()
    for label, path in MANIFESTS.items():
        audit_manifest(label, path, audit)
    audit_ap_runtime(audit)
    report_path = ROOT / args.report
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(render_report(audit), encoding="utf-8")
    json_path = ROOT / args.json_report
    json_path.parent.mkdir(parents=True, exist_ok=True)
    lesson_queue = [item for item in audit.queue if item["kind"] == "lesson"]
    package_queue = [item for item in audit.queue if item["kind"] == "course package"]
    production_lessons = [item for item in lesson_queue if item["pathway"] in PRODUCTION_PATHWAYS]
    production_packages = [item for item in package_queue if item["pathway"] in PRODUCTION_PATHWAYS]
    json_path.write_text(json.dumps({
        "errors": audit.errors, "warnings": audit.warnings, "queue": audit.queue,
        "coverage": audit.rows,
        "summary": {
            "remainingLessons": len(lesson_queue),
            "remainingPackages": len(package_queue),
            "productionRemainingLessons": len(production_lessons),
            "productionRemainingPackages": len(production_packages),
        },
    }, indent=2) + "\n", encoding="utf-8")
    print(report_path.relative_to(ROOT))
    if audit.errors:
        return 1
    if args.require_complete and audit.queue:
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
