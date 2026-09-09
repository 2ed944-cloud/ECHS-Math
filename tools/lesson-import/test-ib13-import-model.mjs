import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import katex from '../../lessons/ib-math-ai/unit-1/assets/js/katex.js';
import {createLessonDraft,assertDraftDocument} from '../../js/lesson-studio/draft-model.mjs';
import {IB13_IMPORT_TARGET as target,isIB13ImportTarget} from '../../js/lesson-studio/ib13-import-target.mjs';
import {IB13_REFERENCE as reference} from '../../js/lesson-studio/ib13-reference.mjs';
import {createIB13Import} from '../../js/lesson-studio/ib13-import-model.mjs';

const clone=value=>JSON.parse(JSON.stringify(value));
const catalog=()=>({course_key:target.courseKey,access_key:target.accessKey,unit_id:target.unitId,topic_id:target.topicId,route_path:target.path,unit_index:0,topic:'1.3',position:3,is_ready:true,title:'Server catalog title'});
const base=()=>createLessonDraft({lessonId:'b27b9a11-b5a2-4c56-8393-21ad0e01c901',courseVersionId:target.courseVersionId,catalog:catalog(),title:'Teacher geometric discussion',objective:'Explain the constant multiplier in the selected context.',skill:'teacher:representation',summary:'A teacher-selected geometric discussion.'});
const build=(extra={})=>createIB13Import({baseDocument:base(),mathEngine:katex,...extra});
const eligible=reference.slides.filter(row=>row.disposition==='native').map(row=>row.id);
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}

test('lightweight target uses every exact catalog binding and is inert',async()=>{
  assert.equal(isIB13ImportTarget({courseVersionId:target.courseVersionId,catalog:catalog()}),true);
  for(const value of [undefined,null,{},[],{courseVersionId:target.courseVersionId},{catalog:catalog()}])assert.equal(isIB13ImportTarget(value),false);
  for(const [key,value] of Object.entries(catalog())){
    if(key==='title')continue;
    assert.equal(isIB13ImportTarget({courseVersionId:target.courseVersionId,catalog:{...catalog(),[key]:typeof value==='boolean'?false:typeof value==='number'?value+1:value+'-wrong'}}),false,key);
  }
  assert.equal(isIB13ImportTarget({courseVersionId:'c7109cf8-abb4-5541-b431-c2ef17f6dffb',catalog:catalog()}),false);
  let touched=0;const bad={};Object.defineProperty(bad,'catalog',{enumerable:true,get(){touched++;throw Error('getter');}});
  assert.equal(isIB13ImportTarget(bad),false);assert.equal(touched,0);
  const source=await readFile(new URL('../../js/lesson-studio/ib13-import-target.mjs',import.meta.url),'utf8');
  assert.doesNotMatch(source,/^import\s/m);
});

test('default creates all 78 slots with reviewed native content and complete original references',()=>{
  const result=build();assert.equal(result.document.slides.length,78);assert.equal(result.summary.nativeSlides,20);assert.equal(result.summary.referenceSlides,58);
  assert.equal(result.summary.totalSlides,78);assert.deepEqual(result.summary.selectedSlideIds,eligible);assert.equal(result.summary.sourceId,reference.source.id);
  assertDraftDocument(result.document,{mathEngine:katex});
  result.document.slides.forEach((slide,index)=>{
    assert.equal(slide.id,reference.slides[index].id);assert.equal(slide.title,reference.slides[index].title);
    if(eligible.includes(slide.id)){assert.equal(slide.blocks.some(block=>block.type==='legacy-embedded'),false);assert.ok(slide.blocks.length>=2);}
    else {assert.equal(slide.blocks.length,1);assert.equal(slide.blocks[0].content.source,target.path);assert.equal(slide.blocks[0].content.sha256,reference.source.sha256);assert.match(slide.blocks[0].content.summary,new RegExp(`slide ${index+1}:`));}
  });
});

test('subset selection preserves source order and turns unselected native slides into references',()=>{
  const ids=[eligible.at(-1),eligible[0]],result=build({selectedSlideIds:ids});
  assert.deepEqual(result.summary.selectedSlideIds,[eligible[0],eligible.at(-1)]);assert.equal(result.summary.nativeSlides,2);assert.equal(result.summary.referenceSlides,76);
  assert.deepEqual(result.document.slides.map(slide=>slide.id),reference.slides.map(row=>row.id));
  assert.equal(result.document.slides.find(slide=>slide.id===eligible[1]).blocks[0].type,'legacy-embedded');
  assert.deepEqual(ids,[eligible.at(-1),eligible[0]]);
});

test('teacher identity, objectives, skills and accessibility remain unchanged without input mutation',()=>{
  const input=freeze(base()),before=JSON.stringify(input),result=build({baseDocument:input});
  assert.equal(JSON.stringify(input),before);
  for(const key of Object.keys(input).filter(key=>key!=='slides'))assert.deepEqual(result.document[key],input[key],key);
  result.document.objectives[0].text='Changed returned copy';assert.notEqual(input.objectives[0].text,result.document.objectives[0].text);
});

