# Isolated T3: retain exact receipts without losing newer learning

This fresh successor adds trusted delivery and native atomic acknowledgment to the accepted future-T1/first-T2 candidate. Its namespace is `echs-owned-learning-ack-candidate-v1`, database version 1. It does not migrate existing stores or connect an active page, production authority, real transport adapter, adoption or authoritative grading. No SQL, publication gate, lesson URL or Pages asset changes.

## Exact predecessor boundary

`T2_COPY_RECEIPT.json` preserves all 14 source files from frozen T2 manifest `34d4640a7fb9176ce93500bdc50ce9273b3be3791f99446e79a0282b92666968`. Original 61 predecessor case bodies remain intact, including the separately labeled pure numeric builder test. The original math, practice flow, held transport and all three J049 V3 modules remain byte-identical. The new wire/binding contracts explicitly use v2 because acknowledgment and retained resolution are new states. Source-bundle origins remain immutable. Every wire stores an exact source_origin context/generation/reset triple, checked against its binding as a separate cross-record anchor.

The earlier T2 native acceptance has a narrow cleanup-reentrancy addendum: its final observation-ticket abort could synchronously invalidate the owner yet return installed:true. Root's exact frozen counterexample is pinned separately. This successor rechecks current authority after observation and delivery cleanup. A transaction may already have legitimately committed under the old scope; the fix rejects the stale response and retains that evidence. It does not erase a successful transaction or move data between owners.

## Delivery boundary

`deliverNext({operation_id?})` requires an injected trusted `deliveryPort.deliver({route,requestRaw,signal})`. There is no default network port. An optional ID selects only a previously stored, fully validated immutable wire intent; the method accepts no caller raw request, receipt or verified flag. Without an ID, it materializes the next eligible complete source. It sends only route apply and the exact stored request/UUID.

The port is a trusted integration dependency, not a cryptographic receipt oracle. The test port returns synthetic native Responses with explicitly synthetic hashes. Parsing alone does not prove an arbitrary injected port contacted the server or sent the given bytes. Actual authenticated browser-to-J049 HTTP evidence remains a later gate.

Delivery captures the current full owner/session authority and exact immutable request before I/O. A per-delivery AbortController is linked to owner lifetime; the initial response and body share a ten-second deadline. Invalid native response type, redirects, status, content type/encoding/length, malformed/partial raw JSON and V3 protocol mismatches cannot ACK. Timeout/disposal cancels underlying reads and late bodies. No IndexedDB transaction spans network I/O. Current authority is checked again after cleanup to catch reentrant invalidation.

The unchanged V3 `acknowledgeIntent` validates the first exact apply response before opening the ACK transaction, and again against the currently stored wire inside it. Status207 and first lookup responses remain pending. Known immutable receipts may be replayed with a different current wrapper. They must not replace the first evidence, and a changed known receipt is rejected. Arbitrary consistent same-origin forgery is outside these structural integrity checks; production authority is not derived from a local receipt.

## One native ACK transaction

The transaction rereads and validates the source bundle, binding, immutable raw request, first-receipt state and owner. It uses all eleven stores with strict durability. It does not reject a delivery merely because a newer local command/row revision was committed during I/O.

Each current pending row must have its exact full-scope kind/key, revision, canonical row JSON and producer lineage. Its lineage must resolve to a matching immutable source/binding origin. A row at the acknowledged source revision is deleted only when its bytes and exact source bundle/index match. A valid later source revision stays pending. Equal-revision changed bytes, duplicate source revisions, invalid lineage or an older/missing row retain the pending operation and fail closed. Missing rows may need a later local reset/deletion policy; they are not automatically evidence of malicious activity.

After validation, the transaction charges the complete new retained evidence before issuing deletes. It stores the acknowledged pending-intent state and its canonical immutable receipt, the exact first route/request/status/raw reply, and the acknowledged binding. It advances exactly that queue position, clears only its own in-flight pointer, and subtracts only the pending rows/bytes actually deleted. Attempt stamps, history, command receipts, source bundles, contexts, producer lineage, engine state and provisional learning outputs remain unchanged.

