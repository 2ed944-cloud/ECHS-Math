import { assertLessonDocument, LessonDocumentError } from '../lesson-runtime/schema.mjs';

export const MAX_DRAFT_BYTES = 1024 * 1024;
const encoder = new TextEncoder();
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const IDENTITIES = ['lesson_id', 'course_version_id', 'unit_id', 'topic_id', 'slug'];

export class DraftModelError extends Error {
  constructor(code, message) { super(message); this.name = 'DraftModelError'; this.code = code; }
}
const fail = (code, message) => { throw new DraftModelError(code, message); };
const copy = value => JSON.parse(JSON.stringify(value));

/** Structural editing validation only. The server still validates math and authority. */
export function assertDraftDocument(document, { identity, mathEngine } = {}) {
  assertLessonDocument(document, mathEngine === undefined ? {} : { mathEngine });
  if (document.publication.status !== 'draft' || document.publication.audience !== 'institutional') {
    fail('draft_required', 'Only institutional draft content can be edited.');
  }
  if (document.document_version !== document.publication.revision) {
    fail('draft_revision', 'Draft document and publication revisions must match.');
  }
  if (encoder.encode(JSON.stringify(document)).byteLength > MAX_DRAFT_BYTES) {
    throw new LessonDocumentError([{ path: '', code: 'persisted-size-limit', message: 'A draft must not exceed 1 MiB of compact JSON UTF-8.' }]);
  }
  if (identity && IDENTITIES.some(key => document[key] !== identity[key])) {
    fail('identity_changed', 'A saved lesson keeps its original course, topic, route identity and slug.');
  }
  return document;
}

function documentCopy(document) { assertDraftDocument(document); return copy(document); }
function finish(document) { assertDraftDocument(document); return copy(document); }
function indexOf(document, id) {
  const index = document.slides.findIndex(slide => slide.id === id);
  if (index < 0) fail('slide_not_found', 'The selected slide no longer exists.');
  return index;
}
function nextId(prefix, used) {
  // Bounded search also handles imported identifiers with arbitrarily long suffixes.
  for (let number = 1; number <= used.size + 1; number++) {
    const id = `${prefix}-${number}`;
    if (!used.has(id)) { used.add(id); return id; }
  }
  fail('identifier_limit', 'A unique content identifier could not be allocated.');
}
function ids(document, blocks = false) {
  return new Set(blocks ? document.slides.flatMap(slide => slide.blocks.map(block => block.id)) : document.slides.map(slide => slide.id));
}
function textBlock(id, text) {
  return { id, type: 'rich-text', version: 1, content: { paragraphs: [{ type: 'paragraph', children: [{ type: 'text', text }] }] } };
}
function uuid(value) {
  if (typeof value !== 'string' || !UUID.test(value)) fail('invalid_identity', 'An explicit lesson and course version identity is required.');
  return value.toLowerCase();
}

/** All curriculum wording is entered by the teacher; catalog scope comes from the API. */
export function createLessonDraft({ lessonId, courseVersionId, catalog, title, objective, skill, summary, language = 'en' } = {}) {
  lessonId = uuid(lessonId); courseVersionId = uuid(courseVersionId);
  if (!catalog || typeof catalog.unit_id !== 'string' || typeof catalog.topic_id !== 'string') {
    fail('catalog_required', 'Select a lesson route from the authorized class catalog.');
  }
  if (typeof title !== 'string' || typeof objective !== 'string' || typeof skill !== 'string' || typeof summary !== 'string') {
    fail('metadata_required', 'Enter a title, objective, skill identifier and accessible summary.');
  }
  const slug = title.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 120).replace(/-$/, '') || `lesson-${lessonId}`;
  return finish({
    schema_version: 'echs.lesson.v1', document_version: 1, lesson_id: lessonId, course_version_id: courseVersionId,
    unit_id: catalog.unit_id, topic_id: catalog.topic_id, slug, title,
    objectives: [{ id: `teacher:${lessonId}:objective:1`, text: objective }], skills: [skill],
    slides: [{ id: 'slide-1', title, layout: 'single', blocks: [textBlock('block-1', objective)] }],
    publication: { status: 'draft', audience: 'institutional', revision: 1 },
    accessibility: { language, summary }, variants: { contexts: ['neutral'] }
  });
}

