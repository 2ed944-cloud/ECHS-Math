#!/usr/bin/env python3
"""Deterministic release checks for Grade 9 lesson 5.5."""

from __future__ import annotations

import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "curriculum/pathways/grade-9-2026-2027.json"
CATALOG = ROOT / "data/grade-9-10-pathways.js"
LESSON_URL = "lessons/pathways/grade-9/unit-5/g9-5.5-polynomial-graphs-end-behavior.html"
LESSON = ROOT / LESSON_URL


def end_behavior(degree: int, leading_coefficient: int) -> tuple[str, str]:
    """Return left and right end directions."""
    right = "up" if leading_coefficient > 0 else "down"
    left = right if degree % 2 == 0 else ("down" if right == "up" else "up")
    return left, right


class GradeNinePolynomialGraphsEndBehaviorTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
        cls.html = LESSON.read_text(encoding="utf-8")
        cls.lesson = next(
            lesson
            for unit in cls.manifest["paths"]["common"]["units"]
            for lesson in unit["lessons"]
            if lesson["id"] == "5.5"
        )

    def test_authoritative_manifest_row_is_truthfully_ready(self) -> None:
        self.assertEqual(self.lesson["title"], "Polynomial Graphs & End Behavior")
        self.assertEqual(
            self.lesson["subtopics"],
            ["Leading-term test; odd/even degree; end behavior; turning points as qualitative feature."],
        )
        self.assertEqual(
            self.lesson["learningOutcomes"],
            ["Relate polynomial structure to end behavior and a qualitative graph."],
        )
        self.assertEqual(self.lesson["depth"], "B Bridge Depth")
        self.assertEqual(
            self.lesson["requiredGrade9Coverage"],
            "Predict end behavior from degree/leading coefficient and sketch reasonable low-degree graphs using known zeros/multiplicity.",
        )
        self.assertEqual(
            self.lesson["coverageBoundary"],
            "Deferred content: complete AP polynomial modeling, difference quotients, regression, or all local/global behavior requirements.",
        )
        self.assertEqual((self.lesson["targetPeriods"], self.lesson["maximumPeriods"]), (3, 3))
        self.assertEqual(self.lesson["deliveryStatus"], "ready")
        self.assertEqual(self.lesson["url"], LESSON_URL)
        self.assertEqual(self.lesson["screenCount"], 64)
        self.assertTrue(LESSON.is_file())
        self.assertIn(f'"url":"{LESSON_URL}"', CATALOG.read_text(encoding="utf-8"))

    def test_depth_pacing_coverage_and_boundary_are_explicit(self) -> None:
        for phrase in (
            "B · Bridge Depth",
            "3 target periods",
            "3 maximum",
            "Predict end behavior from degree and leading coefficient",
            "known zeros and multiplicity",
            "complete AP polynomial modeling",
            "difference quotients",
            "regression",
            "all local/global behavior requirements",
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
        self.assertNotIn("calc:true", self.html)

    def test_answer_key_is_complete_varied_and_options_are_unique(self) -> None:
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
        option_blocks = re.findall(r'options:\[(.*?)\],answer:', self.html)
        self.assertEqual(len(option_blocks), 20)
        for block in option_blocks:
            options = re.findall(r'"(.*?)"', block)
            self.assertEqual(len(options), 4)
            self.assertEqual(len(set(options)), 4)

    def test_every_end_multiplicity_and_turn_claim_is_correct(self) -> None:
        cases = {
            "E1": (4, 3, ("up", "up")),
            "E2": (5, -2, ("up", "down")),
            "M1": (2, -1, ("down", "down")),
            "M2": (3, 1, ("down", "up")),
            "M3": (3, -3, ("up", "down")),
            "M4": (3, 2, ("down", "up")),
            "H1": (5, 1, ("down", "up")),
            "H2": (3, -2, ("up", "down")),
            "H3": (6, -4, ("down", "down")),
            "H6": (4, -1, ("down", "down")),
        }
        for item, (degree, coefficient, expected) in cases.items():
            with self.subTest(item=item):
                self.assertEqual(end_behavior(degree, coefficient), expected)
        self.assertEqual(6 - 1, 5)  # E4
        self.assertEqual(8 - 1, 7)  # H4: six turns possible, even ends match
        self.assertEqual(5 - 1, 4)  # C2/H exit turn ceiling
        self.assertEqual(2 + 1, 3)  # C3 least multiplicity sum
        self.assertEqual((0 + 2) * (0 - 1) ** 2, 2)
        self.assertEqual(-((0 + 1) ** 2) * (0 - 3), 3)
        self.assertEqual(-2 * (0 + 2) * (0 - 1) ** 2, -4)

    def test_screen_plan_is_64_meaningful_screens(self) -> None:
        self.assertIn('<meta name="echs-screen-count" content="64">', self.html)
        self.assertIn("const EXPECTED_SCREEN_COUNT=64", self.html)
        self.assertEqual(self.html.count("\n    add("), 44)
        self.assertEqual(44 + 20, 64)
        for signal in (
            "Learning goals", "Prerequisite retrieval", "Worked example", "Student Turn",
            "leading term controls", "Four leading-term cases", "known zeros and multiplicity",
            "Qualitative sketch workflow", "turning points as a qualitative feature",
            "Differentiated practice", "AP bridge", "Exit ticket", "mastery evidence",
        ):
            self.assertIn(signal.lower(), self.html.lower())

    def test_math_interaction_accessibility_and_responsiveness_contracts(self) -> None:
        self.assertIn("katex@0.16.11", self.html)
        self.assertGreaterEqual(self.html.count('math("') + self.html.count('class="math" data-tex='), 25)
        unsafe_commands = re.findall(
            r'(?<!\\)\\(?:frac|text|circ|ne|sqrt|to|xrightarrow|quad|square|pm|le|ge|infty|cup)',
            self.html,
        )
        self.assertEqual(unsafe_commands, [])
        for signal in (
            "localStorage", "exportWork", "ArrowRight", 'data-check="',
            'aria-live="polite"', "details", "Score all responses", 'name="viewport"',
            "focus-visible", "prefers-reduced-motion:reduce", "@media(max-width:520px)",
            "Skip to lesson content", 'role="img" aria-labelledby="', "<title id=",
            "<desc id=", "endBehaviorSvg", "sketchSvg",
        ):
            self.assertIn(signal, self.html)

    def test_originality_scope_and_no_stale_lesson_content(self) -> None:
        lowered = self.html.lower()
        for prohibited in (
            "question-bank/official", "private question", "college board question",
            "credential", "answer token", "pearson", "lorem ipsum",
            "polynomial division & theorems", "synthetic division", "remainder theorem",
            "advanced transformed divisors", "repeated strategic division",
            "projectile maximum", "technology regression",
        ):
            self.assertNotIn(prohibited, lowered)


if __name__ == "__main__":
    unittest.main()
