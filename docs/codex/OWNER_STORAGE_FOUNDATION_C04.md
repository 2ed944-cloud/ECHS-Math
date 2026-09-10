# C04 canonical session and owner-storage foundation

Status: **implemented foundation; composed CI and deployment pending. Whole C04 remains IN PROGRESS.**

The institutional client now exposes one canonical `echs.owner-authority.v1` boundary. A session is read as a coherent token/account/expiry triplet from one browser storage area. Partial, ambiguous or inaccessible storage fails closed. Committing a same-tab session emits one ownership transition; native credential events invalidate the prior epoch even after an A→B→A change. Unrelated storage events do not change ownership.

Every API call captures its starting session before asynchronous work. A late response cannot clear a successor's session or return a successful result into its caller. `requireAuth` also guards configuration, redirects, error notices, role metadata and navigation links. A current session's genuine401 still signs out and sends the visitor to sign-in. Invalid verification responses, including non-string expiry values, cannot certify local ownership.

Ordinary `/me` caching is limited to30 seconds and deduplicates pending work for the same epoch. Owner-storage opening requires fresh server verification, with account, organization, role and expiry checked. A server-confirmed identity change starts a new epoch, and existing consumers must reopen. A bounded local expiry timer invalidates subscribed handles without waiting for another read. Storage/focus/visibility checks and session transitions clear the corresponding verification state. These are current-session checks, not proof that an offline page instantly observes a server-side revocation.

## Owner-storage module and limits

`js/owner-storage.mjs` exports `createOwnerStorage` and a separate memory-only guest factory. The account namespace includes organization/account/domain/revision. Persisted envelopes contain stable ownership and data; no token, session identifier or expiry is persisted in them. Closed inputs, bounded JSON copies and exact envelope checks reject malformed or foreign-owner entries. Guest data is discarded by guest epoch and is never adopted into an account.

A handle verifies authority before opening, checks its captured epoch around every storage operation and invalidates synchronously when ownership changes. Abort signals and invalidation callbacks let consumers clear projections and reject delayed work. Late invalidation of an old guest does not erase a new guest session. The module never reads legacy global keys or invents ownership for them.

The current core uses synchronous browser storage. Item bounds are4MiB, export bounds20MiB, with explicit item/node/depth limits. Its compare/remove and reset operations are **not atomic across browser tabs**. Consumers requiring concurrent enqueue/ack transactions must use the separate planned transactional journal; the existence of this module is not acceptance of a complete queue migration.

## Active scope and preserved behavior

The canonical client changes are active code in this candidate. The owner-storage library is available for explicit adoption; no legacy learning engine or lesson producer imports it yet. This slice does not migrate or delete original raw stores, historical sync queues, question records, assignments, lesson responses or completion history. Seven raw payload/completion/merge/send/flush algorithms are checked byte-for-byte against the before-C04 fixture. Existing numeric practice scores, provisional reporting and server authorization rules retain their scope.

Public worker caching treats exactly `js/institution-client.js` and `js/owner-storage.mjs` as assets of the current release. Offline fallback can use only this release's runtime or installed shell; historical foreign-cache copies are purged. Credential-bearing requests still bypass public caching. The C01 publication boundary and C02 reporting policy are retained. An already executing older page needs a reload to use newly deployed JavaScript.

No database migration, new backend endpoint, publication grant, grading authority or student delivery change belongs to this slice.

## Validation and acceptance

The isolated candidate passed21 core groups,28 actual-client/core groups and7 independent adversarial groups. Independent review found and repaired delayed-auth side effects, queued A→B→A credential events and malformed expiry coercion; original diagnostics are retained separately. The copied existing sync, resilience and identity suites retained all92 assertions with realistic session fixtures.

Eight actual Chromium groups exercised native two-tab storage events, old/new owner separation, raw-byte preservation, delayed/current401, idle expiry, a blocked browser storage property and ephemeral guests, using only a loopback synthetic account service. This establishes the bounded foundation behavior; it does not exercise real institutional accounts or adopt legacy readers/writers. Production-installed files differ from that candidate only in foundation-scope comments, and the installed composition requires its own tests and CI.

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

The installed composition passed all 68 baseline commands, the 18-case existing mastery browser suite and the eight native ownership browser groups. Four existing browser fixtures now use complete synthetic account/session records with matching expiry values; their assertions remain unchanged. The initial local baseline lacked its configured DOM dependency and hit Windows console encoding; the configured rerun passed without changing the baseline runner or weakening checks.

`.github/workflows/owner-storage.yml` validates exact report contracts, counts and runtime hashes, then binds executed sources to the tested Git tree. Its evidence validator has 12 positive and negative test groups. A failed or skipped step is not a PASS. Fresh composed CI, existing platform captures, exact Pages deployment and bounded live source verification remain required before this foundation is accepted as deployed.

## Next adoption and rollback

The next migration must close producer, reader, bootstrap and synchronization paths together: the12 learning stores plus lesson events, eager legacy bank migration and dual writers, completion/access readers, delayed callbacks, and source-versioned pending queues. Original unowned bytes stay quarantined for explicit recovery; account-ID-only old queue names are not proof of source ownership. A new transactional journal must preserve concurrent records when acknowledging an earlier snapshot.

The wider C04 inventory also covers AP assessments, Optimization notes/drawings/IndexedDB images, tutor state and AP Precalculus1.2's account-local response/save timer lifecycle. Its49 explicit review obligations are not a claim that every future lesson is already inventoried. Full C04 remains incomplete until these paths have real lifecycle/ownership acceptance.

Rollback must deploy a coherent client/worker set and preserve stored bytes. Prefer a forward repair or withdrawal of newly adopted consumers rather than restoring known stale-session side effects or historical cache fallback. Do not globally clear browser storage, silently assign old records to the current account or promote client claims into verified mastery.
