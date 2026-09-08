import test from 'node:test';
import assert from 'node:assert/strict';
import { createLessonDraft, addSlide, duplicateSlide, renameSlide, moveSlide, removeSlide, restoreRemovedSlide, updateSlide, assertDraftDocument } from '../../js/lesson-studio/draft-model.mjs';

const metadata = () => ({ lessonId: 'b27b9a11-b5a2-4c56-8393-21ad0e01c901', courseVersionId: 'c7109cf8-abb4-5541-b431-c2ef17f6dffb',
  catalog: { unit_id: 'legacy:ap-calculus:unit:1', topic_id: 'legacy:ap-calculus:topic:1.7' },
  title: 'Teacher-authored limit discussion', objective: 'Explain the teacher-selected example.', skill: 'teacher:reasoning', summary: 'A teacher-entered lesson summary.' });
const initial = () => createLessonDraft(metadata());
const clone = value => JSON.parse(JSON.stringify(value));
function freeze(value) { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; }

test('creation preserves explicit teacher wording and exact server catalog scope', () => {
  const input = freeze(metadata()), doc = createLessonDraft(input);
  assert.equal(doc.lesson_id, input.lessonId); assert.equal(doc.course_version_id, input.courseVersionId);
  assert.equal(doc.unit_id, input.catalog.unit_id); assert.equal(doc.topic_id, input.catalog.topic_id);
  assert.deepEqual(doc.skills, [input.skill]); assert.equal(doc.objectives[0].text, input.objective);
  assert.match(doc.objectives[0].id, /^teacher:/); assert.equal(doc.publication.status, 'draft');
  assert.equal(doc.publication.audience, 'institutional'); assert.equal(doc.document_version, 1);
  assert.equal(doc.slides.length, 1); assertDraftDocument(doc);
});

test('creation requires explicit identities, scope and teacher metadata', () => {
  for (const key of ['lessonId', 'courseVersionId', 'catalog', 'objective', 'skill', 'summary']) {
    const input = metadata(); delete input[key]; assert.throws(() => createLessonDraft(input));
  }
  assert.throws(() => createLessonDraft({ ...metadata(), objective: '<script>unsafe</script>' }));
  assert.throws(() => createLessonDraft({ ...metadata(), skill: 'unscoped words with spaces' }));
});

test('non-Latin teacher titles create a valid deterministic slug without fabricated objectives', () => {
  const doc = createLessonDraft({ ...metadata(), title: 'النهايات والاستمرارية', language: 'ar' });
  assert.match(doc.slug, /^lesson-[0-9a-f-]+$/); assert.equal(doc.accessibility.language, 'ar');
  assert.equal(doc.objectives[0].text, metadata().objective);
});

test('five-slide construction inserts after a selected slide and never mutates its input', () => {
  const original = freeze(initial()); let doc = original;
  for (let number = 2; number <= 5; number++) doc = addSlide(doc, { title: `Discussion ${number}` });
  assert.equal(doc.slides.length, 5); assert.equal(original.slides.length, 1);
  const inserted = addSlide(doc, { title: 'Between', afterId: doc.slides[0].id });
  assert.equal(inserted.slides[1].title, 'Between'); assert.equal(doc.slides[1].title, 'Discussion 2');
  assert.equal(new Set(inserted.slides.map(slide => slide.id)).size, 6);
  assert.equal(new Set(inserted.slides.flatMap(slide => slide.blocks.map(block => block.id))).size, 6);
});

test('duplicate regenerates the slide and every copied block ID without sharing nested objects', () => {
  const original = initial(); original.slides[0].blocks.push({ id: 'another-block', type: 'math', version: 1, content: { tex: 'x^2', spoken: 'x squared', display: true } });
  freeze(original); const doc = duplicateSlide(original, original.slides[0].id);
  assert.notEqual(doc.slides[0].id, doc.slides[1].id); assert.match(doc.slides[1].title, /\(copy\)$/);
  assert.equal(new Set(doc.slides.flatMap(slide => slide.blocks.map(block => block.id))).size, 4);
  assert.deepEqual(doc.slides[1].blocks[1].content, original.slides[0].blocks[1].content);
  doc.slides[1].blocks[1].content.tex = 'x^3'; assert.equal(original.slides[0].blocks[1].content.tex, 'x^2');
});

