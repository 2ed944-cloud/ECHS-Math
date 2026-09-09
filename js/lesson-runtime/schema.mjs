import validateCanonicalSchema, { validateBlock as validateCanonicalBlock } from './generated/validate-lesson-document.mjs';
import { compileMathSource, validateMathSource } from './math-expression.mjs';

export { LESSON_SCHEMA_VERSION } from './block-registry.mjs';
export const LESSON_DOCUMENT_LIMITS = Object.freeze({ maxBytes: 2 * 1024 * 1024, maxDepth: 24, maxNodes: 30000 });

const forbiddenKeys = new Set(['__proto__', 'prototype', 'constructor', 'toJSON']);
const forbiddenTexCommands = /\\(?:href|url|html[A-Za-z]*|includegraphics|def|gdef|edef|xdef|newcommand|renewcommand|providecommand|let|futurelet|global|catcode|csname|require)\b/i;
const htmlInTex = /<\s*(?:\/?[A-Za-z][^>]*|![^>]*)>/;
const encoder = new TextEncoder();
const error = (path, code, message) => ({ path, code, message });
const result = errors => ({ valid: errors.length === 0, errors });
const pointer = key => String(key).replace(/~/g, '~0').replace(/\//g, '~1');

// Deliberately shared with the SQL v2 validator. This is an absolute HTTPS
// navigation subset, never a permission to fetch, embed or execute resources.
const httpsHref = /^https:\/\/(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}(?:\/[A-Za-z0-9._~!$&'()*+,;=:@%/-]*)?(?:\?[A-Za-z0-9._~!$&'()*+,;=:@%/?-]*)?(?:#[A-Za-z0-9._~!$&'()*+,;=:@%/?-]*)?$/;
export function isSafeLessonHref(value) {
  return typeof value === 'string' && value.length <= 2048 && httpsHref.test(value) &&
    value.slice(8).split(/[/?#]/, 1)[0].length <= 253 &&
    !value.replace(/%[0-9a-f]{2}/gi, '').includes('%') && !/%(?:0[0-9a-f]|1[0-9a-f]|7f|5c)/i.test(value);
}
const meaningful = text => /[^\u0009-\u000d\u0020\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]/u.test(text);

export class LessonDocumentError extends Error {
  constructor(errors) {
    super('Invalid ECHS lesson document.');
    this.name = 'LessonDocumentError';
    this.errors = errors;
  }
}

/** Bound and inspect plain JSON data before either Ajv or JSON.stringify can touch it. */
function inspectData(document) {
  let nodes = 0;
  let bytes = 0;
  const ancestors = new WeakSet();
  function walk(value, path, depth) {
    if (++nodes > LESSON_DOCUMENT_LIMITS.maxNodes) return error(path, 'node-limit', 'Document contains too many values.');
    if (depth > LESSON_DOCUMENT_LIMITS.maxDepth) return error(path, 'depth-limit', 'Document is nested too deeply.');
    if (typeof value === 'string') {
      if (value.length > LESSON_DOCUMENT_LIMITS.maxBytes) return error(path, 'size-limit', 'Document exceeds the size limit.');
      bytes += encoder.encode(value).length;
    } else if (typeof value === 'number') {
      if (!Number.isFinite(value)) return error(path, 'non-finite-number', 'Numbers must be finite JSON values.');
    } else if (value !== null && typeof value !== 'boolean' && typeof value !== 'object') {
      return error(path, 'non-json-value', 'Only plain JSON values are supported.');
    }
    if (bytes > LESSON_DOCUMENT_LIMITS.maxBytes) return error(path, 'size-limit', 'Document exceeds the size limit.');
    if (value === null || typeof value !== 'object') return null;
    if (ancestors.has(value)) return error(path, 'cycle', 'Cyclic objects are not JSON documents.');
    const array = Array.isArray(value);
    const prototype = Object.getPrototypeOf(value);
    if (array ? prototype !== Array.prototype : prototype !== Object.prototype && prototype !== null) {
      return error(path, 'non-plain-object', 'Only plain objects and arrays are supported.');
    }
    if (array && Object.getOwnPropertyDescriptor(value, 'length').value > 1000) {
      return error(path, 'invalid-array', 'Arrays must be dense, bounded JSON arrays.');
    }
    const descriptors = Object.getOwnPropertyDescriptors(value);
    const keys = Reflect.ownKeys(descriptors);
    if (keys.length > 2000) return error(path, 'container-limit', 'A single container contains too many values.');
    if (array && (!descriptors.length || descriptors.length.value > 1000 || descriptors.length.value !== keys.length - 1)) {
      return error(path, 'invalid-array', 'Arrays must be dense, bounded JSON arrays.');
    }
    ancestors.add(value);
    for (const key of keys) {
      if (typeof key !== 'string') return error(path, 'symbol-property', 'JSON documents cannot contain symbol properties.');
      if (array && key === 'length') continue;
      const childPath = `${path}/${pointer(key)}`;
      if (forbiddenKeys.has(key)) return error(childPath, 'forbidden-property', 'This property is not permitted in lesson data.');
      if (array && !/^(?:0|[1-9][0-9]*)$/.test(key)) return error(childPath, 'invalid-array', 'Array properties must be numeric indexes.');
      const descriptor = descriptors[key];
      if (!Object.hasOwn(descriptor, 'value') || !descriptor.enumerable) {
        return error(childPath, 'property-descriptor', 'Accessors and hidden properties are not permitted.');
      }
      bytes += encoder.encode(key).length;
      const issue = walk(descriptor.value, childPath, depth + 1);
      if (issue) return issue;
    }
    ancestors.delete(value);
    return null;
  }
  try {
    const issue = walk(document, '', 0);
    if (issue) return [issue];
    if (encoder.encode(JSON.stringify(document)).length > LESSON_DOCUMENT_LIMITS.maxBytes) {
      return [error('', 'size-limit', 'Document exceeds the serialized size limit.')];
    }
    return [];
  } catch {
    return [error('', 'unreadable-data', 'Document must be readable plain JSON data.')];
  }
}

function analyzeBlock(block, base = '') {
  const entries = [], errors = [];
  const contentPath = `${base}/content`;
  function addMath(content, path, display, version) {
    if (version === 1) entries.push({ tex: content.tex, display, path: `${path}/tex` });
    else {
      const checked = validateMathSource(content.source);
      if (!checked.valid) errors.push(...checked.errors.map(issue => ({ ...issue, path: `${path}/source${issue.path}` })));
      else entries.push({ tex: compileMathSource(content.source), display, path: `${path}/source` });
    }
  }
  function inline(children, path) {
    let visible = false;
    children.forEach((node, index) => {
      const here = `${path}/${index}`;
      if (node.type === 'math') { visible = true; addMath(node, here, false, 2); }
      else if (node.type === 'text') visible ||= meaningful(node.text);
      else if (node.type === 'link') {
        if (!isSafeLessonHref(node.href)) errors.push(error(`${here}/href`, 'unsafe-link', 'Links require a bounded absolute HTTPS address.'));
        const label = node.children.some(child => meaningful(child.text));
        if (!label) errors.push(error(`${here}/children`, 'empty-link-label', 'Links need a meaningful text label.'));
        visible ||= label;
      }
    });
    if (!visible) errors.push(error(path, 'empty-rich-text', 'A paragraph or list item must contain meaningful text or mathematics.'));
  }
  function rich(content, path, version) {
    if (version === 1) content.paragraphs.forEach((paragraph, index) => {
      paragraph.children.forEach((node, childIndex) => {
        if (node.type === 'math') addMath(node, `${path}/paragraphs/${index}/children/${childIndex}`, false, 1);
      });
    });
    else content.nodes.forEach((node, index) => {
      const here = `${path}/nodes/${index}`;
      if (node.type === 'paragraph') inline(node.children, `${here}/children`);
      else node.items.forEach((item, itemIndex) => inline(item.children, `${here}/items/${itemIndex}/children`));
    });
  }
  if (block.type === 'math') addMath(block.content, contentPath, block.content.display, block.version);
  else if (block.type === 'rich-text') rich(block.content, contentPath, block.version);
  else if (block.type === 'callout') rich(block.content.body, `${contentPath}/body`, block.version);
  else if (block.type === 'image') {
    for (const field of ['alt', 'caption', 'description']) {
      if (block.content[field] !== '' && !meaningful(block.content[field])) errors.push(error(`${contentPath}/${field}`, 'empty-media-text', 'Media text must be empty or meaningful.'));
    }
  } else if (block.type === 'table') {
    const columns = new Set(), rows = new Set();
    block.content.columns.forEach((column, index) => {
      if (columns.has(column.id)) errors.push(error(`${contentPath}/columns/${index}/id`, 'duplicate-column-id', 'Column IDs must be unique within the table.'));
      columns.add(column.id);
    });
    block.content.rows.forEach((row, index) => {
      if (rows.has(row.id)) errors.push(error(`${contentPath}/rows/${index}/id`, 'duplicate-row-id', 'Row IDs must be unique within the table.'));
      rows.add(row.id);
      if (row.cells.length !== block.content.columns.length) errors.push(error(`${contentPath}/rows/${index}/cells`, 'table-shape', 'Every row needs exactly one cell per column.'));
      row.cells.forEach((cell, cellIndex) => inline(cell, `${contentPath}/rows/${index}/cells/${cellIndex}`));
    });
  }
  for (const entry of entries) {
    if (forbiddenTexCommands.test(entry.tex) || htmlInTex.test(entry.tex)) {
      errors.push(error(entry.path, 'unsafe-math', 'Math cannot contain HTML, links, external resources, or macro definitions.'));
    }
  }
  return { entries, errors };
}
function mathEntries(document) {
  return document.slides.flatMap((slide, slideIndex) => slide.blocks.flatMap((block, blockIndex) =>
    analyzeBlock(block, `/slides/${slideIndex}/blocks/${blockIndex}`).entries));
}

function semanticErrors(document) {
  const errors = [];
  const slides = new Set();
  const blocks = new Set();
  const objectives = new Set();
  document.objectives.forEach((objective, index) => {
    if (objectives.has(objective.id)) errors.push(error(`/objectives/${index}/id`, 'duplicate-objective-id', 'Objective IDs must be unique.'));
    objectives.add(objective.id);
  });
  document.slides.forEach((slide, slideIndex) => {
    if (slides.has(slide.id)) errors.push(error(`/slides/${slideIndex}/id`, 'duplicate-slide-id', 'Slide IDs must be unique.'));
    slides.add(slide.id);
    slide.blocks.forEach((block, blockIndex) => {
      if (blocks.has(block.id)) errors.push(error(`/slides/${slideIndex}/blocks/${blockIndex}/id`, 'duplicate-block-id', 'Block IDs must be unique across the document.'));
      blocks.add(block.id);
      errors.push(...analyzeBlock(block, `/slides/${slideIndex}/blocks/${blockIndex}`).errors);
    });
  });
  return errors;
}

function structuralErrors(document) {
  const inspected = inspectData(document);
  if (inspected.length) return inspected;
  if (!validateCanonicalSchema(document)) {
    return validateCanonicalSchema.errors.slice(0, 100).map(issue => error(issue.instancePath, `schema:${issue.keyword}`, issue.message));
  }
  return semanticErrors(document);
}

function checkMathEntries(entries, engine) {
  if (!entries.length) return [];
  if (!engine || typeof engine.renderToString !== 'function') {
    return [error('', 'math-engine-required', 'A local KaTeX engine is required to validate lesson mathematics.')];
  }
  const errors = [];
  for (const entry of entries) {
    try {
      engine.renderToString(entry.tex, {
        displayMode: entry.display,
        throwOnError: true,
        strict: 'error',
        trust: false,
        maxExpand: 100,
        maxSize: 10,
        output: 'htmlAndMathml'
      });
    } catch {
      errors.push(error(entry.path, 'invalid-math', 'Math must parse successfully using the supported local KaTeX engine.'));
    }
  }
  return errors;
}
function mathErrors(document, engine) { return checkMathEntries(mathEntries(document), engine); }

/** Validate a real canonical block without inventing a lesson identity. */
export function assertLessonBlock(block, options = {}) {
  let errors = inspectData(block);
  if (!errors.length && !validateCanonicalBlock(block)) {
    errors = validateCanonicalBlock.errors.slice(0, 100).map(issue => error(issue.instancePath, `schema:${issue.keyword}`, issue.message));
  }
  if (!errors.length) {
    const analyzed = analyzeBlock(block); errors.push(...analyzed.errors);
    if (!errors.length && options.mathEngine !== undefined) errors.push(...checkMathEntries(analyzed.entries, options.mathEngine));
  }
  if (errors.length) throw new LessonDocumentError(errors);
  return block;
}
export function assertBlockContent(type, version, content, options = {}) {
  assertLessonBlock({ id: 'content', type, version, content }, options);
  return content;
}

/** Validate controlled content. No cloning, mutation, state writes, or implicit version migration. */
export function validateLessonDocument(document, options = {}) {
  const errors = structuralErrors(document);
  if (!errors.length && options.mathEngine !== undefined) errors.push(...mathErrors(document, options.mathEngine));
  return result(errors);
}

export function assertLessonDocument(document, options = {}) {
  const validated = validateLessonDocument(document, options);
  if (!validated.valid) throw new LessonDocumentError(validated.errors);
  return document;
}

/** Mathematical syntax is explicit so structural users need not eagerly load KaTeX. */
export function validateLessonMath(document, mathEngine) {
  const errors = structuralErrors(document);
  if (!errors.length) errors.push(...mathErrors(document, mathEngine));
  return result(errors);
}

/** A payload gate, not an authorization boundary or proof of publication rights. */
export function validatePublicLessonDocument(document, options = {}) {
  const errors = structuralErrors(document);
  if (errors.length) return result(errors);
  if (document.publication.status !== 'published') errors.push(error('/publication/status', 'not-published', 'Public delivery requires published status.'));
  if (document.publication.audience !== 'public') errors.push(error('/publication/audience', 'not-public', 'Public delivery requires public audience.'));
  if (!errors.length) errors.push(...mathErrors(document, options.mathEngine));
  return result(errors);
}

export function assertPublicLessonDocument(document, options = {}) {
  const validated = validatePublicLessonDocument(document, options);
  if (!validated.valid) throw new LessonDocumentError(validated.errors);
  return document;
}

export function parseLessonDocument(json, options = {}) {
  if (typeof json !== 'string') throw new LessonDocumentError([error('', 'json-string-required', 'Expected a JSON string.')]);
  if (json.length > LESSON_DOCUMENT_LIMITS.maxBytes || encoder.encode(json).length > LESSON_DOCUMENT_LIMITS.maxBytes) {
    throw new LessonDocumentError([error('', 'size-limit', 'JSON exceeds the size limit.')]);
  }
  let document;
  try {
    document = JSON.parse(json);
  } catch {
    throw new LessonDocumentError([error('', 'invalid-json', 'Expected valid JSON syntax.')]);
  }
  return assertLessonDocument(document, options);
}

export function serializeLessonDocument(document, options = {}) {
  assertLessonDocument(document, options);
  return JSON.stringify(document);
}
