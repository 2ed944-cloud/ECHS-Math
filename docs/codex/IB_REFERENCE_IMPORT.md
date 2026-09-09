# ECHS-014 — Reviewed IB reference import

Status: implementation and verification in progress. The release report records the tested commit, CI results and deployment evidence; this document does not itself assert a completed release.

## What is being migrated

The optional Studio create flow imports reviewed teaching explanations from the geometric-sequences reference lesson into the existing `echs.lesson.v1` document. It keeps every one of the original lesson's 78 slide positions. Twenty positions have original ECHS explanations expressed as editable rich text, mathematics and semantic tables. The remaining positions are explicit references to the original lesson. A teacher can select fewer native explanations; at least one must be selected. Unselected native options also become references, so selection never silently deletes source coverage.

This is a selective authoring migration. It does not replace the original student lesson or reproduce its complete visual layout, questions, calculators or investigations inside Studio. References say which original slide to open and explain that they do not contain its interaction or assessment. Drafts containing these unresolved references remain blocked by the existing publication validator.

The unchanged source route is:

`lessons/ib-math-ai/unit-1/lessons/IB_AI_SL_1.3_geometric_sequences_ECHS.html`

## Source inventory and exact identity

`tools/lesson-import/source-manifest.json` pins the source HTML, all 16 ordered scripts and the earlier compatibility metadata. The development builder executes the original composition in an intercepted browser with external requests blocked and serves the repository's existing styles and fonts. It checks source hashes before execution and measures the completed deck. It emits inert, bounded data; the production import never evaluates uploaded HTML or arbitrary lesson scripts.

The completed source has 78 slides, 103 practice items, six extended tasks and 14 quiz items. The ECHS-006 compatibility fixture intentionally described an earlier 73-slide/96-practice/five-task/14-quiz composition. The later GDC layer adds five slides, seven practice items and one task. ECHS-014 preserves the ECHS-006 fixture rather than changing its meaning. The new ledger covers the final composition, including both geometric labs, sigma interactions, five appended GDC workflows, five classroom GDC workflows and the consented lazy calculator simulator.

The lightweight eligibility module requires the IB first-assessment-2021 course UUID `9a875b4c-61af-5001-9f31-a22044f6f58d` and the exact server catalog binding: course `ib-math-ai`, access key `ib-math-ai::0::1.3`, unit `legacy:ib-math-ai:unit:1`, topic `legacy:ib-math-ai:topic:1.3`, ready status and the source route above. Catalog position is server ordering metadata and is not projected by the production context RPC, so the target does not require it. The parent Studio flow additionally requires an active assignment and active nonplaceholder course. A similarly numbered lesson, another course, an inactive pin or the future 2029 placeholder is ineligible. These legacy catalog identifiers are not represented as official IB objective identifiers.

## Curriculum and mathematics review

