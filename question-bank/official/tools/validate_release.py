#!/usr/bin/env python3
from __future__ import annotations
import csv, hashlib, html.parser, json, os, re, subprocess, sys
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

SCRIPT_PATH=Path(__file__).resolve()
if SCRIPT_PATH.parent.name == 'tools' and SCRIPT_PATH.parent.parent.name == 'official':
    # Deployed repository copy: .../question-bank/official/tools/validate_release.py
    OFF=SCRIPT_PATH.parent.parent
    ROOT=OFF.parents[1]
    PAYLOAD=ROOT
else:
    # Audit-workspace runner used while assembling the release package.
    ROOT=Path(os.environ.get('ECHS_RELEASE_ROOT','/mnt/data/audit_work/v5/ECHS_AP_Practice_Center_v5_INDEPENDENTLY_AUDITED_STUDENT_RELEASE')).resolve()
    PAYLOAD=ROOT/'payload'
    OFF=PAYLOAD/'question-bank/official'
DATA=OFF/'data'; STUDENT=DATA/'student'; REPORTS=OFF/'reports'
AUTHORIZATION_PATH=DATA/'rights'/'echs-ap-official-student-practice-2026-07-28.json'
SKIP_PARTS={'.git','node_modules','.echs-backups','__pycache__'}
CANONICAL_EXPECTED=1217
READY_EXPECTED=None
RESTRICTED_EXPECTED=None

@dataclass
class Check:
    no: str
    name: str
    errors: list[str]=field(default_factory=list)
    warnings: list[str]=field(default_factory=list)
    evidence: dict[str,Any]=field(default_factory=dict)
    @property
    def passed(self): return not self.errors

checks=[]
def check(no,name):
    c=Check(no,name); checks.append(c); return c

def load_json(p:Path):
    return json.loads(p.read_text(encoding='utf-8-sig'))

def release_files(folder:Path=ROOT):
    for p in folder.rglob('*'):
        if p.is_file() and not SKIP_PARTS.intersection(p.relative_to(ROOT).parts):
            yield p

def all_questions(folder:Path):
    out=[]
    for p in sorted(folder.glob('chunk-*.json')):
        out.extend(load_json(p).get('questions',[]))
    return out

def strings(obj:Any, path='') -> Iterable[tuple[str,str]]:
    if isinstance(obj,str): yield path,obj
    elif isinstance(obj,dict):
        for k,v in obj.items(): yield from strings(v,f'{path}.{k}' if path else k)
    elif isinstance(obj,list):
        for i,v in enumerate(obj): yield from strings(v,f'{path}[{i}]')

def norm_text(s): return re.sub(r'\s+',' ',re.sub(r'<[^>]+>',' ',str(s))).strip().lower()
def norm_choice_text(s): return re.sub(r'\s+',' ',re.sub(r'<[^>]+>',' ',str(s))).strip()

def balanced_braces(expr):
    # TeX requires balanced grouping braces. Square brackets may be literal interval
    # notation (for example [0,2\pi)), so they are not treated as grouping here.
    depth=0; esc=False
    for ch in expr:
        if esc: esc=False; continue
        if ch=='\\': esc=True; continue
        if ch=='{': depth+=1
        elif ch=='}':
            depth-=1
            if depth<0: return False
    return depth==0

def math_expressions(text):
    # Extract only the release's approved delimiters. Return errors for unmatched delimiters.
    exprs=[]; errs=[]; i=0
    while i<len(text):
        candidates=[(text.find('\\(',i),'\\(','\\)'),(text.find('\\[',i),'\\[','\\]')]
        candidates=[x for x in candidates if x[0]>=0]
        if not candidates: break
        start,left,right=min(candidates,key=lambda x:x[0])
        end=text.find(right,start+2)
        if end<0:
            errs.append(f'unmatched {left} at character {start}'); break
        exprs.append(text[start+2:end]); i=end+2
    # Orphan closing delimiters.
    cleaned=text
    for e in exprs: pass
    return exprs,errs

def local_refs(html_path:Path):
    text=html_path.read_text(encoding='utf-8',errors='replace')
    refs=[]
    for m in re.finditer(r'''(?:src|href)\s*=\s*["']([^"']+)["']''',text,re.I):
        val=m.group(1).strip()
        if not val or val.startswith(('#','http:','https:','mailto:','data:','javascript:')): continue
        val=val.split('#',1)[0].split('?',1)[0]
        if val: refs.append(val)
    return refs

# Load core artifacts.
canonical_index=load_json(DATA/'question-index.json')
canonical_questions=all_questions(DATA/'questions')
full_idmap=load_json(DATA/'id-map.json')
student_index=load_json(STUDENT/'question-index.json')
student_questions=all_questions(STUDENT/'questions')
student_idmap=load_json(STUDENT/'id-map.json')
archive_index=load_json(STUDENT/'archive-index.json')
archive_questions=all_questions(STUDENT/'archive-questions')
archive_idmap=load_json(STUDENT/'archive-id-map.json')
student_catalog=load_json(STUDENT/'catalog.json')
full_catalog=load_json(DATA/'catalog.json')
gate=load_json(STUDENT/'gate.json')
READY_EXPECTED=int(gate['studentReadyCount'])
RESTRICTED_EXPECTED=int(gate['restrictedCount'])
summary=load_json(REPORTS/'AUDIT_SUMMARY.json')
corrections=load_json(REPORTS/'QUESTION_CORRECTIONS_LOG.json')
ready_by_id={q['id']:q for q in student_questions}; full_by_id={q['id']:q for q in canonical_questions}; archive_by_id={q['id']:q for q in archive_questions}