Concurrent deliveries converge on one first evidence record and one counter transition. An acknowledged binding cannot re-enter an unprocessed queue, and a reused in-flight pointer must identify a bound wire at exactly the next queue revision. An already acknowledged operation is a separate idempotent branch; it validates the same immutable receipt and leaves the first raw response unchanged even if a newer wire is in flight. Completion loss is recovered by reading the retained exact receipt, without replaying local learning effects.

## Predecessor continuity and resets

A later wire resolves expected revisions once into its immutable `resolution` array. Each predecessor must be the exact acknowledged bundle/index/kind/key/local revision and original context/generation captured by the later source. Its raw request, source_origin anchor, first trusted apply evidence and immutable receipt are validated. Its own context must exist, match its generation, predate its command/rows and cover its direct missing-key bases even though earlier accepted CAS ancestry is terminal. The matching receipt record supplies only that record's revision. Current heads cannot substitute for missing evidence.

Reads of a pending wire rederive its captured resolution from immediate acknowledged predecessor witnesses. An acknowledged witness is terminal server-CAS evidence; the algorithm does not recursively re-prove all earlier accepted CAS steps. At most 128 immediate distinct predecessors plus the current wire are read, with aggregate serialized wire evidence bounded by the existing 32 MiB retained-wire budget. There is no 64-command lifetime limit. This is bounded structural continuity, not protection from a coherently forged local witness.

A valid historical receipt can report a later current reset generation. It remains historical delivery evidence, while a generation-block flag prevents future old-context materialization. First evidence is unchanged. A pending exact request may still be replayed to determine whether it was accepted; a conflict retains it. No remote reset or tombstone is emitted, no old unknown origin is rebound to new missing heads, and local keepProfile/keepTeacher flags are not translated into remote reset semantics.

## Storage, failure and evidence

All retained context/binding/lineage/wire bytes are charged as canonical UTF-8 serialization, including duplicate raw strings in wire, pending intent and first delivery. Wire and binding state transitions subtract the old exact representation and charge the new one in the same transaction. Existing count/byte limits and T1 source/history/engine bounds remain. The 32 MiB wire budget includes first replies and receipts. These logical budgets differ from physical disk quota; capacity or native transaction failure preserves the complete previous pending state.

Native tests use Chrome/Playwright, actual IndexedDB transactions and a loopback fixture with no unexpected external requests. Owner authority, observation/delivery ports and synthetic receipt hashes are explicitly labeled. The suite preserves original 61 cases and adds meaningful receipt, concurrency, local-newer-work, loss, corruption, cancellation, storage and long-sequence cases. A separate bounded adversarial suite checks queue/origin mutations and native ACK storage quota. Its positive quota override follows materialization and a write-free wait, to avoid treating cached quota allowance as exhaustion; it requires a real QuotaExceededError, complete rollback and successful exact retry after restoring quota. The source verifier binds the exact runtime/test bytes and predecessor pins. Developing failed reports, if any, remain diagnostics rather than acceptance evidence.

Run from the workspace root with fresh report filenames:

```powershell
node work/master-charter/c04-learning-ack-candidate/test_browser.mjs work/master-charter/c04-learning-ack-candidate/browser-review.json
node work/master-charter/c04-learning-ack-candidate/test_adversarial.mjs work/master-charter/c04-learning-ack-candidate/adversarial-review.json
python -X utf8 -B work/master-charter/c04-learning-ack-candidate/verify_candidate.py --report work/master-charter/c04-learning-ack-candidate/source-review.json
```

This candidate does not claim real browser-to-server HTTP acceptance, production authentication/adoption, full producer/reader rollout, reset/deletion reconciliation, retention compaction or authoritative grading. Rollback is leaving the fresh candidate unused; all accepted predecessor sources, databases and deployment paths remain intact.
