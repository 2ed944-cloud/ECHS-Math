import test from 'node:test';
import assert from 'node:assert/strict';
import katex from '../lesson-runtime/node_modules/katex/dist/katex.mjs';
import { createLessonDraft, addSlide } from '../../js/lesson-studio/draft-model.mjs';
import { addBlock, removeBlock, moveBlock, updateBlock, restoreRemovedBlock, convertBlockToV2 } from '../../js/lesson-studio/block-model.mjs';

const initial = () => createLessonDraft({ lessonId: 'b27b9a11-b5a2-4c56-8393-21ad0e01c901', courseVersionId: 'c7109cf8-abb4-5541-b431-c2ef17f6dffb',
  catalog: { unit_id: 'legacy:ap-calculus:unit:1', topic_id: 'legacy:ap-calculus:topic:1.7' }, title: 'Original teacher discussion',
  objective: 'Explain the selected example.', skill: 'teacher:explain', summary: 'Original teacher-authored discussion.' });
const freeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
const copy = value => JSON.parse(JSON.stringify(value));

test('new text, math and callout defaults are original editable version2 blocks', () => {
  const original = freeze(initial()); let next = original;
  for (const type of ['rich-text', 'math', 'callout']) next = addBlock(next, 'slide-1', { type });
  assert.equal(original.slides[0].blocks.length, 1); assert.equal(next.slides[0].blocks.length, 4);
  assert.deepEqual(next.slides[0].blocks.slice(1).map(block => [block.type, block.version]), [['rich-text', 2], ['math', 2], ['callout', 2]]);
  assert.equal(next.slides[0].blocks[2].content.source.mode, 'visual');
  assert.deepEqual(next.slides[0].blocks[0], original.slides[0].blocks[0]);
});

test('insertion and movement preserve document metadata and allocate IDs across every slide', () => {
  const source = addSlide(initial(), { title: 'Second discussion' });
  const next = addBlock(freeze(source), 'slide-1', { afterId: source.slides[0].blocks[0].id });
  const id = next.slides[0].blocks[1].id; assert.notEqual(id, source.slides[1].blocks[0].id);
  const moved = moveBlock(next, 'slide-1', id, 0);
  assert.equal(moved.slides[0].blocks[0].id, id); assert.equal(next.slides[0].blocks[1].id, id);
  for (const key of ['lesson_id', 'course_version_id', 'document_version', 'publication', 'objectives', 'skills']) assert.deepEqual(moved[key], source[key]);
});

test('block update uses the canonical schema and owns a defensive copy', () => {
  const source = addBlock(initial(), 'slide-1'), block = source.slides[0].blocks[1];
  const content = { nodes: [{ type: 'paragraph', children: [{ type: 'text', text: 'Explain ', marks: ['strong'] },
    { type: 'link', href: 'https://example.org/lesson', children: [{ type: 'text', text: 'this original example' }] }] }] };
  const next = updateBlock(freeze(source), 'slide-1', block.id, { content }, { mathEngine: katex });
  content.nodes[0].children[0].text = 'Mutated caller'; assert.equal(next.slides[0].blocks[1].content.nodes[0].children[0].text, 'Explain ');
  assert.equal(source.slides[0].blocks[1].content.nodes[0].children[0].text, 'Add your explanation.');
});

test('explicit version1 conversion preserves text marks and exact original mathematics', () => {
  const block = freeze({ id: 'original', type: 'rich-text', version: 1, content: { paragraphs: [{ type: 'paragraph', children: [
    { type: 'text', text: 'Observe the function.', marks: ['strong'] }, { type: 'math', tex: '\\frac{x^2-1}{x-1}', spoken: 'x squared minus one over x minus one' }] }] } });
  const converted = convertBlockToV2(block, { mathEngine: katex });
  assert.equal(block.version, 1); assert.equal(converted.version, 2); assert.equal(converted.id, block.id);
  assert.deepEqual(converted.content.nodes[0].children[0], block.content.paragraphs[0].children[0]);
  assert.deepEqual(converted.content.nodes[0].children[1].source, { mode: 'tex', tex: block.content.paragraphs[0].children[1].tex });
  assert.equal(converted.content.nodes[0].children[1].spoken, block.content.paragraphs[0].children[1].spoken);
});

test('version1 math and callout conversion retain display, kind, title and speech', () => {
  const math = { id: 'equation', type: 'math', version: 1, content: { tex: 'x^2', spoken: 'x squared', display: false } };
  assert.deepEqual(convertBlockToV2(math).content, { source: { mode: 'tex', tex: 'x^2' }, spoken: 'x squared', display: false });
  const callout = { id: 'note', type: 'callout', version: 1, content: { kind: 'warning', title: 'Check the domain', body: initial().slides[0].blocks[0].content } };
  const converted = convertBlockToV2(callout); assert.equal(converted.content.kind, 'warning'); assert.equal(converted.content.title, callout.content.title);
  assert.deepEqual(converted.content.body.nodes, callout.content.body.paragraphs);
});

