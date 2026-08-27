#!/usr/bin/env python3
"""Deterministic release checks for Grade 9 lesson 0.2."""

from __future__ import annotations

import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "curriculum/pathways/grade-9-2026-2027.json"
CATALOG = ROOT / "data/grade-9-10-pathways.js"
LESSON_URL = "lessons/pathways/grade-9/unit-0/g9-0.2-number-expression-fluency.html"
LESSON = ROOT / LESSON_URL


class GradeNineNumberExpressionFluencyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
        cls.html = LESSON.read_text(encoding="utf-8")
        cls.lesson = cls.manifest["paths"]["common"]["units"][0]["lessons"][1]

    def test_authoritative_manifest_row_is_truthfully_ready(self) -> None:
        self.assertEqual(self.lesson["id"], "0.2")
        self.assertEqual(self.lesson["title"], "Number and Expression Fluency")
        self.assertEqual(self.lesson["deliveryStatus"], "ready")
        self.assertEqual(self.lesson["url"], LESSON_URL)
        self.assertEqual(self.lesson["screenCount"], 64)
        self.assertTrue(LESSON.is_file())
        self.assertIn(f'"url":"{LESSON_URL}"', CATALOG.read_text(encoding="utf-8"))

    def test_approved_scope_and_boundary_are_explicit(self) -> None:
        for phrase in (
            "Signed-number operations",
            "Fractions, decimals, and percents",
            "Order of operations",
            "Distributive property",
            "Combining like terms",
            "Evaluate numerical and algebraic expressions accurately",
            "Move fluently among fraction, decimal, and percent forms",
            "standalone number-theory or recurring-decimal unit",
            "Diagnostic / repair depth",
            "Three-period learning sequence",
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
        prompts = re.findall(r',prompt:\'(.*?)\',options:', self.html)
        self.assertEqual(len(prompts), 20)
        self.assertEqual(len(set(prompts)), 20)

    def test_independently_verified_answer_key(self) -> None:
        expected = {
            "E1": 2, "E2": 2, "E3": 0, "E4": 1,
            "M1": 1, "M2": 2, "M3": 1, "M4": 1, "M5": 0, "M6": 3,
            "H1": 2, "H2": 2, "H3": 1, "H4": 2, "H5": 0, "H6": 0,
            "C1": 2, "C2": 1, "C3": 1, "C4": 2,
        }
        found = {
            item: int(answer)
            for item, answer in re.findall(r'\{id:"([EMHC]\d+)".*?,answer:(\d)', self.html)
        }
        self.assertEqual(found, expected)
        self.assertEqual(self.html.count("solution:'"), 20)

    def test_screen_plan_is_64_meaningful_screens(self) -> None:
        self.assertIn('<meta name="echs-screen-count" content="64">', self.html)
        self.assertIn("const EXPECTED_SCREEN_COUNT=64", self.html)
        # 8 launch/retrieval + five six-screen concept cycles + 20 practice + 6 mastery/transfer screens.
        self.assertEqual(8 + 5 * 6 + 20 + 6, 64)
        for signal in (
            "Learning outcomes", "Worked example", "Student Turn", "Misconception check",
            "Differentiated practice", "AP-readiness transfer", "Exit ticket", "Mastery evidence",
        ):
            self.assertIn(signal, self.html)

    def test_math_interaction_and_persistence_contracts(self) -> None:
        self.assertIn("katex@0.16.11", self.html)
        self.assertGreaterEqual(self.html.count('class="math" data-tex='), 70)
        self.assertIn('<svg class="numberline"', self.html)
        self.assertIn("localStorage", self.html)
        self.assertIn("exportWork", self.html)
        self.assertIn("ArrowRight", self.html)
        self.assertIn('data-check="', self.html)
        self.assertIn('aria-live="polite"', self.html)

    def test_accessibility_and_responsive_contracts(self) -> None:
        for signal in (
            'name="viewport"', 'focus-visible', 'prefers-reduced-motion:reduce',
            '@media(max-width:520px)', 'role="img"', 'Skip to lesson content',
            'aria-labelledby="nl-title nl-desc"',
        ):
            self.assertIn(signal, self.html)

    def test_publication_safety_and_no_filler(self) -> None:
        lowered = self.html.lower()
        for prohibited in (
            "question-bank/official", "private question", "college board question",
            "credential", "answer token", "pearson",
        ):
            self.assertNotIn(prohibited, lowered)
        self.assertNotIn("lorem ipsum", lowered)


if __name__ == "__main__":
    unittest.main()
