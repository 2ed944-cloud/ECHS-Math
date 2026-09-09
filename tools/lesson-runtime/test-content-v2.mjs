import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import * as canonical from '../../js/lesson-runtime/schema.mjs';
import * as deployed from '../../supabase/functions/lesson-api/generated/schema.mjs';
import { assertPersistableDocument, assertPublishableDocument, assertStudentDocument } from '../../supabase/functions/lesson-api/document-contract.mjs';
import { createLessonHandler } from '../../supabase/functions/lesson-api/handler.mjs';

const require = createRequire(import.meta.url), katex = require('katex');
const original = JSON.parse(await readFile(new URL('./fixtures/published-original.lesson.json', import.meta.url), 'utf8'));
const { cases, locale_cases } = JSON.parse(await readFile(new URL('./fixtures/content-v2-cases.json', import.meta.url), 'utf8'));
const capability = { contract: 'echs.lesson.authoring.v1', content_version: 2,
  blocks: { 'rich-text': [1,2], math: [1,2], callout: [1,2], 'legacy-embedded': [1] }, math_expression_version: 1 };
const options = { mathEngine: katex };
function document(block) { const d=structuredClone(original); d.slides=[{id:'fixture',title:'Versioned content',layout:'single',blocks:[structuredClone(block)]}]; return d; }
const identity = d => ({ lesson_id:d.lesson_id, course_version_id:d.course_version_id, unit_id:d.unit_id, topic_id:d.topic_id,
  document_version:d.document_version, publication_revision:d.publication.revision });

test('120 shared positive/negative cases agree across browser, deployed bundle, block and content validators', () => {
  assert.equal(cases.length,120);
  for (const item of cases) {
    const d=document(item.block), before=JSON.stringify(d);
    const a=canonical.validateLessonDocument(d,options), b=deployed.validateLessonDocument(d,options);
    assert.equal(a.valid,item.valid,item.label+': '+JSON.stringify(a.errors));
    assert.deepEqual(b,a,item.label);
    if(item.valid) {
      assert.equal(canonical.assertLessonBlock(item.block,options),item.block);
      assert.equal(canonical.assertBlockContent(item.block.type,item.block.version,item.block.content,options),item.block.content);
      assert.equal(canonical.assertPublicLessonDocument(d,options),d);
    } else assert.throws(()=>canonical.assertLessonBlock(item.block,options),canonical.LessonDocumentError,item.label);
    assert.equal(JSON.stringify(d),before);
  }
});

test('every supported v2 block preserves the existing persistence/review/student publication contracts', () => {
  for (const item of cases.filter(x=>x.valid)) {
    const d=document(item.block);d.publication.status='draft';d.publication.audience='institutional';
    assert.equal(assertPersistableDocument(d,{...options,identity:identity(d)}),d);
    assert.equal(assertPublishableDocument(d,{...options,identity:identity(d)}),d);
    assert.throws(()=>assertStudentDocument(d,{...options,identity:identity(d)}));
    const published=structuredClone(d);published.publication.status='published';
    assert.equal(assertStudentDocument(published,{...options,identity:identity(published)}),published);
    assert.throws(()=>assertStudentDocument(published,{...options,identity:{...identity(published),publication_revision:999}}));
  }
});

test('17 shared locale cases keep URL and AST identifiers ASCII while preserving multilingual text', () => {
  assert.equal(locale_cases.length,17);
  for(const item of locale_cases) {
    assert.equal(canonical.validateLessonDocument(document(item.block),options).valid,item.valid,item.label);
    assert.equal(deployed.validateLessonDocument(document(item.block),options).valid,item.valid,item.label);
  }
});

test('all v1 data remains unchanged and mixed versions serialize without implicit conversion', () => {
  const before=JSON.stringify(original);
  canonical.assertLessonDocument(original,options);
  const mixed=structuredClone(original);
  mixed.slides.push({id:'mixed-v2',title:'Explicit v2',layout:'single',blocks:cases.slice(0,3).map(x=>structuredClone(x.block))});
  const serialized=canonical.serializeLessonDocument(mixed,options);
  assert.deepEqual(canonical.parseLessonDocument(serialized,options),mixed);
  assert.equal(JSON.stringify(original),before);
  const old=structuredClone(cases[0].block);old.version=1;
  assert.throws(()=>canonical.assertLessonBlock(old,options));
  const fakeUpgrade=structuredClone(original.slides[0].blocks[0]);fakeUpgrade.version=2;
  assert.throws(()=>canonical.assertLessonBlock(fakeUpgrade,options));
});

