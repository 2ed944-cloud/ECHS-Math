import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile,rm} from 'node:fs/promises';
import {resolve,dirname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {parseFragment} from 'parse5';
import {readLegacySnapshot,preserveLegacyRoute,describeAP11,adaptIB13Snapshot,convertSupportedText} from '../../js/lesson-runtime/legacy-compatibility.mjs';
import {validateLessonDocument,validatePublicLessonDocument} from '../../js/lesson-runtime/schema.mjs';
import {buildCompatibilityFixtures,contractModule} from './build-fixtures.mjs';

const here=dirname(fileURLToPath(import.meta.url));
const apJson=await readFile(resolve(here,'fixtures/ap11.metadata.json'),'utf8');
const ibJson=await readFile(resolve(here,'fixtures/ib13.metadata.json'),'utf8');
const ap=JSON.parse(apJson),ib=JSON.parse(ibJson);
const sourcePosition=process.argv.indexOf('--source-root');
const sourceRoot=resolve(sourcePosition>=0?process.argv[sourcePosition+1]:resolve(here,'../../'));
const schemaTools=process.argv.includes('--draft')?resolve(here,'../../../schema-draft/tools/lesson-runtime/package.json'):resolve(here,'../lesson-runtime/package.json');
const katex=createRequire(schemaTools)('katex');
const base='https://2ed944-cloud.github.io/ECHS-Math/';
const identity={document_version:1,lesson_id:'149494be-af2a-475a-b9a6-c395dbdffbbc',course_version_id:'7314e157-f5f5-4492-bedd-b787730cf6d1',unit_id:'fixture:unit-1',topic_id:'fixture:legacy-adapter',slug:'original-adapter-fixture',title:'Original adapter contract fixture',objectives:[{id:'fixture:preserve',text:'Preserve a reviewed legacy lesson reference.'}],skills:['fixture:compatibility'],accessibility:{language:'en',summary:'A test-only compatibility descriptor.'},variants:{contexts:['neutral']}};
const route=(kind='ap11',suffix='')=>({originalUrl:base+(kind==='ap11'?ap.source:ib.source)+suffix,repositoryBase:base});
const convert=(html,extra={})=>convertSupportedText(html,{id:'converted-content',reference:{source:ap.source,anchor:'start',sha256:ap.sha256},identity,parseFragment,mathEngine:katex,...extra});
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}

test('actual AP and final composed IB metadata produce canonical draft documents',()=>{
  const a=describeAP11(apJson,identity,route());
  const b=adaptIB13Snapshot(ibJson,identity,route('ib13'));
  assert.equal(a.document.slides.length,33); assert.deepEqual(a.compatibility.counts,{slides:33,questions:20,frqs:3});
  assert.equal(b.document.slides.length,73); assert.deepEqual(b.compatibility.counts,{slides:73,practice:96,exam:5,quiz:14});
  for(const output of [a,b]) {
    assert.equal(validateLessonDocument(output.document).valid,true);
    assert.equal(output.document.lesson_id,identity.lesson_id);
    assert.equal(output.document.course_version_id,identity.course_version_id);
    assert.deepEqual(output.document.publication,{status:'draft',audience:'institutional',revision:1});
    assert.equal(validatePublicLessonDocument(output.document).valid,false);
  }
});

test('identities must be supplied explicitly; input approval never silently promotes imported content',()=>{
  assert.throws(()=>describeAP11(apJson,{},route()));
  assert.throws(()=>describeAP11(apJson,{...identity,lesson_id:'invented-slug'},route()));
  const approved=describeAP11(apJson,{...identity,publication:{status:'published',audience:'public',revision:8}},route());
  assert.equal(approved.document.publication.status,'draft');
});

