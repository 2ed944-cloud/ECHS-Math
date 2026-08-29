#!/usr/bin/env python3
"""Deterministic release checks for Grade 9 lesson 8.3."""
from __future__ import annotations
import json, math, re, unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
MANIFEST=ROOT/'curriculum/pathways/grade-9-2026-2027.json'
CATALOG=ROOT/'data/grade-9-10-pathways.js'
LESSON_URL='lessons/pathways/grade-9/unit-8/g9-8.3-inverse-trigonometry.html'
LESSON=ROOT/LESSON_URL

class GradeNineInverseTrigTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.manifest=json.loads(MANIFEST.read_text())
        cls.html=LESSON.read_text()
        cls.lesson=next(l for u in cls.manifest['paths']['common']['units'] for l in u['lessons'] if l['id']=='8.3')

    def test_authoritative_row_truthfully_ready(self):
        self.assertEqual(self.lesson['title'],'Inverse Trigonometry')
        self.assertEqual(self.lesson['subtopics'],['arcsin/arccos/arctan; solve for angles; reasonableness; calculator mode.'])
        self.assertEqual(self.lesson['learningOutcomes'],['Determine unknown angles using inverse trig; check reasonableness; communicate angle units and precision.'])
        self.assertEqual(self.lesson['alignment'],'AP Precalculus prerequisite profile')
        self.assertEqual((self.lesson['deliveryStatus'],self.lesson['url'],self.lesson['screenCount']),('ready',LESSON_URL,64))
        self.assertTrue(LESSON.is_file())
        catalog=CATALOG.read_text()
        self.assertEqual(catalog.count(f'"url":"{LESSON_URL}"'),1)
        self.assertIn('"id":"8.3","title":"Inverse Trigonometry"',catalog)

    def test_scope_pacing_and_boundary(self):
        for phrase in ('arcsin/arccos/arctan','unknown acute angles','reasonableness','calculator mode','degree mode','precision','unit pacing: weeks 31–33','elevation/depression','indirect measurement','coordinate slope-angle','unit-circle','radians','identities','graphs','law of sines/cosines'):
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
        self.assertEqual((self.html.count('calc:true'),self.html.count('calc:false')),(11,9))

    def test_complete_answer_key_and_unique_options(self):
        expected={'E1':0,'E2':1,'E3':2,'E4':2,'M1':1,'M2':0,'M3':1,'M4':1,'M5':1,'M6':1,'H1':1,'H2':1,'H3':2,'H4':2,'H5':0,'H6':2,'C1':2,'C2':2,'C3':1,'C4':0}
        found={i:int(a) for i,a in re.findall(r'\{id:"([EMHC]\d+)".*?,answer:(\d)',self.html)}
        self.assertEqual(found,expected)
        for block in re.findall(r'options:\[(.*?)\],answer:',self.html):
            options=re.findall(r'"(.*?)"',block)
            self.assertEqual((len(options),len(set(options))),(4,4))

    def test_inverse_angle_values_verified(self):
        cases=[('asin',3/5,36.87),('acos',12/13,22.62),('atan',8/15,28.07),('asin',7/11,39.52),('acos',9/14,49.99),('atan',12/5,67.38),('acos',.2,78.46),('atan',7/9,37.87)]
        funcs={'asin':math.asin,'acos':math.acos,'atan':math.atan}
        for fn,ratio,expected in cases:
            self.assertEqual(round(math.degrees(funcs[fn](ratio)),2),expected)
        self.assertEqual(round(90-math.degrees(math.atan(3/4)),2),53.13)
        for shown in ('36.8698','22.6199','28.0725','39.5212','49.9948','67.3801','78.4630','37.8749'):
            self.assertIn(shown,self.html)

    def test_inverse_meaning_and_verification(self):
        for phrase in ('does not mean reciprocal','forward trig function','inverse maps','complementary','0°&lt;a&lt;90°','substitute the angle back','restricted domain','one output per input'):
            self.assertIn(phrase,self.html.lower())
        self.assertAlmostEqual(math.tan(math.radians(37.8749836511)),7/9,places=10)
        self.assertAlmostEqual(math.sin(math.radians(39.5211963586)),7/11,places=10)

    def test_screen_math_interaction_accessibility_responsive(self):
        self.assertIn('<meta name="echs-screen-count" content="64">',self.html)
        self.assertIn('const EXPECTED_SCREEN_COUNT=64',self.html)
        self.assertEqual(self.html.count('\n    add('),44)
        for signal in ('Learning outcomes','Prerequisite retrieval','Worked example','Student Turn','Arcsine relationship','Arccosine relationship','Arctangent relationship','Differentiated practice','AP bridge','Exit ticket','mastery evidence','localStorage','exportWork','ArrowRight','data-check="','aria-live="polite"','details','Score all responses','name="viewport"','focus-visible','prefers-reduced-motion:reduce','@media(max-width:520px)','Skip to lesson content','role="img" aria-labelledby="','<title id=','<desc id=','inverseTitle','solveTitle'):
            self.assertIn(signal.lower(),self.html.lower())
        self.assertIn('katex@0.16.11',self.html)
        unsafe=re.findall(r'(?<!\\)\\(?:frac|text|circ|ne|sqrt|to|xrightarrow|quad|square|pm|le|ge|infty|cup|varnothing|Rightarrow|Longleftrightarrow|cdot)',self.html)
        self.assertEqual(unsafe,[])

    def test_originality_and_no_stale_content(self):
        lowered=self.html.lower()
        for prohibited in ('question-bank/official','private question','college board question','credential','answer token','pearson','lorem ipsum','growth/decay modeling','residual evidence','equivalent exponential forms','radical equations','synthetic division','coordinate distance'):
            self.assertNotIn(prohibited,lowered)

    def test_calculator_labels_meaningful(self):
        self.assertIn('nearest hundredth',self.html)
        self.assertIn('Calculator permitted',self.html)
        self.assertIn('No calculator',self.html)
        self.assertIn('round once',self.html.lower())
        self.assertIn('degree mode',self.html.lower())

if __name__=='__main__': unittest.main()
