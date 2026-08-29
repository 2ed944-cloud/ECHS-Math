#!/usr/bin/env python3
"""Deterministic release checks for Grade 10 Path B lesson R0.4."""
from __future__ import annotations
import json,re,unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
MANIFEST=ROOT/'curriculum/pathways/grade-10-2026-2027.json'
CATALOG=ROOT/'data/grade-9-10-pathways.js'
LESSON_URL='lessons/pathways/grade-10/path-b/unit-r0/g10b-r0.4-systems-right-triangle-trig-spot-repair.html'
LESSON=ROOT/LESSON_URL

class PathBSystemsTrigTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.manifest=json.loads(MANIFEST.read_text())
        cls.html=LESSON.read_text()
        cls.unit=next(u for u in cls.manifest['paths']['pathB']['units'] if u['code']=='R0')
        cls.lesson=next(l for l in cls.unit['lessons'] if l['id']=='R0.4')

    def test_authoritative_row_truthfully_ready(self):
        self.assertEqual(self.lesson['title'],'Systems & Right-Triangle Trig Spot Repair')
        self.assertEqual(self.lesson['subtopics'],['2x2 systems; accessible 3x3 elimination; Pythagorean theorem; sin/cos/tan; inverse trig in degrees.'])
        self.assertEqual(self.lesson['learningOutcomes'],['Demonstrate usable systems and right-triangle trig fluency for later modeling and trig work.'])
        self.assertEqual(self.lesson['alignment'],'AP Precalculus stated AP prerequisites')
        self.assertEqual((self.lesson['deliveryStatus'],self.lesson['url'],self.lesson['screenCount']),('ready',LESSON_URL,64))
        self.assertTrue(LESSON.is_file())
        catalog=CATALOG.read_text()
        self.assertEqual(catalog.count(f'"url":"{LESSON_URL}"'),1)
        self.assertIn('"id":"R0.4","title":"Systems & Right-Triangle Trig Spot Repair"',catalog)

    def test_scope_depth_pacing_and_boundary(self):
        self.assertEqual(self.unit['pacing'],'1-2')
        self.assertEqual(self.lesson['depth'],'D Diagnostic / Repair')
        self.assertEqual((self.lesson['targetPeriods'],self.lesson['maximumPeriods']),(2,2))
        lowered=self.html.lower()
        for phrase in ('2x2 systems; accessible 3x3 elimination; pythagorean theorem; sin/cos/tan; inverse trig in degrees','focused repair only where benchmark gaps are identified','usable without scaffolding','no new systems unit','radians and unit-circle work begin in r3','2 periods · 2 maximum'):
            self.assertIn(phrase,lowered)

    def test_twenty_differentiated_original_items_and_tool_labels(self):
        ids=re.findall(r'"id":"([EMHC]\d+)"',self.html)
        self.assertEqual((len(ids),len(set(ids))),(20,20))
        self.assertEqual({k:sum(x.startswith(k) for x in ids) for k in 'EMHC'},{'E':4,'M':6,'H':6,'C':4})
        prompts=re.findall(r'"prompt":"(.*?)","options":',self.html)
        self.assertEqual((len(prompts),len(set(prompts))),(20,20))
        self.assertEqual(self.html.count('"solution":'),20)
        self.assertEqual(self.html.count('"strand":'),20)
        self.assertEqual(self.html.count('"calc":true'),4)
        self.assertEqual(self.html.count('"calc":false'),16)

    def test_complete_answer_key_and_unique_options(self):
        expected={'E1':1,'E2':0,'E3':0,'E4':0,'M1':0,'M2':1,'M3':1,'M4':2,'M5':1,'M6':0,'H1':2,'H2':2,'H3':2,'H4':2,'H5':2,'H6':0,'C1':1,'C2':1,'C3':0,'C4':2}
        found={i:int(a) for i,a in re.findall(r'"id":"([EMHC]\d+)".*?"answer":(\d)',self.html)}
        self.assertEqual(found,expected)
        for block in re.findall(r'"options":\[(.*?)\],"answer":',self.html):
            options=json.loads('['+block+']')
            self.assertEqual((len(options),len(set(options))),(4,4))

    def test_mathematical_values_verified(self):
        for result in ('2x=8, so x=4','2(2)+1=5','c²=6²+8²=36+64=100','sin θ=5/13','3x=9 and x=3','solution is (3,2)','parallel lines have no solution','169−25=144','cos θ=12/13','≈36.9°','5x=20','3x/2=9','infinitely many solutions','3x=9, so x=3 and z=2','≈67.4°','≈7.95','6x=12','7y=7','49+576=625','sin⁻¹(0.8)≈53.1°'):
            self.assertIn(result.lower(),self.html.lower())

    def test_screen_math_interaction_accessibility_responsive(self):
        self.assertIn('<meta name="echs-screen-count" content="64">',self.html)
        self.assertIn('const EXPECTED_SCREEN_COUNT=64',self.html)
        self.assertEqual(self.html.count('\n    add('),44)
        self.assertGreaterEqual(self.html.count('class="math" data-tex='),12)
        for signal in ('Learning objective','Prerequisite retrieval','What a system solution means','Choose a 2x2 method','2x2 substitution','2x2 elimination','Classify solution sets','Verification is evidence','Accessible system graph','Accessible 3x3 boundary','Pythagorean theorem','Accessible right triangle','Pythagorean converse','SOH–CAH–TOA','Choose the ratio','Sine for a missing side','Cosine for a missing side','Tangent for a missing side','Unknown acute angles','Inverse trig with degree-mode check','Error-analysis protocol','AP-readiness transfer','Differentiated practice','Exit ticket','mastery evidence','localStorage','exportWork','ArrowRight','data-check="','aria-live="polite"','details','Score all responses','name="viewport"','focus-visible','prefers-reduced-motion:reduce','@media(max-width:520px)','Skip to lesson content','role="img" aria-labelledby="','<title id=','<desc id=','coverTitle','systemTitle','triangleTitle'):
            self.assertIn(signal.lower(),self.html.lower())
        self.assertIn('katex@0.16.11',self.html)
        unsafe=re.findall(r'(?<!\\)\\(?:frac|mathrm|circ|quad|text|sqrt|to|pm|le|ge|infty|cup|varnothing|Rightarrow|Longleftrightarrow|cdot|sin|cos|tan|theta|approx)',self.html)
        self.assertEqual(unsafe,[])

    def test_originality_and_no_stale_content(self):
        lowered=self.html.lower()
        for prohibited in ('question-bank/official','private question','college board question','credential','answer token','pearson','lorem ipsum','g9_','function notation, domain & representations','common entry diagnostic.txt','cumulative ap readiness capstone'):
            self.assertNotIn(prohibited,lowered)

    def test_systems_and_trig_reasoning_evidence(self):
        for phrase in ('one ordered pair satisfies every equation','method result without a two-equation check','same left side cannot equal both values','eliminate the same variable','take the positive square root','opposite the right angle','reference angle controls the labels','known side and wanted side','inverse functions, not reciprocals','degree mode','round only the final requested value','locate the first invalid algebra','stops before new systems instruction'):
            self.assertIn(phrase.lower(),self.html.lower())

if __name__=='__main__': unittest.main()
