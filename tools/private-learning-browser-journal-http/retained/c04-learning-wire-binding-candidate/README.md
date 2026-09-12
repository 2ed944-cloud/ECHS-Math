# Future T1 origins and first T2 wire binding

This isolated successor captures a verified remote derivation context before future local commands and binds the first eligible complete source bundle to one immutable J049 request in the same native IndexedDB database. Transport remains held. No active page, server, database migration, adoption or authoritative grading path is connected.

## Provenance and isolation

`T1_V3_COPY_RECEIPT.json` preserves the original frozen T1 files and exact J049 V3 wire/contract/pending-intent copies. `COPY_RECEIPT.json` pins P2b sources and reference tests. The original transition, practice flow, held transport and all three copied J049 modules are byte-identical. All 29 T1 native case bodies and assertions remain intact. The frozen predecessors are untouched.

The new database is `echs-owned-learning-wire-binding-candidate-v1`, version 1. All keys include organization, account, incarnation and adoption epoch. Epoch 1 is the only accepted adoption epoch. It does not migrate any existing database or read legacy localStorage. Session expiry/revocation are current-authority checks, separate from persistent incarnation and server reset generation.

The eleven stores are `owners`, `records`, `attempts`, `states`, `commands`, `history`, `bundles`, `contexts`, `bindings`, `lineage`, and `wire`. Every read/write operation uses one transaction over that database. Strict durability, current-owner checks at native completion, reentrant capture/subscription protection, late-open disposal, blocked/version-change refusal, idle expiry and transaction abort behavior are retained from T1.

## Read-only remote observation

Opening requires the injected current-owner authority and optionally an injected trusted `observationPort.read({route, requestRaw, signal})`. There is no default network implementation. Installing context accepts only a list of up to eight supported mutable keys; callers cannot install a raw proof or authorize it with `verified: true`.

`installRemoteContext()` captures the full current identity, local command revision, row revision, sync serial and current context. The port must return native JSON Responses. Exact J049 V3 request and reply validation, status 200, response type/headers, byte limit, scope, generation and owner revision are checked. A ten-second ticket deadline and a per-ticket AbortController bound both initial response and body reads. Completion, timeout or lifetime invalidation aborts the ticket; late response bodies are cancelled. The final strict transaction checks the original identity and all captured local counters again.

State/heads/state observations must agree. An initial state/state observation proves universal absence only for generation 0 and owner revision 0. Otherwise an exact missing-head observation is required before a producer first touches those keys. Every head must have revision 0, deleted false and null value/hash. A nonzero/tombstoned head remains unaccepted; there is no remote-value import or reconciliation here. Verified additional missing-key contexts form a bounded immutable ancestry chain, never replacing a previously covered key.

The injected port is a trusted integration boundary. Parsing proves protocol consistency, not that an arbitrary caller-supplied port contacted the real server. Native tests use a synthetic port with actual Response/raw validation and synthetic owner authority. Actual authenticated HTTP evidence, redirects/session renewal and membership integration remain later gates.

## Future T1 atomic derivation

`prepare()` captures the current context ID, generation and reset barrier. `commit()` includes that origin in the immutable command fingerprint and atomically writes engine state, command receipt, attempt history/stamp, latest pending rows, exact source bundle, source binding, per-key lineage and owner accounting. It retains the original P2b calculations/results/effects.

A command prepared with no context stays unknown even if a context is installed before commit. A known prepared context must still be the active context. Existing unknown-origin bundles cannot be retroactively authorized from new heads: the offline-before-another-device-reset counterexample stays held even when the new generation has missing heads. A newly observed reset blocks further materialization without rewriting earlier origins. Reset and deletion candidates retain explicit barriers; `keepProfile`/`keepTeacher` are not mapped to remote resets.

Source rows retain their assigned canonical JSON string, kind/key and local revision. Command revision advances once per committed command; row revision advances once per changed row, monotonically across local resets for the full scope. Within-bundle revisions must strictly increase. Per-key lineage links to the exact earlier bundle/index/revision and its stored origin context/generation. An unknown or incompatible lineage cannot become a guessed CAS baseline.

