# C08 private question archive foundation

Status: **the prior eight-file C08 candidate passed actual PostgreSQL CI; CI on the new base and production verification remain pending.** This is part of C08, not completion of the private question delivery migration. It adds an unused, immutable archive namespace without changing current question providers, class assignments, public question gates, learning evidence, existing private tables or uploaded source content. C09 migration002 remains byte-identical. The release is being rebound onto main `aa2ad54e8971b03adfcef2c48c4472f4099afc34`, which preserves the sealed C02 release and the subsequently merged AP Precalculus1.2 updates from PR367 and PR368.

## Additive schema and authorization

`202609090003_private_bank_snapshots.sql` adds six tables:

| Table | Purpose |
|---|---|
| `private_bank_snapshots` | Organization/version UUID, frozen manifest, expected counts and roots, staging/ready/aborted state |
| `private_bank_snapshot_files` | Source JSON, media and optional manifest identities, hashes, sizes and separate verification receipts |
| `private_bank_snapshot_questions` | Original question ID/bank, exact canonical UTF-8 record text/hash, parsed value, canonical source occurrence and bundle memberships |
| `private_bank_snapshot_question_files` | Same-organization, same-snapshot question/media dependency edges |
| `private_bank_snapshot_mappings` | Exact course/catalog identity, explicit rights/mapping status and administrator review evidence |
| `private_bank_snapshot_events` | Append-only actor/action/request identity metadata, without question bodies, answers, tokens or keys |

All six tables enable RLS and revoke direct access, including TRUNCATE, from PUBLIC, anon, authenticated and service_role. Composite organization/snapshot foreign keys bind the physical child rows. Source occurrences in the bounded membership arrays are additionally checked against the same snapshot's verified source-file rows. Records and mappings are append-only; file rows permit only the defined receipt transitions. Ready and aborted snapshots are terminal. New content, metadata corrections or rights changes require a new snapshot rather than rewriting history.

Three new service-only SECURITY DEFINER RPCs use the existing hashed school sessions:

- `private_bank_snapshot_import(text,text,jsonb)`: reserve, status, records, mappings, seal and abort.
- `private_bank_snapshot_file(text,text,jsonb)`: register, status and the two internal receipt actions described below.
- `private_bank_snapshot_capabilities()`: a data-free shape with contract `echs.private-bank.snapshot-store.v1`, schema version1, `immutable_ready:true` and `student_delivery:false` plus byte limits.

The existing private-bank API adds one read-only `GET /health/snapshots` route for release verification. It calls only the service-only capability RPC and returns its exact closed, data-free shape. A missing, malformed or unavailable capability returns a generic503 without database details. The route reads no account, snapshot, question or object and grants no import or delivery access. Existing health, preflight and authenticated provider behavior are preserved. This supplemental route requires its own reviewed handler and deployment evidence; local synthetic health checks are not proof of deployed schema or Storage configuration.

Every data action derives the current active administrator and organization from the session. It does not accept caller actor/organization fields. Account SHARE locking precedes exact-session SHARE and snapshot UPDATE; expiry is rechecked after waiting and immediately before return. Catalog operations lock the catalog before the snapshot and verify exact course/catalog identities. Parent, student, teacher, inactive, expired, revoked and foreign-organization actors cannot import or inspect an administrator's snapshot through these RPCs.

Closed payloads reject missing/unknown fields, nulls and invalid types. ASCII IDs, hashes, paths and tokens use explicit C collation. Snapshot, file and request UUIDs identify logical attempts. An exact retry returns existing state; changed input under the same immutable identity or request UUID conflicts. Parent-row locking serializes quota checks and terminal transitions. A failed insertion, hash comparison or seal rolls back the whole database transaction.

## Preservation and Storage trust boundary

Canonical record text is stored and hashed as UTF-8 bytes; the JSONB value is derived from that text. JSONB serialization is not used as a source-byte preservation claim. Source-file profiles are explicit: `questions[index]` or `questions[index].question`, with zero-based indexes. Whole original source-file bytes preserve surrounding review/editorial fields. No generic recursive source import is defined here.

The dedicated `private-bank-snapshots` bucket is private and uses supported Storage bucket configuration plus restrictive anon/authenticated policies. Object names are server-derived organization/snapshot/file UUIDs. The capability and file/import RPCs fail closed when the expected bucket privacy, size/MIME configuration or restrictive policies are unavailable. No trigger is installed on managed Storage tables.

