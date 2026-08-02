from pathlib import Path
import json
import math
import re
import sys

root = Path(__file__).resolve().parents[1]
errors = []
content_paths = [root / "data" / f"lesson-1.{i}-v3.js" for i in range(1, 9)]
required = [
    root / "assets/css/unit1-premium.css",
    *content_paths,
    root / "data/unit-1-v3-enhancements.js",
]
for path in required:
    if not path.exists():
        errors.append(f"missing {path.relative_to(root)}")

packs = {}
prefix = "window.ECHS_UNIT1_V3_CONTENT="
for content_path in content_paths:
    if not content_path.exists():
        continue
    text = content_path.read_text(encoding="utf-8").strip()
    if not text.startswith(prefix) or not text.endswith(";"):
        errors.append(f"{content_path.name}: v3 content wrapper is invalid")
    else:
        packs.update(json.loads(text[len(prefix):-1]))

all_ids = set()
all_prompts = set()
for lesson_number in [f"1.{i}" for i in range(1, 9)]:
    pack = packs.get(lesson_number)
    if not pack:
        errors.append(f"{lesson_number}: missing v3 pack")
        continue
    if len(pack.get("deep_dives", [])) != 4:
        errors.append(f"{lesson_number}: deep_dives={len(pack.get('deep_dives', []))}")
    practice = pack.get("practice", [])
    quiz = pack.get("quiz", [])
    exam = pack.get("exam", {})
    if len(practice) != 12:
        errors.append(f"{lesson_number}: added practice={len(practice)}")
    if len(quiz) != 4:
        errors.append(f"{lesson_number}: added quiz={len(quiz)}")
    levels = {key: sum(item.get("level") == key for item in practice)
              for key in ["Foundation", "Application", "Reasoning", "Challenge"]}
    if set(levels.values()) != {3}:
        errors.append(f"{lesson_number}: added levels={levels}")
    if exam.get("total_marks") != sum(part.get("marks", 0) for part in exam.get("parts", [])):
        errors.append(f"{lesson_number}: extended-task marks do not add")
    for item in practice + quiz + ([exam] if exam else []):
        item_id = item.get("id")
        if not item_id:
            errors.append(f"{lesson_number}: item without id")
        elif item_id in all_ids:
            errors.append(f"duplicate id {item_id}")
        else:
            all_ids.add(item_id)
    for item in practice + quiz:
        prompt = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", item.get("prompt", ""))).strip().lower()
        if prompt in all_prompts:
            errors.append(f"duplicate added prompt: {item.get('id')}")
        all_prompts.add(prompt)
        check = item.get("check", {})
        if check.get("mode") == "number":
            value = check.get("value")
            tolerance = check.get("tolerance")
            if not isinstance(value, (int, float)) or not math.isfinite(value):
                errors.append(f"{item.get('id')}: invalid numerical target")
            if not isinstance(tolerance, (int, float)) or not math.isfinite(tolerance) or tolerance <= 0:
                errors.append(f"{item.get('id')}: invalid tolerance")

for i in range(1, 9):
    matches = list((root / "lessons").glob(f"IB_AI_SL_1.{i}_*_ECHS.html"))
    if len(matches) != 1:
        errors.append(f"1.{i}: expected one lesson wrapper, found {len(matches)}")
        continue
    html = matches[0].read_text(encoding="utf-8")
    for asset in [
        "../assets/css/unit1-premium.css?v=3.0.0",
        f"../data/lesson-1.{i}-v3.js?v=3.0.0",
        "../data/unit-1-v3-enhancements.js?v=3.0.0",
    ]:
        if asset not in html:
            errors.append(f"{matches[0].name}: missing {asset}")

expected_final = {
    "slides_per_lesson": 61,
    "practice_per_lesson": 52,
    "quiz_per_lesson": 14,
    "exam_per_lesson": 3,
    "unit_slides": 488,
    "unit_practice": 416,
    "unit_quiz": 112,
    "unit_exam": 24,
}
# Baseline data remains 49/40/10/2 and the v3 overlay adds 12/12/4/1.
if len(packs) == 8:
    computed = {
        "slides_per_lesson": 49 + len(next(iter(packs.values()))["deep_dives"]) * 3,
        "practice_per_lesson": 40 + len(next(iter(packs.values()))["practice"]),
        "quiz_per_lesson": 10 + len(next(iter(packs.values()))["quiz"]),
        "exam_per_lesson": 2 + 1,
        "unit_slides": sum(49 + len(p["deep_dives"]) * 3 for p in packs.values()),
        "unit_practice": sum(40 + len(p["practice"]) for p in packs.values()),
        "unit_quiz": sum(10 + len(p["quiz"]) for p in packs.values()),
        "unit_exam": sum(2 + 1 for _ in packs.values()),
    }
    if computed != expected_final:
        errors.append(f"final counts mismatch: {computed}")

if errors:
    print("FAIL")
    print("\n".join(errors))
    sys.exit(1)
print("PASS: Unit 1 v3 files, wrapper wiring, added content, level balance, IDs, prompts, numerical checks and final counts")