test('frozen reference and separate import outputs cannot mutate each other',()=>{
  const a=build(),b=build();a.document.slides[2].blocks[0].content.nodes[0].children[0].text='Changed';
  assert.notDeepEqual(a.document,b.document);assert.deepEqual(b.document,build().document);
  assert.ok(Object.isFrozen(reference.slides[2].nativeSlide.blocks));assert.throws(()=>{reference.slides[2].nativeSlide.title='Changed';});
});

test('73 existing IDs and per-slide HTML hashes are retained; append-only IDs cover five GDC slots',async()=>{
  const old=JSON.parse(await readFile(new URL('../lesson-compatibility/fixtures/ib13.metadata.json',import.meta.url),'utf8'));
  old.slides.forEach((slide,index)=>{assert.equal(reference.slides[index].id,slide.id);assert.equal(reference.slides[index].htmlSha256,slide.html_sha256);});
  assert.deepEqual(reference.slides.slice(73).map(row=>row.id),[74,75,76,77,78].map(n=>`ib13-fda45056e7b1-s${String(n).padStart(3,'0')}`));
  assert.equal(new Set(build().document.slides.flatMap(slide=>slide.blocks.map(block=>block.id))).size,build().document.slides.flatMap(slide=>slide.blocks).length);
});

test('public ledger has closed teaching projections, counts and a bounded size',async()=>{
  assert.deepEqual(reference.source.counts,{slides:78,practice:103,exam:6,quiz:14});
  assert.equal(reference.slides[68].disposition,'reference');assert.match(reference.slides[68].reason,/Evaluate/);
  assert.equal(reference.review.nativeCount,20);assert.equal(reference.review.referenceCount,58);
  assert.ok(Buffer.byteLength(JSON.stringify(reference))<=256*1024);
  const forbidden=new Set(['html','questions','practice','exam','quiz','answer','answers','correct','solution','solutions','rubric','private_notes','token','teacherNotes']);
  function inspect(value,path=''){if(!value||typeof value!=='object')return;for(const [key,item]of Object.entries(value)){if(forbidden.has(key))assert.equal(typeof item,'number',`${path}/${key} may only be a count`);inspect(item,`${path}/${key}`);}}
  inspect(reference);
  const bytes=await readFile(new URL('../../'+target.path,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),reference.source.sha256);
});

test('empty, duplicate, unknown, reference-only, sparse and accessor selections fail without evaluation',()=>{
  for(const ids of [[],[eligible[0],eligible[0]],['unknown'],[reference.slides[0].id],null,{},new Array(2)])assert.throws(()=>build({selectedSlideIds:ids}));
  let touched=0;const ids=[eligible[0]];Object.defineProperty(ids,'0',{enumerable:true,get(){touched++;return eligible[0];}});assert.throws(()=>build({selectedSlideIds:ids}));assert.equal(touched,0);
  const extra=[eligible[0]];extra.secret='extra';assert.throws(()=>build({selectedSlideIds:extra}));
});

test('import rejects noncanonical envelopes, hidden fields, getters, cycles and malformed mathematics',()=>{
  for(const mutation of [doc=>{doc.private_notes='secret';},doc=>{doc.slides[0].blocks[0].content.paragraphs[0].children[0].text='<script>';},doc=>{doc.slides[0].blocks[0]={id:'bad',type:'math',version:2,content:{source:{mode:'tex',tex:'\\frac{'},spoken:'bad expression',display:true}};}]){
    const doc=base();mutation(doc);assert.throws(()=>build({baseDocument:doc}));
  }
  const circular=base();circular.slides.push(circular);assert.throws(()=>build({baseDocument:circular}));
  let touched=0;const doc=base();Object.defineProperty(doc,'title',{enumerable:true,get(){touched++;return 'Bad';}});assert.throws(()=>build({baseDocument:doc}));assert.equal(touched,0);
  assert.throws(()=>createIB13Import({baseDocument:base(),mathEngine:katex,private_notes:'secret'}));
});

test('new exact institutional draft and explicit strict local math engine are required',()=>{
  for(const change of [doc=>{doc.document_version=2;doc.publication.revision=2;},doc=>{doc.publication.status='published';},doc=>{doc.publication.audience='public';},doc=>{doc.course_version_id='c7109cf8-abb4-5541-b431-c2ef17f6dffb';},doc=>{doc.unit_id='legacy:ib-math-ai:unit:2';},doc=>{doc.topic_id='legacy:ib-math-ai:topic:1.2';}]){const doc=base();change(doc);assert.throws(()=>build({baseDocument:doc}));}
  assert.throws(()=>build({mathEngine:undefined}));assert.throws(()=>build({mathEngine:{}}));
});

test('each eligible candidate independently imports as a valid draft with 77 preserved references',()=>{
  for(const id of eligible){const result=build({selectedSlideIds:[id]});assert.equal(result.summary.nativeSlides,1);assert.equal(result.summary.referenceSlides,77);assertDraftDocument(result.document,{mathEngine:katex});}
});
