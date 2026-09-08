# ECHS006 read-only legacy compatibility

This bounded adapter supports the exact reviewed AP Calculus 1.1 handcrafted deck and final composed IB AI SL 1.3 metadata. It changes no production routes, lesson engines, progress, question banks or publication gates. The default feature flag is disabled. There is no authoring, persistence, event emitter, QuestionRepository, assessment conversion or mass import.

## Entry points

Import `js/lesson-runtime/legacy-compatibility.mjs` after ECHS004 schema modules are present:

* `readLegacySnapshot(metadataJson, kind)` accepts a bounded JSON string for `ap11` or `ib13`, not executable scripts or a complete question-bearing LESSON_DATA object. Every field must match the exact pinned reviewed metadata. Property order is immaterial; ordered slide/layer arrays are significant.
* `preserveLegacyRoute({originalUrl, repositoryBase, kind, enabled = false})` identifies a canonical lesson or reviewed alias. It always retains the exact input URL as `originalUrl` and `rollbackUrl`, including raw encoding, unknown/repeated queries and fragment. It never changes location or history or constructs a new production destination. Only boolean `true` opts into an adapter preview decision. Unsupported/out-of-range fragments stay opaque and use legacy mode.
* `describeAP11(metadataJson, identity, routeOptions)` returns `{document, route, compatibility}` for all 33 stable AP slide IDs, layouts and source anchors.
* `adaptIB13Snapshot(metadataJson, identity, routeOptions)` returns the same shape for the final 73-slide composition with source indexes, ordered layer hashes, pacing metadata and count summaries. Generated initial IDs include the immutable reviewed source version and source index. These assigned IDs must be retained if a later document is edited/reordered; do not rerun position assignment on an edited document.
* `convertSupportedText(html, {id, reference, identity, parseFragment, mathEngine})` uses an injected trusted inert parse5-compatible parser and local KaTeX engine. It returns either `{status: 'supported', blocks}` or `{status: 'legacy-reference', reason, blocks}`. It never uses a browser DOM parser or inserts HTML into a page.

`identity` supplies `document_version`, UUID `lesson_id`, UUID `course_version_id`, `unit_id`, `topic_id`, `slug`, `title`, typed `objectives`, `skills`, `accessibility` and `variants`. Persistent IDs and curriculum mappings are never inferred from lesson titles. The adapter supplies schema version and always starts imports as `draft`/`institutional`, revision 1, even if a caller supplies published metadata. Approval and authenticated delivery are separate future workflows. Canonical schema validation is reused; there is no second lesson-document validator.

## Routes and original behavior

AP numeric fragments use one-based `#slide=N`; known original slide anchors retain ID/index identity. Out-of-range or malformed fragments are not clamped to an arbitrary slide. The historical AP alias remains identified without rewriting its URL. IB `#learn`, `#practice`, `#exam`, `#quiz` and `#review` retain their original route identity; only learning content is previewable. Assessment/review routes remain in legacy mode even with the feature flag enabled.

AP's `#continuePractice` remains a declarative reference to its existing `[data-finish-lesson]` guard delegate. The adapter does not click the button, navigate, mark completion, record attempts or forward evidence. IB local views, reveals and readiness/self-scores are not imported into institutional mastery. Existing access guards still apply to the original lesson. Adapter purity does not certify or rewrite the existing legacy runtime.

Each unsupported slide contains only a `legacy-embedded` block with `{source, anchor, sha256, summary}`. AP references the corresponding original slide anchor. The generic IB engine does not expose a stable per-slide URL; its references return to `#learn` and preserve the exact source index separately in compatibility metadata. No nonexistent deep link is invented. Its original layout remains in the original HTML, while the single-column metadata reference is conservative.

## Supported text and unsupported preservation

Recognized conversion input is deliberately narrow:

* Plain `<p>` paragraphs with plain text, HTML entities and attribute-free `<strong>/<b>/<em>/<i>` formatting.
* Explicit inline `<span class="math" data-tex="..." aria-label="...">...</span>` or display `<div class="math" data-tex="..." aria-label="...">...</div>` math. Spoken text is required rather than guessed from TeX.
* `<aside class="callout" data-kind="note" data-title="...">` with recognized paragraphs; kind also accepts the canonical definition/warning/example values.

Unknown tags/attributes, HTML parse errors, links, SVG/MathML, forms, controls, script/style, event hooks, complex layouts, ambiguous formatting or malformed/unsafe math return one complete original source reference. The helper does not strip an unsupported interactive section into misleading text, invent spoken math, extract answer reveals or copy teacher materials. It does not decide publication rights: only reviewed non-assessment explanation fragments are candidates for conversion, and output remains draft. Actual pinned legacy fixtures export metadata/reference blocks only; their HTML, questions and answer/rubric arrays remain in existing source engines.

## Fixture verification

Install the isolated tools package from the repository root, then test:

```sh
pnpm --dir tools/lesson-compatibility install --frozen-lockfile --ignore-scripts
node tools/lesson-compatibility/build-fixtures.mjs --source-root . --check
node tools/lesson-compatibility/test-compatibility.mjs
```

The schema tools package must also be installed for local KaTeX validation. `tools/` remains excluded from Pages. Fixture data contains titles, source locators/hashes, layouts, pacing and counts only. No answer, question prompt, solution or rubric object is exported. Synthetic test UUIDs and `fixture:` curriculum IDs are supplied explicitly by test callers and are not production curriculum records.

The development-only builder verifies every exact source-file SHA-256 from production commit `fda45056e7b11e3f1d45bf96f7c8c36246d69e8d` before composing any JavaScript. Only seven fixed, reviewed IB metadata layers are accepted, in their HTML-declared order. It exports inert JSON after composition. The VM is not a security sandbox for untrusted code; production adapters never import or execute these scripts.

Verified source stages, shown as slides/practice/exam/quiz:

* Base: 49 / 40 / 2 / 10.
* v5 apply: 36 / 52 / 3 / 14.
* Final v6 plus pacing: 73 / 96 / 5 / 14.

AP remains 33 slides, 20 original questions and 3 FRQs. Exact generated metadata and runtime pin output are checked, and changed source bytes are rejected before composition. The pinned metadata contract is immutable and deliberately narrow; updating a source version requires a new reviewed manifest/fixture regeneration rather than accepting unknown layers.

## Draft integration boundaries

New ECHS006 files are listed in `ECHS006-files.json`. The local draft also contains copies of ECHS004 schema modules solely to run tests; those are not new ECHS006 deliverables. Do not copy `node_modules` or the temporary source-generation helper outside this directory. No live fixture import, URL replacement or deployment is performed. Rollback is to keep the disabled flag and use the exact original URL; no saved state or publication data has been migrated.
