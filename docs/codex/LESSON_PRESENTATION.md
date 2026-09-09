# ECHS-013: classroom presentation

## Release status

Complete and deployed through PR #361, main `74530fe355cf68452d5daa0cbf31f8b132302f30`. All 16 PR workflows, 12 main/deployment/live workflows and 100 final public checks passed. The sealed release evidence includes 17 state tests, 33 presentation browser groups, nine local Studio browser suites, 68 Linux baseline checks, and the unchanged 25-migration PostgreSQL regression with 676 database checks and 38 HTTP/SQL groups. Its rollback predecessor is ECHS-012, PR #360, main `34db877f92de9c3748b32b79245a36c221dd6904`.

## Architecture

Presentation is an authenticated staff mode inside the existing Lesson Studio. It uses the same canonical `echs.lesson.v1` document and the existing content/media renderers. It introduces no schema version, database migration, server endpoint, curriculum record or student route replacement.

The Studio entry is blocked during composition. It saves valid accepted edits and obtains a fresh authorized lesson record before opening. It passes only `head.document` to the presentation module. Separate private teacher notes, review comments, publication events and recovery material are outside that module's input contract. The background editor remains inert while presentation is open. Returning to editing obtains current server state again before attaching a draft session; if that verification fails, the private workspace closes instead of resuming an unverified editor.

`presentation-session.mjs` owns immutable document state, bounded navigation and per-slide reveal counts. `presentation.mjs` owns the native modal, fullscreen surface, controls, content rendering and resource lifecycle. `css/lesson-presentation.css` provides the opaque presentation surface, responsive controls, large mathematics and reduced-motion behavior. The existing institutional client retains account/session ownership and server authorization.

## Navigation and reveal

The first slide initially shows its title. Reveal adds one existing block at a time; unrevealed blocks are not placed in the DOM or loaded as media. Next, Previous and the slide selector navigate within the document. Each slide keeps its reveal count for the current presentation. Reset clears the current slide's reveal count and disposes its interactive/media state. These controls do not modify the source document or save a new revision.

Arrow Right/Page Down and Arrow Left/Page Up navigate; Space reveals the next block. Shortcuts do not intercept composition, form controls, editable content or embedded media. Visible buttons and the slide selector provide the same actions without shortcuts. A live status identifies the current slide and reveal state. Slide changes do not animate, and reduced-motion preferences are honored explicitly.

Ordered reveal is a teaching control over existing blocks. The current schema has no automatic solution or teacher-only block classification; this stage does not infer which content is an answer or make an assessment-release decision. Existing legacy references remain safe textual summaries rather than launching the original route inside presentation.

## Fullscreen and privacy

A separate Full screen button invokes the browser API from a user gesture, after asynchronous saving and authorization have completed. Its target is an inner presentation surface, not the native dialog element. If fullscreen is unavailable or rejected, the viewport-sized opaque modal remains usable. Leaving fullscreen keeps that modal open; ending presentation is a separate explicit action.

Only revealed content is rendered. Navigation and reset dispose outgoing renderer resources, cancel pending assets, revoke owned blob URLs and remove embedded players. Private assets still use the existing authenticated resolver and access checks. Locally detected account/session/route changes dispose the presentation and reject late responses. Remote membership revocation is detected by subsequent authorized requests; it does not recall an already projected snapshot without a new check. The presentation module retains no durable state and makes no lesson, mastery, completion, learning-sync or publication writes.

## Validation

The dedicated `lesson-presentation.yml` workflow checks state contracts and real-browser presentation behavior. Existing Studio, history, media, recovery, schema, authentication/cache and baseline workflows remain enabled. The existing history workflow continues to execute the unchanged 25 migrations and actual HTTP/client/SQL regression contracts; presentation needs no new database test fixture.

Focused commands after installing pinned repository tool dependencies:

```text
node tools/lesson-studio/test-presentation-session.mjs
node tools/lesson-studio/test-presentation-browser.mjs
node tools/lesson-studio/test-studio-presentation.mjs
node tools/lesson-studio/test-studio-history.mjs
python tools/validate_auth_shell_cache.py
python tools/validate_baseline.py
```

Tests must cover navigation bounds, immutable source data, independent reveal counts, reset, keyboard exclusions, composition, fullscreen success/failure/exit, responsive layout, reduced motion, authenticated media lifecycle, access changes and late responses, private-note exclusion, and absence of mastery/progress/storage writes. Browser fixtures use original synthetic content; they do not constitute production classroom acceptance. Final results and screenshots belong in the ECHS-013 release evidence, with real SQL and live deployment checks identified separately.

## Migration, rollback and limits

Preserve the existing URLs, Pages deployment, class/course pins, question publication gate, immutable publication history, private assets and server-authoritative mastery. The service worker treats the new presentation stylesheet as an authenticated-shell asset using the existing cache protection.

Rollback restores the predecessor Studio HTML/application/service-worker release together and removes its presentation imports and stylesheet link. Retain all existing migrations and private data; presentation creates no server record that needs reversal. A fullscreen browser capability failure falls back to the opaque modal without changing stored content.

Presentation is a staff classroom view, not adoption of authored content by existing student routes. It is not an assessment-release engine or a substitute for reviewing lesson content before projecting it. Reveals are ephemeral and reset when a presentation ends. There is no timer, durable reveal journal, automatic solution detection or new graph/3D/question block in this stage.
