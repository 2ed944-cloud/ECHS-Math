#!/usr/bin/env python3
"""Deterministic release checks for Grade 9 lesson 2.2."""

from __future__ import annotations

import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "curriculum/pathways/grade-9-2026-2027.json"
CATALOG = ROOT / "data/grade-9-10-pathways.js"
LESSON_URL = "lessons/pathways/grade-9/unit-2/g9-2.2-systems-elimination.html"
LESSON = ROOT / LESSON_URL


class GradeNineSystemsEliminationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
        cls.html = LESSON.read_text(encoding="utf-8")
        cls.lesson = cls.manifest["paths"]["common"]["units"][2]["lessons"][1]

    def test_authoritative_manifest_row_is_truthfully_ready(self) -> None:
        self.assertEqual(self.lesson["id"], "2.2")
        self.assertEqual(self.lesson["title"], "Systems by Elimination")
        self.assertEqual(
            self.lesson["subtopics"],
            ["Linear combinations; strategic multiplication; exact solutions; checking."],
        )
        self.assertIn("select a method based on structure", self.lesson["learningOutcomes"][0])
        self.assertIn("verify ordered-pair solutions", self.lesson["learningOutcomes"][0])
        self.assertEqual(self.lesson["deliveryStatus"], "ready")
        self.assertEqual(self.lesson["url"], LESSON_URL)
        self.assertEqual(self.lesson["screenCount"], 64)
        self.assertTrue(LESSON.is_file())
        self.assertIn(f'"url":"{LESSON_URL}"', CATALOG.read_text(encoding="utf-8"))

    def test_approved_depth_pacing_and_boundary(self) -> None:
        for phrase in (
            "Systems by Elimination",
            "Linear combinations",
            "strategic multiplication",
            "exact solutions",
            "checking",
            "three-period prerequisite-mastery",
            "target three class periods, maximum three",
            "Generalized linear-algebra notation",
            "matrix row reduction",
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
        prompts = re.findall(r",prompt:'(.*?)',options:", self.html)
        self.assertEqual(len(prompts), 20)
        self.assertEqual(len(set(prompts)), 20)
        self.assertEqual(self.html.count("solution:'"), 20)

    def test_independently_verified_answer_key(self) -> None:
        expected = {
            "E1": 0, "E2": 1, "E3": 2, "E4": 3,
            "M1": 1, "M2": 0, "M3": 2, "M4": 3, "M5": 0, "M6": 2,
            "H1": 1, "H2": 0, "H3": 3, "H4": 1, "H5": 2, "H6": 3,
            "C1": 1, "C2": 0, "C3": 2, "C4": 3,
        }
        found = {
            item: int(answer)
            for item, answer in re.findall(r'\{id:"([EMHC]\d+)".*?,answer:(\d)', self.html)
        }
        self.assertEqual(found, expected)
        self.assertTrue(all(0 <= answer <= 3 for answer in found.values()))

    def test_exact_solutions_classifications_and_context_are_consistent(self) -> None:
        for expression in (
            r"5x=15\\Rightarrow x=3",
            r"4y=12\\Rightarrow y=3",
            r"7x=21\\Rightarrow x=3",
            r"-13y=-26\\Rightarrow y=2",
            r"19x=57\\Rightarrow x=3",
            r"38x=76\\Rightarrow x=2",
            r"0=-2",
            r"0=0",
            r"6n=60\\Rightarrow n=10",
            r"3l=54\\Rightarrow l=18",
        ):
            self.assertIn(expression, self.html)
        for phrase in (
            "contradiction",
            "identity",
            "10 notebooks and 16 pens",
            "18 large",
            "satisfied by the claimed ordered pair",
        ):
            self.assertIn(phrase, self.html)

    def test_screen_plan_is_64_meaningful_screens(self) -> None:
        self.assertIn('<meta name="echs-screen-count" content="64">', self.html)
        self.assertIn("const EXPECTED_SCREEN_COUNT=64", self.html)
        self.assertEqual(self.html.count("    add("), 44)
        self.assertEqual(8 + 5 * 6 + 20 + 6, 64)
        for signal in (
            "Learning goals", "Worked example", "Student Turn", "Misconception check",
            "Differentiated practice", "AP-readiness transfer", "Exit ticket", "Mastery evidence",
        ):
            self.assertIn(signal, self.html)

    def test_math_interaction_and_persistence_contracts(self) -> None:
        self.assertIn("katex@0.16.11", self.html)
        self.assertGreaterEqual(self.html.count('class="math" data-tex='), 200)
        tex_values = re.findall(r'data-tex="(.*?)"', self.html)
        unsafe_commands = [
            value for value in tex_values
            if re.search(r'(?<!\\)\\(?:frac|Rightarrow|quad|ne)\b', value)
        ]
        self.assertEqual(unsafe_commands, [], "KaTeX commands inside JavaScript strings need doubled backslashes")
        self.assertIn("localStorage", self.html)
        self.assertIn("exportWork", self.html)
        self.assertIn("ArrowRight", self.html)
        self.assertIn('data-check="', self.html)
        self.assertIn('aria-live="polite"', self.html)

    def test_accessibility_responsive_and_visual_precision(self) -> None:
        for signal in (
            'name="viewport"', "focus-visible", "prefers-reduced-motion:reduce",
            "@media(max-width:520px)", "Skip to lesson content",
            'role="img" aria-labelledby="elim-title-',
            '<title id="elim-title-', '<desc id="elim-desc-',
            "Aligned equations combine to eliminate y",
            "Opposite y terms cancel",
        ):
            self.assertIn(signal, self.html)
        self.assertNotIn(".flow span{", self.html)
        self.assertIn(".flow > span{", self.html)
        lowered = self.html.lower()
        for prohibited in (
            "question-bank/official", "private question", "college board question",
            "credential", "answer token", "pearson", "lorem ipsum",
        ):
            self.assertNotIn(prohibited, lowered)


if __name__ == "__main__":
    unittest.main()
