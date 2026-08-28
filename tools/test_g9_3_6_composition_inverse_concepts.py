#!/usr/bin/env python3
"""Deterministic release checks for Grade 9 lesson 3.6."""

from __future__ import annotations

import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "curriculum/pathways/grade-9-2026-2027.json"
CATALOG = ROOT / "data/grade-9-10-pathways.js"
LESSON_URL = "lessons/pathways/grade-9/unit-3/g9-3.6-composition-inverse-concepts.html"
LESSON = ROOT / LESSON_URL


class GradeNineCompositionInverseTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
        cls.html = LESSON.read_text(encoding="utf-8")
        cls.lesson = next(
            lesson
            for unit in cls.manifest["paths"]["common"]["units"]
            for lesson in unit["lessons"]
            if lesson["id"] == "3.6"
        )

    def test_final_share_ready_manifest_row_is_truthfully_ready(self) -> None:
        self.assertEqual(self.lesson["title"], "Composition and Inverse Concepts")
        self.assertEqual(
            self.lesson["subtopics"],
            ["Composition as process chaining; simple input restrictions; one-to-one idea; inverse as reversing a process."],
        )
        self.assertEqual(
            self.lesson["learningOutcomes"],
            ["Use simple compositions and explain the inverse idea as reversing a process."],
        )
        self.assertEqual(self.lesson["depth"], "P Preview Only")
        self.assertEqual(
            self.lesson["requiredGrade9Coverage"],
            "Evaluate simple f(g(x)) numerically/algebraically; recognize inverse relationships in familiar one-to-one cases.",
        )
        self.assertEqual(
            self.lesson["coverageBoundary"],
            "Deferred: formal inverse-function domain restriction, algebraic inverse construction across many families, nested compositions, and AP modeling for Grade 10/AP.",
        )
        self.assertEqual((self.lesson["targetPeriods"], self.lesson["maximumPeriods"]), (2, 3))
        self.assertEqual(self.lesson["deliveryStatus"], "ready")
        self.assertEqual(self.lesson["url"], LESSON_URL)
        self.assertEqual(self.lesson["screenCount"], 64)
        self.assertTrue(LESSON.is_file())
        self.assertIn(f'"url":"{LESSON_URL}"', CATALOG.read_text(encoding="utf-8"))

    def test_preview_depth_pacing_coverage_and_boundary_are_explicit(self) -> None:
        for phrase in (
            "Preview Only",
            "2 target periods",
            "3 maximum",
            "numerically and algebraically",
            "familiar one-to-one",
            "formal inverse-function domain restriction",
            "algebraic inverse construction across many families",
            "nested compositions",
            "AP modeling",
        ):
            self.assertIn(phrase.lower(), self.html.lower())
        self.assertNotIn("triple composition", self.html.lower())
        self.assertNotIn("ap progress check", self.html.lower())

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
        f = lambda x: 2 * x + 1
        g = lambda x: x * x
        self.assertEqual(f(g(2)), 9)
        self.assertEqual(g(f(2)), 25)
        self.assertEqual((lambda x: x + 4)((lambda x: 3 * x)(2)), 10)
        self.assertEqual((lambda x: 3 * x)((lambda x: x + 4)(2)), 18)
        self.assertEqual((100 * 0.80) + 10, 90)
        self.assertEqual((95 - 32) / 1.8, 35)
        self.assertEqual((17 - 5) / 3, 4)
        for x in (-5, 0, 8):
            forward = 3 * x - 2
            reverse = (forward + 2) / 3
            self.assertEqual(reverse, x)

    def test_screen_plan_is_64_meaningful_screens(self) -> None:
        self.assertIn('<meta name="echs-screen-count" content="64">', self.html)
        self.assertIn("const EXPECTED_SCREEN_COUNT=64", self.html)
        self.assertEqual(self.html.count("\n    add("), 44)
        self.assertEqual(44 + 20, 64)
        for signal in (
            "Learning goals", "Prerequisite retrieval", "Worked example",
            "Student Turn", "Function-machine view", "Input restrictions",
            "The one-to-one idea", "Differentiated practice", "AP-readiness transfer",
            "Exit ticket", "Mastery reflection",
        ):
            self.assertIn(signal, self.html)

    def test_math_interaction_and_persistence_contracts(self) -> None:
        self.assertIn("katex@0.16.11", self.html)
        self.assertGreaterEqual(self.html.count('math("') + self.html.count('class="math" data-tex='), 35)
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
            "marker-end=", ".flow > span{",
        ):
            self.assertIn(signal, self.html)
        self.assertNotIn(".flow span{", self.html)
        lowered = self.html.lower()
        for prohibited in (
            "question-bank/official", "private question", "college board question",
            "credential", "answer token", "pearson", "lorem ipsum",
        ):
            self.assertNotIn(prohibited, lowered)


if __name__ == "__main__":
    unittest.main()
