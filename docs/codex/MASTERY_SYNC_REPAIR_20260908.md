# Narrow mastery synchronization repair

This repair operates on `work/foundations` after the ECHS-001 source inventory. It has not been deployed. No production database or account calls were made.

## Result

The canonical institutional client now owns the raw learning payload, pending envelopes, and authoritative sync request. The mastery dashboard bridge delegates to it; event-driven and exported dashboard methods therefore use the same endpoint. Attempts, sessions, review items and explicit lesson completions remain present when the real learning engine is loaded. The downloadable summary report is not used for raw uploads.

Snapshots are stored under their declared account before asynchronous verification or networking. Failed sends remain queued. Account/token checks run before and after verification, immediately before request dispatch after configuration resolution, and after a response. A request already dispatched for account A keeps A's credentials; its late response cannot clear A's pending snapshot after an account switch, erase B's queue, or announce A's result to B. Older responses also cannot erase a newer queued snapshot. Existing envelopes are merged by stable row identity so newer local snapshots do not discard older queued rows.

Legacy unowned pending queues remain untouched and are never adopted. Previously owned legacy institutional envelopes still require a matching signed-in account.

The authoritative Edge endpoint accepts explicit lesson completions using the existing canonical course/access-key policy. It supplies authenticated account and organization IDs rather than trusting identifiers from the body. Completions do not create attempts or add skills to mastery recomputation. Existing scoring, question-trust guards, grading policy and release gates are unchanged.

## Independent deployment handshake

The endpoint returns `sync_contract: "echs-learning-sync-v1"`. When a lesson-containing snapshot reaches an older endpoint that lacks this marker, the client retains the snapshot and returns `queued: true` with reason `completion_sync_unavailable`. A later normal flush retries the same stable event IDs and completions after the backend catches up. This prevents a successful response from an older endpoint silently discarding completion data while Pages and Edge deployments are out of step.

## Changed paths owned by this repair

- `js/institution-client.js`
- `js/institution-mastery-evidence.js`
- `supabase/functions/mastery-evidence/index.ts`
- `tools/validate_mastery_foundation.py`
- `tools/validate_institution_platform.py`
- `tools/test_mastery_sync.mjs` (new)
- `tools/test_mastery_sync_endpoint.mjs` (new)

The two existing validators now check the repaired canonical delegation and completion contract instead of requiring the old override/compatibility endpoint. All unrelated assertions are preserved. Changes made concurrently by the baseline-runner agent are outside this repair's ownership.

## Validation

Passed locally:

- `node tools/test_mastery_sync.mjs`: actual learning-engine raw payload, delegation, all four scheduled event paths, offline reload, unowned/foreign queues, correct-owner replay, configuration/verification/request account races, newer snapshot preservation, verification/send failures, stale-server handshake and supported retry, expired/non-student sessions.
- `node tools/test_mastery_sync_endpoint.mjs`: actual TypeScript Edge handler executed with fake database and real hashing; invalid/missing/non-student sessions, authenticated completion identity, valid/invalid routes, no mastery from views/reveals/completions, raw evidence and unchanged server recomputation, contract marker.
- `node tools/test_platform_resilience.mjs`.
- `node tools/test_institution_identity_mount.mjs`.
- `python tools/validate_mastery_foundation.py`.
- `python tools/validate_mastery_guards.py`.
- `python tools/test_lesson_visibility_contract.py .`.

The direct `validate_institution_platform.py` run had only the two preexisting disabled-bootstrap-config assertions against the live enabled configuration; it had no remaining sync-related failures. The baseline-runner agent owns activated-config fixture validation and the full core run. Python was the bundled runtime. The endpoint test uses Node's `stripTypeScriptTypes`, available in current Node 22 CI and local Node 24, and makes no network calls. Local Deno CLI type checking was unavailable.

## Remaining baseline risks

This is queue and in-flight request ownership, not whole-data account isolation. The underlying browser learning engine and lesson-completion store still use global local-storage keys. A separate account-storage migration must address ownership of those source records across sign-ins; this repair does not infer owners for old raw data.

The earlier audit's server evidence authenticity and atomic-trigger/recomputation identity concerns also remain separate findings. The scoring algorithm, existing ingestion limits, database triggers, and enrollment/publication policy were not redesigned in this slice.

## Rollout and rollback

Deploy the completion-capable endpoint before or alongside Pages. The handshake protects a newer frontend during temporary old-endpoint overlap. No database migration is needed. If the endpoint must be rolled back temporarily, retain the repaired frontend so completion-containing snapshots remain queued for a supported retry. Reverting the entire repair would reintroduce the reproduced global bridge queue and summary-payload defects.
