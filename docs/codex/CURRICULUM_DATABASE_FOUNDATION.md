# ECHS-003: additive curriculum snapshots and explicit class pins

This slice adds metadata and an unused lookup module. It does not import the module into the portal, rewrite existing course keys, assign existing classes, migrate evidence, or change current authentication, mastery or publication behavior.

## Source and version boundaries

The registry records four curriculum snapshots and five course snapshots. AP Calculus AB and BC have separate course identities and scopes under the shared 2026–27 curriculum edition. AP Precalculus has its own version. The active IB AI SL version is first assessment 2021. IB first assessment 2029 is a separate future placeholder with no imported objective mapping or active-cohort use.

Verified source URLs, retrieval dates and record source references are in `curriculum/registry/course-versions.v1.json`. The authoritative research handoff is [CURRICULUM_SOURCES_20260908.md](CURRICULUM_SOURCES_20260908.md); its facts were reviewed before this draft. Source checking is not publisher endorsement or a claim that all existing lessons meet every objective. No protected AP Classroom or IB question text is included. Unknown assessment cutoffs and exact effective dates remain null; calendar changes never activate a version automatically.

## Schema and identities

- `curriculum_versions`: immutable curriculum UUID/key, family, status and verified metadata record.
- `course_versions`: immutable course UUID/key, explicit curriculum UUID, separate course code, status, placeholder flag and metadata record. An active course cannot reference a future or retired curriculum.
- `class_course_version_assignments`: explicit organization UUID, existing class UUID, course-version UUID, existing administrator UUID, reason and state. New rows may be `planned` or `active`. Existing rows may only become `superseded`; identity/history cannot be rewritten or deleted.

Existing `organizations.id`, `classes.id` and `accounts.id` are UUIDs. The two additive unique indexes on `(organization_id,id)` permit declarative composite tenant foreign keys. Named class and actor constraints are `curriculum_assignment_class_tenant` and `curriculum_assignment_actor_tenant`. Separate named organization/course FKs prevent orphan assignments. No legacy field is replaced.

An active pin requires an active class, active course and active parent curriculum, with no placeholder. A future course can receive an explicit planned pin. Planned pins cannot be changed directly to active, and a superseded pin cannot be reactivated. Adoption requires a reviewed new immutable snapshot and a new explicit pin. One active pin per organization/class is enforced by the partial unique index.

## Required metadata and immutable records

SQL checks explicitly reject missing/null identity fields; they do not rely on nullable SQL equality. Required text fields must be JSON strings with nonempty trimmed values. `source_references` must be a nonempty array of distinct, nonempty strings; `verified_at` must be a valid ISO date. Curriculum records require edition, first assessment, verifier and verification kind, plus explicit nullable end/effective fields. Course records require correctly typed placeholder flag, school-year/profile fields, and a nonempty scope object. A non-placeholder course requires a nonempty assessment section array.

Placeholder records must remain future, with null school year/assessment profile, `objective_mapping_status: not_imported` and `current_cohort_use: false`. Registry tests additionally resolve references to declared authoritative sources and parents. SQL validates provenance structure and immutable linkage; it does not itself verify publisher URLs, grant copyright rights or establish human approval.

Row triggers reject all metadata updates/deletes, including attempted status changes. `service_role` has no TRUNCATE privilege. To correct metadata, insert a new reviewed version rather than disabling triggers or modifying historical snapshots.

## Security and RLS

ECHS uses custom school accounts, not Supabase Auth user IDs. New tables enable RLS with no direct-user policies, and explicitly revoke privileges from PUBLIC, `anon` and `authenticated`. The existing Edge service-role boundary remains the only integration path. No new endpoint is introduced in this slice.

The assignment trigger validates that the stored `assigned_by` account is an active administrator in the same organization when a pin is inserted. This is **not** authentication of a browser user. A service-role connection is privileged; a future Edge endpoint must verify the existing hashed school session, require the current administrator role, and derive `assigned_by` and `organization_id` from that session. It must not accept those identities from request JSON. RLS tests exercise real PostgreSQL grants and role behavior; they do not claim a fabricated client identity has authenticated successfully.

Superseding is a historical state operation. A future API must authorize its current actor separately; the original `assigned_by` field remains unchanged. This permits cleanup of old pins without rewriting the original actor after an account is deactivated.

## Executable PostgreSQL 15 gate

`.github/workflows/curriculum-database.yml` starts a disposable PostgreSQL 15 service and installs pinned `psycopg[binary]==3.2.9`. `tools/test_curriculum_database.py` refuses non-loopback hosts, databases without the `echs_curriculum_test` prefix, PostgreSQL versions other than 15, and databases that already contain public tables. It requires an explicit test DSN; it never discovers production configuration or credentials.

The fixture creates only the Supabase infrastructure needed by the existing migrations: non-login `anon`/`authenticated` roles, a non-login `service_role` with PostgreSQL BYPASSRLS (matching the privileged Edge boundary), an unprivileged PUBLIC-grant probe role, `storage.buckets`, and the `extensions` schema with real pgcrypto. It applies all 20 existing migrations without editing them, inserts clearly marked baseline fixtures, then applies the new migration. Tests use actual `SET LOCAL ROLE`, SQLSTATE errors, row comparisons and rollback behavior. No authorization result is mocked.

Coverage includes direct SELECT/INSERT/UPDATE/DELETE/TRUNCATE denial; RLS filtering even when SELECT is temporarily granted; service-role allowed operations; immutable records and pin history; required metadata/type/source checks; class and actor tenant FKs; non-admin/inactive actor rejection; archived/future/retired active-pin rejection; explicit planned future pins; duplicate active pins; failed and successful supersede/new-pin transactions; and preservation of every legacy table's rows before/after the migration and assignment tests.

Local commands after integration:

```sh
node tools/test_curriculum_registry.mjs
python tools/test_curriculum_database.py --static-only
ECHS_CURRICULUM_TEST_DSN='postgresql://postgres:fixture-password@127.0.0.1:5432/echs_curriculum_test_local' python tools/test_curriculum_database.py --report reports/curriculum-db-tests.json
```

During draft staging, pass `--legacy-root ../foundations` from the draft root, or the appropriate absolute audited repository path. Static-only output explicitly says **DATABASE NOT RUN**. It is not a replacement for the PostgreSQL CI gate. No PostgreSQL server, psql, Docker or Podman was available in the local Windows environment during drafting; database execution must pass in the isolated CI service before merge.

## Migration, rollout and rollback

The existing main-branch backend workflow auto-applies migrations. This migration therefore must not merge before the isolated database job passes. Keep it disconnected from all runtime readers and writers in ECHS-003. The initial migration inserts zero class assignments.

Replacing an active pin is one service-role transaction: supersede the old row, then insert the explicitly reviewed replacement. If the second insert fails, roll back the entire transaction; the original pin remains active. To return to an earlier valid course snapshot later, supersede the current pin and insert a new active pin referencing that earlier snapshot. Preserve every old row.

The initial safe rollback is to leave these unused additive tables in place and omit future runtime integration. Do not drop version history, rewrite old records, remove constraints, or automatically reassign classes. An eventual corrective schema change requires a reviewed forward migration and the same database gate. Existing lessons, URLs, completion/evidence keys, and current IB cohorts remain unchanged.
