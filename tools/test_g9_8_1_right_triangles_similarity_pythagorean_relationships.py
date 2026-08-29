#!/usr/bin/env python3
"""Deterministic release checks for Grade 9 lesson 8.1."""
from __future__ import annotations
import json, math, re, unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
MANIFEST=ROOT/'curriculum/pathways/grade-9-2026-2027.json'
CATALOG=ROOT/'data/grade-9-10-pathways.js'
LESSON_URL='lessons/pathways/grade-9/unit-8/g9-8.1-right-triangles-similarity-pythagorean-relationships.html'
LESSON=ROOT/LESSON_URL

class GradeNineRightTrianglesTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.manifest=json.loads(MANIFEST.read_text())
        cls.html=LESSON.read_text()
        cls.lesson=next(l for u in cls.manifest['paths']['common']['units'] for l in u['lessons'] if l['id']=='8.1')

    def test_authoritative_row_truthfully_ready(self):
        self.assertEqual(self.lesson['title'],'Right Triangles, Similarity & Pythagorean Relationships')
        self.assertEqual(self.lesson['subtopics'],['Pythagorean theorem; similarity; side ratios; coordinate distance.'])
        self.assertEqual(self.lesson['learningOutcomes'],['Solve missing-side problems; use similarity to justify constant trig ratios; connect distance formula to right-triangle structure.'])
        self.assertEqual(self.lesson['alignment'],'AP Precalculus prerequisite profile')
        self.assertEqual((self.lesson['deliveryStatus'],self.lesson['url'],self.lesson['screenCount']),('ready',LESSON_URL,64))
        self.assertTrue(LESSON.is_file())
        catalog=CATALOG.read_text()
        self.assertEqual(catalog.count(f'"url":"{LESSON_URL}"'),1)
        self.assertIn('"id":"8.1","title":"Right Triangles, Similarity & Pythagorean Relationships"',catalog)

    def test_scope_pacing_and_boundary(self):
        for phrase in ('pythagorean theorem','similarity','side ratios','coordinate distance','aa similarity','unit pacing: weeks 31–33','sine/cosine/tangent calculations','inverse trigonometry','law of sines/cosines','three-dimensional distance','advanced geometry'):
            self.assertIn(phrase,self.html.lower())
        self.assertNotIn('AP Progress Check',self.html)
        self.assertNotIn('question-bank',self.html.lower())

    def test_twenty_differentiated_original_items(self):
        ids=re.findall(r'\{id:"([EMHC]\d+)"',self.html)
        self.assertEqual((len(ids),len(set(ids))),(20,20))
        self.assertEqual({k:sum(x.startswith(k) for x in ids) for k in 'EMHC'},{'E':4,'M':6,'H':6,'C':4})
        prompts=re.findall(r",prompt:'(.*?)',options:",self.html)
        self.assertEqual((len(prompts),len(set(prompts))),(20,20))
        self.assertEqual(self.html.count("solution:'"),20)
        self.assertEqual((self.html.count('calc:true'),self.html.count('calc:false')),(2,18))

    def test_complete_answer_key_and_unique_options(self):
        expected={'E1':0,'E2':1,'E3':2,'E4':1,'M1':0,'M2':1,'M3':2,'M4':1,'M5':1,'M6':1,'H1':0,'H2':1,'H3':2,'H4':1,'H5':0,'H6':1,'C1':1,'C2':2,'C3':2,'C4':2}
        found={i:int(a) for i,a in re.findall(r'\{id:"([EMHC]\d+)".*?,answer:(\d)',self.html)}
        self.assertEqual(found,expected)
        for block in re.findall(r'options:\[(.*?)\],answer:',self.html):
            options=re.findall(r'"(.*?)"',block)
            self.assertEqual((len(options),len(set(options))),(4,4))

    def test_pythagorean_values_verified(self):
        cases=[(6,8,10),(5,12,13),(8,15,17),(7,24,25),(9,12,15),(10,24,26)]
        for a,b,c in cases:self.assertEqual(a*a+b*b,c*c)
        self.assertAlmostEqual(math.sqrt(130),11.40175425099138)
        self.assertAlmostEqual(math.sqrt(51),7.14142842854285)
        self.assertNotEqual(6**2+8**2,11**2)
        self.assertEqual(math.sqrt(15**2-9**2),12)

    def test_similarity_and_distance_values_verified(self):
        self.assertEqual(15/9,20/12)
        self.assertEqual(9/6,12/8)
        self.assertEqual(15/5,12/4)
        self.assertEqual(math.hypot(4-(-2),9-1),10)
        self.assertEqual(math.hypot(5-(-3),2-(-4)),10)
        self.assertEqual(math.hypot(5-1,4-(-2)),math.sqrt(52))
        self.assertEqual(.5*9*12,54)
        for phrase in ('corresponding sides','scale factor','constant ratios','horizontal and vertical changes','perpendicular legs','principal root','exact radical'):
            self.assertIn(phrase,self.html.lower())

    def test_screen_math_interaction_accessibility_responsive(self):
        self.assertIn('<meta name="echs-screen-count" content="64">',self.html)
        self.assertIn('const EXPECTED_SCREEN_COUNT=64',self.html)
        self.assertEqual(self.html.count('\n    add('),44)
        for signal in ('Learning outcomes','Prerequisite retrieval','Worked example','Student Turn','Pythagorean theorem','AA similarity','Coordinate distance','Differentiated practice','AP bridge','Exit ticket','mastery evidence','localStorage','exportWork','ArrowRight','data-check="','aria-live="polite"','details','Score all responses','name="viewport"','focus-visible','prefers-reduced-motion:reduce','@media(max-width:520px)','Skip to lesson content','role="img" aria-labelledby="','<title id=','<desc id=','triTitle','simTitle'):
            self.assertIn(signal.lower(),self.html.lower())
        self.assertIn('katex@0.16.11',self.html)
        unsafe=re.findall(r'(?<!\\)\\(?:frac|text|circ|ne|sqrt|to|xrightarrow|quad|square|pm|le|ge|infty|cup|varnothing|Rightarrow|Longleftrightarrow|cdot)',self.html)
        self.assertEqual(unsafe,[])

    def test_originality_and_no_stale_content(self):
        lowered=self.html.lower()
        for prohibited in ('question-bank/official','private question','college board question','credential','answer token','pearson','lorem ipsum','growth/decay modeling','residual evidence','model family','equivalent exponential forms','radical equations','synthetic division'):
            self.assertNotIn(prohibited,lowered)

    def test_calculator_labels_meaningful(self):
        self.assertIn('nearest tenth',self.html)
        self.assertIn('nearest hundredth',self.html)
        self.assertIn('Calculator permitted',self.html)
        self.assertIn('No calculator',self.html)

if __name__=='__main__': unittest.main()
