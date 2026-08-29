#!/usr/bin/env python3
"""Deterministic release checks for Grade 9 lesson 9.4."""
from __future__ import annotations
import json, re, unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
MANIFEST=ROOT/'curriculum/pathways/grade-9-2026-2027.json'
CATALOG=ROOT/'data/grade-9-10-pathways.js'
LESSON_URL='lessons/pathways/grade-9/unit-9/g9-9.4-cumulative-ap-readiness-capstone.html'
LESSON=ROOT/LESSON_URL

class GradeNineCumulativeCapstoneTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.manifest=json.loads(MANIFEST.read_text())
        cls.html=LESSON.read_text()
        cls.lesson=next(l for u in cls.manifest['paths']['common']['units'] for l in u['lessons'] if l['id']=='9.4')

    def test_authoritative_row_truthfully_ready(self):
        self.assertEqual(self.lesson['title'],'Cumulative AP Readiness Capstone')
        self.assertEqual(self.lesson['subtopics'],['Mixed prerequisite assessment; error correction; student reflection; summer/Grade 10 transition plan.'])
        self.assertEqual(self.lesson['learningOutcomes'],['Demonstrate mastery across all prerequisite strands; correct and explain errors; identify the appropriate next pathway and targeted summer actions.'])
        self.assertEqual(self.lesson['alignment'],'AP Precalculus prerequisite profile')
        self.assertEqual((self.lesson['deliveryStatus'],self.lesson['url'],self.lesson['screenCount']),('ready',LESSON_URL,64))
        self.assertTrue(LESSON.is_file())
        catalog=CATALOG.read_text()
        self.assertEqual(catalog.count(f'"url":"{LESSON_URL}"'),1)
        self.assertIn('"id":"9.4","title":"Cumulative AP Readiness Capstone"',catalog)

    def test_scope_pacing_and_placement_boundary(self):
        lowered=self.html.lower()
        for phrase in ('mixed prerequisite assessment','independent error correction','student reflection','targeted summer','grade 10 transition plan','unit pacing: weeks 34–36','evidence—not one score','recommended guides, not automatic exclusions','approximately 85%+','critical strand is below about 75%','released-ap complexity','no new ap content','full ap exam simulation'):
            self.assertIn(phrase,lowered)
        self.assertNotIn('AP Progress Check',self.html)
        self.assertNotIn('question-bank',lowered)

    def test_twenty_differentiated_original_items(self):
        ids=re.findall(r'"id":"([EMHC]\d+)"',self.html)
        self.assertEqual((len(ids),len(set(ids))),(20,20))
        self.assertEqual({k:sum(x.startswith(k) for x in ids) for k in 'EMHC'},{'E':4,'M':6,'H':6,'C':4})
        prompts=re.findall(r'"prompt":"(.*?)","options":',self.html)
        self.assertEqual((len(prompts),len(set(prompts))),(20,20))
        self.assertEqual(self.html.count('"solution":'),20)
        self.assertEqual((self.html.count('"calc":true'),self.html.count('"calc":false')),(2,18))

    def test_complete_answer_key_and_unique_options(self):
        expected={'E1':0,'E2':1,'E3':2,'E4':0,'M1':1,'M2':0,'M3':1,'M4':2,'M5':1,'M6':1,'H1':1,'H2':0,'H3':2,'H4':1,'H5':2,'H6':0,'C1':1,'C2':2,'C3':1,'C4':1}
        found={i:int(a) for i,a in re.findall(r'"id":"([EMHC]\d+)".*?"answer":(\d)',self.html)}
        self.assertEqual(found,expected)
        for block in re.findall(r'"options":\[(.*?)\],"answer":',self.html):
            options=json.loads('['+block+']')
            self.assertEqual((len(options),len(set(options))),(4,4))

    def test_mathematical_values_independently_verified(self):
        for result in ('6x−15−4x=2x−15','3x=12, so x=4 and y=3','x²−5x+6=(x−2)(x−3)','both −4 and 4 are excluded','aₙ=7+5(n−1)=5n+2','x²−3x−4=0','only 4 checks','left down and right up','x=−1 or 5','18tan(32°)≈11.2476 m','P(4)=202.5','f(5)=2(5)+1=11','x<−1','x=(1±√17)/2'):
            self.assertIn(result,self.html)
        self.assertIn('15% per step',self.html)
        self.assertIn('x≠−4 and x≠4',self.html)

    def test_screen_math_interaction_accessibility_responsive(self):
        self.assertIn('<meta name="echs-screen-count" content="64">',self.html)
        self.assertIn('const EXPECTED_SCREEN_COUNT=64',self.html)
        self.assertEqual(self.html.count('\n    add('),44)
        self.assertGreaterEqual(self.html.count('class="math" data-tex='),4)
        for signal in ('Learning outcomes','Prerequisite retrieval','Error taxonomy','Independent correction protocol','Strand-level evidence matrix','Placement conference preparation','Calculator-supported analysis','Differentiated practice','AP bridge','Exit ticket','mastery evidence','localStorage','exportWork','ArrowRight','data-check="','aria-live="polite"','details','Score all responses','name="viewport"','focus-visible','prefers-reduced-motion:reduce','@media(max-width:520px)','Skip to lesson content','role="img" aria-labelledby="','<title id=','<desc id=','capstoneTitle','quadCapTitle'):
            self.assertIn(signal.lower(),self.html.lower())
        self.assertIn('katex@0.16.11',self.html)
        unsafe=re.findall(r'(?<!\\)\\(?:frac|mathrm|circ|quad|text|sqrt|to|pm|le|ge|infty|cup|varnothing|Rightarrow|Longleftrightarrow|cdot)',self.html)
        self.assertEqual(unsafe,[])

    def test_originality_and_no_stale_content(self):
        lowered=self.html.lower()
        for prohibited in ('question-bank/official','private question','college board question','credential','answer token','pearson','lorem ipsum','ready for the cumulative capstone','view next lesson preview','g9-9.3','multiple representations.txt'):
            self.assertNotIn(prohibited,lowered)

    def test_transition_evidence_and_tool_labels_meaningful(self):
        for phrase in ('Grade 10 AP Precalculus','Readiness—Fast Track','Readiness—Core','Transfer Gate 1','Grade 11 AP Precalculus','Calculator permitted','No calculator','degree mode','enough digits','rounding','units','strand balance','completed corrections','retest'):
            self.assertIn(phrase.lower(),self.html.lower())

if __name__=='__main__': unittest.main()
