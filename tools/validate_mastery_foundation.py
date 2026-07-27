#!/usr/bin/env python3
"""Validate the ECHS Question Trust, Knowledge Graph and Mastery 2.0 foundation."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ERRORS: list[str] = []


def fail(message: str) -> None:
    ERRORS.append(message)


def read(relative: str) -> str:
    path = ROOT / relative
    if not path.is_file():
        fail(f"Missing required file: {relative}")
        return ""
    return path.read_text(encoding="utf-8", errors="replace")


def load_json(relative: str):
    text = read(relative)
    if not text:
        return {}
    try:
        return json.loads(text)
    except Exception as exc:
        fail(f"Invalid JSON in {relative}: {exc}")
        return {}


def require(text: str, markers: list[str], label: str) -> None:
    for marker in markers:
        if marker not in text:
            fail(f"{label} missing marker: {marker}")


def forbid(text: str, markers: list[str], label: str) -> None:
    for marker in markers:
        if marker in text:
            fail(f"{label} contains forbidden marker: {marker}")


def validate_graph() -> None:
    schema = load_json("data/knowledge-graph/schema-v1.json")
    graph = load_json("data/knowledge-graph/ap-calculus-unit-1.json")
    if schema.get("title") != "ECHS Mathematics Atomic Skill Graph":
        fail("Knowledge graph schema title is missing")
    if graph.get("schema_version") != "1.0.0":
        fail("Knowledge graph schema version must be 1.0.0")
    if graph.get("course") != "ap-calculus" or str(graph.get("unit")) != "1":
        fail("The foundation graph must represent AP Calculus Unit 1")
    skills = graph.get("skills") or []
    if len(skills) < 16:
        fail(f"AP Calculus Unit 1 graph is too small: {len(skills)} skills")
    ids = [row.get("id") for row in skills]
    if len(ids) != len(set(ids)):
        fail("Knowledge graph contains duplicate skill IDs")
    known = set(ids)
    required_representations = {"symbolic", "graphical", "numerical", "verbal", "tabular", "contextual"}
    represented: set[str] = set()
    for row in skills:
        skill_id = row.get("id")
        if not skill_id or not str(skill_id).startswith("APCALC.U1."):
            fail(f"Invalid atomic skill ID: {skill_id}")
        for prereq in row.get("prerequisites") or []:
            if prereq not in known:
                fail(f"{skill_id} references unknown prerequisite {prereq}")
        reps = set(row.get("representations") or [])
        represented.update(reps)
        if not reps:
            fail(f"{skill_id} has no representation tags")
        if not row.get("misconceptions"):
            fail(f"{skill_id} has no misconception tags")
        rules = row.get("evidence_rules") or {}
        for key in ("minimum_independent", "minimum_days", "requires_transfer", "requires_retention", "minimum_confidence"):
            if key not in rules:
                fail(f"{skill_id} evidence rules missing {key}")
    if not required_representations.issubset(represented):
        fail(f"Knowledge graph representation coverage is incomplete: {sorted(required_representations - represented)}")


def validate_trust_manifest() -> None:
    manifest = load_json("question-bank/official/admin/data/question-trust-manifest.json")
    scope = manifest.get("canonical_scope") or {}
    canonical = int(scope.get("questions") or 0)
    ready = int(scope.get("student_ready") or 0)
    restricted = int(scope.get("teacher_archive_restricted") or 0)
    if canonical != 1217 or ready != 52 or restricted != 1165:
        fail(f"Question trust counts do not match audited baseline: {canonical}/{ready}/{restricted}")
    if ready + restricted != canonical:
        fail("Question trust counts do not reconcile")
    tiers = {row.get("id"): row for row in manifest.get("trust_tiers") or []}
    for tier in ("student_ready_verified", "teacher_review_required", "indexed_only", "rights_restricted"):
        if tier not in tiers:
            fail(f"Question trust tier is missing: {tier}")
    if not tiers.get("student_ready_verified", {}).get("student_visible"):
        fail("Verified student-ready tier must be student visible")
    for tier in ("teacher_review_required", "indexed_only", "rights_restricted"):
        if tiers.get(tier, {}).get("student_visible"):
            fail(f"Restricted trust tier cannot be student visible: {tier}")
    gate = manifest.get("student_release_gate") or {}
    for key in ("forbid_unknown_answer", "forbid_missing_media", "forbid_unmapped_skill", "forbid_unverified_math", "forbid_unresolved_rights"):
        if gate.get(key) is not True:
            fail(f"Student release gate must fail closed for {key}")


def validate_server_authority() -> None:
    migration = read("supabase/migrations/202607272001_mastery_evidence_foundation.sql")
    guard = read("supabase/migrations/202607272002_mastery_authority_guard.sql")
    service = read("supabase/functions/mastery-evidence/index.ts")
    legacy = read("supabase/functions/learning-sync/index.ts")
    require(migration, [
        "create table if not exists public.skill_definitions",
        "create table if not exists public.question_trust_records",
        "add column if not exists skill_key text",
        "add column if not exists confidence numeric",
        "add column if not exists independent_evidence integer",
        "add column if not exists transfer_evidence integer",
        "add column if not exists retention_evidence integer",
        "APCALC.U1.IVT",
    ], "Mastery foundation migration")
    require(guard, [
        "private.enforce_mastery_authority",
        "new.source is distinct from 'server'",
        "echs-mastery-2.0-foundation",
        "mastery_records_authority_guard",
    ], "Mastery authority guard")
    require(service, [
        "recomputeMastery",
        "client_mastery_ignored",
        "source: \"server\"",
        "echs-mastery-2.0-foundation",
        "independent_evidence",
        "transfer_evidence",
        "retention_evidence",
        "representation_count",
        "active_days",
        "authoritative: true",
        "classEvidence",
    ], "Mastery evidence service")
    require(legacy, ["deprecated:true", "authoritative_mastery_service:\"mastery-evidence\"", "client_mastery_ignored"], "Legacy sync compatibility")
    forbid(legacy, ["upsert(masteryRows", "mastery_records\").upsert"], "Legacy sync compatibility")


def validate_client_and_teacher_evidence() -> None:
    experience = read("js/institution-experience.js")
    client = read("js/institution-mastery-evidence.js")
    teacher = read("question-bank/js/teacher-evidence-heatmap.js")
    css = read("css/mastery-evidence.css")
    trust_page = read("question-bank/official/admin/question-trust.html")
    trust_js = read("question-bank/official/admin/js/question-trust.js")
    worker = read("sw.js")
    require(experience, ["loadMasteryEvidence", "institution-mastery-evidence.js", "teacher-evidence-heatmap.js", "mastery-evidence.css"], "Institution experience loader")
    require(client, [
        "ECHSInstitution.syncLearning=syncLearning",
        'ECHSInstitution.api("mastery-evidence","/sync"',
        "document.documentElement.dataset.masteryAuthority=\"server\"",
        "classEvidence",
        "Question Trust",
    ], "Mastery evidence client")
    require(teacher, [
        "authoritativeEvidence",
        "ECHSMasteryEvidence.classEvidence",
        "The platform will not invent heatmap values",
        "independent_evidence",
        "retention_evidence",
        "transfer_evidence",
        "Server-authoritative",
    ], "Teacher evidence heatmap")
    require(css, [".evidenceHeatmap", ".evidenceCell.mastered", ".evidenceCell.noEvidence", ".evidenceLegend"], "Mastery evidence stylesheet")
    require(trust_page, ["Question Trust Center", "Audited content boundary", "question-trust.js"], "Question Trust Center")
    require(trust_js, ['requireAuth(["teacher","admin"])', "question-trust-manifest.json", "fail-closed"], "Question Trust controller")
    require(worker, [
        "mastery1",
        "mastery-evidence.css",
        "institution-mastery-evidence.js",
        "teacher-evidence-heatmap.js",
        "question-trust.html",
        "question-trust-manifest.json",
        "data/knowledge-graph/ap-calculus-unit-1.json",
        "mastery-evidence",
    ], "Service worker")


def validate_syntax() -> None:
    scripts = [
        "js/institution-experience.js",
        "js/institution-mastery-evidence.js",
        "question-bank/js/teacher-evidence-heatmap.js",
        "question-bank/official/admin/js/question-trust.js",
        "sw.js",
    ]
    for relative in scripts:
        result = subprocess.run(["node", "--check", str(ROOT / relative)], capture_output=True, text=True)
        if result.returncode:
            fail(f"JavaScript syntax failed for {relative}: {result.stderr.strip()}")


def main() -> int:
    validate_graph()
    validate_trust_manifest()
    validate_server_authority()
    validate_client_and_teacher_evidence()
    validate_syntax()
    print("ECHS Question Trust + Knowledge Graph + Mastery 2.0 foundation")
    print(f"Errors: {len(ERRORS)}")
    for error in ERRORS:
        print(f"  ERROR: {error}")
    if ERRORS:
        return 1
    print("Status: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
