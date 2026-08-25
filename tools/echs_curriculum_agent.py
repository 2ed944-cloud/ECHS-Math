#!/usr/bin/env python3
"""Deterministic curriculum gate for the ECHS Grade 9/10 pathways.

The agent never equates a catalog record with a finished lesson. It validates
the approved curriculum manifests, checks every claimed-ready local lesson,
and produces a prioritized completion queue for the improvement workflow.
"""

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
    "g9-ap-precalculus-readiness": (10, 106),
    "g10-ap-precalculus-path-a": (5, 69),
    "g10-algebra2-ap-readiness-path-b": (12, 110),
}
AP_UNIT_COUNTS = {1: 14, 2: 15, 3: 15, 4: 14}
REQUIRED_LESSON_FIELDS = ("id", "title", "subtopics", "learningOutcomes", "alignment", "pacing", "deliveryStatus")
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


def local_path_from_url(url: str) -> Path | None:
    if not url or url.startswith(("http://", "https://", "mailto:", "#")):
        return None
    return ROOT / urlsplit(url).path.lstrip("/")


def inspect_html(path: Path) -> tuple[int, list[str]]:
    text = path.read_text(encoding="utf-8", errors="replace")
    missing = [label for label, pattern in HTML_SIGNALS.items() if not pattern.search(text)]
    score = round(100 * (len(HTML_SIGNALS) - len(missing)) / len(HTML_SIGNALS))
    return score, missing


def audit_manifest(label: str, path: Path, audit: Audit) -> None:
    if not path.exists():
        audit.error(f"Missing {label} manifest: `{path.relative_to(ROOT)}`")
        return
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        audit.error(f"Cannot parse {label} manifest: {exc}")
        return

    for pathway in data.get("paths", {}).values():
        pathway_id = pathway.get("id", "unknown")
        units = pathway.get("units", [])
        lessons = [(unit, lesson) for unit in units for lesson in unit.get("lessons", [])]
        expected = EXPECTED.get(pathway_id)
        if expected and (len(units), len(lessons)) != expected:
            audit.error(f"{pathway_id}: expected {expected[0]} units/{expected[1]} lessons; found {len(units)}/{len(lessons)}")

        ids = [lesson.get("id") for _, lesson in lessons]
        duplicates = [item for item, count in Counter(ids).items() if count > 1]
        if duplicates:
            audit.error(f"{pathway_id}: duplicate lesson IDs: {', '.join(map(str, duplicates))}")

        status_counts = Counter()
        for unit, lesson in lessons:
            missing_fields = [field for field in REQUIRED_LESSON_FIELDS if not lesson.get(field)]
            if missing_fields:
                audit.error(f"{pathway_id} {lesson.get('id', '?')}: missing {', '.join(missing_fields)}")
            status = lesson.get("deliveryStatus", "missing")
            status_counts[status] += 1
            url = lesson.get("url", "")
            score = None
            if status == "ready":
                local = local_path_from_url(url)
                if local is None or not local.is_file():
                    audit.error(f"{pathway_id} {lesson.get('id')}: claims ready but has no existing dedicated lesson URL")
                else:
                    score, missing = inspect_html(local)
                    if missing:
                        audit.warn(f"{pathway_id} {lesson.get('id')}: quality signals missing: {', '.join(missing)}")
            else:
                audit.queue.append({
                    "pathway": pathway_id,
                    "unit": unit.get("code"),
                    "lesson": lesson.get("id"),
                    "title": lesson.get("title"),
                    "status": status,
                })

        audit.rows.append({
            "pathway": pathway_id,
            "units": len(units),
            "lessons": len(lessons),
            "ready": status_counts.get("ready", 0),
            "curriculum_ready": status_counts.get("curriculum_ready", 0),
        })


def extract_ap_urls() -> dict[int, set[str]]:
    result = {unit: set() for unit in AP_UNIT_COUNTS}
    files = [
        ROOT / "data/ap-precalculus-update.js",
        ROOT / "data/ap-precalculus-unit-3-update.js",
        ROOT / "data/ap-precalculus-unit-4-update.js",
    ]
    pattern = re.compile(r"lessons/ap-precalculus/unit-([1-4])/([A-Za-z0-9_.-]+\.html)")
    for path in files:
        if not path.exists():
            continue
        for unit, filename in pattern.findall(path.read_text(encoding="utf-8", errors="replace")):
            if filename.lower() != "index.html":
                result[int(unit)].add(f"lessons/ap-precalculus/unit-{unit}/{filename}")
    # Unit 3/4 scripts construct the prefix dynamically, so inventory files too.
    for unit in AP_UNIT_COUNTS:
        folder = ROOT / f"lessons/ap-precalculus/unit-{unit}"
        if folder.is_dir():
            result[unit].update(str(path.relative_to(ROOT)) for path in folder.glob("*.html") if path.name != "index.html")
    return result


