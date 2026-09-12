# T2 proposal: bind future source bundles without inventing their remote baseline

Status: **proposal for review; no implementation or new execution claim**. Frozen T1 is unchanged. Its local transaction proof is accepted; that does not establish a remote derivation context for its existing bundles.

## Decision and source boundary

Recommend a fresh isolated successor that installs verified remote context **before future T1 commands**, captures immutable derivation references in their T1 transaction, and materializes one complete J049 intent at a time. Existing T1 bundles have no captured server generation or baseline. They remain `held_unknown_origin`, including when a later remote head is missing. No retrofit, automatic rebase, queue skipping or inferred reconciliation is allowed.

The required counterexample is an offline T1 command, then another device resets generation g to g+1. A subsequent missing head in g+1 is real, but attaching g+1 and expected revision 0 to the old command resurrects pre-reset work. CAS 0 does not prevent that. Future bundles retain their original g; SQL rejects a new operation in g after the reset. Exact replay of an operation already accepted in g remains historical evidence and cannot authorize new g+1 work.

Sources inspected:

| Frozen source | Evidence used |
| --- | --- |
| T1 `source-manifest-v1.json`, SHA `1497ab6384d016be37af7d52eb451d7693ba54a46009e9e7940829b7b0478b66` | Store `source/js/owned-learning-store.mjs:196–224` assigns global scope-local row revisions; `:360–380` captures rows and reset barrier but no server context; `:415–465` commits all local effects together. |
| J049 V3 `source-manifest.json`, SHA `84284f19b00a26b8ee30ed2567132b7913e0a0c8e5cb7c80e4167f62d778445c` | `contract.mjs:13–42` exact raw/protocol rules; `:45–85` receipt/current/head contracts; `pending-intent.mjs:24–41` exact-apply first ACK; `handler.mjs:9` PT409 → HTTP409 and `:64–84` raw forwarding. V3 changes conflict handling; its contract/wire/pending files retain the reviewed V2 bytes. |
| V3-pinned SQL `c04-journal-pg-matrix-candidate-v2/source/tools/private-learning-operation-journal/operation-journal.sql`, SHA `9ce98da90d5c141fdf184d32a00067eca1aaa800870204edd9c383cc22b1e1bf` | State `:325–333`; heads `:349–376`; exact normalized operation replay before generation rejection `:420–426`; mutable record CAS `:444–447`; immutable receipt/owner revision `:459–469,502–511`. |
| Frozen durable intent manifest SHA `f449d38c6dbf32f29162b327078966076a4afaf24ca39b93909f8c11934685fd` | Native strict transactions, first raw apply ACK, exact known receipt retention, lifecycle and quota patterns. Its separate database is not used to claim compound atomicity. |

The paths above are under `work/master-charter`. This proposal uses the exact V3 protocol, not a remembered or expanded wire schema. No SQL, publication, mastery, curriculum, legacy bootstrap or active page change is proposed here.

## Installing context before local derivation

Context installation is a separate native transaction, completed before the eligible local command. It does not import remote values or grant owner/adoption permission. The independently injected current-owner authority must already verify the active student session and `(organization_id, account_id, incarnation_id, adoption_epoch=1)`. An ordinary caller-supplied object with `verified:true`, an old context row or a receipt is insufficient.

The trusted observation port produces an in-memory ticket capturing the exact scope/session, owner-authority epoch, local command revision, local row sequence, synchronization serial, requested generation/keys and monotonic request deadline. It fetches the exact V3 routes with status/raw-body access, redirect rejection, bounded headers/body and cancellation. Only a genuine status200 response passing `parseProtocolWire` and `validateReply` may propose context. Tokens stay in the live request path and are never stored in context or tickets.

Installation rechecks authority and all captured local counters, current context, reset barrier and in-flight pointer in the same strict transaction. Tickets expire within the existing ten-second read deadline and cannot be restored from a database row after reload. Late, out-of-order, owner-switched or locally stale observations are discarded without changing any bundle. A synchronization serial is monotonic across all install/materialize/ACK transitions and prevents an ABA match. Before/after `state` responses and every bounded `heads` page must agree on generation and owner revision when combining observations; changing remote state causes a fresh observation attempt before any local derivation.

There are two narrowly safe initial baselines:

