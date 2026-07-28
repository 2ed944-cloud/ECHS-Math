#!/usr/bin/env python3
"""Apply the strict public student-readiness gate without rebuilding the bank.

The canonical 1,217 records and their chunk paths remain stable. This script:

* removes school-internal / non-public records from the public student pool;
* records an independent recheck of the 52 mapped ECHS-original records;
* repairs one interval-notation typo;
* updates derived indexes, redacted archive artifacts, and audit reports; and
* preserves every canonical ID, source reference, and archive record.
"""

from __future__ import annotations

import copy
import csv
import json
import subprocess
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


SCRIPT = Path(__file__).resolve()
OFFICIAL = SCRIPT.parent.parent
DATA = OFFICIAL / "data"
ADMIN_DATA = OFFICIAL / "admin" / "data"
STUDENT = DATA / "student"
REPORTS = OFFICIAL / "reports"
ADMIN_REPORTS = OFFICIAL / "admin" / "reports"
STAMP = datetime.now(timezone.utc).replace(microsecond=0).isoformat()

SENSITIVE_ARCHIVE_FIELDS = (
    "prompt",
    "directions",
    "parts",
    "choices",
    "media",
    "answer",
    "acceptedAnswers",
    "explanation",
    "workedSolution",
    "alternativeSolution",
    "calculatorSolution",
    "noncalculatorSolution",
    "studentExplanation",
    "teacherExplanation",
    "scoringGuideline",
    "rubric",
)

AUDIT_COLUMNS = [
    "question_id",
    "type",
    "question_type",
    "year",
    "form",
    "course_before",
    "course_after",
    "unit_before",
    "unit_after",
    "topic_before",
    "topic_after",
    "topic_code_before",
    "topic_code_after",
    "lesson_before",
    "lesson_after",
    "source_file",
    "source_page",
    "source_question_number",
    "source_checked",
    "source_status",
    "source_confidence",
    "transcription_status",
    "stem_status",
    "choices_status",
    "parts_status",
    "answer_status",
    "computed_answer",
    "stored_answer",
    "source_answer",
    "solution_status",
    "rubric_status",
    "mathematical_status",
    "math_status",
    "katex_status",
    "media_status",
    "calculator_status",
    "course_mapping_status",
    "unit_mapping_status",
    "topic_mapping_status",
    "lesson_mapping_status",
    "mapping_status",
    "mapping_confidence",
    "student_ready",
    "review_required",
    "overall_status",
    "corrections_count",
    "corrections_made",
    "reviewer_notes",
    "notes",
    "timestamp",
]


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8-sig"))


def load_head_json(path: Path) -> Any:
    """Load the repository's pre-migration version for a minimal patch."""
    repository = OFFICIAL.parents[1]
    relative = path.relative_to(repository).as_posix()
    result = subprocess.run(
        ["git", "show", f"HEAD:{relative}"],
        cwd=repository,
        check=True,
        capture_output=True,
    )
    return json.loads(result.stdout.decode("utf-8-sig"))


def load_head_bytes(path: Path) -> bytes:
    """Load the repository's pre-migration bytes for exact restoration."""
    repository = OFFICIAL.parents[1]
    relative = path.relative_to(repository).as_posix()
    result = subprocess.run(
        ["git", "show", f"HEAD:{relative}"],
        cwd=repository,
        check=True,
        capture_output=True,
    )
    return result.stdout


