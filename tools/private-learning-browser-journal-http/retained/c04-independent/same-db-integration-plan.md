# C04 same-database integration proposal

Status: source-backed proposal only. No runtime, frozen candidate, database or remote service was changed. The adjacent evidence JSON binds every inspected source and distinguishes the frozen P2b sources from current local `work/foundations` callers. This is not a current remote-main or deployment attestation.

The recommended next slice is a fresh, uninstalled student-only candidate: one IndexedDB database stores P2b state, immutable compound source bundles, wire-ready J049 intents and exact acknowledgments. Keep transport held initially. An offline local command may have a durable **unbound source bundle** before the server revisions needed for its wire envelope are known. That distinction must be explicit; do not label an unbound bundle a sendable J049 intent.

## Evidence and concrete gaps

The frozen P2b manifest is `817c3395b1589c74391cce55fd7dffdae9de3a28c2b1f9fd90e371428c788722`. Its store's `commit()` runs the unchanged transition and atomically writes six stores (`owned-learning-store.mjs:329–359`). `writeRows()` assigns a monotonically increasing owner-local record revision, then replaces the latest pending value at `(org, account, kind, id)` (`:191–219`). `changedRows()` emits new/changed attempts, sessions, reviews and mastery; lessons are always empty, and missing rows are not deletions (`:308–317`). `snapshot()` groups the current rows and hides their revisions in an ephemeral Map (`:221–244`). It cannot reconstruct earlier compound commands after coalescing or reload.

P2b's `commands` receipt proves a local command committed; its `history` and `attempts` stores retain immutable attempt identity. Neither proves remote receipt, adoption or grading. `owned-learning-transport.mjs:1–5` deliberately sends nothing. Bootstrap exposes this hold and keeps local lookup separate (`owned-learning-bootstrap.mjs:36–50`); classic startup suppresses the legacy DOM events that would invoke raw uploaders (`learning-system.js:23–25`). Preserve these protections.

The durable candidate manifest is `f449d38c6dbf32f29162b327078966076a4afaf24ca39b93909f8c11934685fd`. Its strict native transactions, owner rechecks, raw request binding, first exact apply ACK, receipt retention and bounded reads are reusable patterns (`durable-intent.mjs:72–86,109–166`). Its three stores are in a separate database and its record cursors contain no server revision/reset model. Calling its public `prepare()` from P2b would open another transaction and retain the crash gap.

J049 v2 is pinned to `117cdb0a97cd4408b31fedf9f4eba5928b1385f5e2a86d6ee5e55c750c286817`. Its exact schema permits at most 128 records/1 MiB, mutable put/delete with expected server revision, immutable attempt append, and a separate reset action (`contract.mjs:25–42`). First operation lookup is informational; only exact raw apply success/replay establishes the first ACK (`pending-intent.mjs:24–40`). PostgreSQL hashes its normalized JSONB, so JavaScript must not invent a matching hash or round-trip opaque remote value numbers through binary64.

## Database and identity mapping

Use a new candidate database/version. Preserve both predecessors and every old raw key/queue. Do not upgrade or adopt them automatically. Port the durable checks into transaction-internal helpers; those helpers receive the already-open transaction stores and never open a database, start another transaction, fetch or await crypto.

All new persistent keys include `organization_id`, `account_id`, `incarnation_id`, and `adoption_epoch`. P2b currently has only `(org, account)` keys and a session `epoch`; that epoch is not the server adoption epoch or reset generation. An injected bridge must bind the canonical captured student session to an independently authorized server-journal incarnation/capability. Missing/changed binding leaves remote work held. This slice must not create an adoption route or infer one from stored data.

| Store | Role in the successor |
| --- | --- |
| `owners` | Existing local record sequence/capacity plus bundle/intent accounting. Preserve monotonic sequence across reset. |
| `states` | Original 15-domain P2b projection and local command revision. |
| `records` | Latest pending source rows, with exact local revision and source-bundle link; retain existing coalescing only as a convenience index. |
| `attempts`, `history` | Original immutable attempt fingerprint and full history, scoped by incarnation; never reset or ACK-delete. |
| `commands` | Original stable command fingerprint/receipt plus immutable source-bundle identity. Retry returns this same mapping. |
| `source_bundles` | One immutable bundle per compound command: command ID, local command revision, ordered exact row JSON, row local revisions, fixed action, local domain coverage, prior bundle/base knowledge and reset barrier. States such as unbound/bound/acknowledged are separate metadata; original content never changes. Local-only commands record explicit zero-remote coverage. |
| `wire_intents` | Repaired J049 pending intent, immutable transport UUID/raw body, bound bundle ID, complete raw first successful reply/status and canonical receipt. Never delete known receipts. |
| `remote_context` | Validated current incarnation/reset-generation/owner-revision observation, reset barrier and local observation revision. Contains no token and grants no authority. |
| `remote_heads` | `(scope, reset_generation, kind, record_id)` metadata: known server revision/deleted/value hash, observation provenance and pending predecessor. Separate from local row revision and local ACK status. Preserve raw head response if values are retained. |

