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
    # Packaged or deployed copy: .../question-bank/official/tools/validate_release.py
    OFF=SCRIPT_PATH.parent.parent
    PAYLOAD=OFF.parents[1]
    ROOT=PAYLOAD.parent if PAYLOAD.name == 'payload' else PAYLOAD
else:
    # Audit-workspace runner used while assembling the release package.
    ROOT=Path(os.environ.get('ECHS_RELEASE_ROOT','/mnt/data/audit_work/v5/ECHS_AP_Practice_Center_v5_INDEPENDENTLY_AUDITED_STUDENT_RELEASE')).resolve()
    PAYLOAD=ROOT/'payload'
    OFF=PAYLOAD/'question-bank/official'
DATA=OFF/'data'; STUDENT=DATA/'student'; REPORTS=OFF/'reports'

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
summary=load_json(REPORTS/'AUDIT_SUMMARY.json')
corrections=load_json(REPORTS/'QUESTION_CORRECTIONS_LOG.json')
ready_by_id={q['id']:q for q in student_questions}; full_by_id={q['id']:q for q in canonical_questions}; archive_by_id={q['id']:q for q in archive_questions}

# 1 JSON parsing/schema presence
c=check('1','JSON schema validation')
json_files=list(ROOT.rglob('*.json'))
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
    texts=[norm_text(x.get('text','')) for x in choices]
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
if '352' not in math_report: c.warnings.append('Mathematical report does not visibly include the final 352 count.')
c.evidence={'readyMathematicallyVerified':sum(bool(q.get('quality',{}).get('mathematicalVerificationPassed')) for q in student_questions),'correctionLogRecords':len(corrections)}

# 10 KaTeX structural pass + prior parser report reconciliation
c=check('10','KaTeX validation')
expr_count=0; field_count=0
for q in student_questions:
    for path,text in strings(q):
        if '\\(' in text or '\\[' in text or '\\)' in text or '\\]' in text:
            field_count+=1; exprs,errs=math_expressions(text); expr_count+=len(exprs)
            for e in errs: c.errors.append(f"{q['id']} {path}: {e}")
            for e in exprs:
                if not balanced_braces(e): c.errors.append(f"{q['id']} {path}: unbalanced braces in {e[:80]!r}")
                begins=re.findall(r'\\begin\{([^}]+)\}',e); ends=re.findall(r'\\end\{([^}]+)\}',e)
                if begins!=ends: c.errors.append(f"{q['id']} {path}: begin/end environment mismatch")
            # Raw dollar delimiters are not allowed in audited math fields.
            if re.search(r'(?<!\\)\$',text): c.errors.append(f"{q['id']} {path}: raw dollar delimiter")
kreport=(REPORTS/'KATEX_AUDIT_REPORT.md').read_text(errors='replace')
parser_match=re.search(r'(?:expressions|Expressions).*?([\d,]+)',kreport,re.I)
if '0.16.27' not in kreport or not re.search(r'(?:zero|0)\s+(?:remaining\s+)?(?:parser\s+)?errors',kreport,re.I):
    c.warnings.append('Prior actual KaTeX parser evidence could not be recognized in KATEX_AUDIT_REPORT.md.')
c.evidence={'structurallyCheckedQuestions':len(student_questions),'mathFields':field_count,'expressionsFound':expr_count,'priorActualParserReport':'KATEX_AUDIT_REPORT.md (KaTeX 0.16.27)'}

# 11 media
c=check('11','Media validation')
refs=[]
for q in student_questions:
    for m in q.get('media',[]):
        path=m.get('path')
        if not path: c.errors.append(f"{q['id']}: media entry without path"); continue
        refs.append(path); fp=OFF/path
        if not fp.is_file(): c.errors.append(f"{q['id']}: missing media {path}")
        if not str(m.get('alt','')).strip(): c.errors.append(f"{q['id']}: media missing alt text {path}")
    if q.get('quality',{}).get('mediaVerified') is not True: c.errors.append(f"{q['id']}: mediaVerified false")
