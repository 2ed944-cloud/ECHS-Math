# ECHS-C08: legacy question-bank private delivery

**P0 — PLANNED.** C01 contains the official bank. C08 must close the separate legacy textbook publication gap before ECHS-015 and before broad question-bank security claims. Preserve current question availability until private delivery coverage is verified; this audit authorizes no production imports or cutover.

## Verified source baseline

Main commit: `99a0e6582cd82941a03c7d5cc2ec4517def62bb7`.

The companion `LEGACY_PRIVATE_DELIVERY_AUDIT.json` records exact paths, sizes, SHA-256 and Git blob SHA-1 for all **70 payload JSON files**. All 70 payloads and **22,777 assets** match the supplied exact-main Git metadata: **zero missing, zero mismatched**. Nineteen runtime/metadata files and four private-foundation migrations also match after comparison with supplemental exact-main metadata. The Pages workflow row explicitly distinguishes the C01 working candidate from the captured original main workflow, with both sets of hashes; it is not claimed unchanged.

| Source group | Canonical question IDs | Asset files | Asset bytes |
|---|---:|---:|---:|
| CALCT3BC | 3,309 | 13,964 JPG | 32,551,081 |
| ADAMS10 | 2,170 | 8,410 JPG | 12,581,168 |
| PEARSON_CH0 | 403 | 403 PNG | 6,965,653 |
| Total | 5,882 | 22,777 | 52,097,902 |

The 70 JSON files contain 15,123 row occurrences: 39 source files, 29 AP bundles, one course bundle and one review queue. Repeated IDs have identical full-record and content hashes. Preserve every bundle membership when deduplicating records. Of the assets, 22,112 are referenced and 665 additional source assets remain preserved.

Rights metadata contains `commercial_publisher_resource_private_use_only` on 403 Pearson records; the other 5,479 lack a `source_license` value. Missing metadata does not establish public authorization. No independent rights, mathematical correctness or curriculum mapping certification was performed.

## Active delivery and authority findings

- `question-bank/js/bank.js:10,12,15` fetches the public catalog and raw bundles. `mapped-private-bank-practice.js:90,95,98` combines those bundles with authenticated `practice-bank-api` results and retains static fallback. Deleting static JSON alone can discard successful private results through its current `Promise.all` failure path.
- `question-bank/js/mapped-practice.js:354,361,772` and `practice-single-bank.js:8,30` keep these banks active in student practice. `review.js:19` fetches a full 57-row review queue. Existing URLs and intended route coverage must survive migration.
- `question-bank/js/private-bank-assets.js:6,25,30` resolves private media through authenticated APIs; it does not protect ordinary textbook asset URLs. `official/admin/js/private-bank-center.js:46` reads authenticated `private-bank-api /packages`. The empty public registry proves neither deployed private coverage nor its absence.
- `supabase/functions/practice-bank-api/index.ts:87,212,246,277,306` currently uses course-level eligibility without an explicit transaction proving active class, curriculum version pin and class-specific release. Its media endpoint issues a 300-second signed URL; immediate revocation after issuance is not established.
- `tools/upload_private_bank_package_fast.py:173,396,400,435` is a mutating uploader: overwrite is enabled, visible questions precede completed media, stale IDs may be deleted, and object paths lack organization/version namespaces. **Do not run it as a dry run.**

The existing foundation is in `202607272101_private_bank_foundation.sql` (tables at lines 6/32/61/74, RLS/grants at 158–170, private bucket at 175). Later migrations `202607282330_verified_private_bank_import.sql`, `202607300020_sync_private_bank_mapping_indexes.sql` and `202607301500_private_bank_practice_inventory.sql` add trust-state support, derived mapping indexes and service-only inventory. These can inform C08; they do not establish immutable ready-package or exact class/version authorization. Package ownership must be joined to tenant identity, rather than inferred from a package UUID foreign key alone.

## Required migration gates

1. Preserve the sealed 5,882 IDs, content hashes, bundle/route memberships and all 22,777 assets. Review rights and exact course/version mappings without promoting source labels or treating BC/enrichment as AB.
2. Stage immutable private package versions using organization/version media namespaces. Activate only after complete payload/media integrity checks in one transaction; interruption must leave the previous ready version intact. Do not invent verified-solution or mastery flags.
3. Make `practice-bank-api` revalidate the current account/session, same-organization active class, membership, active curriculum pin and class-specific release. Define and test media delivery and revocation behavior.
4. Run actual PostgreSQL and production-handler/transport/SQL tests: direct grants, tenant mismatches, revoked/expired sessions, inactive class/membership/pin, release denial, incomplete snapshots, corrupt media, optimistic conflicts, concurrency and rollback. Preserve existing lesson gates and mastery semantics.
5. With authorized read-only coverage verification, prove complete private record/media preservation and every previously approved active route before cutover. Keep unresolved mappings explicit for staff; do not silently discard records or broaden student eligibility.
6. Switch existing URLs to the verified private provider, remove static fallback and exclude legacy raw payload/media from Pages only after coverage passes. Purge/deny stale service-worker paths. Roll back through a verified private version, never by restoring public raw data. Preserve the separate 1,104-record official pool independently.

## Limits and publication boundary

These are source-code findings, not production exploit proof. No production calls, credentials, imports, source edits, uploads or question removals were performed. The full per-question and asset manifests remain local. This compact note and its companion JSON contain counts, hashes, field names and code references only; they include no question text, answer values, rubrics or media bytes. Public Git history and previously downloaded copies remain a separate residual exposure.
