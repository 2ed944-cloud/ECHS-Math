# C04/C08 verified service matrix evidence

This board update records four merged tooling releases. C04 and C08 remain **IN PROGRESS**, their test status remains **PARTIAL**, and the whole program is incomplete. It preserves the original production/source baseline, last fully verified release, all earlier receipts, and their historical diagnostics.

| Release | Actual acceptance | Merge and source receipt |
| --- | --- | --- |
| [PR377](https://github.com/2ed944-cloud/ECHS-Math/pull/377) | PostgreSQL 15.19 and 17.11: 448 SQL groups each (55 membership +222 archive +123 owner-fence +48 journal) | `35912284a457d439b7104bc863257b1719c09bdb`; [C04 receipt](C04_JOURNAL_SERVICE_C04_RELEASE.json) |
| [PR376](https://github.com/2ed944-cloud/ECHS-Math/pull/376) | Same stock database versions through PostgREST 14.17: 20 native HTTP cases each, including exact replay, CAS conflicts and reply loss | `f127a8e9d5a18be2f19bd8bb3d5e30b159dbb169`; [C04 receipt](C04_JOURNAL_SERVICE_C04_RELEASE.json) |
| [PR379](https://github.com/2ed944-cloud/ECHS-Math/pull/379) | 448 SQL +20 retained HTTP +9 focused SQL +2 retry HTTP groups on each stock major; four repaired failures each execute one transaction; owned retrying server stopped and zero remaining backends observed | `2c1a0ec618d7a4231195876ff6cbdfb53ad4c819`; [C04 receipt](C04_JOURNAL_SERVICE_C04_RELEASE.json) |
| [PR378](https://github.com/2ed944-cloud/ECHS-Math/pull/378) | 19 unchanged managed-service cases each on `supabase/postgres:15.8.1.085` and `17.6.1.136`; 61 local guards/TLS checks per job | `8eef049612010f798e636ced3b456ba48ad29a1a`; [C08 receipt](PRIVATE_BANK_SERVICE_MATRIX_C08_RELEASE.json) |

The SQL journal's five intentional conflicts use PT409. The isolated retry successor changes four explicit missing-state errors to 55000 while retaining native PostgreSQL serialization 40001. The original fence remains unchanged. PR379's 479 groups per major overlap existing semantics; the count describes executed groups, not unique business behaviors.

Each release has a verified 68-command main baseline, successful main/follow-up workflows, and exact Pages deployment/exclusion observations. These are historical observations of each merged revision, not a new live probe from this documentation update. The JSON receipts record exact trees, manifests, artifact hashes, image identities, source evidence hashes and run links. Full workspace acceptance records remain preserved and are referenced by hash; no private payloads or logs are copied here.

The obsolete current claim that P3 SQL cases were only planned is replaced by these executed results. Historical reports remain intact: their then-unfinished native HTTP and four-branch retry gates are resolved only for the corresponding isolated successors. The board's latest foundation points to PR379; its last fully verified task and the immutable production/source baseline remain unchanged.

No production migration, active endpoint, browser bridge, owner adoption, authoritative grading, mastery policy, question publication gate or private-content distribution is enabled by these releases or this update. Pending browser integration acceptance is outside this receipt. No isolated hosted Supabase project exists. Managed image `17.6.1.136` and stock PostgreSQL 17.11 are distinct from the reported live Supabase `17.6.1.147`; local TLS/service evidence does not establish hosted Edge or production-variant acceptance.

C08 still requires corpus/record verification, sealing, rights decisions and private-delivery/fallback cutover. C04 still requires legacy-store adoption, browser/HTTP integration and separately reviewed rollout. Future adoption must explicitly select the accepted fence successor with a migration/rollback plan.

Rollback for this docs-only change restores the previous execution plan and removes only the three new documentation files after checking their hashes. Runtime rollback for the original releases remains in their preserved acceptance records: PR376/379 added 15/24 tooling files, while PR377/378 preserved before-hash backups for 22/15 changed files. No production database rollback is required.
