# C04 canonical session and owner-storage foundation

Status: **session foundation verified at `9ea1fe0ada9ab76d85b0e7f67a626cfcae05de79`; isolated owner-fence tooling verified at `20e470daa986cae9c4e260e0c90eb3f700131a60`. Whole C04 remains IN PROGRESS.**

The institutional client now exposes one canonical `echs.owner-authority.v1` boundary. A session is read as a coherent token/account/expiry triplet from one browser storage area. Partial, ambiguous or inaccessible storage fails closed. Committing a same-tab session emits one ownership transition; native credential events invalidate the prior epoch even after an A→B→A change. Unrelated storage events do not change ownership.

Every API call captures its starting session before asynchronous work. A late response cannot clear a successor's session or return a successful result into its caller. `requireAuth` also guards configuration, redirects, error notices, role metadata and navigation links. A current session's genuine401 still signs out and sends the visitor to sign-in. Invalid verification responses, including non-string expiry values, cannot certify local ownership.

Ordinary `/me` caching is limited to30 seconds and deduplicates pending work for the same epoch. Owner-storage opening requires fresh server verification, with account, organization, role and expiry checked. A server-confirmed identity change starts a new epoch, and existing consumers must reopen. A bounded local expiry timer invalidates subscribed handles without waiting for another read. Storage/focus/visibility checks and session transitions clear the corresponding verification state. These are current-session checks, not proof that an offline page instantly observes a server-side revocation.

## Owner-storage module and limits

`js/owner-storage.mjs` exports `createOwnerStorage` and a separate memory-only guest factory. The account namespace includes organization/account/domain/revision. Persisted envelopes contain stable ownership and data; no token, session identifier or expiry is persisted in them. Closed inputs, bounded JSON copies and exact envelope checks reject malformed or foreign-owner entries. Guest data is discarded by guest epoch and is never adopted into an account.

A handle verifies authority before opening, checks its captured epoch around every storage operation and invalidates synchronously when ownership changes. Abort signals and invalidation callbacks let consumers clear projections and reject delayed work. Late invalidation of an old guest does not erase a new guest session. The module never reads legacy global keys or invents ownership for them.

The current core uses synchronous browser storage. Item bounds are4MiB, export bounds20MiB, with explicit item/node/depth limits. Its compare/remove and reset operations are **not atomic across browser tabs**. Consumers requiring concurrent enqueue/ack transactions must use the separate planned transactional journal; the existence of this module is not acceptance of a complete queue migration.

## Active scope and preserved behavior

The canonical client changes are deployed production code. The owner-storage library is available for explicit adoption; no legacy learning engine or lesson producer imports it yet. This slice does not migrate or delete original raw stores, historical sync queues, question records, assignments, lesson responses or completion history. Seven raw payload/completion/merge/send/flush algorithms are checked byte-for-byte against the before-C04 fixture. Existing numeric practice scores, provisional reporting and server authorization rules retain their scope.

Public worker caching treats exactly `js/institution-client.js` and `js/owner-storage.mjs` as assets of the current release. Offline fallback can use only this release's runtime or installed shell; historical foreign-cache copies are purged. Credential-bearing requests still bypass public caching. The C01 publication boundary and C02 reporting policy are retained. An already executing older page needs a reload to use newly deployed JavaScript.

No database migration, new backend endpoint, publication grant, grading authority or student delivery change belongs to this slice.

## Validation and acceptance

The isolated candidate passed21 core groups,28 actual-client/core groups and7 independent adversarial groups. Independent review found and repaired delayed-auth side effects, queued A→B→A credential events and malformed expiry coercion; original diagnostics are retained separately. The copied existing sync, resilience and identity suites retained all92 assertions with realistic session fixtures.

Eight actual Chromium groups exercised native two-tab storage events, old/new owner separation, raw-byte preservation, delayed/current401, idle expiry, a blocked browser storage property and ephemeral guests, using only a loopback synthetic account service. This establishes the bounded foundation behavior; it does not exercise real institutional accounts or adopt legacy readers/writers. Production-installed files differ from that candidate only in foundation-scope comments, and the installed composition passed its own source-bound tests and CI.

Run the focused checks from the repository root:

```text
node tools/test_owner_storage.mjs
node tools/test_canonical_owner_authority.mjs
node tools/test_owner_worker.mjs
node tools/test_owner_storage_browser.mjs
node tools/test_mastery_sync.mjs
node tools/test_platform_resilience.mjs
node tools/test_institution_identity_mount.mjs
node tools/test_public_question_worker.mjs
node tools/test_mastery_worker.mjs
python tools/validate_baseline.py
```

