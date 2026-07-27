#!/usr/bin/env python3
"""Validate direct-linked ECHS private Blackboard packages without publishing content."""
from __future__ import annotations
import argparse,collections,hashlib,io,json,re,sys,zipfile
from pathlib import Path
ALLOWED_TYPES={'mcq','true_false','fill_blank','essay'}

def main()->int:
 parser=argparse.ArgumentParser();parser.add_argument('packages',nargs='*',type=Path);parser.add_argument('--root',type=Path);parser.add_argument('--registry',type=Path,default=Path('question-bank/private-sources/data/private-bank-registry.json'));parser.add_argument('--output-dir',type=Path,default=Path('.'));args=parser.parse_args()
 packages=list(args.packages)
 if args.root:packages.extend(sorted(args.root.glob('*-private-import.zip')))
 packages=sorted({path.resolve() for path in packages})
 if not packages:raise SystemExit('No private import packages were supplied')
 registry=json.loads(args.registry.read_text(encoding='utf-8')) if args.registry.is_file() else {};registry_by_code={row.get('bank_code'):row for row in registry.get('banks') or []}
 report={'schema_version':'1.1.0','status':'PASS','packages':[],'totals':{},'errors':[],'warnings':[]};all_ids=set();totals=collections.Counter()
 def error(message,bank=None,question=None):report['errors'].append({'message':message,**({'bank':bank} if bank else {}),**({'question_id':question} if question else {})})
 def warning(message,bank=None,question=None):report['warnings'].append({'message':message,**({'bank':bank} if bank else {}),**({'question_id':question} if question else {})})
 for package_path in packages:
  data=package_path.read_bytes();digest=hashlib.sha256(data).hexdigest()
  with zipfile.ZipFile(io.BytesIO(data)) as outer:
   bad=outer.testzip()
   if bad:error(f'Outer ZIP CRC failure: {bad}',package_path.name)
   roots={name.split('/',1)[0] for name in outer.namelist() if '/' in name}
   if len(roots)!=1:error(f'Package must have one root, found {sorted(roots)}',package_path.name);continue
   slug=next(iter(roots));manifest_name=f'{slug}/bank-manifest.json'
   if manifest_name not in outer.namelist():error('Missing bank-manifest.json',slug);continue
   manifest=json.loads(outer.read(manifest_name));code=manifest.get('bank_code') or slug;registry_row=registry_by_code.get(code) or {}
   if registry_row and registry_row.get('package_sha256')!=digest:error('Package SHA-256 does not match registry',code)
   if manifest.get('trust_default')!='publisher_key_direct' or manifest.get('student_visible') is not True or manifest.get('question_trust_review_required') is not False:error('Manifest does not use publisher-key direct lesson access',code)
   media_inventory={};media_files=0
   for rel in manifest.get('media_packages') or []:
    inner=f'{slug}/{rel}'
    if inner not in outer.namelist():error(f'Missing media package {rel}',code);continue
    chapter_match=re.search(r'chapter_(\d{2})\.zip$',rel);chapter=chapter_match.group(1) if chapter_match else None
    with zipfile.ZipFile(io.BytesIO(outer.read(inner))) as media_zip:
     bad_media=media_zip.testzip()
     if bad_media:error(f'Media ZIP {rel} CRC failure: {bad_media}',code)
     files={name.lstrip('/') for name in media_zip.namelist() if not name.endswith('/')};media_files+=len(files)
     if chapter:media_inventory[chapter]=files
   ids=[];pools=set();types=collections.Counter();mapping_counts=collections.Counter();readiness=collections.Counter();media_refs=0;essay_without_solution=0
   for chunk in manifest.get('chunks') or []:
    rel=chunk.get('file','');inner=f'{slug}/{rel}'
    if inner not in outer.namelist():error(f'Missing question chunk {rel}',code);continue
    payload=json.loads(outer.read(inner));questions=payload.get('questions') or []
    if chunk.get('questions') is not None and len(questions)!=chunk.get('questions'):error(f'Chunk {rel} count mismatch',code)
    for question in questions:
     qid=str(question.get('id') or '')
     if not qid:error('Question missing ID',code);continue
     if qid in all_ids:error('Duplicate question ID across packages',code,qid)
     all_ids.add(qid);ids.append(qid);pools.add(str(question.get('pool_uid') or ''))
     qtype=question.get('type');types[qtype]+=1
     if qtype not in ALLOWED_TYPES:error(f'Unsupported type {qtype}',code,qid)
     if not(question.get('prompt_text') or question.get('prompt_html')):error('Missing prompt',code,qid)
     choices=question.get('choices') or [];correct=question.get('correct_choice_ids') or [];choice_ids={str(row.get('id')) for row in choices}
     if qtype in {'mcq','true_false'} and (len(choices)<2 or not correct or not set(map(str,correct)).issubset(choice_ids)):error('Selected-response answer key is incomplete',code,qid)
     if qtype=='fill_blank' and not(question.get('accepted_answers') or []):error('Fill-blank answer key is missing',code,qid)
     if qtype=='essay' and not(question.get('solution_text') or question.get('solution_html')):essay_without_solution+=1;warning('Essay has no publisher solution',code,qid)
     trust=question.get('trust') or {};rights=question.get('rights') or {};metadata=question.get('metadata') or {}
     if trust.get('tier')!='publisher_key_direct' or trust.get('student_visible') is not True or trust.get('mapping_verified') is not True:error('Direct trust/mapping contract is incomplete',code,qid)
     if trust.get('manual_question_trust_required') is not False or trust.get('verification_basis')!='publisher-answer-key':error('Manual Trust bypass or publisher-key basis is missing',code,qid)
     if trust.get('mathematical_verified') is not False:warning('Independent mathematics audit should not be claimed',code,qid)
     if rights.get('student_publication_allowed') is not True or rights.get('public_web_publication_allowed') is not False:error('Authenticated/private rights contract is invalid',code,qid)
     if metadata.get('student_accessible') is not True or metadata.get('student_ready') is not True:error('Student practice metadata is disabled',code,qid)
     maps=question.get('course_mappings') or []
     if len(maps)!=2 or {row.get('course') for row in maps}!={'ap-precalculus','ib-math-ai'}:error('Question must have exactly two course mappings',code,qid)
     for mapping in maps:
      course=str(mapping.get('course'));unit=int(mapping.get('unit') or 0);lesson=mapping.get('lesson_key');skill=mapping.get('skill_key')
      if not lesson or not skill or mapping.get('mapping_verified') is not True:error(f'Incomplete direct mapping for {course}',code,qid)
      mapping_counts[(course,unit)]+=1
      if unit==0:readiness[course]+=1
     for image in question.get('images') or []:
      media_refs+=1;source=str(image.get('source_path') or '').lstrip('/');private=str(image.get('private_path') or '');chapter_match=re.search(r'/chapter_(\d{2})/',private);chapter=chapter_match.group(1) if chapter_match else f"{int((question.get('source') or {}).get('chapter') or 0):02d}"
      if source and source not in media_inventory.get(chapter,set()):error(f'Media missing from chapter_{chapter}.zip: {source}',code,qid)
      if private and private!=f'{slug}/chapter_{chapter}/{source}':error('Private media path mismatch',code,qid)
   if manifest.get('questions')!=len(ids):error('Manifest question count mismatch',code)
   if manifest.get('pools')!=len(pools):error('Manifest pool count mismatch',code)
   info={'file':package_path.name,'sha256':digest,'size_bytes':len(data),'bank_code':code,'questions':len(ids),'pools':len(pools),'media_files':media_files,'media_references':media_refs,'question_types':dict(types),'mapping_counts':{f'{course}:U{unit}':count for (course,unit),count in sorted(mapping_counts.items())},'readiness_counts':dict(readiness),'essay_without_solution':essay_without_solution}
   report['packages'].append(info);totals['packages']+=1;totals['questions']+=len(ids);totals['pools']+=len(pools);totals['media_files']+=media_files;totals['media_references']+=media_refs
 expected=registry.get('totals') or {}
 if totals['packages']!=expected.get('banks'):error(f'Expected {expected.get("banks")} packages, found {totals["packages"]}')
 if totals['questions']!=expected.get('questions'):error(f'Expected {expected.get("questions")} questions, found {totals["questions"]}')
 report['status']='FAIL' if report['errors'] else 'PASS';report['totals']={**dict(totals),'unique_question_ids':len(all_ids),'errors':len(report['errors']),'warnings':len(report['warnings'])}
 args.output_dir.mkdir(parents=True,exist_ok=True);(args.output_dir/'PRIVATE_BANK_VALIDATION.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
 lines=['# ECHS Direct-Linked Blackboard Bank Validation','',f'**Result: {report["status"]}**','',f'- Questions: {totals["questions"]:,}',f'- Unique IDs: {len(all_ids):,}',f'- Packages: {totals["packages"]:,}',f'- Source pools: {totals["pools"]:,}',f'- Media files: {totals["media_files"]:,}','','## Use boundary','','- Every question is linked to one AP Precalculus lesson and one IB Mathematics lesson.','- Manual Question Trust review is not required for authenticated school practice.','- Answers use publisher source keys; independent mathematical audit is not claimed.','- Source content and media remain private and are not published through GitHub Pages.']
 (args.output_dir/'PRIVATE_BANK_VALIDATION.md').write_text('\n'.join(lines),encoding='utf-8');print(json.dumps({'status':report['status'],'totals':report['totals']},indent=2));return 1 if report['errors'] else 0
if __name__=='__main__':raise SystemExit(main())
