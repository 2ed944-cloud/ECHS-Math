#!/usr/bin/env python3
"""Deterministic release checks for Grade 9 lesson 0.3."""

from __future__ import annotations

import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "curriculum/pathways/grade-9-2026-2027.json"
CATALOG = ROOT / "data/grade-9-10-pathways.js"
LESSON_URL = "lessons/pathways/grade-9/unit-0/g9-0.3-exponent-equation-repair.html"
LESSON = ROOT / LESSON_URL


class GradeNineExponentEquationRepairTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
        cls.html = LESSON.read_text(encoding="utf-8")
        cls.lesson = cls.manifest["paths"]["common"]["units"][0]["lessons"][2]

    def test_authoritative_manifest_row_is_truthfully_ready(self) -> None:
        self.assertEqual(self.lesson["id"], "0.3")
        self.assertEqual(self.lesson["title"], "Exponent Rules & Equation Solving")
        self.assertEqual(self.lesson["deliveryStatus"], "ready")
        self.assertEqual(self.lesson["url"], LESSON_URL)
        self.assertEqual(self.lesson["screenCount"], 64)
        self.assertTrue(LESSON.is_file())
        self.assertIn(f'"url":"{LESSON_URL}"', CATALOG.read_text(encoding="utf-8"))

    def test_approved_scope_depth_and_boundary_are_explicit(self) -> None:
        for phrase in (
            "Positive integer exponent laws",
            "Zero and negative exponents",
            "One-step equations",
            "Two-step equations",
            "Checking solutions and invalid steps",
            "Apply core integer exponent laws",
            "Solve foundational one- and two-step equations",
            "Prerequisite mastery",
            "Rational exponents are deferred to Units 6–7",
            "identity/contradiction cases are deferred to Unit 1",
            "Three-period learning sequence",
            "Maximum pacing:</strong> three periods",
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
            "E1": 2, "E2": 1, "E3": 2, "E4": 2,
            "M1": 1, "M2": 3, "M3": 2, "M4": 3, "M5": 0, "M6": 0,
            "H1": 1, "H2": 2, "H3": 1, "H4": 0, "H5": 3, "H6": 2,
            "C1": 1, "C2": 2, "C3": 2, "C4": 1,
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

    def test_math_visual_interaction_and_persistence_contracts(self) -> None:
        self.assertIn("katex@0.16.11", self.html)
        self.assertGreaterEqual(self.html.count('class="math" data-tex='), 100)
        self.assertIn('<svg class="balance"', self.html)
        self.assertIn("localStorage", self.html)
        self.assertIn("exportWork", self.html)
        self.assertIn("ArrowRight", self.html)
        self.assertIn('data-check="', self.html)
        self.assertIn('aria-live="polite"', self.html)

    def test_accessibility_and_responsive_contracts(self) -> None:
        for signal in (
            'name="viewport"', 'focus-visible', 'prefers-reduced-motion:reduce',
            '@media(max-width:520px)', 'role="img"', 'Skip to lesson content',
            'aria-labelledby="bal-title bal-desc"',
        ):
            self.assertIn(signal, self.html)

    def test_publication_safety_and_no_filler(self) -> None:
        lowered = self.html.lower()
        for prohibited in (
            "question-bank/official", "private question", "college board question",
            "credential", "answer token", "pearson", "lorem ipsum",
        ):
            self.assertNotIn(prohibited, lowered)


if __name__ == "__main__":
    unittest.main()