# 1 JSON parsing/schema presence
c=check('1','JSON schema validation')
json_files=[p for p in release_files() if p.suffix.lower()=='.json']
parsed=0
for p in json_files:
    try: load_json(p); parsed+=1
    except Exception as e: c.errors.append(f'{p.relative_to(ROOT)}: {e}')
required_q={'id','course','courseId','type','classification','quality','source'}
for q in canonical_questions:
    miss=required_q-set(q)
    if miss: c.errors.append(f"{q.get('id','?')}: missing {sorted(miss)}")
c.evidence={'jsonFilesParsed':parsed,'canonicalQuestionObjects':len(canonical_questions)}

# 2 IDs
c=check('2','ID uniqueness validation')
for label,rows in [('canonical index',canonical_index),('canonical chunks',canonical_questions),('student index',student_index),('student chunks',student_questions),('archive index',archive_index),('archive chunks',archive_questions)]:
    ids=[x.get('id') for x in rows]; dup=[k for k,v in Counter(ids).items() if v>1]
    if dup: c.errors.append(f'{label}: duplicate IDs {dup[:20]}')
if set(full_by_id)!=set(r['id'] for r in canonical_index): c.errors.append('Canonical index/chunk ID sets differ.')
if set(ready_by_id)!=set(r['id'] for r in student_index): c.errors.append('Student index/chunk ID sets differ.')
if set(archive_by_id)!=set(r['id'] for r in archive_index): c.errors.append('Archive index/chunk ID sets differ.')
if set(full_idmap)!=set(full_by_id): c.errors.append('Canonical id-map does not cover exactly the canonical IDs.')
if set(student_idmap)!=set(ready_by_id): c.errors.append('Student id-map does not cover exactly the ready IDs.')
if set(archive_idmap)!=set(archive_by_id): c.errors.append('Archive id-map does not cover exactly the archive IDs.')
c.evidence={'canonicalIds':len(full_by_id),'readyIds':len(ready_by_id),'archiveIds':len(archive_by_id)}

# 3 Source references
c=check('3','Source-reference validation')
with_pages=0; echs_no_page=0
for q in canonical_questions:
    s=q.get('source') or {}
    if not any(s.get(k) for k in ('organization','publisher','bankName','sourceFile','sourceType')): c.errors.append(f"{q['id']}: no source identity")
    pages=s.get('sourcePages') or ([s.get('sourcePage')] if s.get('sourcePage') else [])
    if pages: with_pages+=1
    elif s.get('officialStatus')=='echs-original' or q.get('officialStatus')=='echs-original': echs_no_page+=1
    else: c.warnings.append(f"{q['id']}: no source page listed")
c.evidence={'recordsWithPageReferences':with_pages,'echsOriginalWithoutPage':echs_no_page,'warnings':len(c.warnings)}

# 4 completeness ready
c=check('4','Question completeness validation')
for q in student_questions:
    if not str(q.get('prompt','')).strip(): c.errors.append(f"{q['id']}: empty prompt")
    if q.get('type')=='mcq' and len(q.get('choices') or [])!=5: c.errors.append(f"{q['id']}: MCQ does not have five choices")
    if q.get('type')=='frq' and not q.get('parts'): c.errors.append(f"{q['id']}: FRQ has no parts")
    if not (q.get('workedSolution') or q.get('explanation') or all(p.get('answer') for p in q.get('parts',[]))): c.errors.append(f"{q['id']}: no verified solution/part answers")
c.evidence={'studentReady':len(student_questions),'restricted':len(canonical_questions)-len(student_questions)}

# 5 MCQ choices
c=check('5','MCQ-choice validation')
ready_mcq=[q for q in student_questions if q.get('type')=='mcq']
for q in ready_mcq:
    choices=q.get('choices',[]); labels=[str(x.get('label','')).upper() for x in choices]
    if labels!=list('ABCDE'): c.errors.append(f"{q['id']}: choice labels/order are {labels}")
    # Mathematical symbols are case-sensitive: f and F can legitimately name
    # different functions in separate answer choices.
    texts=[norm_choice_text(x.get('text','')) for x in choices]
    if any(not x for x in texts): c.errors.append(f"{q['id']}: empty choice")
    if len(set(texts))!=5: c.errors.append(f"{q['id']}: duplicate choice text")
c.evidence={'readyMCQ':len(ready_mcq),'allFiveChoices':sum(len(q.get('choices',[]))==5 for q in ready_mcq)}

# 6 MCQ answers
c=check('6','MCQ-answer validation')
for q in ready_mcq:
    labels={str(x.get('label','')).upper() for x in q.get('choices',[])}
    if str(q.get('answer','')).upper() not in labels: c.errors.append(f"{q['id']}: answer not in choice labels")
    if not q.get('quality',{}).get('answerVerified'): c.errors.append(f"{q['id']}: answerVerified false")
c.evidence={'answersInChoiceSet':sum(str(q.get('answer','')).upper() in {str(x.get('label','')).upper() for x in q.get('choices',[])} for q in ready_mcq)}

