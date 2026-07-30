#!/usr/bin/env python3
"""Release gate for the Calculus-only bank reset and exact upload routing."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
errors: list[str] = []


def text(relative: str) -> str:
    path = ROOT / relative
    if not path.is_file():
        errors.append(f"Missing required file: {relative}")
        return ""
    return path.read_text(encoding="utf-8", errors="replace")


def payload(relative: str):
    try:
        return json.loads(text(relative))
    except Exception as error:  # noqa: BLE001
        errors.append(f"Invalid JSON {relative}: {error}")
        return {}


catalog = payload("question-bank/data/catalog.json")
addon = payload("question-bank/data/blackboard-addon.json")
registry = payload("question-bank/private-sources/data/private-bank-registry.json")

expected_banks = {"CALCT3BC", "ADAMS10", "PEARSON_CH0"}
actual_banks = {str(row.get("code")) for row in catalog.get("banks", [])}
if actual_banks != expected_banks:
    errors.append(f"Expected only Calculus banks; found {sorted(actual_banks)}")
if {row.get("key") for row in catalog.get("courses", [])} != {"ap-calculus"}:
    errors.append("Static practice catalog exposes a non-Calculus course")
for group, rows in (catalog.get("bundles") or {}).items():
    for row in rows or []:
        course = row.get("course_key")
        if course and course != "ap-calculus":
            errors.append(f"Bundle {group}/{row.get('id')} crosses into {course}")
if any(addon.get(key) for key in ("banks", "bundles", "courseAllAugments", "courseUnitAugments")):
    errors.append("Non-Calculus Blackboard add-on content remains")
if registry.get("banks") or (registry.get("totals") or {}).get("banks") != 0:
    errors.append("Private registry was not reset")

for relative in (
    "question-bank/data/courses/ap-precalculus",
    "question-bank/data/courses/ib-math-ai",
    "question-bank/data/courses/algebra-2",
    "question-bank/data/courses/grade-9",
    "question-bank/data/ap/precalc-skills",
    "question-bank/data/ap/ib-skills",
    "question-bank/data/imported/pcalrt5s",
    "question-bank/data/imported/caf5s",
    "question-bank/assets/blackboard-packages/pcalrt5s",
    "question-bank/assets/blackboard-packages/caf5s",
):
    if (ROOT / relative).exists():
        errors.append(f"Removed bank path still exists: {relative}")

practice_html = text("question-bank/practice.html")
course_at = practice_html.find('id="course"')
bank_at = practice_html.find('id="bank"')
scope_at = practice_html.find('id="scope"')
bundle_at = practice_html.find('id="bundle"')
if not (0 <= course_at < bank_at < scope_at < bundle_at):
    errors.append("Practice controls are not ordered course → bank → scope → lesson/unit")

controller = text("question-bank/js/mapped-practice.js")
adapter = text("question-bank/js/mapped-private-bank-practice.js")
api = text("supabase/functions/practice-bank-api/index.ts")
upload_api = text("supabase/functions/upload-manager-api/index.ts")
uploader = text("tools/upload_private_bank_package_fast.py")
validator = text("tools/validate_private_bank_packages.py")
purge = text("question-bank/official/admin/js/private-bank-center.js")

required = {
    "Practice controller": (controller, ("loadPrivateInventory", "bankCodesForCourse", "privateSource", "bank_code:UI.bank.value")),
    "Private adapter": (adapter, ("scope.bank", 'query.set("bank",scope.bank)', "exactRoute", "dedicated")),
    "Practice API": (api, ("private_bank_practice_inventory", 'query.eq("bank_code", bank)', "dedicated_course_only")),
    "Upload API": (upload_api, ("missing_course", "1.4.0-single-course-routing")),
    "Fast uploader": (uploader, ("Manifest must declare exactly one target course", "must have exactly one verified course mapping", "lesson_title", "--expected-course is required")),
    "Package validator": (validator, ("Manifest must declare exactly one target course", "Question must have exactly one course mapping")),
    "Cleanup control": (purge, ('REMOVAL_ORDER=["ap-precalculus","ib-math-ai","algebra-2","grade-9"]', "KEEP AP CALCULUS ONLY")),
}
for label, (source, markers) in required.items():
    for marker in markers:
        if marker not in source:
            errors.append(f"{label} missing {marker}")

sys.path.insert(0, str(ROOT / "tools"))
try:
    import upload_private_bank_package_fast as importer

    valid_mapping = {
        "id": "ROUTE-1",
        "course_mappings": [{
            "course": "ap-precalculus",
            "unit": 2,
            "lesson_key": "2.3",
            "lesson_title": "Exponential models",
            "skill_key": "APPC.U2.EXP",
            "mapping_verified": True,
        }],
    }
    courses, lessons, skills = importer.direct_mappings(valid_mapping, ["ap-precalculus"])
    if courses != ["ap-precalculus"] or lessons != ["ap-precalculus:2.3"] or skills != ["APPC.U2.EXP"]:
        errors.append("Valid exact mapping did not preserve its course → unit → lesson route")
    for broken in (
        {**valid_mapping, "course_mappings": []},
        {**valid_mapping, "course_mappings": valid_mapping["course_mappings"] * 2},
        {**valid_mapping, "course_mappings": [{**valid_mapping["course_mappings"][0], "lesson_title": ""}]},
    ):
        try:
            importer.direct_mappings(broken, ["ap-precalculus"])
            errors.append("Importer accepted a missing, multiple, or incomplete route")
        except RuntimeError:
            pass
    try:
        importer.manifest_target_courses({"target_courses": ["ap-precalculus", "ib-math-ai"]})
        errors.append("Importer accepted a multi-course package manifest")
    except RuntimeError:
        pass
except Exception as error:  # noqa: BLE001
    errors.append(f"Could not exercise exact-routing importer: {error}")

print("Calculus-only practice and exact-routing validation")
print(f"Errors: {len(errors)}")
for item in errors:
    print(f"  ERROR: {item}")
if errors:
    sys.exit(1)
print("Status: PASS")
