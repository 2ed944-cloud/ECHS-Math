# Isolated operation journal / CAS / reset proof

This candidate is tooling only. No production migration, active Edge route,
browser importer, real account adoption, or authenticated grading is installed.
Original records, raw browser keys, active URLs, and current writers are untouched.
The SQL is not an API that an existing client can safely start using.

The reviewed design identity and complete 49-case mapping are retained in
`reviewed-checks.json`, with design-manifest SHA-256
`dd02c3fa2a7114f0e81afcd3b0e6de931119d9991e993f0c8c721b7117db422d`.
The original seven-file candidate manifest remains
`f777e16014893bff212019e919b8c6783d010b0fc44e15d365271cf4fcc7f9f0`.
PR374 verified all 448 outcomes on PostgreSQL 15.19 in run 34651122721
(artifact 10283697552). Its prior failed run and the narrow local-variable repair
remain preserved. Matrix V1 retained the accepted SQL at
`ac3ad94dce3d89b3e32594b9fd01593a266738abb66cbb8f3c2d72ca597b075e`.
This separate V2 changes exactly five deliberate domain-conflict error-code
literals from `40001` to `PT409`, producing SQL SHA-256
`9ce98da90d5c141fdf184d32a00067eca1aaa800870204edd9c383cc22b1e1bf`.
The 48-case fixture changes exactly twelve corresponding expected-code literals.
All 48 journal labels, 123 fence labels and substantive test assertions remain.

Real HTTP V3 run 34656604117 failed S05 on both majors with observed statuses
`[200,504]` instead of `[200,409]`. The first four groups passed and cleanup
completed; the losing request ended at the native deadline without a completed
upstream response. Pinned PostgREST14.17 uses Hasql1.1.0.1, whose source retries
`40001`; the observations are consistent with this mechanism. Retry counts were
not instrumented. `PT409` expresses the intended domain conflict as HTTP409
without treating it as a retryable database serialization failure. The separate
`domain_conflict_repair` record binds both failed artifacts and the exact inverse
source diff. No SQL condition, lock, statement, API privilege or test case is
removed. Fresh actual SQL and HTTP execution are still required.

The membership/archive entrypoints now take `--postgres-major 15|17`, defaulting
to 15. The journal fixture takes an explicit `expected_major` keyword, also
with default 15. Those setup guards compare the actual server major with the
configured job; accepting either major globally would be insufficient. Only
setup/report wording changes accompany these parameters. Three exact, reversible
source-diff descriptions in `reviewed-checks.json` prove that the case bodies were
not otherwise changed. The complete journal fixture file is therefore no longer
byte identical to its predecessor. The later PT409 expected-code change is
audited separately by reversing only its twelve literal replacements in memory.
These inversions verify source provenance; the runner executes the actual pinned
PT409 SQL bytes and the actual updated fixture without rewriting either.

The matrix was motivated by one verified, read-only production metadata response:
PostgreSQL 17.6.1.147, rather than the PostgreSQL 15.19 used in the prior proof.
This is evidence to test compatibility, not an assumption that majors are equivalent.
`input-pins.json` binds 27 original migrations, three writers, three baseline
fixture/test files and 12 owner-fence sources. Its source-baseline provenance is
commit `f6ba511d95cd7e7f9f581f2267e34173da62c994`, tree
`def57c0d11e27876c51fb964a4b05388b5d97556`. Twelve journal tooling/workflow
paths plus 45 pinned dependencies form the same closed 57-source checkout.
Each run verifies that the historical source baseline is an ancestor and
separately binds the actual PR base, merge parents, changed paths, HEAD tree,
PR-head commit and every source Git blob. An advanced base may legitimately
make the tested merge tree differ from the PR-head tree. A historical whole-PR diff is not used as
an authorization boundary for later reviewed dependency changes.

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

The SQL retains the accepted JSONB `::text` and UTF-8 SHA-256 retry contract
(`pg15-jsonb-text-v1`). The identifier is historical and remains unchanged.
PostgreSQL17 execution must verify the same existing normalization vectors;
this does not claim universal normalization equivalence across major versions. It is not raw wire identity,
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

The 14 source guards and 30 Actions guards execute offline. The default runner is
source preflight only. Parsing SQL/PLpgSQL is not executing PostgreSQL. These tests
record only successful test callbacks; an expected-label list is never execution
evidence. Missing `pglast` produces a serializable skipped-test diagnostic and an
incomplete result, not acceptance (JR1). CI requires every guard, with no skips.

