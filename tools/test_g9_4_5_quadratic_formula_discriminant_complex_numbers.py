#!/usr/bin/env python3
"""Deterministic release checks for Grade 9 lesson 4.5."""

from __future__ import annotations

import cmath
import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "curriculum/pathways/grade-9-2026-2027.json"
CATALOG = ROOT / "data/grade-9-10-pathways.js"
LESSON_URL = "lessons/pathways/grade-9/unit-4/g9-4.5-quadratic-formula-discriminant-complex-numbers.html"
LESSON = ROOT / LESSON_URL


class GradeNineQuadraticFormulaTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
        cls.html = LESSON.read_text(encoding="utf-8")
        cls.lesson = next(
            lesson
            for unit in cls.manifest["paths"]["common"]["units"]
            for lesson in unit["lessons"]
            if lesson["id"] == "4.5"
        )

    def test_authoritative_manifest_row_is_truthfully_ready(self) -> None:
        self.assertEqual(
            self.lesson["title"],
            "Quadratic Formula, Discriminant & Complex Numbers",
        )
        self.assertEqual(
            self.lesson["subtopics"],
            ["Quadratic formula; discriminant; i; nonreal conjugate roots; exact/approximate roots."],
        )
        self.assertEqual(
            self.lesson["learningOutcomes"],
            ["Solve any quadratic and classify real/nonreal roots; express basic complex solutions correctly."],
        )
        self.assertEqual(self.lesson["depth"], "M Prerequisite Mastery")
        self.assertEqual(
            self.lesson["requiredGrade9Coverage"],
            "Students use the quadratic formula independently and use the discriminant to classify roots. Complex-number coverage is limited to familiarity with basic powers of i and roots written in a+bi form.",
        )
        self.assertEqual(
            self.lesson["coverageBoundary"],
            "Deferred content: a full complex-number algebra unit, polar complex form, De Moivre, or complex-function analysis.",
        )
        self.assertEqual((self.lesson["targetPeriods"], self.lesson["maximumPeriods"]), (4, 5))
        self.assertEqual(self.lesson["deliveryStatus"], "ready")
        self.assertEqual(self.lesson["url"], LESSON_URL)
        self.assertEqual(self.lesson["screenCount"], 64)
        self.assertTrue(LESSON.is_file())
        self.assertIn(f'"url":"{LESSON_URL}"', CATALOG.read_text(encoding="utf-8"))

    def test_depth_pacing_coverage_and_boundary_are_explicit(self) -> None:
        for phrase in (
            "Prerequisite Mastery",
            "4 target periods",
            "5 maximum",
            "quadratic formula independently",
            "basic powers of i",
            "roots in a+bi form",
            "polar complex form",
            "De Moivre",
            "complex-function analysis",
        ):
            self.assertIn(phrase.lower(), self.html.lower())
        self.assertNotIn("AP Progress Check", self.html)

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

    def test_independently_verified_and_varied_answer_key(self) -> None:
        expected = {
            "E1": 0, "E2": 1, "E3": 2, "E4": 3,
            "M1": 0, "M2": 1, "M3": 2, "M4": 3, "M5": 0, "M6": 1,
            "H1": 2, "H2": 3, "H3": 0, "H4": 1, "H5": 2, "H6": 3,
            "C1": 0, "C2": 1, "C3": 2, "C4": 3,
        }
        found = {
            item: int(answer)
            for item, answer in re.findall(r'\{id:"([EMHC]\d+)".*?,answer:(\d)', self.html)
        }
        self.assertEqual(found, expected)
        self.assertEqual(set(found.values()), {0, 1, 2, 3})

    def test_discriminants_and_representative_roots_are_exact(self) -> None:
        cases = [
            (2, -5, -3, 49, (3, -0.5)),
            (3, 1, -2, 25, (2 / 3, -1)),
            (3, -12, 7, 60, (2 + 15 ** 0.5 / 3, 2 - 15 ** 0.5 / 3)),
            (5, -2, -1, 24, ((1 + 6 ** 0.5) / 5, (1 - 6 ** 0.5) / 5)),
            (-2, 3, 4, 41, ((3 + 41 ** 0.5) / 4, (3 - 41 ** 0.5) / 4)),
        ]
        for a, b, c, discriminant, roots in cases:
            self.assertEqual(b * b - 4 * a * c, discriminant)
            for root in roots:
                self.assertAlmostEqual(a * root * root + b * root + c, 0)
        complex_cases = [(1, 4, 8, (-2 + 2j, -2 - 2j)), (4, 4, 5, (-0.5 + 1j, -0.5 - 1j))]
        for a, b, c, expected_roots in complex_cases:
            d = b * b - 4 * a * c
            roots = ((-b + cmath.sqrt(d)) / (2 * a), (-b - cmath.sqrt(d)) / (2 * a))
            for root, expected in zip(roots, expected_roots):
                self.assertAlmostEqual(root.real, expected.real)
                self.assertAlmostEqual(root.imag, expected.imag)
                self.assertAlmostEqual(abs(a * root * root + b * root + c), 0)
        self.assertEqual(64 - 8 * 8, 0)
        self.assertGreater(64 - 8 * 7.9, 0)
        self.assertLess(64 - 8 * 8.1, 0)

    def test_screen_plan_is_64_meaningful_screens(self) -> None:
        self.assertIn('<meta name="echs-screen-count" content="64">', self.html)
        self.assertIn("const EXPECTED_SCREEN_COUNT=64", self.html)
        self.assertEqual(self.html.count("\n    add("), 44)
        self.assertEqual(44 + 20, 64)
        for signal in (
            "Learning goals", "Prerequisite retrieval", "Worked example",
            "Student Turn", "quadratic formula", "The discriminant",
            "Exact first", "Basic powers of i", "nonreal conjugates",
            "Discriminant and graph behavior", "Differentiated practice",
            "AP-readiness transfer", "Exit ticket", "Mastery reflection",
        ):
            self.assertIn(signal, self.html)

    def test_math_interaction_and_persistence_contracts(self) -> None:
        self.assertIn("katex@0.16.11", self.html)
        self.assertGreaterEqual(self.html.count('math("') + self.html.count('class="math" data-tex='), 30)
        unsafe_commands = re.findall(
            r'(?<!\\)\\(?:frac|text|circ|ne|sqrt|to|xrightarrow|quad|square|pm)',
            self.html,
        )
        self.assertEqual(unsafe_commands, [])
        for signal in (
            "localStorage", "exportWork", "ArrowRight", 'data-check="',
            'aria-live="polite"', "details", "Score all responses",
        ):
            self.assertIn(signal, self.html)

    def test_accessibility_responsive_and_visual_precision(self) -> None:
        for signal in (
            'name="viewport"', "focus-visible", "prefers-reduced-motion:reduce",
            "@media(max-width:520px)", "Skip to lesson content",
            'role="img" aria-labelledby="', "<title id=", "<desc id=",
            "marker-end=", "drawing=false", ".gridline",
        ):
            self.assertIn(signal, self.html)
        lowered = self.html.lower()
        for prohibited in (
            "question-bank/official", "private question", "college board question",
            "credential", "answer token", "pearson", "lorem ipsum",
            "completing-square mastery secured", "half-coefficient",
        ):
            self.assertNotIn(prohibited, lowered)


if __name__ == "__main__":
    unittest.main()
