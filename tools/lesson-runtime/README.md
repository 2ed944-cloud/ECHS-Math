# ECHS lesson schema v1

This is the ECHS004 schema slice. It has no authoring interface, persistence, question repository, event emitter, navigation or mastery behavior. It does not alter existing lesson files or URLs.

## Authority and reproducible build

`schemas/echs.lesson.v1.schema.json` is the sole structural schema. The browser uses the committed static Ajv validator generated from that file, without Ajv at runtime, dynamic compilation, `eval`, or `Function`. The hand-written wrapper adds only JSON input bounds, safe-object checks, cross-document ID uniqueness, TeX safety and optional TeX syntax validation. These checks supplement constraints that JSON Schema alone cannot express.

Dependencies are pinned in this isolated tools package and its lockfile. They are not global student-page dependencies. Preserve the existing Pages exclusion of `tools/`. From the repository root:

```sh
pnpm --dir tools/lesson-runtime install --frozen-lockfile --ignore-scripts
node tools/lesson-runtime/build-validator.mjs
node tools/lesson-runtime/build-validator.mjs --check
node tools/lesson-runtime/test-schema.mjs
```

The check compiles in memory and compares every byte with the committed generated module. It fails if the output is missing or stale. Its embedded digest hashes the parsed schema serialization, avoiding line-ending differences between Windows and Linux. Tool versions are included in the generated banner. Registry type/version/schema references must agree with every canonical block definition before generation succeeds.

Runtime modules are `.mjs` for ordinary browser and Node imports; no repository-wide package type change is necessary. The generated validator is approximately 76 KB before HTTP compression. KaTeX is a separate injected dependency and must be loaded only where needed. Build/test dependencies and fixtures belong in `tools/lesson-runtime/`, which must remain excluded from Pages artifacts.

## API contract

Import helpers from `js/lesson-runtime/schema.mjs`:

| API | Behavior |
| --- | --- |
| `validateLessonDocument(document, {mathEngine} = {})` | Returns `{valid, errors}` for structure and safety. If supplied, the math engine also validates all math. |
| `assertLessonDocument(document, options)` | Returns the same object on success; otherwise throws `LessonDocumentError` with `.errors`. |
| `parseLessonDocument(json, options)` | Parses a bounded JSON string and asserts validity; no automatic migration. |
| `serializeLessonDocument(document, options)` | Asserts validity and returns compact JSON, without mutating the input. |
| `validateLessonMath(document, mathEngine)` | Validates the structure and every inline/display formula with injected local KaTeX. |
| `validatePublicLessonDocument(document, {mathEngine} = {})` | Requires structurally valid content, published status and public audience. Requires math syntax validation whenever math is present. |
| `assertPublicLessonDocument(document, options)` | Asserts the public delivery contract and returns the same object. |

All validation errors have exactly `{path, code, message}`. Paths are JSON pointers. They omit input values and math-parser exception details. `LESSON_DOCUMENT_LIMITS` declares 2 MiB serialized JSON, 24 levels and 30,000 values; the schema adds tighter per-field/collection limits. Data must be plain, dense JSON without cycles, hidden fields, getters, symbols, nonfinite numbers or prototype-pollution keys. Assertions do not normalize, mutate, publish or silently migrate data.

Structural validation alone deliberately does not claim math syntax correctness. Public preview/delivery should call `assertPublicLessonDocument(document, {mathEngine: katex})` after loading the approved local engine. `validateLessonMath` invokes `renderToString` with `throwOnError: true`, `strict: 'error'`, `trust: false`, `maxExpand: 100`, and `maxSize: 10`. Links, HTML/resource commands and macro definitions are forbidden in lesson TeX independently of the engine. A caller-provided engine must be a trusted local KaTeX implementation, not code obtained from lesson content.

Publication metadata is a payload filter, not proof of access rights, institutional authorization or approval. An authenticated server must enforce private delivery and publication decisions. Passing this schema must never change an existing public/restricted question publication gate. This v1 intentionally has no question, answer-key, teacher-note, arbitrary link or arbitrary HTML fields. Public fixtures contain original non-assessment text/math only and synthetic `fixture:` curriculum IDs; they are test examples, not approved curriculum records or a production publication decision.

## Blocks and extension rules

Every block is `{id, type, version: 1, content}` with unknown fields rejected. Slide IDs are unique within the document. Block IDs are unique across all its slides; they form a separate namespace from slide IDs. Objective IDs are also unique. Renderers should prefix internal block element IDs to avoid DOM collisions with slide fragments. IDs are stable strings that survive reordering, not generated array positions.

* `rich-text`: `content.paragraphs` contains `{type: 'paragraph', children}`. A child is `{type: 'text', text, marks?}` with optional `strong`/`em` marks or `{type: 'math', tex, spoken}`.
* `math`: `{tex, spoken, display}`.
* `callout`: `{kind, title, body}`, with kind `note`, `definition`, `warning` or `example`; body uses the same paragraph structure.
* `legacy-embedded`: `{source, anchor, sha256, summary}`. Source is a repository-relative `lessons/...html` reference; anchor excludes the leading `#`; SHA-256 is lowercase hex. Empty anchor means the original page. This is reference metadata only: no automatic iframe, fetching, HTML import, script execution or answer extraction. An adapter must independently verify canonical path existence, content hash and valid anchors.

`block-registry.mjs` exports `getBlockDefinition(type, version = 1)`, `listBlockDefinitions()` and `isSupportedBlock(type, version = 1)`. The registry and capabilities are immutable, explicit descriptors. Extend support by reviewing the canonical schema, registry, renderer and tests together, then regenerating the validator. Unknown block or document versions fail closed; migration is a separate future versioned process, never a best-effort fallback in validation.

## Acceptance and rollback

The fixture suite covers all layouts and basic block types, round trips, immutability, metadata, duplicate IDs, unknown versions/fields, markup/link rejection, bounded input, unsafe object forms, missing math engines, malformed math, and all publication/audience rejections. Legacy reference tests carry metadata only. Existing production routes and engines remain intact. Rollback for this schema-only slice is to stop importing the new modules; no data or progress migration is performed.
