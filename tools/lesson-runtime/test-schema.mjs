import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import {
  validateLessonDocument, assertLessonDocument, parseLessonDocument, serializeLessonDocument,
  validateLessonMath, validatePublicLessonDocument, assertPublicLessonDocument, LessonDocumentError,
  LESSON_DOCUMENT_LIMITS
} from '../../js/lesson-runtime/schema.mjs';
import { getBlockDefinition, listBlockDefinitions, isSupportedBlock } from '../../js/lesson-runtime/block-registry.mjs';

const require = createRequire(import.meta.url);
const katex = require('katex');
const fixture = JSON.parse(await readFile(new URL('./fixtures/published-original.lesson.json', import.meta.url), 'utf8'));
const canonical = JSON.parse(await readFile(new URL('../../schemas/echs.lesson.v1.schema.json', import.meta.url), 'utf8'));
const copy = () => structuredClone(fixture);
const mathBlock = document => document.slides[1].blocks[0];
const richTextNode = document => document.slides[0].blocks[0].content.paragraphs[0].children[0];
function invalid(change, code) {
  const document = copy();
  change(document);
  const validation = validateLessonDocument(document);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.length);
  if (code) assert.ok(validation.errors.some(item => item.code === code), JSON.stringify(validation.errors));
  return validation;
}
function freeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

test('valid original fixture covers rich text, inline/display math, callout, all layouts and contexts', () => {
  assert.deepEqual(validateLessonDocument(fixture, { mathEngine: katex }), { valid: true, errors: [] });
  assert.equal(assertLessonDocument(fixture), fixture);
  assert.equal(assertPublicLessonDocument(fixture, { mathEngine: katex }), fixture);
});

test('serialization round trips without mutation, identity replacement or automatic migration', () => {
  const document = freeze(copy());
  const before = JSON.stringify(document);
  const serialized = serializeLessonDocument(document, { mathEngine: katex });
  assert.deepEqual(parseLessonDocument(serialized, { mathEngine: katex }), document);
  assert.equal(serializeLessonDocument(parseLessonDocument(serialized)), serialized);
  assert.equal(JSON.stringify(document), before);
  assert.equal(assertLessonDocument(document), document);
});

test('unknown schema versions and block versions are rejected instead of upgraded', () => {
  for (const version of ['echs.lesson.v0', 'echs.lesson.v2', '1', null]) {
    invalid(doc => { doc.schema_version = version; }, 'schema:const');
    const document = copy();
    document.schema_version = version;
    assert.throws(() => parseLessonDocument(JSON.stringify(document)), LessonDocumentError);
  }
  invalid(doc => { doc.slides[0].blocks[0].version = 2; });
  invalid(doc => { doc.slides[0].blocks[0].type = 'custom-script'; });
});

test('every canonical root property is required', () => {
  for (const field of canonical.required) invalid(doc => { delete doc[field]; }, 'schema:required');
});

test('identity and curriculum metadata require typed values and bounded versions', () => {
  invalid(doc => { doc.lesson_id = 'not-a-uuid'; });
  invalid(doc => { doc.course_version_id = '7314e157-f5f5-0492-0edd-b787730cf6d1'; });
  for (const value of [0, -1, 1.5, '1', 2147483648]) invalid(doc => { doc.document_version = value; });
  invalid(doc => { doc.publication.revision = 0; });
  invalid(doc => { doc.unit_id = 'bad unit'; });
  invalid(doc => { doc.topic_id = ''; });
  invalid(doc => { doc.slug = '../legacy'; });
  invalid(doc => { doc.objectives = ['untyped']; });
  invalid(doc => { doc.skills = []; });
  invalid(doc => { doc.skills.push(doc.skills[0]); });
  invalid(doc => { doc.accessibility.language = 'en_XX'; });
  invalid(doc => { doc.variants.contexts = ['unknown']; });
});

test('stable slide, block and objective IDs are unique in their documented namespaces', () => {
  invalid(doc => { doc.slides[1].id = doc.slides[0].id; }, 'duplicate-slide-id');
  invalid(doc => { doc.slides[2].blocks[0].id = doc.slides[0].blocks[0].id; }, 'duplicate-block-id');
  invalid(doc => { doc.objectives.push(structuredClone(doc.objectives[0])); }, 'duplicate-objective-id');
  invalid(doc => { doc.slides[0].id = 'bad#fragment'; });
  invalid(doc => { doc.slides[0].blocks[0].id = 'space id'; });
});

test('public fixture cannot acquire question payloads, private notes or unknown extension fields', () => {
  for (const field of ['answers', 'answer_key', 'teacher_notes', 'question_payload', 'private_data']) {
    invalid(doc => { doc[field] = 'Forbidden fixture marker'; }, 'schema:additionalProperties');
    invalid(doc => { doc.slides[0].blocks[0].content[field] = 'Forbidden fixture marker'; });
  }
  invalid(doc => { doc.publication.approved_by = 'unrecognized-field'; });
  invalid(doc => { doc.slides[0].blocks[0].answer = 42; });
});

