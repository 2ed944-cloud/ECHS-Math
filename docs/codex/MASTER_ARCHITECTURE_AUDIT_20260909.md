# Master charter: current architecture and execution

The expanded charter continues the existing product. ECHS-001–014 are verified for their original scopes at main `99a0e6582cd82941a03c7d5cc2ec4517def62bb7`. The complete charter is **not complete**. The next release work is C01 official-bank artifact containment, followed by C02 truthful mastery reporting, C08 legacy private delivery, and the C03/C04 grading/account-storage foundations. ECHS-015 has a preserved design only.

The [machine execution board](MASTER_EXECUTION_PLAN.json) records 71 tasks, all 65 numbered sections present in the supplied charter, all 26 component families, dependencies, acceptance, implementation locations, tests, deployment, rollback and limits. Section 53 is absent from the user's original text; no section was invented. Existing ECHS-001–030 IDs and sealed handoffs retain their original meaning.

## Source and release evidence

- Actual GitHub main was re-read after the charter: `99a0e6582cd82941a03c7d5cc2ec4517def62bb7`, tree `5e3b3f5a87147462401be6a567cbee0feb256750`.
- [PR #362](https://github.com/2ed944-cloud/ECHS-Math/pull/362) merged ECHS-014. Its final 20 PR workflows, 16 main workflows, 68 baseline checks, 676 database checks, 46 HTTP/SQL groups, 41 import browser groups and 164 public checks passed. The 84 final screenshots were reviewed. [Pages run](https://github.com/2ed944-cloud/ECHS-Math/actions/runs/34366194174) deployed that revision. This is historical scoped evidence, not a new test of every charter feature.
- [Source baseline](MASTER_SOURCE_BASELINE_20260909.json) records 484 unique selected canonical files matched byte-for-byte to main Git blobs before repair edits. This combines 439 platform/runtime/tooling files and 69 AP source/resource files with overlap. It is not a whole-tree or private-content audit.
- Local git HEAD is a source reconstruction baseline, not production evidence. Publication uses explicit path manifests and exact GitHub blob comparison; unrelated local files are not staged or published.
- The [subsystem inventory](MASTER_ARCHITECTURE_AUDIT_20260909.json) and [AP preservation audit](AP_CALCULUS_U2_U5_AUDIT.md) contain metadata and hashes. Extracted questions, solutions, rubrics and private learner records are excluded.

## What exists and what remains

| Area | Existing system to retain | Unmet charter requirement |
|---|---|---|
| Runtime/deployment | Static HTML/CSS/JS, `data/courses.js` plus course overlays, guarded legacy routes, GitHub Pages build, Supabase private services | Close the artifact boundary around raw question sources and packaging copies; investigate public history separately |
| Curriculum | Versioned curriculum/course registry, cohort pin design; active 2026–27 AB/BC, Precalculus and IB AI SL 2021; separate future IB 2029 | Comprehensive authoritative objective/question/representation mappings and Grade 9/10 school pathways |
| Lesson document | Closed `echs.lesson.v1`, generated validators, 8 basic block types across 11 type/version definitions | Question, worked-example, interactive and governed answer-release blocks |
| Studio | Authenticated private drafts/publication, slide operations, text/math/media/table/resource, undo/recovery, version history and presentation | Full section/objective authoring, review workflow, interactive editors and scalable legacy migration |
| Imports | IB 1.3: 20 native explanations plus 58 legacy references across 78 positions; unchanged original route and questions | AP 1.1 executable reviewed adapter; imported references remain publication-blocking |
| Components | Rich lesson-specific graph/SVG/model investigations and reusable Precalculus Toy Car code | Stable Math Component Registry and its 26 reviewed families; current basic registry has no interactive entries |
| 3D | Useful spatial diagrams and SVG projections | Production model/WebGL engine, synchronized region/axis/slice/formula/solid, rotation/build controls, shifted-axis mathematics and tested fallback/disposal |
| Questions | Canonical strict publication pipeline, provenance/trust metadata, public and private providers, current 1,104 approved public records | Safe distribution, normalized providers, complete QA/mappings, assessment blueprints and reviewed AI drafts |
| Readiness | Four IB AA/AI SL/HL models, distinct readiness/completeness, MAP/MYP/30-question server diagnostic, snapshots and scopes | Real tenant/concurrency acceptance, version linkage, AP Precalculus and separate AB/BC models, executable preparation/reassessment routes |
| Learning | Authenticated sync, server score recomputation, confidence/representation/time counters, mistake/review scheduling | Honest provisional status, authenticated grading receipts, account ownership for all legacy stores, evidence-based certification and recovery |
| Routing/reporting | Deterministic Support/Core/Challenge routes, student/parent/teacher views and heatmaps | Evidence-authoritative inputs, curriculum readiness integration and actionable longitudinal interpretation |
| AI | Six modes, Guide default, bounded image/paste, vision handling and safe rendering | Server assessment permits, assistance telemetry, account cleanup and documented pedagogical/vision acceptance |
| Qatar | Contextual lesson stories and useful mathematical models | Approved versioned context/dataset registry, raw data/transform/source/date/units/license records and answer-stable neutral/Qatar variants |

Canonical routes and services remain those mapped in [runtime inventory](RUNTIME_INVENTORY_20260908.md). The new audit adds findings; it does not replace that inventory or erase historical acceptance.

## AP Calculus Units 2–5 preservation

The authoritative route overlay identifies 18 teaching lessons, 4 assessment HTML routes and 4 PDF review entries. The source audit inventories **1,331 slide sections, 168 MCQs and 24 FRQs**, with 69 exact main source/resource bindings. Related Rates contains 115 scene widgets; Optimization contains 151 model panels and 151 writing canvases. Linear Approximation, L'Hôpital's Rule and derivative analysis also contain substantial existing interaction.

These are source observations, not independent answer checks or exact AP alignment certification. The proposed A–F categories require per-lesson mathematical and browser review before implementation. All explanations, examples, questions, FRQs, challenge work, calculator expectations, context and interaction sequences must be retained. AP 1.7–1.16 remains a named migration task after the foundations, with reviewed original questions and current authoritative scope.

The existing Pages build excludes top-level `reviews/`. Four review catalog entries and eight review PDF references therefore describe available source files, not verified deployed links. Do not enable them without content and rights review. The AP assessments and Optimization notes/images also expose legacy account-storage work for C04.

## First repairs and scope limits

**C01 — official-bank artifact.** Raw canonical questions and admin overlays are copied by the existing build, although the student UI selects an approved projection. The archive redaction uses a denylist that leaves extra content-bearing fields. The repair builds a closed official-bank projection, preserves approved records and archive identities, computes transitive media dependencies, keeps teacher/import URLs as approved public review shells and removes denied cached paths and stale same-URL archive/shell bytes. It does not delete canonical lesson/bank sources or change the publication gate. A public repository's current source/history and source-page media visual scope remain separate C05 risks. C01 is not a claim that all platform private-content distribution is fixed.

**C08 — legacy private delivery.** The broader audit found 70 payload JSON files under legacy `question-bank/data/source`, `ap`, `courses` and `review`: 15,123 occurrences of 5,882 unique questions, plus 22,777 textbook assets. These are used by the current catalog/static provider and private-API failure fallback. Of the records, 403 Pearson items explicitly specify `commercial_publisher_resource_private_use_only`; 5,479 others lack `source_license`. The public private-bank registry is empty metadata and does not prove private import coverage. Preserve active availability by verifying authorized private packages, media and permissions before cutover. Do not run the current exact-replacement uploader as a dry run: source review found stale-ID deletion, visible question upserts before media completion and non-versioned/non-organization storage keys. Private delivery also needs active class/version release acceptance. These are code-review findings requiring actual DB/API tests, not claimed production exploits. No production import was run.

**C02 — truthful status.** Running the actual current mastery handler against a synthetic database reproduced a score of 93 from fully hinted practice labeled Mastered, and a score of 97 from caller-claimed unaided/challenge events setting legacy `verified=true` with no verified-question evidence. Scope/authentication works, but server recomputation still interprets client correctness/help/mode/time claims. C02 keeps scores/history and makes current records explicitly provisional in API/UI labels and counts. It does not certify attempts.

**C03/C04 — authority and ownership.** Append-only server grading receipts must bind authorized questions, assignments, actors, versions and time. Unknown assistance or unverifiable offline events remain provisional. Existing raw records are not automatically promoted. Legacy learning, assessment, drawing/image and tutor stores need account-bound lifecycle tests; queue/Studio fixes do not prove those separate stores safe.

No new database migration is part of this audit or the bounded C01/C02 read/artifact repairs. C03 and later schema work require reviewed forward/rollback migrations, real isolated PostgreSQL and actual handler acceptance. No production student/parent/private authoring fixture or live AI request was used for the audit.

## Board validation and continuation

Run `python tools/validate_master_execution_plan.py` and `python tools/test_master_execution_plan.py`. The 22 negative/positive tests reject lost dependencies (including omitted Assessment Studio/AI drafts at the final gate), cycles, fake verified status, missing deployment evidence, unknown components, lost charter sections, unsafe paths and false overall completion. These checks validate tracking integrity; they do not certify mathematical or production behavior.

In-flight work remains IN PROGRESS until its real acceptance and deployed revision are recorded in a later board snapshot. Every new release uses one coherent manifest, current baseline/regression tests, targeted failure/permission/browser checks and exact post-merge verification. Previously sealed outputs are not regenerated from a changed working tree.

The first implementation cycle under this charter is C01, already underway. C02 can develop in isolated owned files while C01 is tested. Merge and deploy them separately. C08 private delivery and C03/C04 grading/ownership precede AP 1.1 adapter implementation, followed by the shared component and curriculum work in dependency order. The full program remains open until ECHS-062 has actual evidence for every required task.