test('identifier allocation is bounded even for imported enormous numeric suffixes', () => {
  const doc = initial(); doc.slides[0].id = 'slide-9007199254740991'; doc.slides[0].blocks[0].id = 'block-9007199254740991';
  const next = duplicateSlide(doc, doc.slides[0].id); assert.equal(next.slides[1].id, 'slide-1'); assertDraftDocument(next);
});

test('rename, layout change and reorder preserve identity and server revision metadata', () => {
  const original = freeze(addSlide(addSlide(initial(), { title: 'Second' }), { title: 'Third' }));
  const renamed = renameSlide(original, original.slides[0].id, 'Revised introduction');
  const laidOut = updateSlide(renamed, renamed.slides[0].id, { layout: 'two-column' });
  const moved = moveSlide(laidOut, laidOut.slides[0].id, 2);
  assert.deepEqual(moved.slides.map(slide => slide.title), ['Second', 'Third', 'Revised introduction']);
  assert.equal(moved.slides[2].layout, 'two-column'); assert.equal(original.slides[0].layout, 'single');
  for (const key of ['lesson_id','course_version_id','unit_id','topic_id','slug','document_version']) assert.equal(moved[key], original[key]);
  assert.deepEqual(moved.publication, original.publication);
});

test('deletion leaves one valid slide and refuses invalid identities or positions', () => {
  const doc = addSlide(initial(), { title: 'Second' }); const next = removeSlide(doc, doc.slides[0].id);
  assert.equal(next.slides.length, 1); assert.equal(doc.slides.length, 2);
  assert.throws(() => removeSlide(next, next.slides[0].id), { code: 'final_slide' });
  for (const index of [-1, 2, 1.5, '1']) assert.throws(() => moveSlide(doc, doc.slides[0].id, index));
  for (const change of [() => renameSlide(doc, 'missing', 'Name'), () => addSlide(doc, { afterId: 'missing' }), () => removeSlide(doc, 'missing')]) assert.throws(change);
});

test('closed slide patches reject unknown fields, getters, executable content and duplicate block identities', () => {
  const doc = addSlide(initial(), {}), id = doc.slides[0].id;
  for (const patch of [{ id: 'replacement' }, { private_notes: 'secret' }, { layout: 'arbitrary-css' }, { title: '<img onerror=x>' }, { blocks: [] }]) assert.throws(() => updateSlide(doc, id, patch));
  let invoked = false; const patch = {}; Object.defineProperty(patch, 'title', { enumerable: true, get() { invoked = true; return 'Bad'; } });
  assert.throws(() => updateSlide(doc, id, patch)); assert.equal(invoked, false);
  assert.throws(() => updateSlide(doc, id, { blocks: clone(doc.slides[1].blocks) }));
  assert.throws(() => updateSlide(doc, id, { blocks: [{ id: 'unsafe-math', type: 'math', version: 1, content: { tex: '\\href{https://example.test}{x}', spoken: 'x', display: false } }] }));
});

test('delete recovery restores one slide while retaining later edits and current server revisions', () => {
  const original = addSlide(addSlide(initial(), { title: 'Second' }), { title: 'Third' });
  const removed = freeze({ slide: clone(original.slides[1]), index: 1 });
  let current = removeSlide(original, removed.slide.id);
  current = renameSlide(current, current.slides[0].id, 'Later edit');
  current.document_version = 8; current.publication.revision = 8; freeze(current);
  const restored = restoreRemovedSlide(current, removed);
  assert.deepEqual(restored.slides.map(slide => slide.title), ['Later edit', 'Second', 'Third']);
  assert.equal(restored.slides[1].id, removed.slide.id);
  for (const key of ['lesson_id','course_version_id','unit_id','topic_id','slug','document_version']) assert.equal(restored[key], current[key]);
  assert.deepEqual(restored.publication, current.publication);
  restored.slides[1].blocks[0].content.paragraphs[0].children[0].text = 'Changed recovery';
  assert.notEqual(removed.slide.blocks[0].content.paragraphs[0].children[0].text, 'Changed recovery');
  assert.equal(current.slides.length, 2);
});

