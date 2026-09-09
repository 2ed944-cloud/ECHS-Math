# ECHS First 30 Codex Tasks

## Execution record — 2026-09-08

- ECHS-001: complete; main rechecked at `fda45056e7b11e3f1d45bf96f7c8c36246d69e8d`. See `RUNTIME_INVENTORY_20260908.md` and its machine-readable JSON. `python tools/test_runtime_inventory.py` passed. No runtime/database changes in this slice.
- ECHS-002: implemented; portable baseline command runs 68 critical checks across core, lessons and bank suites. Runner failure/timeout/missing-input tests and Windows portability regressions included. Complete: PR #347 Linux baseline and all other triggered PR workflows passed before merge. See `BASELINE_VALIDATION.md`.
- ECHS-003: complete; PR #348 merged after seven passing PR workflows. PostgreSQL 15.19 executed all 21 migrations and 132 database checks; 48 malformed-registry cases passed. Main backend run 34189028803 applied `202609080001_curriculum_versions.sql` and passed health/login checks. No class assignments or current runtime adoption. See `CURRICULUM_DATABASE_FOUNDATION.md`.
- ECHS-004: complete; PR #349 merged after all five PR workflows passed. Schema CI run 34189228405 passed all 18 suites and exact generated-validator check; baseline and visual regression also passed. See `LESSON_SCHEMA_FOUNDATION.md`.
- ECHS-005: complete; PR #350 merged after all seven workflows passed; 12 renderer and 11 original-guard integration groups passed. PR #351 repaired clean-source fixture validation; Pages run 34191816882 and exact live module/route checks passed. Optional renderer remains disabled on existing lessons. See `LESSON_RENDERER_FOUNDATION.md` and `FOUNDATION_ACCEPTANCE_20260908.md`.
- ECHS-006: complete; PR #350 merged; 15 compatibility suites and exact pinned-source build passed on the integrated branch and final PR #351. Existing handcrafted AP and layered IB engines, questions, URLs and rollback remain intact. See `LEGACY_LESSON_COMPATIBILITY.md` and `FOUNDATION_ACCEPTANCE_20260908.md`.
- Audit-discovered sync repair: PR #346 merged after 13 successful PR workflows; account-owned queue/report-contract tests and backend/Pages deployment passed. See `MASTERY_SYNC_REPAIR_20260908.md`.
- ECHS-007: complete; PR #353 merged as `c483d759dee9009064524da083382580836f1638` after explicit approval and all 16 PR workflows passed. PostgreSQL 15.19 applied all 22 migrations and passed 235 database checks plus eight real HTTP/SQL groups; all 68 baseline checks and schema, API, renderer, guard and compatibility tests passed. Backend run 34211942548 and Pages run 34211942530 succeeded, along with all six live-lesson workflows. Public API health/access and exact Pages asset/route/exclusion checks passed. Secure persistence and immutable publication are deployed; existing routes keep their current renderer and no authoring UI was started. See `LESSON_PERSISTENCE_FOUNDATION.md`.

- ECHS-008: complete; PR #355 merged as `5ac22ec8e53221d6bf3fab4ea270368324ffbb04` after all 13 PR workflows passed. All 14 model, 20 session, 17 transport, 16 browser groups and 68 baseline checks passed. All nine main/deployment/live workflows and 15 public production checks passed; Pages run 34225060481 deployed the exact release. No database migration, publication change, student route cutover or private browser persistence. See `LESSON_STUDIO_FOUNDATION.md`.
- ECHS-009: complete through PR #356 and transport repair #357, final revision `d873f39b8c59bf495db6008dbed02a94c19f618a`. PostgreSQL 15.19 applied all 23 migrations with 235 original plus 203 new checks and eight original plus seven new HTTP/SQL groups. The repair routes those new integration checks through the actual production transport. All 19 original and nine repair PR workflows passed; all 12 repair main/live workflows and 33 final public checks passed, including the exact deployed authoring capability. No private authoring fixtures or current student-route cutover. See `LESSON_CONTENT_V2_FOUNDATION.md`.
- ECHS-010: complete; PR #358 merged as `33d90e6025946450e15e91afa16696ae5d245bf4`. All 22 final PR workflows, 16 production workflows and 92 public acceptance checks passed. PostgreSQL 15.19 applied all 24 migrations with 609 database checks and 20 real HTTP/SQL groups. Private media, publication attachments and safe video/table rendering are deployed. See `LESSON_MEDIA_FOUNDATION.md`.
- ECHS-011: complete; PR #359 merged as `1d42d363164c200277632c3d09a53e30e07450a6`. All 23 PR workflows, 17 production workflows and 80 public checks passed. PostgreSQL 15.19 applied all 25 migrations with 676 database checks and 25 actual HTTP/SQL groups. Bounded undo/redo and encrypted account-scoped device recovery are deployed. See `LESSON_DRAFT_RECOVERY.md`.
- ECHS-012: in progress; version comparison, restore-as-new-draft and publication controls using the existing immutable history and independent review gates. ECHS-013 onward have not started.

Rules:
- execute in dependency order;
- one coherent PR/branch slice at a time;
- never merge all tasks into one giant change;
- run current tests plus new tests;
- update this file with status/evidence.

## P0 — Architecture / safety

### ECHS-001 — Canonical runtime inventory
Map canonical directories, entrypoints, deployment flow, Supabase functions, lesson architectures, bank providers, tests, and archived/noncanonical copies.

Acceptance:
- machine-readable inventory;
- no production change;
- canonical vs archive paths identified.

### ECHS-002 — Baseline test command
Create one documented command/script that runs the critical existing validation suites relevant to platform work.

