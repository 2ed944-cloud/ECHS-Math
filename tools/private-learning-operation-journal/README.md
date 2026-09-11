# Isolated operation journal / CAS / reset proof

This candidate is tooling only. No production migration, active Edge route,
browser importer, real account adoption, or authenticated grading is installed.
Original records, raw browser keys, active URLs, and current writers are untouched.
The SQL is not an API that an existing client can safely start using.

The reviewed design identity and complete 49-case mapping are retained in
`reviewed-checks.json`, with design-manifest SHA-256
`dd02c3fa2a7114f0e81afcd3b0e6de931119d9991e993f0c8c721b7117db422d`.
The SQL and actual journal test fixture are byte exact copies from the frozen
seven-file candidate manifest
`f777e16014893bff212019e919b8c6783d010b0fc44e15d365271cf4fcc7f9f0`.
`input-pins.json` binds the unchanged original 27 migrations, three writers,
three baseline fixture/test files, and all 12 released owner-fence sources.
The exact base is commit `318b65a92316b2b4377b775415bf061e8599601c`, tree
`a8954b5981cb232a288622424f233f59bfa9432f`. Twelve new tooling/workflow paths
plus those 45 unchanged prerequisites form the closed 57-source checkout.
Base/source identity is not a later test result.
The owner-fence SQL remains byte exact. The only alteration to an existing SQL
relation is an additive four-column UNIQUE constraint on the retained route,
needed by the full tenant/account/incarnation/epoch foreign key. Its effect on
locking requires the original 123 fence checks with this constraint installed.

## Implemented candidate contract

Five private, RLS-enabled relations store a serialized owner cursor, immutable
operation receipts, immutable attempts, immutable mutable-record versions, and
current version pointers. No table privileges are granted to PUBLIC, anon,
authenticated, or service_role. Receipt/attempt/version history cannot be updated,
deleted or truncated. Owner and head guards reject identity replacement, revision
rewinds, deletion and truncation. A pointer advance must reference the new operation
at the current owner revision and generation. The owner advance is checked against
that operation's exact new rows and byte charges.

The database-owner synthetic fixture alone inserts a route and then an all-zero
owner-state row. No RPC creates either. The four service-only functions receive
`(p_token_hash text, p_payload jsonb)` and authenticate a fresh, active student
session, independent of the service role's transport authority:

* `learning_journal_state`: exact empty payload; current binding and bounded limits.
* `learning_journal_apply`: closed commit or reset envelope from the pinned design.
* `learning_journal_operation`: lookup of this owner's immutable operation UUID.
* `learning_journal_heads`: at most eight explicit current-generation mutable keys.

All operate only at READ COMMITTED. Apply locks owner state FOR UPDATE; readers
use FOR SHARE. Nonlocking discovery derives which owner may be locked. Account
and exact captured session rows are then locked FOR SHARE using fresh statements,
with status, role, organization, session ID, token hash, revocation and wall-clock
expiry rechecked after waits. A revoked session waiting behind owner serialization
does not hold account/session locks that could prevent revocation. Once those
authority locks are held, later revocation waits for the transaction. This is
serialized authorization; it is not immediate revocation of an already authorized
transaction. Every return checks expiry and a five-second wall-clock budget.
The runner separately configures statement/lock deadlines before statements.

Ordinary compound commits use per-record expected revisions, allowing disjoint
keys to serialize without a false whole-owner conflict. Attempts append by stable
ID and complete normalized value. An identical attempt in a different new operation
is recognized as existing, retaining its original generation and revision 1; it
does not create another evidence event. Changed content conflicts atomically.
Mutable sessions, review items, lessons and mastery claims are complete replacements
or explicit tombstones. A missing record has revision 0; deleting it is a conflict.

Operation UUIDs cannot be reused with changed bodies, including after resets.
Exact retries compare normalized text AND SHA-256 after fresh authorization and
binding checks but before current-generation checks. They return the old immutable
receipt plus separate current context, without another write or quota charge.
`reset` additionally compares the owner revision, advances the generation once,
and retains every prior receipt, value and head. It does not resurrect old heads,
delete history, reset quotas or recreate immutable attempt IDs.

Receipts always say `grading_authoritative: false`. Values may retain claimed
`correct`, `verified`, timing, assistance and scores as private untrusted claims.
No trigger/function writes any of the six legacy learning tables, assignment
results, mastery certification, content permissions, or assessment provider state.

## Normalization, IDs and bounds

Identity for retry is the accepted closed JSONB envelope's PostgreSQL 15 `::text`
and SHA-256 of its UTF-8 bytes (`pg15-jsonb-text-v1`). It is not raw wire identity,
JCS, or universal JavaScript/SQL canonicalization. PostgreSQL may erase exponent
spelling (for example `1e0` becomes `1`) before this code sees a number. Envelope
integers are accepted only when normalized text is an unsigned decimal integer
within 9007199254740991. Payload numbers remain bounded provisional JSON claims.
Future HTTP must bound raw bytes and reject duplicate keys/lossy parsing itself.

Record IDs are strings, 1–256 UTF-16 units and at most 1024 UTF-8 bytes, without
C0/C1 controls. There is no Unicode normalization. At least one approved ID alias
must be present and every present alias must be a JSON string exactly equal to
the record ID. Null, numeric, or inconsistent aliases are rejected. A future source
adapter must explicitly convert numeric source IDs; current P1/P2 rows cannot be
blindly forwarded. Recursive credential/prototype-key exclusions follow the pinned
contract; this is not a general DLP or executable-content sanitizer.

