#!/usr/bin/env python3
"""Regression checks for multi-course private-bank import support."""
from __future__ import annotations

import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MODULE_PATH = ROOT / "tools" / "upload_private_bank_package_fast.py"
spec = importlib.util.spec_from_file_location("echs_fast_bank_uploader", MODULE_PATH)
if spec is None or spec.loader is None:
    raise SystemExit("Could not load fast private-bank uploader")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

question = {
    "id": "APCALC-TEST-001",
    "type": "essay",
    "prompt_text": "Differentiate x^2.",
    "solution_text": "2x",
    "course_mappings": [{
        "course": "ap-calculus",
        "unit": 2,
        "lesson_key": "APCALC-U2-DERIVATIVE",
        "lesson_title": "The Derivative",
        "skill_key": "APCALC.TEST.DERIVATIVE",
        "mapping_verified": True,
    }],
    "trust": {
        "tier": "publisher_key_direct",
        "student_visible": True,
        "source_verified": True,
        "media_verified": True,
        "mapping_verified": True,
        "verification_basis": "publisher-answer-key",
        "manual_question_trust_required": False,
    },
    "rights": {
        "student_publication_allowed": True,
        "public_web_publication_allowed": False,
    },
    "metadata": {
        "student_ready": True,
        "student_accessible": True,
    },
}

module.validate_question(question)
assert module.manifest_target_courses({"target_courses": ["ap-calculus"]}) == ["ap-calculus"]
courses, lessons, skills = module.direct_mappings(question, ["ap-calculus"])
assert courses == ["ap-calculus"]
assert lessons == ["ap-calculus:APCALC-U2-DERIVATIVE"]
assert skills == ["APCALC.TEST.DERIVATIVE"]

try:
    module.direct_mappings(question, ["ap-precalculus"])
except RuntimeError as error:
    assert "do not match package targets" in str(error)
else:
    raise AssertionError("Course mismatch was not rejected")

legacy = {**question, "id": "LEGACY-DUAL-001", "course_mappings": [
    {"course": "ap-precalculus", "unit": 0, "lesson_key": "0.1", "skill_key": "LEGACY.AP", "mapping_verified": True},
    {"course": "ib-math-ai", "unit": 0, "lesson_key": "u0-readiness", "skill_key": "LEGACY.IB", "mapping_verified": True},
]}
legacy_courses, _, _ = module.direct_mappings(legacy)
assert legacy_courses == ["ap-precalculus", "ib-math-ai"]

print("AP Calculus private-bank support: PASS")
