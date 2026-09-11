# C08 managed-service PostgreSQL compatibility matrix

PR371 accepted the original five-service fixture, all 19 actual service groups,
27 unchanged migrations and 54 offline/TLS groups. Its original 29-file release,
failed-run diagnostics and acceptance artifacts remain preserved. This successor
requires fresh independent results for both PostgreSQL majors; it has no current
matrix execution claim.

The selected images are `supabase/postgres:15.8.1.085` and
`supabase/postgres:17.6.1.136`, derived from the already pinned official PG15
override and base Compose at Supabase commit
`8c7a4d9dbbaf8b552893822e89d7bf06f33f9220`. The upstream bytes and all seven SQL
initialization mounts remain unchanged. Both jobs retain the same Auth,
PostgREST, Storage and imgproxy versions. Each image tag is resolved to its
actual linux/amd64 manifest and config digest before execution; the runner
starts that digest and verifies the running image ID.

Every relevant entrypoint accepts `--postgres-major 15|17`, with default 15.
Plans, image receipts, checkout receipts, run reports and final indexes bind the
selected major. The runner reads `server_version_num` and `server_version` from
the actual managed database before migrations and after the 19 cases. Both
observations must agree and must match the configured job. An artifact from
one major cannot satisfy the other. Neither accepting both majors globally nor
rewriting a version observation is permitted.

The production metadata observation was PostgreSQL 17.6.1.147. The fixture's
17.6.1.136 image is a distinct version. Passing this matrix does not establish
exact production-image equivalence, hosted Edge resource compatibility, or
hosted test-project acceptance. No separate hosted test project currently exists.

The 19 service cases and their complete JavaScript file, the handler/transport
runtime pair, the synthetic seed, all 27 ECHS migrations, the seven upstream SQL
mounts and TLS gateway are byte unchanged. Cases cover real RPC/bucket policies,
six MIME policies and readback, duplicate/no-upsert behavior, tenant/role/session
denial, byte conflicts, concurrent idempotency, lost acknowledgements, orphaned
uploads, terminal states and upload bounds. Four cases deliberately inject
faults. Opaque MIME fixtures do not establish decoder or sanitization safety.

The source manifest closes 22 fixture files; the complete CI closure remains
57 files: 29 owned tooling/workflow files and 28 existing inputs. Historical base
`20e470daa986cae9c4e260e0c90eb3f700131a60`, tree
`50f16f647881f3e23edc6a51eebf0db447635636`, remains provenance and must be an
ancestor. The actual PR event supplies its current base and two merge parents.
Checkout verification binds actual HEAD/tree, changed paths and every tested
source blob. An advanced base may produce a merge tree different from the
feature-head tree. The old whole-PR changed-path equality is no longer used.

From the repository root, with the pinned dependencies installed:

```bash
python -m pip install -r tools/private-bank-service/requirements.txt
python -B tools/private-bank-service/test_service_contract.py --repo . --report tools/private-bank-service/results/safety.json
python -B tools/private-bank-service/test_actual_contract.py --report tools/private-bank-service/results/actual-contract.json
python -B tools/private-bank-service/test_ci.py --report tools/private-bank-service/results/ci-contract.json
python -B tools/private-bank-service/run_tls_test.py --report tools/private-bank-service/results/tls.json
python -B tools/private-bank-service/run_actual_service.py --repo . --postgres-major 17
```

Reports are created exclusively; use a fresh report name for a local rerun.
There are 20 safety, 20 fixture/collector and 11 CI groups, plus the unchanged
10 real loopback TLS groups. The default runners perform source preflight only.
Synthetic successful receipt fixtures are discarded after tests and cannot
establish service execution. Actual execution requires the explicit `--execute`
switch, matching GitHub SHA/workspace and a disposable GitHub-hosted Linux runner.

The matrix workflow uses separate jobs, fresh UUID-owned networks/volumes and
artifacts `private-bank-actual-service-pg15` and `private-bank-actual-service-pg17`.
Only `contents:read` is granted and checkout retains no credentials. No project
secret or production connection is used. Five services run on one owned internal
Docker bridge with no published ports or external volumes. Real managed schema
initialization, Auth/Storage startup migrations and the unchanged ECHS SQL prefix
are required; no substitute managed schema is created. Cleanup verifies the
full exact ownership set and incomplete cleanup fails the job.

The actual test child binds only loopback443, uses a generated exact-SAN
certificate and process-local trusted CA/resolver, and permits only the synthetic
hostname and verified fixture addresses. No hosts-file, OS trust-store, ambient
DNS or insecure TLS override is used. Credentials and private keys remain in a
new private directory, removed before evidence collection. Raw service logs,
compose/env dumps, tokens, SQL rows and private payloads are never artifacts.

The local collector exports five closed metadata members. The CI wrapper binds
four offline reports and checkout evidence, for exactly 11 final artifact
members including its index. Both jobs must pass all 19 service groups, exact
source/image/database/version checks, readiness and cleanup. Independent GitHub
run/job/tree/artifact verification is required before reporting CI acceptance.

Full C08 remains in progress. Hosted Edge feasibility, source-record receipts,
immutable package completion, rights/provenance, corpus import and private
student delivery remain separate gates. No public URL, authentication,
publication, mastery or Pages behavior changes. Rollback reverts only the 15
tooling/workflow changes; there is no database/data rollback. Preserve PR371
evidence and all earlier sealed foundations.