test('conversion is idempotent for supported version2 data and never modifies a saved draft implicitly', () => {
  const source = initial(), block = source.slides[0].blocks[0], converted = convertBlockToV2(block);
  assert.deepEqual(convertBlockToV2(converted), converted); assert.equal(source.slides[0].blocks[0].version, 1);
  const next = updateBlock(source, 'slide-1', block.id, { version: converted.version, content: converted.content });
  assert.equal(next.slides[0].blocks[0].version, 2); assert.equal(source.slides[0].blocks[0].version, 1);
  assert.throws(() => updateBlock(next, 'slide-1', block.id, { version: 1, content: block.content }), { code: 'unsupported_downgrade' });
});

test('closed patches reject unknown fields and getters without executing caller code', () => {
  const doc = initial(); let accessed = false;
  assert.throws(() => updateBlock(doc, 'slide-1', 'block-1', { get content() { accessed = true; return {}; } })); assert.equal(accessed, false);
  for (const patch of [{ id: 'new', content: {} }, { type: 'question', content: {} }, { teacher_notes: 'private', content: {} }, { content: { nodes: [], html: '<script>' } }]) {
    assert.throws(() => updateBlock(doc, 'slide-1', 'block-1', patch));
  }
});

test('version patches reject objects and coercion hooks before any comparison executes', () => {
  const doc = initial(), before = JSON.stringify(doc); let accessed = 0;
  const candidates = [
    { valueOf() { accessed++; return 2; } },
    { get valueOf() { accessed++; return () => 2; } },
    { [Symbol.toPrimitive]() { accessed++; return 2; } },
    '2', [2], null, NaN, Infinity
  ];
  for (const version of candidates) assert.throws(() => updateBlock(doc, 'slide-1', 'block-1', { version, content: doc.slides[0].blocks[0].content }), { code: 'invalid_patch' });
  assert.equal(accessed, 0); assert.equal(JSON.stringify(doc), before);
});

test('unsafe URLs, malformed mathematics and unknown versions fail before modifying source', () => {
  const doc = addBlock(initial(), 'slide-1', { type: 'math' }), block = doc.slides[0].blocks[1], before = JSON.stringify(doc);
  assert.throws(() => updateBlock(doc, 'slide-1', block.id, { content: { source: { mode: 'tex', tex: '\\frac{' }, spoken: 'Incomplete fraction', display: true } }, { mathEngine: katex }));
  assert.throws(() => updateBlock(doc, 'slide-1', block.id, { version: 99, content: block.content }));
  assert.throws(() => convertBlockToV2({ ...block, version: 99 })); assert.equal(JSON.stringify(doc), before);
});

test('deletion preserves a final block and recoverable restore retains later edits with unique IDs', () => {
  assert.throws(() => removeBlock(initial(), 'slide-1', 'block-1'), { code: 'final_block' });
  const doc = addBlock(initial(), 'slide-1'), removed = copy(doc.slides[0].blocks[1]);
  let next = removeBlock(doc, 'slide-1', removed.id); next = addBlock(next, 'slide-1', { type: 'callout' });
  const restored = restoreRemovedBlock(next, 'slide-1', { block: removed, index: 1 });
  assert.equal(restored.slides[0].blocks.length, 3); assert.equal(new Set(restored.slides[0].blocks.map(block => block.id)).size, 3);
  assert.equal(restored.slides[0].blocks[2].type, 'callout'); assert.deepEqual(restored.slides[0].blocks[1].content, removed.content);
});

test('block bounds and indexes are enforced without truncating content', () => {
  let doc = initial(); for (let index = 1; index < 40; index++) doc = addBlock(doc, 'slide-1');
  assert.equal(doc.slides[0].blocks.length, 40); assert.throws(() => addBlock(doc, 'slide-1'), { code: 'block_limit' });
  for (const index of [-1, 40, 1.2, '1']) assert.throws(() => moveBlock(doc, 'slide-1', 'block-1', index));
  for (const operation of [() => addBlock(doc, 'missing'), () => removeBlock(doc, 'slide-1', 'missing'), () => addBlock(initial(), 'slide-1', { type: 'question' })]) assert.throws(operation);
});

test('legacy references remain intact and cannot be converted into editable or public content', () => {
  const block = { id: 'legacy', type: 'legacy-embedded', version: 1, content: { source: 'lessons/ap-calculus/unit-1/lesson-1-1.html', anchor: 'intro', sha256: 'a'.repeat(64), summary: 'Preserved legacy reference.' } };
  const doc = initial(); doc.slides[0].blocks.push(block); const before = JSON.stringify(doc);
  assert.throws(() => convertBlockToV2(block), { code: 'unsupported_edit' });
  assert.throws(() => removeBlock(doc, 'slide-1', 'legacy'), { code: 'unsupported_edit' });
  assert.throws(() => updateBlock(doc, 'slide-1', 'legacy', { content: block.content }), { code: 'unsupported_edit' });
  assert.equal(JSON.stringify(doc), before);
});
