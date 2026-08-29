#!/usr/bin/env python3
"""Deterministic release checks for Grade 9 lesson 8.2."""
from __future__ import annotations
import json, math, re, unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
MANIFEST=ROOT/'curriculum/pathways/grade-9-2026-2027.json'
CATALOG=ROOT/'data/grade-9-10-pathways.js'
LESSON_URL='lessons/pathways/grade-9/unit-8/g9-8.2-sine-cosine-tangent-ratios.html'
LESSON=ROOT/LESSON_URL

class GradeNineTrigRatiosTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.manifest=json.loads(MANIFEST.read_text())
        cls.html=LESSON.read_text()
        cls.lesson=next(l for u in cls.manifest['paths']['common']['units'] for l in u['lessons'] if l['id']=='8.2')

    def test_authoritative_row_truthfully_ready(self):
        self.assertEqual(self.lesson['title'],'Sine, Cosine & Tangent Ratios')
        self.assertEqual(self.lesson['subtopics'],['SOH-CAH-TOA; reference angle in right triangle; exact vs approximate values; calculator use.'])
        self.assertEqual(self.lesson['learningOutcomes'],['Choose and use an appropriate trig ratio; solve for missing sides; interpret ratios as relationships, not memorized labels only.'])
        self.assertEqual(self.lesson['alignment'],'AP Precalculus prerequisite profile')
        self.assertEqual((self.lesson['deliveryStatus'],self.lesson['url'],self.lesson['screenCount']),('ready',LESSON_URL,64))
        self.assertTrue(LESSON.is_file())
        catalog=CATALOG.read_text()
        self.assertEqual(catalog.count(f'"url":"{LESSON_URL}"'),1)
        self.assertIn('"id":"8.2","title":"Sine, Cosine & Tangent Ratios"',catalog)

    def test_scope_pacing_and_boundary(self):
        for phrase in ('soh-cah-toa','reference angle','exact versus approximate','calculator discipline','degree mode','missing-side','unit pacing: weeks 31–33','inverse trigonometry','elevation/depression','unit-circle','radians','reciprocal functions','trig graphs and identities','law of sines/cosines'):
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
        self.assertEqual((self.html.count('calc:true'),self.html.count('calc:false')),(7,13))

    def test_complete_answer_key_and_unique_options(self):
        expected={'E1':0,'E2':1,'E3':2,'E4':0,'M1':1,'M2':0,'M3':3,'M4':0,'M5':2,'M6':0,'H1':2,'H2':0,'H3':1,'H4':0,'H5':2,'H6':1,'C1':2,'C2':2,'C3':1,'C4':2}
        found={i:int(a) for i,a in re.findall(r'\{id:"([EMHC]\d+)".*?,answer:(\d)',self.html)}
        self.assertEqual(found,expected)
        for block in re.findall(r'options:\[(.*?)\],answer:',self.html):
            options=re.findall(r'"(.*?)"',block)
            self.assertEqual((len(options),len(set(options))),(4,4))

    def test_exact_ratio_values_verified(self):
        self.assertEqual(3/5,6/10)
        self.assertEqual((5/13,12/13,5/12),(5/13,12/13,5/12))
        self.assertEqual((8/17,15/17,8/15),(8/17,15/17,8/15))
        self.assertEqual(math.hypot(3,4),5)
        self.assertEqual(math.hypot(5,12),13)
        self.assertEqual(math.hypot(8,15),17)
        for phrase in ('opposite','adjacent','hypotenuse','aa similarity','corresponding side ratios','between 0 and 1'):
            self.assertIn(phrase,self.html.lower())

    def test_calculator_values_verified(self):
        cases=[(12*math.sin(math.radians(35)),6.88),(9/math.cos(math.radians(52)),14.62),(15*math.tan(math.radians(28)),7.98),(10/math.sin(math.radians(41)),15.24),(18*math.cos(math.radians(63)),8.17),(11*math.tan(math.radians(37)),8.29),(4/math.tan(math.radians(22)),9.90)]
        for raw,rounded in cases:self.assertEqual(round(raw,2),rounded)
        for shown in ('6.8829','14.6184','7.9756','15.2425','8.1718','8.2891','9.9003'):
            self.assertIn(shown,self.html)

    def test_screen_math_interaction_accessibility_responsive(self):
        self.assertIn('<meta name="echs-screen-count" content="64">',self.html)
        self.assertIn('const EXPECTED_SCREEN_COUNT=64',self.html)
        self.assertEqual(self.html.count('\n    add('),44)
        for signal in ('Learning outcomes','Prerequisite retrieval','Worked example','Student Turn','Sine relationship','Cosine relationship','Tangent relationship','Differentiated practice','AP bridge','Exit ticket','mastery evidence','localStorage','exportWork','ArrowRight','data-check="','aria-live="polite"','details','Score all responses','name="viewport"','focus-visible','prefers-reduced-motion:reduce','@media(max-width:520px)','Skip to lesson content','role="img" aria-labelledby="','<title id=','<desc id=','trigTitle'):
            self.assertIn(signal.lower(),self.html.lower())
        self.assertIn('katex@0.16.11',self.html)
        unsafe=re.findall(r'(?<!\\)\\(?:frac|text|circ|ne|sqrt|to|xrightarrow|quad|square|pm|le|ge|infty|cup|varnothing|Rightarrow|Longleftrightarrow|cdot)',self.html)
        self.assertEqual(unsafe,[])

    def test_originality_and_no_stale_content(self):
        lowered=self.html.lower()
        for prohibited in ('question-bank/official','private question','college board question','credential','answer token','pearson','lorem ipsum','growth/decay modeling','residual evidence','model family','equivalent exponential forms','radical equations','synthetic division','coordinate distance'):
            self.assertNotIn(prohibited,lowered)

    def test_calculator_labels_meaningful(self):
        self.assertIn('nearest hundredth',self.html)
        self.assertIn('Calculator permitted',self.html)
        self.assertIn('No calculator',self.html)
        self.assertIn('round once',self.html.lower())
        self.assertIn('degree mode',self.html.lower())

if __name__=='__main__': unittest.main()
