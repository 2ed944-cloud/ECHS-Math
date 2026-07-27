#!/usr/bin/env python3
"""Fail-closed checks for server-derived question trust and atomic skill mapping."""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
errors: list[str] = []


def check(relative: str, required: list[str], forbidden: list[str] | None = None) -> None:
    path = ROOT / relative
    if not path.is_file():
        errors.append(f"Missing required file: {relative}")
        return
    text = path.read_text(encoding="utf-8", errors="replace")
    for marker in required:
        if marker not in text:
            errors.append(f"{relative} missing marker: {marker}")
    for marker in forbidden or []:
        if marker in text:
            errors.append(f"{relative} contains forbidden marker: {marker}")


check(
    "supabase/migrations/202607270003_attempt_trust_guard.sql",
    [
        "private.apply_question_trust_to_attempt",
        "from public.question_trust_records",
        "new.trust_tier := coalesce(v_tier, 'legacy_verified_boundary')",
        "learning_attempts_trust_guard",
    ],
)
check(
    "supabase/migrations/202607270004_atomic_skill_mapping.sql",
    [
        "private.apply_atomic_skill_to_attempt",
        "select count(*), min(definition.skill_key)",
        "if v_matches = 1",
        "learning_attempts_atomic_skill_guard",
    ],
    ["order by", "limit 1"],
)
check(
    "supabase/functions/mastery-evidence/index.ts",
    [
        "const authoritativeMastery = await recomputeMastery",
        "client_mastery_ignored",
        "source: \"server\"",
        "authoritative: true",
    ],
)
check(
    "supabase/functions/learning-sync/index.ts",
    ["deprecated:true", "client_mastery_ignored"],
    ["mastery_records"],
)

print("ECHS mastery authority and mapping guards")
print(f"Errors: {len(errors)}")
for error in errors:
    print(f"  ERROR: {error}")
if errors:
    sys.exit(1)
print("Status: PASS")
