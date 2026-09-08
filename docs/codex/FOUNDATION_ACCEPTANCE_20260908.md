# ECHS-001–006 acceptance record — 8 September 2026

**ECHS-001 through ECHS-006 are implemented and merged after their acceptance tests passed. ECHS-007 has not started.**

Final runtime source: `68710642a83d292e67f48b40286236e987d113b6`. Production deployment verification is recorded below.

## Delivery and acceptance

| Task | Delivered foundation | Evidence |
|---|---|---|
| ECHS-001 | Canonical runtime, deployment, institutional services, auth, mastery/sync, question publication/provider, legacy architecture and test inventory | [PR #345](https://github.com/2ed944-cloud/ECHS-Math/pull/345); `RUNTIME_INVENTORY_20260908.md` and JSON; inventory test |
| ECHS-002 | Portable fail-closed 68-check command; isolated activation fixture; Windows file-URL/filename portability | [PR #347](https://github.com/2ed944-cloud/ECHS-Math/pull/347); `BASELINE_VALIDATION.md`; 13 runner and 3 manifest-case tests included |
| ECHS-003 | Four curriculum snapshots, five explicit course versions, tenant-consistent immutable class pin history | [PR #348](https://github.com/2ed944-cloud/ECHS-Math/pull/348); [PostgreSQL CI](https://github.com/2ed944-cloud/ECHS-Math/actions/runs/34188711084); [production migration](https://github.com/2ed944-cloud/ECHS-Math/actions/runs/34189028803) |
| ECHS-004 | Closed `echs.lesson.v1` schema, explicit versions, block registry, safe static validator | [PR #349](https://github.com/2ed944-cloud/ECHS-Math/pull/349); [18 schema suites and exact build](https://github.com/2ed944-cloud/ECHS-Math/actions/runs/34189228405) |
| ECHS-005 | Opt-in accessible text/math/callout/layout renderer, keyboard/deep links, existing release/auth/finish behavior, independently bound document/route | [PR #350](https://github.com/2ed944-cloud/ECHS-Math/pull/350); 12 renderer and 11 original portal/guard integration groups; desktop/mobile evidence |
| ECHS-006 | Read-only AP handcrafted and final layered IB `LESSON_DATA` contracts, conservative conversion and exact rollback | [PR #350](https://github.com/2ed944-cloud/ECHS-Math/pull/350); 15 adapter suites and exact hash-pinned fixture generation |

The separately reviewed [sync repair, PR #346](https://github.com/2ed944-cloud/ECHS-Math/pull/346), corrected a reproduced global bridge queue/report mismatch. Account-owned snapshots retain raw attempts, sessions, review and explicit completion across offline retries, account changes and frontend/backend rollout skew. It does not migrate every legacy raw local-storage key or confer mastery from viewing.

Final PR #350 head `8700a60d387eade1fa42dc1b352270eb96154b38` passed all seven workflows: [68-check baseline](https://github.com/2ed944-cloud/ECHS-Math/actions/runs/34190229151), [schema](https://github.com/2ed944-cloud/ECHS-Math/actions/runs/34190229161), [renderer and original guard](https://github.com/2ed944-cloud/ECHS-Math/actions/runs/34190229204), [compatibility](https://github.com/2ed944-cloud/ECHS-Math/actions/runs/34190229164), [visual regression](https://github.com/2ed944-cloud/ECHS-Math/actions/runs/34190229168), platform foundation and independent bank audit. One baseline setup correction installed the already-pinned fixture dependencies; the link checker was retained and validated all 1,842 references. No failed check was skipped.

The main Pages build after PR #350 failed before deployment because two development fixtures referenced an uninstalled stylesheet. [PR #351](https://github.com/2ed944-cloud/ECHS-Math/pull/351) repaired clean-source validation using the existing committed KaTeX stylesheet and its matching pinned test engine; it also added foundation PR path filters without changing Pages job steps or artifact exclusions. All six repair PR workflows passed, including the [clean source and exact-artifact build](https://github.com/2ed944-cloud/ECHS-Math/actions/runs/34191586496), [68-check baseline](https://github.com/2ed944-cloud/ECHS-Math/actions/runs/34191586509), schema, renderer/guard, compatibility and bank audit.

[Production Pages run 34191816882](https://github.com/2ed944-cloud/ECHS-Math/actions/runs/34191816882) succeeded at runtime revision `68710642a83d292e67f48b40286236e987d113b6`. Public read-only verification at 2026-09-08T05:47:46.724822+00:00 confirmed the exact deployment identity. Six MJS modules, the canonical JSON schema and stylesheet returned HTTP 200 with correct MIME types and source-identical SHA-256 hashes. Existing AP 1.1/1.7/1.16 and IB 1.3 routes returned HTTP 200 with original portal/release guards and no new-runtime imports. Six known tools fixtures returned HTTP 404. All six existing live-lesson workflow checks also passed. This verifies public delivery and preserved guards, not private account or production database authorization. A subsequent documentation-only closeout does not change these runtime bytes.

## Preservation

The initial main revision was `fda45056e7b11e3f1d45bf96f7c8c36246d69e8d`. A source comparison against its exact archive checked 1,120 selected existing files: 1,119 remain byte-identical, including all 906 lesson files, 21 catalog/data files, existing portal/access guards and canonical bank data/rights/gates. The only selected change is five intentional Pages pull-request path filters. The entire jobs block, including every job step, artifact exclusion and deployment command, is byte-identical; removing only those five added filter lines recovers the original full workflow. There were no added/deleted lesson files. A literal-reference scan of 274 original HTML files and 652 original JavaScript/module files found no new-runtime references. The two intentionally repaired sync modules were recorded separately.

The existing Pages build/deployment path remains canonical. Test fixtures and build dependencies remain under the existing `tools/` exclusion. New renderer modules are available for future integration but are not imported by current lessons. No framework rewrite, Lesson Studio UI, private question migration or question-gate expansion occurred.

## Database and security

`supabase/migrations/202609080001_curriculum_versions.sql` adds `curriculum_versions`, `course_versions` and `class_course_version_assignments`, plus two composite tenant indexes. It seeds metadata only and inserts zero class assignments. Current catalogs, legacy course keys and evidence are not rewritten; existing readers do not import the new registry.

PostgreSQL 15.19 executed all 21 migrations and 132 database check groups. Registry tests rejected 48 malformed cases. Real role/grant/RLS tests, tenant/actor FKs, immutable records/history, future/archived/retired restrictions, replacement rollback and legacy-row preservation passed. The first test run found an omitted required timestamp in a fixture; fixing that fixture did not weaken production constraints. Production deployment logs confirm the new migration applied and all 11 functions deployed, with nine health endpoints and login/session diagnostics passing. Those deployment logs are not a fresh production data/grant audit.

ECHS retains custom school-session authorization; new code must not substitute `auth.uid()` assumptions. The three new curriculum tables deny direct PUBLIC/anon/authenticated access, verified with actual roles in isolated PostgreSQL tests. This does not establish all legacy production grants. Stored administrator validation does not authenticate a browser user: ECHS-007 must derive actor and organization from the verified session.

Public document validation is not server proof of publication. Private answers/teacher material remain outside public snapshots. Controlled text can still contain sensitive information; the later authorized publication workflow must enforce classification. The renderer also requires an independently authorized route/document/revision/course binding and does not forward an access key to a different legacy lesson.

## Curriculum scope

Active snapshots include AP Calculus AB, AP Calculus BC, AP Precalculus for 2026–27, and IB AI SL first-assessment-2021. IB first-assessment-2029 is a separate future-only placeholder. College Board and IB sources were rechecked before coding; provenance and unknown date boundaries are retained in `CURRICULUM_SOURCES_20260908.md`. Source verification is metadata acceptance, not certification of every old lesson/question or a full objective import.

## Revalidation commands

Install the pinned dependencies documented in `BASELINE_VALIDATION.md` and the two tool READMEs. Then run:

```sh
python tools/validate_baseline.py --json-report .baseline-results/baseline.json
node tools/test_curriculum_registry.mjs
node tools/lesson-runtime/build-validator.mjs --check
node tools/lesson-runtime/test-schema.mjs
node tools/lesson-runtime/test-renderer.mjs
node tools/lesson-runtime/test-guard-integration.mjs
node tools/lesson-compatibility/build-fixtures.mjs --source-root . --check
node tools/lesson-compatibility/test-compatibility.mjs
```

The separate PostgreSQL gate requires an explicit disposable loopback PostgreSQL 15 database and pinned psycopg driver. Follow `CURRICULUM_DATABASE_FOUNDATION.md`; the test refuses a production-like/nonempty database. `--static-only` does not count as database execution. CI retains renderer screenshots/results and database output artifacts.

## Rollback and remaining risks

Keep current lesson URLs/engines and the disabled renderer opt-in. Adapters retain the exact original URL and original interactions. They export draft references rather than replacing question engines. No views, reveals or local self-scores are imported as mastery.

Leave the unused additive curriculum history tables intact for rollback; insert corrected reviewed snapshots or forward migrations rather than rewriting/dropping history. Class replacement is a supersede-plus-insert transaction. Do not automatically repin current cohorts. Retain the repaired sync client during a backend rollback so unsupported completion snapshots remain queued.

Remaining legacy risks are documented, not silently claimed fixed: raw global learning/completion storage ownership; unversioned AB/BC/progress identities; client-supplied evidence correctness/context; older membership/tenant/transaction and access-alias inconsistencies; public historical/admin-looking packaging; and local IB readiness that includes viewing. The source inventory is not proof of live exposure. Separate reproductions and narrowly reviewed changes are required. These findings do not authorize public storage of private authoring data.

## ECHS-007 readiness

**Ready for ECHS-007 implementation; NOT STARTED.** ECHS-001–006 acceptance is complete. This readiness permits the next architectural task, not a production authoring rollout or visual Lesson Studio work. The remaining legacy risks documented above must not be carried into new authorization or evidence contracts.

ECHS-007 must implement secure lesson/version/publication persistence and its authorized API, deny student writes, enforce teacher/organization scope, and keep published versions immutable. It must establish the renderer's server-authorized document/revision/route binding. No such tables, endpoints, authoring UI or lesson cutover were added during this cycle. ECHS-008 and later Lesson Studio work also remain unstarted.