test('disabled/default routes preserve exact URL, repeated queries, encodings and opaque fragments',()=>{
  const suffix='?topic=1.1&x=a%20b&x=a+b&unknown=%2f%2F#slide=7';
  for(const path of [ap.source,...ap.aliases]) {
    const originalUrl=base+path+suffix;
    const result=preserveLegacyRoute({originalUrl,repositoryBase:base,kind:'ap11'});
    assert.equal(result.mode,'legacy'); assert.equal(result.originalUrl,originalUrl); assert.equal(result.rollbackUrl,originalUrl);
    assert.deepEqual(result.query.slice(1,3),[['x','a b'],['x','a b']]);
    assert.equal(result.canonicalSource,ap.source);
    assert.equal(result.fragment.index,7); assert.equal(result.fragment.slideId,ap.slides[6].id);
  }
  for(const flag of [undefined,false,'true',1]) assert.equal(preserveLegacyRoute({...route(),kind:'ap11',enabled:flag}).mode,'legacy');
});

test('only explicit valid preview opts in; opaque fragments keep their original fallback',()=>{
  for(const suffix of ['#slide=1','#slide=33','#start','#secant-lab']) {
    const output=preserveLegacyRoute({...route('ap11',suffix),kind:'ap11',enabled:true});
    assert.equal(output.mode,'adapter-preview'); assert.equal(output.rollbackUrl,route('ap11',suffix).originalUrl);
    assert.ok(output.fragment.slideId);
  }
  for(const suffix of ['#slide=0','#slide=34','#slide=-1','#slide=01','#slide=1.5','#unknown','#%ZZ']) {
    const output=preserveLegacyRoute({...route('ap11',suffix),kind:'ap11',enabled:true});
    assert.equal(output.mode,'legacy'); assert.equal(output.fragment.kind,'opaque'); assert.equal(output.fragment.raw,suffix);
  }
});

test('all original IB route tabs preserve identity without translating review into mastery',()=>{
  for(const tab of ['learn','practice','exam','quiz','review']) {
    const output=preserveLegacyRoute({...route('ib13','#'+tab),kind:'ib13',enabled:true});
    assert.equal(output.fragment.route,tab); assert.equal(output.rollbackUrl,route('ib13','#'+tab).originalUrl);
    assert.equal(output.mode,tab==='learn'?'adapter-preview':'legacy');
  }
  assert.equal(preserveLegacyRoute({...route('ib13','#slide=20'),kind:'ib13',enabled:true}).mode,'legacy');
});

test('route scope rejects other origins, lessons, traversal and malformed repository bases',()=>{
  for(const originalUrl of ['https://example.test/ECHS-Math/'+ap.source,base+'lessons/other.html','javascript:alert(1)',base+'lessons/ap-calculus/unit-1/../private.html']) {
    assert.throws(()=>preserveLegacyRoute({originalUrl,repositoryBase:base,kind:'ap11'}));
  }
  for(const repositoryBase of ['javascript:alert(1)',base+'?x=1',base+'#x',base.slice(0,-1)]) {
    assert.throws(()=>preserveLegacyRoute({...route(),repositoryBase,kind:'ap11'}));
  }
});

test('AP stable IDs, layouts, original source anchors and existing finish delegate survive',()=>{
  const output=describeAP11(apJson,identity,route());
  assert.deepEqual(output.document.slides.map(slide=>slide.id),ap.slides.map(slide=>slide.id));
  assert.deepEqual(output.document.slides.map(slide=>slide.layout),ap.slides.map(slide=>slide.layout));
  output.document.slides.forEach((slide,index)=>{
    assert.deepEqual(slide.blocks[0].content,{source:ap.source,anchor:ap.slides[index].anchor,sha256:ap.sha256,summary:'This slide, its interactions and any assessment material remain in the existing lesson.'});
  });
  assert.equal(output.compatibility.finish.trigger,'#continuePractice');
  assert.equal(output.compatibility.finish.delegate,'[data-finish-lesson]');
  assert.equal(output.compatibility.finish.masteryWrites,false);
  assert.equal(output.compatibility.finish.stateWrites,false);
});