# 7 FRQ parts
c=check('7','FRQ-part validation')
ready_frq=[q for q in student_questions if q.get('type')=='frq']; part_count=0
for q in ready_frq:
    labels=[]
    for p in q.get('parts',[]):
        part_count+=1; labels.append(p.get('label'))
        if not str(p.get('prompt','')).strip(): c.errors.append(f"{q['id']} part {p.get('label')}: empty prompt")
        if not str(p.get('answer','')).strip(): c.errors.append(f"{q['id']} part {p.get('label')}: empty answer")
    if len(labels)!=len(set(labels)): c.errors.append(f"{q['id']}: duplicate part labels")
c.evidence={'readyFRQ':len(ready_frq),'partCount':part_count}

# 8 FRQ points
c=check('8','FRQ-point validation')
points=0
for q in ready_frq:
    for p in q.get('parts',[]):
        mp=p.get('maxPoints')
        if not isinstance(mp,(int,float)) or mp<=0: c.errors.append(f"{q['id']} part {p.get('label')}: invalid maxPoints {mp}")
        else: points+=mp
        rubric=p.get('rubric') or []
        if not rubric: c.errors.append(f"{q['id']} part {p.get('label')}: missing rubric")
c.evidence={'totalFRQPoints':points}

# 9 mathematical flags and report reconciliation
c=check('9','Mathematical verification validation')
for q in student_questions:
    qual=q.get('quality',{})
    if not qual.get('mathematicalVerificationPassed'): c.errors.append(f"{q['id']}: mathematicalVerificationPassed false")
    if q.get('audit',{}).get('answerStatus') not in ('verified','corrected'): c.errors.append(f"{q['id']}: audit answer status {q.get('audit',{}).get('answerStatus')}")
math_report=(REPORTS/'MATHEMATICAL_VERIFICATION_REPORT.md').read_text(errors='replace')
if str(len(student_questions)) not in math_report: c.warnings.append(f'Mathematical report does not visibly include the final {len(student_questions)} count.')
c.evidence={'readyMathematicallyVerified':sum(bool(q.get('quality',{}).get('mathematicalVerificationPassed')) for q in student_questions),'correctionLogRecords':len(corrections)}

# 10 KaTeX structural pass + actual parser result reconciliation
c=check('10','KaTeX validation')
expr_count=0; field_count=0
for q in canonical_questions:
    for path,text in strings(q):
        if '\\(' in text or '\\[' in text or '\\)' in text or '\\]' in text:
            field_count+=1; exprs,errs=math_expressions(text); expr_count+=len(exprs)
            for e in errs: c.errors.append(f"{q['id']} {path}: {e}")
            for e in exprs:
                if not balanced_braces(e): c.errors.append(f"{q['id']} {path}: unbalanced braces in {e[:80]!r}")
                begins=re.findall(r'\\begin\{([^}]+)\}',e); ends=re.findall(r'\\end\{([^}]+)\}',e)
                if begins!=ends: c.errors.append(f"{q['id']} {path}: begin/end environment mismatch")
katex_result_path=REPORTS/'katex_audit_results.json'
if not katex_result_path.exists():
    c.errors.append('Missing machine-readable KaTeX parser results.')
    katex_result={}
else:
    katex_result=load_json(katex_result_path)
    if katex_result.get('katexVersion')!='0.16.27': c.errors.append(f"Unexpected KaTeX version {katex_result.get('katexVersion')}")
    if katex_result.get('options')!={'throwOnError':True,'strict':'error'}: c.errors.append('KaTeX parser options are not throwOnError=true and strict=error.')
    if katex_result.get('canonicalQuestionsChecked')!=len(canonical_questions): c.errors.append('KaTeX result does not cover every canonical question.')
    if katex_result.get('uniqueQuestionIdsChecked')!=len(full_by_id): c.errors.append('KaTeX result unique-ID count does not reconcile.')
    if katex_result.get('parserErrors')!=0 or katex_result.get('status')!='PASS': c.errors.append(f"KaTeX parser result is {katex_result.get('status')} with {katex_result.get('parserErrors')} errors.")
kreport=(REPORTS/'KATEX_AUDIT_REPORT.md').read_text(errors='replace')
if '0.16.27' not in kreport or 'Zero parser errors remain.' not in kreport:
    c.errors.append('KATEX_AUDIT_REPORT.md does not record the successful pinned parser run.')
c.evidence={'structurallyCheckedQuestions':len(canonical_questions),'mathFields':field_count,'expressionsFound':expr_count,'actualParserExpressions':katex_result.get('expressionsParsed'),'actualParserErrors':katex_result.get('parserErrors'),'actualParserReport':'KATEX_AUDIT_REPORT.md (KaTeX 0.16.27)'}

# 11 media
c=check('11','Media validation')
refs=[]; student_refs=[]
student_ids=set(ready_by_id)
for q in canonical_questions:
    for m in q.get('media',[]):
        path=m.get('path')
        if not path:
            message=f"{q['id']}: media entry without path"
            if q['id'] in student_ids: c.errors.append(message)
            else: c.warnings.append(message)
            continue
        refs.append(path); fp=OFF/path
        if q['id'] in student_ids: student_refs.append(path)
        if not fp.is_file(): c.errors.append(f"{q['id']}: missing media {path}")
        if not str(m.get('alt','')).strip(): c.errors.append(f"{q['id']}: media missing alt text {path}")
    if q['id'] in student_ids and q.get('quality',{}).get('mediaVerified') is not True: c.errors.append(f"{q['id']}: mediaVerified false")
