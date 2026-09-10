# Private bank transport: isolated SQL acceptance

This test-only candidate executes the reviewed byte upload/status Request handler against actual PostgreSQL RPCs. It adds no deployed function, provider, migration, import, delivery route or production request. The entire directory is under `tools/`, excluded from the existing Pages artifact. Actual SQL acceptance remains pending until the dedicated workflow succeeds; local guard tests are a separate result.

## Preserved transport

The runtime files are byte-identical to the independently reviewed local transport candidate:

| File | SHA256 |
| --- | --- |
| `handler.mjs` | `ff49fd68970612cd325dec9819707a91a431eb1799cf6c4d88d1fea675f4cf0e` |
| `transport.mjs` | `11425bcd086ddb2f88c788969ef82e1f2af8a7803d8b8110baabf785bb3152d3` |

Its original manifest was `91884b4feb89f6fe4635823296f33b7b6f87cb63c7cc67630d6c7fe354498304`. That candidate passed 30 synthetic groups under Node and 30 under Deno. Those suites are not copied or rerun by this workflow; exact runtime-byte preservation is checked instead. The new SQL harness was independently reviewed as local candidate `7cbbd73698cafac4c56db46bb0086c4e42784e2160da1202cca00de7493e3c25`; this repository layout explicitly adapts its paths and checkout evidence.

`source-pins.json` binds exactly 37 dependencies: all 27 migration files, eight preserved baseline/helper/handler files and the two transport modules. The approved C04 base is `9ea1fe0ada9ab76d85b0e7f67a626cfcae05de79`, tree `de227c260e5ae4a7b3bf87a2cf73ee82867e36a2`. Source drift or a different base requires a reviewed pin update.

## Workflow and evidence

The dedicated workflow has read-only repository permission, no production secrets or deployment environment, a 20-minute bound and a fresh PostgreSQL15 service. It records the resolved image ID/digest and actual PostgreSQL patch version; the `postgres:15` tag itself is not an immutable image pin. Python3.12, Node22 and the pinned `psycopg[binary]==3.2.9` driver run:

1. Eight local connection/action/source guard groups and Node syntax validation.
2. The accepted C09 26-migration database suite: 55 checks in a fresh membership database.
3. The actual C09 HTTP/SQL suite: 7 groups.
4. The accepted archive 27-migration database suite: 222 checks in a distinct newly created database.
5. The actual transport-route/SQL suite: 15 groups.

The actual database/HTTP total is **299**, separate from the eight local guard groups. No SQL PASS status can come from source inspection. The runner refuses a nonempty membership database, existing fixture roles, an existing archive target, remote or ambiguous hosts, caller `hostaddr`/service/options overrides, truncated database names and different cluster connection settings. It uses libpq's actual connected address. It never drops or resets existing databases or roles.

Before tests, the workflow requires the exact combined 17-file diff and binds all 52 used Git blobs: ten candidate files, seven explicitly approved C04 receipt/documentation/board follow-ups, and 35 unchanged repository dependencies. Metadata keeps the candidate and follow-up lists separate. It checks the tested commit/tree, exact C04 base/tree, two PR merge parents and equality of the PR head tree and tested merge tree. The runner binds its acceptance to that checkout receipt and rechecks all 52 file hashes before and after every child command and at finalization. Inherited `PG*` and `ECHS_*` overrides are removed before child execution.

The artifact permits only checkout metadata, source pins, the local guard report, the fresh acceptance plus four actual reports, and its generated index: nine JSON files at success. No raw logs, DSNs, session material, binary bodies or source payloads are copied. An incomplete or failed run retains available closed diagnostic JSON and marks failure. Artifact assembly independently rechecks all 52 current source files against the same checkout receipt. Runtime/dependency hashes and each report hash connect final acceptance to the exact tested source.

## Real SQL; injected HTTP services

The Request/Response handler, fixed transports, PostgreSQL15, migrations, session lookup, service-role execution, administrator/tenant checks, terminal states, quotas, event replay and byte receipt execute their actual code paths.

PostgREST HTTP is a fixed injected adapter to a closed Python stdio bridge. Storage HTTP holds immutable original **synthetic** bytes in memory and creates explicit test-only `storage.objects` metadata. No Storage REST service runs. Reports always keep real PostgREST, Storage and hosted Edge execution flags false for this slice.

The bridge exposes only session lookup, snapshot status, file status and internal `verify_bytes` to the handler. Separate fixed test controls affect at most 40 newly minted synthetic cases. A ready terminal fixture uses trusted synthetic SQL setup solely to verify upload denial; it is not evidence that the handler implements record verification or sealing.

The 15 groups cover authority/tenant denials, exact private projection and receipts, changed retries/MIME/size, lost and duplicate acknowledgements, corrupt readback, missing object metadata, ready/aborted denial, actual revocation/expiry/suspension/demotion during I/O, abort during I/O, request-ID collision, quota failure and concurrent identical HTTP requests. Their SQL bridge is serialized; the existing 222-check suite separately exercises actual parallel SQL races.

Ordinary upload must remain staging, create no canonical question rows or source-record receipt, and commit one byte event only after readback/hash checks. SQL authorization and Storage I/O are separate transactions: a late revoked or aborted write may leave immutable orphan bytes. The transport never overwrites or deletes them. Status reads report the SQL receipt, not a fresh Storage audit.

## Local commands and remaining gates

```text
python tools/private-bank-transport/test-contract.py
node --check tools/private-bank-transport/test-http-sql.mjs
python tools/private-bank-transport/run-integration.py
```

The default runner only checks source inputs. Actual execution requires an isolated fresh PostgreSQL15 cluster, a membership database named `echs_membership_test_transport_*`, an absent archive target named `echs_bank_test_transport_*`, and their explicit matching loopback DSNs in `ECHS_MEMBERSHIP_TEST_DSN` / `ECHS_BANK_TEST_DSN`:

```text
python tools/private-bank-transport/run-integration.py --execute
```

CI additionally requires its generated `--checkout-report`. Test credentials stay in environment or process pipes; reports contain fixed labels, hashes, counts and sanitized error types. This suite never reads real learner or question-bank data.

Actual pinned PostgREST/Storage service acceptance, supported duplicate/readback REST behavior, fixed deployed gateway wiring, and hosted Edge CPU/memory/deadline/concurrency limits remain separate gates. Standard large-object uploads must be measured; switching to resumable uploads would require a reviewed protocol change. Full source parsing, durable resume, record-root receipts, atomic readiness, rights/mappings, student delivery and any real archive import remain outside this upload-only test candidate.