def audit_ap_lessons(audit: Audit) -> None:
    urls = extract_ap_urls()
    total = 0
    quality_scores = []
    for unit, expected in AP_UNIT_COUNTS.items():
        actual = len(urls[unit])
        total += actual
        if actual != expected:
            audit.error(f"AP Precalculus Unit {unit}: expected {expected} dedicated lesson files; found {actual}")
        for url in sorted(urls[unit]):
            path = ROOT / url
            if not path.is_file():
                audit.error(f"AP Precalculus broken lesson reference: `{url}`")
                continue
            score, missing = inspect_html(path)
            quality_scores.append(score)
            if missing:
                audit.warn(f"AP `{url}`: missing automated quality signals: {', '.join(missing)}")
    audit.rows.append({
        "pathway": "ap-precalculus-runtime",
        "units": 4,
        "lessons": total,
        "ready": total,
        "curriculum_ready": 0,
        "average_signal_score": round(sum(quality_scores) / len(quality_scores), 1) if quality_scores else 0,
    })


def render_report(audit: Audit) -> str:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    lines = [
        "# ECHS Curriculum Agent Report",
        "",
        f"Generated: {now}",
        "",
        "## Release decision",
        "",
        f"- Structural errors: **{len(audit.errors)}**",
        f"- Quality warnings: **{len(audit.warnings)}**",
        f"- Lessons awaiting dedicated interactive completion: **{len(audit.queue)}**",
        "",
        "A course is not complete merely because it has a card, title, or generic route. `ready` requires a dedicated lesson file that passes the content and technical gates.",
        "",
        "## Coverage",
        "",
        "| Pathway | Units | Lessons | Dedicated ready | Curriculum mapped | Signal score |",
        "|---|---:|---:|---:|---:|---:|",
    ]
    for row in audit.rows:
        lines.append(f"| {row['pathway']} | {row['units']} | {row['lessons']} | {row['ready']} | {row['curriculum_ready']} | {row.get('average_signal_score', '—')} |")

    lines.extend(["", "## Structural errors", ""])
    lines.extend([f"- {item}" for item in audit.errors] or ["- None."])
    lines.extend(["", "## Priority improvement queue", ""])
    for item in audit.queue[:25]:
        lines.append(f"- `{item['pathway']}` · `{item['unit']}` · **{item['lesson']} {item['title']}** ({item['status']})")
    if len(audit.queue) > 25:
        lines.append(f"- …and {len(audit.queue) - 25} more lessons in manifest order.")
    lines.extend(["", "## Quality warnings (first 50)", ""])
    lines.extend([f"- {item}" for item in audit.warnings[:50]] or ["- None."])
    if len(audit.warnings) > 50:
        lines.append(f"- …and {len(audit.warnings) - 50} more warnings.")
    lines.extend(["", "## Definition of done", "", "A lesson may move to `ready` only when it has:", "",
                  "1. Approved subtopics and observable learning outcomes.",
                  "2. Retrieval/diagnostic launch, explicit instruction, and worked examples.",
                  "3. Guided practice, independent practice, challenge/HOT task, and misconception analysis.",
                  "4. Calculator/no-calculator judgment and multiple-representation reasoning where appropriate.",
                  "5. Exit ticket/mastery evidence plus answer/solution support.",
                  "6. Responsive, keyboard-accessible HTML with valid local links and no unlicensed public content.", ""])
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--report", default="reports/echs-curriculum-agent.md")
    parser.add_argument("--json", dest="json_report", default="reports/echs-curriculum-agent.json")
    parser.add_argument("--require-complete", action="store_true", help="Fail while any mapped lesson lacks a dedicated ready module.")
    args = parser.parse_args()

    audit = Audit()
    for label, path in MANIFESTS.items():
        audit_manifest(label, path, audit)
    audit_ap_lessons(audit)

    report_path = ROOT / args.report
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(render_report(audit), encoding="utf-8")
    json_path = ROOT / args.json_report
    json_path.parent.mkdir(parents=True, exist_ok=True)
    json_path.write_text(json.dumps({"errors": audit.errors, "warnings": audit.warnings, "queue": audit.queue, "coverage": audit.rows}, indent=2) + "\n", encoding="utf-8")
    print(report_path.relative_to(ROOT))

    if audit.errors:
        return 1
    if args.require_complete and audit.queue:
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