Acceptance:
- exit code reliable;
- output identifies failing suite;
- no removal of existing tests.

### ECHS-003 — Curriculum version schema
Add versioned curriculum model/migration without changing current user-visible curriculum.

Acceptance:
- AP Calculus 2026–27;
- AP Precalculus 2026–27;
- IB AI SL first-assessment-2021;
- future IB AI SL first-assessment-2029 placeholder;
- cohort/course-version assignment design;
- RLS reviewed.

### ECHS-004 — Lesson document JSON schema
Implement `echs.lesson.v1`.

Acceptance:
- validator;
- migration/version field;
- block registry;
- valid/invalid tests.

### ECHS-005 — Shared lesson renderer shell
Render an `echs.lesson.v1` document using existing platform auth/release behavior.

Acceptance:
- text/math/callout/layout;
- keyboard;
- responsive;
- KaTeX;
- deep links.

### ECHS-006 — Legacy lesson compatibility contract
Define adapters for handcrafted HTML and `LESSON_DATA`.

Acceptance:
- no URL breakage;
- legacy finish/practice behavior retained;
- adapter tests.

## P1 — Lesson Studio

### ECHS-007 — Secure lesson persistence
Create Supabase lesson/version/publication tables and secure API/RLS.

Acceptance:
- student cannot write;
- teacher scope enforced;
- published version immutable.

### ECHS-008 — Lesson Studio shell
Desktop authoring workspace with slide navigator/canvas/inspector.

Acceptance:
- create lesson;
- create/rename/reorder/delete slides;
- autosave state.

### ECHS-009 — Rich text and math blocks
Implement safe rich text and visual math entry.

Acceptance:
- no arbitrary script HTML;
- math validation;
- publish check.

### ECHS-010 — Media/table/resource blocks
Image, video, table, file/resource blocks.

Acceptance:
- alt text rules;
- safe external embed policy;
- asset failure handling.

### ECHS-011 — Undo/redo + autosave + offline draft
Account-scoped resilient editing.

Acceptance:
- no cross-account draft leakage;
- server conflict detection;
- retry state.

### ECHS-012 — Version history
Compare/restore/publish versions.

Acceptance:
- restore creates new draft;
- immutable publication history.

### ECHS-013 — Presentation mode
Full-screen class presentation from the same lesson document.

Acceptance:
- keyboard next/back;
- reveal;
- reset;
- reduced motion.

### ECHS-014 — Import IB `LESSON_DATA` reference lesson
Migrate one strong IB AI lesson.

Acceptance:
- visual/content parity documented;
- original URL works.

### ECHS-015 — Import AP Calculus 1.1 reference lesson
Use the complex interactive AP 1.1 lesson to prove adapter/plugin strategy.

Acceptance:
- six existing investigations preserved;
- question gating preserved;
- existing tests or equivalent pass;
- no mastery regression.

## P1 — Interactive mathematics

### ECHS-016 — Math component registry
Plugin interface for render/editor/validate/lazy-load/accessibility.

### ECHS-017 — Interactive graph block
Reusable function/point/slider/tangent/secant block.

Acceptance:
- authoring preset;
- student render;
- accessible text state.

### ECHS-018 — Parameter explorer
Reusable function-family parameter lab.

First use:
AP Precalculus polynomial/exponential/trig.

### ECHS-019 — Calculus accumulation/Riemann block
Reusable signed area/Riemann/accumulation module.

### ECHS-020 — 3D engine foundation
Three.js lazy-loaded math plugin with model/render separation.

Acceptance:
- WebGL fallback;
- cleanup;
- keyboard slice;
- unit tests.

### ECHS-021 — Washer/disk 3D template
Support shifted horizontal/vertical axes.

Acceptance:
- 2D/3D/formula sync;
- radius validation.

### ECHS-022 — Shell 3D template
Support representative shell and correct radius/height.

### ECHS-023 — Cross-section 3D template
Squares/rectangles/equilateral triangles/semicircles.

## P1 — Question engine

### ECHS-024 — Question provider abstraction
Normalize current public canonical and private providers without copying restricted content to public storage.

### ECHS-025 — Curriculum/practice/representation mappings
Add versioned mappings and coverage queries.

### ECHS-026 — Question QA pipeline v2
Extend current gates with:
- curriculum version;
- representation;
- misconception;
- calculator policy;
- originality status;
- accessibility.

### ECHS-027 — Assessment blueprint builder
Teacher filters by objective/skill/representation/difficulty/calculator/type.

### ECHS-028 — AI draft question workflow
“Generate similar” and “Qatar variant” as review-required drafts only.

Acceptance:
- independent solution validation;
- never student-ready automatically.

## P2 — Intelligence / identity

### ECHS-029 — Qatar Context Library
Versioned approved context/dataset registry + neutral/Qatar variant mechanism.

Acceptance:
- source/date/units;
- no fabricated production data;
- lesson studio insertion.

### ECHS-030 — Curriculum Coverage & Quality dashboard
Show:
- objectives without lessons;
- objectives without reviewed questions;
- representation gaps;
- practice gaps;
- calculator imbalance;
- AP FRQ gaps;
- IB structured-response gaps.

Acceptance:
Every chart/action leads to a concrete curriculum decision.

# Next wave after task 30

- misconception engine expansion;
- student representation profile;
- teacher intervention dashboard;
- AP exam simulation profiles;
- IB Paper simulation;
- calculator lab integration;
- scalable lesson migration by unit;
- design-system visual polish;
- performance budgets and telemetry;
- WCAG audit.
