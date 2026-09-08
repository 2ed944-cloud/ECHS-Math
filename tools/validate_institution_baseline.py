#!/usr/bin/env python3
"""Run the existing activation/phase-3 validator against an isolated file fixture."""
from __future__ import annotations
import ast
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile


VALIDATORS = ("tools/validate_production_activation.py", "tools/validate_institution_platform.py")


def copy_fixture(root: Path, destination: Path) -> None:
    """Copy file inputs named by the unchanged validators, without symlinks or live writes.

    Their current inputs are literal relative paths (including list entries). A later
    dynamically constructed input is intentionally absent and makes validation fail.
    """
    inputs = set(VALIDATORS)
    for relative in VALIDATORS:
        source = root / relative
        tree = ast.parse(source.read_text(encoding="utf-8"), filename=str(source))
        for node in ast.walk(tree):
            if not isinstance(node, ast.Constant) or not isinstance(node.value, str):
                continue
            candidate = Path(node.value)
            if candidate.is_absolute() or ".." in candidate.parts:
                continue
            try:
                if (root / candidate).is_file():
                    inputs.add(candidate.as_posix())
            except (OSError, ValueError):
                continue
    for relative in sorted(inputs):
        target = destination / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(root / relative, target)


def main(root: Path | None = None) -> int:
    root = Path(__file__).resolve().parents[1] if root is None else root
    with tempfile.TemporaryDirectory(prefix="echs-institution-baseline-") as temporary:
        fixture = Path(temporary)
        copy_fixture(root, fixture)
        config = json.loads((fixture / "config/institution.json").read_text(encoding="utf-8"))
        selected = VALIDATORS[0] if config.get("enabled") is True else VALIDATORS[1]
        print(f"Institution fixture: {selected}; original configuration is untouched.", flush=True)
        return subprocess.run([sys.executable, str(fixture / selected)], cwd=fixture, check=False).returncode


if __name__ == "__main__":
    raise SystemExit(main())