test('strict actual KaTeX validation visits math inside list, paragraph, callout, display and visual source', () => {
  for(const kind of ['rich2','callout2','math2']) {
    const block=structuredClone(cases.find(x=>x.label===kind).block);
    const content=kind==='callout2'?block.content.body:block.content;
    const source=kind==='math2'?content:content.nodes[1].items[1].children[0];
    for(const tex of ['\\frac{1}{','\\href{https://example.org}{x}','\\htmlClass{hidden}{x}','\\newcommand{\\bad}{x}']) {
      source.source={mode:'tex',tex};
      assert.throws(()=>canonical.assertLessonBlock(block,options),kind+' '+tex);
      const d=document(block);d.publication={...d.publication,status:'draft',audience:'institutional'};
      assert.throws(()=>assertPublishableDocument(d,{...options,identity:identity(d)}));
    }
  }
  const sourceBlock=structuredClone(cases[1].block);
  sourceBlock.content.source={mode:'visual',expression:{kind:'symbol',name:'x',tex:'hidden alternate'}};
  assert.throws(()=>canonical.assertLessonBlock(sourceBlock,options));
});

test('standalone block helpers inspect descriptors, prototype keys, cycles and unchanged document budgets', () => {
  let touched=0;const block=structuredClone(cases[0].block);
  Object.defineProperty(block.content,'nodes',{enumerable:true,get(){touched++;throw Error('must not execute');}});
  assert.throws(()=>canonical.assertLessonBlock(block));assert.equal(touched,0);
  assert.throws(()=>canonical.assertLessonBlock(JSON.parse('{"__proto__":{}}')));
  const cycle={};cycle.content=cycle;assert.throws(()=>canonical.assertLessonBlock(cycle));
  assert.deepEqual(canonical.LESSON_DOCUMENT_LIMITS,{maxBytes:2097152,maxDepth:24,maxNodes:30000});
});

test('HTTPS helper and semantic validator agree, including malformed escapes and length/host defenses', () => {
  for(const item of cases.filter(x=>x.label.startsWith('HTTPS '))) {
    const href=item.block.content.nodes[0].children[5].href;
    assert.equal(canonical.isSafeLessonHref(href),item.valid,item.label);
  }
  for(const href of [null,{},42,' https://example.org','https://example.org\n','https://example.org/%0A','https://example.org/%5C']) assert.equal(canonical.isSafeLessonHref(href),false);
});

const actor={account_id:'55555555-5555-4555-8555-555555555555',organization_id:'66666666-6666-4666-8666-666666666666',role:'teacher',status:'active',expires_at:'2099-01-01T00:00:00Z'};
function endpoint(probe,override={}) {
  const calls=[];
  const handler=createLessonHandler({mathEngine:katex,rpc:async(name,args)=>{
    calls.push(name);
    if(name==='api_session_lookup')return {data:[{...actor,...override}],error:null};
    if(name==='lesson_store')return {data:{ok:true,contract:'echs.lesson.store.v1',actor,classes:[]},error:null};
    if(name==='lesson_content_capabilities')return probe();
    if(name==='lesson_recovery_capabilities')return {data:null,error:{code:'42883'}};
    throw Error('Unexpected RPC');
  }});
  return {calls,read:()=>handler(new Request('https://fixture.supabase.co/functions/v1/lesson-api/context',{headers:{authorization:'Bearer isolated-opaque-token'}}))};
}
test('authenticated context advertises only a precisely matching successful installed-database probe', async () => {
  const service=endpoint(()=>({data:capability,error:null})),response=await service.read();
  assert.equal(response.status,200);const body=await response.json();assert.deepEqual(body.authoring_capabilities,capability);
  assert.equal(body.recovery_capabilities,null);
  assert.deepEqual(service.calls,['api_session_lookup','lesson_store','lesson_content_capabilities','lesson_recovery_capabilities']);
  assert.match(response.headers.get('cache-control'),/no-store/);
});
test('missing, failing, malformed and incomplete database capabilities remain null without raw errors', async () => {
  const probes=[()=>{throw Error('private backend failure');},()=>({data:null,error:{code:'42883',detail:'private SQL'}}),
    ...[null,{}, {...capability,content_version:1},{...capability,extra:true},{...capability,blocks:{...capability.blocks,math:[1]}},
      {...capability,blocks:{...capability.blocks,math:['1','2']}},{...capability,math_expression_version:2}].map(data=>()=>({data,error:null}))];
  for(const probe of probes){const response=await endpoint(probe).read();assert.equal(response.status,200);const data=await response.json();assert.equal(data.authoring_capabilities,null);assert.ok(!JSON.stringify(data).includes('private'));}
});
test('students and inactive sessions cannot trigger authoring capability probes', async () => {
  for(const override of [{role:'student'},{status:'suspended'}]){const service=endpoint(()=>{throw Error('must not run');},override),response=await service.read();assert.ok([401,403].includes(response.status));assert.deepEqual(service.calls,['api_session_lookup']);}
});
