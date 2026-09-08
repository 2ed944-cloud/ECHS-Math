import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import * as canonical from '../../js/lesson-runtime/schema.mjs';
import * as deployed from '../../supabase/functions/lesson-api/generated/schema.mjs';
import {
  assertPersistableDocument, assertPublishableDocument, assertStudentDocument, SERVER_KATEX_VERSION, MAX_PERSISTED_DOCUMENT_BYTES
} from '../../supabase/functions/lesson-api/document-contract.mjs';

const require = createRequire(import.meta.url);
const katex = require('katex');
const publicFixture = JSON.parse(await readFile(new URL('./fixtures/published-original.lesson.json', import.meta.url), 'utf8'));
function fixture(status = 'draft') {
  const document = structuredClone(publicFixture);
  document.publication = { status, audience: 'institutional', revision: 1 };
  return document;
}
function identity(document) {
  return Object.fromEntries([
    ...['lesson_id', 'course_version_id', 'unit_id', 'topic_id', 'document_version'].map(key => [key, document[key]]),
    ['publication_revision', document.publication.revision]
  ]);
}
const options = document => ({ mathEngine: katex, identity: identity(document) });
function rejected(run, code) {
  assert.throws(run, error => error instanceof deployed.LessonDocumentError && error.errors.some(item => item.code === code));
}
function deepFreeze(value) {
  if (value && typeof value === 'object') { Object.values(value).forEach(deepFreeze); Object.freeze(value); }
  return value;
}
function legacy(document) {
  document.slides[0].blocks.push({ id: 'legacy-reference', type: 'legacy-embedded', version: 1, content: {
    source: 'lessons/ap-calculus/unit-1/lesson-1-1.html', anchor: 's1', sha256: 'a'.repeat(64),
    summary: 'Preserve this reference in the draft until a trusted importer verifies the source.'
  } });
  return document;
}

// Build a structurally valid document to an independently measured exact byte
// boundary, while keeping every string, block, slide and node below schema caps.
function sizedFixture(bytes, status = 'draft', character = 'x') {
  const document = fixture(status);
  const nodes = [];
  document.slides = Array.from({length:8},(_,slideIndex) => ({
    id:`size-slide-${slideIndex}`,title:'Bounded original text',layout:'single',
    blocks:Array.from({length:40},(_,blockIndex) => {
      const node = {type:'text',text:'x'}; nodes.push(node);
      return {id:`size-block-${slideIndex}-${blockIndex}`,type:'rich-text',version:1,
        content:{paragraphs:[{type:'paragraph',children:[node]}]}};
    })
  }));
  let remaining = bytes - Buffer.byteLength(JSON.stringify(document),'utf8');
  assert.ok(remaining >= 0);
  const width = Buffer.byteLength(character,'utf8');
  for (const node of nodes) {
    const count = Math.min(3999,Math.floor(remaining / width));
    node.text += character.repeat(count); remaining -= count * width;
    if (!remaining) break;
  }
  if (remaining) {
    const node = nodes.find(node => node.text.length + remaining <= 4000);
    assert.ok(node); node.text += 'x'.repeat(remaining); remaining = 0;
  }
  assert.equal(Buffer.byteLength(JSON.stringify(document),'utf8'),bytes);
  assert.equal(canonical.validateLessonDocument(document).valid,true);
  return document;
}

test('deployed bundle exposes exactly the canonical API and matches validation/round trips', () => {
  assert.deepEqual(Object.keys(deployed).sort(), Object.keys(canonical).sort());
  const documents = [fixture(), fixture('published'), null, {}, { schema_version: 'unknown' }];
  const brokenMath = fixture(); brokenMath.slides[1].blocks[0].content.tex = '\\frac{1}{'; documents.push(brokenMath);
  const unknown = fixture(); unknown.private_notes = 'Excluded'; documents.push(unknown);
  for (const document of documents) {
    assert.deepEqual(deployed.validateLessonDocument(document, { mathEngine: katex }), canonical.validateLessonDocument(document, { mathEngine: katex }));
  }
  assert.equal(deployed.serializeLessonDocument(publicFixture), canonical.serializeLessonDocument(publicFixture));
  assert.deepEqual(deployed.parseLessonDocument(JSON.stringify(publicFixture)), publicFixture);
});