A local command ID, local command revision, local row revision, transport UUID, server owner revision, server record revision and reset generation are seven distinct concepts. Do not compare them as interchangeable counters. A new transport UUID is allocated once when an unbound bundle is materialized; the mapping is persisted in the same transaction, and concurrent materializers return the existing mapping.

## Three transaction boundaries

**T1 — local compound commit.** Extend the transaction at P2b `commit():329` across the stores above. Revalidate the captured authority at entry, each callback and completion, including after a reentrant capture. Read the command receipt first; identical retry returns the existing local receipt/bundle mapping without recalculating rows. Run the fixed transition against current state under the existing CAS policy. Modify the internal `writeRows()` callback to return every assigned `(kind,id,revision,exact row JSON)` before coalescing loses it. Save the immutable source bundle, latest pending rows, engine projection, counters, immutable attempt history and local command receipt together. Resolve and notify only at transaction completion.

This gives no source-state-without-intent window, including while offline. It does **not** claim the server request exists yet. Commands touching no server-supported domain create no empty J049 request; their receipt explicitly says local-only. Hash immutable command/attempt inputs before opening the transaction as P2b already does. Synchronous serialization/closed validation can run inside callbacks; no promise, digest or network await belongs inside the transaction. Use strict durability and retain the durable candidate's quota, timeout, blocked/versionchange and reload semantics.

Record source removals explicitly as **deletion candidates**, retaining kind/ID, prior source value and reason/domain context. An absent row can mean display-window retention, local reset or an intentional deletion; these are not equivalent. T1 records that evidence without creating a remote tombstone, guessing server revision, deleting retained pending data, or deciding cross-device semantics. Reset records an explicit unbound barrier with its original local command context; `keepProfile`/`keepTeacher` are local flags and are never translated into an assumed server reset policy.

**T2 — bind one complete bundle to the wire.** The smallest scheduler processes one owner queue in local command order with at most one unresolved wire intent. A browser lease is only an efficiency aid: duplicate tabs may send the same persisted raw operation, and SQL idempotency remains the correctness boundary. Never reconstruct payloads from the current projection or `pending()` snapshot. Read the immutable bundle, predecessor disposition and server metadata in one transaction. Build, validate and store the complete exact J049 raw envelope and its UUID once, atomically marking that bundle bound. Sending starts only after T2 completion and fresh canonical authorization.

Server expected revisions come from a verified baseline/head or the exact acknowledged predecessor, never the local counter. Keep an unknown base unknown. A head response fetched outside the transaction is accepted only under its captured owner, requested generation and unchanged local observation revision. If it contradicts the bundle's recorded base, retain a conflict. A new key may use revision zero only after an authorized missing-head observation. Do not read the newest remote head and silently use its revision to overwrite an offline command derived from an older value. Deliberate reconciliation creates a new source command/bundle/UUID; it never changes an existing bound raw body. Only metadata is projected from opaque remote heads; importing their values into P2b needs a separate compatibility decision.

The one-at-a-time queue avoids inventing future server revisions for later unsent commands. Offline later commands remain durable unbound bundles. Their predecessor's receipt supplies the next expected revision if that predecessor is still current; a concurrent remote device may still cause a genuine CAS conflict. Preserve the complete bundle on conflict. Never split one accepted compound bundle to fit 128 records or 1 MiB: preflight export bounds in T1, or hold the whole explicitly unexportable bundle for recovery. No partial cloud success may stand in for its compound local operation.

**T3 — exact acknowledgment.** In one readwrite transaction read the stored raw intent and its bundle, validate the actual `{route,requestRaw,status,replyRaw}` with repaired J049, and persist the immutable receipt plus exact first successful raw reply. Mark precisely that bundle acknowledged. For each pending source row, clear its pending index only when scope, kind, ID, local revision and bundle link match the acknowledged binding; a newer row stays pending. Adjust counters only for rows actually cleared. Keep `states`, `commands`, `attempts`, `history`, source bundles and known wire receipts. An ACK never replays the engine transition or a UI achievement.

Update remote-head metadata only for the receipt's accepted generation and its exact record entries, never by treating a local high-water mark as acknowledgment of all older work. Keep observed `current` separate from the immutable receipt. An old replay remains valid historical persistence evidence after reset but must not become current-generation state. On current-generation advance, invalidate stale head knowledge and stop binding until reconciliation. Wrong receipt metadata, status207, unknown lookup, lost body, timeout, owner change or ACK quota/abort leave the prior pending state recoverable. A lost T3 completion notification is reconciled by rereading the durable receipt.

