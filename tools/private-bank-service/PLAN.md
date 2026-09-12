# Managed-service PostgreSQL matrix execution plan

Extend the accepted PR371 fixture with explicit PostgreSQL 15 and 17 jobs.
Preserve its complete 19-case JavaScript test, runtime pair, seed, TLS gateway,
27 ECHS migrations and all seven upstream initialization SQL mounts.

1. Reuse the exact source-bound upstream variants: PG15
   `supabase/postgres:15.8.1.085` and PG17 `supabase/postgres:17.6.1.136`.
   Keep Auth, PostgREST, Storage and imgproxy fixed. The official PG15 override
   changes only the database image, so both jobs use the same reviewed managed
   initialization and isolation configuration with fresh volumes. Preserve the
   upstream observation, license and notices.
2. Carry one typed configured major through planning, image resolution,
   execution, collection and CI packaging. Bind actual database numeric/full
   version observations before migrations and after the cases to that major,
   exact source tree and running image. Reject cross-major or inconsistent
   evidence; never patch a server response or relax a guard to accept either.
3. Retain historical source-base ancestry, while checking actual event base,
   merge parents, HEAD/tree, changed paths and all 57 source blobs. Permit a
   valid advanced-base merge whose tree differs from the feature-head tree.
   Add actual local Git regression coverage and nonancestor rejection.
4. Run all 20 safety, 20 fixture/collector, 11 CI and unchanged 10 TLS groups.
   Add typed/version/image mismatch controls and require byte-exact 19-case
   source/runtime hashes. Refresh exact source manifests and workflow hash.
5. Execute both jobs on disposable GitHub-hosted Linux runners, with no secrets
   or hosted project. Resolve immutable image digests, launch fresh owned
   services, require genuine managed schemas, apply unchanged SQL and run all
   19 cases. Keep TLS, fixed endpoints, bounded deadlines and complete cleanup.
6. Independently verify both actual run/job/artifact identities, all source
   hashes, selected/observed versions, image IDs, 19 successful outcomes and
   exact 11-member artifacts. A failure remains failed diagnostic evidence;
   it cannot be replaced by an expected-label list or the other major's result.

The new PG17 fixture tag differs from production metadata 17.6.1.147. This
matrix is a compatibility observation for the reviewed images, not a production
image or hosted Edge equivalence claim. No production SQL, fixture writes,
corpus import, private-question publication or student delivery is included.
The absence of a separate hosted test project remains a separate gate.

Primary sources are already retained byte-for-byte in `upstream-observation.json`:
[base Compose](https://github.com/supabase/supabase/blob/8c7a4d9dbbaf8b552893822e89d7bf06f33f9220/docker/docker-compose.yml)
and [PG15 override](https://github.com/supabase/supabase/blob/8c7a4d9dbbaf8b552893822e89d7bf06f33f9220/docker/docker-compose.pg15.yml).
The upstream tag is unsigned; recorded tag/tree/blob identities are provenance,
not a signature attestation. Passing these tests does not close whole C08.
