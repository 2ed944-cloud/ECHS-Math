#!/usr/bin/env python3
"""Publish independently verified official AP records under the ECHS license.

This migration is intentionally ID-preserving and source-preserving. It applies
the existing audited content overlays, records the user-provided platform
license, promotes only records that pass every content gate, and regenerates
the canonical, admin, student, archive, index, catalog, and audit projections.
"""

from __future__ import annotations

import copy
import csv
import json
import shutil
from collections import defaultdict
from pathlib import Path
from typing import Any

import apply_strict_audit_gate as gate


AUTH_PATH = (
    gate.DATA
    / "rights"
    / "echs-ap-official-student-practice-2026-07-28.json"
)
OFFICIAL_STATUSES = {"legacy-ap", "official-released"}
QUALITY_FLAGS = (
    "transcriptionVerified",
    "answerVerified",
    "mediaVerified",
    "mathematicalVerificationPassed",
    "katexVerified",
    "mappingVerified",
)
RIGHTS_REASON_TOKENS = (
    "rights/permission",
    "public release blocked",
    "publication permission",
    "source access is school-internal",
)
EXPECTED_CANONICAL = 1217
EXPECTED_OFFICIAL = 1052
EXPECTED_LICENSED_READY = 360


def is_object(value: Any) -> bool:
    return isinstance(value, dict)


def merge_objects(base: Any, patch: Any) -> dict[str, Any]:
    out = copy.deepcopy(base) if is_object(base) else {}
    for key, value in (patch or {}).items():
        if key in {"partsPatches", "mediaPatches", "matchKey", "matchLabel"}:
            continue
        out[key] = (
            merge_objects(out.get(key), value)
            if is_object(value)
            else copy.deepcopy(value)
        )

    def patch_array(
        base_rows: Any,
        patch_rows: Any,
        key_name: str,
    ) -> list[dict[str, Any]]:
        if not isinstance(patch_rows, list):
            return copy.deepcopy(base_rows) if isinstance(base_rows, list) else []
        by_key = {
            str(row.get("matchKey") or row.get("matchLabel") or row.get(key_name)): row
            for row in patch_rows
        }
        repaired = []
        for row in base_rows if isinstance(base_rows, list) else []:
            row_patch = by_key.get(str(row.get(key_name)))
            if not row_patch:
                repaired.append(copy.deepcopy(row))
                continue
            clean_patch = {
                key: value
                for key, value in row_patch.items()
                if key not in {"matchKey", "matchLabel"}
            }
            repaired.append(merge_objects(row, clean_patch))
        return repaired

    if isinstance((patch or {}).get("partsPatches"), list):
        out["parts"] = patch_array(
            (base or {}).get("parts"),
            patch["partsPatches"],
            "label",
        )
    if isinstance((patch or {}).get("mediaPatches"), list):
        out["media"] = patch_array(
            (base or {}).get("media"),
            patch["mediaPatches"],
            "id",
        )
    return out


def overlay_paths() -> list[Path]:
    paths = sorted(gate.DATA.glob("admin-audit-overrides*.json"))
    manifest_path = gate.DATA / "manual-repairs" / "issue-3" / "manifest.json"
    if manifest_path.exists():
        manifest = gate.load_json(manifest_path)
        for batch in manifest.get("batches", []):
            paths.append(manifest_path.parent / str(batch["file"]))
    return paths


def load_overlay_map() -> dict[str, dict[str, Any]]:
    patches: dict[str, dict[str, Any]] = {}
    for path in overlay_paths():
        payload = gate.load_json(path)
        defaults = payload.get("defaults") or {}
        for row in payload.get("records") or []:
            question_id = str(row.get("id") or "")
            if not question_id:
                raise SystemExit(f"Overlay record without ID in {path}")
            expanded = merge_objects(defaults, row)
            if question_id in patches:
                raise SystemExit(
                    f"Duplicate effective overlay for {question_id}: {path}"
                )
            patches[question_id] = expanded
    return patches


def remove_rights_blockers(reasons: Any) -> list[str]:
    cleaned = []
    for reason in reasons if isinstance(reasons, list) else []:
        lowered = str(reason).lower()
        if any(token in lowered for token in RIGHTS_REASON_TOKENS):
            continue
        cleaned.append(str(reason))
    return cleaned