1. **Empty owner:** verified `state` reports generation0 / owner_revision0, the local supported projection and queue have no prior outbound/unknown/reset work, and only local-only initialization/settings/profile commands may precede the install. Under the pinned SQL, an owner begins at revision0 and each operation/record transition requires the retained operation and next owner revision (`SQL:98–121,145–155`). This establishes missing mutable heads at that observation, including keys first used offline later. A remote write after observation still makes expected_revision0 conflict. This is an explicit empty-state proof, not “a new-looking local key means remote zero.”
2. **Specific missing keys:** verified state plus `heads` in the same observed generation/owner revision reports each requested key as `{revision:0, deleted:false, value:null, value_sha256:null}`. Install only before the first local producer for each key, with no local preimage or earlier source lineage for that key. A new context may add such absent-key coverage; it cannot replace an existing key's baseline. Read at most eight keys per V3 request. Other keys remain unknown. Nonzero/deleted remote heads are retained informationally and require an explicit reconciliation/import design before they can be a local derivation baseline.

Unknown-origin outbound work or any unresolved reset barrier blocks initial activation. Later absence is never attached to that old work. If context cannot be installed before a future command, local saving still works, but its derivation is permanently recorded as unknown and its outbound queue stays held. This conservative limit preserves offline work without claiming that every offline bundle can later be sent automatically.

No observer can certify that the server remains unchanged after a read. Safety comes from the captured generation and immutable expected revision used by SQL CAS. Time freshness only guards installation races; aging does not permit replacing a captured baseline with the newest remote value.

## Proposed local schema and immutable derivation

Use a fresh isolated database namespace, preserving frozen T1 and its seven stores. Every new primary/foreign scope includes organization/account/incarnation/adoption. All objects use closed key sets, safe protocol integers and bounded UTF-8 raw strings. Schema names below are proposed internal names; none changes J049.

| Addition | Closed record and transition role |
| --- | --- |
| `remote_contexts`, key `(scope, context_id)` | Immutable `{contract, scope, context_id, parent_context_id, reset_generation, observed_owner_revision, installed_after_command_revision, installed_row_sequence, installed_sync_serial, coverage, observations}`. `coverage` is `all_mutable_missing` backed by the empty-owner proof, or explicit missing keys backed by exact request/reply observations. Observations contain route, requestRaw, status200, replyRaw and capture counters; no credentials. A parent may add keys in the same generation without revising earlier coverage. No arbitrary nonzero-head adoption mode in this slice. |
| `bundle_bindings`, key `(scope, bundle_id)` | Immutable origin `{context_id or null, reset_generation or null, command_revision, row_bases, prior_reset_barrier_id}` captured by **future T1**, plus separate lifecycle fields `{state, wire_operation_id or null, hold_reason or null}`. `row_bases` is ordered exactly like immutable bundle records; each mutable record references a missing-head proof, an exact earlier local producer, or `unknown`. State may become bound/acknowledged/held; origin never changes. Legacy bundles without a row are interpreted as unknown, not upgraded in place. |
| `record_lineage`, key `(scope, kind, record_id)` | Retained `{bundle_id, source_record_index, local_revision, context_id, reset_generation}` for the most recent local producer. Updated atomically by future T1; retained when a pending convenience row is later cleared. It supports bounded predecessor lookup. It is neither a server head nor authority to ACK anything. |
| `wire_intents`, key `(scope, operation_id)`, unique bundle binding | `{contract, scope, operation_id, bundle_id, exact_raw, raw_bytes, pending_intent, first_ack or null}`. The request string, bundle/context mapping and UUID are immutable once stored. `pending_intent` must be the V3 `createPendingIntent(exact_raw,scope)` shape. T3 later owns its validated transition and first exact reply retention. |
| Scoped owner metadata extension | `{active_context_id, sync_serial, queue_cursor, in_flight_operation_id, blocked_at_bundle_id}` plus bounded counts/bytes. One unresolved intent maximum. Existing row and command counters remain distinct and monotonic. Local-only commands advance an explicit no-wire disposition; unknown/conflicting/overbound/reset work is a queue barrier. |

Future T1 reads the active context and per-key lineage while committing its original engine transition. For each assigned mutable row, capture either a genuinely missing initial base (`expected_revision=0` with proof ID), or `{predecessor_bundle_id, predecessor_record_index, predecessor_local_revision}`. The latter is a dependency, **not** an invented future server revision. Unknown coverage remains unknown. An attempt is an append under the captured generation and has no expected_revision. Preserve original provisional calculations and exact assigned `value_json`; do not synthesize `lessons` rows or mutate aliases.

T1 writes the derivation row and lineage in its existing compound transaction. Capturing context in a later T2 transaction is too late. All original data/result/effect comparison tests remain required. The prepared command captures the active context ID/generation and reset-barrier identity alongside its existing local expected revision. A changed context or barrier rejects that prepared command; it must not receive a replacement baseline. A command prepared with no context may save only with an explicitly unknown origin, even if context becomes available later. An unrelated ACK can update synchronization serial/receipt state without changing that captured context or last-local-producer pointer; T1 reads those dependency records afresh inside its transaction.

## Materialization transaction

