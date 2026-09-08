import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import katex from './node_modules/katex/dist/katex.mjs';
import * as browser from '../../js/lesson-runtime/schema.mjs';
import * as server from '../../supabase/functions/lesson-api/generated/schema.mjs';
import {assertPersistableDocument,assertPublishableDocument,assertStudentDocument} from '../../supabase/functions/lesson-api/document-contract.mjs';
import {LESSON_MEDIA_CAPABILITIES,confirmedMediaCapabilities} from '../../supabase/functions/lesson-api/media-handler.mjs';
import {supportsLessonMedia} from '../../js/lesson-runtime/asset-contract.mjs';
const {cases}=JSON.parse(fs.readFileSync(new URL('./fixtures/media-cases.json',import.meta.url),'utf8'));
const base=JSON.parse(fs.readFileSync(new URL('./fixtures/published-original.lesson.json',import.meta.url),'utf8'));
const clone=value=>structuredClone(value);
test('shared original media fixtures agree across standalone, canonical, and deployed validators',()=>{
  assert.ok(cases.length>=90);
  for(const item of cases)for(const api of [browser,server]) {
    const doc=clone(base);doc.slides=[{id:'media',title:'Original media',layout:'single',blocks:[clone(item.block)]}];
    assert.equal(api.validateLessonDocument(doc,{mathEngine:katex}).valid,item.valid,item.label);
    for(const call of [()=>api.assertLessonBlock(item.block,{mathEngine:katex}),()=>api.assertBlockContent(item.block.type,item.block.version,item.block.content,{mathEngine:katex})]) {
      if(item.valid)assert.doesNotThrow(call,item.label);else assert.throws(call,item.label);
    }
  }
});
test('media draft/review/student payload validation preserves exact institutional identity and publication gates',()=>{
  const document=clone(base);document.publication={status:'draft',audience:'institutional',revision:document.document_version};
  document.slides=[{id:'media',title:'Original media',layout:'single',blocks:cases.slice(0,4).map(x=>clone(x.block))}];
  const identity={lesson_id:document.lesson_id,course_version_id:document.course_version_id,unit_id:document.unit_id,topic_id:document.topic_id,document_version:document.document_version,publication_revision:document.publication.revision};
  assert.equal(assertPersistableDocument(document,{mathEngine:katex,identity}),document);
  assert.equal(assertPublishableDocument(document,{mathEngine:katex,identity}),document);
  assert.throws(()=>assertStudentDocument(document,{mathEngine:katex,identity}));
  const published=clone(document);published.publication.status='published';assert.equal(assertStudentDocument(published,{mathEngine:katex,identity}),published);
  assert.throws(()=>assertStudentDocument(published,{mathEngine:katex,identity:{...identity,lesson_id:'bad'}}));
  assert.equal(document.publication.status,'draft');
});
test('actual pinned KaTeX checks every media table cell; structural SQL is not a TeX parser',()=>{
  const block=clone(cases[2].block);block.content.rows[0].cells[1][0].source.tex='\\frac{1}{';
  assert.doesNotThrow(()=>browser.assertLessonBlock(block));
  for(const api of [browser,server])assert.throws(()=>api.assertLessonBlock(block,{mathEngine:katex}));
});
test('media capability has exact independent server/client agreement and rejects widening or partial contracts',()=>{
  assert.equal(confirmedMediaCapabilities(clone(LESSON_MEDIA_CAPABILITIES)),LESSON_MEDIA_CAPABILITIES);
  assert.equal(supportsLessonMedia(clone(LESSON_MEDIA_CAPABILITIES)),true);
  for(const value of [null,{},[],{...clone(LESSON_MEDIA_CAPABILITIES),extra:true},{...clone(LESSON_MEDIA_CAPABILITIES),max_image_bytes:8000000},
    {...clone(LESSON_MEDIA_CAPABILITIES),blocks:{...clone(LESSON_MEDIA_CAPABILITIES).blocks,image:[1,2]}},
    {...clone(LESSON_MEDIA_CAPABILITIES),mime_types:['image/svg+xml',...LESSON_MEDIA_CAPABILITIES.mime_types.slice(1)]}]) {
    assert.equal(confirmedMediaCapabilities(value),null);assert.equal(supportsLessonMedia(value),false);
  }
});
test('media does not implicitly convert old content or relax document size, prototype, text or HTML boundaries',()=>{
  assert.equal(browser.serializeLessonDocument(base),server.serializeLessonDocument(base));
  assert.equal(browser.LESSON_DOCUMENT_LIMITS.maxBytes,2097152);
  const block=clone(cases[0].block);let called=0;Object.defineProperty(block.content,'asset_id',{get(){called++;return 'bad';},enumerable:true});
  assert.throws(()=>browser.assertLessonBlock(block));assert.equal(called,0);
  for(const raw of ['<script>bad</script>','\u0000']) {const b=clone(cases[0].block);b.content.alt=raw;assert.throws(()=>browser.assertLessonBlock(b));}
});