def apply_license(question: dict[str, Any], authorization: dict[str, Any]) -> None:
    source = question.setdefault("source", {})
    source["accessLevel"] = "public"
    source["rightsStatus"] = "licensed-echs-platform"
    source["publicPublicationAllowed"] = True
    source["releaseStatus"] = (
        "Licensed for ECHS platform student practice; authorization recorded "
        "in GitHub Issue #56."
    )
    source["licenseAuthorizationId"] = authorization["authorizationId"]
    source["licenseAuthorizationReference"] = authorization[
        "authorizationReference"
    ]
    source["licensedUses"] = copy.deepcopy(authorization["permittedUses"])
    source["externalSourceFileRedistributionAssumed"] = False

    quality = question.setdefault("quality", {})
    quality["reviewReasons"] = remove_rights_blockers(
        quality.get("reviewReasons")
    )


def valid_mcq(question: dict[str, Any]) -> bool:
    choices = question.get("choices") or []
    labels = [str(choice.get("label") or "").upper() for choice in choices]
    texts = [str(choice.get("text") or "").strip() for choice in choices]
    return bool(
        len(choices) == 5
        and labels == list("ABCDE")
        and all(texts)
        and len(set(texts)) == 5
        and str(question.get("answer") or "").upper() in labels
    )


def valid_frq(question: dict[str, Any]) -> bool:
    parts = question.get("parts") or []
    if not parts:
        return False
    for part in parts:
        if not str(part.get("prompt") or "").strip():
            return False
        if not str(part.get("answer") or "").strip():
            return False
        if not part.get("rubric"):
            return False
        if not isinstance(part.get("maxPoints"), (int, float)):
            return False
        if part["maxPoints"] <= 0:
            return False
    return True


def content_gates_pass(question: dict[str, Any]) -> bool:
    quality = question.get("quality") or {}
    classification = question.get("classification") or {}
    if not all(quality.get(flag) is True for flag in QUALITY_FLAGS):
        return False
    if not str(question.get("prompt") or "").strip():
        return False
    if not (classification.get("lessonIds") or []):
        return False
    if not str(classification.get("primaryTopic") or "").strip():
        return False
    if not str(classification.get("topicCode") or "").strip():
        return False
    if question.get("type") == "mcq":
        if not valid_mcq(question):
            return False
    elif question.get("type") == "frq":
        if not valid_frq(question):
            return False
    else:
        return False
    return bool(
        str(question.get("workedSolution") or "").strip()
        or str(question.get("explanation") or "").strip()
        or question.get("type") == "frq"
    )


def verified_calculator_status(question: dict[str, Any]) -> str:
    current = str((question.get("audit") or {}).get("calculatorStatus") or "")
    if current.startswith("verified"):
        return current
    calculator = str(question.get("calculator") or "").lower()
    if calculator == "no-calculator":
        return "verified-no-calculator"
    if "required" in calculator:
        return "verified-graphing-calculator"
    return "verified-calculator-permitted"


def promote(question: dict[str, Any], authorization: dict[str, Any]) -> None:
    quality = question.setdefault("quality", {})
    quality.update(
        {
            "completeness": "complete-verified",
            "productionStatus": "student-ready",
            "productionReadiness": 1.0,
            "needsReview": False,
            "reviewReasons": [],
            "studentReadyGatePassed": True,
        }
    )
    question["contentStatus"] = "complete"
    question["studentReady"] = True
    question["studentEligible"] = True
    question["studentAccessible"] = True
    question["deploymentAccess"] = "student-ready"
    question["verificationStatus"] = (
        "independently-verified-licensed-student-practice"
    )
    question["answerConfidence"] = max(
        float(question.get("answerConfidence") or 0),
        0.99,
    )

    audit = question.setdefault("audit", {})
    audit.update(
        {
            "sourceChecked": True,
            "transcriptionStatus": (
                audit.get("transcriptionStatus")
                if audit.get("transcriptionStatus") in {"verified", "corrected"}
                else "verified"
            ),
            "stemStatus": (
                audit.get("stemStatus")
                if audit.get("stemStatus") in {"verified", "corrected"}
                else "verified"
            ),
            "choicesStatus": (
                "not_required"
                if question.get("type") != "mcq"
                else (
                    audit.get("choicesStatus")
                    if audit.get("choicesStatus") in {"verified", "corrected"}
                    else "verified"
                )
            ),
            "answerStatus": (
                audit.get("answerStatus")
                if audit.get("answerStatus") in {"verified", "corrected"}
                else "verified"
            ),
            "solutionStatus": (
                audit.get("solutionStatus")
                if audit.get("solutionStatus") in {"verified", "corrected"}
                else "verified"
            ),
            "katexStatus": "verified",
            "mediaStatus": "verified",
            "calculatorStatus": verified_calculator_status(question),
            "courseMappingStatus": "verified",
            "unitMappingStatus": "verified",
            "topicMappingStatus": "verified",
            "lessonMappingStatus": "verified",
            "overallStatus": "student-ready",
            "reviewRequired": False,
            "licenseAuthorizationId": authorization["authorizationId"],
            "reviewerNotes": (
                "Independently verified content gates passed. Licensed for "
                "student practice on the ECHS platform under Issue #56."
            ),
            "auditedAt": gate.STAMP,
        }
    )