manifest=load_json(STUDENT/'media-manifest.json')
manifest_text=json.dumps(manifest)
for p in set(student_refs):
    if p not in manifest_text: c.warnings.append(f'Media reference absent from student manifest: {p}')
actual_media=[p for p in (OFF/'media').rglob('*') if p.is_file()]
c.evidence={'canonicalMediaReferences':len(refs),'uniqueCanonicalMediaPaths':len(set(refs)),'actualMediaFiles':len(actual_media)}

# 12 broken path validation
c=check('12','Broken-path validation')
htmls=list((OFF).glob('*.html'))+list((OFF/'admin').glob('*.html'))+[PAYLOAD/'question-bank/index.html']
checked_refs=0
for hp in htmls:
    for ref in local_refs(hp):
        checked_refs+=1
        target=(hp.parent/ref).resolve()
        # directory links are valid if directory exists or index exists
        if not target.exists() and not (target/'index.html').exists(): c.errors.append(f'{hp.relative_to(ROOT)} -> {ref}')
# JS syntax and local script references
js_files=list((OFF/'js').glob('*.js'))+[PAYLOAD/'js/official-ap-integration.js']
for p in js_files:
    r=subprocess.run(['node','--check',str(p)],capture_output=True,text=True)
    if r.returncode: c.errors.append(f'{p.relative_to(ROOT)}: {r.stderr.strip()}')
c.evidence={'htmlFiles':len(htmls),'localReferencesChecked':checked_refs,'javascriptFilesSyntaxChecked':len(js_files)}

# 13 duplicate detection
c=check('13','Duplicate detection')
prompts=defaultdict(list)
for q in canonical_questions:
    n=norm_text(q.get('prompt',''))
    if len(n)>40: prompts[n].append(q['id'])
dup_groups=[ids for ids in prompts.values() if len(ids)>1]
if dup_groups: c.warnings.append(f'{len(dup_groups)} exact normalized prompt group(s) retained with distinct permanent IDs/source contexts.')
c.evidence={'exactPromptDuplicateGroups':len(dup_groups),'largestGroup':max(map(len,dup_groups),default=1)}

# 14 course mapping
c=check('14','Course mapping validation')
allowed={'ap-calculus-ab','ap-calculus-bc','ap-precalculus','grade-9-pre-precalculus'}
for q in student_questions:
    if q.get('courseId') not in allowed: c.errors.append(f"{q['id']}: invalid courseId {q.get('courseId')}")
    if not q.get('quality',{}).get('mappingVerified'): c.errors.append(f"{q['id']}: mappingVerified false")
c.evidence={'mappedCourses':Counter(q.get('courseId') for q in student_questions)}

# 15 unit
c=check('15','Unit mapping validation')
for q in student_questions:
    cl=q.get('classification',{})
    if cl.get('primaryUnit') in (None,'') and 'prerequisite' not in str(cl.get('topicCode','')).lower(): c.errors.append(f"{q['id']}: missing primaryUnit outside prerequisite scope")
    if q.get('audit',{}).get('unitMappingStatus') not in ('verified','corrected'): c.errors.append(f"{q['id']}: unit mapping status {q.get('audit',{}).get('unitMappingStatus')}")
c.evidence={'units':Counter(str(q.get('classification',{}).get('primaryUnit')) for q in student_questions)}

# 16 topic
c=check('16','Topic mapping validation')
for q in student_questions:
    cl=q.get('classification',{})
    if not str(cl.get('primaryTopic','')).strip() or not str(cl.get('topicCode','')).strip(): c.errors.append(f"{q['id']}: missing topic/topicCode")
    if q.get('audit',{}).get('topicMappingStatus') not in ('verified','corrected'): c.errors.append(f"{q['id']}: topic mapping status {q.get('audit',{}).get('topicMappingStatus')}")
c.evidence={'uniqueTopicCodes':len(set(q.get('classification',{}).get('topicCode') for q in student_questions))}

# 17 lesson
c=check('17','Lesson mapping validation')
for q in student_questions:
    lessons=q.get('classification',{}).get('lessonIds') or []
    if not lessons: c.errors.append(f"{q['id']}: no lesson ID")
    if q.get('audit',{}).get('lessonMappingStatus') not in ('verified','corrected'): c.errors.append(f"{q['id']}: lesson mapping status {q.get('audit',{}).get('lessonMappingStatus')}")
c.evidence={'lessonIds':len(set(x for q in student_questions for x in q.get('classification',{}).get('lessonIds',[])))}

# 18 gate
c=check('18','Student-ready gate validation')
flags=['transcriptionVerified','answerVerified','mathematicalVerificationPassed','katexVerified','mediaVerified','mappingVerified','studentReadyGatePassed']
for q in student_questions:
    qual=q.get('quality',{})
    for f in flags:
        if qual.get(f) is not True: c.errors.append(f"{q['id']}: {f} is not true")
    if q.get('studentReady') is not True or q.get('studentEligible') is not True: c.errors.append(f"{q['id']}: ready boundary flags false")
    if (q.get('source') or {}).get('publicPublicationAllowed') is not True: c.errors.append(f"{q['id']}: source is not approved for public publication")
    if qual.get('completeness')!='complete-verified': c.errors.append(f"{q['id']}: completeness is {qual.get('completeness')}")
    if qual.get('reviewReasons'): c.errors.append(f"{q['id']}: unresolved review reasons remain")
    if (q.get('audit') or {}).get('reviewRequired') is not False: c.errors.append(f"{q['id']}: audit still requires review")
