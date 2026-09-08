import { assertLessonDocument, LessonDocumentError } from './generated/schema.mjs';

export const SERVER_KATEX_VERSION = '0.16.27';
// Persistence has a tighter delivery budget than the general 2 MiB schema.
// Measure compact JSON bytes, not UTF-16 character count or JSONB formatting.
export const MAX_PERSISTED_DOCUMENT_BYTES = 1024 * 1024;
const encoder = new TextEncoder();
const identityFields = ['lesson_id', 'course_version_id', 'unit_id', 'topic_id', 'document_version'];
const publishedBlockTypes = new Set(['rich-text', 'math', 'callout']);
const issue = (path, code, message) => ({ path, code, message });

/**
 * Payload checks only: callers must resolve organization, account, class,
 * curriculum pin, authorship/review permissions and release state server-side.
 * identity comes from the authorized database record, never request metadata.
 * mathEngine is the function's imported npm:katex@0.16.27, never request data.
 */
function assertContract(document, options, status, allowLegacy) {
  const { mathEngine, identity } = options || {};
  if (!mathEngine || mathEngine.version !== SERVER_KATEX_VERSION || typeof mathEngine.renderToString !== 'function') {
    throw new LessonDocumentError([issue('', 'trusted-math-engine-required', 'The pinned server math engine is required.')]);
  }
  assertLessonDocument(document, { mathEngine });
  if (encoder.encode(JSON.stringify(document)).byteLength > MAX_PERSISTED_DOCUMENT_BYTES) {
    throw new LessonDocumentError([issue('', 'persisted-size-limit', 'A persisted lesson document must not exceed 1 MiB of compact JSON UTF-8.')]);
  }
  const errors = [];
  if (!identity || typeof identity !== 'object' || Array.isArray(identity)) {
    errors.push(issue('', 'server-identity-required', 'An authorized server document identity is required.'));
  } else {
    for (const field of identityFields) {
      if (!Object.hasOwn(identity, field) || identity[field] !== document[field]) {
        errors.push(issue(`/${field}`, 'identity-mismatch', 'Document identity must match the authorized server record.'));
      }
    }
    if (!Object.hasOwn(identity, 'publication_revision') || identity.publication_revision !== document.publication.revision) {
      errors.push(issue('/publication/revision', 'identity-mismatch', 'Publication revision must match the authorized server record.'));
    }
  }
  if (document.publication.status !== status) {
    errors.push(issue('/publication/status', 'invalid-publication-state', `This operation requires ${status} document status.`));
  }
  if (document.publication.audience !== 'institutional') {
    errors.push(issue('/publication/audience', 'institutional-audience-required', 'This API supports institutional lesson documents only.'));
  }
  if (!allowLegacy) {
    document.slides.forEach((slide, slideIndex) => slide.blocks.forEach((block, blockIndex) => {
      if (!publishedBlockTypes.has(block.type)) {
        errors.push(issue(`/slides/${slideIndex}/blocks/${blockIndex}/type`, 'unverified-publication-block', 'Publication requires a supported content block with no unverified legacy reference.'));
      }
    }));
  }
  if (errors.length) throw new LessonDocumentError(errors);
  return document;
}

/** Draft saves retain bounded legacy references, without publishing or executing them. */
export function assertPersistableDocument(document, options) {
  return assertContract(document, options, 'draft', true);
}

/**
 * Validate the stored draft immediately before the publication transaction.
 * The transaction must CAS the validated revision/hash and recheck authority.
 * Review status lives on the server record; canonical draft content stays draft.
 */
export function assertPublishableDocument(document, options) {
  return assertContract(document, options, 'draft', false);
}

/** Validate the server's immutable published snapshot after release authorization. */
export function assertStudentDocument(document, options) {
  return assertContract(document, options, 'published', false);
}
