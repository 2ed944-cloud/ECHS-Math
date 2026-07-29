#!/usr/bin/env python3
"""Regression test for course-release changed-file selection.

A new lesson package may replace a tracked legacy HTML shell with individually
numbered lesson files. The workflow must validate the new files without trying
to open the deleted legacy path.
"""
from __future__ import annotations

import subprocess
import tempfile
from pathlib import Path


SELECTION = r"""
{
  git diff --name-only --diff-filter=ACMR --
  git ls-files --others --exclude-standard
} | sed '/^$/d' | sort -u
"""


def run(*args: str, cwd: Path) -> str:
    result = subprocess.run(args, cwd=cwd, text=True, capture_output=True, check=True)
    return result.stdout


def main() -> int:
    with tempfile.TemporaryDirectory() as temporary:
        root = Path(temporary)
        run("git", "init", "-q", cwd=root)
        run("git", "config", "user.email", "test@example.com", cwd=root)
        run("git", "config", "user.name", "ECHS Test", cwd=root)

        legacy = root / "lessons/ib-math-ai/unit-1/lessons/lesson.html"
        legacy.parent.mkdir(parents=True)
        legacy.write_text("<html><body>legacy</body></html>\n", encoding="utf-8")
        run("git", "add", ".", cwd=root)
        run("git", "commit", "-qm", "legacy release", cwd=root)

        legacy.unlink()
        lesson = root / "lessons/ib-math-ai/unit-1/lessons/IB_Math_AI_1.1.html"
        lesson.write_text("<html><body>new lesson</body></html>\n", encoding="utf-8")
        update = root / "data/ib-math-ai-unit-1-update.js"
        update.parent.mkdir(parents=True)
        update.write_text("window.TEST_RELEASE=true;\n", encoding="utf-8")

        selected = subprocess.run(
            ["bash", "-lc", SELECTION],
            cwd=root,
            text=True,
            capture_output=True,
            check=True,
        ).stdout.splitlines()

        legacy_path = legacy.relative_to(root).as_posix()
        lesson_path = lesson.relative_to(root).as_posix()
        update_path = update.relative_to(root).as_posix()

        assert legacy_path not in selected, f"deleted legacy path was selected: {selected}"
        assert lesson_path in selected, f"new lesson HTML was not selected: {selected}"
        assert update_path in selected, f"portal update JavaScript was not selected: {selected}"
        assert all((root / path).is_file() for path in selected), f"selection contains a missing file: {selected}"

    print("Course release changed-file selection regression: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