`materializeNext()` obtains a bounded snapshot of the queue's earliest unresolved bundle, immutable derivation, current owner authority, predecessor receipts and synchronization serial. It does not read the latest projection to reconstruct values. Pure synchronous construction is permitted; any random UUID generation or optional byte hashing occurs outside a live IndexedDB transaction.

Within one strict readwrite transaction:

1. Recheck current authority, source bytes, captured synchronization state, queue position and reset barrier. If another tab already bound this exact bundle, return its stored UUID/raw body. If another bundle is in flight, return held; do not create a second operation. A losing tab's unused proposed UUID is never sent or persisted as a second mapping.
2. Reject unknown origin, missing key coverage, any unresolved earlier wire operation, explicit local reset barrier, or any deletion candidate. Even `source-window-removal` is not a tombstone. Do not omit a removal candidate and publish the remaining part of a compound. Existing reset flags and options have no remote mapping.
3. Resolve every mutable expected_revision from its captured missing proof or **the exact acknowledged predecessor record receipt**. Follow the captured bundle/index/kind/id/local_revision tuple; require the same captured generation, a committed matching receipt and a known immutable operation mapping. Do not query a newer head and substitute its revision. If a predecessor is pending/held or has no acknowledged receipt, retain the whole dependency.
4. Preserve the bundle's ordered complete supported record set in one J049 commit. It must contain 1–128 records. Build protocol metadata canonically but splice each exact `value_json` as the `value` token; do not parse/reserialize opaque values. Apply V3 raw/protocol/request validation to the finished body. The body may not exceed 1 MiB; each source value may not exceed 64 KiB. Any failed identity/alias/bound check holds the complete source bundle with no split, truncation, partial publish or empty operation.
5. Store the exact pending intent, immutable bundle mapping, byte accounting and owner in-flight pointer atomically. Return sendable data only after native completion and a fresh owner check. This slice initially keeps the external transport held; persistence is not a network permission.

J049 separately caps **PostgreSQL-normalized** request/value bytes. A raw JavaScript byte count cannot assert the exact normalized size for arbitrary numeric lexemes. Client limits are necessary preflight, and SQL remains authoritative. If normalized expansion or retained server capacity causes HTTP413, keep the exact bound operation and hold the whole compound; never retry smaller pieces. A future conservative normalized-size estimator must be separately proved and must not rewrite raw values.

Once bound, changing any whitespace, ID, opaque number, record order, generation, expected revision or predecessor is forbidden. Retry uses the stored exact body/UUID. Source lookup or another tab cannot generate a fresh request for a known binding. The local command ID remains distinct from the transport operation UUID.

## Predecessor ACK continuity and later T3 boundary

A local command revision, scope-global row revision, server owner revision, server record revision and reset generation are distinct. A commit has no expected_owner_revision field; that field belongs only to the separate J049 reset request. Do not invent a requirement that unrelated remote operations leave consecutive owner revisions for this device. Instead, each dependent mutable row uses the exact server record revision from its captured predecessor receipt. A concurrent device changing that row makes SQL CAS fail; unrelated owner activity does not authorize rebasing it.

`receipt` and reply `current` stay separate. A replayed old-generation receipt may confirm historical persistence. If `current.reset_generation` has advanced, retain that receipt and block subsequent materialization under the old context; never convert it to current-generation data. Same-generation newer current owner revision is observation of other work, not permission to replace any captured expected record revision. Any observed head contradiction remains a conflict.

T3 must be present and independently tested before the queue can progress beyond its first unresolved intent. It must use V3 `acknowledgeIntent` with the actual route/requestRaw/status/replyRaw and current scope. First lookup is informational; only exact raw apply success/replay can establish the first ACK. Status207, missing lookup, malformed/colliding receipt, changed known receipt or non-200 response cannot clear the queue. V3 PT409 is a nonretryable conflict; automatic retries must not refresh heads, change UUID, change generation or clear the in-flight pointer. An explicit reconciliation design, still absent, is required to resolve that barrier.

The current latest-row schema needs **no new bundle-ID field for T3 matching**. T1 assigns every changed row a unique increasing `owners.revision` in one scoped transaction (`store:208`); resets never reset that counter or delete retained pending/history. Thus `(full scope, kind, record_id, local_revision)` identifies the assigned source row. T3 additionally compares its exact stored row JSON/bytes with the immutable bound bundle entry before clearing it. A newer revision remains pending. An equal revision with different value/kind/ID or duplicate local revision is corruption and fails closed. Retained `record_lineage` is only a predecessor index; it does not replace this proof. Deletion candidates lack an assigned deletion revision and remain held until an explicit future deletion producer/policy is reviewed.