test('delete recovery remaps reused slide and block IDs and clamps a former position after later deletions', () => {
  const original = addSlide(addSlide(initial(), { title: 'Second' }), { title: 'Third' });
  const removed = { slide: clone(original.slides[1]), index: 1 };
  const current = addSlide(removeSlide(original, removed.slide.id), { title: 'Newly added' });
  assert.equal(current.slides.at(-1).id, removed.slide.id);
  const restored = restoreRemovedSlide(current, removed);
  const recovered = restored.slides.find(slide => !current.slides.some(existing => existing.id === slide.id));
  assert.equal(recovered.title, 'Second'); assert.notEqual(recovered.id, removed.slide.id);
  assert.equal(new Set(restored.slides.flatMap(slide => slide.blocks.map(block => block.id))).size, 4);
  assert.equal(restored.slides.at(-1).title, 'Newly added'); assertDraftDocument(restored);
  const third = { slide: original.slides[2], index: 2 };
  const fewer = removeSlide(removeSlide(original, third.slide.id), original.slides[1].id);
  assert.equal(restoreRemovedSlide(fewer, third).slides.at(-1).title, 'Third');
});

test('delete recovery rejects malformed slide identity, unsafe content, accessors and the slide cap', () => {
  const current = initial(), original = clone(current.slides[0]);
  for (const patch of [{ lesson_id: current.lesson_id }, { id: '../unsafe' }, { title: '<script>unsafe</script>' }, { blocks: [] }]) {
    assert.throws(() => restoreRemovedSlide(current, { slide: { ...original, ...patch }, index: 0 }));
  }
  let invoked = false; const slide = { ...original };
  Object.defineProperty(slide, 'title', { enumerable: true, get() { invoked = true; return 'Getter'; } });
  assert.throws(() => restoreRemovedSlide(current, { slide, index: 0 })); assert.equal(invoked, false);
  for (const index of [-1, 120, 0.5, '0']) assert.throws(() => restoreRemovedSlide(current, { slide: original, index }));
  const full = clone(current);
  full.slides = Array.from({ length: 120 }, (_, i) => ({ ...clone(original), id: `s-${i}`, blocks: [{ ...clone(original.blocks[0]), id: `b-${i}` }] }));
  assert.throws(() => restoreRemovedSlide(full, { slide: original, index: 0 }), { code: 'slide_limit' });
});

test('publication states, audiences and changed document identity cannot enter the editing model', () => {
  const doc = initial();
  for (const status of ['review', 'approved', 'published']) { const bad = clone(doc); bad.publication.status = status; assert.throws(() => addSlide(bad, {})); }
  const audience = clone(doc); audience.publication.audience = 'public'; assert.throws(() => assertDraftDocument(audience));
  const bad = clone(doc); bad.course_version_id = '41495438-31bb-54ad-a8e3-02a17c5e0d39';
  assert.throws(() => assertDraftDocument(bad, { identity: doc }), { code: 'identity_changed' });
});

test('slide cap and tighter persisted UTF-8 size budget remain enforced', () => {
  const doc = initial();
  doc.slides = Array.from({ length: 120 }, (_, i) => ({ ...clone(doc.slides[0]), id: `s-${i}`, blocks: [{ ...clone(doc.slides[0].blocks[0]), id: `b-${i}` }] }));
  assertDraftDocument(doc); assert.throws(() => addSlide(doc, {}), { code: 'slide_limit' });
  assert.throws(() => duplicateSlide(doc, doc.slides[0].id), { code: 'slide_limit' });
  doc.slides.forEach((slide, i) => { slide.blocks = Array.from({ length: 3 }, (_, j) => ({ id: `b-${i}-${j}`, type: 'rich-text', version: 1, content: { paragraphs: [{ type: 'paragraph', children: [{ type: 'text', text: 'a'.repeat(4000) }] }] } })); });
  assert.throws(() => assertDraftDocument(doc), failure => failure.errors?.some(item => item.code === 'persisted-size-limit'));
});