`verify_bytes` and `verify_records` are trusted **Edge-internal receipts**, not browser upload fields or general HTTP actions. The future importer must authenticate and authorize the caller, use immutable `x-upsert:false` writes, read each stored object back, independently hash its bytes, and parse each archived source file using its exact declared profile. It must compare every indexed occurrence before calling the consistency receipt. A future handler must never forward arbitrary caller action names or claimed verified/ready flags.

SQL checks the receipt against frozen metadata, exact object namespace, accumulated occurrences and recomputed roots. It cannot prove that a service actually read Storage bytes; service credentials and database administrators remain trusted boundaries. No SQL transaction spans network I/O. Synthetic Storage rows in the database tests prove these SQL namespace/receipt checks only, not deployed object bytes or Storage REST behavior.

Seal recomputes four deterministic SHA-256 roots: questions with media edges, non-manifest files, all source memberships, and mappings with reviewed unit teaching sets. Fields are framed as a four-byte big-endian UTF-8 byte length followed by bytes; domain and decimal leaf count are also framed. ASCII identities use C ordering, with numeric source-occurrence ordering. The optional archived manifest is separately verified and excluded from its own file root. Ordered aggregation avoids repeatedly copying a growing byte buffer. Tests compare independently implemented Python, JavaScript and actual SQL vectors, including a 25,000-leaf SQL case.

Bounds are 1 MiB of request JSON, 64 KiB per canonical record, 16 MiB per object and 256 MiB per snapshot; at most10,000 questions,25,000 non-manifest files, one manifest,100,000 memberships/dependencies/mappings each and100 items per request. Existing lesson document limits are unchanged. No garbage collector or ready-object deletion is added.

A read-only local capacity check matched all70 source-file hashes and22,777 asset hashes to the recorded `LEGACY_PRIVATE_DELIVERY_AUDIT.json` metadata. It found5,882 unique full records with15,123 consistent occurrences, preserving all57 teacher-review wrappers and665 unreferenced assets. Descriptor and HTML media references resolve to22,112 preserved JPEG/PNG files; the largest per-question dependency list has51 entries and the largest source-membership list has five. The exact raw files total107,529,230 bytes. Reserving another16 MiB for an optional manifest still leaves144,129,010 bytes within the snapshot limit. The largest canonical record is26,127 UTF-8 bytes, source file10,997,372 bytes and asset69,956 bytes; IDs, paths, banks and MIME shapes fit the current contract. These92 local checks are capacity/preservation evidence only, not a production-main rebind, Storage receipt, rights decision or ready snapshot.

The future importer must batch by **encoded request bytes and item count together**. A size probe for the100 largest records with their occurrence/dependency metadata exceeds1 MiB (1,396,037 bytes), although the largest single record request entry fits (31,937 bytes). Do not truncate source records or rely on the100-item limit alone. Full original file bytes remain separate immutable archive objects; deduplicated canonical records do not replace source wrappers.

## Acceptance and current evidence

