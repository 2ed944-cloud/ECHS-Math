# Owner fence retry boundary: isolated successor

This package is uninstalled tooling. It changes four explicit missing-state SQL errors from `40001` to `55000` in a copied owner-fence installation script. It preserves every lock, trigger, grant, route, schema and native PostgreSQL serialization failure. No production migration, API, browser adoption, lesson, URL or Pages asset is installed by this package.

The retained inputs are 72 exact files from accepted tree `42148dda6ec82d8bf470cd17a9b9f2752170aa3d`: the 57-file journal SQL closure and 15 HTTP paths. Their SHA256, byte length and Git blob identities are in `input-pins.json`. Those inputs remain at their original paths without modification. The new `source-manifest.json` binds this separate namespace and workflow. The checkout validator verifies the original 57-file graph, the additional 15 retained HTTP paths and every new source against the actual tested Git tree; an older validator never grants successor-source authority.

## Why the error changes

The four deliberate errors represent missing owner barrier or companion rows. Re-executing an identical request cannot repair absent metadata. The code previously classified those conditions as serialization failures. In the pinned PostgREST 14.17 dependency chain, that classification enters Hasql's automatic retry loop. The new `55000` signals object state failure and produces a finite HTTP 500 while preserving rollback. It grants no new permission or automatic reauthorization.

The mechanism was checked against primary sources:

- [PostgREST14.17 transaction dispatch](https://github.com/PostgREST/postgrest/blob/v14.17/src/PostgREST/MainTx.hs) and [pinned Hasql transaction dependency](https://github.com/PostgREST/postgrest/blob/v14.17/nix/overlays/haskell-packages.nix).
- [Hasql1.1.0.1 transaction runner](https://github.com/nikita-volkov/hasql-transaction/blob/1.1.0.1/library/Hasql/Transaction/Private/Transaction.hs) and [retry session implementation](https://github.com/nikita-volkov/hasql-transaction/blob/1.1.0.1/library/Hasql/Transaction/Private/Sessions.hs).
- [PostgREST14.17 HTTP error mapping](https://github.com/PostgREST/postgrest/blob/v14.17/src/PostgREST/Error.hs). Direct class28 denial is403, class55 failure500. The native J049 handler has its own public mapping.
- [PostgreSQL17 transaction isolation](https://www.postgresql.org/docs/17/transaction-iso.html). A fixed snapshot locking a row changed by another transaction can still produce a native `40001`; the successor preserves that behavior.

An account absent from the current fixed snapshot may become visible in a new transaction. Missing state alone does not prove that a retry is appropriate. The fixture therefore separates explicit absence (`55000`) from an observed concurrent row-update serialization failure (`40001`). A future adoption flow must decide reauthorization and recovery separately.

## Source changes and retained case bodies

| Component | Change |
|---|---|
| `owner-fence.sql` | Exact four `errcode='40001'` → `errcode='55000'` substitutions; 14222 bytes |
| `test_fence.py` | Four corresponding expected-error literal substitutions; all 123 labels and two native `40001` sites retained |
| `run_sql.py` | Narrow copy of the accepted journal runner, using new source contract, successor fence and retained journal fixture; 55+222+123+48 cases |
| Four `runtime/*.mjs`, `bridge.mjs`, `controls.py`, `test_http.mjs`, `test_bridge.mjs` | Byte-identical copies of accepted HTTP tooling; all 20 J049 case bodies and 9 loopback groups retained |
| `fixture.py`, `run_services.py`, `test_offline.py` | Copied fixture/service supervision with successor pins, focused probes and separate evidence namespace |
| `test_retry_sql.py`, `run_retry_sql.py`, `test_retry_http.py` | New focused SQL/HTTP tests and bounded supervision |
| `contract.py`, `assemble.py`, `test_contract.py`, workflow | New independent source and artifact contracts, offline fault tests and disposable matrix |

Old SQL SHA256: `2c4ece7736e858d7923601898cc3a5c8ac77b57500a0f0f3e22dc566eb31348f`.
Successor SQL SHA256: `cd553dc8e1a715af588553f19d74df6b5f2f20d6a4c5c86930ecb74ab933600b`.
The journal remains SHA256 `9ce98da90d5c141fdf184d32a00067eca1aaa800870204edd9c383cc22b1e1bf`. Its five permanent domain conflicts use `PT409`; that accepted journal repair is unchanged.

## Execution and evidence

The workflow runs only on a GitHub-hosted Linux runner with a closed PostgreSQL 15/17 matrix, Python 3.12, Node 24, pglast 7.7, PyYAML 6.0.2 and psycopg 3.2.9. PostgREST is 14.17. Container tags resolve to inspected image IDs/digests recorded before startup. These records, together with the actual server versions, describe the tested images; a major version match does not establish equivalence to a hosted Supabase build.

Execution order per major:

1. Run 25 contract guards, 17 copied offline service guards and 9 native loopback groups.
2. Run 448 SQL assertions: 55 membership, 222 archive, 123 legacy fence, 48 journal, using the successor fence. The GitHub SQL service is empty and uses fixture-only credentials.
3. Run 20 unchanged J049 HTTP cases over a native local HTTP server, actual PostgREST and a separate owned PostgreSQL container on a fresh internal Docker network.
4. Run R01–R09 in a third fresh database in that owned PostgreSQL container. These include 29 deliberate absence `55000` assertions, 18 mutations across all six tables, four native `40001` serialization controls, observed lock waits, identity/tenant checks and deletion races. The subprocess has a 120-second outer timeout; every connection checks database identity, marker and major and uses connect/statement/lock timeouts.
5. R10 sends four direct HTTP requests reaching all four changed branches. A fixture-only pre-request sequence records exactly one transaction attempt per request. R11 temporarily installs the exact retained legacy guard function, observes at least two attempts from one request, stops the owned PostgREST container and proves all matching backends are absent. Matching includes database, application, user, client address and backend identity. Only after confirmed stop does the harness reap the HTTP worker; a client timeout alone cannot pass.

R12 refers to the unchanged 20 J049 cases already run, counted once. The 9 focused SQL groups overlap some legacy 123 semantics but are separate executions. The collector reports 448 SQL, 20 base HTTP, 9 focused SQL and 2 retry HTTP groups separately: 479 executed groups per major. Offline and loopback checks remain separate.

The pre-request sequence and two helper functions exist only in disposable fixtures. The counter function exposes no arguments or data and is callable by the three synthetic JWT roles so it does not replace the original service-only RPC denial checks. The action probe is service-role-only. No fixture helper is included in the successor SQL installation script. Corruption probes restore rows and verify schema, ACL and trigger fingerprints; the final owned resources and private credential files are removed.

The combined artifact has 14 metadata reports plus one index. It validates the original SQL checkout, successor source graph, all case sequences, images/major versions, current source hashes, six service report digests, exact focused counters and cleanup. It excludes DSNs, JWTs, request/response bodies, raw SQL logs and credentials. Missing, failed, skipped, stale, contradictory or incomplete evidence produces an incomplete index with no actual acceptance counts. This is a collector of executed results, not an independent attestation against a malicious runner.

## Local review commands

Run from the repository root; use fresh output filenames:

```text
python -m pip install pglast==7.7 PyYAML==6.0.2
python tools/private-learning-owner-fence-retry/test_contract.py /tmp/owner-fence-retry-contract.json
python tools/private-learning-owner-fence-retry/test_offline.py . /tmp/owner-fence-retry-offline.json
node tools/private-learning-owner-fence-retry/test_bridge.mjs /tmp/owner-fence-retry-bridge.json
python tools/private-learning-owner-fence-retry/run_sql.py --postgres-major 15
python tools/private-learning-owner-fence-retry/run_services.py --repo . --postgres-major 15
python tools/private-learning-owner-fence-retry/run_services.py --repo . --postgres-major 17
```

The final three commands omit `--execute` and only verify sources; they do not start a service. Choose writable absolute output paths on Windows. Only the dedicated workflow supplies actual execution flags and owned fixture configuration.

## Readiness and rollback

Offline tests and syntax checks do not satisfy SQL or HTTP acceptance. Actual acceptance requires both matrix jobs to finish all cases, the exact tested merge/source hashes and complete artifact indexes. No production access, hosted Edge/TLS behavior, browser persistence or adoption integration is claimed. This package does not resolve all future adoption contracts.

Rollback is removal or reversion of this new tooling namespace and workflow. Original fixture paths, accepted runtime sources, production migrations and deployment are retained unchanged. Any future installed migration must receive a separate review and rollout/rollback plan; do not execute either copied installation script against production.