T3 atomically persists first exact successful reply/status and immutable receipt, marks exactly one bundle acknowledged, adjusts only matching pending counters and clears the matching owner in-flight pointer. Keep source bundles, original command receipts, history, attempt identity and later revisions. A local receipt cannot certify grading, unlock lessons, dispatch authority events, recompute authoritative mastery or grant remote/adoption permission.

## Failure, reset and storage rules

No lease or notification is a correctness dependency. Two tabs serialize on the same stores; reload reconstructs the exact binding/in-flight pointer from durable state. Lost T2 completion is resolved by lookup, never a new UUID; a transaction abort/quota failure leaves no partial binding. Lost network reply retains the intent for exact apply replay. Lost T3 completion rereads the already committed first receipt.

Carry forward T1's strict durability handler ordering, reentrant capture/subscription checks, expiry timer, late-open closure, external abort, versionchange and blocked/quota failure. Validate authority at start, callbacks and completion. Bound metadata scans by records and aggregate bytes; refuse new context/bindings when capacity is exhausted, preserve all existing evidence. Proposed initial evidence budget is 32 MiB per scope with at most 64 context records; each response is independently bounded by V3. No eviction/compaction is proposed. Tickets are ephemeral; persisted accepted context remains historical derivation evidence after reload, but does not bypass a fresh authority verification.

All existing unbound reset barriers remain held, as do post-barrier bundles. This T2 slice emits no reset body and no tombstones. Another device's reset invalidates current generation eligibility. A future reset integration must first resolve earlier unknown operations, explicitly authorize the server reset semantics, retain the exact reset intent/receipt and establish new-generation derivation before later commands. It cannot map local `keepProfile`/`keepTeacher` flags to remote behavior.

## Proposed acceptance cases

Run native IndexedDB tests in a new successor, preserve T1's exact original-transition comparisons, and keep synthetic observation/ACK fixtures clearly distinguished from actual server evidence.

| Case | Required outcome |
| --- | --- |
| Offline old bundle; another device resets; new-generation head missing | Old bundle stays unknown/held; no operation created and no retroactive context row. |
| Context installation before/after a local command, ACK, owner change, expiry, timeout or out-of-order reply | Only the unchanged captured ticket may install; no ABA or post-reload ticket reuse. |
| Empty-owner proof vs “new local ID”; genuine missing head vs nonzero/deleted/partial/foreign reply | Only captured verified absence permits0. Nonzero heads are never auto-adopted. |
| Add coverage for a key already locally produced or previously covered | Reject replacement. Existing derivation/expected revision unchanged. |
| Future T1 with known, unknown and changed prepared context | Atomic context/lineage capture or explicit unknown/conflict; original engine outputs preserved. |
| First bundle then multiple offline updates to same key | Later bundles retain exact predecessor references; no guessed server revisions or coalesced source loss. |
| Two concurrent materializers; same or different bundle; lost completion/reload | One persistent operation mapping and one owner in-flight intent; exact raw retry stable. |
| Pending/held predecessor, wrong receipt index/kind/ID/local revision/generation, historical reset replay | Whole dependent bundle remains held. Known exact predecessor supplies only its matching revision. |
| Remote changes same key after initial missing proof/predecessor ACK | Original expected revision retained; actual SQL conflict, no newest-head overwrite. |
| Actual 128/129 record and 1 MiB/overbound UTF-8 bodies; SQL normalized expansion | Complete operation or complete hold; no split, truncation or count manipulation. |
| Opaque exponent/high-precision numbers, non-ASCII IDs, string escapes, duplicate keys and conflicting aliases | Valid original value bytes unchanged; invalid protocol rejected. No binary64 round-trip or local imitation of JSONB receipt hash. |
| Reset/window removal candidate combined with otherwise valid records | Entire compound remains held; no inferred delete or partial append. |
| PT409/HTTP409, HTTP413/207, timeout, invalid body, first lookup collision | Retain exact in-flight body/UUID and source; no automatic reset/rebase/new UUID. |
| T2 or later T3 abort/quota at every write; owner switch during completion | All participating stores roll back or recover the exact known committed result; stale observer cannot report success. |
| ACK for row r with latest r+1, corrupt same-r value, duplicate ACK/notification loss | Preserve r+1; corrupt same-r fails closed; no duplicate counters/events or lost receipt. |
| Local-only commands and authoritative grading/publication checks | No empty wire body, mastery certification, teacher data, publication-gate change or active rollout. |

T2 implementation is not authorized by this document itself. Await root review of the context-install/derivation and queue rules. The next bounded implementation can prove future T1 capture plus first T2 materialization with synthetic trusted observations; T3 and actual HTTP/PostgreSQL integration remain separately gated. No part of this proposal closes whole C04 or makes frozen T1's existing unknown-origin bundles remotely eligible.
