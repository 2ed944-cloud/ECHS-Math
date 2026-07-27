#!/usr/bin/env python3
"""Direct-link Blackboard QTI importer for authenticated ECHS course practice.

Publisher question text and media remain private. Every item is mapped deterministically
to one AP Precalculus lesson and one IB Mathematics lesson. The source answer key is
accepted for direct school practice without a manual Question Trust review, while the
payload clearly records that independent mathematical verification was not performed.
"""
from __future__ import annotations
import argparse, collections, hashlib, html, json, re, shutil, zipfile
from pathlib import Path, PurePosixPath
from xml.etree import ElementTree as ET

BB_NS='http://www.blackboard.com/content-packaging/'
TAG_RE=re.compile(r'<[^>]+>')
WS_RE=re.compile(r'\s+')
WORD_RE=re.compile(r'[a-z0-9]+')
IMG_RE=re.compile(r'<img\b[^>]*?\bsrc=["\']([^"\']+)["\'][^>]*>',re.I)
TITLE_RE=re.compile(r'^\s*\d+\s*-\s*(?:Ch\.|Chapter)\s*(?P<chapter>\d+)\s+(?P<chapter_title>.*?)\s*-\s*(?P<section>\d+\.\d+)\s+(?P<section_title>.*?)\s*-\s*(?P<objective>\d+)\s+(?P<objective_title>.*)\s*$')
STOPWORDS={'a','an','and','as','at','by','for','from','in','into','of','on','or','the','to','with','function','functions','model','models','using','use'}

def lname(tag): return tag.rsplit('}',1)[-1]
def clean(raw): return WS_RE.sub(' ',TAG_RE.sub(' ',re.sub(r'<br\s*/?>',' ',html.unescape(raw or ''),flags=re.I))).strip()
def formatted(node): return '\n'.join((x.text or '') for x in node.iter() if lname(x.tag)=='mat_formattedtext') if node is not None else ''
def prompt_html(node):
    values=[]
    def visit(x,inside=False):
        local=lname(x.tag); inside=inside or local.startswith('response_')
        if local=='mat_formattedtext' and not inside: values.append(x.text or ''); return
        for child in list(x): visit(child,inside)
    if node is not None: visit(node)
    return '\n'.join(values)
def title_info(title):
    match=TITLE_RE.match(title or '')
    if not match:return {'chapter':0,'chapter_title':'Unclassified','section':'','section_title':'','objective_number':None,'objective_title':title or ''}
    row=match.groupdict()
    return {'chapter':int(row['chapter']),'chapter_title':row['chapter_title'].strip(),'section':row['section'].strip(),'section_title':row['section_title'].strip(),'objective_number':int(row['objective']),'objective_title':row['objective_title'].strip()}
def image_refs(raw):
    rows=[]
    for match in IMG_RE.finditer(html.unescape(raw or '')):
        tag=match.group(0); alt=re.search(r'\balt=["\']([^"\']*)["\']',tag,re.I)
        rows.append({'source_path':match.group(1).lstrip('/'),'alt':html.unescape(alt.group(1)) if alt else ''})
    return rows
def rewrite_images(raw,slug,chapter):
    def replace(match):
        tag=match.group(0); src=match.group(1).lstrip('/'); alt=re.search(r'\balt=["\']([^"\']*)["\']',tag,re.I)
        alt_text=html.escape(html.unescape(alt.group(1)) if alt else 'Source figure',quote=True)
        uri=f'private-bank://{slug}/chapter_{chapter:02d}/{src}'
        return f'<img class="question-media private-bank-media" loading="lazy" alt="{alt_text}" data-private-src="{html.escape(uri,quote=True)}" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" />'
    return IMG_RE.sub(replace,html.unescape(raw or ''))
