# ECHS004 — lesson schema foundation

The first canonical lesson document is `schemas/echs.lesson.v1.schema.json`. It provides a framework-neutral controlled-content contract while preserving existing static lessons, their engines and URLs. The `js/lesson-runtime/` modules do not perform authoring, persistence, publication, routing, assessment or mastery operations.

## Contract

The document requires exact schema version `echs.lesson.v1`, a positive `document_version`, UUID `lesson_id` and `course_version_id`, scoped unit/topic identifiers, slug/title, typed objectives, skills, slides, publication metadata, accessibility metadata and neutral/Qatar context availability. Curriculum record validity still requires the authoritative curriculum registry; syntactic UUID/identifier validation does not invent or approve objectives.

Stable slide IDs remain unique across the document. Block IDs are unique across all slides in their own namespace, and objective IDs are unique. Layouts are `single`, `two-column` and `three-panel`. All object fields are closed; unknown fields, versions and block types fail validation. There is no automatic version migration.

Every block has `{id, type, version: 1, content}`. The initial registry supports controlled rich text, mathematics, callouts and `legacy-embedded` references. Rich text contains paragraph/inline text or math nodes, with optional strong/emphasis marks. Math includes TeX and spoken text. A legacy reference contains only its canonical relative `lessons/...html` source, anchor, SHA-256 and summary; it is not executable HTML or an iframe. There are no arbitrary links, question payloads, answer keys or teacher-note fields in this version.

## Validation and delivery

`schema.mjs` exposes `validateLessonDocument`, `assertLessonDocument`, `parseLessonDocument`, `serializeLessonDocument`, `validateLessonMath`, `validatePublicLessonDocument` and `assertPublicLessonDocument`. Validation returns `{valid, errors}`, with each error represented by `{path, code, message}`. Assertions throw `LessonDocumentError` and return the same document on success. Serialization and parsing round trip without mutating or migrating the input.

The canonical JSON schema is compiled with pinned Ajv and bundled into a static ESM browser validator. The browser does not load Ajv or dynamically evaluate a schema. Hand-written supplemental checks enforce plain bounded JSON, prohibited prototype/accessor forms, finite values, cross-document ID uniqueness and unsafe TeX rejection. Limits are 2 MiB serialized input, 24 levels and 30,000 values, with tighter per-field and collection bounds in the schema.

Mathematical syntax validation uses a separately injected local KaTeX engine. Structural validation alone does not claim syntax correctness; pass `{mathEngine: katex}` or call `validateLessonMath`. Public delivery validation requires `published`/`public` metadata and a local math engine whenever a formula exists. KaTeX is invoked with trust disabled, throwing errors, strict syntax, maximum 100 expansions and maximum size 10. A renderer must use the same safety limits and never create an engine from lesson-provided code.

Publication metadata is a content-delivery filter, not server authorization, licensing evidence or proof of approval. Institutional/private content still requires authenticated server enforcement. The existing question-bank public/restricted gates are unchanged. Tests use original non-assessment fixture content and explicit synthetic `fixture:` curriculum identities; test metadata does not constitute a production publication decision.

## Reproducibility and acceptance

Build/test dependencies are pinned in `tools/lesson-runtime/package.json` and its lockfile. `tools/` remains excluded from Pages. Use the documented commands in `tools/lesson-runtime/README.md`. The generator checks registry/schema agreement and produces a deterministic static module; `--check` compares every output byte and fails for stale generation. The schema digest is independent of Windows/Linux line endings.

The dedicated `lesson-schema.yml` workflow installs pinned pnpm/tool dependencies, checks generated output and runs the schema fixtures. Its path triggers include schema, renderer and future compatibility adapter files. Renderer browser tests and compatibility fixture tests belong to their respective subsequent slices.

Local acceptance: 18 schema suites passed, covering all basic layouts/types, valid/invalid documents, versions, round trips, unique IDs, extra/private fields, HTML/links, malformed/unsafe math, publication states, nonpublic audiences, size/nesting bounds, cycles, nonfinite values, symbols, hidden properties and accessors without invoking getters. The static validator build check passed. CI execution remains required on the integrated branch.

## Migration and rollback

This slice adds a schema and reusable helpers, not a live lesson cutover. Existing handcrafted AP and composed IB content stays intact. Future adapters must preserve canonical paths, queries, fragments and finish delegation and must never import views, reveals or self-scores into mastery. To roll back this slice, stop importing the new modules; no database, publication or progress state has been migrated.