The [IB Mathematics: applications and interpretation guide](https://ibo.org/globalassets/new-structure/university-admission/pdfs/dp-mathematics-applications-and-interpretation-guide-en.pdf) was rechecked on 2026-09-09. For the active first-assessment-2021 curriculum, SL 1.3 covers geometric terms, finite sums, sigma notation and applications (printed pages 27–28). Financial applications connect to SL 1.4; integer powers and introductory calculator logarithms to SL 1.5. Exponential models and evaluation connect to SL 2.5–2.6. The logarithm threshold scaffold does not create a new official SL objective or claim that general logarithm laws are SL 1.3 content. Infinite geometric sums are AHL 1.11; the original extension remains outside the imported SL core.

The imported wording is newly authored from mathematical relationships. It explicitly states nonzero quotient denominators, positive integer indices, ratio sign/magnitude cases, the `r = 1` finite-sum exception, positive threshold domains, monotonicity and adjacent-stage checks. Native mathematical tests independently calculate representative terms, sums and thresholds, including zero, negative-ratio and exact-boundary cases. Candidate slide 69 is retained as a reference because its meaning of “Evaluate” is not supported by the first-assessment-2021 AI guide's command-term glossary; the import does not silently replace or endorse that definition.

The teacher's entered objectives and skills remain unchanged in the imported document. The companion ledger records reviewed conceptual coverage without inventing or rewriting curriculum records.

## Visual and content parity

The ledger records each source position, stable ID, title, HTML hash, disposition and preservation reason. Native explanations keep the reviewed mathematical distinctions and source order while using the canonical accessible renderer. Tables replace visual grids, equation sequences replace positional annotations and narrow viewports reflow content vertically. These are documented semantic changes, not a claim of identical pixels.

Browser evidence pairs original and native views at desktop and mobile sizes for each reviewed mapping. Original-route checks use the actual GitHub Pages guard-injection build, navigate all 78 positions and exercise the preserved labs, GDC workflows, simulator consent and assessment routes. Original source hashes are checked again after the run. Question content, hidden answers, rubrics and interaction state are not copied into the new reference module.

## Private creation and lifecycle

Only the exact eligible class/catalog selection shows the import option, and only when existing content/media capabilities are available. The teaching module and dialog load on demand. Reviewing, selecting, cancelling and previewing perform no draft creation. Confirmation retains a selection; the ordinary Create lesson action constructs a new canonical private draft and uses the existing authenticated API, immutable version history and revision checks.

An occupied class/route cannot be overwritten. An uncertain creation result retains the same lesson UUID and immutable payload for read reconciliation. Changing classes is blocked until that pending result is checked. Input composition blocks creation and preview actions. Account/session invalidation closes the import dialog, clears retained preview/form state and suppresses delayed results. The import does not grant authorization or bypass server checks.

The real PostgreSQL integration extends the existing 25-migration fixture with an isolated active IB class. It exercises creation through the production Studio client, handler, transport and SQL RPC; lost acknowledgement; private access; occupied-route conflict; native edits; stale revisions; immutable history; and rejection of approval/publication while references remain. The current handler's publication-validation failure is `503 invalid_stored_document`; this stage preserves that existing contract rather than broadening publication.

## Security, performance and rollback

No database migration, API authorization change, curriculum seed change or student URL cutover is required. No production teacher fixture, course pin, draft, upload or publication is created by verification. Private notes, restricted assessments and answer-release payloads stay behind their existing boundaries. Imported viewing, editing and presentation produce no mastery, completion or assessment attempt evidence.

The generated public data is bounded to 256 KiB and loaded only when the teacher opens the relevant review. There is one active preview, no original iframe or calculator load in the import dialog, no new global graphing library and no automatic external navigation. Existing account-aware cache exclusions cover the Studio entry and its additional stylesheet. The original source keeps its established lazy calculator behavior.

Studio also bundles the unmodified 26,272-byte `KaTeX_Main-Regular.woff2` from its pinned KaTeX 0.16.27 dependency, with the font-specific SIL Open Font License notice. The inherited math stylesheet named that font without supplying it; its not-equal overlay otherwise fell back to a missing system-font glyph. A same-origin font face in the Studio import stylesheet supplies the glyph for import, editing and presentation. It loads when needed, preserves the existing `font-src 'self'` policy, and leaves the original lesson stylesheet unchanged. Browser checks verify the actual custom font used for the negation glyph, as well as rendered screenshots.

Rollback reverts the optional import entry, modules, style and service-worker revision. Existing imported drafts remain ordinary canonical drafts with immutable history; reverting does not delete them or alter their permissions. Original lesson routes, deployment and rollback sources remain available throughout. Removing unresolved references is a deliberate teacher editing/review task, not an automatic conversion or publication step.

## Verification commands

```text
node tools/lesson-import/build-ib13-reference.mjs --source-root . --check
node tools/lesson-import/test-ib13-import-model.mjs
node tools/lesson-import/test-ib13-mathematics.mjs
node tools/lesson-import/test-ib13-sources.mjs
node tools/lesson-studio/test-import-dialog.mjs
node tools/lesson-studio/test-studio-import.mjs
node tools/lesson-import/test-ib13-parity.mjs
node tools/test_lesson_import_e2e.mjs
```

The last command requires the isolated loopback PostgreSQL fixture and preceding migration/database reports. `.github/workflows/lesson-import.yml` runs the new model, mathematics and browser checks; the existing history workflow runs all prior database/HTTP groups plus the import integration. Canonical validators, existing Studio/history/presentation tests, immutable compatibility fixtures, original IB checks, authentication/cache checks and the reliable baseline remain required release evidence.

## Remaining limitations and ECHS-015 readiness

This stage leaves assessment and complex interactive positions in the original runtime, and imported references cannot be published. The source's third-party bibliography is not a republication licence. Browser fixture identity proves local client behavior; actual authorization is separately verified through real SQL and existing public denial probes. Remote role revocation is detected at the next authoritative request and cannot recall content a staff member has already viewed.

ECHS-015 remains unstarted until ECHS-014 passes its new and existing tests, is merged and has verified deployment evidence. Its separate AP adapter must preserve all six investigations, question gating, URL behavior and mastery boundaries; the IB import does not establish those AP-specific contracts.
