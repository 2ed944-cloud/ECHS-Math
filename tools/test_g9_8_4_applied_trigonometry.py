#!/usr/bin/env python3
"""Deterministic release checks for Grade 9 lesson 8.4."""
from __future__ import annotations
import json, math, re, unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
MANIFEST=ROOT/'curriculum/pathways/grade-9-2026-2027.json'
CATALOG=ROOT/'data/grade-9-10-pathways.js'
LESSON_URL='lessons/pathways/grade-9/unit-8/g9-8.4-applied-trigonometry.html'
LESSON=ROOT/LESSON_URL

class GradeNineAppliedTrigTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.manifest=json.loads(MANIFEST.read_text())
        cls.html=LESSON.read_text()
        cls.lesson=next(l for u in cls.manifest['paths']['common']['units'] for l in u['lessons'] if l['id']=='8.4')

    def test_authoritative_row_truthfully_ready(self):
        self.assertEqual(self.lesson['title'],'Applied Trigonometry')
        self.assertEqual(self.lesson['subtopics'],['Angles of elevation/depression; indirect measurement; coordinate slope/angle connections.'])
        self.assertEqual(self.lesson['learningOutcomes'],['Model and solve contextual right-triangle problems; draw a valid diagram; state assumptions and units.'])
        self.assertEqual(self.lesson['alignment'],'AP Precalculus prerequisite profile')
        self.assertEqual((self.lesson['deliveryStatus'],self.lesson['url'],self.lesson['screenCount']),('ready',LESSON_URL,64))
        self.assertTrue(LESSON.is_file())
        catalog=CATALOG.read_text()
        self.assertEqual(catalog.count(f'"url":"{LESSON_URL}"'),1)
        self.assertIn('"id":"8.4","title":"Applied Trigonometry"',catalog)

    def test_scope_pacing_and_boundary(self):
        for phrase in ('angle of elevation','angle of depression','indirect measurement','coordinate slope-angle','valid diagram','assumptions','units','unit pacing: weeks 31–33','bearings','navigation','vectors','law of sines/cosines','unit circle','radians','identities','periodic models','advanced surveying'):
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
        self.assertEqual((self.html.count('calc:true'),self.html.count('calc:false')),(14,6))

    def test_complete_answer_key_and_unique_options(self):
        expected={'E1':0,'E2':1,'E3':1,'E4':1,'M1':1,'M2':1,'M3':1,'M4':2,'M5':1,'M6':2,'H1':2,'H2':1,'H3':1,'H4':1,'H5':1,'H6':0,'C1':0,'C2':1,'C3':0,'C4':1}
        found={i:int(a) for i,a in re.findall(r'\{id:"([EMHC]\d+)".*?,answer:(\d)',self.html)}
        self.assertEqual(found,expected)
        for block in re.findall(r'options:\[(.*?)\],answer:',self.html):
            options=re.findall(r'"(.*?)"',block)
            self.assertEqual((len(options),len(set(options))),(4,4))

    def test_applied_values_verified(self):
        t=lambda d:math.tan(math.radians(d))
        cases=[(20*t(30),11.55),(15*t(40),12.59),(30*t(25),13.99),(12*t(35)+1.6,10.00),(18*t(52),23.04),(10*math.sin(math.radians(65)),9.06),(45*t(32),28.12),(30/t(47),27.98),(25*t(33)+1.7,17.94)]
        for raw,expected in cases:self.assertEqual(round(raw,2),expected)
        height=20*t(50)
        self.assertEqual(round(height,2),23.84)
        self.assertEqual(round(math.degrees(math.atan(height/30)),2),38.47)

    def test_coordinate_values_verified(self):
        self.assertEqual(round(math.degrees(math.atan(3/6)),2),26.57)
        self.assertEqual(round(math.degrees(math.atan(1.2)),2),50.19)
        self.assertEqual(round(math.degrees(math.atan(6/8)),2),36.87)
        self.assertEqual(round(math.degrees(math.atan(5/12)),2),22.62)
        for phrase in ('rise=δy','run=δx','|rise/run|','positive slope','negative slope','horizontal reference','eye height','line of sight'):
            self.assertIn(phrase,self.html.lower())

    def test_screen_math_interaction_accessibility_responsive(self):
        self.assertIn('<meta name="echs-screen-count" content="64">',self.html)
        self.assertIn('const EXPECTED_SCREEN_COUNT=64',self.html)
        self.assertEqual(self.html.count('\n    add('),44)
        for signal in ('Learning outcomes','Prerequisite retrieval','Worked example','Student Turn','Angle of elevation','Angle of depression','Indirect measurement','Coordinate slope-angle connection','Differentiated practice','AP bridge','Exit ticket','mastery evidence','localStorage','exportWork','ArrowRight','data-check="','aria-live="polite"','details','Score all responses','name="viewport"','focus-visible','prefers-reduced-motion:reduce','@media(max-width:520px)','Skip to lesson content','role="img" aria-labelledby="','<title id=','<desc id=','appliedTitle','elevTitle'):
            self.assertIn(signal.lower(),self.html.lower())
        self.assertIn('katex@0.16.11',self.html)
        unsafe=re.findall(r'(?<!\\)\\(?:frac|text|circ|ne|sqrt|to|xrightarrow|quad|square|pm|le|ge|infty|cup|varnothing|Rightarrow|Longleftrightarrow|cdot)',self.html)
        self.assertEqual(unsafe,[])

    def test_originality_and_no_stale_content(self):
        lowered=self.html.lower()
        for prohibited in ('question-bank/official','private question','college board question','credential','answer token','pearson','lorem ipsum','growth/decay modeling','residual evidence','equivalent exponential forms','radical equations','synthetic division'):
            self.assertNotIn(prohibited,lowered)

    def test_calculator_and_model_labels_meaningful(self):
        self.assertIn('nearest hundredth',self.html)
        self.assertIn('Calculator permitted',self.html)
        self.assertIn('No calculator',self.html)
        self.assertIn('degree mode',self.html.lower())
        self.assertIn('round once',self.html.lower())
        self.assertIn('ground is level',self.html.lower())

if __name__=='__main__': unittest.main()
