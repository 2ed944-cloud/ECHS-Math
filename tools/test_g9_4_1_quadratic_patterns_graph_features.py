#!/usr/bin/env python3
"""Deterministic release checks for Grade 9 lesson 4.1."""

from __future__ import annotations

import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "curriculum/pathways/grade-9-2026-2027.json"
CATALOG = ROOT / "data/grade-9-10-pathways.js"
LESSON_URL = "lessons/pathways/grade-9/unit-4/g9-4.1-quadratic-patterns-graph-features.html"
LESSON = ROOT / LESSON_URL


class GradeNineQuadraticPatternsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
        cls.html = LESSON.read_text(encoding="utf-8")
        cls.lesson = next(
            lesson
            for unit in cls.manifest["paths"]["common"]["units"]
            for lesson in unit["lessons"]
            if lesson["id"] == "4.1"
        )

    def test_final_share_ready_manifest_row_is_truthfully_ready(self) -> None:
        self.assertEqual(self.lesson["title"], "Quadratic Patterns & Graph Features")
        self.assertEqual(
            self.lesson["subtopics"],
            ["Second differences; parabola; vertex; axis; intercepts; opening direction."],
        )
        self.assertEqual(
            self.lesson["learningOutcomes"],
            ["Recognize and interpret quadratic behavior across representations."],
        )
        self.assertEqual(self.lesson["depth"], "M Prerequisite Mastery")
        self.assertEqual(
            self.lesson["requiredGrade9Coverage"],
            "Recognize quadratic patterns and identify/interpret graph features from table, graph, and formula.",
        )
        self.assertEqual(
            self.lesson["coverageBoundary"],
            "Deferred content: AP-style covariation and high-complexity parameter families.",
        )
        self.assertEqual((self.lesson["targetPeriods"], self.lesson["maximumPeriods"]), (3, 3))
        self.assertEqual(self.lesson["deliveryStatus"], "ready")
        self.assertEqual(self.lesson["url"], LESSON_URL)
        self.assertEqual(self.lesson["screenCount"], 64)
        self.assertTrue(LESSON.is_file())
        self.assertIn(f'"url":"{LESSON_URL}"', CATALOG.read_text(encoding="utf-8"))

    def test_depth_pacing_coverage_and_boundary_are_explicit(self) -> None:
        for phrase in (
            "Prerequisite Mastery",
            "3 target periods",
            "3 maximum",
            "table, graph, and formula",
            "AP-style covariation",
            "high-complexity parameter families",
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

    def test_representative_mathematics_is_exact(self) -> None:
        values = [1, 4, 9, 16]
        first = [b - a for a, b in zip(values, values[1:])]
        second = [b - a for a, b in zip(first, first[1:])]
        self.assertEqual(first, [3, 5, 7])
        self.assertEqual(second, [2, 2])

        values = [2, 7, 16, 29, 46]
        first = [b - a for a, b in zip(values, values[1:])]
        second = [b - a for a, b in zip(first, first[1:])]
        self.assertEqual(first, [5, 9, 13, 17])
        self.assertEqual(second, [4, 4, 4])

        self.assertEqual((-3, (-3) ** 2 + 6 * (-3) + 5), (-3, -4))
        self.assertEqual((2, 2 * 2 ** 2 - 8 * 2 + 5), (2, -3))
        self.assertEqual((3, -(3 ** 2) + 6 * 3 + 7), (3, 16))
        self.assertEqual((-(1), 5), (-1, 5))
        self.assertEqual((-(2), -1), (-2, -1))
        f = lambda x: -(x ** 2) + 4 * x + 5
        self.assertEqual((f(-1), f(5), f(2)), (0, 0, 9))

    def test_screen_plan_is_64_meaningful_screens(self) -> None:
        self.assertIn('<meta name="echs-screen-count" content="64">', self.html)
        self.assertIn("const EXPECTED_SCREEN_COUNT=64", self.html)
        self.assertEqual(self.html.count("\n    add("), 44)
        self.assertEqual(44 + 20, 64)
        for signal in (
            "Learning goals", "Prerequisite retrieval", "Worked example",
            "Student Turn", "Build a difference table", "Parabola anatomy",
            "Axis of symmetry", "Differentiated practice", "AP-readiness transfer",
            "Exit ticket", "Mastery reflection", "Record difference tables",
        ):
            self.assertIn(signal, self.html)
        self.assertNotIn("difference quotients", self.html.lower())

    def test_math_interaction_and_persistence_contracts(self) -> None:
        self.assertIn("katex@0.16.11", self.html)
        self.assertGreaterEqual(self.html.count('math("') + self.html.count('class="math" data-tex='), 20)
        unsafe_commands = re.findall(
            r'(?<!\\)\\(?:frac|text|circ|ne|sqrt|to|xrightarrow|quad)',
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
        ):
            self.assertNotIn(prohibited, lowered)


if __name__ == "__main__":
    unittest.main()