test('bundle provenance hashes the actual generated output and has no external runtime imports/eval', async () => {
  const url = new URL('../../supabase/functions/lesson-api/generated/', import.meta.url);
  const output = await readFile(new URL('schema.mjs', url), 'utf8');
  const provenance = JSON.parse(await readFile(new URL('schema.provenance.json', url), 'utf8'));
  assert.equal(createHash('sha256').update(output).digest('hex'), provenance.output_sha256);
  assert.equal(provenance.schema_version, 'echs.lesson.v1');
  assert.deepEqual(provenance.sources.map(source => source.path).sort(), [
    'js/lesson-runtime/schema.mjs', 'js/lesson-runtime/block-registry.mjs',
    'js/lesson-runtime/generated/validate-lesson-document.mjs', 'js/lesson-runtime/math-expression.mjs'
  ].sort());
  assert.equal(/\bimport\s*(?:["'{*(]|[A-Za-z_$])/.test(output), false);
  assert.equal(/\b(?:eval\s*\(|new\s+Function\s*\()/.test(output), false);
});

test('draft persistence and publication checks return the same immutable input without state promotion', () => {
  const document = deepFreeze(fixture());
  const before = JSON.stringify(document);
  assert.equal(assertPersistableDocument(document, options(document)), document);
  assert.equal(assertPublishableDocument(document, options(document)), document);
  assert.equal(JSON.stringify(document), before);
  assert.equal(document.publication.status, 'draft');
  assert.equal(Object.hasOwn(document, 'mastery'), false);
});

test('student delivery accepts only a server-bound published institutional snapshot', () => {
  const document = deepFreeze(fixture('published'));
  assert.equal(assertStudentDocument(document, options(document)), document);
  rejected(() => assertStudentDocument(fixture(), options(fixture())), 'invalid-publication-state');
  for (const status of ['review', 'approved', 'superseded', 'archived']) {
    const blocked = fixture(status);
    rejected(() => assertStudentDocument(blocked, options(blocked)), 'invalid-publication-state');
  }
});

test('draft operations reject callers trying to supply reviewed, approved, or published content states', () => {
  for (const status of ['review', 'approved', 'published', 'superseded', 'archived']) {
    const document = fixture(status);
    for (const check of [assertPersistableDocument, assertPublishableDocument]) {
      rejected(() => check(document, options(document)), 'invalid-publication-state');
    }
  }
});

test('public and teacher audiences are refused without relabelling them as institutional', () => {
  for (const audience of ['public', 'teacher']) {
    for (const check of [assertPersistableDocument, assertPublishableDocument, assertStudentDocument]) {
      const document = fixture(check === assertStudentDocument ? 'published' : 'draft');
      document.publication.audience = audience;
      rejected(() => check(document, options(document)), 'institutional-audience-required');
      assert.equal(document.publication.audience, audience);
    }
  }
});

test('every server identity field and publication revision are required and checked against the record', () => {
  for (const check of [assertPersistableDocument, assertPublishableDocument, assertStudentDocument]) {
    const document = fixture(check === assertStudentDocument ? 'published' : 'draft');
    rejected(() => check(document, { mathEngine: katex }), 'server-identity-required');
    for (const field of Object.keys(identity(document))) {
      const mismatched = identity(document); mismatched[field] = 'different-record';
      rejected(() => check(document, { mathEngine: katex, identity: mismatched }), 'identity-mismatch');
      const missing = identity(document); delete missing[field];
      rejected(() => check(document, { mathEngine: katex, identity: missing }), 'identity-mismatch');
    }
  }
});

test('legacy references remain draft-only even with a syntactically valid claimed hash', () => {
  const document = legacy(fixture());
  assert.equal(assertPersistableDocument(document, options(document)), document);
  rejected(() => assertPublishableDocument(document, options(document)), 'unverified-publication-block');
  const published = legacy(fixture('published'));
  rejected(() => assertStudentDocument(published, options(published)), 'unverified-publication-block');
});

test('server validation always requires its exact pinned trusted math engine, including text-only documents', () => {
  assert.equal(katex.version, SERVER_KATEX_VERSION);
  const document = fixture(); document.slides = [document.slides[2]];
  for (const mathEngine of [undefined, null, {}, { version: '0.0.0', renderToString() {} }]) {
    rejected(() => assertPersistableDocument(document, { identity: identity(document), mathEngine }), 'trusted-math-engine-required');
  }
});

test('all server operations reject malformed math with bounded, untrusted KaTeX options', () => {
  for (const check of [assertPersistableDocument, assertPublishableDocument, assertStudentDocument]) {
    const document = fixture(check === assertStudentDocument ? 'published' : 'draft');
    document.slides[1].blocks[0].content.tex = '\\frac{1}{';
    rejected(() => check(document, options(document)), 'invalid-math');
  }
  const calls = [];
  const document = fixture();
  assertPersistableDocument(document, { identity: identity(document), mathEngine: {
    version: SERVER_KATEX_VERSION, renderToString(tex, options) { calls.push(options); return katex.renderToString(tex, options); }
  } });
  assert.ok(calls.length >= 2);
  for (const options of calls) {
    assert.equal(options.trust, false); assert.equal(options.throwOnError, true); assert.equal(options.strict, 'error');
    assert.equal(options.maxExpand, 100); assert.equal(options.maxSize, 10);
  }
});

test('malformed structures, unsupported versions, private fields and payload organization claims are rejected', () => {
  for (const field of ['teacher_notes', 'answers', 'question_payload', 'organization_id', 'account_id', 'mastery']) {
    const document = fixture(); document[field] = 'This field must never enter student content.';
    rejected(() => assertPersistableDocument(document, options(document)), 'schema:additionalProperties');
  }
  const unknown = fixture(); unknown.schema_version = 'echs.lesson.v2';
  rejected(() => assertPersistableDocument(unknown, options(unknown)), 'schema:const');
  const duplicate = fixture(); duplicate.slides[1].id = duplicate.slides[0].id;
  rejected(() => assertPersistableDocument(duplicate, options(duplicate)), 'duplicate-slide-id');
  const pollution = fixture(); Object.defineProperty(pollution, '__proto__', { value: {}, enumerable: true });
  rejected(() => assertPersistableDocument(pollution, options(pollution)), 'forbidden-property');
});

test('validation error details are safe and do not return offending private values', () => {
  const marker = 'DO-NOT-RETURN-THIS-PRIVATE-MARKER';
  const document = fixture(); document.teacher_notes = marker;
  try { assertPersistableDocument(document, options(document)); assert.fail('Must reject unknown private fields.'); }
  catch (error) {
    assert.ok(error instanceof deployed.LessonDocumentError);
    assert.equal(JSON.stringify(error.errors).includes(marker), false);
    for (const item of error.errors) assert.deepEqual(Object.keys(item), ['path', 'code', 'message']);
  }
});

test('institutional checks do not weaken the unchanged public schema delivery gate', () => {
  const document = fixture('published');
  assert.equal(assertStudentDocument(document, options(document)), document);
  assert.equal(canonical.validatePublicLessonDocument(document, { mathEngine: katex }).valid, false);
  assert.equal(deployed.validatePublicLessonDocument(document, { mathEngine: katex }).valid, false);
  assert.equal(canonical.validatePublicLessonDocument(publicFixture, { mathEngine: katex }).valid, true);
});

test('persisted documents have an exact compact JSON 1 MiB boundary without changing the general schema limit', () => {
  assert.equal(MAX_PERSISTED_DOCUMENT_BYTES,1024 * 1024);
  assert.equal(canonical.LESSON_DOCUMENT_LIMITS.maxBytes,2 * 1024 * 1024);
  for (const check of [assertPersistableDocument,assertPublishableDocument,assertStudentDocument]) {
    const status = check === assertStudentDocument ? 'published' : 'draft';
    for (const bytes of [MAX_PERSISTED_DOCUMENT_BYTES - 1,MAX_PERSISTED_DOCUMENT_BYTES]) {
      const document = sizedFixture(bytes,status);
      assert.equal(check(document,options(document)),document);
    }
    const oversized = sizedFixture(MAX_PERSISTED_DOCUMENT_BYTES + 1,status);
    assert.equal(canonical.validateLessonDocument(oversized).valid,true);
    rejected(() => check(oversized,options(oversized)),'persisted-size-limit');
  }
});

test('persistence counts multibyte UTF-8 and ignores presentation whitespace outside compact JSON', () => {
  const document = sizedFixture(MAX_PERSISTED_DOCUMENT_BYTES,'draft','س');
  assert.ok(JSON.stringify(document).length < MAX_PERSISTED_DOCUMENT_BYTES);
  assert.equal(assertPersistableDocument(document,options(document)),document);
  const pretty = JSON.stringify(document,null,2);
  assert.ok(Buffer.byteLength(pretty,'utf8') > MAX_PERSISTED_DOCUMENT_BYTES);
  const parsed = JSON.parse(pretty);
  assert.equal(assertPersistableDocument(parsed,options(parsed)),parsed);
  for (const check of [assertPersistableDocument,assertPublishableDocument,assertStudentDocument]) {
    const oversized = sizedFixture(MAX_PERSISTED_DOCUMENT_BYTES + 1,check === assertStudentDocument ? 'published' : 'draft','س');
    assert.ok(JSON.stringify(oversized).length < MAX_PERSISTED_DOCUMENT_BYTES);
    rejected(() => check(oversized,options(oversized)),'persisted-size-limit');
  }
});