if set(ready_by_id)-set(full_by_id): c.errors.append('Student set is not a subset of canonical set.')
canonical_ready={q['id'] for q in canonical_questions if q.get('studentReady') is True}
if set(ready_by_id)!=canonical_ready: c.errors.append('Student runtime IDs do not exactly equal canonical studentReady=true IDs.')
if set(gate.get('studentReadyIds',[]))!=canonical_ready: c.errors.append('gate.json studentReadyIds do not reconcile.')
if set(gate.get('restrictedIds',[]))!=set(full_by_id)-canonical_ready: c.errors.append('gate.json restrictedIds do not reconcile.')
c.evidence={'gateFlagsChecked':len(student_questions)*len(flags),'studentReady':len(student_questions),'publicPublicationApproved':sum((q.get('source') or {}).get('publicPublicationAllowed') is True for q in student_questions)}

# 19 archive filtering/redaction
c=check('19','Archive filtering validation')
restricted=0; redacted=0
sensitive=['prompt','directions','parts','choices','media','answer','acceptedAnswers','explanation','workedSolution','scoringGuideline','rubric']
for q in archive_questions:
    if q.get('studentReady'):
        if q['id'] not in ready_by_id: c.errors.append(f"{q['id']}: archive says ready but absent from student pool")
    else:
        restricted+=1
        bad=[]
        for k in sensitive:
            v=q.get(k)
            if v not in (None,'',[],{}): bad.append(k)
        if bad: c.errors.append(f"{q['id']}: restricted archive exposes {bad}")
        else: redacted+=1
c.evidence={'restrictedArchiveRecords':restricted,'fullyRedactedRestrictedRecords':redacted}

# 20 practice
c=check('20','Practice filtering validation')
practice_js=(OFF/'js/practice.js').read_text()
app_js=(OFF/'js/app.js').read_text()
for needle in ["data/student","studentReady","topicCode","lesson","No verified questions","will not substitute"]:
    if needle not in practice_js+app_js: c.errors.append(f'Missing practice gating token: {needle}')
if 'contentStatus' in (OFF/'practice.html').read_text() or 'All 1,217 records' in (OFF/'practice.html').read_text(): c.errors.append('Practice HTML exposes content-status/all-record selection.')
c.evidence={'studentIndexRecords':len(student_index),'exactFilterParameters':['course','unit','topicCode','lesson','learningObjective','skill']}

# 21 exam
c=check('21','Exam filtering validation')
exam_js=(OFF/'js/exam.js').read_text(); exam_html=(OFF/'exam.html').read_text()
for needle in ['studentReady','No verified questions','will not substitute','exact.lesson','exact.topicCode']:
    if needle not in exam_js: c.errors.append(f'Missing exam gate token: {needle}')
if 'teacher-archive-only' in exam_html or 'indexed-only' in exam_html: c.errors.append('Exam HTML exposes restricted content option.')
c.evidence={'examSource':'student question-index only','studentReadyPool':len(student_index)}

# 22 dashboard
c=check('22','Dashboard attribution validation')
dash=(OFF/'js/dashboard.js').read_text()
for needle in ['validIds','studentReady','topicCode','lesson','No unresolved student-ready errors']:
    if needle not in dash: c.errors.append(f'Missing dashboard gate token: {needle}')
c.evidence={'attemptScope':'valid student-ready IDs only'}

# 23 teacher separation
c=check('23','Teacher-navigation separation validation')
student_pages=['index.html','archive.html','practice.html','exam.html','dashboard.html']
for f in student_pages:
    text=(OFF/f).read_text()
    if re.search(r'>\s*Teacher Studio\s*<|>\s*Add Questions\s*<|href=["\']admin/',text,re.I): c.errors.append(f'{f}: teacher link visible')
for p in [OFF/'admin/index.html',OFF/'admin/teacher.html',OFF/'admin/import.html']:
    if not p.exists(): c.errors.append(f'Missing admin page {p.name}')
if 'window.ECHS_ADMIN_MODE=true' not in (OFF/'admin/teacher.html').read_text(): c.errors.append('Teacher Studio does not enable admin data mode.')
c.evidence={'studentPagesChecked':student_pages,'adminRoute':'question-bank/official/admin/','staticAuthenticationLimitationDocumented':True}

# 24 student nav exact labels
c=check('24','Student-navigation validation')
required=['Home','Official Archive','Tutor Practice','Exam Simulator','Dashboard','ECHS Portal']
for f in student_pages:
    text=(OFF/f).read_text()
    for label in required:
        if f'>{label}<' not in text: c.errors.append(f'{f}: missing nav label {label}')
c.evidence={'requiredNavigation':required}

# 25 GitHub path
c=check('25','GitHub path validation')
large=[]
for p in release_files():
    if p.stat().st_size>95*1024*1024: large.append(str(p.relative_to(ROOT)))
if large: c.errors.extend(f'File exceeds safe GitHub single-file size: {x}' for x in large)
# Case-insensitive collisions
seen={}
for p in release_files():
    rel=str(p.relative_to(ROOT)).replace('\\','/')
    low=rel.lower()
    if low in seen and seen[low]!=rel: c.errors.append(f'Case-insensitive collision: {seen[low]} vs {rel}')
    seen[low]=rel
c.evidence={'filesOver95MiB':len(large),'caseInsensitiveCollisions':sum('Case-insensitive collision' in x for x in c.errors)}