test('IB staged layers, source indexes, pacing and reference-only preservation survive',()=>{
  const output=adaptIB13Snapshot(ibJson,identity,route('ib13'));
  assert.deepEqual(output.compatibility.stages.map(stage=>[stage.slides,stage.practice,stage.exam,stage.quiz]),[[49,40,2,10],[36,52,3,14],[73,96,5,14]]);
  assert.equal(output.compatibility.layers.length,7);
  assert.ok(output.compatibility.slides.every(slide=>slide.legacyHtmlSha256.length===64&&slide.sourceAnchor==='learn'));
  assert.ok(output.compatibility.slides.every((slide,index)=>slide.pacing.source_index===index+1));
  assert.ok(output.document.slides.every(slide=>slide.blocks.every(block=>block.type==='legacy-embedded')));
});

test('metadata refuses complete banks, base-only data, reordered layers and source tampering',()=>{
  for(const mutate of [doc=>{doc.practice=[];},doc=>{doc.slides[0].html='<p>Hidden payload</p>';},doc=>{doc.layers.reverse();},doc=>{doc.counts.slides=49;},doc=>{doc.source='lessons/other.html';},doc=>{doc.slides[0].title='Altered title';},doc=>{doc.slides[0].layout='three-panel';},doc=>{doc.sha256='0'.repeat(64);}]) {
    const changed=structuredClone(ib);mutate(changed);assert.throws(()=>readLegacySnapshot(JSON.stringify(changed),'ib13'));
  }
  assert.throws(()=>readLegacySnapshot('window.LESSON_DATA={};','ib13'));
  assert.throws(()=>readLegacySnapshot(ib,'ib13'));
  assert.throws(()=>readLegacySnapshot(' '.repeat(256001),'ib13'));
  const changed=structuredClone(ap);changed.assets[0].url='javascript:alert(1)';assert.throws(()=>readLegacySnapshot(JSON.stringify(changed),'ap11'));
});

test('strict supported conversion preserves paragraphs, entities, formatting, explicit spoken math and callouts',()=>{
  const result=convert('<p>Rates &amp; ratios use <strong>consistent units</strong>.</p><p>At <span class="math" data-tex="x=2" aria-label="x equals two">x=2</span>, inspect the graph.</p><div class="math" data-tex="x^2" aria-label="x squared">x^2</div><aside class="callout" data-kind="note" data-title="Explain"><p>Use <em>clear words</em>.</p></aside>');
  assert.equal(result.status,'supported');
  assert.deepEqual(result.blocks.map(block=>block.type),['rich-text','math','callout']);
  assert.equal(result.blocks[0].content.paragraphs[0].children[0].text,'Rates & ratios use ');
  assert.deepEqual(result.blocks[0].content.paragraphs[0].children[1].marks,['strong']);
  assert.equal(result.blocks[0].content.paragraphs[1].children[1].spoken,'x equals two');
  assert.equal(result.blocks[1].content.display,true);
  assert.equal(result.blocks[2].content.kind,'note');
});

test('unsupported HTML retains one intact source reference; no partial stripping or executable payload escapes',()=>{
  for(const html of ['<p>Safe text</p><script>alert(1)</script>','<svg><text>Graph</text></svg>','<p onclick="alert(1)">Text</p>','<iframe src="https://example.test"></iframe>','<form><input value="secret"></form>','<div style="color:red"><p>Text</p></div>','<p><a href="javascript:alert(1)">Click</a></p>','<p><img src="x" onerror="alert(1)"></p>','<p data-private="yes">Text</p>','<div class="two-col"><p>One</p><p>Two</p></div>','<p><span class="math" data-tex="x">x</span></p>','<p><strong class="x">Text</strong></p>','<p><math><mi>x</mi></math></p>']) {
    const result=convert(html); assert.equal(result.status,'legacy-reference',html);
    assert.equal(result.blocks.length,1);assert.equal(result.blocks[0].type,'legacy-embedded');
    assert.deepEqual(Object.keys(result.blocks[0].content),['source','anchor','sha256','summary']);
    assert.equal(JSON.stringify(result).includes(html),false);
  }
});