## Compound actions, reset and domain coverage

The fixed practice flow already composes the original transitions (`practice-flow.mjs:76–105`): start creates/patches one session and continuation; answer records attempt/review/mastery, patches session and continuation; checkpoint patches session/continuation; finish ends session and clears continuation; discard clears continuation only. Preserve each action as one T1 bundle and the entire supported subset as one J049 operation. Explicitly label continuation as local-only under the current server schema.

| Local domains | Current outbound mapping and barrier |
| --- | --- |
| `events`, `sessions`, `reviews`, `mastery` | attempts append; sessions/review/mastery put using complete original values. Scores, correctness and mastery remain provisional claims. |
| `continue`, `profile`, `settings`, `achievements`, `streak` | Local-only under current J049. Do not hide them inside an unrelated record kind or claim cross-device restoration. |
| `lesson_events`, `echs_math_complete`, `echs_math_bookmarks` | Not emitted by P2b changedRows. Completion/event/bookmark producer closure and an explicit authorized schema mapping are required; no invented lessons from viewing/reveal state. |
| `classes`, `assignments`, `submissions` | Retained local domains; no student-journal upload. Staff/parent role ownership and server assignment-result contracts remain separate. |

Names abbreviated above correspond to the exact 15 keys exported by `learning-transition.mjs:7`. Numeric/ID profiles differ: P2b `rowId()` can stringify a numeric alias; J049 requires every present identity alias to equal the string record ID. Validate the genuine row before committing export eligibility; do not silently rewrite IDs/aliases or numeric claims. Existing attempt/session display-window eviction is not a remote deletion. Only an explicit supported deletion command may emit a tombstone.

P2b `resetLearningData()` clears selected local domains according to `keepProfile`/`keepTeacher` (`learning-transition.mjs:203`) and deliberately retains pending records/history. It is not the server's fixed reset. The successor needs a distinct explicit reset bridge action; do not enable the old UI reset as an inferred remote wipe.

For the initial T1 implementation, preserve the original local reset behavior, retained pending data and immutable history, and record an explicit **unbound reset barrier**. It has no server-generation or server-policy interpretation. Later T2 reset policy requires separate review: resolve all earlier wire operations, retain their bundles/receipts, and verify current generation/owner revision before materializing any fixed reset envelope. Post-barrier local commands remain durable but unbound until that policy and the exact reset outcome are known. A reset CAS conflict retains local recovery; it must not silently retry a new reset against fresh state. An already bound pre-reset unknown operation must first resolve by exact replay; do not cancel it by assuming it did not commit.

After successful reset ACK, new mutable server heads begin at revision zero in generation g+1. Local command/row revisions continue increasing. Immutable attempts retain original identity and may return `existing` from an older generation; do not count them again. An offline second device with generation g must stop on conflict; changing its queued operation to g+1 or replaying old source values as new writes requires deliberate reconciliation. This is a proposed reset policy for the isolated bridge, not implemented behavior or a migration of existing P2b reset data.

## Exact caller/reader obligations before enabling any route

The evidence JSON rechecks the prior 35-path runtime ledger against current local files; it is a bounded literal scan, not a complete privacy inventory. All nine direct engine entries and the 45-entry/dynamic-script ledger still require release closure.

| Surface | Exact paths and required mapping |
| --- | --- |
| Candidate practice | `question-bank/js/mapped-practice.js` submit/checkpoint/answer/finish/start at22/25/1145/1177/1256 → `practice-actions.mjs` → captured handle commit. `practice-owner.js` captures the owner and reads completion projection; private/single-bank/global wrappers retain that handle and avoid the raw post-commit attempt patch. |
| Other attempt/session producers | `question-bank/js/bank.js:19`, `practice.js:26–39`, `exam.js:20–75`, plus `mapped-private-bank-practice.js` and `practice-single-bank.js`. Adapt their fixed compounds before enabling those pages; remove double legacy writes only within reviewed successor copies. |
| Profile/reset/review | `question-bank/js/dashboard.js:97–103` saveProfile/saveSettings/reset; `mistakes.js:10` markReviewResolved. Await local receipts and use explicit reset policy. |
| Local readers/export | `question-bank/js/{dashboard,learning-home,mistakes}.js`, `js/{gamification-overlay,smart-learning-route,platform-foundation}.js`. Read captured projections, preserve C02 formulas/provisional wording, clear on owner change; no raw fallback. |
| Remote student/family/staff readers | `question-bank/js/{student-cloud,parent,parent-cloud,teacher,teacher-cloud,teacher-evidence-heatmap}.js`. `teacher.js:7–12` additionally owns imported/local class/assignment/report writes. Remote APIs currently read legacy tables; adopted-owner route-aware read models are required before presenting journal progress. Never expose student journal state through another role's local account. |
| Completion/lesson boundary | `js/{portal,portal-access,lesson-access-guard,lesson-learning-bridge,unit-practice-unlock}.js`; AP Calculus/AP Precalculus/IB course-launch `data/lesson-0-engine.js`; IB units2/4/6 `assets/js/engine.js`; IB unit6 `data/lesson-6.1-v1-interactions.js` and `lesson-6.2-v1-interactions.js`. Preserve explicit completion/access distinctions and owner-bound writes. |
| Bootstrap/upload | Candidate `learning-system.js`, owned bootstrap/store/transport; `js/institution-client.js`, `js/institution-mastery-evidence.js`, `question-bank/js/sync-adapter.js`. Keep the existing five institutional hold guards and event suppression. Add a separate bounded status/raw-body transport; `institution-client.js:179–200` remains body-only and accepts207 for unrelated callers. |
| Entries/rollout | `index.html`, `question-bank/{index,dashboard,exam,mistakes,parent,practice,student,teacher}.html`; historical45-entry ledger, `sw.js`, dynamic script injection and `tools/inject_learning_access_guard.py`. Mixed old/new tabs must fail closed without attributing historical raw queues. |