SQL bounds are 128 record operations, 64 KiB normalized value, 1 MiB normalized
request/response, depth 24, 100,000 visited nodes, and eight heads per read. Retained
quotas are 50,000 operations, 50,000 attempts, 200,000 versions, 50,000 heads, and
256 MiB logical normalized data. Charge is exactly each new immutable request text
plus receipt text plus each newly retained attempt/version value text. A tombstone
charges normalized `null`; recognized attempts do not charge their old value again.
Head/SQL row/index/TOAST overhead is not included: this is not physical disk quota.
There is no pruning API or measured production capacity claim.

## Verification commands and evidence scope

From the repository root, install the pinned parser dependencies and run:

```bash
python -m pip install pglast==7.7 PyYAML==6.0.2
python tools/private-learning-operation-journal/test_local.py
python tools/private-learning-operation-journal/test_actions.py
python tools/private-learning-operation-journal/run_integration.py
```

The 14 source guards and 26 Actions guards execute offline. The default runner is
source preflight only. Parsing SQL/PLpgSQL is not executing PostgreSQL. These tests
record only successful test callbacks; an expected-label list is never execution
evidence. Missing `pglast` produces a serializable skipped-test diagnostic and an
incomplete result, not acceptance (JR1). CI requires every guard, with no skips.

The isolated Actions job first binds the real Git checkout, exact base and merge
parents, PR-head tree, all 57 source hashes/Git blobs, and running `postgres:15`
service image ID/digest. Checkout stores no Git credentials. Only `contents:read`
is granted. The disposable fixture password is local to that service; no deployed
credential, project secret, production URL or migration command is used. The job
installs the pinned driver and explicitly executes:

```bash
python -m pip install 'psycopg[binary]==3.2.9'
python tools/private-learning-operation-journal/run_integration.py --execute --checkout-report tools/private-learning-operation-journal/results/checkout.json
python tools/private-learning-operation-journal/assemble.py
```

Execution requires a fresh PostgreSQL 15 cluster and explicit
`ECHS_JOURNAL_MEMBERSHIP_DSN` / `ECHS_JOURNAL_BANK_DSN` environment values.
Both must use the same fixed loopback address and credentials. Database names must
begin `echs_membership_test_journal_` / `echs_bank_test_journal_`. Ambient `PG*`
overrides, arbitrary URLs/hosts, existing bank databases, existing fixture roles,
and nonempty starting application schemas are refused. DSNs are never printed or
copied into evidence. No driver, container or network is started on import/default.

The runner executes original membership 55, original archive 222, unchanged fence
123 and new journal 48 groups: 448 actual SQL outcomes if the run completes. J002
preservation executes last; J049 remains expressly deferred for future HTTP/client
acceptance. The unchanged archive setup receives the frozen fence followed by
this SQL immediately after byte-pinned migration 27. No SQL result is mocked or
rewritten. Original public rows, ACL/RLS, functions and triggers are checked across
installation. Row preservation hashes PostgreSQL `to_jsonb(t)::text` bytes with
length prefixes and duplicate rows retained. It does not decode numeric values
through Python floats; scale-only and precision-only changes remain detectable
(JR2). Source bytes and checkout provenance are rechecked before and after phases.

`results/run-<UUID>/` retains raw local diagnostics. The always-run assembler only
exports these eight bounded metadata JSON members to
`$RUNNER_TEMP/private-learning-operation-journal-evidence`:

* `checkout.json`: real checkout, service image and 57-source binding.
* `input-pins.json`: exact base and unchanged 45-source contract.
* `local-results.json`: actual 14 offline source-guard outcomes.
* `actions-results.json`: actual 26 offline Actions-guard outcomes.
* `acceptance.json`: actual 123 fence and 48 journal outcomes and preservation.
* `membership-baseline.json`: original 55 actual outcomes.
* `archive-with-fence-and-journal.json`: original 222 actual outcomes.
* `artifact-index.json`: exact member hashes, counts and scope flags.

The assembler validates exact labels (including historical duplicate labels),
typed flags, original migration hashes, raw report hashes and source closure.
Reports must agree on the tested checkout and PostgreSQL version. Final copies,
source inputs and the closed eight-member set are rechecked at the exclusive
index write. A late change/write failure removes only the index created by that
invocation. Incomplete runs can retain a clearly failed metadata index; no raw
SQL logs, row payloads, credentials or expected-only results become acceptance.
Synthetic successful assembler fixtures exist only in temporary test directories;
they never establish actual SQL/Actions acceptance.

At preparation time actual PostgreSQL execution remains pending. A later passing
artifact must be independently bound to the real GitHub run/job/artifact and final
source tree before being reported as executed. This package adds no release
collector or deployment behavior. Tooling paths and `.github` remain excluded from
public Pages output by the existing build.

The SQL guards protect normal caller paths. The tested privileged fault injections
cover raises, suppressed writes and exact-text rewrites. They do not claim resilience
to arbitrary schema-owner modifications such as an AFTER trigger inserting extra
rows after usage validation.

## Gates still pending

Actual PostgreSQL execution and independent race review remain pending until
recorded separately. Current browser snapshots lack a durable sent-operation and
server-revision bridge and cannot serve as this protocol. True HTTP status handling,
lost-ack UI, remote reset policy, all producer/reader/bootstrap closure, baseline
adoption, role coverage, authenticated grading, retention and production rollout
are separate gates. SQL receipts become durable only when the outer transaction
actually commits; a future service must wait for that success and retain the real
HTTP status. No parsed body may be manufactured into status 200, and 207 must not
cause broad queue deletion.