test('plain text and rich text reject raw HTML, event handlers and arbitrary link nodes', () => {
  for (const value of ['<', '>', '<script>alert(1)</script>', '<img src=x onerror=alert(1)>', '\u0000', '   ']) {
    invalid(doc => { doc.title = value; });
    invalid(doc => { richTextNode(doc).text = value; });
  }
  invalid(doc => { richTextNode(doc).html = '<b>unsafe</b>'; });
  invalid(doc => { richTextNode(doc).onclick = 'alert(1)'; });
  invalid(doc => { doc.slides[0].blocks[0].content.paragraphs[0].children[0] = { type: 'link', text: 'Unsafe', href: 'javascript:alert(1)' }; });
  invalid(doc => { richTextNode(doc).marks = ['script']; });
});

test('legacy blocks are bounded canonical path references without HTML or executable fields', () => {
  const reference = {
    id: 'legacy-reference', type: 'legacy-embedded', version: 1,
    content: { source: 'lessons/ap-calculus/unit-1/lesson-1-1.html', anchor: 'slide-introduction', sha256: 'a'.repeat(64), summary: 'Retain the original lesson as a separate compatibility reference.' }
  };
  const document = copy();
  document.slides[0].blocks = [reference];
  assert.equal(validateLessonDocument(document).valid, true);
  for (const source of ['https://example.test/lesson.html', '//example.test/a.html', 'javascript:alert(1)', 'lessons/../secret.html', 'lessons/%2e%2e/secret.html', 'lessons/a.html?private=true', 'lessons/a.html#fragment', 'lessons\\a.html', '.staging/lesson.html']) {
    const changed = structuredClone(document);
    changed.slides[0].blocks[0].content.source = source;
    assert.equal(validateLessonDocument(changed).valid, false, source);
  }
  for (const field of ['rawHTML', 'html', 'iframe', 'script', 'answers']) {
    const changed = structuredClone(document);
    changed.slides[0].blocks[0].content[field] = 'Rejected marker';
    assert.equal(validateLessonDocument(changed).valid, false);
  }
  document.slides[0].blocks[0].content.anchor = '#bad';
  assert.equal(validateLessonDocument(document).valid, false);
});

test('structural limits reject oversized collections, text, nesting and JSON payloads', () => {
  invalid(doc => { doc.title = 'x'.repeat(241); });
  invalid(doc => { richTextNode(doc).text = 'x'.repeat(4001); });
  invalid(doc => { doc.slides = Array.from({ length: 121 }, (_, index) => ({ ...doc.slides[0], id: `slide-${index}` })); });
  invalid(doc => { doc.slides[0].blocks = Array.from({ length: 41 }, (_, index) => ({ ...doc.slides[0].blocks[0], id: `block-${index}` })); });
  invalid(doc => { let value = doc; for (let i = 0; i < 30; i++) { value.extra = {}; value = value.extra; } }, 'depth-limit');
  invalid(doc => { doc.extra = 'x'.repeat(LESSON_DOCUMENT_LIMITS.maxBytes + 1); }, 'size-limit');
  assert.throws(() => parseLessonDocument(' '.repeat(LESSON_DOCUMENT_LIMITS.maxBytes + 1)), LessonDocumentError);
  assert.throws(() => parseLessonDocument(JSON.stringify({ extra: 'أ'.repeat(LESSON_DOCUMENT_LIMITS.maxBytes / 2) })), LessonDocumentError);
});

test('plain JSON preflight rejects non-finite values, special objects, cycles and sparse arrays', () => {
  for (const value of [NaN, Infinity, -Infinity]) invalid(doc => { doc.document_version = value; }, 'non-finite-number');
  for (const value of [undefined, () => {}, 1n]) invalid(doc => { doc.extra = value; }, 'non-json-value');
  for (const value of [new Date(), new Map(), new Set(), /unsafe/, Object.create({ inherited: true })]) {
    invalid(doc => { doc.extra = value; }, 'non-plain-object');
  }
  invalid(doc => { doc.extra = doc; }, 'cycle');
  invalid(doc => { delete doc.slides[0]; }, 'invalid-array');
  invalid(doc => { doc.slides.extra = 'unsafe'; }, 'invalid-array');
  invalid(doc => { doc.slides = new Array(100000000); }, 'invalid-array');
  assert.throws(() => parseLessonDocument('{"document_version":1e400}'), LessonDocumentError);
});

test('prototype-pollution keys, accessors, symbols and hidden data are rejected without evaluating getters', () => {
  let touched = false;
  invalid(doc => { Object.defineProperty(doc, 'extra', { get() { touched = true; throw new Error('Must not execute'); }, enumerable: true }); }, 'property-descriptor');
  assert.equal(touched, false);
  invalid(doc => { Object.defineProperty(doc, 'extra', { value: 'hidden', enumerable: false }); }, 'property-descriptor');
  invalid(doc => { doc[Symbol('private')] = true; }, 'symbol-property');
  for (const key of ['__proto__', 'prototype', 'constructor', 'toJSON']) {
    invalid(doc => { Object.defineProperty(doc, key, { value: {}, enumerable: true }); }, 'forbidden-property');
    assert.throws(() => parseLessonDocument(JSON.stringify({ [key]: {} })), LessonDocumentError);
  }
  assert.equal({}.polluted, undefined);
});

