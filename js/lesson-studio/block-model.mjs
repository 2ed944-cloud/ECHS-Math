import { assertLessonBlock } from '../lesson-runtime/schema.mjs';
import { assertDraftDocument, DraftModelError } from './draft-model.mjs';

const BASIC_BLOCK_TYPES = Object.freeze(['rich-text', 'math', 'callout']);
export const EDITABLE_BLOCK_TYPES = Object.freeze([...BASIC_BLOCK_TYPES, 'image', 'video', 'table', 'resource']);
const clone = value => JSON.parse(JSON.stringify(value));
const fail = (code, message) => { throw new DraftModelError(code, message); };
const rich = text => ({ nodes: [{ type: 'paragraph', children: [{ type: 'text', text }] }] });

function copyDocument(document, options) { assertDraftDocument(document, options); return clone(document); }
function finish(document, options) { assertDraftDocument(document, options); return clone(document); }
function slideFor(document, id) {
  const slide = document.slides.find(item => item.id === id);
  if (!slide) fail('slide_not_found', 'The selected slide no longer exists.');
  return slide;
}
function indexFor(slide, id) {
  const index = slide.blocks.findIndex(block => block.id === id);
  if (index < 0) fail('block_not_found', 'The selected block no longer exists.');
  return index;
}
function availableId(document) {
  const used = new Set(document.slides.flatMap(slide => slide.blocks.map(block => block.id)));
  for (let number = 1; number <= used.size + 1; number++) if (!used.has(`block-${number}`)) return `block-${number}`;
  fail('identifier_limit', 'A unique block identifier could not be allocated.');
}
function editable(block) {
  if (!EDITABLE_BLOCK_TYPES.includes(block.type)) fail('unsupported_edit', 'This reference is preserved by the legacy lesson adapter.');
}

/** New content is an original teacher-editable placeholder, never a curriculum claim. */
export function addBlock(document, slideId, { type = 'rich-text', afterId } = {}) {
  if (!BASIC_BLOCK_TYPES.includes(type)) fail('unsupported_block', 'Choose text, mathematics or a callout. Media requires validated content.');
  const next = copyDocument(document), slide = slideFor(next, slideId);
  if (slide.blocks.length >= 40) fail('block_limit', 'A slide can contain at most 40 blocks.');
  const index = afterId == null ? slide.blocks.length : indexFor(slide, afterId) + 1;
  const content = type === 'rich-text' ? rich('Add your explanation.') : type === 'math'
    ? { source: { mode: 'visual', expression: { kind: 'symbol', name: 'x' } }, spoken: 'x', display: true }
    : { kind: 'note', title: 'Teaching note', body: rich('Add your teaching point.') };
  slide.blocks.splice(index, 0, { id: availableId(next), type, version: 2, content });
  return finish(next);
}

/** Insert complete canonical content; asset IDs must come from the upload service. */
export function insertBlock(document, slideId, input, options = {}) {
  const next = copyDocument(document, options), slide = slideFor(next, slideId);
  if (!input || typeof input !== 'object' || Array.isArray(input) || ![Object.prototype, null].includes(Object.getPrototypeOf(input))) {
    fail('invalid_patch', 'Supply a block type, version and content.');
  }
  const fields = Object.getOwnPropertyDescriptors(input);
  if (!['type', 'version', 'content'].every(key => Object.hasOwn(fields, key))) fail('invalid_patch', 'A block type, version and content are required.');
  for (const key of Reflect.ownKeys(fields)) {
    if (!['type', 'version', 'content', 'afterId'].includes(key) || !Object.hasOwn(fields[key], 'value') || !fields[key].enumerable) fail('invalid_patch', 'Block insertion accepts plain canonical fields only.');
  }
  const block = { id: availableId(next), type: fields.type.value, version: fields.version.value, content: fields.content.value };
  assertLessonBlock(block, options); editable(block);
  if (slide.blocks.length >= 40) fail('block_limit', 'A slide can contain at most 40 blocks.');
  const afterId = fields.afterId?.value;
  if (afterId != null && typeof afterId !== 'string') fail('invalid_patch', 'The insertion position must be a block identifier.');
  const index = afterId == null ? slide.blocks.length : indexFor(slide, afterId) + 1;
  slide.blocks.splice(index, 0, clone(block)); return finish(next, options);
}