Two isolated Actions matrix jobs select PostgreSQL15 and PostgreSQL17 explicitly.
Each binds the real Git checkout, historical baseline ancestry, actual base and merge parents, PR-head commit,
all 57 source hashes/Git blobs, and its running `postgres:15` or `postgres:17`
service image ID/digest. The jobs have separate databases and artifact names. Checkout stores no Git credentials. Only `contents:read`
is granted. The disposable fixture password is local to that service; no deployed
credential, project secret, production URL or migration command is used. The job
installs the pinned driver and explicitly executes:

```bash
python -m pip install 'psycopg[binary]==3.2.9'
python tools/private-learning-operation-journal/run_integration.py --postgres-major 17 --execute --checkout-report tools/private-learning-operation-journal/results/checkout.json
python tools/private-learning-operation-journal/assemble.py --postgres-major 17
```

Use `--postgres-major 15` for the other matrix job. Each execution requires a
fresh cluster of the selected exact major and explicit
`ECHS_JOURNAL_MEMBERSHIP_DSN` / `ECHS_JOURNAL_BANK_DSN` environment values.
Both must use the same fixed loopback address and credentials. Database names must
begin `echs_membership_test_journal_` / `echs_bank_test_journal_`. Ambient `PG*`
overrides, arbitrary URLs/hosts, existing bank databases, existing fixture roles,
and nonempty starting application schemas are refused. DSNs are never printed or
copied into evidence. No driver, container or network is started on import/default.

The runner executes original membership 55, original archive 222, unchanged fence
123 and new journal 48 groups: 448 actual SQL outcomes if the run completes. J002
preservation executes last; J049 remains expressly deferred for future HTTP/client
acceptance. The parameterized archive setup receives the unchanged fence followed by
this SQL immediately after byte-pinned migration 27. No SQL result is mocked or
rewritten. Original public rows, ACL/RLS, functions and triggers are checked across
installation. Row preservation hashes PostgreSQL `to_jsonb(t)::text` bytes with
length prefixes and duplicate rows retained. It does not decode numeric values
through Python floats; scale-only and precision-only changes remain detectable
(JR2). Source bytes and checkout provenance are rechecked before and after phases.

`results/run-<UUID>/` retains raw local diagnostics. The always-run assembler only
exports these eight bounded metadata JSON members to
`$RUNNER_TEMP/private-learning-operation-journal-evidence-pg15` or `-pg17`:

* `checkout.json`: real checkout, service image and 57-source binding.
* `input-pins.json`: historical source-baseline provenance and current 45-source pins.
* `local-results.json`: actual 14 offline source-guard outcomes.
* `actions-results.json`: actual 30 offline Actions-guard outcomes, including an actual local Git graph with an advanced base and a rejected nonancestor baseline.
* `acceptance.json`: actual 123 fence and 48 journal outcomes and preservation.
* `membership-baseline.json`: original 55 actual outcomes.
* `archive-with-fence-and-journal.json`: original 222 actual outcomes.
* `artifact-index.json`: exact member hashes, counts, selected/actual version, image and scope flags.

The assembler validates exact labels (including historical duplicate labels),
typed flags, original migration hashes, raw report hashes and source closure.
Reports must agree on the tested checkout and PostgreSQL version. Final copies,
source inputs and the closed eight-member set are rechecked at the exclusive
index write. A late change/write failure removes only the index created by that
invocation. Incomplete runs can retain a clearly failed metadata index; no raw
SQL logs, row payloads, credentials or expected-only results become acceptance.
Synthetic successful assembler fixtures exist only in temporary test directories;
they never establish actual SQL/Actions acceptance.

The prior PostgreSQL15 proof remains preserved. Both new matrix jobs must complete
all 448 outcomes independently; one cannot stand in for the other. A passing
artifact must be independently bound to the real GitHub run/job/artifact and final
source tree before being reported as executed. This package adds no release
collector or deployment behavior. Tooling paths and `.github` remain excluded from
public Pages output by the existing build.

The SQL guards protect normal caller paths. The tested privileged fault injections
cover raises, suppressed writes and exact-text rewrites. They do not claim resilience
to arbitrary schema-owner modifications such as an AFTER trigger inserting extra
rows after usage validation.

## Gates still pending

Actual execution of both current matrix jobs and independent review of their
artifacts remain pending until recorded separately. A generic PostgreSQL17 image
is not proof of the hosted Supabase variant, extensions, configuration or resources. Current browser snapshots lack a durable sent-operation and
server-revision bridge and cannot serve as this protocol. True HTTP status handling,
lost-ack UI, remote reset policy, all producer/reader/bootstrap closure, baseline
adoption, role coverage, authenticated grading, retention and production rollout
are separate gates. SQL receipts become durable only when the outer transaction
actually commits; a future service must wait for that success and retain the real
HTTP status. No parsed body may be manufactured into status 200, and 207 must not
cause broad queue deletion.
