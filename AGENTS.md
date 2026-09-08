# ECHS Mathematics — Codex Operating Rules

These rules are permanent and apply to every task in this repository.

## 1. Mission

Build ECHS Mathematics into an exceptional purpose-built mathematics learning platform for:

- AP Calculus AB
- AP Calculus BC
- AP Precalculus
- IB Mathematics: Applications and Interpretation SL
- future mathematics courses that reuse the same engines

The product must combine curriculum fidelity, mathematical correctness, interactive visualization, assessment quality, mastery evidence, teacher authoring, student analytics, and meaningful Qatar context.

A feature is not successful because it looks impressive. It is successful only when it improves mathematical teaching/learning and survives production QA.

## 2. Preserve the existing product

Do not rewrite the repository from scratch.

The repository already contains production systems that must be preserved unless a documented migration supersedes them safely:

- `data/courses.js`
- `lessons/**`
- `question-bank/official/**`
- public/restricted question provenance and publication gates
- `supabase/**`
- authentication/account functions
- mastery evidence and learning synchronization
- Smart Learning Route behavior
- release/publication controls
- service-worker/cache protections
- existing tests and release checks
- current GitHub Pages release path until an approved migration replaces it

Never delete a large working subsystem because a new architecture is cleaner.

Use adapters, versioned migrations, feature flags, rollback paths, and incremental cutover.

## 3. Repository reality

ECHS currently uses a mixed architecture:

- static HTML/CSS/JavaScript student pages on GitHub Pages;
- Supabase database/storage and Edge Functions for institutional/private features;
- browser-local state for some resilient/offline interactions;
- handcrafted AP lesson decks;
- data-driven `LESSON_DATA` patterns in parts of IB content;
- a canonical audited public/restricted question-bank pipeline;
- Node/Python/browser-source validation tooling.

Any proposed architecture must acknowledge this reality.

Do not introduce React, Next.js, Vue, or another full framework solely because it is fashionable.

If a framework migration is proposed, provide:
1. measurable benefit;
2. migration path;
3. compatibility layer;
4. performance impact;
5. rollback path;
6. proof that current content/banks/auth will remain intact.

For reusable math/UI modules, standards-based Web Components or framework-neutral modules are preferred unless an audit proves another choice materially better.

## 4. Security boundary

GitHub Pages is public static hosting.

Never treat code, answer keys, private teacher materials, private question prompts, student records, credentials, or service-role secrets committed to Pages as secure.

Private authoring, student data, answer-release controls, and teacher/admin content must be protected by authenticated server-side authorization and Supabase RLS/Edge Functions or another explicitly approved secure boundary.

Never rely only on client-side role checks.

Never expose service-role keys.

## 5. Curriculum sources of truth

Never invent AP or IB objectives.

Use authoritative curriculum documents.

### AP Calculus
For school year 2026–27, use the current College Board AP Calculus AB/BC CED plus Fall 2026 clarifications/corrections. Course content is unchanged; exam multiple-choice counts/timing change for May 2027.

### AP Precalculus
For school year 2026–27, use the current AP Precalculus CED plus Fall 2026 clarifications/corrections. Units 1–3 are AP-exam assessed; Unit 4 is not assessed on the AP Exam.

### IB Mathematics AI SL
For students being assessed before 2029, use the curriculum with first assessment 2021.
The revised IB mathematics course with first assessment 2029 must exist as a separate future curriculum version. Never mix it silently into a 2026–27/2027–28 cohort.

Every curriculum record requires version metadata.

## 6. Mathematical correctness

Mathematics correctness overrides visual polish and speed of implementation.

For every assessment item or worked example verify:

- domain;
- assumptions;
- notation;
- units;
- exact/approximate distinction;
- calculator policy;
- unique intended answer where appropriate;
- graph/table consistency;
- symbolic equivalence;
- endpoint behavior;
- rounding/significant-figure requirements where applicable;
- AP/IB command expectations;
- solution logic.

Do not infer correctness from an AI-generated solution.

For generated numeric questions, independently calculate expected results in test code whenever practical.

## 7. Originality and rights

Do not copy protected AP Classroom or restricted IB examination content.

A question may emulate:
- skill;
- structure;
- representation;
- cognitive demand;
- command style;
- calculator expectations;
- scoring logic;

but must be original unless the repository has explicit publication rights and provenance metadata allowing the exact source item.

Preserve existing source/provenance/licensing metadata.

Never weaken the existing strict publication gate to make more questions visible.

## 8. AP Calculus design rules

AP Calculus must repeatedly connect:

- analytical;
- graphical;
- numerical/tabular;
- verbal/contextual

representations.

Build the four College Board mathematical practices into lesson and question metadata:

1. Implementing Mathematical Processes
2. Connecting Representations
3. Justification
4. Communication and Notation