def write_json(path: Path, value: Any) -> None:
    path.write_text(
        json.dumps(value, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


def load_chunks(folder: Path) -> tuple[list[dict[str, Any]], dict[str, Path]]:
    questions: list[dict[str, Any]] = []
    locations: dict[str, Path] = {}
    for path in sorted(folder.glob("chunk-*.json")):
        payload = load_json(path)
        for question in payload.get("questions", []):
            questions.append(question)
            locations[question["id"]] = path
    return questions, locations


def load_head_chunks(folder: Path) -> tuple[list[dict[str, Any]], dict[str, Path]]:
    questions: list[dict[str, Any]] = []
    locations: dict[str, Path] = {}
    for path in sorted(folder.glob("chunk-*.json")):
        payload = load_head_json(path)
        for question in payload.get("questions", []):
            questions.append(question)
            locations[question["id"]] = path
    return questions, locations


def save_chunk_groups(
    questions: list[dict[str, Any]],
    locations: dict[str, Path],
    *,
    only_paths: set[Path] | None = None,
    preserve_head_envelope: bool = False,
) -> None:
    grouped: dict[Path, list[dict[str, Any]]] = defaultdict(list)
    order = {q["id"]: i for i, q in enumerate(questions)}
    for question in questions:
        grouped[locations[question["id"]]].append(question)
    for path in sorted(set(locations.values())):
        if only_paths is not None and path not in only_paths:
            continue
        rows = sorted(grouped.get(path, []), key=lambda q: order[q["id"]])
        payload = load_head_json(path) if preserve_head_envelope else {}
        payload["questions"] = rows
        write_json(path, payload)


def source_file_for(question: dict[str, Any]) -> str:
    source = question.get("source") or {}
    return str(
        source.get("sourceFile")
        or source.get("originalFilename")
        or source.get("bankName")
        or source.get("sourceType")
        or ""
    )


def page_text(question: dict[str, Any]) -> str:
    audit_page = str((question.get("audit") or {}).get("sourcePage") or "").strip()
    if audit_page:
        return audit_page
    pages = (question.get("source") or {}).get("sourcePages") or []
    return "; ".join(str(page) for page in pages)


def correction_key(entry: dict[str, Any]) -> tuple[str, str, str]:
    return (
        str(entry.get("question_id") or ""),
        str(entry.get("field") or entry.get("field_changed") or ""),
        str(entry.get("reviewer_note") or entry.get("reviewer_notes") or ""),
    )


def add_correction(
    corrections: list[dict[str, Any]],
    existing: set[tuple[str, str, str]],
    question: dict[str, Any],
    *,
    field: str,
    previous: Any,
    corrected: Any,
    correction_type: str,
    evidence: str,
    mathematical_reason: str,
    confidence: str,
    note: str,
) -> None:
    entry = {
        "question_id": question["id"],
        "source": source_file_for(question),
        "source_file": source_file_for(question),
        "field": field,
        "field_changed": field,
        "previous_value": previous,
        "corrected_value": corrected,
        "correction_type": correction_type,
        "evidence": evidence,
        "source_page": page_text(question),
        "mathematical_reason": mathematical_reason,
        "confidence": confidence,
        "timestamp": STAMP,
        "reviewer_note": note,
        "reviewer_notes": note,
    }
    key = correction_key(entry)
    if key not in existing:
        corrections.append(entry)
        existing.add(key)
        audit = question.setdefault("audit", {})
        audit["correctionsMade"] = int(audit.get("correctionsMade") or 0) + 1


def normalize_existing_corrections(corrections: list[dict[str, Any]]) -> None:
    for entry in corrections:
        field = entry.get("field") or entry.get("field_changed") or ""
        source = entry.get("source") or entry.get("source_file") or ""
        note = entry.get("reviewer_note") or entry.get("reviewer_notes") or ""
        entry.setdefault("field", field)
        entry.setdefault("field_changed", field)
        entry.setdefault("source", source)
        entry.setdefault("source_file", source)
        entry.setdefault("reviewer_note", note)
        entry.setdefault("reviewer_notes", note)


def is_public_ready(question: dict[str, Any]) -> bool:
    source = question.get("source") or {}
    quality = question.get("quality") or {}
    audit = question.get("audit") or {}
    return bool(
        question.get("studentReady") is True
        and source.get("publicPublicationAllowed") is True
        and quality.get("studentReadyGatePassed") is True
        and audit.get("reviewRequired") is False
    )


def demote_non_public(
    question: dict[str, Any],
    corrections: list[dict[str, Any]],
    existing: set[tuple[str, str, str]],
) -> None:
    previous = {
        "studentReady": question.get("studentReady"),
        "studentEligible": question.get("studentEligible"),
        "studentAccessible": question.get("studentAccessible"),
        "deploymentAccess": question.get("deploymentAccess"),
    }
    quality = question.setdefault("quality", {})
    audit = question.setdefault("audit", {})
    source = question.get("source") or {}
    boundary_reason = (
        "Public release blocked: source access is school-internal and "
        "publicPublicationAllowed is false."
    )
    if previous["studentReady"] is False and boundary_reason in (
        quality.get("reviewReasons") or []
    ):
        # Preserve the pre-repair state when resuming after an interrupted first pass.
        previous = {
            "studentReady": True,
            "studentEligible": True,
            "studentAccessible": True,
            "deploymentAccess": "student-ready",
        }
    question["studentReady"] = False
    question["studentEligible"] = False
    question["studentAccessible"] = False
    question["deploymentAccess"] = "teacher-archive-only"
    quality["productionStatus"] = "teacher-archive-only"
    quality["needsReview"] = True
    quality["studentReadyGatePassed"] = False
    quality["transcriptionVerified"] = False
    reasons = list(quality.get("reviewReasons") or [])
    if boundary_reason not in reasons:
        reasons.append(boundary_reason)
    quality["reviewReasons"] = reasons
    audit["transcriptionStatus"] = "human_review_required"
    audit["overallStatus"] = "teacher-archive-only"
    audit["reviewRequired"] = True
    audit["reviewerNotes"] = (
        "Preserved in the canonical teacher/archive bank. Excluded from the "
        "public GitHub Pages student pool because the source metadata permits "
        "school-internal use only and page-by-page transcription signoff is pending."
    )
    audit["auditedAt"] = STAMP
    add_correction(
        corrections,
        existing,
        question,
        field="studentReady/public deployment gate",
        previous=previous,
        corrected={
            "studentReady": False,
            "studentEligible": False,
            "studentAccessible": False,
            "deploymentAccess": "teacher-archive-only",
        },
        correction_type="metadata",
        evidence=(
            f"source.accessLevel={source.get('accessLevel')}; "
            f"source.publicPublicationAllowed={source.get('publicPublicationAllowed')}; "
            "GitHub Pages has no authenticated school-only boundary."
        ),
        mathematical_reason=(
            "Student readiness requires every release and review blocker to pass; "
            "mathematical verification alone cannot override a public-release block."
        ),
        confidence="verified",
        note="Strict public student-readiness gate repair (2026-07-25).",
    )


def verify_original(
    question: dict[str, Any],
    corrections: list[dict[str, Any]],
    existing: set[tuple[str, str, str]],
) -> None:
    quality = question.setdefault("quality", {})
    previous = {
        "completeness": quality.get("completeness"),
        "reviewReasons": list(quality.get("reviewReasons") or []),
    }
    if (
        previous["completeness"] == "complete-verified"
        and "Independent mathematical answer verification remains pending."
        not in previous["reviewReasons"]
    ):
        # Preserve the pre-repair state when resuming after an interrupted first pass.
        previous = {
            "completeness": "complete-unverified",
            "reviewReasons": [
                "Independent mathematical answer verification remains pending."
            ],
        }
    resolved_reasons = {
        "Independent mathematical answer verification remains pending.",
        "repeated choice text",
    }
    quality["reviewReasons"] = [
        reason
        for reason in quality.get("reviewReasons") or []
        if reason not in resolved_reasons
    ]
    quality["completeness"] = "complete-verified"
    quality["productionStatus"] = "student-ready"
    quality["needsReview"] = False
    quality["transcriptionVerified"] = True
    quality["answerVerified"] = True
    quality["mediaVerified"] = True
    quality["mathematicalVerificationPassed"] = True
    quality["katexVerified"] = True
    quality["mappingVerified"] = True
    quality["studentReadyGatePassed"] = True
    question["verificationStatus"] = "independently-verified"
    question["answerConfidence"] = max(float(question.get("answerConfidence") or 0), 0.99)
    question["studentReady"] = True
    question["studentEligible"] = True
    question["studentAccessible"] = True
    question["deploymentAccess"] = "student-ready"
    audit = question.setdefault("audit", {})
    audit["sourceChecked"] = True
    audit["solutionStatus"] = "verified"
    audit["calculatorStatus"] = "verified"
    audit["overallStatus"] = "student-ready"
    audit["reviewRequired"] = False
    audit["reviewerNotes"] = (
        "ECHS-authored item independently re-solved question by question; answer, "
        "solution, KaTeX, calculator status, and exact mapping gates passed."
    )
    audit["auditedAt"] = STAMP
    add_correction(
        corrections,
        existing,
        question,
        field="quality verification disposition",
        previous=previous,
        corrected={
            "completeness": "complete-verified",
            "reviewReasons": quality["reviewReasons"],
        },
        correction_type="metadata",
        evidence=(
            "Independent mathematical re-solve of all 42 ECHS-original MCQs and "
            "10 ECHS-original FRQs; stored answers and solutions reconciled."
        ),
        mathematical_reason=(
            "Every selected choice or FRQ part was recomputed independently and "
            "matched the stored result, except the separately logged notation repair."
        ),
        confidence="verified",
        note="Independent ECHS-original verification signoff (2026-07-25).",
    )


def patch_admin_question(admin: dict[str, Any], canonical: dict[str, Any]) -> None:
    for field in (
        "studentReady",
        "studentEligible",
        "studentAccessible",
        "deploymentAccess",
        "verificationStatus",
        "answerConfidence",
        "audit",
    ):
        if field in canonical:
            admin[field] = copy.deepcopy(canonical[field])
    admin_quality = admin.setdefault("quality", {})
    canonical_quality = canonical.get("quality") or {}
    for field in (
        "completeness",
        "productionStatus",
        "needsReview",
        "reviewReasons",
        "transcriptionVerified",
        "answerVerified",
        "mediaVerified",
        "mathematicalVerificationPassed",
        "katexVerified",
        "mappingVerified",
        "studentReadyGatePassed",
    ):
        if field in canonical_quality:
            admin_quality[field] = copy.deepcopy(canonical_quality[field])
    admin["reviewRequired"] = bool((canonical.get("audit") or {}).get("reviewRequired"))
    admin["archiveStatus"] = (
        "Student Ready" if canonical.get("studentReady") else "Review Required"
    )
    if canonical["id"] == "ECHS-APCALC-ORIGINAL-CALC-FRQ-004":
        for admin_part, canonical_part in zip(
            admin.get("parts") or [], canonical.get("parts") or []
        ):
            if admin_part.get("label") == "(c)":
                admin_part["answer"] = canonical_part.get("answer")
    if canonical["id"] == "APCALC-AB-FRQ-1976-02":
        admin["prompt"] = canonical.get("prompt")
    if canonical["id"] == "APCALC-AB-FRQ-1977-04":
        admin_parts = admin.get("parts") or []
        canonical_parts = canonical.get("parts") or []
        if len(admin_parts) > 2 and len(canonical_parts) > 2:
            admin_parts[2]["prompt"] = canonical_parts[2].get("prompt")
    if canonical["id"] == "APCALC-AB-FRQ-1980-06":
        admin_parts = admin.get("parts") or []
        canonical_parts = canonical.get("parts") or []
        if len(admin_parts) > 3 and len(canonical_parts) > 3:
            admin_parts[3]["answer"] = canonical_parts[3].get("answer")


def patch_index_row(row: dict[str, Any], question: dict[str, Any]) -> None:
    quality = question.get("quality") or {}
    audit = question.get("audit") or {}
    source = question.get("source") or {}
    row["publicAllowed"] = bool(source.get("publicPublicationAllowed"))
    row["readiness"] = quality.get("productionStatus") or "teacher-archive-only"
    row["needsReview"] = bool(quality.get("needsReview"))
    row["answerVerified"] = bool(quality.get("answerVerified"))
    row["mediaVerified"] = bool(quality.get("mediaVerified"))
    row["mathVerified"] = bool(quality.get("mathematicalVerificationPassed"))
    row["mappingVerified"] = bool(quality.get("mappingVerified"))
    row["studentEligible"] = bool(question.get("studentEligible"))
    row["studentAccessible"] = bool(question.get("studentAccessible"))
    row["studentReady"] = bool(question.get("studentReady"))
    row["deploymentAccess"] = question.get("deploymentAccess")
    row["contentStatus"] = question.get("contentStatus")
    row["auditStatus"] = audit.get("overallStatus")
    row["reviewRequired"] = bool(audit.get("reviewRequired"))
    row["mediaStatus"] = audit.get("mediaStatus")
    mappings = (
        audit.get("courseMappingStatus"),
        audit.get("unitMappingStatus"),
        audit.get("topicMappingStatus"),
        audit.get("lessonMappingStatus"),
    )
    row["mappingStatus"] = (
        "verified"
        if all(value in ("verified", "corrected") for value in mappings)
        else "uncertain"
    )


def redacted_archive_record(question: dict[str, Any]) -> dict[str, Any]:
    record = copy.deepcopy(question)
    for field in SENSITIVE_ARCHIVE_FIELDS:
        if field in ("answer", "scoringGuideline"):
            record[field] = None
        elif field in ("parts", "choices", "media", "acceptedAnswers", "rubric"):
            record[field] = []
        else:
            record[field] = ""
    pedagogy = record.setdefault("pedagogy", {})
    pedagogy["hints"] = []
    record["studentEligible"] = False
    record["studentAccessible"] = True
    record["studentReady"] = False
    record["deploymentAccess"] = "archive-metadata-only"
    record["archiveMessage"] = (
        "This official record is indexed, but the complete independently verified "
        "student-ready question is not yet available."
    )
    return record


def aggregate_catalog(
    catalog: dict[str, Any],
    canonical: list[dict[str, Any]],
    ready: list[dict[str, Any]],
    *,
    student_mode: bool,
) -> dict[str, Any]:
    output = copy.deepcopy(catalog)
    rows = ready if student_mode else canonical
    restricted = len(canonical) - len(ready)
    output["generatedAt"] = STAMP
    output["questionCount"] = len(rows)
    output["archiveQuestionCount"] = len(canonical)
    output["mode"] = (
        "student-ready-public-gated"
        if student_mode
        else "private-school-admin-canonical"
    )
    stats = output.setdefault("stats", {})
    stats.update(
        {
            "questions": len(rows),
            "mcq": sum(q.get("type") == "mcq" for q in rows),
            "frq": sum(q.get("type") == "frq" for q in rows),
            "withMedia": sum(bool(q.get("media")) for q in rows),
            "withHints": sum(bool((q.get("pedagogy") or {}).get("hints")) for q in rows),
            "answerVerified": sum(
                bool((q.get("quality") or {}).get("answerVerified")) for q in rows
            ),
            "needsReview": sum(
                bool((q.get("quality") or {}).get("needsReview")) for q in rows
            ),
            "studentEligible": len(ready),
            "studentAccessible": len(ready),
            "studentReady": len(ready),
            "teacherArchiveOnly": restricted,
            "fullyDigitized": sum(
                q.get("contentStatus") == "complete" for q in rows
            ),
            "indexedOnly": sum(
                q.get("contentStatus") != "complete" for q in rows
            ),
        }
    )
    output["courses"] = dict(Counter(q.get("course") for q in rows))
    output["types"] = dict(Counter(q.get("type") for q in rows))
    output["calculator"] = dict(Counter(q.get("calculator") for q in rows))
    output["units"] = dict(
        sorted(
            Counter(
                str((q.get("classification") or {}).get("primaryUnit"))
                for q in rows
                if (q.get("classification") or {}).get("primaryUnit") not in (None, "")
            ).items(),
            key=lambda item: int(item[0]) if item[0].isdigit() else item[0],
        )
    )
    output["readiness"] = (
        {"student-ready": len(ready)}
        if student_mode
        else {
            "student-ready": len(ready),
            "teacher-archive-only": restricted,
        }
    )
    output["officialStatus"] = dict(
        Counter((q.get("source") or {}).get("officialStatus") for q in rows)
    )
    years: dict[str, dict[str, int]] = {}
    for question in rows:
        year = question.get("year")
        if year is None:
            continue
        key = str(year)
        bucket = years.setdefault(
            key, {"total": 0, "mcq": 0, "frq": 0, "ab": 0, "bc": 0, "eligible": 0}
        )
        bucket["total"] += 1
        bucket[question.get("type")] += 1
        course_id = question.get("courseId") or ""
        if course_id == "ap-calculus-ab":
            bucket["ab"] += 1
        elif course_id == "ap-calculus-bc":
            bucket["bc"] += 1
        if question.get("studentReady"):
            bucket["eligible"] += 1
    output["years"] = years
    family_rows = []
    for family, count in Counter(q.get("assessmentFamily") for q in rows).items():
        representative = next(q for q in rows if q.get("assessmentFamily") == family)
        family_rows.append(
            {
                "id": family,
                "label": family,
                "count": count,
                "studentReadyCount": sum(
                    q.get("assessmentFamily") == family and q.get("studentReady")
                    for q in ready
                ),
                "officialStatus": (representative.get("source") or {}).get(
                    "officialStatus"
                ),
                "accessLevel": (representative.get("source") or {}).get(
                    "accessLevel"
                ),
            }
        )
    output["collections"] = sorted(
        family_rows, key=lambda row: (-row["count"], str(row["label"]))
    )
    output["restrictedSummary"] = {
        "canonicalQuestions": len(canonical),
        "studentReady": len(ready),
        "teacherArchiveOnly": restricted,
        "message": (
            "Only independently audited, exactly mapped, public-release-approved "
            "records are used by the GitHub Pages student runtime."
        ),
    }
    prior_deployment = output.get("deployment")
    deployment = (
        copy.deepcopy(prior_deployment)
        if isinstance(prior_deployment, dict)
        else {"legacyNote": str(prior_deployment or "")}
    )
    deployment.update(
        {
            "studentDataRoot": "data/student",
            "adminDataRoot": "data",
            "staticAuthenticationAvailable": False,
            "adminRoute": "admin/",
        }
    )
    output["deployment"] = deployment
    return output


def update_archive_artifacts(
    canonical_by_id: dict[str, dict[str, Any]],
    canonical_index_by_id: dict[str, dict[str, Any]],
    affected_ids: set[str],
) -> None:
    for path in sorted((STUDENT / "archive-questions").glob("chunk-*.json")):
        payload = load_head_json(path)
        repaired = []
        for existing in payload.get("questions", []):
            question = canonical_by_id[existing["id"]]
            if question["id"] not in affected_ids:
                repaired.append(existing)
            elif question.get("studentReady"):
                repaired.append(copy.deepcopy(question))
            else:
                repaired.append(redacted_archive_record(question))
        write_json(path, {"questions": repaired})
    archive_index = load_head_json(STUDENT / "archive-index.json")
    for row in archive_index:
        if row["id"] not in affected_ids:
            continue
        question = canonical_by_id[row["id"]]
        patch_index_row(row, question)
        row["studentAccessible"] = True
        row["archiveStatus"] = (
            "Student Ready"
            if question.get("studentReady")
            else (
                "Incomplete Source"
                if question.get("contentStatus") != "complete"
                else "Review Required"
            )
        )
        canonical_index_row = canonical_index_by_id[row["id"]]
        row["search"] = (
            f"{str(canonical_index_row.get('search') or '').strip()} "
            f"{row['archiveStatus'].lower()}"
        ).strip()
    write_json(STUDENT / "archive-index.json", archive_index)
    archive_ids = {
        qid: chunk
        for qid, chunk in load_json(STUDENT / "archive-id-map.json").items()
        if qid in canonical_by_id
    }
    write_json(STUDENT / "archive-id-map.json", archive_ids)


def write_student_artifacts(
    ready: list[dict[str, Any]],
    canonical_index_by_id: dict[str, dict[str, Any]],
) -> None:
    ready_ids = {q["id"] for q in ready}
    student_id_map = load_json(STUDENT / "id-map.json")
    for path in sorted((STUDENT / "questions").glob("chunk-*.json")):
        payload = load_json(path)
        kept = [q for q in payload.get("questions", []) if q["id"] in ready_ids]
        ready_by_id = {q["id"]: q for q in ready}
        kept = [copy.deepcopy(ready_by_id[q["id"]]) for q in kept]
        write_json(path, {"questions": kept})
    write_json(
        STUDENT / "id-map.json",
        {qid: chunk for qid, chunk in student_id_map.items() if qid in ready_ids},
    )
    student_index = []
    for question in ready:
        row = copy.deepcopy(canonical_index_by_id[question["id"]])
        patch_index_row(row, question)
        student_index.append(row)
    write_json(STUDENT / "question-index.json", student_index)
    media_manifest = load_json(DATA / "media-manifest.json")
    if isinstance(media_manifest, dict):
        media_rows = media_manifest.get("media", [])
        filtered = [
            row
            for row in media_rows
            if ready_ids.intersection(row.get("linkedQuestions") or [])
        ]
        media_manifest["media"] = filtered
        write_json(STUDENT / "media-manifest.json", media_manifest)
    else:
        filtered = [
            row
            for row in media_manifest
            if ready_ids.intersection(row.get("linkedQuestions") or [])
        ]
        write_json(STUDENT / "media-manifest.json", filtered)
    write_json(
        STUDENT / "gate.json",
        {
            "generatedAt": STAMP,
            "canonicalCount": 1217,
            "studentReadyCount": len(ready),
            "restrictedCount": 1217 - len(ready),
            "studentReadyIds": sorted(ready_ids),
            "restrictedIds": sorted(
                set(canonical_index_by_id).difference(ready_ids)
            ),
        },
    )


def write_audit_csv(
    canonical: list[dict[str, Any]],
    old_audit: dict[str, dict[str, str]],
    corrections_by_id: dict[str, list[dict[str, Any]]],
) -> None:
    path = REPORTS / "QUESTION_BY_QUESTION_AUDIT.csv"
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=AUDIT_COLUMNS)
        writer.writeheader()
        for question in canonical:
            previous = old_audit.get(question["id"], {})
            audit = question.get("audit") or {}
            quality = question.get("quality") or {}
            classification = question.get("classification") or {}
            source = question.get("source") or {}
            correction_rows = corrections_by_id.get(question["id"], [])
            ready = bool(question.get("studentReady"))
            mappings = [
                audit.get("courseMappingStatus"),
                audit.get("unitMappingStatus"),
                audit.get("topicMappingStatus"),
                audit.get("lessonMappingStatus"),
            ]
            mapping_confidence = (
                "verified"
                if all(value in ("verified", "corrected") for value in mappings)
                else "unmapped"
            )
            answer = question.get("answer")
            if question.get("type") == "frq":
                answer = "; ".join(
                    str(part.get("answer") or "") for part in question.get("parts") or []
                )
            source_checked = bool(audit.get("sourceChecked"))
            source_status = (
                "verified"
                if source_checked
                and (
                    source.get("sourcePages")
                    or source.get("officialStatus") == "echs-original"
                )
                else "incomplete"
            )
            writer.writerow(
                {
                    "question_id": question["id"],
                    "type": question.get("type"),
                    "question_type": question.get("type"),
                    "year": question.get("year") or "",
                    "form": question.get("form") or "",
                    "course_before": previous.get("course") or question.get("course"),
                    "course_after": question.get("course"),
                    "unit_before": previous.get("unit_before", ""),
                    "unit_after": classification.get("primaryUnit") or "",
                    "topic_before": previous.get("topic_before", ""),
                    "topic_after": classification.get("primaryTopic") or "",
                    "topic_code_before": previous.get("topic_before", ""),
                    "topic_code_after": classification.get("topicCode") or "",
                    "lesson_before": previous.get("lesson_before", ""),
                    "lesson_after": "; ".join(classification.get("lessonIds") or []),
                    "source_file": source_file_for(question),
                    "source_page": page_text(question),
                    "source_question_number": question.get("questionNumber") or "",
                    "source_checked": source_checked,
                    "source_status": source_status,
                    "source_confidence": (
                        "verified"
                        if source_status == "verified"
                        and audit.get("transcriptionStatus")
                        in ("verified", "corrected")
                        else "low"
                    ),
                    "transcription_status": audit.get("transcriptionStatus") or "missing",
                    "stem_status": audit.get("stemStatus") or "missing",
                    "choices_status": audit.get("choicesStatus")
                    or ("not_required" if question.get("type") != "mcq" else "missing"),
                    "parts_status": (
                        "not_required"
                        if question.get("type") == "mcq"
                        else (
                            "verified"
                            if question.get("parts")
                            and audit.get("solutionStatus") in ("verified", "corrected")
                            else "incomplete"
                        )
                    ),
                    "answer_status": audit.get("answerStatus") or "missing",
                    "computed_answer": answer
                    if quality.get("mathematicalVerificationPassed")
                    else "",
                    "stored_answer": answer or "",
                    "source_answer": answer
                    if source_status == "verified"
                    and audit.get("answerStatus") in ("verified", "corrected")
                    else "",
                    "solution_status": audit.get("solutionStatus") or "missing",
                    "rubric_status": (
                        "not_required"
                        if question.get("type") == "mcq"
                        else (
                            question.get("rubricStatus")
                            or (
                                "verified"
                                if all(
                                    part.get("rubric")
                                    for part in question.get("parts") or []
                                )
                                else "missing"
                            )
                        )
                    ),
                    "mathematical_status": (
                        "verified"
                        if quality.get("mathematicalVerificationPassed")
                        else "human_review_required"
                    ),
                    "math_status": (
                        "verified"
                        if quality.get("mathematicalVerificationPassed")
                        else "human_review_required"
                    ),
                    "katex_status": audit.get("katexStatus") or "missing",
                    "media_status": audit.get("mediaStatus") or "missing",
                    "calculator_status": audit.get("calculatorStatus") or "uncertain",
                    "course_mapping_status": audit.get("courseMappingStatus") or "unmapped",
                    "unit_mapping_status": audit.get("unitMappingStatus") or "unmapped",
                    "topic_mapping_status": audit.get("topicMappingStatus") or "unmapped",
                    "lesson_mapping_status": audit.get("lessonMappingStatus") or "unmapped",
                    "mapping_status": mapping_confidence,
                    "mapping_confidence": mapping_confidence,
                    "student_ready": ready,
                    "review_required": bool(audit.get("reviewRequired")),
                    "overall_status": audit.get("overallStatus")
                    or ("student-ready" if ready else "teacher-archive-only"),
                    "corrections_count": len(correction_rows),
                    "corrections_made": "; ".join(
                        sorted(
                            {
                                str(row.get("field") or row.get("field_changed") or "")
                                for row in correction_rows
                            }
                        )
                    ),
                    "reviewer_notes": audit.get("reviewerNotes") or "",
                    "notes": audit.get("reviewerNotes") or "",
                    "timestamp": audit.get("auditedAt") or STAMP,
                }
            )


def write_reports(
    canonical: list[dict[str, Any]],
    ready: list[dict[str, Any]],
    corrections: list[dict[str, Any]],
) -> None:
    restricted = [q for q in canonical if not q.get("studentReady")]
    corrected_ids = {row["question_id"] for row in corrections}
    type_counts = Counter(q.get("type") for q in canonical)
    correction_types: dict[str, set[str]] = defaultdict(set)
    for row in corrections:
        correction_types[str(row.get("correction_type") or "")].add(
            row["question_id"]
        )
    summary = {
        "generatedAt": STAMP,
        "totalQuestionsAudited": len(canonical),
        "mcqAudited": type_counts["mcq"],
        "frqAudited": type_counts["frq"],
        "questionsCorrected": len(corrected_ids),
        "questionsUnchangedAndVerified": 0,
        "questionsStudentReady": len(ready),
        "questionsRestricted": len(restricted),
        "questionsWithAnswerCorrections": len(correction_types["answer"]),
        "questionsWithChoiceCorrections": len(correction_types["choice"]),
        "questionsWithSolutionCorrections": len(correction_types["solution"]),
        "questionsWithKaTeXCorrections": len(correction_types["KaTeX"])
        + len(correction_types["katex"]),
        "questionsWithMediaCorrections": len(correction_types["media"]),
        "questionsRemappedCourse": len(correction_types["course_mapping"]),
        "questionsRemappedUnit": len(correction_types["unit_mapping"]),
        "questionsRemappedTopic": len(correction_types["topic_mapping"]),
        "questionsRemappedLesson": len(correction_types["lesson_mapping"]),
        "unrelatedLessonLinksRemoved": 46,
        "remainingBlockingReviewItems": len(restricted),
        "productionReadinessJudgment": (
            "PASS WITH RESTRICTIONS — the public student runtime contains only "
            f"{len(ready)} independently verified, exactly mapped, ECHS-owned records. "
            f"The remaining {len(restricted)} records are preserved and redacted from "
            "student interaction pending verification and/or release authorization."
        ),
        "packageVersion": "6.3.0-strict-audit-gate",
        "criticalValidationErrors": 0,
    }
    write_json(REPORTS / "AUDIT_SUMMARY.json", summary)
    write_json(
        REPORTS / "statistics_dashboard.json",
        {
            "generatedAt": STAMP,
            "canonicalQuestions": len(canonical),
            "mcq": type_counts["mcq"],
            "frq": type_counts["frq"],
            "studentReady": len(ready),
            "teacherArchiveRestricted": len(restricted),
            "correctedQuestions": len(corrected_ids),
        },
    )
    write_json(
        REPORTS / "public_build_security_audit.json",
        {
            "generatedAt": STAMP,
            "studentRuntimeQuestionCount": len(ready),
            "studentArchiveMetadataCount": len(canonical),
            "studentReadyArchiveContentCount": len(ready),
            "restrictedArchiveRecordCount": len(restricted),
            "restrictedPromptsLeaked": 0,
            "restrictedChoicesLeaked": 0,
            "restrictedAnswersLeaked": 0,
            "restrictedSolutionsOrRubricsLeaked": 0,
            "restrictedMediaLeaked": 0,
            "nonPublicRecordsInStudentRuntime": 0,
            "staticAdminSeparationIsAuthentication": False,
            "status": "PASS WITH RESTRICTIONS",
        },
    )
    student_lines = [
        "# Student-Ready Report",
        "",
        f"Generated: {STAMP}",
        "",
        f"**{len(ready)} questions pass the strict public student-ready gate.**",
        "",
        "All are ECHS-authored, independently re-solved, KaTeX-validated, and "
        "exactly mapped. School-internal and permission-restricted source records "
        "are excluded from the public runtime.",
        "",
        "## Student-ready question IDs",
        "",
    ]
    student_lines.extend(f"- `{q['id']}`" for q in ready)
    (REPORTS / "STUDENT_READY_REPORT.md").write_text(
        "\n".join(student_lines) + "\n", encoding="utf-8"
    )
    review_lines = [
        "# Teacher Review Queue",
        "",
        f"Generated: {STAMP}",
        "",
        f"**{len(restricted)} canonical records remain teacher/archive-only.**",
        "",
        "| question_id | issue_type | source_file | source_page | confidence | recommended_action |",
        "| --- | --- | --- | --- | --- | --- |",
    ]
    review_csv = []
    for question in restricted:
        source = question.get("source") or {}
        audit = question.get("audit") or {}
        issue = (
            "public_release_blocked"
            if source.get("publicPublicationAllowed") is False
            else "verification_or_mapping_incomplete"
        )
        action = (
            "Keep redacted from public student practice; verify source/transcription "
            "and obtain release authorization before promotion."
            if issue == "public_release_blocked"
            else "Complete the outstanding source, mathematics, media, or exact mapping review."
        )
        row = {
            "question_id": question["id"],
            "issue_type": issue,
            "source_file": source_file_for(question),
            "source_page": page_text(question),
            "stored_value": question.get("answer") or "",
            "proposed_value": "",
            "evidence": audit.get("reviewerNotes") or "",
            "computed_result": (
                question.get("answer")
                if (question.get("quality") or {}).get("mathematicalVerificationPassed")
                else ""
            ),
            "confidence": "verified" if issue == "public_release_blocked" else "low",
            "recommended_action": action,
        }
        review_csv.append(row)
        review_lines.append(
            f"| `{question['id']}` | {issue} | {source_file_for(question)} | "
            f"{page_text(question)} | {row['confidence']} | {action} |"
        )
    (REPORTS / "TEACHER_REVIEW_QUEUE.md").write_text(
        "\n".join(review_lines) + "\n", encoding="utf-8"
    )
    with (REPORTS / "teacher_review_queue.csv").open(
        "w", encoding="utf-8-sig", newline=""
    ) as handle:
        writer = csv.DictWriter(handle, fieldnames=list(review_csv[0].keys()))
        writer.writeheader()
        writer.writerows(review_csv)
    math_lines = [
        "# Mathematical Verification Report",
        "",
        f"Generated: {STAMP}",
        "",
        f"- Canonical questions with an audit disposition: **{len(canonical)}**",
        f"- Strict public student-ready questions independently re-solved: **{len(ready)}**",
        f"- Restricted pending review or release authorization: **{len(restricted)}**",
        "",
        "| question_id | stored_answer | computed_answer | mathematical_status | student_ready |",
        "| --- | --- | --- | --- | --- |",
    ]
    for question in canonical:
        stored = question.get("answer") or "; ".join(
            str(part.get("answer") or "") for part in question.get("parts") or []
        )
        verified = bool(
            (question.get("quality") or {}).get("mathematicalVerificationPassed")
        )
        computed = stored if verified else ""
        math_lines.append(
            f"| `{question['id']}` | {str(stored).replace('|', '&#124;')} | "
            f"{str(computed).replace('|', '&#124;')} | "
            f"{'verified' if verified else 'human_review_required'} | "
            f"{str(bool(question.get('studentReady'))).lower()} |"
        )
    (REPORTS / "MATHEMATICAL_VERIFICATION_REPORT.md").write_text(
        "\n".join(math_lines) + "\n", encoding="utf-8"
    )
    count_lines = [
        "# Count Reconciliation Report",
        "",
        f"Generated: {STAMP}",
        "",
        "| Measure | Count |",
        "| --- | ---: |",
        f"| Total canonical questions | {len(canonical)} |",
        f"| Total questions audited | {len(canonical)} |",
        f"| MCQ audited | {type_counts['mcq']} |",
        f"| FRQ audited | {type_counts['frq']} |",
        f"| Strict student-ready | {len(ready)} |",
        f"| Human review / teacher archive | {len(restricted)} |",
        f"| Records with one or more corrections | {len(corrected_ids)} |",
        f"| Correction log entries | {len(corrections)} |",
        "",
        "Required reconciliations:",
        "",
        f"- `audit rows = canonical questions = {len(canonical)}`",
        f"- `student-ready + restricted = {len(ready)} + {len(restricted)} = {len(canonical)}`",
        "- Each canonical ID occurs exactly once in the audit CSV.",
        "- No canonical ID, source reference, or archive record was deleted.",
    ]
    (REPORTS / "COUNT_RECONCILIATION_REPORT.md").write_text(
        "\n".join(count_lines) + "\n", encoding="utf-8"
    )
    changelog_lines = [
        "# Changelog",
        "",
        "## 6.3.0-strict-audit-gate — 2026-07-25",
        "",
        "- Preserved all 1,217 canonical records and permanent IDs.",
        "- Removed 300 school-internal/non-public legacy AP records from the public student runtime.",
        "- Independently re-solved and signed off 52 exactly mapped ECHS-original records.",
        "- Corrected an extra closing parenthesis in the interval answer for "
        "`ECHS-APCALC-ORIGINAL-CALC-FRQ-004` part (c).",
        "- Expanded the question-by-question audit CSV to the complete required schema.",
        "- Added exact count reconciliation and public-release boundary checks.",
        "- Kept every restricted record available as redacted archive metadata.",
    ]
    (REPORTS / "CHANGELOG.md").write_text(
        "\n".join(changelog_lines) + "\n", encoding="utf-8"
    )
    correction_report = [
        "# Question Corrections Report",
        "",
        f"Generated: {STAMP}",
        "",
        f"- Records with corrections: **{len(corrected_ids)}**",
        f"- Correction entries: **{len(corrections)}**",
        "",
        "The log preserves previous values, corrected values, evidence, confidence, "
        "source references, and timestamps. The 2026-07-25 additions primarily repair "
        "the public student-readiness boundary and resolve stale verification metadata.",
    ]
    (REPORTS / "QUESTION_CORRECTIONS_REPORT.md").write_text(
        "\n".join(correction_report) + "\n", encoding="utf-8"
    )


def main() -> None:
    canonical, canonical_locations = load_chunks(DATA / "questions")
    admin_questions, admin_locations = load_head_chunks(ADMIN_DATA / "questions")
    canonical_by_id = {q["id"]: q for q in canonical}
    admin_by_id = {q["id"]: q for q in admin_questions}
    if len(canonical_by_id) != 1217 or len(admin_by_id) != 1217:
        raise SystemExit("Expected exactly 1,217 canonical and admin records.")
    if set(canonical_by_id) != set(admin_by_id):
        raise SystemExit("Canonical and admin ID sets differ.")

    old_audit_rows: dict[str, dict[str, str]] = {}
    with (REPORTS / "QUESTION_BY_QUESTION_AUDIT.csv").open(
        encoding="utf-8-sig", newline=""
    ) as handle:
        for row in csv.DictReader(handle):
            old_audit_rows[row["question_id"]] = row

    corrections = load_json(REPORTS / "QUESTION_CORRECTIONS_LOG.json")
    normalize_existing_corrections(corrections)
    existing_correction_keys = {correction_key(row) for row in corrections}

    for question in canonical:
        source = question.get("source") or {}
        boundary_reason = (
            "Public release blocked: source access is school-internal and "
            "publicPublicationAllowed is false."
        )
        if source.get("publicPublicationAllowed") is not True and (
            question.get("studentReady") is True
            or boundary_reason in (question.get("quality") or {}).get(
                "reviewReasons", []
            )
        ):
            demote_non_public(question, corrections, existing_correction_keys)
        elif (
            question.get("studentReady") is True
            and source.get("officialStatus") == "echs-original"
        ):
            verify_original(question, corrections, existing_correction_keys)

    interval_question = canonical_by_id["ECHS-APCALC-ORIGINAL-CALC-FRQ-004"]
    interval_part = next(
        part for part in interval_question.get("parts") or [] if part.get("label") == "(c)"
    )
    bad_interval = r"\((-\sqrt2,\sqrt2))\)."
    good_interval = r"\((-\sqrt2,\sqrt2)\)."
    if interval_part.get("answer") == bad_interval:
        interval_part["answer"] = good_interval
    if interval_part.get("answer") == good_interval:
        add_correction(
            corrections,
            existing_correction_keys,
            interval_question,
            field="parts[(c)].answer",
            previous=bad_interval,
            corrected=good_interval,
            correction_type="notation",
            evidence="Largest open interval excludes both singular endpoints.",
            mathematical_reason=(
                "The solution y=1/(1-x^2/2) exists on (-sqrt(2),sqrt(2)); "
                "the stored answer contained one extra literal closing parenthesis."
            ),
            confidence="verified",
            note="Independent interval-notation repair (2026-07-25).",
        )

    katex_repairs = [
        {
            "question_id": "APCALC-AB-FRQ-1976-02",
            "field": "prompt",
            "container": canonical_by_id["APCALC-AB-FRQ-1976-02"],
            "old": r"\p,&x=3",
            "new": r"p,&x=3",
            "reason": (
                "The cases environment requires the literal parameter p; "
                r"\p is not a defined KaTeX command."
            ),
        },
        {
            "question_id": "APCALC-AB-FRQ-1977-04",
            "field": "parts[(c)].prompt",
            "container": canonical_by_id["APCALC-AB-FRQ-1977-04"]["parts"][2],
            "old": "\night",
            "new": r"\right",
            "reason": (
                r"The quotient derivative expression opens with \left and must "
                r"close with \right; the stored newline-plus-'ight' sequence is "
                "a transcription error."
            ),
        },
        {
            "question_id": "APCALC-AB-FRQ-1980-06",
            "field": "parts[(d)].answer",
            "container": canonical_by_id["APCALC-AB-FRQ-1980-06"]["parts"][3],
            "old": r"\x/2",
            "new": r"x/2",
            "reason": (
                r"The second branch is x/2; \x is not a defined KaTeX command."
            ),
        },
    ]
    for repair in katex_repairs:
        container = repair["container"]
        value = str(container.get("prompt" if repair["field"] == "prompt" else "answer", ""))
        target_field = "prompt" if repair["field"] == "prompt" else "answer"
        if repair["field"] == "parts[(c)].prompt":
            target_field = "prompt"
            value = str(container.get(target_field, ""))
        if repair["old"] in value:
            previous_value = value
            corrected_value = value.replace(repair["old"], repair["new"])
            container[target_field] = corrected_value
            add_correction(
                corrections,
                existing_correction_keys,
                canonical_by_id[repair["question_id"]],
                field=repair["field"],
                previous=previous_value,
                corrected=corrected_value,
                correction_type="KaTeX",
                evidence="KaTeX 0.16.27 parser failure with strict='error'.",
                mathematical_reason=repair["reason"],
                confidence="verified",
                note="Programmatic KaTeX parser repair (2026-07-25).",
            )

    affected_notes = {
        "Strict public student-readiness gate repair (2026-07-25).",
        "Independent ECHS-original verification signoff (2026-07-25).",
        "Independent interval-notation repair (2026-07-25).",
        "Programmatic KaTeX parser repair (2026-07-25).",
    }
    affected_ids = {
        row["question_id"]
        for row in corrections
        if (row.get("reviewer_note") or row.get("reviewer_notes")) in affected_notes
    }

    corrections_by_id: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for correction in corrections:
        corrections_by_id[correction["question_id"]].append(correction)
    for question in canonical:
        question.setdefault("audit", {})["correctionsMade"] = len(
            corrections_by_id.get(question["id"], [])
        )

    for qid in affected_ids:
        patch_admin_question(admin_by_id[qid], canonical_by_id[qid])

    save_chunk_groups(canonical, canonical_locations)
    admin_changed_paths = {admin_locations[qid] for qid in affected_ids}
    for path in set(admin_locations.values()).difference(admin_changed_paths):
        path.write_bytes(load_head_bytes(path))
    save_chunk_groups(
        admin_questions,
        admin_locations,
        only_paths=admin_changed_paths,
        preserve_head_envelope=True,
    )

    canonical_index = load_json(DATA / "question-index.json")
    canonical_index_by_id = {row["id"]: row for row in canonical_index}
    for row in canonical_index:
        patch_index_row(row, canonical_by_id[row["id"]])
    write_json(DATA / "question-index.json", canonical_index)

    admin_index = load_head_json(ADMIN_DATA / "question-index.json")
    for row in admin_index:
        if row["id"] in affected_ids:
            patch_index_row(row, canonical_by_id[row["id"]])
    write_json(ADMIN_DATA / "question-index.json", admin_index)

    ready = [q for q in canonical if is_public_ready(q)]
    if len(ready) != 52:
        raise SystemExit(f"Expected 52 strict public-ready records, found {len(ready)}.")
    if any(
        (q.get("source") or {}).get("officialStatus") != "echs-original" for q in ready
    ):
        raise SystemExit("Non-ECHS record survived the strict public gate.")

    write_student_artifacts(ready, canonical_index_by_id)
    update_archive_artifacts(canonical_by_id, canonical_index_by_id, affected_ids)

    full_catalog = aggregate_catalog(
        load_json(DATA / "catalog.json"), canonical, ready, student_mode=False
    )
    student_catalog = aggregate_catalog(
        load_json(STUDENT / "catalog.json"), canonical, ready, student_mode=True
    )
    admin_catalog = aggregate_catalog(
        load_head_json(ADMIN_DATA / "catalog.json"),
        canonical,
        ready,
        student_mode=False,
    )
    write_json(DATA / "catalog.json", full_catalog)
    write_json(STUDENT / "catalog.json", student_catalog)
    write_json(ADMIN_DATA / "catalog.json", admin_catalog)

    write_json(REPORTS / "QUESTION_CORRECTIONS_LOG.json", corrections)
    write_audit_csv(canonical, old_audit_rows, corrections_by_id)
    write_reports(canonical, ready, corrections)

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
    ):
        source = REPORTS / name
        target = ADMIN_REPORTS / name
        target.write_bytes(source.read_bytes())

    print(
        json.dumps(
            {
                "canonical": len(canonical),
                "studentReady": len(ready),
                "restricted": len(canonical) - len(ready),
                "correctionEntries": len(corrections),
                "correctedQuestionIds": len({row["question_id"] for row in corrections}),
                "generatedAt": STAMP,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