The earlier eight-file candidate on the C09 base passed [archive workflow34393306131](https://github.com/2ed944-cloud/ECHS-Math/actions/runs/34393306131) at head `8e4a988a79f865c88ea1591a5242ff8649240d7e`. The downloaded artifact was bound to that head, all eight source blobs and the full27-migration chain. Its actual results were:

| Contract | Passed checks/groups |
|---|---:|
| Accepted C09 PostgreSQL authorization | 55 |
| Actual C09 HTTP handler to PostgreSQL | 7 |
| Additive C08 PostgreSQL archive contracts | 222 |
| Independent JavaScript/Python archive roots | 8 |
| Actual data-free archive health handler | 5 |

These results establish the prior candidate's tested behavior, not acceptance of the new composition. C02 was separately sealed at `bcdeaa97ada19b23980dad93b828390371d41bf6`, with24 successful PR workflows,18 successful main workflows and55 anonymous live GETs passing129 checks. Current main `aa2ad54e8971b03adfcef2c48c4472f4099afc34` includes the separately reviewed AP Precalculus1.2 updates from PR367 and PR368. C08 must preserve those upstream files, rerun its contracts against the rebound source and pass both backend and Pages release verification before acceptance.

`.github/workflows/private-bank-snapshots.yml` uses a disposable PostgreSQL15 service, Node22, Python3.12 and pinned `psycopg[binary]==3.2.9`. It has no production secrets, deploy command, uploader or public cutover step. It first runs the accepted C09 database suite in a fresh `echs_membership_test_ci` database, then its actual HTTP-handler-to-SQL suite, requiring26 migrations,55 database checks and seven HTTP groups. The exact C09 migration002 hash is pinned before execution.

Only after those passes does CI create a separate fresh `echs_bank_test_ci` database. The C08 suite requires a PASS report whose entire ordered migration/hash prefix equals the current files, executes that full26-migration prefix again, and then applies003. Roles are cluster-wide, so the second bootstrap preserves the roles already created by C09 and validates their expected test privileges. It does not reuse C09 tables, rows, session fixtures or an initialized bank database.

The C08 tests refuse a non-loopback DSN, caller connection overrides, an unexpected database prefix, a non-PostgreSQL15 server or any existing public/private/storage tables. Every connection must report the forced loopback client address through libpq and the exact requested database. This permits CI's local Docker port mapping without confusing its server-side bridge listener with the client destination;16 local connection vectors exercise that distinction and rejected alternatives. The tests compare all prior public rows and function definitions before/after003 and exercise direct grants, tenant FKs, wrong roles, closed inputs, exact retries, quotas, immutable children, source consistency, root mismatches and atomic seal/abort. Separate connections observe real lock waits for concurrent reserve, file quota competition, seal/abort, catalog changes and session expiry. The independent Node/Python hash suite also verifies Unicode framing, ordering, omitted dependencies, source occurrences and manifest self-exclusion.

Run the dedicated workflow again on the new composition for actual acceptance. The final C02 HTTP harness already loads the current shared status policy and records both the handler and policy hashes; its verified26-migration,55-database-check and seven-HTTP-group baseline remains compatible with this workflow. Local source review does not replace the rebound C08 run. `--static-only` deliberately reports **DATABASE NOT RUN**; neither it nor parser/syntax checks substitute for actual PostgreSQL15 execution. Pinned Deno2.5.6 type-checks the private provider, and the actual-handler health suite checks valid capabilities,22 malformed capability vectors, generic failure behavior and preserved anonymous denials without reading data. CI uploads only five bounded test reports. Failed or missing steps do not become PASS reports.

## Rollback and remaining delivery work

This migration seeds no snapshot, question, mapping, class assignment or student entitlement. Existing static lesson/question routes and private provider APIs keep their current behavior. The release will include a narrow addition to the backend deployment workflow: a data-free `GET /private-bank-api/health/snapshots` check requiring the exact archive capability, including boolean/integer distinctions. The existing backend pipeline will apply the additive migration and deploy the read-only health route after reviewed acceptance. Successful health verification establishes the advertised schema and private bucket configuration; it does not import data or establish object-byte coverage. Do not merge the migration before the composed CI passes.

The preservation-safe rollback is to leave the unused schema in place and keep future readers/writers disconnected. Prefer a reviewed forward fix or fail-closed importer withdrawal. Do not drop archive history, disable immutability triggers, alter original private banks or restore a public raw-content fallback. No destructive down migration is provided.

Delivery004 remains separate and requires exact current class/course-version pins, approved rights and mappings, release gates, authoritative completed-unit sets, current-session authorization and delayed-byte reauthorization. Unit teaching-set completeness is a reviewed declaration because the existing catalog has no teaching-kind field; SQL verifies and preserves exact identities without inventing that classification. Missing or unresolved sets must not grant unit review.

The separately prepared12-file importer pure-core candidate is outside this release. Its local parsing, batching and memory measurements do not implement an Edge uploader, authenticate Storage operations, issue receipts, seal snapshots or authorize delivery. None of those candidate files is included in the archive-foundation source set. Actual per-source Edge resource limits, immutable upload/read-back, repeated authorization and dependency verification remain future work.

Ready means complete immutable preservation. It does not establish copyright permission, mathematical correctness, official exam endorsement, student eligibility or grading/mastery authority. No real school inventory or production object bytes have been imported or verified by this slice. Public removal requires separately verified private coverage and explicit assignments; existing public Git history and previously downloaded copies remain outside this archive's protection.
