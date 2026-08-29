#!/usr/bin/env python3
"""Deterministic release checks for Grade 9 lesson 9.2."""
from __future__ import annotations
import json, re, unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
MANIFEST=ROOT/'curriculum/pathways/grade-9-2026-2027.json'
CATALOG=ROOT/'data/grade-9-10-pathways.js'
LESSON_URL='lessons/pathways/grade-9/unit-9/g9-9.2-model-selection-across-families.html'
LESSON=ROOT/LESSON_URL

class GradeNineModelSelectionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.manifest=json.loads(MANIFEST.read_text())
        cls.html=LESSON.read_text()
        cls.lesson=next(l for u in cls.manifest['paths']['common']['units'] for l in u['lessons'] if l['id']=='9.2')

    def test_authoritative_row_truthfully_ready(self):
        self.assertEqual(self.lesson['title'],'Model Selection Across Families')
        self.assertEqual(self.lesson['subtopics'],['Linear/quadratic/exponential models; regression; residuals; assumptions; extrapolation cautions.'])
        self.assertEqual(self.lesson['learningOutcomes'],['Select and justify a model; interpret parameters; use residual/context evidence; identify unsafe extrapolation.'])
        self.assertEqual(self.lesson['alignment'],'AP Precalculus prerequisite profile')
        self.assertEqual((self.lesson['deliveryStatus'],self.lesson['url'],self.lesson['screenCount']),('ready',LESSON_URL,64))
        self.assertTrue(LESSON.is_file())
        catalog=CATALOG.read_text()
        self.assertEqual(catalog.count(f'"url":"{LESSON_URL}"'),1)
        self.assertIn('"id":"9.2","title":"Model Selection Across Families"',catalog)

    def test_scope_pacing_and_boundary(self):
        lowered=self.html.lower()
        for phrase in ('linear, quadratic, and exponential','structured regression','residuals','parameter meaning','assumptions','contextual evidence','interpolation','extrapolation cautions','unsafe extrapolation','unit pacing: weeks 34–36','open ap model construction','logarithmic or sinusoidal regression','formal inference','advanced residual statistics'):
            self.assertIn(phrase,lowered)
        self.assertNotIn('AP Progress Check',self.html)
        self.assertNotIn('question-bank',lowered)

    def test_twenty_differentiated_original_items(self):
        ids=re.findall(r'\{id:"([EMHC]\d+)"',self.html)
        self.assertEqual((len(ids),len(set(ids))),(20,20))
        self.assertEqual({k:sum(x.startswith(k) for x in ids) for k in 'EMHC'},{'E':4,'M':6,'H':6,'C':4})
        prompts=re.findall(r",prompt:'(.*?)',options:",self.html)
        self.assertEqual((len(prompts),len(set(prompts))),(20,20))
        self.assertEqual(self.html.count("solution:'"),20)
        self.assertEqual((self.html.count('calc:true'),self.html.count('calc:false')),(2,18))

    def test_complete_answer_key_and_unique_options(self):
        expected={'E1':0,'E2':1,'E3':2,'E4':0,'M1':0,'M2':1,'M3':0,'M4':1,'M5':1,'M6':1,'H1':0,'H2':1,'H3':1,'H4':2,'H5':0,'H6':0,'C1':2,'C2':2,'C3':1,'C4':2}
        found={i:int(a) for i,a in re.findall(r'\{id:"([EMHC]\d+)".*?,answer:(\d)',self.html)}
        self.assertEqual(found,expected)
        for block in re.findall(r'options:\[(.*?)\],answer:',self.html):
            options=re.findall(r'"(.*?)"',block)
            self.assertEqual((len(options),len(set(options))),(4,4))

    def test_mathematical_values_and_model_evidence(self):
        checks={
            'First differences: 4,8,12. Second differences: 4,4.':'y=2x²+2',
            'ŷ=2.1x+4.1':'Predictions are 4.1,6.2,8.3,10.4',
            'residuals are −0.1,−0.2,0.7,−0.4':'slope predicts about 2.1 output units per input unit',
            'e=16−14.5=<strong>1.5':'model underpredicts this observation by 1.5',
            'A has 1+1+1+1=4':'B has 9+0+4+1=14',
            'next first difference is 16':'next y is 27+16=43',
            'y=5·2^x':'initial value 5 and factor 2',
        }
        for result,evidence in checks.items():
            self.assertIn(result,self.html)
            self.assertIn(evidence,self.html)
        self.assertIn('Residual=observed−predicted=18−20=−2',self.html)
        self.assertIn('R² is not a complete argument',self.html)

    def test_screen_math_interaction_accessibility_responsive(self):
        self.assertIn('<meta name="echs-screen-count" content="64">',self.html)
        self.assertIn('const EXPECTED_SCREEN_COUNT=64',self.html)
        self.assertEqual(self.html.count('\n    add('),44)
        self.assertGreaterEqual(self.html.count('class="math" data-tex='),4)
        for signal in ('Learning outcomes','Prerequisite retrieval','Worked example','Student Turn','Difference-ratio comparison','Regression meaning','Structured regression workflow','Residual definition','Residual-pattern diagnoses','Interpret parameters across families','State assumptions','Interpolation and extrapolation','Limitation language','Differentiated practice','AP bridge','Exit ticket','mastery evidence','localStorage','exportWork','ArrowRight','data-check="','aria-live="polite"','details','Score all responses','name="viewport"','focus-visible','prefers-reduced-motion:reduce','@media(max-width:520px)','Skip to lesson content','role="img" aria-labelledby="','<title id=','<desc id=','modelsTitle','quadModelTitle','familyTitle','residTitle'):
            self.assertIn(signal.lower(),self.html.lower())
        self.assertIn('katex@0.16.11',self.html)
        unsafe=re.findall(r'(?<!\\)\\(?:frac|mathrm|circ|quad|text|sqrt|to|pm|le|ge|infty|cup|varnothing|Rightarrow|Longleftrightarrow|cdot)',self.html)
        self.assertEqual(unsafe,[])

    def test_originality_and_no_stale_content(self):
        lowered=self.html.lower()
        for prohibited in ('question-bank/official','private question','college board question','credential','answer token','pearson','lorem ipsum','eye-height adjustment','angle of depression','radical equations','synthetic division','function toolkit synthesis'):
            self.assertNotIn(prohibited,lowered)

    def test_calculator_and_no_calculator_labels_meaningful(self):
        self.assertIn('Calculator permitted',self.html)
        self.assertIn('No calculator',self.html)
        self.assertIn('keep enough digits',self.html.lower())
        self.assertIn('round only reported contextual results',self.html.lower())
        self.assertIn('units',self.html.lower())

if __name__=='__main__': unittest.main()
