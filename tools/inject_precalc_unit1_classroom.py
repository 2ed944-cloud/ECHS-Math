#!/usr/bin/env python3
"""Add the bounded Unit 1 adapter to guarded build copies, never canonical decks."""
from __future__ import annotations
import argparse
from pathlib import Path
import re

TITLES = [
    'Change in Tandem', 'Rates of Change', 'Rates of Change in Linear and Quadratic Functions',
    'Polynomial Functions and Rates of Change', 'Polynomial Functions and Complex Zeros',
    'Polynomial Functions and End Behavior', 'Rational Functions and End Behavior',
    'Rational Functions and Zeros', 'Rational Functions and Vertical Asymptotes',
    'Rational Functions and Holes', 'Equivalent Representations of Polynomial and Rational Expressions',
    'Transformations of Functions', 'Function Model Selection and Assumption Articulation',
    'Function Model Construction and Application',
]
PATHS = [f'lessons/ap-precalculus/unit-1/AP_Precalculus_1.{i}_{title.replace(" ", "_")}_ECHS_Refined.html'
         for i, title in enumerate(TITLES, 1)]
MARKER = 'data-echs-unit1-classroom="1"'
HOOK = '\n<script data-echs-unit1-classroom="1" src="../../shared/classroom/precalc-unit1/entry.js?v=20260930-classroom1"></script>\n'

def inject(root: Path, path: Path) -> bool:
    if path.resolve().relative_to(root.resolve()).as_posix() not in PATHS:
        raise ValueError('Not an allowlisted AP Precalculus Unit 1 lesson')
    text = path.read_text(encoding='utf-8')
    if not re.search(r'<meta\b[^>]*name="echs-course"[^>]*content="ap-precalculus"[^>]*data-echs-lesson-guard="1"', text):
        raise ValueError('Existing authenticated lesson guard is required')
    if 'id="echsLessonGateStyle"' not in text or 'lesson-access-guard.js' not in text:
        raise ValueError('Incomplete existing lesson guard')
    if MARKER in text:
        if text.count(HOOK) != 1:
            raise ValueError('Malformed or duplicate classroom hook')
        return False
    if 'classroom/precalc-unit1/entry.js' in text:
        raise ValueError('Unmarked classroom entry')
    offset = text.lower().rfind('</head>')
    if offset < 0:
        raise ValueError('Missing head end')
    path.write_text(text[:offset] + HOOK + text[offset:], encoding='utf-8')
    return True

def run(root: Path) -> int:
    paths = [root / item for item in PATHS]
    for path in paths:
        if not path.is_file():
            raise ValueError(f'Missing canonical lesson: {path.relative_to(root)}')
    if not (root / 'lessons/shared/classroom/precalc-unit1/entry.js').is_file():
        raise ValueError('Missing adapter runtime')
    return sum(inject(root, path) for path in paths)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('root', type=Path)
    args = parser.parse_args()
    print(f'AP Precalculus Unit 1 classroom hooks added: {run(args.root)}')