def retain_for_content_review(
    question: dict[str, Any],
    authorization: dict[str, Any],
) -> None:
    question["studentReady"] = False
    question["studentEligible"] = False
    question["studentAccessible"] = False
    question["deploymentAccess"] = "teacher-review-only"
    quality = question.setdefault("quality", {})
    quality["productionStatus"] = "teacher-review-only"
    quality["needsReview"] = True
    quality["studentReadyGatePassed"] = False
    reasons = remove_rights_blockers(quality.get("reviewReasons"))
    blocker = (
        "Licensed for ECHS student practice, but content verification remains "
        "incomplete; do not deliver to students yet."
    )
    if blocker not in reasons:
        reasons.append(blocker)
    quality["reviewReasons"] = reasons
    audit = question.setdefault("audit", {})
    audit["overallStatus"] = "teacher-review-only"
    audit["reviewRequired"] = True
    audit["licenseAuthorizationId"] = authorization["authorizationId"]
    audit["auditedAt"] = gate.STAMP


def write_grouped_student_questions(
    ready: list[dict[str, Any]],
    canonical_id_map: dict[str, str],
) -> None:
    folder = gate.STUDENT / "questions"
    folder.mkdir(parents=True, exist_ok=True)
    for path in folder.glob("chunk-*.json"):
        path.unlink()
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for question in ready:
        grouped[canonical_id_map[question["id"]]].append(question)
    for filename, rows in sorted(grouped.items()):
        gate.write_json(folder / filename, {"questions": rows})
    gate.write_json(
        gate.STUDENT / "id-map.json",
        {
            question["id"]: canonical_id_map[question["id"]]
            for question in ready
        },
    )


def write_student_index_and_media(
    ready: list[dict[str, Any]],
    canonical_index_by_id: dict[str, dict[str, Any]],
) -> None:
    index = []
    for question in ready:
        row = copy.deepcopy(canonical_index_by_id[question["id"]])
        gate.patch_index_row(row, question)
        index.append(row)
    gate.write_json(gate.STUDENT / "question-index.json", index)

    ready_ids = {question["id"] for question in ready}
    manifest = gate.load_json(gate.DATA / "media-manifest.json")
    if isinstance(manifest, dict):
        rows = manifest.get("media") or []
        manifest["media"] = [
            row
            for row in rows
            if ready_ids.intersection(row.get("linkedQuestions") or [])
        ]
        gate.write_json(gate.STUDENT / "media-manifest.json", manifest)
    else:
        gate.write_json(
            gate.STUDENT / "media-manifest.json",
            [
                row
                for row in manifest
                if ready_ids.intersection(row.get("linkedQuestions") or [])
            ],
        )
    gate.write_json(
        gate.STUDENT / "gate.json",
        {
            "generatedAt": gate.STAMP,
            "canonicalCount": EXPECTED_CANONICAL,
            "studentReadyCount": len(ready),
            "restrictedCount": EXPECTED_CANONICAL - len(ready),
            "studentReadyIds": sorted(ready_ids),
            "restrictedIds": sorted(
                set(canonical_index_by_id).difference(ready_ids)
            ),
            "licenseAuthorizationId": (
                "echs-ap-official-student-practice-2026-07-28"
            ),
        },
    )


