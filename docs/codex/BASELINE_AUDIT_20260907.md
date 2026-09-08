# Baseline Audit — ECHS Mathematics
Date: 7 September 2026  
Repository: `2ed944-cloud/ECHS-Math`  
Observed main commit: `fda45056e7b11e3f1d45bf96f7c8c36246d69e8d`

This is a working baseline for Codex. Recheck the repository before implementation because main may move.

## 1. Product already present

ECHS is not a blank/static mockup.

Observed capabilities include:
- GitHub Pages student/lesson portal.
- Secure sign-in shell and institutional account integration.
- Supabase Edge Functions.
- student/teacher/admin/parent access model.
- class/course membership controls.
- lesson publication/release controls.
- lesson workspace/search.
- practice and assignment tooling.
- multi-bank / multi-lesson teacher workflows.
- mastery evidence.
- learning event/session/review synchronization.
- offline queue behavior.
- Smart Learning Route with Support/Core/Challenge.
- service-worker and privacy-sensitive cache handling.
- release and behavior validation suites.
- public canonical and private course-specific question-bank paths.

Do not recreate these under new names.

## 2. Current front-end architecture

The public student surface is predominantly static HTML/CSS/JavaScript served by GitHub Pages.

Current lessons are heterogeneous.

Examples:
- AP Calculus Topic 1.1 is a handcrafted 33-slide HTML deck with separate lesson CSS/model/questions/runtime JS, interactive graphs, response gating, FRQ rubrics, keyboard behavior and tests.
- Parts of IB AI use a `window.LESSON_DATA` data model plus shared/apply scripts.
- Other course/pathway lessons use additional generated or lesson-specific patterns.

This heterogeneity is the central obstacle to a true no-code Lesson Studio.

### Recommendation
Do not migrate every lesson immediately.

Introduce:
1. canonical lesson document schema;
2. schema renderer;
3. authoring interface;
4. legacy adapters/importers;
5. gradual lesson migration.

## 3. Current backend/security architecture

Supabase is already part of the platform.

Observed Edge Function families include:
- `account-api`
- `setup-api`
- `learning-sync`
- `mastery-evidence`
- `practice-bank-api`
- `upload-manager-api`
- diagnostics/support functions

Private practice banks are stored in private Supabase storage/database rather than treated as public Pages assets.

This is a strong foundation for:
- Lesson Studio persistence;
- curriculum tables;
- versioned lesson documents;
- question drafts/review;
- private teacher assets;
- student evidence.

Do not create a second backend unless a documented need exists.

## 4. Current access model

Observed role model:

### Student
- assigned courses/classes;
- assigned course lessons;
- unlocked/completed practice;
- own timetable/progress.

### Teacher
- all course/lesson access;
- assignment and practice controls;
- own timetable;
- class management.

### Administrator
- all course/lesson/practice access;
- school-wide administration and timetable visibility.

### Parent
- linked-student reporting.

### Guest
- sign-in gateway only.

New authoring permissions should extend this model rather than bypass it.

Recommended additional capability scopes:
- `lesson:create`
- `lesson:edit:own`
- `lesson:edit:shared`
- `lesson:publish`
- `curriculum:manage`
- `question:draft`
- `question:review`
- `question:publish`

Roles can map to capabilities.

## 5. Mastery / Smart Learning Route

Existing Smart Learning Route is deterministic and based on trusted evidence:
- current/next mathematics period;
- teacher assignment;
- prerequisite lesson signal;
- mastery;
- accuracy;
- open mistakes;
- spaced review.

Routes:
- Support
- Core
- Challenge

Do not replace this with a chatbot.

AI may help explain/recommend drafts, but routing/mastery decisions should remain explainable and auditable.

## 6. Question-bank baseline

Repository README/catalog currently describe:
- canonical records: 1,217
- MCQ: 876
- FRQ: 341
- public student-ready: 1,104
- teacher/archive restricted: 113

The bank has existing:
- provenance;
- publication/access boundaries;
- validation gates;
- media records;
- KaTeX validation;
- answer-verification status;
- student-ready gates;
- archive metadata.

This is an asset.

Do not flatten it into a simplistic `questions.json`.

### Immediate weakness
The observed public canonical counts are heavily AP Calculus weighted, with comparatively few AP Precalculus records in the canonical public catalog. IB course-specific/private banks follow other paths.

The new engine should unify search/metadata behavior without destroying rights boundaries.

## 7. Current QA strength

Observed release work includes:
- Node behavior tests;
- source/DOM fixtures;
- KaTeX validation;
- broken-reference validation;
- bank release checks;
- checksum/release tooling;
- lesson-specific tests;
- cache/auth/session behavior checks.

New infrastructure should enter these pipelines.

## 8. Major architectural risks

### R1. Public static hosting boundary
GitHub Pages is public. Teacher-only answers/content cannot be considered protected merely because the UI hides them.

### R2. Lesson implementation fragmentation
Handcrafted HTML decks + data-driven IB content + generated lesson patterns make authoring costly and inconsistent.

### R3. Client-local state
LocalStorage is useful for resilience and drafts but cannot be the institutional source of truth for critical student records or permissions.

### R4. Duplicate platform layers
The repository contains historical backups/staging/integration artifacts. Codex must distinguish canonical runtime from archival/support copies.

### R5. Curriculum version drift
AP exam formats change. IB has a future first-assessment-2029 revision. Hard-coded curriculum assumptions will become stale.

### R6. Visual inconsistency
Highly customized lessons can become impressive individually but inconsistent as a product.

### R7. Question-style labeling
“AP-style” or “IB-style” must represent real skill/cognitive alignment, not cosmetic wording.

## 9. Target migration principle

Keep the current production system alive while introducing a new canonical content layer.

Recommended progression:

Legacy lesson
→ importer/adapter
→ ECHS Lesson Document
→ shared renderer
→ Lesson Studio editing
→ versioned publish
→ student runtime

During migration, the original URL should continue to work.

## 10. Do-not-break list

Before large work, preserve and test:
- sign-in/session recovery;
- course isolation;
- teacher release boundaries;
- private bank security;
- existing mastery evidence;
- practice attempts;
- Smart Learning Route;
- account-scoped offline queues;
- lesson finish-to-practice flow;
- current canonical lesson URLs;
- public bank audit gate;
- existing Pages deployment.

## 11. First engineering conclusion

The highest-value next platform feature is not a new dashboard.

It is the **canonical Lesson Document + renderer + secure Lesson Studio**, because this becomes the substrate for:
- no-code lesson editing;
- consistent design;
- reusable interactivity;
- Qatar variants;
- 3D blocks;
- versioning;
- curriculum audit;
- AI-assisted drafts;
- accessibility;
- analytics.
