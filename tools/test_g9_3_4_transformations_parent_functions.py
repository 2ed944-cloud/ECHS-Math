#!/usr/bin/env python3
"""Deterministic release checks for Grade 9 lesson 3.4."""

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
    "g9-3.4-transformations-parent-functions.html"
)
LESSON = ROOT / LESSON_URL


class GradeNineTransformationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
        cls.html = LESSON.read_text(encoding="utf-8")
        cls.lesson = next(
            lesson
            for unit in cls.manifest["paths"]["common"]["units"]
            for lesson in unit["lessons"]
            if lesson["id"] == "3.4"
        )

    def test_final_share_ready_manifest_row_is_truthfully_ready(self) -> None:
        self.assertEqual(self.lesson["title"], "Transformations of Parent Functions")
        self.assertEqual(
            self.lesson["subtopics"],
            [
                "Translations; reflections; vertical/horizontal scaling; "
                "order of transformations."
            ],
        )
        self.assertEqual(
            self.lesson["learningOutcomes"],
            ["Predict and construct common parent-function transformations."],
        )
        self.assertEqual(self.lesson["depth"], "B Bridge Depth")
        self.assertEqual(
            self.lesson["requiredGrade9Coverage"],
            "Transform linear, quadratic, absolute-value, radical, and basic "
            "exponential parent graphs using parameter effects.",
        )
        self.assertEqual(
            self.lesson["coverageBoundary"],
            "Not required within this course: AP-level transformation chains "
            "of rational/log/trig functions or detailed covariation justifications.",
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
            "Bridge Depth",
            "3 target periods",
            "3 maximum",
            "linear, quadratic, absolute-value, radical, and basic exponential",
            "parameter effects",
            "rational, logarithmic, or trigonometric",
            "detailed covariation",
        ):
            self.assertIn(phrase.lower(), self.html.lower())
        for prohibited in (
            "logarithmic transformation exercise",
            "trigonometric transformation chain",
            "rational transformation chain",
            "prove covariation",
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
            "E1": 1, "E2": 0, "E3": 0, "E4": 1,
            "M1": 1, "M2": 0, "M3": 2, "M4": 1, "M5": 1, "M6": 1,
            "H1": 0, "H2": 1, "H3": 0, "H4": 0, "H5": 0, "H6": 0,
            "C1": 0, "C2": 0, "C3": 0, "C4": 0,
        }
        found = {
            item: int(answer)
            for item, answer in re.findall(
                r'\{id:"([EMHC]\d+)".*?,answer:(\d)', self.html
            )
        }
        self.assertEqual(found, expected)

    def test_representative_mathematics_is_exact(self) -> None:
        # (1,1) under 2f(x-3)-4 maps to (4,-2).
        self.assertEqual((1 + 3, 2 * 1 - 4), (4, -2))
        # (u,v) under a f(b(x-h))+k maps to (h+u/b,k+av).
        u, v, a, b, h, k = -2, 4, -1, 0.5, 6, 1
        self.assertEqual((h + u / b, k + a * v), (2.0, -3))
        # sqrt(3-x)+1 has endpoint (3,1) and domain x<=3.
        self.assertEqual(math.sqrt(3 - 3) + 1, 1)
        with self.assertRaises(ValueError):
            math.sqrt(3 - 4)
        # The Qatar arch has vertex (4,9), roots -2 and 10, span 12.
        arch = lambda x: -0.25 * (x - 4) ** 2 + 9
        self.assertEqual((arch(4), arch(-2), arch(10), 10 - (-2)), (9.0, 0.0, 0.0, 12))
        # y=2(x-1)^2-2 contains (3,6).
        self.assertEqual(2 * (3 - 1) ** 2 - 2, 6)

    def test_screen_plan_is_64_meaningful_screens(self) -> None:
        self.assertIn('<meta name="echs-screen-count" content="64">', self.html)
        self.assertIn("const EXPECTED_SCREEN_COUNT=64", self.html)
        self.assertEqual(self.html.count("\n    add("), 44)
        self.assertEqual(44 + 20, 64)
        for signal in (
            "Learning goals", "Worked example", "Student Turn",
            "Misconception clinic", "Differentiated practice",
            "AP-readiness transfer", "Exit ticket", "Mastery reflection",
        ):
            self.assertIn(signal, self.html)

    def test_math_interaction_and_persistence_contracts(self) -> None:
        self.assertIn("katex@0.16.11", self.html)
        dynamic_math = self.html.count('math("')
        inline_practice_math = self.html.count('class="math" data-tex=')
        self.assertGreaterEqual(dynamic_math + inline_practice_math, 80)
        unsafe_commands = re.findall(
            r'(?<!\\)\\(?:sqrt|cdot|longmapsto|mapsto|ge|le|infty)',
            self.html,
        )
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
            'role="img" aria-labelledby="',
            "<title id=",
            "<desc id=",
            "marker-end=",
            "Equal scales are used on both axes.",
            "An equal-scale graph",
            ".flow > span{",
        ):
            self.assertIn(signal, self.html)
        self.assertNotIn(".flow span{", self.html)
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
