#!/usr/bin/env python3
"""Deterministic release checks for Grade 9 lesson 0.1."""

from __future__ import annotations

import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "curriculum/pathways/grade-9-2026-2027.json"
LESSON_URL = "lessons/pathways/grade-9/unit-0/g9-0.1-entry-diagnostic-mathematical-profile.html"
LESSON = ROOT / LESSON_URL


class GradeNineEntryDiagnosticTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
        cls.html = LESSON.read_text(encoding="utf-8")
        cls.lesson = cls.manifest["paths"]["common"]["units"][0]["lessons"][0]

    def test_authoritative_manifest_row_is_truthfully_ready(self) -> None:
        self.assertEqual(self.lesson["id"], "0.1")
        self.assertEqual(self.lesson["title"], "Entry Diagnostic & Mathematical Profile")
        self.assertEqual(self.lesson["deliveryStatus"], "ready")
        self.assertEqual(self.lesson["url"], LESSON_URL)
        self.assertEqual(self.lesson["screenCount"], 64)
        self.assertTrue(LESSON.is_file())

    def test_scope_and_learning_outcomes_are_explicit(self) -> None:
        for phrase in (
            "arithmetic, algebra, functions, graph reading, and geometry",
            "conceptual, procedural, or attention-based",
            "two or three personal mastery targets",
            "AP Precalculus Readiness",
        ):
            self.assertIn(phrase, self.html)

    def test_exactly_38_original_diagnostic_items_cover_all_strands(self) -> None:
        ids = re.findall(r'\{id:"([A-E]\d+)"', self.html)
        self.assertEqual(len(ids), 38)
        self.assertEqual(len(set(ids)), 38)
        self.assertEqual(
            {letter: sum(item.startswith(letter) for item in ids) for letter in "ABCDE"},
            {"A": 8, "B": 8, "C": 8, "D": 8, "E": 6},
        )
        prompts = re.findall(r',prompt:\'(.*?)\',options:', self.html)
        self.assertEqual(len(prompts), 38)
        self.assertEqual(len(set(prompts)), 38)

    def test_verified_answer_key_matches_independent_audit(self) -> None:
        expected = {
            "A1": 2, "A2": 0, "A3": 2, "A4": 1, "A5": 1, "A6": 2, "A7": 1, "A8": 1,
            "B1": 1, "B2": 1, "B3": 2, "B4": 3, "B5": 1, "B6": 3, "B7": 1, "B8": 1,
            "C1": 3, "C2": 1, "C3": 1, "C4": 2, "C5": 2, "C6": 2, "C7": 1, "C8": 1,
            "D1": 1, "D2": 2, "D3": 1, "D4": 1, "D5": 2, "D6": 1, "D7": 2, "D8": 1,
            "E1": 1, "E2": 1, "E3": 1, "E4": 2, "E5": 2, "E6": 3,
        }
        found = {item: int(answer) for item, answer in re.findall(r'\{id:"([A-E]\d+)".*?,answer:(\d)', self.html)}
        self.assertEqual(found, expected)
        self.assertEqual(self.html.count("solution:'"), 38)

    def test_screen_plan_is_64_meaningful_screens(self) -> None:
        self.assertIn('<meta name="echs-screen-count" content="64">', self.html)
        self.assertIn("const EXPECTED_SCREEN_COUNT=64", self.html)
        # 8 orientations + five (strand launch + items + checkpoint) + 8 post-diagnostic screens.
        self.assertEqual(8 + sum(2 + count for count in (8, 8, 8, 8, 6)) + 8, 64)
        for signal in ("Learning outcomes", "Worked example", "Student Turn", "Practice", "Exit ticket"):
            self.assertIn(signal, self.html)

    def test_answers_are_locked_until_profile_scoring(self) -> None:
        self.assertIn('data-answer-key hidden', self.html)
        self.assertIn('state.scored=true', self.html)
        self.assertIn('el.hidden=false', self.html)
        self.assertIn("It does not erase or replace your first responses", self.html)

    def test_katex_graph_and_interaction_contracts(self) -> None:
        self.assertIn("katex@0.16.11", self.html)
        self.assertGreaterEqual(self.html.count('class="math" data-tex='), 50)
        self.assertIn('<svg class="graph"', self.html)
        self.assertIn("localStorage", self.html)
        self.assertIn("exportWork", self.html)
        self.assertIn("ArrowRight", self.html)

    def test_accessibility_and_responsive_contracts(self) -> None:
        for signal in (
            'name="viewport"',
            'aria-live="polite"',
            'focus-visible',
            'prefers-reduced-motion:reduce',
            '@media(max-width:520px)',
            'role="img"',
            'Skip to lesson content',
        ):
            self.assertIn(signal, self.html)

    def test_publication_safety(self) -> None:
        lowered = self.html.lower()
        for prohibited in ("question-bank/official", "private question", "college board question", "credential", "answer token"):
            self.assertNotIn(prohibited, lowered)
        self.assertNotIn("Pearson", self.html)


if __name__ == "__main__":
    unittest.main()
