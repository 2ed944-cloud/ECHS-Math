# T1: atomic local learning source bundles

Isolated successor to frozen P2b. This candidate adds an immutable source bundle to each successful local command in the **same native IndexedDB transaction** as its engine state, command receipt, attempt history/stamp and latest pending rows. Transport remains held. It is not installed in an active page and has no server, network, adoption, or authoritative grading path.

## Boundary and provenance

`COPY_RECEIPT.json` pins the four original P2b sources and four preserved reference tests. Only the copied `source/js/owned-learning-store.mjs` changes. The original transition, practice-flow and held-transport files remain byte-identical. Native tests compare actual original P2b and successor transitions using identical command inputs, clock and random seed. Reference tests are preserved, not relabeled as successor execution results.

The fresh namespace is `echs-owned-learning-source-bundles-candidate-v1`, schema version 1. It does not read or migrate the P2b database, legacy localStorage or production stores. Every primary key and owner index includes organization, account, incarnation and adoption epoch. Adoption epoch 1 is the only currently accepted epoch. Session identity and expiry are current-authority checks, not persistent incarnation or reset generation.

Opening requires an injected verified current-owner authority with `capture`, `verify` and `subscribe`. Its explicit identity includes the scope, active student role, revocation flag, session, epoch and expiry. Verification uses `echs.journal-owner-authority.v1`. The test adapter is synthetic; connecting canonical institution membership and server incarnation authority remains later work. A stored local receipt cannot replace that authority or adopt data.

## Transaction and source representation

The transaction includes all seven stores: `owners`, `records`, `attempts`, `states`, `commands`, `history`, `bundles`. The unchanged engine performs the compound practice action. Changed supported rows receive their local revisions; the bundle captures those **exact canonical row JSON strings and revisions before later commands can coalesce them**. The bundle and all local effects commit together with strict durability. Failure aborts the entire transaction. Success is returned only after native completion and a fresh owner check.

There are two local counters. Engine/command revision advances once per committed command. Row local revision advances once per changed pending row. Both remain monotonic for the full persistent scope, including across local resets. Neither is a server revision or reset generation.

`sourceBundle(localCommandId)` reads one immutable bundle with its matching command receipt. `sourceBundles({after_revision, limit})` reads bundles ordered by command revision, validates command linkage and owner accounting, and returns at most 100 bundles / 4 MiB of exact raw strings. The next cursor is the last returned bundle's revision. Unreturned bundles remain stored. Missing, malformed, noncanonical or inconsistently linked records fail closed. These are structural consistency checks, not cryptographic authentication against arbitrary same-origin database modification.

The wrapper contains scope, local command ID, command revision, raw UTF-8 byte count and exact canonical raw JSON. The raw payload contains:

- Local command fingerprint, method/action, time and seed.
- Changed local domain keys and whether each was put or removed.
- Supported changed row kind, ID, local revision and exact assigned row JSON.
- Explicit source-removal candidates with previous row JSON and reason.
- Unbound reset barrier and prior barrier ID, when applicable.
- `wire_state` and `grading_authoritative: false`.

The supported row kinds are attempts, sessions, review and provisional mastery. The `lessons` row source remains empty, as in P2b. Profile, settings, continuation, achievements, streak and the other local domains remain part of the atomic engine state; their changed keys are recorded in bundle coverage. This is not a full cross-device export of all 15 domains. A command with no supported records/removals/reset is explicitly `local-only`; its receipt and bundle still commit together. A command with supported source work is `unbound`, never wire-ready.

The bundle ID is the **local command ID**, not a newly invented server operation ID. The bundle does not contain guessed owner/record revisions, a remote baseline, J049 raw request, an ACK or a send permission. Reading/revealing a lesson and this local receipt do not certify mastery. Original provisional calculation outputs are retained; actual server grading and content/publication gates are outside this candidate.

## Deletions, resets and retention

Removing a source row creates a candidate, not a tombstone. The original 15,000-attempt and 1,000-session display windows remain unchanged. Window eviction is recorded as `source-window-removal`; it does not authorize deleting history or server records.

Local reset executes the unchanged P2b reset/initialization behavior, retains immutable attempt history, command receipts, pending rows and all earlier bundles, and stores an explicit **unbound reset barrier**. Later source bundles reference that barrier. Local `keepProfile` / `keepTeacher` options are retained exactly as local options; they are not translated into a remote reset. A later integration must resolve that semantic difference before sending anything across a reset barrier.

Bundles are append-only through this API. There is no clearing, cancellation, acknowledgment, compaction or eviction API. Bounds are 4 MiB per bundle, 32 MiB total bundle raw bytes, 50,000 bundles and 1,000 removal candidates per command, in addition to the original P2b bounds. Capacity refusal rolls back the whole proposed local command. Thus an oversized reset can be refused rather than partly applied. A future retention/compaction policy requires separate review.

## Lifecycle and validation

Authority changes, revocation, expiry, external abort, blocked opening, version change and storage failure fail closed. Expiry is checked during operations and by an idle timer. Reentrant subscription/capture invalidation is checked again before returning success. Late opening closes its database and cannot revive a disposed handle. Strict-durability refusal has installed transaction handlers before abort, so callers receive a settled failure.

Run from the workspace root:

```powershell
node work/master-charter/c04-learning-source-bundle-candidate/test_browser.mjs work/master-charter/c04-learning-source-bundle-candidate/browser-results-review.json
python -X utf8 -B work/master-charter/c04-learning-source-bundle-candidate/verify_candidate.py --report work/master-charter/c04-learning-source-bundle-candidate/source-check-review.json
```

Use fresh output names. The harness uses installed Playwright and Chrome, a loopback-only server and a new browser context/database per group. It captures original/candidate source hashes before and after execution. Native write-success/abort and completion hooks inject failures; IndexedDB itself is not mocked. The quota case verifies Chromium's actual quota override on a fresh owner before an earlier write can reserve cached quota. Window-boundary and capacity tests explicitly identify synthetic stored-state/metadata setup.

The first run's quota fixture did not force refusal and is preserved as a failed result. The second run exposed an unsettled strict-durability refusal and was interrupted; its diagnostic is preserved. These are not counted as passing acceptance evidence. The final report and source manifest identify the reviewed bytes and actual native results.

## Readiness

This is T1 only. T2 must atomically bind an immutable source bundle to one exact validated J049 envelope after verified server-head/predecessor knowledge, with one in-flight wire operation. T3 must store the exact validated ACK and only clear matching revisions in the same database transaction. The separately frozen durable-intent candidate remains a reviewed reference; no separate-database transaction is claimed to solve those compound atomicity requirements.

There are no SQL migrations, remote changes, Pages assets or active bootstrap changes. Rollback is leaving this isolated candidate unused; existing databases and frozen P2b remain intact. Production adoption, full-page integration, transport, reset policy and authoritative grading remain unaccepted.