test('conversion fails closed for malformed math, parser absence, missing speech and unsafe references',()=>{
  assert.equal(convert('<p>Text</p>',{parseFragment:undefined}).status,'legacy-reference');
  assert.equal(convert('<div class="math" data-tex="\\frac{1}{" aria-label="Fraction">x</div>').status,'legacy-reference');
  assert.equal(convert('<div class="math" data-tex="x" aria-label="x">x</div>',{mathEngine:undefined}).status,'legacy-reference');
  assert.equal(convert('<p>&lt;script&gt;</p>').status,'legacy-reference');
  assert.throws(()=>convert('<p>Text</p>',{reference:{source:'javascript:alert(1)',anchor:'',sha256:ap.sha256}}));
});

test('inputs are unchanged and helpers have no DOM, account, storage, navigation or mastery dependency',()=>{
  const frozenIdentity=freeze(structuredClone(identity));
  const frozenRoute=freeze(route());
  const before=JSON.stringify({frozenIdentity,frozenRoute});
  const protectedNames=['window','document','location','history','localStorage','sessionStorage','ECHSInstitution','ECHSLearning','ECHSMastery'];
  const descriptors=new Map(protectedNames.map(name=>[name,Object.getOwnPropertyDescriptor(globalThis,name)]));
  try {
    for(const name of protectedNames)Object.defineProperty(globalThis,name,{configurable:true,get(){throw new Error(`Forbidden access: ${name}`);}});
    const output=describeAP11(apJson,frozenIdentity,frozenRoute);
    output.document.objectives[0].text='Output-only mutation';
    assert.equal(frozenIdentity.objectives[0].text,identity.objectives[0].text);
    adaptIB13Snapshot(ibJson,frozenIdentity,route('ib13'));
    convert('<p>Read-only text.</p>');
  }finally {
    for(const [name,descriptor] of descriptors)if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete globalThis[name];
  }
  assert.equal(JSON.stringify({frozenIdentity,frozenRoute}),before);
});

test('exported documents and metadata contain counts only, with no answer/question/rubric payload fields',()=>{
  for(const output of [describeAP11(apJson,identity,route()),adaptIB13Snapshot(ibJson,identity,route('ib13'))]) {
    const walk=value=>{
      if(!value||typeof value!=='object')return;
      for(const [key,child]of Object.entries(value)) {
        assert.ok(!['answer','answers','correct','solution','prompt','parts','rubric','markscheme','teacher_notes','rawHTML','html','check'].includes(key),key);
        walk(child);
      }
    };
    walk(output);
  }
});

test('fixture builder reproduces actual hash-pinned stage composition and rejects changed bytes before composition',async()=>{
  const output=await buildCompatibilityFixtures(sourceRoot);
  assert.deepEqual(output,{ap,ib});
  assert.equal(await readFile(resolve(here,'../../js/lesson-runtime/pinned-legacy-contracts.mjs'),'utf8'),contractModule(output));
  const temp=resolve(here,'.tmp-source-mismatch');
  if(!temp.startsWith(here+sep))throw new Error('Temporary path escaped tools directory.');
  try {
    const target=resolve(temp,ap.source);await mkdir(dirname(target),{recursive:true});await writeFile(target,'Changed source must not execute.');
    await assert.rejects(()=>buildCompatibilityFixtures(temp),/Pinned fixture source changed/);
  }finally {
    if(!resolve(temp).startsWith(resolve(here)+sep))throw new Error('Refuse unsafe temporary cleanup.');
    await rm(temp,{recursive:true,force:true});
  }
});
