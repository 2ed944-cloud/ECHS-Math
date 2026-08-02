#!/usr/bin/env python3
"""Make inline SVG definition IDs unique within each HTML document."""
from __future__ import annotations

import re
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SVG = re.compile(r"<svg\b.*?</svg>", re.DOTALL | re.IGNORECASE)
ID = re.compile(r'\bid="([A-Za-z][\w:.-]*)"')


def repair_document(text: str) -> tuple[str, int]:
    counts = Counter(ID.findall(text))
    duplicates = {key for key, value in counts.items() if value > 1}
    if not duplicates:
        return text, 0
    used: set[str] = set()
    changed = 0

    def repair_svg(match: re.Match[str]) -> str:
        nonlocal changed
        block = match.group(0)
        for old in ID.findall(block):
            if old not in duplicates:
                continue
            if old not in used:
                used.add(old)
                continue
            suffix = 2
            new = f"{old}-{suffix}"
            while new in used or new in text:
                suffix += 1
                new = f"{old}-{suffix}"
            block = block.replace(f'id="{old}"', f'id="{new}"', 1)
            block = block.replace(f"url(#{old})", f"url(#{new})")
            block = block.replace(f'href="#{old}"', f'href="#{new}"')
            block = block.replace(f"href='#{old}'", f"href='#{new}'")
            used.add(new)
            changed += 1
        return block

    return SVG.sub(repair_svg, text), changed


def main() -> None:
    files = 0
    identifiers = 0
    for path in ROOT.rglob("*.html"):
        if {".git", ".echs-backups", "node_modules", "_pages"}.intersection(path.relative_to(ROOT).parts):
            continue
        original = path.read_text(encoding="utf-8", errors="replace")
        repaired, changed = repair_document(original)
        if changed:
            path.write_text(repaired, encoding="utf-8")
            files += 1
            identifiers += changed
    print(f"HTML files repaired: {files}")
    print(f"Duplicate SVG IDs renamed: {identifiers}")


if __name__ == "__main__":
    main()
