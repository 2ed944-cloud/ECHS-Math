# C04 journal HTTP and PostgREST integration candidate

This directory prepares an isolated, executable CI gate for the reviewed journal
SQL and frozen J049 v3 native handler. It does not install an active API, change
student pages, create a Supabase project, apply a production migration, or
complete C04. No PostgreSQL/PostgREST service execution has been performed for
this candidate locally. Actual acceptance is pending both CI matrix jobs.

## Small service boundary

The workflow runs two independent jobs: PostgreSQL 15 and PostgreSQL 17, each
with PostgREST 14.17. These are the only allowed majors/tags. Each run resolves
the tag to its actual Linux amd64 image and records the repository digest and
running image ID. It creates one uniquely named internal Docker bridge and two
labelled containers. There are no published service ports, external networks,
persistent named volumes or production secrets. PostgreSQL data lives in an
owned tmpfs; cleanup removes only the inspected run-owned containers/network.
An ambiguous network-create result still enters owned cleanup, and final
network/container absence is required for acceptance.

The exact 27 repository migrations run on a fresh empty database, followed by
the retained owner-fence SQL and accepted operation-journal SQL. The small
storage catalog tables required by these migrations are fixture bootstrap
tables, using the same shapes as the previously accepted SQL fixtures. No
Storage service or Storage compatibility is claimed. Roles/JWTs and custom
school tokens are generated for this run; fixture-only setup provisions
synthetic owner routes and zero-state journal owners. It does not implement an
owner-adoption API.

