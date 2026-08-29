#!/usr/bin/env python3
"""Deterministic release checks for Grade 10 Path B lesson R0.1."""
from __future__ import annotations
import json, re, unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
MANIFEST=ROOT/'curriculum/pathways/grade-10-2026-2027.json'
CATALOG=ROOT/'data/grade-9-10-pathways.js'
LESSON_URL='lessons/pathways/grade-10/path-b/unit-r0/g10b-r0.1-common-entry-diagnostic.html'
LESSON=ROOT/LESSON_URL

class PathBCommonEntryDiagnosticTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.manifest=json.loads(MANIFEST.read_text())
        cls.html=LESSON.read_text()
        units=cls.manifest['paths']['pathB']['units']
        cls.unit=next(u for u in units if u['code']=='R0')
        cls.lesson=next(l for l in cls.unit['lessons'] if l['id']=='R0.1')

    def test_authoritative_row_truthfully_ready(self):
        self.assertEqual(self.lesson['title'],'Common Entry Diagnostic')
        self.assertEqual(self.lesson['subtopics'],['Linear/quadratic fluency; factoring; exponents/radicals; systems; function notation/domain/range; graph reading; right-triangle trig; calculator/non-calculator habits.'])
        self.assertEqual(self.lesson['learningOutcomes'],['Identify strand-level strengths/gaps and establish an individual readiness profile.'])
        self.assertEqual(self.lesson['alignment'],'AP Precalculus prerequisite evidence')
        self.assertEqual((self.lesson['deliveryStatus'],self.lesson['url'],self.lesson['screenCount']),('ready',LESSON_URL,64))
        self.assertTrue(LESSON.is_file())
        catalog=CATALOG.read_text()
        self.assertEqual(catalog.count(f'"url":"{LESSON_URL}"'),1)
        self.assertIn('"id":"R0.1","title":"Common Entry Diagnostic"',catalog)

    def test_scope_depth_pacing_and_diagnostic_boundary(self):
        self.assertEqual(self.unit['pacing'],'1-2')
        self.assertEqual(self.lesson['depth'],'D Diagnostic / Repair')
        self.assertEqual((self.lesson['targetPeriods'],self.lesson['maximumPeriods']),(2,2))
        lowered=self.html.lower()
        for phrase in ('unit pacing: weeks 1–2','2 periods maximum','assessment—not a teaching lesson','whole-class review','results inform short-term flex groups','written error analysis','conceptual gaps from procedural, attention, or notation','repair only what blocks access','do not teach an assessed method before collection'):
            self.assertIn(phrase,lowered)

    def test_twenty_differentiated_original_items(self):
        ids=re.findall(r'"id":"([EMHC]\d+)"',self.html)
        self.assertEqual((len(ids),len(set(ids))),(20,20))
        self.assertEqual({k:sum(x.startswith(k) for x in ids) for k in 'EMHC'},{'E':4,'M':6,'H':6,'C':4})
        prompts=re.findall(r'"prompt":"(.*?)","options":',self.html)
        self.assertEqual((len(prompts),len(set(prompts))),(20,20))
        self.assertEqual(self.html.count('"solution":'),20)
        self.assertEqual(self.html.count('"strand":'),20)
        self.assertEqual((self.html.count('"calc":true'),self.html.count('"calc":false')),(2,18))

    def test_complete_answer_key_and_unique_options(self):
        expected={'E1':0,'E2':1,'E3':2,'E4':0,'M1':1,'M2':2,'M3':1,'M4':0,'M5':1,'M6':2,'H1':1,'H2':0,'H3':2,'H4':1,'H5':2,'H6':0,'C1':1,'C2':2,'C3':1,'C4':1}
        found={i:int(a) for i,a in re.findall(r'"id":"([EMHC]\d+)".*?"answer":(\d)',self.html)}
        self.assertEqual(found,expected)
        for block in re.findall(r'"options":\[(.*?)\],"answer":',self.html):
            options=json.loads('['+block+']')
            self.assertEqual((len(options),len(set(options))),(4,4))

    def test_mathematical_values_independently_verified(self):
        for result in ('5−2(−4)=5+8=13','4x=16','f(2)=3(2)−5=1','Δy/Δx=4/2=2','(x+3)(x+4)','2⁻²=1/2²=1/4','√72=√(36·2)=6√2','2x=12, so x=6; then y=3','x−5≠0 and x≠5','vertex is (−2,−9)','(2x+1)(x−3)','x≥−2','y=(x−1)²','sin⁻¹(7/25)≈16.2602°','2.4(8.5)+7.1=20.4+7.1=27.5','Domain [−3,4], range [−2,5]','√(x²)=|x|','only x=2 verifies'):
            self.assertIn(result,self.html)

    def test_screen_math_interaction_accessibility_responsive(self):
        self.assertIn('<meta name="echs-screen-count" content="64">',self.html)
        self.assertIn('const EXPECTED_SCREEN_COUNT=64',self.html)
        self.assertEqual(self.html.count('\n    add('),44)
        self.assertGreaterEqual(self.html.count('class="math" data-tex='),4)
        for signal in ('Learning objective','Prerequisite retrieval','Diagnostic error taxonomy','Correction protocol','Individual readiness profile','Short-term flex-group rules','Differentiated practice','Exit ticket','mastery evidence','localStorage','exportWork','ArrowRight','data-check="','aria-live="polite"','details','Score all responses','name="viewport"','focus-visible','prefers-reduced-motion:reduce','@media(max-width:520px)','Skip to lesson content','role="img" aria-labelledby="','<title id=','<desc id=','diagnosticTitle','entryGraphTitle','triangleTitle'):
            self.assertIn(signal.lower(),self.html.lower())
        self.assertIn('katex@0.16.11',self.html)
        unsafe=re.findall(r'(?<!\\)\\(?:frac|mathrm|circ|quad|text|sqrt|to|pm|le|ge|infty|cup|varnothing|Rightarrow|Longleftrightarrow|cdot)',self.html)
        self.assertEqual(unsafe,[])

    def test_originality_and_no_stale_content(self):
        lowered=self.html.lower()
        for prohibited in ('question-bank/official','private question','college board question','credential','answer token','pearson','lorem ipsum','grade 9','g9_','cumulative ap readiness capstone','placement conference'):
            self.assertNotIn(prohibited,lowered)

    def test_tool_labels_error_taxonomy_and_profile_meaningful(self):
        for phrase in ('Grade 10 AP Readiness · Path B','Calculator permitted','No calculator','degree mode','premature rounding','conceptual','procedural','attention','notation','accuracy','independent?','error type','action','factoring/radical repair group','reassess those strands'):
            self.assertIn(phrase.lower(),self.html.lower())

if __name__=='__main__': unittest.main()