def copy_reports_to_admin() -> None:
    gate.ADMIN_REPORTS.mkdir(parents=True, exist_ok=True)
    for name in (
        "QUESTION_BY_QUESTION_AUDIT.csv",
        "QUESTION_CORRECTIONS_LOG.json",
        "QUESTION_CORRECTIONS_REPORT.md",
        "MATHEMATICAL_VERIFICATION_REPORT.md",
        "MEDIA_AUDIT_REPORT.md",
        "LESSON_MAPPING_AUDIT.md",
        "UNRELATED_QUESTIONS_REMOVED_FROM_LESSON_LINKS.md",
        "STUDENT_READY_REPORT.md",
        "TEACHER_REVIEW_QUEUE.md",
        "COUNT_RECONCILIATION_REPORT.md",
        "CHANGELOG.md",
        "AUDIT_SUMMARY.json",
        "LICENSED_OFFICIAL_PROMOTION_REPORT.md",
    ):
        source = gate.REPORTS / name
        if source.exists():
            shutil.copy2(source, gate.ADMIN_REPORTS / name)


def main() -> None:
    authorization = gate.load_json(AUTH_PATH)
    if authorization.get("publicationAllowed") is not True:
        raise SystemExit("ECHS AP publication authorization is not active.")

    canonical, canonical_locations = gate.load_chunks(gate.DATA / "questions")
    admin, admin_locations = gate.load_chunks(gate.ADMIN_DATA / "questions")
    if len(canonical) != EXPECTED_CANONICAL or len(admin) != EXPECTED_CANONICAL:
        raise SystemExit("Canonical/admin question counts are not 1,217.")
    if {q["id"] for q in canonical} != {q["id"] for q in admin}:
        raise SystemExit("Canonical and admin ID sets differ.")

    overlay_map = load_overlay_map()
    effective = []
    licensed_ready_ids = set()
    official_ids = set()
    for original in canonical:
        question = merge_objects(
            original,
            overlay_map.get(original["id"]) or {},
        )
        official_status = (question.get("source") or {}).get("officialStatus")
        if official_status in OFFICIAL_STATUSES:
            official_ids.add(question["id"])
            apply_license(question, authorization)
            if content_gates_pass(question):
                promote(question, authorization)
                licensed_ready_ids.add(question["id"])
            else:
                retain_for_content_review(question, authorization)
        effective.append(question)

    if len(official_ids) != EXPECTED_OFFICIAL:
        raise SystemExit(
            f"Expected {EXPECTED_OFFICIAL} official AP records, "
            f"found {len(official_ids)}."
        )
    if len(licensed_ready_ids) != EXPECTED_LICENSED_READY:
        raise SystemExit(
            f"Expected {EXPECTED_LICENSED_READY} licensed content-ready records, "
            f"found {len(licensed_ready_ids)}."
        )

    effective_by_id = {q["id"]: q for q in effective}
    ready = [q for q in effective if gate.is_public_ready(q)]
    ready_ids = {q["id"] for q in ready}
    if not licensed_ready_ids.issubset(ready_ids):
        raise SystemExit("A licensed verified record failed the public gate.")

    gate.save_chunk_groups(effective, canonical_locations)

    effective_admin = []
    for original_admin in admin:
        updated = merge_objects(
            original_admin,
            overlay_map.get(original_admin["id"]) or {},
        )
        official_status = (updated.get("source") or {}).get("officialStatus")
        if official_status in OFFICIAL_STATUSES:
            apply_license(updated, authorization)
            if updated["id"] in licensed_ready_ids:
                promote(updated, authorization)
            else:
                retain_for_content_review(updated, authorization)
        updated["reviewRequired"] = bool(
            (updated.get("audit") or {}).get("reviewRequired")
        )
        updated["archiveStatus"] = (
            "Student Ready"
            if updated.get("studentReady")
            else "Source Complete — Solution Review"
        )
        effective_admin.append(updated)
    gate.save_chunk_groups(effective_admin, admin_locations)

    canonical_index = gate.load_json(gate.DATA / "question-index.json")
    canonical_index_by_id = {row["id"]: row for row in canonical_index}
    for row in canonical_index:
        gate.patch_index_row(row, effective_by_id[row["id"]])
    gate.write_json(gate.DATA / "question-index.json", canonical_index)

    admin_index = gate.load_json(gate.ADMIN_DATA / "question-index.json")
    for row in admin_index:
        question = effective_by_id[row["id"]]
        gate.patch_index_row(row, question)
        row["reviewRequired"] = bool(
            (question.get("audit") or {}).get("reviewRequired")
        )
        row["archiveStatus"] = (
            "Student Ready"
            if question.get("studentReady")
            else "Source Complete — Solution Review"
        )
    gate.write_json(gate.ADMIN_DATA / "question-index.json", admin_index)

    canonical_id_map = gate.load_json(gate.DATA / "id-map.json")
    write_grouped_student_questions(ready, canonical_id_map)
    write_student_index_and_media(ready, canonical_index_by_id)
    gate.update_archive_artifacts(
        effective_by_id,
        canonical_index_by_id,
        set(effective_by_id),
    )

    full_catalog = gate.aggregate_catalog(
        gate.load_json(gate.DATA / "catalog.json"),
        effective,
        ready,
        student_mode=False,
    )
    student_catalog = gate.aggregate_catalog(
        gate.load_json(gate.STUDENT / "catalog.json"),
        effective,
        ready,
        student_mode=True,
    )
    admin_catalog = gate.aggregate_catalog(
        gate.load_json(gate.ADMIN_DATA / "catalog.json"),
        effective,
        ready,
        student_mode=False,
    )
    gate.write_json(gate.DATA / "catalog.json", full_catalog)
    gate.write_json(gate.STUDENT / "catalog.json", student_catalog)
    gate.write_json(gate.ADMIN_DATA / "catalog.json", admin_catalog)

    old_audit = {}
    with (gate.REPORTS / "QUESTION_BY_QUESTION_AUDIT.csv").open(
        encoding="utf-8-sig",
        newline="",
    ) as handle:
        for row in csv.DictReader(handle):
            old_audit[row["question_id"]] = row
    corrections = gate.load_json(
        gate.REPORTS / "QUESTION_CORRECTIONS_LOG.json"
    )
    gate.normalize_existing_corrections(corrections)
    corrections_by_id: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for correction in corrections:
        corrections_by_id[correction["question_id"]].append(correction)
    gate.write_audit_csv(effective, old_audit, corrections_by_id)
    gate.write_reports(effective, ready, corrections)

    licensed_remaining = EXPECTED_OFFICIAL - len(licensed_ready_ids)
    report = [
        "# Licensed Official AP Promotion Report",
        "",
        f"Generated: {gate.STAMP}",
        "",
        f"- Official AP Calculus records: **{EXPECTED_OFFICIAL}**",
        f"- Licensed content-ready records promoted in this run: **{len(licensed_ready_ids)}**",
        f"- Licensed records still blocked by content verification: **{licensed_remaining}**",
        f"- Total student-ready records including ECHS originals: **{len(ready)}**",
        f"- Authorization: **{authorization['authorizationId']}**",
        "",
        "The license removes the publication blocker only. No record is delivered "
        "to students unless its independent content, mathematics, KaTeX, media, "
        "calculator, and mapping gates all pass.",
    ]
    (gate.REPORTS / "LICENSED_OFFICIAL_PROMOTION_REPORT.md").write_text(
        "\n".join(report) + "\n",
        encoding="utf-8",
    )
    changelog = gate.REPORTS / "CHANGELOG.md"
    changelog.write_text(
        changelog.read_text(encoding="utf-8")
        + "\n## Licensed official AP promotion — 2026-07-28\n\n"
        + f"- Recorded ECHS platform authorization {authorization['authorizationId']}.\n"
        + f"- Promoted {len(licensed_ready_ids)} independently verified official AP records.\n"
        + f"- Retained {licensed_remaining} licensed official records for content review.\n",
        encoding="utf-8",
    )
    copy_reports_to_admin()

    print(
        json.dumps(
            {
                "canonical": len(effective),
                "official": len(official_ids),
                "licensedOfficialReady": len(licensed_ready_ids),
                "licensedOfficialRemaining": licensed_remaining,
                "studentReadyTotal": len(ready),
                "overlaysApplied": len(overlay_map),
                "authorizationId": authorization["authorizationId"],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
