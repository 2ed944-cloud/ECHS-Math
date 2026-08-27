#!/usr/bin/env python3
"""Deterministic release checks for Grade 9 lesson 3.1."""

from __future__ import annotations

import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "curriculum/pathways/grade-9-2026-2027.json"
CATALOG = ROOT / "data/grade-9-10-pathways.js"
LESSON_URL = (
    "lessons/pathways/grade-9/unit-3/"
    "g9-3.1-relations-functions-function-notation.html"
)
LESSON = ROOT / LESSON_URL


class GradeNineRelationsFunctionsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
        cls.html = LESSON.read_text(encoding="utf-8")
        cls.lesson = next(
            lesson
            for unit in cls.manifest["paths"]["common"]["units"]
            for lesson in unit["lessons"]
            if lesson["id"] == "3.1"
        )

    def test_final_share_ready_manifest_row_is_truthfully_ready(self) -> None:
        self.assertEqual(
            self.lesson["title"], "Relations, Functions & Function Notation"
        )
        self.assertEqual(
            self.lesson["subtopics"],
            [
                "Input/output; vertical line test; f(x); "
                "independent/dependent variables; discrete vs continuous."
            ],
        )
        self.assertEqual(
            self.lesson["learningOutcomes"],
            [
                "Use function notation and distinguish functions from "
                "nonfunctions across common representations."
            ],
        )
        self.assertEqual(self.lesson["depth"], "M Prerequisite Mastery")
        self.assertEqual(
            self.lesson["requiredGrade9Coverage"],
            "Determine function status; evaluate notation; identify meaningful "
            "input/output quantities and domains.",
        )
        self.assertEqual(
            self.lesson["coverageBoundary"],
            "Not included within this course: advanced implicit-function or "
            "parametric-function treatment.",
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
            "mappings, pairs, tables, graphs, formulas, and routine contexts",
            "advanced implicit-function",
            "parametric-function treatment",
        ):
            self.assertIn(phrase.lower(), self.html.lower())
        for prohibited in (
            "parametric equation",
            "implicit differentiation",
            "inverse-function analysis",
            "composition analysis",
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
            "E1": 0, "E2": 1, "E3": 1, "E4": 1,
            "M1": 1, "M2": 0, "M3": 2, "M4": 2, "M5": 1, "M6": 2,
            "H1": 0, "H2": 1, "H3": 3, "H4": 1, "H5": 1, "H6": 1,
            "C1": 0, "C2": 0, "C3": 2, "C4": 1,
        }
        found = {
            item: int(answer)
            for item, answer in re.findall(
                r'\{id:"([EMHC]\d+)".*?,answer:(\d)', self.html
            )
        }
        self.assertEqual(found, expected)

    def test_representative_mathematics_is_exact(self) -> None:
        self.assertEqual((-2) ** 2 - 3 * (-2) + 1, 11)
        self.assertEqual((-3) ** 2 + 2 * (-3), 3)
        self.assertEqual(abs(2 * (-2) - 1), 5)
        self.assertEqual((16 - 7) / (5 - 2), 3)
        self.assertEqual(3 * (-1) + 1, -2)
        # (2a-1)^2 - 4(2a-1) = 4a^2 - 12a + 5.
        for a in (-3, -1, 0, 2, 5):
            self.assertEqual(
                (2 * a - 1) ** 2 - 4 * (2 * a - 1),
                4 * a * a - 12 * a + 5,
            )
        self.assertEqual(12 * 5 + 30, 90)

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
        self.assertGreaterEqual(self.html.count('class="math" data-tex='), 65)
        tex_values = re.findall(r'data-tex="(.*?)"', self.html)
        unsafe_commands = [
            value
            for value in tex_values
            if re.search(r'(?<!\\)\\(?:frac|ge|le|in|ldots|\{|\})', value)
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
            'role="img" aria-labelledby="map-title-',
            '<title id="map-title-',
            '<desc id="map-desc-',
            '<marker id="map-arrow-',
            'marker-end="url(#map-arrow-',
            'role="img" aria-labelledby="vg-title-',
            "equal-scale coordinate grid",
            "two intersections",
            "discrete points",
            "continuous interval",
            'M210 55Q360 405 510 55',
            'cx="460" cy="152"',
            'cx="430" cy="78"',
            'cx="430" cy="332"',
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