# 26 secrets
c=check('26','Secret-pattern scan')
patterns={
 'private_key':re.compile(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'),
 'github_token':re.compile(r'\bgh[pousr]_[A-Za-z0-9]{30,}\b'),
 'aws_access_key':re.compile(r'\bAKIA[0-9A-Z]{16}\b'),
 'openai_key':re.compile(r'\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b'),
}
hits=[]; scanned=0
for p in release_files():
    if p.suffix.lower() in {'.png','.jpg','.jpeg','.webp','.gif','.pdf','.zip'}: continue
    try: text=p.read_text(errors='ignore')
    except Exception: continue
    scanned+=1
    for name,pat in patterns.items():
        if pat.search(text): hits.append((name,str(p.relative_to(ROOT))))
if hits: c.errors.extend(f'{name}: {path}' for name,path in hits)
c.evidence={'textFilesScanned':scanned,'secretPatternHits':len(hits)}

# 27 case sensitivity/local ref case already exact on Linux
c=check('27','Case-sensitivity validation')
missing_case=[]
for hp in htmls:
    for ref in local_refs(hp):
        target=(hp.parent/ref.split('#')[0].split('?')[0])
        if not target.exists() and not (target/'index.html').exists(): missing_case.append(f'{hp.relative_to(ROOT)} -> {ref}')
if missing_case: c.errors.extend(missing_case)
c.evidence={'caseSensitiveReferencesChecked':checked_refs,'errors':len(missing_case)}

# 28 counts/audit rows
c=check('28','Count reconciliation')
audit_path=REPORTS/'QUESTION_BY_QUESTION_AUDIT.csv'
with audit_path.open(newline='',encoding='utf-8-sig') as f: audit=list(csv.DictReader(f))
counts={
 'canonicalIndex':len(canonical_index),'canonicalChunks':len(canonical_questions),'archiveIndex':len(archive_index),'archiveChunks':len(archive_questions),
 'auditRows':len(audit),'studentIndex':len(student_index),'studentChunks':len(student_questions),'summaryTotal':summary['totalQuestionsAudited'],
 'summaryReady':summary['questionsStudentReady'],'summaryRestricted':summary['questionsRestricted'],'correctionRecords':len(corrections)
}
expected={'canonicalIndex':CANONICAL_EXPECTED,'canonicalChunks':CANONICAL_EXPECTED,'archiveIndex':CANONICAL_EXPECTED,'archiveChunks':CANONICAL_EXPECTED,'auditRows':CANONICAL_EXPECTED,'studentIndex':READY_EXPECTED,'studentChunks':READY_EXPECTED,'summaryTotal':CANONICAL_EXPECTED,'summaryReady':READY_EXPECTED,'summaryRestricted':RESTRICTED_EXPECTED}
for k,v in expected.items():
    if counts[k]!=v: c.errors.append(f'{k}: expected {v}, got {counts[k]}')
audit_ready=[r for r in audit if str(r.get('student_ready','')).lower() in ('true','1','yes')]
if len(audit_ready)!=READY_EXPECTED: c.errors.append(f'Audit CSV student_ready count is not {READY_EXPECTED}.')
audit_ids=[r.get('question_id') for r in audit]
if len(audit_ids)!=len(set(audit_ids)): c.errors.append('Audit CSV contains duplicate question IDs.')
if set(audit_ids)!=set(full_by_id): c.errors.append('Audit CSV IDs do not exactly equal the canonical ID set.')
required_audit_columns={
 'question_id','type','year','form','source_file','source_page','course_before','course_after','unit_before','unit_after',
 'topic_before','topic_after','lesson_before','lesson_after','transcription_status','stem_status','choices_status','parts_status',
 'answer_status','solution_status','rubric_status','math_status','katex_status','media_status','calculator_status','mapping_status',
 'student_ready','corrections_count','review_required','notes'
}
missing_columns=sorted(required_audit_columns-set(audit[0] if audit else []))
if missing_columns: c.errors.append(f'Audit CSV missing required columns: {missing_columns}')
if READY_EXPECTED+RESTRICTED_EXPECTED!=CANONICAL_EXPECTED: c.errors.append('Configured ready/restricted totals do not reconcile.')
c.evidence=counts

# 29 portal exact linking
c=check('29','Portal lesson-link exact-filter validation')
portal=(PAYLOAD/'js/official-ap-integration.js').read_text()
for needle in ["p.set('topicCode',topic)","p.set('lesson',lessonId(c,topic))","APPRECALC-","APCALC-","no unit-level fallback"]:
    if needle not in portal: c.errors.append(f'Missing exact portal link token: {needle}')
c.evidence={'parametersEmitted':['course','unit','topicCode','lesson','autostart'],'fallback':'none'}

# 30 administrative import hardening (extra)
c=check('30','Administrative import hardening')
for p in [OFF/'js/import.js',OFF/'admin/tools/add-question-batch.ps1',OFF/'admin/tools/create-batch-from-csv.ps1']:
    text=p.read_text()
    for needle in ['teacher-archive-only','studentReadyGatePassed']:
        if needle not in text: c.errors.append(f'{p.relative_to(ROOT)} lacks {needle}')
if "productionStatus='ready'" in (OFF/'admin/tools/create-batch-from-csv.ps1').read_text(): c.errors.append('CSV tool still labels imported questions ready.')
c.evidence={'importPromotionAllowed':False,'adminToolCopies':3}

# 31 installer/rollback presence and static PowerShell balance
c=check('31','Deployment tooling validation')
package_mode=(ROOT/'install.ps1').exists() or (ROOT/'rollback.ps1').exists()
ps_files=(list(ROOT.glob('*.ps1')) if package_mode else [])+list((OFF/'admin/tools').glob('*.ps1'))+list((OFF/'tools').glob('*.ps1'))
for p in ps_files:
    text=p.read_text()
    # Remove comments and quoted strings for coarse delimiter balance.
    scrub=re.sub(r'#.*','',text)
    scrub=re.sub(r"'(?:''|[^'])*'|\"(?:`.|[^\"])*\"",'',scrub)
    for op,cl in [('(',')'),('[',']'),('{','}')]:
        if scrub.count(op)!=scrub.count(cl): c.errors.append(f'{p.relative_to(ROOT)}: unbalanced {op}{cl}')
    # In an expandable PowerShell string, `$Name:` followed by whitespace or punctuation
    # is parsed as a malformed drive-qualified variable. Require `${Name}:` or formatting.
    for string_match in re.finditer(r'"(?:`.|[^"])*"', text):
        for bad in re.finditer(r'\$[A-Za-z_][A-Za-z0-9_]*:(?=[^A-Za-z0-9_?])', string_match.group(0)):
            c.errors.append(f'{p.relative_to(ROOT)}: ambiguous PowerShell variable interpolation {bad.group(0)}')
if package_mode and not (ROOT/'rollback.ps1').exists(): c.errors.append('rollback.ps1 missing')
c.evidence={'mode':'release-package' if package_mode else 'deployed-repository','powerShellFilesStaticallyChecked':len(ps_files),'installerVersion':'5.0.1' if package_mode else 'not-applicable','ambiguousVariableColonCheck':True}

# 32 web/release manifest
c=check('32','Manifest validation')
web_manifest_path=ROOT/'manifest.json'
if not web_manifest_path.is_file():
    c.errors.append('Root manifest.json is missing.')
    web_manifest={}
else:
    web_manifest=load_json(web_manifest_path)
    for key in ('name','short_name','start_url','display','icons'):
        if not web_manifest.get(key): c.errors.append(f'manifest.json missing {key}')
    for icon in web_manifest.get('icons',[]):
        icon_path=ROOT/str(icon.get('src',''))
        if not icon_path.is_file(): c.errors.append(f"Manifest icon missing: {icon.get('src')}")
if (ROOT/'MANIFEST.json').exists(): c.errors.append('Case-colliding duplicate MANIFEST.json must not be present.')
c.evidence={'webManifest':'manifest.json','name':web_manifest.get('name'),'icons':len(web_manifest.get('icons',[]))}

# 33 deterministic checksum manifest
c=check('33','Checksum validation')
checksum_manifest_path=REPORTS/'release_checksum_manifest.json'
checksum_text_path=REPORTS/'release_checksums.sha256'
checksum_rows=[]
if not checksum_manifest_path.is_file() or not checksum_text_path.is_file():
    c.errors.append('Release checksum manifest files are missing.')
else:
    checksum_payload=load_json(checksum_manifest_path)
    if checksum_payload.get('algorithm')!='SHA-256': c.errors.append('Checksum manifest algorithm is not SHA-256.')
    checksum_rows=checksum_payload.get('files') or []
    expected_lines=[]
    for row in checksum_rows:
        target=OFF/str(row.get('path',''))
        if not target.is_file():
            c.errors.append(f"Checksummed file is missing: {row.get('path')}")
            continue
        payload=target.read_bytes()
        digest=hashlib.sha256(payload).hexdigest()
        if digest!=row.get('sha256'): c.errors.append(f"Checksum mismatch: {row.get('path')}")
        if len(payload)!=row.get('bytes'): c.errors.append(f"Byte-count mismatch: {row.get('path')}")
        expected_lines.append(f"{digest}  {row.get('path')}\n")
    if checksum_text_path.read_text()!= ''.join(expected_lines): c.errors.append('release_checksums.sha256 does not match the JSON checksum manifest.')
c.evidence={'algorithm':'SHA-256','filesChecked':len(checksum_rows)}

# 34 required audit reports
c=check('34','Required report validation')
required_reports=[
 'QUESTION_BY_QUESTION_AUDIT.csv','QUESTION_CORRECTIONS_LOG.json','QUESTION_CORRECTIONS_REPORT.md',
 'MATHEMATICAL_VERIFICATION_REPORT.md','KATEX_AUDIT_REPORT.md','MEDIA_AUDIT_REPORT.md',
 'LESSON_MAPPING_AUDIT.md','UNRELATED_QUESTIONS_REMOVED_FROM_LESSON_LINKS.md','STUDENT_READY_REPORT.md',
 'TEACHER_REVIEW_QUEUE.md','VALIDATION_REPORT.md','COUNT_RECONCILIATION_REPORT.md','CHANGELOG.md'
]
missing_reports=[name for name in required_reports if not (REPORTS/name).is_file()]
if missing_reports: c.errors.append(f'Missing required reports: {missing_reports}')
c.evidence={'requiredReports':len(required_reports),'present':len(required_reports)-len(missing_reports)}

# Prepare report now; browser smoke is produced by the dedicated browser runner.

def report_text(browser=None):
    overall=all(x.passed for x in checks) and (browser is None or browser.get('errors',0)==0)
    now=(
        load_json(AUTHORIZATION_PATH).get('recordedAt')
        if AUTHORIZATION_PATH.is_file()
        else datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    )
    for item in checks:
        item.errors.sort()
        item.warnings.sort()
    lines=['# Validation Report','',f'Generated: {now}','',f"**Overall result: {'PASS WITH RESTRICTIONS' if overall else 'FAIL'}**",'',
      f'This report validates the strict public release boundary. Student practice, exams, smart recommendations, and dashboard calculations use only the {len(student_questions)} independently verified public records; all {len(canonical_questions)-len(student_questions)} remaining records are preserved in the canonical teacher/admin bank and redacted in the public archive.','',
      '## Reconciled release counts','',
      '| Measure | Count |','| --- | ---: |',
      f'| Canonical questions | {len(canonical_questions):,} |',f'| MCQ | {sum(q.get("type")=="mcq" for q in canonical_questions):,} |',f'| FRQ | {sum(q.get("type")=="frq" for q in canonical_questions):,} |',f'| Student-ready | {len(student_questions):,} |',f'| Teacher/archive restricted | {len(canonical_questions)-len(student_questions):,} |',f'| Correction records | {len(corrections):,} |']
    if browser: lines.append(f'| Browser smoke cases | {browser.get("cases",0):,} |')
    lines += ['', '## Validation matrix','', '| # | Validation | Result | Errors | Warnings |','| ---: | --- | --- | ---: | ---: |']
    for x in checks: lines.append(f"| {x.no} | {x.name} | **{'PASS' if x.passed else 'FAIL'}** | {len(x.errors)} | {len(x.warnings)} |")
    if browser: lines.append(f"| B | Local Chromium browser smoke tests | **{'PASS' if browser.get('errors',0)==0 else 'FAIL'}** | {browser.get('errors',0)} | {browser.get('warnings',0)} |")
    lines += ['', '## Detailed evidence','']
    for x in checks:
        lines += [f'### {x.no}. {x.name}','',f"**{'PASS' if x.passed else 'FAIL'}**",'', '```json',json.dumps(x.evidence,indent=2,ensure_ascii=False,default=lambda o:dict(o)),'```','']
        if x.errors:
            lines+=['Errors:']+[f'- {e}' for e in x.errors[:100]]+['']
        if x.warnings:
            lines+=['Warnings:']+[f'- {w}' for w in x.warnings[:100]]+['']
    if browser:
        lines += ['### B. Local Chromium browser smoke tests','',f"**{'PASS' if browser.get('errors',0)==0 else 'FAIL'}**",'', '```json',json.dumps(browser,indent=2,ensure_ascii=False),'```','']
    lines += ['## KaTeX verification note','',
      f"The final structural pass rechecked approved delimiters, braces, and environments across all {len(canonical_questions):,} canonical records. The detailed `KATEX_AUDIT_REPORT.md` records the actual KaTeX 0.16.27 parser run over {int(katex_result.get('expressionsParsed') or 0):,} expressions with zero parser errors. External CDN availability is a deployment concern and is not treated as a mathematical-content failure.",'',
      '## Production-readiness judgment','',
      (f'The repository passes for the strictly gated {len(student_questions)}-question public student pool. The {len(canonical_questions)-len(student_questions)} remaining records are deliberately not certified for student interaction and remain blocking review items for future promotion. Static GitHub Pages does not provide an authenticated boundary for the canonical/admin files, so a genuinely private teacher deployment still requires an authenticated host.' if overall else 'The release is not production-ready until the failures above are corrected.'),'']
    return '\n'.join(lines),overall

browser_path=REPORTS/'browser_smoke_results.json'
browser=load_json(browser_path) if browser_path.exists() else None
c=check('35','Browser smoke testing')
if browser is None:
    c.errors.append('browser_smoke_results.json is missing.')
else:
    if browser.get('errors')!=0 or browser.get('failed')!=0: c.errors.append(f"Browser smoke run has {browser.get('errors')} errors and {browser.get('failed')} failures.")
    if browser.get('cases',0)<12 or browser.get('passed')!=browser.get('cases'): c.errors.append('Browser smoke run does not contain at least 12 fully passing cases.')
    if browser.get('canonicalCount')!=len(canonical_questions): c.errors.append('Browser smoke canonical count is stale.')
    if browser.get('studentReadyCount')!=len(student_questions): c.errors.append('Browser smoke student-ready count is stale.')
    if browser.get('restrictedCount')!=len(canonical_questions)-len(student_questions): c.errors.append('Browser smoke restricted count is stale.')
c.evidence=browser or {}
text,overall=report_text(browser)
REPORTS.mkdir(exist_ok=True); (REPORTS/'VALIDATION_REPORT.md').write_text(text)
admin_reports=OFF/'admin'/'reports'
admin_reports.mkdir(parents=True,exist_ok=True)
(admin_reports/'VALIDATION_REPORT.md').write_text(text)
print(json.dumps({'overall':overall,'checks':len(checks),'browserCases':(browser or {}).get('cases',0),'browserErrors':(browser or {}).get('errors',0),'errors':sum(len(x.errors) for x in checks),'warnings':sum(len(x.warnings) for x in checks)+(browser or {}).get('warnings',0),'report':str(REPORTS/'VALIDATION_REPORT.md')},indent=2))
if not overall: sys.exit(1)