export function addSlide(document, { title = 'New slide', afterId } = {}) {
  const next = documentCopy(document);
  if (next.slides.length >= 120) fail('slide_limit', 'A lesson can contain at most 120 slides.');
  const index = afterId == null ? next.slides.length : indexOf(next, afterId) + 1;
  next.slides.splice(index, 0, { id: nextId('slide', ids(next)), title, layout: 'single', blocks: [textBlock(nextId('block', ids(next, true)), 'Add your explanation.')] });
  return finish(next);
}

export function duplicateSlide(document, id) {
  const next = documentCopy(document);
  if (next.slides.length >= 120) fail('slide_limit', 'A lesson can contain at most 120 slides.');
  const index = indexOf(next, id), slide = copy(next.slides[index]), blocks = ids(next, true);
  slide.id = nextId('slide', ids(next));
  slide.title = `${Array.from(slide.title).slice(0, 233).join('')} (copy)`;
  slide.blocks.forEach(block => { block.id = nextId('block', blocks); });
  next.slides.splice(index + 1, 0, slide);
  return finish(next);
}

export function renameSlide(document, id, title) { return updateSlide(document, id, { title }); }

/** index is the final zero-based position, between 0 and slides.length - 1. */
export function moveSlide(document, id, index) {
  const next = documentCopy(document), from = indexOf(next, id);
  if (!Number.isInteger(index) || index < 0 || index >= next.slides.length) fail('invalid_position', 'Choose a position within the lesson.');
  const [slide] = next.slides.splice(from, 1); next.slides.splice(index, 0, slide);
  return finish(next);
}

export function removeSlide(document, id) {
  const next = documentCopy(document), index = indexOf(next, id);
  if (next.slides.length === 1) fail('final_slide', 'Keep at least one slide in the lesson.');
  next.slides.splice(index, 1);
  return finish(next);
}

/** One-level delete recovery keeps current edits and server revisions intact. */
export function restoreRemovedSlide(document, { slide, index } = {}) {
  const next = documentCopy(document);
  if (next.slides.length >= 120) fail('slide_limit', 'A lesson can contain at most 120 slides.');
  if (!Number.isInteger(index) || index < 0 || index >= 120) fail('invalid_position', 'Choose the original position of the removed slide.');
  // Validate the closed slide structure before copying or reading its properties.
  // A standalone slide permits IDs reused since deletion; collisions are remapped below.
  assertDraftDocument({ ...next, slides: [slide] });
  const restored = copy(slide), slideIds = ids(next), blockIds = ids(next, true);
  if (slideIds.has(restored.id)) restored.id = nextId('slide', slideIds);
  restored.blocks.forEach(block => {
    if (blockIds.has(block.id)) block.id = nextId('block', blockIds);
    else blockIds.add(block.id);
  });
  next.slides.splice(Math.min(index, next.slides.length), 0, restored);
  return finish(next);
}

export function updateSlide(document, id, patch) {
  const next = documentCopy(document), index = indexOf(next, id);
  if (!patch || typeof patch !== 'object' || Array.isArray(patch) || ![Object.prototype, null].includes(Object.getPrototypeOf(patch))) {
    fail('invalid_patch', 'Slide changes must contain only title, layout or blocks.');
  }
  for (const key of Reflect.ownKeys(patch)) {
    const descriptor = Object.getOwnPropertyDescriptor(patch, key);
    if (!['title', 'layout', 'blocks'].includes(key) || !Object.hasOwn(descriptor, 'value') || !descriptor.enumerable) {
      fail('invalid_patch', 'Slide changes must contain only title, layout or blocks.');
    }
    next.slides[index][key] = descriptor.value;
  }
  return finish(next);
}