Do not turn AP Calculus into a rule-memorization course.

Require interpretation, units, justification, and representation switching where the objective calls for it.

## 9. AP Precalculus design rules

AP Precalculus must foreground:

- modeling;
- covariation;
- functions as dynamic relationships;
- parameter effects;
- multiple representations;
- symbolic fluency;
- communication/reasoning.

Use the three official mathematical practices:

1. Procedural and Symbolic Fluency
2. Multiple Representations
3. Communication and Reasoning

A topic is not complete if it only teaches algebraic procedures.

## 10. IB AI SL design rules

IB AI SL is not AP mathematics with different labels.

It must emphasize:

- applications;
- modeling;
- interpretation;
- technology;
- GDC fluency;
- statistics and probability;
- meaningful context;
- communication using IB-style command terms;
- multi-part problem progression.

Technology-required workflows must be part of the learning experience rather than an appendix.

## 11. Lesson architecture rule

New lesson content must be data/schema driven.

Teachers must never need HTML to:
- create a lesson;
- add/delete/reorder a slide;
- change text;
- insert math;
- insert a graph;
- insert a question;
- insert an image/video;
- add an interactive activity;
- add a 3D model;
- publish/unpublish a lesson.

Existing handcrafted lessons remain supported through compatibility adapters until migrated.

Do not force a big-bang migration.

## 12. Interactive mathematics rule

Use interaction only when it reveals mathematics.

Good interaction:
- draggable point exposes covariation;
- secant approaches tangent;
- parameter slider changes a family of functions;
- Riemann partitions refine;
- a cross-section moves through a solid;
- residuals react to model choices.

Bad interaction:
- gratuitous particles;
- excessive parallax;
- random animations;
- motion that obscures notation;
- decorative 3D with no mathematical purpose.

## 13. 3D rule

Use 3D when spatial structure matters.

For volume/cross-section experiences, synchronize when appropriate:

2D region ↔ representative slice ↔ integral expression ↔ 3D solid.

3D must include:
- keyboard-accessible or alternative controls where feasible;
- reset;
- reduced-motion support;
- a static accessible fallback;
- lazy loading;
- resource cleanup;
- correct scale/axes;
- testable mathematical model data independent of rendering.

## 14. Qatar identity rule

Do not attach decorative flags/landmarks to unrelated mathematics.

Qatar context must be mathematically authentic.

Separate:
- mathematical model;
- contextual story/data;
- visual treatment.

A teacher should be able to switch between neutral and Qatar-context variants without changing the target skill.

Do not fabricate current statistics. Dataset-backed lessons require source, date, units, and transformation metadata.

## 15. Assessment-generation rule

AI-generated content is always draft.

No generated assessment item may become student-ready automatically.

It must pass the same or stronger gates as hand-authored items:
- mathematical verification;
- source/originality check;
- curriculum mapping;
- answer verification;
- media verification;
- notation rendering;
- accessibility;
- publication approval.

## 16. Mastery rule

Do not award mastery from one easy item or one percentage.

Use evidence across:
- objective/skill;
- difficulty;
- representation;
- independence;
- recency;
- consistency;
- misconception recovery;
- assessment type.

Preserve server-trusted evidence as authoritative.

Client-side animations, reveals, slide views, or self-scoring must never silently grant mastery.

## 17. Performance rule

Do not load heavy graphing/3D libraries globally.

Use:
- lazy loading;
- dynamic import;
- code splitting/module boundaries where possible;
- request deduplication;
- cleanup/disposal;
- asset compression;
- caching compatible with auth/privacy;
- reduced-motion behavior.

Define a performance budget for major new features.

## 18. Accessibility rule

Target WCAG 2.2 AA.

Every interactive component requires:
- keyboard behavior;
- focus states;
- labels;
- non-color-only meaning;
- reduced motion;
- reasonable screen-reader alternative;
- readable mathematical notation;
- touch-safe controls.

## 19. Working protocol

Before a major change:

1. Read relevant specifications in `docs/codex/`.
2. Inspect existing implementation and tests.
3. Identify protected behavior.
4. State the migration/change strategy.
5. Define acceptance criteria.
6. Implement the smallest coherent slice.
7. Add/extend automated tests.
8. Run relevant existing tests.
9. Test failure paths and permissions.
10. Document what changed.
11. Report unresolved risks.

Do not declare completion because code compiles.

## 20. Definition of done

A major feature is done only if:
- mathematics is correct;
- curriculum mapping is correct;
- data persists correctly;
- authorization is enforced server-side where required;
- responsive behavior works;
- accessibility is acceptable;
- existing release checks still pass;
- new tests cover critical behavior;
- rollback/migration is documented;
- student-facing private content is not accidentally public;
- no unrelated production feature regresses.
