# ECHS Mathematics Product Specification

## Product north star

ECHS Mathematics should become a mathematics learning operating system, not a collection of webpages.

The product should integrate:

Curriculum Intelligence  
→ Lesson Studio  
→ Interactive Mathematics  
→ Practice & Assessment  
→ Mastery Evidence  
→ Smart Learning Route  
→ Teacher Intelligence  
→ Student Mathematical Profile

The same platform architecture must support multiple curricula without making them pedagogically identical.

## Core audiences

### Student
Needs:
- clear learning path;
- concept exploration;
- strong worked examples;
- practice;
- exam-style challenge;
- feedback;
- mastery visibility;
- accessible calculator/technology support.

### Teacher
Needs:
- no-code lesson creation;
- fast editing/reordering;
- question selection/generation;
- assignment building;
- class misconception analysis;
- publication controls;
- version history.

### Course Lead
Needs:
- curriculum mapping;
- shared lesson governance;
- content review;
- question QA;
- coverage audit.

### Administrator
Needs:
- operational visibility;
- curriculum coverage;
- adoption/engagement;
- secure account/class management;
- no direct manipulation of individual mastery evidence.

### Parent
Needs:
- understandable linked-student progress;
- strengths/needs;
- upcoming priorities;
- no direct access to teacher-only lesson/bank controls.

## Product principles

1. Mathematics first.
2. Curriculum fidelity is auditable.
3. Interactivity must reveal structure.
4. Teacher authoring does not require code.
5. Student mastery is evidence-based.
6. Qatar identity is authentic, not decorative.
7. AP and IB remain distinct assessment cultures.
8. Security is server-enforced.
9. Existing production strengths are preserved.
10. Every major subsystem has tests.

## Target system modules

### A. Curriculum Registry
Stores:
- curriculum family;
- version;
- course;
- unit;
- topic;
- learning objective;
- essential knowledge/content statement;
- practice/skill;
- prerequisite;
- calculator expectation;
- representation;
- assessment profile;
- effective dates.

### B. Lesson Document Engine
One schema for lesson content.

A lesson contains:
- metadata;
- objectives;
- slides/scenes;
- reusable blocks;
- interactions;
- assessments;
- context variants;
- accessibility metadata;
- publication/version information.

### C. Lesson Studio
No-code editing.

### D. Math Component Library
Reusable interactive components:
- function explorer;
- secant/tangent explorer;
- transformation lab;
- Riemann sum;
- accumulation;
- differential equation field;
- statistics/regression lab;
- polar/parametric explorer;
- 3D solid/cross-section viewer.

### E. Question Engine
Canonical schema, blueprint search, authoring, QA, provenance, publication.

### F. Assessment Studio
Build:
- practice;
- AP-style sets;
- AP exam simulations;
- IB Paper-style sets;
- mastery checks;
- exit tickets.

### G. Mastery Evidence
Keep trusted server evidence and extend the model carefully.

### H. Misconception Intelligence
Store likely misconception codes from response patterns.

Examples:
- `limit.function_value_confusion`
- `derivative.chain_rule_omission`
- `integral.signed_vs_total`
- `precalc.exponential.additive_vs_multiplicative`
- `ib.rounding.premature_rounding`

### I. Qatar Context Library
Versioned context/data assets reusable across lessons/questions.

### J. Teacher Intelligence
Answer:
- who needs intervention;
- which prerequisite is weak;
- which representation is causing difficulty;
- what misconception is common;
- who is ready for challenge;
- which curriculum objective lacks evidence.

## Student learning loop

Learn  
→ Explore  
→ Guided Practice  
→ Independent Practice  
→ Exam-style Application  
→ Reflection  
→ Mastery Evidence  
→ Spaced Review

The loop may adapt by route, but should not hide the curriculum from students.

## Design vision

Premium, calm, mathematics-first.

### Visual language
- deep Qatar maroon accent;
- ivory/warm neutral backgrounds;
- charcoal text;
- restrained sand/gold supporting tones;
- geometric motifs used sparingly;
- strong typography hierarchy;
- large math;
- high-quality diagrams;
- polished micro-interactions;
- no excessive gradients/glass/particles.

### Layout
Desktop:
- course/navigation rail;
- central learning stage;
- optional right utility panel.

Presentation:
- full-screen mathematical canvas.

Student mobile:
- single-column, touch-safe, graph-first controls.

## Premium interactions

Use motion for:
- parameter transition;
- representation correspondence;
- answer feedback;
- progressive reveal;
- spatial construction;
- route/progress state.

Never animate merely to look futuristic.

## Performance targets

Define real budgets during implementation.

Initial target:
- non-3D lesson shell usable quickly on normal school laptops;
- no Three.js download until a 3D block is needed;
- graph libraries lazy loaded;
- images responsive/compressed;
- lesson document payload segmented if very large;
- interactions maintain smooth response on common school hardware.

## Accessibility

Target WCAG 2.2 AA.

Every math interaction needs a meaningful non-pointer pathway.

For visual-only concepts provide:
- textual state;
- data table;
- keyboard controls;
- static fallback where appropriate.

## Product success indicators

Measure:
- lesson load success;
- lesson completion;
- practice conversion;
- repeat attempts;
- mastery recovery;
- question QA rejection rate;
- teacher authoring time;
- percentage of lessons editable without code;
- curriculum coverage;
- accessibility QA failures;
- performance metrics;
- student misconception recovery.

Do not use vanity engagement metrics alone.

## Non-goals

- Replace teachers with AI.
- Publish generated questions without review.
- Copy AP Classroom/IB protected material.
- Force every lesson into the same visual sequence.
- Make every concept 3D.
- Rewrite all legacy lessons in one release.
- Move private content onto GitHub Pages.
