#!/usr/bin/env python3
"""Deterministic release checks for Grade 9 lesson 2.3."""

from __future__ import annotations

import json
import re
import unittest
from fractions import Fraction
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "curriculum/pathways/grade-9-2026-2027.json"
CATALOG = ROOT / "data/grade-9-10-pathways.js"
LESSON_URL = "lessons/pathways/grade-9/unit-2/g9-2.3-systems-three-variables.html"
LESSON = ROOT / LESSON_URL


def satisfies(rows: list[tuple[int | Fraction, int | Fraction, int | Fraction, int | Fraction]], triple: tuple[int | Fraction, int | Fraction, int | Fraction]) -> bool:
    x, y, z = map(Fraction, triple)
    return all(Fraction(a) * x + Fraction(b) * y + Fraction(c) * z == Fraction(d) for a, b, c, d in rows)


class GradeNineSystemsThreeVariablesTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
        cls.html = LESSON.read_text(encoding="utf-8")
        cls.lesson = next(
            lesson
            for unit in cls.manifest["paths"]["common"]["units"]
            for lesson in unit["lessons"]
            if lesson["id"] == "2.3"
        )

    def test_authoritative_manifest_row_is_truthfully_ready(self) -> None:
        self.assertEqual(self.lesson["title"], "Systems in Three Variables")
        self.assertEqual(
            self.lesson["subtopics"],
            ["Elimination in 3x3 systems; organized work; contextual systems."],
        )
        self.assertEqual(
            self.lesson["learningOutcomes"],
            ["Solve accessible 3-variable systems; organize elimination logically; interpret the resulting triple in context."],
        )
        self.assertEqual(self.lesson["deliveryStatus"], "ready")
        self.assertEqual(self.lesson["url"], LESSON_URL)
        self.assertEqual(self.lesson["screenCount"], 64)
        self.assertTrue(LESSON.is_file())
        self.assertIn(f'"url":"{LESSON_URL}"', CATALOG.read_text(encoding="utf-8"))

    def test_approved_depth_pacing_and_boundary(self) -> None:
        for phrase in (
            "Well-structured 3×3 systems",
            "repeated elimination",
            "organized work",
            "contextual systems",
            "ordered triples",
            "prerequisite-mastery",
            "target three class periods, maximum four",
            "Matrices",
            "determinants",
            "Cramer’s rule",
            "pathological parameter cases",
        ):
            self.assertIn(phrase, self.html)

    def test_exactly_20_original_differentiated_items(self) -> None:
        ids = re.findall(r'\{id:"([EMHC]\d+)"', self.html)
        self.assertEqual(len(ids), 20)
        self.assertEqual(len(set(ids)), 20)
        self.assertEqual(
            {level: sum(item.startswith(level) for item in ids) for level in "EMHC"},
            {"E": 4, "M": 6, "H": 6, "C": 4},
        )
        prompts = re.findall(r",prompt:'(.*?)',options:", self.html)
        self.assertEqual(len(prompts), 20)
        self.assertEqual(len(set(prompts)), 20)
        self.assertEqual(self.html.count("solution:'"), 20)

    def test_independently_verified_answer_key(self) -> None:
        expected = {
            "E1": 0, "E2": 3, "E3": 2, "E4": 1,
            "M1": 1, "M2": 0, "M3": 2, "M4": 3, "M5": 1, "M6": 0,
            "H1": 2, "H2": 1, "H3": 3, "H4": 0, "H5": 2, "H6": 3,
            "C1": 0, "C2": 2, "C3": 1, "C4": 3,
        }
        found = {
            item: int(answer)
            for item, answer in re.findall(r'\{id:"([EMHC]\d+)".*?,answer:(\d)', self.html)
        }
        self.assertEqual(found, expected)
        self.assertEqual(sorted(found), sorted(expected))

    def test_representative_systems_and_contexts_are_exact(self) -> None:
        cases = [
            ([(1, 1, 1, 6), (1, -1, 1, 2), (1, 1, -1, 0)], (1, 2, 3)),
            ([(1, 1, 1, 7), (2, -1, 1, 7), (1, 2, -1, 0)], (2, 1, 4)),
            ([(2, 1, -1, 3), (3, -2, 1, 6), (1, 3, 2, 9)], (2, 1, 2)),
            ([(3, 1, 1, 10), (2, -1, 2, 9), (1, 2, -2, -2)], (2, 1, 3)),
            ([(2, -1, 1, 6), (3, 2, -1, 5), (1, 1, 2, 9)], (2, 1, 3)),
            ([(1, 1, 1, 100), (12, 8, 5, 760), (-2, 0, 1, 0)], (20, 40, 40)),
            ([(1, 1, 1, 50), (40, 10, 5, 700), (-2, 0, 1, 0)], (10, 20, 20)),
        ]
        for rows, triple in cases:
            self.assertTrue(satisfies(rows, triple), (rows, triple))
        self.assertTrue(
            satisfies(
                [(Fraction(1, 2), 1, 1, 5), (1, Fraction(-1, 2), 1, 4), (1, 1, -1, 5)],
                (4, 2, 1),
            )
        )

    def test_screen_plan_is_64_meaningful_screens(self) -> None:
        self.assertIn('<meta name="echs-screen-count" content="64">', self.html)
        self.assertIn("const EXPECTED_SCREEN_COUNT=64", self.html)
        self.assertEqual(self.html.count("    add("), 44)
        self.assertEqual(8 + 5 * 6 + 20 + 6, 64)
        for signal in (
            "Learning goals", "Worked example", "Student Turn", "Misconception check",
            "Differentiated practice", "AP-readiness transfer", "Exit ticket", "Mastery evidence",
        ):
            self.assertIn(signal, self.html)

    def test_math_interaction_and_persistence_contracts(self) -> None:
        self.assertIn("katex@0.16.11", self.html)
        self.assertGreaterEqual(self.html.count('class="math" data-tex='), 240)
        tex_values = re.findall(r'data-tex="(.*?)"', self.html)
        unsafe_commands = [
            value for value in tex_values
            if re.search(r'(?<!\\)\\(?:frac|Rightarrow|quad|ne)\b', value)
        ]
        self.assertEqual(unsafe_commands, [], "KaTeX commands inside JavaScript strings need doubled backslashes")
        self.assertIn("localStorage", self.html)
        self.assertIn("exportWork", self.html)
        self.assertIn("ArrowRight", self.html)
        self.assertIn('data-check="', self.html)
        self.assertIn('aria-live="polite"', self.html)

    def test_accessibility_responsive_and_visual_precision(self) -> None:
        for signal in (
            'name="viewport"', "focus-visible", "prefers-reduced-motion:reduce",
            "@media(max-width:520px)", "Skip to lesson content",
            'role="img" aria-labelledby="triple-title-',
            '<title id="triple-title-', '<desc id="triple-desc-',
            "Organized elimination in a three-variable system",
        ):
            self.assertIn(signal, self.html)
        self.assertNotIn(".flow span{", self.html)
        self.assertIn(".flow > span{", self.html)
        lowered = self.html.lower()
        for prohibited in (
            "question-bank/official", "private question", "college board question",
            "credential", "answer token", "pearson", "lorem ipsum",
        ):
            self.assertNotIn(prohibited, lowered)


if __name__ == "__main__":
    unittest.main()