These are structural consistency checks, not authentication of local data against arbitrary coordinated same-origin edits. A future T3 must validate exact source/receipt/latest-row linkage before clearing anything. Global uniqueness follows the serialized owner row counter for legitimate writes; this candidate does not claim a whole-history cryptographic proof against fabricated counters and source bundles.

## First T2 materialization

`materializeNext()` advances past only validated local-only sources with no outbound rows, reset barrier or deletion candidate. A corrupted local-only marker cannot skip a source. The first eligible complete source is bound once to a random operation UUID, exact raw body and exact pending-intent object. Native transaction serialization gives two tabs the same persisted binding. Reload/retry returns the known operation and bytes; no new request is derived from later engine state.

Only attempts with append semantics and mutable records with a captured missing-head proof can form this first operation. The maximum is 128 complete records, 64 KiB per raw value and 1 MiB for the raw request, followed by actual V3 validation. Oversized compounds are held whole; they are not split, dropped or rebased. A predecessor-derived source remains held for later T3 receipt continuity. Exactly one unresolved wire operation exists per owner; subsequent materialization returns it. There is no send, acknowledgment, clearing, adoption, cancellation or compaction API.

`wireIntent(id)` validates the source/binding and reconstructs the exact expected envelope. Its UUID, raw bytes and pending-intent body must agree. `bundleOrigin(id)` exposes the local derivation record, not an authority token. A local receipt, viewing/revealing a lesson, and this materialization cannot grant mastery or remote permission. Original provisional mastery remains provisional.

## Exact bytes and bounded retention

The builder splices each `value_json` token without parse/reserialize. The actual native T1 producer accepts only its JS-canonical finite-number JSON representation. It rejects noncanonical exponent or high-precision injected source tokens rather than normalizing them. The separately labeled pure-builder case proves preservation of arbitrary opaque numeric tokens through V3; it does not prove a native import path or PostgreSQL normalization/hash equality. Server-normalized SQL bounds may still reject a raw request accepted locally, which must remain pending under later transport work.

Owner accounting charges the complete canonical serialized context, binding, lineage and wire records, including scope/envelope fields and both copies of raw text in wire/pending-intent. Lineage replacement subtracts the previous exact serialized record; binding state changes charge their delta atomically. Context, binding, lineage and wire each have a 32 MiB retained application budget. Counts are 64 contexts, 50,000 bindings, 100,000 lineage keys and 50,000 wire records. Context records additionally retain an independently validated raw-observation byte count. These are deterministic logical UTF-8 budgets, not browser disk allocation or a substitute for native quota errors. There is no eviction when full.

T1 limits remain: 4 MiB per bundle, 32 MiB total source raw, 50,000 bundles, 1,000 removal candidates, and bounded source reads of 100 bundles/4 MiB. Original engine/history/pending-row limits also remain. Capacity or transaction failure retains the entire previous state.

## Verification and remaining gates

Run from the workspace root with fresh output filenames:

```powershell
node work/master-charter/c04-learning-wire-binding-candidate/test_browser.mjs work/master-charter/c04-learning-wire-binding-candidate/browser-review.json
python -X utf8 -B work/master-charter/c04-learning-wire-binding-candidate/verify_candidate.py --report work/master-charter/c04-learning-wire-binding-candidate/source-review.json
```

The browser harness uses installed Chrome/Playwright, a loopback-only fixture and a fresh native IndexedDB context per case. It records source hashes before and after, disallows unexpected network requests and reports page errors. IndexedDB is not mocked. Synthetic authority/read responses, metadata faults, complete-source bounds injection and pure-model inputs are explicitly labeled. Earlier developing runs are preserved and are not evidence for later source bytes.

This proves isolated future-T1 derivation and first T2 binding only. The proposed T3 acceptance cases are not implemented or counted as complete: exact trusted first-apply ACK provenance, atomic receipt/row clearing, preservation of newer revisions, predecessor progression and historical reset receipts remain separate work. Actual browser-to-J049 HTTP, production membership authority, reconciliation, reset/deletion policy, full page integration and authoritative grading remain unaccepted. There are no SQL migrations, Pages assets or active bootstrap changes. Rollback is leaving this fresh candidate unused; existing URLs, databases and frozen sources remain intact.
