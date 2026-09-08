# ECHS-009: safe rich text and visual mathematics

## Scope and release status

This stage adds teacher authoring of rich text, mathematics and callouts to the authenticated Lesson Studio. It preserves the `echs.lesson.v1` envelope and every existing version 1 block contract. No existing student lesson URL is switched to the document renderer. No curriculum record or question publication rule changes.

Implementation and local regression checks are complete. Actual PostgreSQL migration/HTTP checks, PR workflows, merge and production deployment verification are required before this stage is complete. See the execution backlog for the final acceptance record.

## Architecture and files

- `schemas/echs.lesson.v1.schema.json` adds explicit `rich-text@2`, `math@2` and `callout@2` variants. The generated browser and Edge validators remain derived from this schema, with checked provenance.
- `js/lesson-runtime/math-expression.mjs` compiles a bounded closed expression tree to pinned, untrusted KaTeX. The stored source is either a visual expression tree or advanced TeX; it never contains two competing editable representations.
- `js/lesson-runtime/content-renderer.mjs` renders safe content with DOM construction and is shared by the authorized lesson renderer and private Studio preview. It adds no authorization, fetch, storage or mastery behavior.
- `js/lesson-studio/rich-text-editor.mjs`, `math-editor.mjs` and `block-model.mjs` provide bounded editing and immutable block operations. `app.mjs` integrates these with the existing session and transport contracts. The public HTML remains an empty staff shell.
- `lesson-api` retains the existing authenticated scope, revision, review and publication transitions. A data-free database capability probe reports whether both server validation layers support this content before Studio enables new authoring.

## Content and accessibility contract

Rich text supports paragraphs, ordered/unordered lists, emphasis, safe HTTPS links and inline mathematics. Pasted text is plain text. Arbitrary HTML, scripts, attributes and external embeds are not content formats. Link controls lock their selected text while a pending link is edited.

The visual math editor supports numbers, symbols, grouping, negation, binary relations/operators, fractions, powers, roots, named functions, limits, sums and integrals. Expressions have at most five levels and 128 nodes. Compiled TeX remains bounded to 4,000 characters. Every math entry requires a spoken description; changing the expression requires review of an existing custom description. Advanced TeX uses strict pinned KaTeX validation without trusted commands.

Text, semantic lists and MathML accompany the visual output. Editors have labelled keyboard controls, visible invalid-input feedback and a responsive layout. Renderer instances assign distinct callout heading IDs so simultaneous canvas and full preview retain correct accessible associations.

## Persistence and publication checks

`202609080003_lesson_content_v2.sql` is migration 23. It adds bounded SQL content helpers and a service-only, data-free `lesson_content_capabilities()` function. Version 2 dispatch is additive; version 1 validation is preserved. Existing table grants, RLS, authenticated RPC scope, compare-and-swap revisions and immutable publication history remain in force.

SQL checks closed shapes, bounds and forbidden TeX constructs; the Edge validator additionally compiles visual expressions and performs actual TeX syntax validation using KaTeX 0.16.27. Both save and publish continue through the existing canonical document validation. No client rendering state counts as validation or mastery evidence.

The frontend requires the exact `echs.lesson.authoring.v1` capability object with content version 2. Missing, failing or malformed capability responses disable the new controls. A stored version 2 document is read-only against an incompatible service. Original plain version 1 editing remains available. This handles independent Pages and backend rollout ordering without enabling unsupported writes.

Invalid editor buffers remain local in memory and block manual save, navigation and preview. A previously queued save may acknowledge the last valid document; it never contains invalid raw input or changes the invalid-input message to Saved. Failed reloads retain the current editor buffer. Navigation locks editing during pending saves and revalidates before leaving. Session revocation disposes editors and clears private DOM/state. No browser draft persistence is introduced.

## Validation

Local checks cover original schema, server/API, draft model/session, transport, renderer, access guard and compatibility behavior, plus expression compilation, block operations, rich/math editors and the integrated Studio. Synthetic desktop/mobile screenshots and JSON reports are generated beneath `artifacts/lesson-content-v2` and `artifacts/lesson-studio`; these are excluded from the Pages artifact.

The `Versioned lesson content contracts` workflow runs the unchanged 235 PostgreSQL checks and eight HTTP/SQL groups on the original 22 migrations first. It then seeds/publishes an original document, applies migration 23 and compares pre-migration records. The new database suite exercises 137 shared content fixtures, grants, scope/review rules, publication immutability, version 1 restore, concurrent revision conflicts and withdrawal. Seven additional real HTTP/KaTeX/SQL groups verify the complete new boundary. Both generated validator builds and the frozen deployable Deno function are checked.

The original renderer and guard fixture tests serve repository bytes at their existing synthetic origins through Playwright interception. This avoids a reproduced local Chrome loopback transport stall while retaining actual production scripts and existing access/navigation assertions; it does not substitute mocked rendering logic.

## Security and rollback

No answer keys, teacher documents, credentials, student records or production fixture data enter public assets. Links use a conservative shared ASCII HTTPS policy, fixed navigation attributes and no automatic fetch. Content rendering makes no learning writes. Private reads/writes retain institutional authentication and server scope enforcement.

Before any version 2 document exists, the prior Pages and Edge release can be restored together. After version 2 content has been saved, retain compatible readers and database validators when disabling authoring. Do not delete the migration or downgrade the validator in a way that strands existing drafts or immutable snapshots. Disable the new authoring capability first, preserve all records and use a forward corrective migration for a database defect. Existing handcrafted and `LESSON_DATA` routes remain an independent rollback path.

Unresolved release risks: actual PostgreSQL and deployment evidence must be recorded before completion; synthetic browser tests cannot replace teacher acceptance with a real school account. No production class pin, teacher draft creation, review or publication is performed by this validation stage.

ECHS-010 readiness: implementation planning may proceed, but media/table/resource authoring must not be merged or deployed until this stage's database, regression and deployment acceptance is complete.