The three legacy server writers remain `mastery-evidence/index.ts:300–308`, `institution-api/index.ts:808–812`, and `learning-sync/index.ts:33–37`. The whole-owner fence covers their attempts/sessions/reviews/completions/assignment-results/mastery side effects; journal persistence does not authorize bypassing it. Existing unadopted owners must retain their original behavior. No production owner adoption belongs in this browser transaction slice.

## Grading barriers and regression gate

J049 receipts require `grading_authoritative:false`; P2b C02 projectors force `verified_mastery:false`. A locally checked answer, provider trust tier, immutable stored attempt, synced session, remote receipt, lesson viewing or reveal state cannot enable certification, unlock content or create authoritative assignment results. Keep original practice math and raw claims. Do not call the legacy `recomputeMastery()` path as an ACK side effect or dispatch `echs:mastery-authority` from a journal receipt. A future C03 evaluator needs its separately authenticated grading/provider transaction and eligibility policy.

The next implementation must add native-browser regressions before any acceptance claim:

1. Abort at each T1 write boundary: no state without full source bundle, no bundle without local receipt; same command retry after lost completion preserves IDs and numeric outputs.
2. Two tabs answer against the same session; one full compound commit or exact conflict, no split attempt/session/review/mastery/continuation.
3. Multiple offline updates to the same record retain separate immutable bundles while the convenience pending row coalesces; reload reconstructs original grouping.
4. Two materializers bind the same bundle once; same UUID/body replay is stable; changing whitespace/value/generation or predecessor is rejected.
5. Unknown server head stays unbound; genuine missing head permits0; stale remote base conflicts without automatically rebasing/overwriting remote work.
6. Actual local revision differs from remote revision; every mutable put/delete uses its recorded expected server revision and current generation.
7. ACK of revision r preserves later r+1 source state/bundle; reverse notification order and repeat ACK retain the first raw receipt and exact counters.
8. First lookup collision, partial207, malformed/changed receipt, wrong index/kind/id/local revision, stale owner and raw numeric/string bytes all retain pending.
9. ACK write then native abort/quota leaves receipt/bundle/pending/cursor changes all rolled back; committed ACK with lost notification recovers on reload.
10. Reentrant authority capture, A→B→A, same account/new incarnation, revocation, expiry, versionchange, blocked open and missed cross-tab notification never send/ACK under a successor owner.
11. Reset waits behind unknown intent; lost reset ACK exact replay increments generation once; post-reset bundles cannot send early; conflict preserves local recovery.
12. Old-generation replay ACK after reset remains historical; old offline device cannot resurrect mutable heads; attempt duplicates keep original generation and are not counted twice.
13. Bounds at128 records/1MiB and local retained caps refuse/hold a whole bundle without truncation; aggregate pending hydration remains bounded.
14. Local-only/zero-row commands and display retention emit no fake empty request or tombstone; unsupported completion/staff/parent paths remain held.
15. Existing P2b flow65 comparisons, actions12, native atomic9, page24, client3 and baseline4 suites retain their original assertions. Adapt tests to successor interfaces without weakening the original engine comparison.
16. Connect the actual HTTP handler/client only after local proof, then verify PostgreSQL CAS/replay and exact raw/status identity across the whole chain. UI saved-local, pending-cloud and conflict states remain distinct. C03 stays false throughout.

No new integration tests were executed for this proposal. The existing 27 durable native groups and prior P2b reports prove their narrower components only. Readiness: sufficient to implement an isolated T1/T2/T3 candidate with synthetic authorized context; insufficient for active installation, owner adoption, complete C04, authoritative grading or production sync.