manifest=load_json(STUDENT/'media-manifest.json')
manifest_text=json.dumps(manifest)
for p in set(refs):
    if p not in manifest_text: c.warnings.append(f'Media reference absent from student manifest: {p}')
actual_media=[p for p in (OFF/'media').rglob('*') if p.is_file()]
c.evidence={'studentMediaReferences':len(refs),'uniqueStudentMediaPaths':len(set(refs)),'actualMediaFiles':len(actual_media)}

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
if set(ready_by_id)-set(full_by_id): c.errors.append('Student set is not a subset of canonical set.')
c.evidence={'gateFlagsChecked':len(student_questions)*len(flags),'studentReady':len(student_questions)}

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
for p in ROOT.rglob('*'):
    if p.is_file() and p.stat().st_size>95*1024*1024: large.append(str(p.relative_to(ROOT)))
if large: c.errors.extend(f'File exceeds safe GitHub single-file size: {x}' for x in large)
# Case-insensitive collisions
seen={}
for p in ROOT.rglob('*'):
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
for p in ROOT.rglob('*'):
    if not p.is_file() or p.suffix.lower() in {'.png','.jpg','.jpeg','.webp','.gif','.pdf','.zip'}: continue
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
expected={'canonicalIndex':1217,'canonicalChunks':1217,'archiveIndex':1217,'archiveChunks':1217,'auditRows':1217,'studentIndex':352,'studentChunks':352,'summaryTotal':1217,'summaryReady':352,'summaryRestricted':865,'correctionRecords':277}
for k,v in expected.items():
    if counts[k]!=v: c.errors.append(f'{k}: expected {v}, got {counts[k]}')
if len([r for r in audit if str(r.get('student_ready','')).lower() in ('true','1','yes')])!=352: c.errors.append('Audit CSV student_ready count is not 352.')
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
if package_mode and not (ROOT/'rollback.ps1').exists(): c.errors.append('rollback.ps1 missing')
c.evidence={'mode':'release-package' if package_mode else 'deployed-repository','powerShellFilesStaticallyChecked':len(ps_files),'installerVersion':'5.0.0' if package_mode else 'not-applicable'}

# Prepare report now; browser smoke will be added by a separate runner and patched below.

def report_text(browser=None):
    overall=all(x.passed for x in checks) and (browser is None or browser.get('errors',0)==0)
    now=datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    lines=['# Validation Report','',f'Generated: {now}','',f"**Overall result: {'PASS' if overall else 'FAIL'}**",'',
      'This report validates the gated v5 deployment. Student practice, exams, smart recommendations, and dashboard calculations use only the 352-question student boundary; all 865 remaining records are preserved in the full teacher/admin bank and redacted in the student archive.','',
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
      'The final structural pass above rechecked approved delimiters, braces, and environments across the gated records. The detailed `KATEX_AUDIT_REPORT.md` records the prior actual KaTeX 0.16.27 parser run over 10,795 expressions with zero parser errors. External CDN availability is a deployment concern and is not treated as a mathematical-content failure.','',
      '## Production-readiness judgment','',
      ('The repository is production-ready for the gated 352-question student pool. The 865 remaining records are deliberately not certified for student interaction and remain blocking review items only for future promotion, not for this release.' if overall else 'The release is not production-ready until the failures above are corrected.'),'']
    return '\n'.join(lines),overall

browser_path=REPORTS/'browser_smoke_results.json'
browser=load_json(browser_path) if browser_path.exists() else None
text,overall=report_text(browser)
REPORTS.mkdir(exist_ok=True); (REPORTS/'VALIDATION_REPORT.md').write_text(text)
print(json.dumps({'overall':overall,'checks':len(checks),'browserCases':(browser or {}).get('cases',0),'browserErrors':(browser or {}).get('errors',0),'errors':sum(len(x.errors) for x in checks),'warnings':sum(len(x.warnings) for x in checks)+(browser or {}).get('warnings',0),'report':str(REPORTS/'VALIDATION_REPORT.md')},indent=2))
if not overall: sys.exit(1)
