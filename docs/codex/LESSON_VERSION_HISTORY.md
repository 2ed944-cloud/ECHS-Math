# ECHS-012: saved versions, review and publication

## Release status

Complete and deployed through PR #360, main `34db877f92de9c3748b32b79245a36c221dd6904`. All18 PR and14 production workflows passed, including the full68-check Linux baseline. The unchanged25 migrations passed676 database checks and38 actual HTTP/SQL groups. All96 public acceptance checks passed. Existing student routes and server publication gates remain unchanged.

## Architecture and preserved behavior

This stage exposes the existing private lesson-store history and workflow APIs in Lesson Studio. It adds no database migration, table, publication rule or student-route replacement. The existing 25 migrations, `lesson-api` handler, production RPC transport and `lesson_store` authorization remain authoritative.

`app.mjs` opens `history-dialog.mjs` after valid local edits have been committed and saved. Invalid editor buffers or unresolved draft saving prevent navigation. The editor stays inert while the history dialog is open. `history-session.mjs` owns the in-memory saved-version list, selection and captured workflow intent; `api-client.mjs` sends authenticated requests and rechecks current account/workspace ownership. `version-diff.mjs` compares canonical content and renders safe descriptive text. The existing preview module provides the separate selected-version preview.

Returning to the editor after attempted mutations obtains current server state before attaching a draft session. Existing ECHS-011 undo/redo, autosave and encrypted draft recovery remain separate. Browsing history does not create a draft revision, complete a lesson or promote mastery evidence.

## Existing API contracts

All paths below are relative to the configured `lesson-api` endpoint. They use the existing `echs.lesson.store.v1` contract, current institutional session and exact authorized lesson/class/organization scope. Responses remain private and non-cacheable.

| Method and path | Behavior |
| --- | --- |
| `GET /lessons/:id` | Current lesson/head and recent metadata. |
| `GET /lessons/:id/history?limit=25&before_version=N` | Descending metadata page; the cursor is exclusive. Document bodies and private notes are omitted. |
| `GET /lessons/:id/versions/:versionId` | One authorized immutable document and its separate private notes. |
| `POST /lessons/:id/restore` | Append a new draft from an existing version. |
| `POST /lessons/:id/request-review` | Submit the current draft for review. |
| `POST /lessons/:id/approve` | Independently approve the exact current head after all five checks. |
| `POST /lessons/:id/publish` | Publish the approved head as the active institutional snapshot. |
| `POST /lessons/:id/unpublish` | Withdraw the active publication with a reason. |

Every write captures `expected_revision`. Restore also sends `version_id`; approval sends the five checks and a comment; withdrawal sends a reason. The server derives authority from the session, validates stored/projected documents and applies its existing compare-and-swap transaction. It does not accept a client-supplied actor or grant.

## Immutable versions and review

Saving or restoring appends a new document version. Requesting review, approving, publishing and withdrawing advance the lesson workflow revision without rewriting the saved document. Document version numbers therefore can have gaps and need not equal the current workflow revision.

Selecting a version shows a comparison with the current saved head. Restore requires explicit confirmation and includes that version's private teacher notes. It creates a new draft at the next revision, records the source version, clears approval pointers and preserves lesson/course/topic identity. The selected historical document and all earlier snapshots remain unchanged. An existing active publication stays available until explicitly replaced or withdrawn.

Approval is available only to an authorized staff member who created neither the lesson nor the current document version. The dialog also requires the current saved version to be selected. Its confirmation names the current version and revision and starts with five unchecked declarations: curriculum, mathematics, accessibility, publication rights and absence of private material in student content. The UI requires a review comment of at most 2,000 characters. These declarations are human review decisions; the interface does not certify curriculum correctness or publication rights automatically.

Publishing requires an approved current head and explicit confirmation. Later draft edits or restores clear approval but retain the previous active publication. Withdrawal requires a meaningful reason of at most 1,000 characters, clears the active publication/approval pointers and records the published source version, even if a newer draft exists. Previously delivered content cannot be recalled.

**Publication does not replace the existing AP/IB student lesson page.** The approved snapshot becomes available through the existing authenticated, class-scoped delivery API. Legacy URLs, handcrafted/data-driven engines, release/progression gates, question publication rules and mastery behavior remain unchanged. Connecting a student route to a published authored lesson is outside ECHS-012.

## Semantic comparison and private notes

`compareLessonVersions({before,after,mathEngine})` takes exact `{document,private_notes}` projections. Both documents must be canonical institutional drafts with matching lesson, course, unit, topic and slug identities; local KaTeX 0.16.27 validates mathematics before comparison. No source version is converted or mutated.