export function removeBlock(document, slideId, blockId) {
  const next = copyDocument(document), slide = slideFor(next, slideId), index = indexFor(slide, blockId);
  editable(slide.blocks[index]);
  if (slide.blocks.length === 1) fail('final_block', 'Keep at least one block on the slide.');
  slide.blocks.splice(index, 1); return finish(next);
}

/** index is the final zero-based position in this slide. */
export function moveBlock(document, slideId, blockId, index) {
  const next = copyDocument(document), slide = slideFor(next, slideId), from = indexFor(slide, blockId);
  editable(slide.blocks[from]);
  if (!Number.isInteger(index) || index < 0 || index >= slide.blocks.length) fail('invalid_position', 'Choose a position within this slide.');
  const [block] = slide.blocks.splice(from, 1); slide.blocks.splice(index, 0, block); return finish(next);
}

/** Closed patches cannot change block IDs/type, lesson identity or publication state. */
export function updateBlock(document, slideId, blockId, patch, options = {}) {
  const next = copyDocument(document, options), slide = slideFor(next, slideId), index = indexFor(slide, blockId);
  editable(slide.blocks[index]);
  if (!patch || typeof patch !== 'object' || Array.isArray(patch) || ![Object.prototype, null].includes(Object.getPrototypeOf(patch))) {
    fail('invalid_patch', 'Block changes must contain only content and an optional explicit version.');
  }
  const descriptors = Object.getOwnPropertyDescriptors(patch);
  if (!Object.hasOwn(descriptors, 'content')) fail('invalid_patch', 'Block content is required.');
  for (const key of Reflect.ownKeys(descriptors)) {
    if (!['content', 'version'].includes(key) || !Object.hasOwn(descriptors[key], 'value') || !descriptors[key].enumerable) {
      fail('invalid_patch', 'Block changes must contain only content and an optional explicit version.');
    }
  }
  if (Object.hasOwn(descriptors, 'version')) {
    const version = descriptors.version.value;
    if (typeof version !== 'number' || !Number.isInteger(version)) fail('invalid_patch', 'A block version must be an integer.');
    if (version < slide.blocks[index].version) fail('unsupported_downgrade', 'Block versions cannot be silently downgraded.');
  }
  const candidate = { ...slide.blocks[index], ...Object.fromEntries(Object.entries(descriptors).map(([key, value]) => [key, value.value])) };
  assertLessonBlock(candidate, options); slide.blocks[index] = clone(candidate); return finish(next, options);
}

/** Restore one removed block while retaining later edits and remapping a reused ID. */
export function restoreRemovedBlock(document, slideId, { block, index } = {}) {
  const next = copyDocument(document), slide = slideFor(next, slideId);
  assertLessonBlock(block); editable(block);
  if (slide.blocks.length >= 40) fail('block_limit', 'A slide can contain at most 40 blocks.');
  if (!Number.isInteger(index) || index < 0 || index >= 40) fail('invalid_position', 'Choose the original position of this block.');
  const restored = clone(block);
  if (next.slides.some(item => item.blocks.some(existing => existing.id === restored.id))) restored.id = availableId(next);
  slide.blocks.splice(Math.min(index, slide.blocks.length), 0, restored); return finish(next);
}

/** Explicit conversion of a working copy; the original block and its version stay intact. */
export function convertBlockToV2(block, options = {}) {
  assertLessonBlock(block, options); editable(block);
  if (!BASIC_BLOCK_TYPES.includes(block.type)) fail('unsupported_conversion', 'Media blocks keep their own content version.');
  if (block.version === 2) return clone(block);
  if (block.version !== 1) fail('unsupported_version', 'This block version cannot be converted.');
  const convertRich = content => ({ nodes: content.paragraphs.map(paragraph => ({ type: 'paragraph', children: paragraph.children.map(node => node.type === 'math'
    ? { type: 'math', source: { mode: 'tex', tex: node.tex }, spoken: node.spoken } : clone(node)) })) });
  const content = block.type === 'rich-text' ? convertRich(block.content) : block.type === 'callout'
    ? { ...clone(block.content), body: convertRich(block.content.body) }
    : { source: { mode: 'tex', tex: block.content.tex }, spoken: block.content.spoken, display: block.content.display };
  const converted = { ...clone(block), version: 2, content };
  assertLessonBlock(converted, options); return converted;
}
