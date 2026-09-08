# Lesson Studio shell — ECHS-008

## Scope and acceptance

The new `lesson-studio.html` uses the ECHS-007 institutional lesson store for private teacher authoring. Teachers select an assigned class and an existing catalog route, create an institutional draft, and create, rename, duplicate, reorder and delete slides without HTML or JSON. A deleted slide can be restored without reverting later edits. The desktop view has a slide navigator, live canvas and properties inspector; the mobile view stacks these areas. Existing lesson routes keep their current engines.

This is the ECHS-008 shell. Rich text/math authoring, additional block types, durable offline recovery, complete undo/redo, version history and publication controls are separate subsequent backlog slices. The shell can safely preview existing canonical text, math and callout blocks; its basic text field only edits unformatted text and preserves formatted/math content.

## Runtime inventory and changed files

| Path | Responsibility |
|---|---|
| `lesson-studio.html`, `css/lesson-studio.css` | Public empty authoring shell; accessible dialogs, controls and responsive layout |
| `js/lesson-studio/app.mjs` | Verified staff entry, class/catalog selection, slide editing, preview and autosave UI |
| `js/lesson-studio/api-client.mjs` | Fixed-origin, account/route-owned `lesson-api` transport; current-session checks, bounds and canonical validation |
| `js/lesson-studio/draft-model.mjs` | Immutable canonical draft/slide transformations and recoverable deletion |
| `js/lesson-studio/draft-session.mjs` | Serialized debounce, revision compare-and-swap and reconciliation of uncertain saves |
| `js/lesson-studio/preview.mjs` | Validated DOM text/math/callout rendering; no publication or learning authority |
| `question-bank/teacher.html` | Teaching tools link to Lesson Studio |
| `sw.js` | Fresh Studio shell/modules/styles; explicit lesson API cache bypass |
| `.github/workflows/lesson-studio.yml` | Model, session, transport and real browser checks |
| `.github/workflows/deploy-pages.yml` | Include Studio changes in the existing PR artifact validation |
| `tools/lesson-studio/*.mjs` | Original synthetic fixture and regression tests; excluded from Pages |
| This document and `EXECUTION_BACKLOG_30.md` | Acceptance evidence, scope and rollback |

The canonical runtime/deployment/auth/mastery/question inventory remains documented in `RUNTIME_INVENTORY_20260908.md`. No existing lessons, private banks, publication gates, curriculum registry records or mastery writers are modified here.

## Persistence and security

There are no new database migrations or Edge Function changes. ECHS-007's deployed immutable versions, class/organization authorization, custom school sessions, RLS and review/publication RPCs remain the server authority. Opening Studio requires a fresh `/account-api/me` verification and an active teacher/admin account. The browser captures account, organization, role, token and authoring URL; stale responses are aborted/ignored and private DOM/state is cleared when that ownership changes. A changed account cannot inherit another account's dirty draft. Class/lesson switches make the old workspace inert while loading.

Class versions are never assigned automatically. An administrator may explicitly pin an eligible version with a reason; a teacher cannot create a draft in an unpinned class. Catalog identities and routes are selected from the authorized API response. Teacher-entered objectives are identified as teacher metadata, not invented official curriculum objectives.

Drafts and teacher notes remain in Supabase and memory. No draft, notes, answer keys or question material is embedded in the public shell or stored in browser storage. Notes are separate from the canonical lesson document and preview. Responses require JSON and browser-readable `Cache-Control: private, no-store`; the server's existing `nosniff` header is retained but is not incorrectly treated as readable through CORS. Preview uses DOM text nodes and pinned KaTeX 0.16.27 with trust disabled; it does not bypass the student renderer's publication/access checks or emit mastery events.

Autosave uses the latest expected revision. Edits made during a request survive its acknowledgement and are saved serially. A timeout, lost acknowledgement or other ambiguous write pauses automatic retries. Explicit retry first reads the server and either recognizes the already committed snapshot, safely resumes against an unchanged server revision, or shows a conflict. Reloading conflicting content requires an explicit discard action. Closing a dirty/invalid draft prompts the browser's normal unsaved-work warning. In this slice, offline edits survive only while the tab remains open; durable offline recovery belongs to ECHS-011.

Creation also retains its original lesson UUID and payload until the outcome is known. A lost acknowledgement is reconciled by reading that UUID; retries only resubmit the same identity after an authoritative missing-record response. Pending creation prevents a class/lesson switch from abandoning the result. Entered fields stay available while resolving it.

## Validation commands and evidence

Use the pinned setup in `BASELINE_VALIDATION.md`, then run:

```text
node tools/lesson-studio/test-draft-model.mjs
node tools/lesson-studio/test-draft-session.mjs
node tools/lesson-studio/test-api-client.mjs
node tools/lesson-studio/test-studio-browser.mjs
python tools/validate_baseline.py --json-report artifacts/lesson-studio/baseline.json
```

Browser tests use the production HTML/modules and the real lesson HTTP handler with synthetic accounts and an in-memory RPC fixture. They make no production requests and are not a substitute for PostgreSQL/RLS tests. The unchanged server migration was independently verified in ECHS-007 against PostgreSQL 15.19 with 235 database checks and eight actual HTTP/SQL groups.

Local Windows verification on 2026-09-08 passed all 14 model tests, 20 session tests, 17 transport tests, 16 real-browser groups and all 68 baseline checks. The first baseline attempt lacked the existing DOM dependency path and browser execution permission; the corrected complete run used the pinned dependencies and local Chromium and passed with zero failures. The bank release validator retained its existing warning about eight duplicate normalized-prompt groups with distinct permanent IDs/source contexts; no question data or gate was changed.

The browser groups cover focused typing, edits during saves, slide operations, delete recovery, notes/preview separation, keyboard/mobile layout, failed/ambiguous writes and creates, conflict/discard, teacher/admin/denied roles, explicit course pins, inert loading transitions and stale account/route responses. Desktop and mobile screenshots were visually inspected. Evidence is written under `artifacts/lesson-studio/` and uploaded by CI. PR checks must pass on the exact reviewed revision before merge; production acceptance is recorded separately after deployment.

The shell and its five new modules total approximately 89 KB of source (27 KB with gzip), excluding the reused pinned schema/auth/KaTeX assets. The initial Studio budget is 120 KB source / 40 KB gzip for these new assets. The authoring page loads no graph/3D framework; documents remain bounded to 1 MiB and preview validates a full lesson once rather than once per slide. No new library is loaded globally in existing lessons.

## Migration and rollback

This is an additive staff entry point with a teacher dashboard link. There is no student route cutover, new curriculum adoption or automatic publication. Existing URLs, guards and GitHub Pages deployment remain intact. Revert the ECHS-008 commit and redeploy Pages to remove the shell and link; ECHS-007's immutable drafts/versions remain safely stored. Do not delete stored documents to roll back the UI. The cache version change refreshes authoring code through the established service-worker policy.

## Remaining limits

No production teacher data has been created for testing. A real staff account still needs an assigned class and an explicitly pinned active curriculum version. Full publication/history, rich mathematics authoring, media and durable offline editing are not claimed by this stage. ECHS-009 must wait for ECHS-008 acceptance; the broader ECHS-008–030 request remains active.
