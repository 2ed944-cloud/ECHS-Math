#!/usr/bin/env python3
"""Validate local HTML references across the complete student-facing tree."""
from __future__ import annotations

import argparse
import sys
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


ATTRS = {"href", "src", "poster", "action"}
SKIP_PARTS = {".git", ".echs-backups", "node_modules", "_pages"}
SKIP_SCHEMES = {"data", "http", "https", "mailto", "tel", "javascript", "blob"}


class ReferenceParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.references: list[str] = []
        self.ids: list[str] = []

    def handle_starttag(self, _tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if values.get("id"):
            self.ids.append(str(values["id"]))
        for name, value in attrs:
            if name in ATTRS and value:
                self.references.append(value.strip())


def html_files(root: Path) -> list[Path]:
    return sorted(
        path
        for path in root.rglob("*.html")
        if not SKIP_PARTS.intersection(path.relative_to(root).parts)
        and ".before-" not in path.name
    )


def resolve(root: Path, source: Path, reference: str) -> Path | None:
    if not reference or reference.startswith("#") or "${" in reference or "{{" in reference:
        return None
    parsed = urlsplit(reference)
    if parsed.scheme.lower() in SKIP_SCHEMES or parsed.netloc:
        return None
    path_text = unquote(parsed.path).replace("\\", "/")
    if not path_text:
        return None
    if path_text.startswith("/ECHS-Math/"):
        target = root / path_text.removeprefix("/ECHS-Math/")
    elif path_text.startswith("/"):
        return None
    else:
        target = source.parent / path_text
    return target.resolve()


def validate(root: Path) -> tuple[int, list[str]]:
    checked = 0
    errors: list[str] = []
    for source in html_files(root):
        parser = ReferenceParser()
        try:
            parser.feed(source.read_text(encoding="utf-8", errors="replace"))
        except Exception as exc:
            errors.append(f"Could not parse {source.relative_to(root)}: {exc}")
            continue
        for element_id, count in Counter(parser.ids).items():
            if count > 1:
                errors.append(f"{source.relative_to(root)} -> duplicate id #{element_id} ({count} occurrences)")
        for reference in parser.references:
            target = resolve(root, source, reference)
            if target is None:
                continue
            checked += 1
            if target.is_file() or (target.is_dir() and (target / "index.html").is_file()):
                continue
            errors.append(f"{source.relative_to(root)} -> {reference}")
    return checked, sorted(set(errors))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("root", nargs="?", type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    root = args.root.resolve()
    checked, errors = validate(root)
    print(f"Local HTML references checked: {checked}")
    print(f"Broken references: {len(errors)}")
    for error in errors:
        print(f"  ERROR: {error}")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