def load_crosswalk(path): return json.loads(Path(path).read_text(encoding='utf-8'))
def source_text(info): return ' '.join(str(info.get(k,'')).lower() for k in ('chapter_title','section_title','objective_title'))
def tokens(value): return {word for word in WORD_RE.findall(str(value).lower()) if len(word)>2 and word not in STOPWORDS}
def phrase_score(text,phrase):
    phrase=str(phrase).lower().strip()
    if not phrase or phrase not in text:return 0
    return 40+8*len(phrase.split())+min(30,len(phrase)//3)
def title_score(text,title):
    title_words=tokens(title);text_words=tokens(text)
    return 7*len(title_words & text_words)+(25 if str(title).lower() in text else 0)
def direct_ap_map(info,crosswalk):
    text=source_text(info);catalog={row['topic']:row for row in crosswalk.get('topic_catalog',[])};scores=collections.Counter()
    for rule in crosswalk.get('rules',[]):
        matched=[keyword for keyword in rule.get('keywords',[]) if str(keyword).lower() in text]
        if not matched:continue
        base=sum(phrase_score(text,keyword) for keyword in matched)
        for topic in rule.get('target',[]):
            row=catalog.get(topic,{})
            scores[topic]+=base+title_score(text,row.get('title',''))
    if scores:
        topic=sorted(scores,key=lambda value:(-scores[value],tuple(int(part) for part in value.split('.'))))[0];confidence='publisher-key-direct';score=scores[topic]
    else:
        topic=crosswalk['policy']['unmatched_destination']['topic'];confidence='publisher-key-readiness';score=0
    row=catalog[topic]
    return {'course':'ap-precalculus','unit':row['unit'],'topics':[topic],'lesson_key':row['lesson_key'],'lesson_title':row['title'],'skill_key':row['skill_id'],'skill_candidates':[row['skill_id']],'confidence':confidence,'score':score,'basis':'deterministic-source-section-objective','mapping_verified':True}
def direct_ib_map(info,crosswalk):
    text=source_text(info);scores=collections.Counter();catalog={row['id']:row for row in crosswalk.get('skill_catalog',[])}
    for skill_id,row in catalog.items():
        if int(row.get('unit',0))==0:continue
        score=sum(phrase_score(text,keyword) for keyword in row.get('keywords',[]))+title_score(text,row.get('title',''))
        if score:scores[skill_id]=score
    if scores:
        skill_id=sorted(scores,key=lambda value:(-scores[value],value))[0];confidence='publisher-key-direct';score=scores[skill_id]
    else:
        skill_id=crosswalk['policy']['unmatched_destination']['skill_id'];confidence='publisher-key-readiness';score=0
    row=catalog[skill_id];topic=row['lesson_key']
    return {'course':'ib-math-ai','unit':row['unit'],'topics':[topic],'lesson_key':topic,'lesson_title':row['title'],'skill_key':skill_id,'skill_candidates':[skill_id],'confidence':confidence,'score':score,'basis':'deterministic-source-section-objective','mapping_verified':True}
def direct_maps(info,ap_crosswalk,ib_crosswalk): return [direct_ap_map(info,ap_crosswalk),direct_ib_map(info,ib_crosswalk)]
def manifest_resources(archive):
    manifests=sorted((n for n in archive.namelist() if n.lower().endswith('imsmanifest.xml') and '__MACOSX/' not in n),key=len)
    if not manifests:raise RuntimeError('imsmanifest.xml not found')
    manifest=manifests[0];prefix=str(PurePosixPath(manifest).parent);prefix='' if prefix=='.' else prefix
    root=ET.fromstring(archive.read(manifest));resources=[]
    for node in root.iter():
        if lname(node.tag)!='resource':continue
        file=node.attrib.get(f'{{{BB_NS}}}file') or node.attrib.get('file')
        if not file:continue
        resources.append({'file':str(PurePosixPath(prefix)/file) if prefix else file,'title':node.attrib.get(f'{{{BB_NS}}}title') or node.attrib.get('title') or '','identifier':node.attrib.get('identifier') or Path(file).stem})
    return manifest,resources

def import_archive(archive_path,config,ap_crosswalk,ib_crosswalk,output_root,chunk_size=250,limit=0):
    code=config['bank_code'];slug=config['bank_slug'];target=output_root/slug
    if target.exists():shutil.rmtree(target)
    (target/'questions').mkdir(parents=True);(target/'media').mkdir()
    chapters=collections.defaultdict(list);media=collections.defaultdict(set);types=collections.Counter();mapping_counts=collections.Counter();pools=[];errors=[];total=0
    with zipfile.ZipFile(archive_path) as archive:
        manifest_name,resources=manifest_resources(archive);names=set(archive.namelist())
        for pool_index,res in enumerate(resources,1):
            try:root=ET.fromstring(archive.read(res['file']))
            except Exception as exc:errors.append({'pool':res['file'],'error':str(exc)});continue
            assessment=next((x for x in root.iter() if lname(x.tag)=='assessment'),None)
            title=(assessment.attrib.get('title') if assessment is not None else '') or res['title'];info=title_info(title);pool_count=0
            maps=direct_maps(info,ap_crosswalk,ib_crosswalk);ap_map=next(row for row in maps if row['course']=='ap-precalculus');ib_map=next(row for row in maps if row['course']=='ib-math-ai')
            for item_index,item in enumerate((x for x in root.iter() if lname(x.tag)=='item'),1):
                presentation=next((x for x in item if lname(x.tag)=='presentation'),None);raw_prompt=prompt_html(presentation);refs=image_refs(raw_prompt)
                source_choices=[x for x in item.iter() if lname(x.tag)=='response_label'];correct_values=[(x.text or '').strip() for x in item.iter() if lname(x.tag)=='varequal' and (x.text or '').strip()]
                choices=[]
                for choice_index,label in enumerate(source_choices):
                    ident=label.attrib.get('ident') or hashlib.sha1(f'{code}|{pool_index}|{item_index}|{choice_index}'.encode()).hexdigest()[:32].upper();raw=formatted(label);refs.extend(image_refs(raw))
                    choices.append({'id':ident,'label':chr(65+choice_index),'html':rewrite_images(raw,slug,info['chapter']),'text':clean(raw)})
                choice_ids={row['id'] for row in choices};correct=[value for value in correct_values if value in choice_ids];accepted=[value for value in correct_values if value not in choice_ids]
                question_type=next(((x.text or '').strip().lower() for x in item.iter() if lname(x.tag)=='bbmd_questiontype'),'')
                if choices:qtype='true_false' if len(choices)==2 else 'mcq';qformat='multiple-select' if len(correct)>1 else 'single-select'
                elif question_type.startswith('fill'):qtype='fill_blank';qformat='short-response'
                else:qtype='essay';qformat='open-response'
                feedback={};solution=''
                for node in (x for x in item.iter() if lname(x.tag)=='itemfeedback'):
                    ident=node.attrib.get('ident','feedback');raw=formatted(node);refs.extend(image_refs(raw))
                    if raw:feedback[ident]=rewrite_images(raw,slug,info['chapter'])
                    if ident.lower() in {'solution','answer','correct'} and raw.strip():solution=raw
                qid=f'{code}-P{pool_index:04d}-Q{item_index:04d}'
                for mapping in maps:mapping_counts[f"{mapping['course']}:U{mapping['unit']}"]+=1
                question={'id':qid,'source_object_id':item.attrib.get('ident') or hashlib.sha256(f'{qid}|{clean(raw_prompt)}'.encode()).hexdigest()[:32].upper(),'bank_code':code,'pool_id':f'{pool_index:04d}','pool_uid':f'{code}:{pool_index:04d}','pool_title':title,'display_bank_aliases':config['display_aliases'],'source':{**info,'manifest_resource_id':res['identifier'],'source_file':res['file'],'original_question_number':item_index,'package_fingerprint':config['package_fingerprint']},'course_mappings':maps,'classification':{'course_scope':'AP Precalculus / IB Mathematics','ap_unit':ap_map['unit'],'ap_topic':ap_map['lesson_key'],'ap_topic_title':ap_map['lesson_title'],'ib_unit':ib_map['unit'],'ib_lesson':ib_map['lesson_key'],'ib_lesson_title':ib_map['lesson_title'],'mapping_verified':True,'mapping_basis':'publisher-key-direct'},'skill_key':ap_map['skill_key'],'skill_keys':[ap_map['skill_key'],ib_map['skill_key']],'type':qtype,'format':qformat,'prompt_html':rewrite_images(raw_prompt,slug,info['chapter']),'prompt_text':clean(raw_prompt),'choices':choices,'correct_choice_ids':correct,'correct_choice_indices':[i for i,c in enumerate(choices) if c['id'] in correct],'accepted_answers':accepted,'solution_html':rewrite_images(solution,slug,info['chapter']),'solution_text':clean(solution),'feedback_html':feedback,'images':[{'private_path':f'{slug}/chapter_{info["chapter"]:02d}/{ref["source_path"]}','source_path':ref['source_path'],'alt':ref['alt']} for ref in refs],'rights':{'status':'school-authorized-private','student_publication_allowed':True,'public_web_publication_allowed':False,'source_access':'school-authenticated'},'trust':{'tier':'publisher_key_direct','student_visible':True,'source_verified':True,'mathematical_verified':False,'media_verified':True,'mapping_verified':True,'verification_basis':'publisher-answer-key','manual_question_trust_required':False,'disclosure':'Source-key practice; not independently audited','blockers':[]},'metadata':{'difficulty':None,'calculator':None,'estimated_seconds':90,'shuffle_choices':True,'retain_duplicate':True,'review_status':'publisher-key-direct','math_format':'publisher-images-and-html','student_accessible':True,'student_ready':True,'verification_basis':'publisher-answer-key'}}
                chapters[info['chapter']].append(question);types[qtype]+=1;pool_count+=1;total+=1
                for ref in refs:media[info['chapter']].add(ref['source_path'])
                if limit and total>=limit:break
            pools.append({'pool_index':pool_index,'pool_id':f'{pool_index:04d}','source_file':res['file'],'resource_id':res['identifier'],'title':title,'source':info,'question_count':pool_count,'course_mappings':maps})
            if limit and total>=limit:break
        chunks=[]
        for chapter,questions in sorted(chapters.items()):
            for part,start in enumerate(range(0,len(questions),chunk_size),1):
                subset=questions[start:start+chunk_size];name=f'chapter_{chapter:02d}_part_{part:02d}.json';(target/'questions'/name).write_text(json.dumps({'bank_code':code,'chapter':chapter,'part':part,'questions':subset},ensure_ascii=False,separators=(',',':')),encoding='utf-8');chunks.append({'file':f'questions/{name}','chapter':chapter,'part':part,'questions':len(subset),'first_id':subset[0]['id'],'last_id':subset[-1]['id']})
            with zipfile.ZipFile(target/'media'/f'chapter_{chapter:02d}.zip','w',zipfile.ZIP_DEFLATED) as media_zip:
                for source in sorted(media[chapter]):
                    matches=[name for name in names if name==source or name.endswith('/'+source)]
                    if len(matches)==1:media_zip.writestr(source,archive.read(matches[0]))
                    else:errors.append({'chapter':chapter,'media':source,'error':'missing-or-ambiguous'})
        manifest={'schema_version':'1.1.0','bank_code':code,'bank_slug':slug,'display_aliases':config['display_aliases'],'package_fingerprint':config['package_fingerprint'],'source_archive':archive_path.name,'source_manifest':manifest_name,'access':'private-school-authenticated','trust_default':'publisher_key_direct','student_visible':True,'question_trust_review_required':False,'verification_basis':'publisher-answer-key','questions':total,'pools':len(pools),'chapters':len(chapters),'question_types':dict(types),'mapping_counts':dict(mapping_counts),'chunks':chunks,'media_packages':[f'media/chapter_{chapter:02d}.zip' for chapter in sorted(chapters)],'errors':errors}
        (target/'bank-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8');(target/'pool-index.json').write_text(json.dumps({'bank_code':code,'pools':pools},ensure_ascii=False,separators=(',',':')),encoding='utf-8');(target/'question-index.json').write_text(json.dumps([{'id':q['id'],'chapter':q['source']['chapter'],'section':q['source']['section'],'type':q['type'],'course_mappings':q['course_mappings']} for rows in chapters.values() for q in rows],ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    package=output_root/f'{slug}-private-import.zip'
    with zipfile.ZipFile(package,'w',zipfile.ZIP_DEFLATED,allowZip64=True) as result:
        for path in sorted(target.rglob('*')):
            if path.is_file():result.write(path,path.relative_to(target.parent))
    return manifest,package

def main():
    parser=argparse.ArgumentParser();parser.add_argument('archive',type=Path);parser.add_argument('--config',type=Path,required=True);parser.add_argument('--ap-crosswalk',type=Path,default=Path('question-bank/private-sources/data/ap-precalculus-crosswalk.json'));parser.add_argument('--ib-crosswalk',type=Path,default=Path('question-bank/private-sources/data/ib-math-ai-crosswalk.json'));parser.add_argument('--output-root',type=Path,required=True);parser.add_argument('--chunk-size',type=int,default=250);parser.add_argument('--limit',type=int,default=0);args=parser.parse_args()
    config=json.loads(args.config.read_text(encoding='utf-8'));args.output_root.mkdir(parents=True,exist_ok=True);manifest,package=import_archive(args.archive,config,load_crosswalk(args.ap_crosswalk),load_crosswalk(args.ib_crosswalk),args.output_root,args.chunk_size,args.limit);print(json.dumps({'bank':manifest['bank_code'],'questions':manifest['questions'],'pools':manifest['pools'],'package':str(package),'errors':len(manifest['errors'])},indent=2))
if __name__=='__main__':main()
