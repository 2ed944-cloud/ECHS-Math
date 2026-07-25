#!/usr/bin/env python3
"""Technical validator for student-accessible Blackboard Practice Studio imports."""
from __future__ import annotations

import argparse
import json
import re
import sys
import zipfile
from pathlib import Path

IMAGE_RE = re.compile(r'data-bbzip-package="([^"]+)"[^>]+data-bbzip-path="([^"]+)"', re.I)


def load_questions(path: Path) -> list[dict]:
    data = json.loads(path.read_text(encoding="utf-8"))
    rows = data.get("questions", data)
    if not isinstance(rows, list):
        raise ValueError(f"{path}: expected a questions array")
    return rows


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("inputs", nargs="+", type=Path)
    parser.add_argument("--site-root", type=Path, required=True)
    args = parser.parse_args()

    errors: list[str] = []
    ids: set[str] = set()
    package_cache: dict[Path, set[str] | None] = {}
    questions = 0
    image_refs = 0

    for path in args.inputs:
        try:
            rows = load_questions(path)
        except Exception as error:
            errors.append(str(error))
            continue
        for question in rows:
            questions += 1
            question_id = str(question.get("id", "")).strip()
            if not question_id:
                errors.append(f"{path}: question missing id")
            elif question_id in ids:
                errors.append(f"duplicate question id: {question_id}")
            ids.add(question_id)

            if not question.get("prompt_html"):
                errors.append(f"{question_id}: missing prompt_html")
            choices = question.get("choices") or []
            choice_ids = {str(choice.get("id")) for choice in choices}
            for answer_id in question.get("correct_choice_ids") or []:
                if str(answer_id) not in choice_ids:
                    errors.append(f"{question_id}: answer id {answer_id} is not a choice")

            combined = str(question.get("prompt_html", "")) + " ".join(str(x.get("html", "")) for x in choices)
            for package_name, source_path in IMAGE_RE.findall(combined):
                image_refs += 1
                package = args.site_root / package_name
                if package not in package_cache:
                    if not package.exists():
                        package_cache[package] = None
                    else:
                        try:
                            with zipfile.ZipFile(package) as archive:
                                package_cache[package] = set(archive.namelist())
                        except Exception as error:
                            errors.append(f"{package}: invalid ZIP package: {error}")
                            package_cache[package] = None
                members = package_cache[package]
                if members is None:
                    errors.append(f"{question_id}: missing media package {package_name}")
                elif source_path not in members:
                    errors.append(f"{question_id}: {source_path} is missing from {package_name}")

    print(json.dumps({
        "questions": questions,
        "uniqueIds": len(ids),
        "imageReferences": image_refs,
        "mediaPackages": len(package_cache),
        "errors": len(errors),
    }, indent=2))
    if errors:
        for error in errors[:200]:
            print("ERROR:", error, file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
