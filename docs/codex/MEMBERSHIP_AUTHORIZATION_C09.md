# C09 membership authorization and atomic roster replacement

Status: **VERIFIED** at main `21478287590fcc04ac8000180aef0f1fe91e79b8`, tree `f182333c9f86286b78623ddb8947f61aea868534`. [Sealed release metadata](MEMBERSHIP_AUTHORIZATION_C09_RELEASE.json) records all 15 PR workflows, 17 post-merge workflows, 68 baseline checks, 55 PostgreSQL checks, 7 actual HTTP/SQL groups and 15 read-only production checks passing. This separate release contains no C02 mastery-label or C08 question-storage changes. The implementation below describes that sealed C09 snapshot; later C02 composition retains its authorization contracts.

## Problem and resulting behavior

The original `class_memberships` table has separate class/account foreign keys and a membership-role constraint. These do not require a shared organization or the account's actual role. The roster endpoint authorized the class, then deleted and inserted memberships in separate requests using caller-supplied account IDs. A failed insert could therefore leave the previous roster removed. Report scopes could also trust malformed legacy memberships. These are source and synthetic-fixture findings; no production roster or learner record was inspected.

The replacement endpoint retains its existing URL and `ok`/`members` response fields and adds the versioned `echs.membership.v1` contract. One service-only SQL function authenticates the current school session, locks the active actor and session, verifies an active class in the same organization, and requires teacher callers to hold a real teacher membership. Every requested member must be an active account of the requested role in that organization. Duplicates collapse, conflicting roles reject, teachers retain their own membership, and administrators may explicitly choose an empty roster. Unchanged memberships retain their original join timestamps.

All removal and insertion occurs in one transaction. Rejected inputs, expired sessions and insertion failures preserve the prior roster. Class locks serialize competing replacements; account/session locks protect authorization while waiting for concurrent changes. A retry after a lost acknowledgement can repeat the same desired roster without duplicating members or changing retained join timestamps.

The institutional and mastery handlers also constrain membership-derived reads by actual account role and organization, and constrain associated records by organization. Existing malformed rows cannot grant these handlers access. Valid owner, staff, student and parent behavior remains covered separately; inactive historical student reports retain their existing behavior where authorized.

## Files and migration

- `supabase/migrations/202609090002_membership_authorization.sql`: adds `api_replace_class_memberships(text,uuid,uuid[],uuid[])` and the data-free `api_membership_capabilities()` function.
- `supabase/functions/institution-api/index.ts` and `supabase/functions/mastery-evidence/index.ts`: scoped reads, atomic roster transport and safe failure responses.
- `tools/test_membership_authorization_api.mjs`, `tools/test_membership_authorization_database.py`, `tools/test_membership_authorization_e2e.mjs` and `tools/membership_authorization_rpc_fixture.py`: actual-handler fixtures and isolated PostgreSQL transaction tests.
- `.github/workflows/membership-authorization.yml`: actual handler tests, Deno entrypoint checks and PostgreSQL 15 acceptance with all 25 prior migrations plus C09.
- `.github/workflows/deploy-institution-backend.yml`: verifies the exact membership transport/database capability after the existing migration and Edge Function deployment steps.

The migration adds two functions only. It performs no backfill, roster cleanup, table-grant expansion, content publication, curriculum change or mastery award. The existing deployment applies migrations before deploying functions. The future C08 snapshot migration uses version `202609090003` and is excluded from this release.

## Validation and security acceptance

Run the actual handler suite with `node tools/test_membership_authorization_api.mjs` and both entrypoint checks with `deno check supabase/functions/institution-api/index.ts supabase/functions/mastery-evidence/index.ts`. For database acceptance, provide `ECHS_MEMBERSHIP_TEST_DSN` pointing to a new PostgreSQL 15 loopback database whose name begins `echs_membership_test`, then run `python tools/test_membership_authorization_database.py --report reports/membership-authorization-database.json` followed by `node tools/test_membership_authorization_e2e.mjs`. The database runner refuses a nonempty public schema or a non-loopback database. A `--static-only` result is explicitly **not** database acceptance.

Required checks cover foreign and wrong-role memberships, session expiry/revocation, active-class requirements, target-account changes while waiting on locks, administrator empty rosters, teacher self-retention, duplicates, insertion rollback, retry after lost acknowledgement, competing replacements and unchanged historical rows/grants. The HTTP/SQL fixture invokes the real handler and real service-role RPCs through a closed adapter; it does not claim to test the Supabase SDK's network implementation. Fixtures use generated synthetic IDs and no production credentials.

The unauthenticated, non-cacheable `GET /institution-api/health/membership` exposes only `{ok:true,service:"echs-institution-api",membership_capabilities:{contract:"echs.membership.v1",atomic_replacement:true,tenant_scoped:true}}`. It returns 503 when the expected RPC/grants are unavailable. It reveals no roster, account, session, organization, question or answer data. SQL execution is revoked from public, anon and authenticated roles and granted only to the existing backend service role; the transaction still validates the user's school session.

## Migration and rollback

Preserve the current source and exact release manifest. The additive migration can remain installed if a handler deployment must be rolled back; existing tables and rows are unchanged. Restoring the original roster handler also restores its authorization/atomicity defect, so prefer a forward repair or temporarily fail closed on roster writes while retaining the new read scopes. Do not automatically run a destructive down migration or delete memberships. Once no deployed code depends on the new RPCs, a separately reviewed rollback may revoke and drop only these two exact function signatures. Never remove shared account/session functions or prior migrations.

## Remaining limits

Existing malformed memberships are denied where checked but are not automatically repaired. Other private question-provider, readiness and parent-management boundaries require their own acceptance; C09 is not a blanket authorization certification. C02 still must project client-reported learning as provisional, and C03 must add authenticated grading evidence. No lesson, question body, private answer, student record or account secret is added to public assets by C09. Real database and HTTP/SQL acceptance, independent review, exact merged-source verification, successful deployment and the production capability response are recorded in the sealed release metadata.
