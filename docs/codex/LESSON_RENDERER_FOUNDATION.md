# ECHS-005: opt-in lesson document renderer

This is a small framework-neutral renderer for the validated `echs.lesson.v1` contract. No production lesson imports it yet. Existing URLs, course catalogs, handcrafted pages, `LESSON_DATA` engines, Pages deployment and legacy rollback paths remain intact. This is the renderer proof required before persistence; it is not the visual Lesson Studio or ECHS-007.

## Host contract and publication boundary

`mountLesson({root, lesson, binding, enabled, window, mathEngine, accessTimeoutMs})` defaults to legacy mode. Only the boolean `enabled: true` opts in. All other values leave the original DOM and URL untouched, even if the new document is invalid.

An enabled host must already load the canonical institution client, `portal-access.js` and `lesson-access-guard.js`. The renderer consumes their authenticated school account and released lesson decision; it does not replace their server check or introduce a new access endpoint. It requires an allowed student/teacher/admin role, a nonempty session token, the existing `data-lesson-gate="allowed"` marker, matching released course, and student course membership. Account and gate waits are bounded. Token changes during the gate wait are rejected.

The host supplies an independently authorized `binding`: the exact absolute route including query (hash excluded), `course_key`, and document identity fields `lesson_id`, `course_version_id`, `unit_id`, `topic_id`, `document_version` and `publication_revision`. The renderer rejects mismatches. Do not derive this binding from arbitrary fetched document data. ECHS-007 must obtain it from the authorized server record and immutable publication revision. No such persistence API is implemented here.

`assertPublicLessonDocument` requires the validated published/public shape and parses every math expression. This is a public-payload constraint, **not server proof of publication or entitlement**. Private answers, teacher material and secure question bodies are unsupported. They must never be included in a Pages document. No question gate or provider is changed.

The renderer observes gate/course changes and the existing signout/auth-error/access events. Delivered role/course revocations, account/token changes, or route/query changes dispose the view. It does not invent polling or claim a DOM marker is a security boundary against an attacker controlling their browser.

## Rendering and navigation

Rich text uses text nodes and enumerated strong/emphasis marks. Math uses KaTeX with `trust:false`, strict errors, HTML plus MathML, spoken labels, `maxExpand:100` and `maxSize:10`. Callouts have semantic headings; one-, two- and three-panel layouts use responsive CSS. Navigation supplies named controls, a live slide status, visible focus, 44px control targets, and reduced-motion behavior.

Previous/next, slide select, Home/End, Page Up/Down and arrow keys work without intercepting editable controls. Numeric hashes, stable slide IDs and legacy `#sN` links are understood. Hash navigation preserves the original pathname and all query parameters. The fallback mode preserves unknown hashes exactly.

`legacy-embedded` remains a reference, not executable HTML or an iframe. A reference can preserve current access/completion parameters only when its canonical destination is the current authorized lesson pathname on the same origin; cross-lesson references fail closed. A future cross-lesson navigation feature must resolve a separate authorized pathway rather than forwarding another lesson's access key.

The finish action delegates to the canonical `[data-finish-lesson]` control. The renderer itself has no storage, learning API, attempt, session or mastery writes. The existing guard may record completion and open focused practice, as it already does. Completion is not scored mastery.

## Evidence and test commands

Fixtures under `tools/lesson-runtime/fixtures/` use original synthetic content and fixed synthetic identifiers. They are excluded from Pages by the unchanged `tools/` exclusion. They are not real curriculum mappings or student data.

```sh
npx --yes pnpm@11.19.0 --dir tools/lesson-runtime install --frozen-lockfile --ignore-scripts
npm ci --prefix question-bank/official/tools
npx --prefix question-bank/official/tools playwright install --with-deps chromium-headless-shell
node tools/lesson-runtime/test-renderer.mjs
node tools/lesson-runtime/test-guard-integration.mjs
```

The first browser suite checks DOM/math, focus, keyboard, hash/query preservation, 390px layout, publication rejection, binding mismatch, cross-lesson link rejection, missing/changing tokens and access invalidation. It produces desktop/mobile screenshots and JSON results under `artifacts/lesson-runtime/`.

The second executes **unmodified** `portal-access.js` and `lesson-access-guard.js` against an isolated loopback institution API. It checks released/unreleased/unassigned/guest/parent/error routes, existing teacher/admin behavior, and actual completion-only finish/practice semantics. It observes real production event names and storage writes. Only unrelated tutor loading and destination HTML are stubbed. These are executable integration tests with simulated backend responses, not a claim of live account testing or database authorization proof.

`.github/workflows/lesson-renderer.yml` runs both suites plus the schema gate and uploads evidence. Windows may use an installed Chrome via `ECHS_CHROMIUM_PATH`; otherwise Playwright uses its pinned browser.

## Rollback and remaining boundary

There is no database migration in ECHS-005. Disable the host opt-in or reload the unchanged legacy URL for rollback. Current production lessons already remain in that state. Existing source documents and engines are retained. ECHS-007 must implement secure persistence, organization/teacher scope, immutable publication storage and server-authorized bindings before any real authoring or document cutover.
