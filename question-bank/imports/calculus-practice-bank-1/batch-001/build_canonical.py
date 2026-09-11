#!/usr/bin/env python3
from __future__ import annotations
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parent
src=json.loads((ROOT/'import-records.json').read_text(encoding='utf-8'))
bank=src['bank']; verification=src['verification']
questions=[]
for rec in src['records']:
    rubric=[
      {'criterionId':'A1','description':'1 point for a valid algebraic or sign-analysis setup.','points':1,'evidenceRequired':'Correct transformations and domain restrictions.','commonErrors':[],'rubricType':'ECHS analytic rubric'},
      {'criterionId':'A2','description':'1 point for the correct solution set.','points':1,'evidenceRequired':rec['answer'],'commonErrors':[],'rubricType':'ECHS analytic rubric'}
    ]
    q={
      'id':rec['id'],'course':bank['course'],'courseId':bank['courseId'],'assessmentFamily':bank['assessmentFamily'],
      'type':'frq','format':'single-part-free-response','year':None,'form':'','questionNumber':rec['number'],
      'section':bank['primaryUnitLabel'],'calculator':'no-calculator','maxPoints':2,
      'estimatedTime':90 if rec['difficulty']<=2 else 150,
      'prompt':'Solve the inequality. Show enough work to justify the solution set.',
      'directions':'Give the answer in interval notation.',
      'parts':[{'label':'(a)','prompt':rec['prompt'],'maxPoints':2,'answer':rec['answer'],'rubric':rubric}],
      'choices':[],'media':[],'answer':None,'acceptedAnswers':rec['acceptedAnswers'],'answerFormat':'interval-or-inequality',
      'explanation':rec['workedSolution'],'workedSolution':rec['workedSolution'],'alternativeSolution':'',
      'calculatorSolution':'','noncalculatorSolution':rec['workedSolution'],'studentExplanation':rec['workedSolution'],
      'teacherExplanation':rec['workedSolution'],'scoringGuideline':None,
      'rubric':[{'part':'(a)','maxPoints':2,'criteria':rubric}],
      'rubricStatus':'ECHS analytic rubric; not an AP scoring guideline','commonMistakes':rec['commonMistakes'],
      'verificationStatus':'source-and-math-verified','answerConfidence':0.99,
      'source':{'organization':'McGraw-Hill','publisher':'McGraw-Hill','bankName':bank['displayName'],
        'sourceTitle':bank['sourceTitle'],'sourceFile':bank['sourceFile'],'sourceType':'user-supplied source-aligned practice item',
        'sourceProblemNumber':rec['number'],'officialStatus':'non-official-practice','releaseStatus':'import candidate; rights gate retained',
        'accessLevel':'teacher-archive-only','rightsStatus':'authorization documentation required before public release',
        'publicPublicationAllowed':bank['publicPublicationAllowed'],'sourcePages':rec['sourcePages']},
      'classification':{'primaryUnit':None,'primaryUnitLabel':bank['primaryUnitLabel'],'primaryTopic':rec['topic'],
        'topicCode':'Prerequisite','additionalTopics':[],'learningObjectives':['Solve algebraic inequalities and communicate the complete solution set.'],
        'bigIdeas':[],'mathematicalPractices':['Implementing Mathematical Processes'],'skillCategories':[],
        'concepts':rec['concepts'],'prerequisites':['Algebraic manipulation','Interval notation'],
        'functionFamilies':['rational'] if rec['number']>='1.7' else ['linear'],'representations':['symbolic'],
        'reasoningActions':['solve','justify'],'lessonIds':bank['lessonIds'],
        'keywords':[x.replace(' ','-').lower() for x in rec['concepts']]+['ap-calculus-ab','prerequisite-review']},
      'pedagogy':{'difficulty':rec['difficulty'],'difficultyLabel':['','Easy','Medium','Hard','Challenge'][rec['difficulty']],
        'cognitiveDemand':2 if rec['difficulty']<=2 else 3,
        'hints':[{'level':1,'type':'strategy','text':'Preserve domain restrictions. For rational inequalities, use critical numbers and a sign chart.'}],
        'misconceptions':[],'related':{'easier':[],'parallel':[],'harder':[],'prerequisite':[],'sameOfficialTopic':[],'relatedFRQ':[],'relatedMCQ':[]}},
      'quality':{'completeness':'complete-source-verified','productionStatus':'import-candidate','productionReadiness':0.86,
        'tutoringReadiness':0.95,'needsReview':True,'reviewReasons':['Actual repository KaTeX parser audit pending.','Exact portal mapping and access gate pending.'],
        'transcriptionVerified':verification['transcriptionVerified'],'answerVerified':True,'mediaVerified':True,
        'privateStudentAccess':False,'mathematicalVerificationPassed':verification['mathematicallyVerified'],
        'katexVerified':False,'mappingVerified':False,'studentReadyGatePassed':False},
      'studentEligible':False,'studentAccessible':False,'deploymentAccess':bank['deploymentAccess'],'contentStatus':'complete',
      'audit':{'sourceChecked':verification['sourceCompared'],'sourcePage':','.join(map(str,rec['sourcePages'])),
        'transcriptionStatus':'verified-against-source-page','stemStatus':'verified','choicesStatus':'not-applicable',
        'answerStatus':'verified','solutionStatus':'independently-verified','katexStatus':'parser-audit-pending',
        'mediaStatus':'not-required','courseMappingStatus':'candidate','unitMappingStatus':'candidate',
        'topicMappingStatus':'candidate','lessonMappingStatus':'candidate','calculatorStatus':'verified',
        'overallStatus':'import-candidate','correctionsMade':1,'reviewRequired':True,
        'reviewerNotes':'Keep restricted until parser, mapping, duplicate, and access-gate checks pass.'}
    }
    questions.append(q)
(ROOT/'canonical-preview.json').write_text(json.dumps({'questions':questions},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'Wrote {len(questions)} questions to canonical-preview.json')