The comparison matches slides and blocks by stable IDs, including moves between slides. Insertions and deletions do not produce positional content replacements for unchanged survivors. It covers titles, objectives and their order, skills, accessibility, context variants, layouts, text/formatting/links, mathematical source and speech, explicit block formats, callouts, media metadata and legacy references. Table columns and rows are compared by their own IDs; reordering them together with their cells does not falsely change the cell content. Revision/publication counters, object-key order and equivalent adjacent text runs do not alone count as content changes.

Output is limited to 200 displayed content changes, 64,000 excerpt characters in total and 1,200 characters per before/after value. The separate private-note section has its own 1,200-character limit per side. Full change detection and counts continue beyond display limits; warnings identify shortened values or omitted changes. Comparison text is a readable summary, not a complete export or mathematical-equivalence proof.

`renderVersionDiff` accepts only a descriptor produced by the comparison module. It creates text nodes and semantic headings/before-and-after labels, without HTML interpretation, JSON dumps, links, asset requests or video embeds. Private notes are omitted by default, including notes-only summary/truncation information. The verified staff dialog explicitly enables their separate section. Selected-version preview receives only the document and follows the existing preview/media contract; it does not receive teacher notes. Media loading belongs to that explicit preview, not the comparison.

## Unknown results, conflicts and disposal

Workflow actions are serialized and retain an in-memory intent containing the exact base, action, actor and relevant source/event facts. A timeout or uncertain response never triggers an automatic mutation replay. “Check server state” reads the server first. A matching next revision must also contain the exact expected actor, source, document/notes or review/publication event before a lost acknowledgement is recognized.

If the server is unchanged, “Retry unchanged action” performs another fresh read before explicitly retrying that captured action. An intervening revision or definite conflict blocks workflow mutations. “Use current server state” explicitly refreshes the record and history before clearing the pending intent; a failed refresh retains it. A revision discovered while reading a selected version also requires refresh. Confirmation is tied to the displayed head/revision, and changing selected versions cancels it.

The history controller aborts superseded selection requests, rejects late account/organization/role/workspace responses and clears its private references on disposal. The dialog disposes comparisons and previews, clears private text/form fields and closes when access is lost. An older comparison's disposal cannot clear its replacement. Returning via Escape uses the dialog's guarded close path; pending actions/form work receive the existing before-unload protection.

History selections, comparisons, review comments and workflow intents are not written to local/session storage or added to the encrypted draft checkpoint. Workflow intents and incomplete confirmation forms do not survive a reload. Reopening obtains fresh server state and does not replay an abandoned action. A restored document subsequently participates in normal draft editing/recovery as the new current draft.

## Validation and limits

The dedicated `.github/workflows/lesson-history.yml` runs existing schema, persistence, content, media and recovery checks, then the history tests. Its PostgreSQL job preserves all 25 migrations and predecessor database/HTTP checks before exercising the real handler and production transport against isolated SQL. ECHS-012 adds no migration 26.

Focused commands, after installing the repository's pinned tool dependencies:

```text
node tools/lesson-studio/test-history-session.mjs
node tools/lesson-studio/test-version-diff.mjs
node tools/lesson-studio/test-version-diff-browser.mjs
node tools/lesson-studio/test-studio-history.mjs
node tools/lesson-studio/test-api-client.mjs
node tools/test_lesson_history_e2e.mjs
python tools/validate_baseline.py
```

The HTTP/SQL test requires an explicitly configured disposable loopback PostgreSQL 15 database and passing predecessor reports; it is not a production smoke test. Browser fixtures use synthetic original documents and accounts. Local semantic/DOM checks do not establish production authorization or deployment success. Browser evidence is under `artifacts/lesson-history/`; real SQL/HTTP evidence is under `reports/lesson-history-*.json`.

Version metadata loads 25 rows per page, capped at 1,000 in the open dialog. Recent review and publication lists contain at most 25 events of each kind. These are display limits, not deletion of stored history. There is no visual merge tool, durable workflow-action journal, complete audit export, offline history browser or student-route adoption in this stage.

## Rollback

Restore the accepted predecessor's Studio shell, styles, application/client modules and service-worker version together. Remove the new history/diff imports from the rolled-back shell rather than leaving a mixed release. Retain all existing migrations, recovery keys, immutable lesson versions, review events and publication records. Rolling back the UI does not undo actions already committed through the existing API; publication changes require the normal authorized workflow. Do not rewrite old snapshots or delete audit rows to simulate a rollback.