The installed composition passed all 68 baseline commands, the 18-case existing mastery browser suite and the eight native ownership browser groups. Existing browser fixtures now use complete synthetic account/session records with matching expiry values; their assertions remain unchanged. The initial local baseline lacked its configured DOM dependency and hit Windows console encoding; the configured rerun passed without changing the baseline runner or weakening checks.

`.github/workflows/owner-storage.yml` validates exact report contracts, counts and runtime hashes, then binds executed sources to the tested Git tree. Its evidence validator has 12 positive and negative test groups. A failed or skipped step is not a PASS. All24 PR workflows and19 main/live workflows passed. The exact Pages deployment and24 anonymous GETs passed57 checks, including all three public runtime source hashes. The [release receipt](OWNER_STORAGE_FOUNDATION_C04_RELEASE.json) binds the tested tree, deployment and sealed evidence. Existing local browser and parity results remain scoped to synthetic accounts; no authenticated production learner test is claimed.

## Verified owner-fence tooling and isolated follow-ups

[PR372](https://github.com/2ed944-cloud/ECHS-Math/pull/372) adds only the isolated `tools/private-learning-owner-fence/` candidate and its workflow. The [separate tooling receipt](OWNER_FENCE_C04_RELEASE.json) binds main `20e470daa986cae9c4e260e0c90eb3f700131a60`, tree `50f16f647881f3e23edc6a51eebf0db447635636`, 12 changed files and 45 executed sources. PostgreSQL 15.19 passed the unchanged 27-migration prefix and 55 membership + 222 archive + 123 fence checks = 400. All four PR workflows, 68 baseline commands and nine main workflows passed. Thirteen anonymous GETs passed 27 checks, confirming the deployed revision and excluding the tooling/workflow paths from Pages.

The candidate tracks owner incarnations, explicit adoption routes and a truncation barrier, and tests OLD/NEW owner fencing on all six legacy learning tables. It remains tooling: no production migration, new active API, journal or learner adoption was enabled. The three production writers retain their existing behavior. The fixture explicitly preserves the original service-role ACLs; temporary grants used to prove all-six trigger behavior roll back. All synthetic evidence and initial failures are retained. This release does not claim every possible multi-table lock schedule or add session checks to legacy payloads that never carried them.

The independently reviewed P2b student-practice repair is a separate, uninstalled local candidate: 24 native page groups, nine flow groups with 65 original-engine comparisons, 12 action groups and three legacy-client suites including authority28 passed. Its six runtime deltas address late catalog/cache writes, response-body cancellation, successful-receipt revision races, owner counter cleanup and trusted continuation routes. The independent review found no open issue in that scope; its hash and candidate binding appear in the tooling receipt. This is not the broader guest/staff/parent adoption, a production browser release or server sync acceptance. The original P1/P2a and raw queues remain preserved; transport is held.

The P3 journal design now specifies exact replay, expected server record revisions, reset generations and fresh session checks after serialization waits. Its 49 planned protocol cases include one later handler/client case; none is an executed result. It identifies concrete missing browser seams: durable sent envelopes/server acknowledgements, deletion intent, full domain coverage and separate local/server revisions. The existing inventory remains broader than this repair: 45 HTML dependency entries, nine direct-engine entry points, seven additional completion writers and the original 49 review obligations still require their own closure. These counts are different inventories and must not be summed or treated as complete adoption.

Rollback of PR372 removes only its tooling/workflow paths; it needs no production database rollback. Preserve the earlier session-foundation receipt, raw records and the remaining rollback requirements below. Full C04 and C08 remain IN PROGRESS; no local receipt establishes authenticated grading or private-content delivery.

## Next adoption and rollback

The next migration must close producer, reader, bootstrap and synchronization paths together: the12 learning stores plus lesson events, eager legacy bank migration and dual writers, completion/access readers, delayed callbacks, and source-versioned pending queues. Original unowned bytes stay quarantined for explicit recovery; account-ID-only old queue names are not proof of source ownership. A new transactional journal must preserve concurrent records when acknowledging an earlier snapshot.

The wider C04 inventory also covers AP assessments, Optimization notes/drawings/IndexedDB images, tutor state and AP Precalculus1.2's account-local response/save timer lifecycle. Its49 explicit review obligations are not a claim that every future lesson is already inventoried. Full C04 remains incomplete until these paths have real lifecycle/ownership acceptance.

Rollback must deploy a coherent client/worker set and preserve stored bytes. Prefer a forward repair or withdrawal of newly adopted consumers rather than restoring known stale-session side effects or historical cache fallback. Do not globally clear browser storage, silently assign old records to the current account or promote client claims into verified mastery.
