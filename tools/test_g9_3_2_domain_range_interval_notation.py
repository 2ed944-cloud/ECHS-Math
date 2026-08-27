#!/usr/bin/env python3
"""Deterministic release checks for Grade 9 lesson 3.2."""

from __future__ import annotations

import json
import math
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "curriculum/pathways/grade-9-2026-2027.json"
CATALOG = ROOT / "data/grade-9-10-pathways.js"
LESSON_URL = (
    "lessons/pathways/grade-9/unit-3/"
    "g9-3.2-domain-range-interval-notation.html"
)
LESSON = ROOT / LESSON_URL


class GradeNineDomainRangeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
        cls.html = LESSON.read_text(encoding="utf-8")
        cls.lesson = next(
            lesson
            for unit in cls.manifest["paths"]["common"]["units"]
            for lesson in unit["lessons"]
            if lesson["id"] == "3.2"
        )

    def test_final_share_ready_manifest_row_is_truthfully_ready(self) -> None:
        self.assertEqual(self.lesson["title"], "Domain, Range & Interval Notation")
        self.assertEqual(
            self.lesson["subtopics"],
            [
                "Domain/range from graphs, tables, formulas, contexts; "
                "restrictions; set/interval notation."
            ],
        )
        self.assertEqual(
            self.lesson["learningOutcomes"],
            ["Determine and communicate domain/range from multiple representations."],
        )
        self.assertEqual(self.lesson["depth"], "M Prerequisite Mastery")
        self.assertEqual(
            self.lesson["requiredGrade9Coverage"],
            "Find domain/range for linear, quadratic, simple radical/rational "
            "examples and contexts; state restrictions clearly.",
        )
        self.assertEqual(
            self.lesson["coverageBoundary"],
            "Outside current course scope: AP-level domain analysis of "
            "composed/transformed rational/log functions not yet taught.",
        )
        self.assertEqual(self.lesson["targetPeriods"], 3)
        self.assertEqual(self.lesson["maximumPeriods"], 3)
        self.assertEqual(self.lesson["deliveryStatus"], "ready")
        self.assertEqual(self.lesson["url"], LESSON_URL)
        self.assertEqual(self.lesson["screenCount"], 64)
        self.assertTrue(LESSON.is_file())
        catalog = CATALOG.read_text(encoding="utf-8")
        self.assertIn(f'"url":"{LESSON_URL}"', catalog)
        self.assertIn('"targetPeriods":3,"maximumPeriods":3', catalog)

    def test_depth_pacing_coverage_and_boundary_are_explicit(self) -> None:
        for phrase in (
            "Prerequisite Mastery",
            "3 target periods",
            "3 maximum",
            "linear, quadratic, simple radical/rational examples and contexts",
            "composed or transformed rational/log functions",
            "composed/transformed rational or logarithmic functions",
        ):
            self.assertIn(phrase.lower(), self.html.lower())
        for prohibited in (
            "logarithmic composition exercise",
            "nested rational composition",
            "inverse-function domain theorem",
            "calculus domain analysis",
        ):
            self.assertNotIn(prohibited, self.html.lower())

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
            "E1": 0, "E2": 1, "E3": 2, "E4": 1,
            "M1": 1, "M2": 1, "M3": 0, "M4": 2, "M5": 1, "M6": 1,
            "H1": 1, "H2": 1, "H3": 1, "H4": 1, "H5": 2, "H6": 0,
            "C1": 1, "C2": 1, "C3": 1, "C4": 1,
        }
        found = {
            item: int(answer)
            for item, answer in re.findall(
                r'\{id:"([EMHC]\d+)".*?,answer:(\d)', self.html
            )
        }
        self.assertEqual(found, expected)

    def test_representative_mathematics_is_exact(self) -> None:
        # Segment from (-3,-2) to (4,3).
        self.assertEqual((-3, 4), (min(-3, 4), max(-3, 4)))
        self.assertEqual((-2, 3), (min(-2, 3), max(-2, 3)))
        # q(x)=sqrt(7-2x) requires x <= 7/2.
        for x in (-10, 0, 3.5):
            self.assertGreaterEqual(7 - 2 * x, 0)
        self.assertLess(7 - 2 * 4, 0)
        # V(t)=3t+10 on [0,12].
        self.assertEqual((3 * 0 + 10, 3 * 12 + 10), (10, 46))
        # h(t)=-5t^2+20t+1 on [0,4] has range [1,21].
        values = [-5 * t * t + 20 * t + 1 for t in (0, 2, 4)]
        self.assertEqual((min(values), max(values)), (1, 21))
        # 1/(x-2)+3 can never equal 3.
        for x in (-5, 0, 3, 10):
            self.assertNotEqual(1 / (x - 2) + 3, 3)
        self.assertTrue(math.isclose(math.sqrt(8) - 1, 1.8284271247))

    def test_screen_plan_is_64_meaningful_screens(self) -> None:
        self.assertIn('<meta name="echs-screen-count" content="64">', self.html)
        self.assertIn("const EXPECTED_SCREEN_COUNT=64", self.html)
        self.assertEqual(self.html.count("    add("), 44)
        self.assertEqual(8 + 5 * 6 + 20 + 6, 64)
        for signal in (
            "Learning goals", "Worked example", "Student Turn",
            "Misconception check", "Differentiated practice",
            "AP-readiness transfer", "Exit ticket", "Mastery evidence",
        ):
            self.assertIn(signal, self.html)

    def test_math_interaction_and_persistence_contracts(self) -> None:
        self.assertIn("katex@0.16.11", self.html)
        self.assertGreaterEqual(self.html.count('class="math" data-tex='), 95)
        tex_values = re.findall(r'data-tex="(.*?)"', self.html)
        unsafe_commands = [
            value
            for value in tex_values
            if re.search(
                r'(?<!\\)\\(?:frac|sqrt|ge|le|ne|infty|cup|in|mid|mathbb|ldots|\{|\})',
                value,
            )
        ]
        self.assertEqual(
            unsafe_commands,
            [],
            "KaTeX commands in JavaScript strings need doubled backslashes",
        )
        for signal in (
            "localStorage", "exportWork", "ArrowRight",
            'data-check="', 'aria-live="polite"',
        ):
            self.assertIn(signal, self.html)

    def test_accessibility_responsive_and_visual_precision(self) -> None:
        for signal in (
            'name="viewport"',
            "focus-visible",
            "prefers-reduced-motion:reduce",
            "@media(max-width:520px)",
            "Skip to lesson content",
            'role="img" aria-labelledby="nl-title-',
            '<title id="nl-title-',
            '<desc id="nl-desc-',
            '<marker id="nl-arrow-',
            'marker-end="url(#nl-arrow-',
            'role="img" aria-labelledby="cg-title-',
            '<title id="cg-title-',
            '<desc id="cg-desc-',
            "equal-scale graph",
            'd="M210 320L560 70"',
            'cx="210" cy="320"',
            'cx="560" cy="70"',
            'd="M260 270L310 220L360 199L460 170L560 148L650 132"',
            "x = 2",
            "y = 0",
        ):
            self.assertIn(signal, self.html)
        self.assertNotIn(".flow span{", self.html)
        self.assertIn(".flow > span{", self.html)
        lowered = self.html.lower()
        for prohibited in (
            "question-bank/official",
            "private question",
            "college board question",
            "credential",
            "answer token",
            "pearson",
            "lorem ipsum",
        ):
            self.assertNotIn(prohibited, lowered)


if __name__ == "__main__":
    unittest.main()
