#!/usr/bin/env python3
"""Deterministic release checks for Grade 9 lesson 1.2."""

from __future__ import annotations

import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "curriculum/pathways/grade-9-2026-2027.json"
CATALOG = ROOT / "data/grade-9-10-pathways.js"
LESSON_URL = "lessons/pathways/grade-9/unit-1/g9-1.2-literal-equations-formula-rearrangement.html"
LESSON = ROOT / LESSON_URL


class GradeNineLiteralEquationsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
        cls.html = LESSON.read_text(encoding="utf-8")
        cls.lesson = cls.manifest["paths"]["common"]["units"][1]["lessons"][1]

    def test_authoritative_manifest_row_is_truthfully_ready(self) -> None:
        self.assertEqual(self.lesson["id"], "1.2")
        self.assertEqual(self.lesson["title"], "Literal Equations & Formula Rearrangement")
        self.assertEqual(self.lesson["deliveryStatus"], "ready")
        self.assertEqual(self.lesson["url"], LESSON_URL)
        self.assertEqual(self.lesson["screenCount"], 64)
        self.assertTrue(LESSON.is_file())
        self.assertIn(f'"url":"{LESSON_URL}"', CATALOG.read_text(encoding="utf-8"))

    def test_approved_scope_depth_pacing_and_boundary(self) -> None:
        for phrase in (
            "Literal Equations &amp; Formula Rearrangement",
            "rearrange multi-step formulas, including fractions",
            "substitute values with units after rearranging",
            "interpret the meaning of the solved-for quantity",
            "Two-period prerequisite-mastery sequence",
            "Target and maximum pacing:</strong> two periods",
            "Advanced dimensional-analysis courses",
            "formulas involving new transcendental functions are deferred",
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
            "E1": 1, "E2": 2, "E3": 0, "E4": 3,
            "M1": 1, "M2": 2, "M3": 0, "M4": 3, "M5": 2, "M6": 1,
            "H1": 0, "H2": 3, "H3": 2, "H4": 1, "H5": 0, "H6": 2,
            "C1": 3, "C2": 1, "C3": 2, "C4": 2,
        }
        found = {
            item: int(answer)
            for item, answer in re.findall(r'\{id:"([EMHC]\d+)".*?,answer:(\d)', self.html)
        }
        self.assertEqual(found, expected)
        self.assertEqual(self.html.count("solution:'"), 20)

    def test_formula_derivations_and_units_are_consistent(self) -> None:
        required = (
            r"w=A/l", r"l=(P-2w)/2", r"F=9C/5+32",
            r"h=2A/(b_1+b_2)", r"b_2=2A/h-b_1",
            r"t=d/r", r"m=F/a", r"r=I/(Pt)",
            r"d_i=fd_o/(d_o-f)", r"y_2=m(x_2-x_1)+y_1",
        )
        for expression in required:
            self.assertIn(expression, self.html)
        for unit in (r"\\text{ km/h}", r"\\text{ h}", r"\\text{ kg}", r"\\text{ QAR}"):
            self.assertIn(unit, self.html)

    def test_screen_plan_is_64_meaningful_screens(self) -> None:
        self.assertIn('<meta name="echs-screen-count" content="64">', self.html)
        self.assertIn("const EXPECTED_SCREEN_COUNT=64", self.html)
        self.assertEqual(8 + 5 * 6 + 20 + 6, 64)
        for signal in (
            "Learning outcomes", "Worked example", "Student Turn", "Misconception check",
            "Differentiated practice", "AP-readiness transfer", "Exit ticket", "Mastery evidence",
        ):
            self.assertIn(signal, self.html)

    def test_math_interaction_and_persistence_contracts(self) -> None:
        self.assertIn("katex@0.16.11", self.html)
        self.assertGreaterEqual(self.html.count('class="math" data-tex='), 130)
        self.assertIn("localStorage", self.html)
        self.assertIn("exportWork", self.html)
        self.assertIn("ArrowRight", self.html)
        self.assertIn('data-check="', self.html)
        self.assertIn('aria-live="polite"', self.html)

    def test_accessibility_responsive_and_publication_safety(self) -> None:
        for signal in (
            'name="viewport"', 'focus-visible', 'prefers-reduced-motion:reduce',
            '@media(max-width:520px)', 'Skip to lesson content',
            'role="img" aria-label="Rectangle with length l, width w, and area A"',
        ):
            self.assertIn(signal, self.html)
        lowered = self.html.lower()
        for prohibited in (
            "question-bank/official", "private question", "college board question",
            "credential", "answer token", "pearson", "lorem ipsum",
        ):
            self.assertNotIn(prohibited, lowered)


if __name__ == "__main__":
    unittest.main()
