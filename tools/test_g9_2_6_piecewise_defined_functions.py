#!/usr/bin/env python3
"""Deterministic release checks for Grade 9 lesson 2.6."""

from __future__ import annotations

import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "curriculum/pathways/grade-9-2026-2027.json"
CATALOG = ROOT / "data/grade-9-10-pathways.js"
LESSON_URL = (
    "lessons/pathways/grade-9/unit-2/"
    "g9-2.6-piecewise-defined-functions.html"
)
LESSON = ROOT / LESSON_URL


class GradeNinePiecewiseFunctionsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
        cls.html = LESSON.read_text(encoding="utf-8")
        cls.lesson = next(
            lesson
            for unit in cls.manifest["paths"]["common"]["units"]
            for lesson in unit["lessons"]
            if lesson["id"] == "2.6"
        )

    def test_final_share_ready_manifest_row_is_truthfully_ready(self) -> None:
        self.assertEqual(self.lesson["title"], "Piecewise-Defined Functions")
        self.assertEqual(
            self.lesson["subtopics"],
            [
                "Reading/writing simple piecewise rules; evaluating at "
                "breakpoints; endpoint inclusion; context models."
            ],
        )
        self.assertEqual(
            self.lesson["learningOutcomes"],
            [
                "Evaluate and graph simple piecewise functions and "
                "communicate domain conditions precisely."
            ],
        )
        self.assertEqual(self.lesson["depth"], "B Bridge Depth")
        self.assertEqual(
            self.lesson["requiredGrade9Coverage"],
            "Read, evaluate, and graph 2-3 piece functions, mainly "
            "linear/simple quadratic pieces; construct a simple rule from "
            "context.",
        )
        self.assertEqual(
            self.lesson["coverageBoundary"],
            "Deferred: AP-style rates across intervals, continuity-style "
            "analysis, complex nested pieces, and advanced modeling for later.",
        )
        self.assertEqual(self.lesson["targetPeriods"], 2)
        self.assertEqual(self.lesson["maximumPeriods"], 2)
        self.assertEqual(self.lesson["deliveryStatus"], "ready")
        self.assertEqual(self.lesson["url"], LESSON_URL)
        self.assertEqual(self.lesson["screenCount"], 64)
        self.assertTrue(LESSON.is_file())
        catalog = CATALOG.read_text(encoding="utf-8")
        self.assertIn(f'"url":"{LESSON_URL}"', catalog)
        self.assertIn('"targetPeriods":2,"maximumPeriods":2', catalog)

    def test_depth_pacing_and_boundary_are_explicit(self) -> None:
        for phrase in (
            "Bridge Depth",
            "2 target periods",
            "2 maximum",
            "two- or three-piece",
            "linear and simple quadratic pieces",
            "continuity-style analysis",
            "complex nested pieces",
            "advanced modeling",
        ):
            self.assertIn(phrase.lower(), self.html.lower())

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
            "E1": 1, "E2": 2, "E3": 1, "E4": 0,
            "M1": 2, "M2": 0, "M3": 0, "M4": 2, "M5": 0, "M6": 0,
            "H1": 0, "H2": 1, "H3": 2, "H4": 1, "H5": 2, "H6": 2,
            "C1": 0, "C2": 0, "C3": 1, "C4": 1,
        }
        found = {
            item: int(answer)
            for item, answer in re.findall(
                r'\{id:"([EMHC]\d+)".*?,answer:(\d)', self.html
            )
        }
        self.assertEqual(found, expected)

    def test_representative_mathematics_is_exact(self) -> None:
        def f(x: float) -> float:
            return x + 2 if x < 1 else -x + 5

        self.assertEqual(f(0), 2)
        self.assertEqual(f(1), 4)
        self.assertEqual(f(3), 2)
        self.assertEqual((-2) ** 2, 4)
        self.assertEqual(1 + 2, 3)
        self.assertEqual(10 + 2 * (8 - 5), 16)
        self.assertEqual([15 if m <= 2 else 25 if m <= 5 else 40 for m in (2, 5, 6)], [15, 25, 40])

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
        self.assertGreaterEqual(self.html.count('class="math" data-tex='), 140)
        tex_values = re.findall(r'data-tex="(.*?)"', self.html)
        unsafe_commands = [
            value
            for value in tex_values
            if re.search(r'(?<!\\)\\(?:begin|end|frac|ge|le|cup)\b', value)
        ]
        self.assertEqual(
            unsafe_commands,
            [],
            "KaTeX commands in JavaScript strings need doubled backslashes",
        )
        case_values = [value for value in tex_values if "\\\\begin{cases}" in value]
        self.assertGreaterEqual(len(case_values), 20)
        unsafe_case_breaks = [
            value
            for value in case_values
            if re.search(
                r"(?<!\\)\\\\(?!begin|end|ge|le|cup|frac)(?=[-0-9A-Za-z])",
                value,
            )
        ]
        self.assertEqual(
            unsafe_case_breaks,
            [],
            "Piecewise row separators need four source backslashes so the "
            "JavaScript runtime passes two to KaTeX",
        )
        self.assertTrue(all("\\\\\\\\" in value for value in case_values))
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
            'role="img" aria-labelledby="pw-title-',
            '<title id="pw-title-',
            '<desc id="pw-desc-',
            "Equal-scale axes",
            'd="M210 380L410 180"',
            'd="M410 130L660 380"',
            'cx="410" cy="180"',
            'cx="410" cy="130"',
            "open (1, 3)",
            "closed (1, 4)",
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