test('safe mathematics is validated explicitly with local KaTeX and controlled options', () => {
  assert.deepEqual(validateLessonMath(fixture, katex), { valid: true, errors: [] });
  const document = copy();
  mathBlock(document).content.tex = '\\frac{1}{';
  assert.equal(validateLessonDocument(document).valid, true);
  assert.equal(validateLessonMath(document, katex).valid, false);
  assert.equal(validateLessonDocument(document, { mathEngine: katex }).valid, false);
  assert.throws(() => assertLessonDocument(document, { mathEngine: katex }), LessonDocumentError);
  assert.throws(() => parseLessonDocument(JSON.stringify(document), { mathEngine: katex }), LessonDocumentError);
  assert.throws(() => serializeLessonDocument(document, { mathEngine: katex }), LessonDocumentError);
  const optionsUsed = [];
  assert.equal(validateLessonMath(fixture, { renderToString(tex, options) { optionsUsed.push(options); return ''; } }).valid, true);
  assert.ok(optionsUsed.length >= 2);
  for (const options of optionsUsed) {
    assert.equal(options.trust, false);
    assert.equal(options.throwOnError, true);
    assert.equal(options.strict, 'error');
    assert.equal(options.maxExpand, 100);
    assert.equal(options.maxSize, 10);
  }
});

test('math cannot enable links, HTML, external resources or macro definitions', () => {
  for (const tex of ['\\href{javascript:alert(1)}{x}', '\\url{https://example.test}', '\\htmlStyle{color:red}{x}', '\\includegraphics{a.svg}', '\\def\\x{x}\\x', '\\newcommand{\\x}{x}', '\\csname href\\endcsname', '\\text{<img src=x>}']) {
    invalid(doc => { mathBlock(doc).content.tex = tex; }, 'unsafe-math');
  }
  const document = copy();
  mathBlock(document).content.tex = 'x<y';
  assert.equal(validateLessonMath(document, katex).valid, true);
});

test('public delivery denies every unpublished state and nonpublic audience', () => {
  for (const status of ['draft', 'review', 'approved', 'superseded', 'archived']) {
    const document = copy();
    document.publication.status = status;
    assert.equal(validateLessonDocument(document).valid, true);
    assert.ok(validatePublicLessonDocument(document, { mathEngine: katex }).errors.some(item => item.code === 'not-published'));
    assert.throws(() => assertPublicLessonDocument(document, { mathEngine: katex }), LessonDocumentError);
  }
  for (const audience of ['institutional', 'teacher']) {
    const document = copy();
    document.publication.audience = audience;
    assert.ok(validatePublicLessonDocument(document, { mathEngine: katex }).errors.some(item => item.code === 'not-public'));
  }
});

test('public math fails closed without local syntax validation; text-only documents need no engine', () => {
  assert.ok(validatePublicLessonDocument(fixture).errors.some(item => item.code === 'math-engine-required'));
  const document = copy();
  document.slides = [document.slides[2]];
  assert.deepEqual(validatePublicLessonDocument(document), { valid: true, errors: [] });
  const malformed = copy();
  mathBlock(malformed).content.tex = '\\frac{1}{';
  assert.ok(validatePublicLessonDocument(malformed, { mathEngine: katex }).errors.some(item => item.code === 'invalid-math'));
});

test('registry is explicit, immutable and agrees with the canonical schema', () => {
  const registry = listBlockDefinitions();
  assert.equal(registry.length, 4);
  assert.ok(Object.isFrozen(registry));
  assert.deepEqual(registry.map(item => item.schema).sort(), canonical.definitions.block.oneOf.map(item => item.$ref).sort());
  for (const definition of registry) {
    assert.equal(getBlockDefinition(definition.type, definition.version), definition);
    assert.ok(Object.isFrozen(definition));
    assert.ok(Object.isFrozen(definition.capabilities));
    assert.equal(definition.capabilities.interactive, false);
  }
  assert.equal(getBlockDefinition('legacy-embedded').capabilities.referenceOnly, true);
  assert.equal(getBlockDefinition('question'), null);
  assert.equal(isSupportedBlock('math', 2), false);
  assert.equal(isSupportedBlock('__proto__'), false);
});

test('error objects have predictable safe shapes and malformed JSON throws the documented error', () => {
  for (const value of ['', '{', '[]', 'null', '42', '{}']) assert.throws(() => parseLessonDocument(value), LessonDocumentError);
  assert.throws(() => parseLessonDocument(fixture), LessonDocumentError);
  const validation = invalid(doc => { delete doc.title; });
  for (const issue of validation.errors) {
    assert.deepEqual(Object.keys(issue), ['path', 'code', 'message']);
    assert.equal(typeof issue.path, 'string');
    assert.equal(typeof issue.code, 'string');
    assert.equal(typeof issue.message, 'string');
  }
});