PostgREST connects as an unprivileged authenticator that can assume the existing
anon/authenticated/service_role roles. Its in-database configuration override
is disabled. Every actual journal call still reaches the service-only SQL RPC
with a hashed custom student token and fresh authorization. The version and
environment configuration follow the [PostgREST 14 configuration reference](https://docs.postgrest.org/en/v14/references/configuration.html).

Readiness calls SQL directly and requires exactly HTTP403 with SQLSTATE28000
for the nonexistent synthetic custom session. PostgREST v14.17 maps SQLSTATE
class28 to HTTP403 in its [Error.hs source](https://github.com/PostgREST/postgrest/blob/v14.17/src/PostgREST/Error.hs).
The native handler separately translates that SQL code into client401. The
first PR376 service attempt required401 at the direct probe and failed readiness
on both majors after successful schema installation; its artifacts remain
retained as failed evidence. The readiness repair corrected that fixture probe
and added a bounded status/code observation while preserving all runtime and
SQL bytes and requiring all twenty actual HTTP cases.

The second service attempt passed S01–S04 on both majors and failed the S05
concurrent status assertion. The diagnostic successor retained its exact
expected statuses and all twenty cases. Failed reports additionally retain at
most eight numbers per assertion array, twelve RPC route/status pairs, and
twelve native HTTP route/status/known-error-code observations. Private bodies,
SQL text, tokens, and arbitrary error messages remain excluded. This change
did not fix or accept the observed S05 failure.

The third diagnostic attempt confirmed S05 returned `[200,504]`, with a native
`deadline` error and no completed loser PostgREST response on both majors.
PostgREST14.17's [pinned Hasql1.1.0.1 transaction implementation](https://github.com/nikita-volkov/hasql-transaction/blob/1.1.0.1/library/Hasql/Transaction/Private/Sessions.hs)
retries40001 without a bound. This successor pins the reviewed SQL repair
`9ce98da90d5c141fdf184d32a00067eca1aaa800870204edd9c383cc22b1e1bf`,
which changes exactly five journal domain-conflict raises to PT409, and the
matching J049v3 handler mapping. All twenty service case bodies and the required
S05 `[200,409]` outcome remain exact. The repaired full SQL matrix must pass and
merge before this HTTP successor is published. Its own real HTTP matrix remains
required afterward. Earlier failed source/artifact directories remain retained.

Predecessor owner-fence SQL is unchanged. Its deliberate40001 stale/missing
owner-barrier errors require a separate HTTP retry-boundary review before a new
runtime path can expose them. Neither these fixture pins nor the injected
handler tests establish hosted compatibility or production readiness.

## Actual HTTP path

The Node fixture binds an ephemeral loopback HTTP port, converts incoming
requests to native Request objects, and consumes native Response bodies with
abort-aware backpressure. The four frozen runtime modules are copied byte for
byte from J049 v3 manifest
`84284f19b00a26b8ee30ed2567132b7913e0a0c8e5cb7c80e4167f62d778445c`.

Only the fixture fetch port maps the handler's fixed synthetic HTTPS origin and
four exact RPC paths onto the inspected private PostgREST HTTP address. It
preserves the body bytes, options, headers, signal and status. It rejects public
addresses, noncanonical origins, queries, redirects and unknown routes. This
is real native HTTP transport and actual PostgREST transactions; it is not a
TLS, Supabase gateway, Deno runtime or hosted Edge test. The synthetic origin is
never resolved or contacted over the internet.

The SQL control process is a private parent pipe. Its closed operations only
create bounded synthetic cases, inspect their retained rows, change their
session/role state, or install/remove one narrowly scoped failure trigger. It
does not implement an alternative journal RPC. Independent SQL reads compare
actual retained operation text/receipts and table digests after HTTP results.
It enforces the run-owned configuration path, private database address and
database owner marker, and is reaped before acceptance.

## Twenty cases per database major

The real service suite covers all four routes, receipt/SQL text/digest equality,
raw numeric precision and scale, heads/tombstones, exact concurrent retries,
conflicting CAS contenders, compound rollback, and an injected SQL failure
after head insertion followed by a successful exact retry.

Lost-response cases drop the socket or truncate the HTTP response after an
actual committed PostgREST result. Another case returns gateway status207 after
a real commit. These are explicit transport fault injections, not claims that
PostgREST naturally emits those responses. Pending intent remains intact until
the exact raw apply request is replayed successfully. An operation lookup is
informational for a first pending ACK: the suite includes the concrete same-UUID,
same-metadata, different-opaque-value counterexample. Lookup cannot acknowledge
the changed intent, and exact apply replay must conflict without changing rows.

Further cases verify fresh revocation, new-session recovery, foreign ownership,
nonstudent roles, direct anon/authenticated RPC denial, malformed UTF-8 and
duplicate JSON keys rejected before SQL, actual owner-lock wait followed by
committed revocation, historical receipt behavior after reset, and SQL's
normalized row-byte limit.

The PostgreSQL17 job is required because the observed production project uses
major17. Passing a generic postgres:17 image establishes only this fixture's
HTTP/SQL behavior on the recorded image. It does not establish compatibility
with the exact hosted Supabase 17.6.1.147 variant, all extensions, or all448
pre-existing SQL checks; those remain separate proofs.

## Review and execution

Local commands, from the workspace root, use explicit repository inputs and a
new report filename. They never start Docker or execute SQL:

```text
python -X utf8 -B tools/private-learning-journal-http/test_offline.py . <new-offline-report.json>
node tools/private-learning-journal-http/test_bridge.mjs <new-bridge-report.json>
python -X utf8 -B tools/private-learning-journal-http/run.py --repo . --postgres-major 15
python -X utf8 -B tools/private-learning-journal-http/run.py --repo . --postgres-major 17
```

The 17 offline configuration/ownership/failure tests and nine native loopback/diagnostic
adapter groups are separate evidence from the twenty real service cases. The
adapter tests include an actual client disconnect and producer cancellation;
their upstream service is injected and they do not execute PostgREST or SQL.

The only execution mode is `run.py --postgres-major 15|17 --execute` on an exact
GitHub-hosted Linux checkout. It rejects ambient database, Supabase, Docker and
proxy overrides. The workflow uses read-only repository permission, no persisted
checkout credentials and no production environment or secret references.
Executable sources and the manifest are checked against Git HEAD; immutable
input hashes and runtime copies are rechecked before and after service tests.

The artifact contains metadata JSON only: source receipt, image receipt, HTTP
case results, run report and a final member index, plus the separate offline and
loopback reports. No service logs, raw request/response bodies, JWTs, tokens,
private control output or generated configuration are uploaded. Failed runs
retain bounded case/SQLSTATE/error-code/assertion diagnostics. A PASS requires
all twenty exact cases, source preservation and complete owned cleanup. Reports
without the final complete artifact index cannot establish acceptance.

## Remaining actual CI gate and rollback

Publish the reviewed tooling and workflow in a small PR, execute both matrix
jobs, inspect each recorded checkout/image/source and all twenty outcomes, and
repair actual failures before claiming HTTP/PostgREST compatibility. The first
execution may expose integration differences; no synthetic success is
substituted for that gate.

This is tooling-only. Rollback removes the candidate workflow/tooling through
the normal reviewed change process; active `learning-sync`, authentication,
mastery, lesson URLs and Pages deployment are unaffected. Hosted Edge validation,
durable browser pending/ACK transactions, adoption/provisioning, complete
producer/reader closure and production rollout remain outstanding.
