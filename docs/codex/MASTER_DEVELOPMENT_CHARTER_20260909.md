# ECHS MATHEMATICS

# FULL PRODUCTION MASTER DEVELOPMENT CHARTER

You are the lead engineering, mathematical-learning, curriculum-integration, interaction-design, data-systems, and quality-assurance agent responsible for completing ECHS Mathematics as a production-grade mathematics learning operating system.

Repository:

`2ed944-cloud/ECHS-Math`

This is a long-horizon production program.

It is NOT:

- a one-shot redesign;
- a collection of demos;
- a mockup project;
- a dashboard-only project;
- a website beautification task;
- an AI chatbot project;
- a content-shortening exercise.

Your responsibility is to continue the existing ECHS architecture, preserve everything that is already strong, repair what is incomplete, and incrementally build the complete system defined below.

The final result must be a real educational platform whose production components can also be demonstrated publicly in the PUE presentation.

---

# 0. CORE MISSION

ECHS Mathematics must become:

## A Mathematics Learning Operating System

integrating:

Curriculum Intelligence
→ Curriculum-Specific Readiness
→ Student Mathematical Profile
→ Lesson Studio
→ Interactive Mathematics
→ 2D/3D Mathematical Visualization
→ Guided Learning
→ Practice & Assessment
→ Question Intelligence
→ Misconception Intelligence
→ Mastery Evidence
→ Mistake Recovery
→ Spaced Review
→ Smart Learning Routes
→ AI Pedagogy
→ Teacher Intelligence
→ Parent/Leadership Insight
→ Curriculum Quality Intelligence
→ Longitudinal Student Growth.

The platform must be mathematics-first.

Technology exists to reveal mathematics, support reasoning, generate evidence, and improve instructional decisions.

Technology must never replace mathematical rigor.

---

# 1. ABSOLUTE PRODUCT PRINCIPLE

The permanent development principle is:

# PRESERVE THE RIGOR.

# PRESERVE THE DEPTH.

# IMPROVE THE REPRESENTATION.

# MAKE THE MATHEMATICS MORE VISIBLE.

Never simplify strong mathematical content merely to make a lesson prettier or shorter.

Never remove rigorous explanations because an animation was added.

Never replace AP/IB-level reasoning with easier interactive tasks.

Never lower cognitive demand.

Whenever a student is being asked to:

"Imagine the movement,"

"Imagine the change,"

"Imagine the graph changing,"

"Imagine the point approaching,"

"Imagine the region rotating,"

"Imagine the solid,"

"Imagine the cross section,"

first determine whether the mathematics can instead be made directly investigable.

The guiding philosophy is:

## Do not reduce the mathematics.

## Reduce unnecessary representational barriers to seeing the mathematics.

---

# 2. SOURCE OF TRUTH

Before writing code, inspect the CURRENT `main` branch.

Do not assume old planning documents exactly represent the current state.

Read and reconcile at minimum:

- `AGENTS.md`
- current repository README
- `docs/codex/ECHS_PRODUCT_SPEC.md`
- `docs/codex/EXECUTION_BACKLOG_30.md`
- `docs/codex/BASELINE_AUDIT_20260907.md`
- `docs/codex/THREE_D_MATH_ENGINE_SPEC.md`
- `docs/codex/QATAR_IDENTITY_SPEC.md`
- `docs/IB_READINESS_PATHWAY_SYSTEM.md`
- Lesson Studio foundation documents
- mastery foundation documents
- curriculum-version documents
- question-bank governance documents
- runtime inventory
- relevant CI workflows
- deployment workflows
- existing lesson-specific QA reports.

Re-audit the repository before starting every major program phase.

Never rebuild an existing working capability under another name without a documented reason.

---

# 3. EXECUTION AUTHORITY

You are authorized to continue implementation through coherent dependency-ordered slices without asking for routine confirmation after every task.

Do not stop merely after:

- producing a plan;
- writing documentation;
- creating a mockup;
- adding TODOs;
- designing an architecture;
- building only the UI.

For each coherent slice:

1. inspect current state;
2. identify the next unmet dependency;
3. define acceptance criteria;
4. implement;
5. test;
6. repair failures;
7. run regression suites;
8. document evidence;
9. integrate according to repository workflow;
10. update backlog/status;
11. continue.

Routine development should proceed autonomously.

Stop before performing a destructive or irreversible action only when:

- real institutional/student data could be destroyed;
- credentials/secrets are missing;
- a legal/licensing decision is required;
- data-governance approval is genuinely required;
- requirements materially conflict;
- a migration cannot be made safely reversible.

Otherwise continue.

---

# 4. CHANGE MANAGEMENT

Work in dependency order.

Prefer one coherent PR/worktree slice per subsystem.

Do not create giant unreviewable changes.

A change must not be merged merely because the page renders.

Before merge require appropriate:

- mathematical tests;
- schema validation;
- API tests;
- database/RLS checks;
- browser tests;
- accessibility checks;
- visual regression;
- performance checks;
- existing regression suites.

Merge only when the required gates pass.

Preserve rollback paths.

Database migrations must be:

- versioned;
- reversible where practical;
- additive before destructive;
- production-safe;
- independently validated.

---

# 5. DO-NOT-BREAK CONTRACT

Preserve:

- existing user accounts;
- authentication;
- session recovery;
- organizations;
- classes;
- class memberships;
- parent/student links;
- current lesson URLs;
- teacher/admin/student role boundaries;
- current lesson publication behavior;
- question provenance;
- restricted question boundaries;
- private practice banks;
- current assignments;
- practice history;
- learning attempts;
- mastery records;
- mistake/review records;
- Smart Learning Route;
- offline queues;
- curriculum-version assignments;
- Qatar identity work already present;
- working AP/IB lessons;
- existing valuable interactive content.

Do not silently reset student evidence.

Do not expose private teacher material through public static hosting.

---

# 6. CURRICULUM PHILOSOPHY

One platform does NOT mean one curriculum model.

The platform must explicitly preserve the distinct educational cultures of:

- AP Calculus AB;
- AP Calculus BC;
- AP Precalculus;
- IB Mathematics: Applications and Interpretation SL;
- current Grade 9/10 readiness pathways;
- future supported mathematics curricula.

Keep distinct:

- course structures;
- learning objectives;
- prerequisite models;
- assessment cultures;
- calculator expectations;
- question structures;
- terminology;
- mathematical emphases;
- evidence models;
- readiness definitions.

Never flatten AP and IB into generic mathematics.

---

# 7. CURRICULUM VERSION INTELLIGENCE

Maintain a versioned curriculum registry.

Every active course must connect to:

- curriculum family;
- curriculum version;
- course;
- unit;
- topic;
- objective;
- essential knowledge/content statement;
- mathematical practice/skill;
- prerequisite;
- calculator expectation;
- representation expectation;
- assessment profile;
- effective dates;
- course-specific metadata.

Support future curriculum changes without rewriting the platform architecture.

Never hard-code curriculum assumptions that cannot be versioned.

---

# 8. COMPLETE LESSON STUDIO

Finish Lesson Studio as a true no-code mathematical lesson authoring environment.

Teachers should not need HTML, CSS, JavaScript, JSON, or GitHub knowledge.

Required capabilities:

## Lesson structure

- create lesson;
- create slide/scene;
- rename;
- duplicate;
- delete;
- restore deletion;
- reorder;
- section grouping;
- objective assignment;
- lesson metadata;
- curriculum mapping.

## Authoring

- rich text;
- mathematical expressions;
- KaTeX-safe entry;
- equation editor;
- callouts;
- worked examples;
- student-turn blocks;
- hidden/reveal solutions;
- images;
- diagrams;
- tables;
- video/resources;
- external approved interactive resources;
- files;
- citations/sources where appropriate.

## Reliability

- autosave;
- undo;
- redo;
- account-scoped durable drafts;
- offline draft recovery;
- server conflict detection;
- version comparison;
- restore as new draft.

## Governance

- draft;
- review;
- publish;
- unpublish where policy permits;
- immutable published versions;
- version history;
- curriculum audit;
- author/reviewer information.

## Presentation

Create classroom Presentation Mode using the same lesson document:

- full-screen;
- next/back;
- keyboard control;
- progressive reveals;
- reset interaction;
- reduced-motion mode;
- presenter-safe behavior;
- large classroom typography.

---

# 9. REUSABLE MATHEMATICS COMPONENT REGISTRY

Do not continue building dozens of isolated lesson-specific JavaScript interactions.

Create a reusable Math Component Registry.

Every component requires:

- mathematical model;
- student renderer;
- Lesson Studio editor;
- configuration schema;
- validation;
- accessibility state;
- keyboard interaction;
- responsive behavior;
- lazy loading;
- cleanup;
- mathematical unit tests;
- browser tests;
- versioning.

Required major component families include:

1. Motion & Covariation Explorer
2. Function Explorer
3. Multiple Representation Explorer
4. Transformation Lab
5. Secant/Tangent Explorer
6. Limit Explorer
7. Derivative Explorer
8. Derivative-as-a-Function Explorer
9. Chain Rule / Composition Explorer
10. Implicit Curve Explorer
11. Inverse Function Explorer
12. Motion Analysis Explorer
13. Related Rates Engine
14. Linearization Explorer
15. MVT Explorer
16. First/Second Derivative Analysis Explorer
17. Optimization Engine
18. Riemann Sum Explorer
19. Accumulation Explorer
20. Differential Equation / Slope Field Explorer
21. Statistics / Regression Lab
22. Probability Simulation
23. Parametric Explorer
24. Polar Explorer
25. Series / Approximation Explorer where appropriate for BC
26. 3D Mathematics Engine.

Lesson Studio should eventually support:

`Add Interactive → Select Mathematical Component`

rather than requiring custom code.

---

# 10. INTERACTIVITY DESIGN RULE

For every lesson ask:

## "What mathematical idea is currently being explained through imagination that could instead be investigated?"

Classify visual need as:

A. KEEP AS-IS
B. IMPROVE STATIC FIGURE
C. ADD SYNCHRONIZED REPRESENTATIONS
D. ADD 2D INTERACTIVITY
E. ADD 3D
F. REFACTOR EXISTING INTERACTIVITY INTO REUSABLE COMPONENT.

Do not automatically choose animation.

Use animation only when it reveals mathematical structure.

Use 3D only when spatial reasoning materially benefits.

---

# 11. REQUIRED LEARNING SEQUENCE FOR INTERACTIVE CONCEPTS

Prefer:

SEE
→ MANIPULATE
→ PREDICT
→ EXPLAIN
→ SYMBOLIZE
→ APPLY
→ REMOVE VISUAL SCAFFOLD
→ SOLVE STATIC AP/IB-APPROPRIATE TASK
→ COLLECT MASTERY EVIDENCE.

The final stage is essential.

Students must demonstrate the mathematical skill without depending on animation.

---

# 12. AP CALCULUS — CONTENT PRESERVATION MANDATE

AP Calculus lessons are a major priority.

Before materially changing any lesson:

1. inventory all current content;
2. record learning objectives;
3. record worked examples;
4. record explanations;
5. record AP-style questions;
6. record FRQs;
7. record challenge questions;
8. record calculator expectations;
9. record existing interactions;
10. record Qatar-context material;
11. record mastery mappings.

After enhancement, perform a before/after audit.

The enhanced lesson must have equal or greater:

- mathematical depth;
- curriculum coverage;
- representation diversity;
- reasoning demand;
- assessment quality.

Content may only be removed when demonstrably:

- incorrect;
- redundant;
- obsolete;
- broken and replaced by something stronger.

Document every material removal.

---

# 13. AP CALCULUS UNIT 1

Preserve and strengthen existing strong work.

Priority visual concepts:

- instantaneous change;
- average vs instantaneous rate;
- secant/tangent;
- shrinking intervals;
- limit behavior;
- one-sided limits;
- graph/table/formula relationships;
- algebraic limit methods;
- discontinuities.

The Secant/Tangent experience should synchronize:

graph of `f`
↔ fixed point P
↔ movable Q
↔ Δx
↔ Δy
↔ secant
↔ difference quotient
↔ numerical slope
↔ limiting tangent behavior.

At `h = 0`, explicitly show:

`0/0 — quotient undefined`

Then distinguish this from the limit.

Never visually imply the secant quotient becomes defined simply because Q reaches P.

---

# 14. AP CALCULUS UNIT 2

# DIFFERENTIATION — DEFINITION AND FUNDAMENTAL PROPERTIES

Perform a complete visual audit.

## Derivative definition

Reuse/refine Secant/Tangent component.

## Derivative as a Function

Create synchronized views:

point moving on `f`
↔ tangent line
↔ tangent slope
↔ derivative value
↔ corresponding point on `f'`.

Allow students to predict `f'` before revealing it.

## Differentiability

Interactive examples:

- smooth;
- corner;
- cusp;
- vertical tangent;
- discontinuity;
- relevant endpoints.

Make students reason about why differentiability fails.

## Derivative Rules

Do not over-animate routine symbolic computation.

Use visual support only when it strengthens structure or representation.

Retain extensive symbolic fluency.

## Multiple representations

Connect:

- analytical;
- graphical;
- numerical;
- verbal.

---

# 15. AP CALCULUS UNIT 3

# COMPOSITE, IMPLICIT AND INVERSE FUNCTIONS

## Chain Rule

Create a composition/dependency explorer:

`x → u=g(x) → y=f(u)`

Synchronize input changes and both function layers.

Connect visually to:

`dy/dx = dy/du · du/dx`

But retain rigorous symbolic Chain Rule practice.

## Implicit Differentiation

Use movable points on implicit curves.

Synchronize:

coordinates
↔ curve
↔ tangent
↔ local slope
↔ implicit relation
↔ `dy/dx`.

Show that x and y change together under a constraint.

## Inverse Functions

Synchronize:

`f`
↔ `y=x`
↔ `f^{-1}`
↔ paired points
↔ swapped coordinates
↔ tangent slopes.

Where appropriate reveal reciprocal slope relationships.

## Inverse Trigonometric Derivatives

Use visual support where domain/range/inverse structure benefits.

Do not replace symbolic derivative skill with animation.

---

# 16. AP CALCULUS UNIT 4

# CONTEXTUAL APPLICATIONS OF DIFFERENTIATION

This is one of the highest-priority visual units.

## Straight-Line Motion

Synchronize:

physical particle
↔ position `s(t)`
↔ velocity `v(t)`
↔ acceleration `a(t)`
↔ numerical values
↔ sign.

Allow time scrubbing.

Clearly distinguish:

- position;
- displacement;
- total distance;
- speed;
- velocity;
- acceleration.

When velocity changes sign, the physical particle must reverse direction.

## Other Rates of Change

Use meaningful visual models where relationships are genuinely dynamic.

## Related Rates

Preserve and strengthen the current rich Related Rates lesson.

Do not replace it with a shorter lesson.

Refactor good existing interactions into reusable Related Rates components.

### Ladder

2D animation:

- fixed ladder;
- moving base;
- moving height;
- x;
- y;
- `dx/dt`;
- `dy/dt`;
- right-triangle constraint.

### Expanding circle

Synchronize:

`r(t)`
↔ circle
↔ area
↔ `dr/dt`
↔ `dA/dt`.

### Expanding sphere

Use 3D.

Synchronize:

radius
↔ sphere
↔ volume
↔ `dr/dt`
↔ `dV/dt`.

### Filling cone

Use transparent/cutaway 3D when beneficial.

Synchronize:

water height
↔ water radius
↔ cone geometry
↔ similar triangles
↔ volume
↔ rates.

Retain a meaningful 2D cross-section.

### Shadow problems

Prefer 2D dynamic geometry.

Do not force 3D.

## Linear Approximation

Create a local-linearity explorer.

Zoom toward a point.

Synchronize:

`f(a)`
↔ `f'(a)`
↔ tangent
↔ `L(x)`
↔ approximation
↔ error.

Show visually why a smooth function becomes locally linear under sufficient zoom.

---

# 17. AP CALCULUS UNIT 5

# ANALYTICAL APPLICATIONS OF DIFFERENTIATION

## Mean Value Theorem

Interactive interval selection.

Show:

secant slope
↔ candidate tangent locations.

Preserve theorem hypotheses visibly.

Never allow the animation to imply MVT applies when continuity/differentiability requirements fail.

## Increasing / decreasing

Synchronize:

`f`
↔ `f'`
↔ sign of `f'`.

Students predict before reveal.

## Relative extrema

Connect derivative sign changes with local function behavior.

## Concavity

Synchronize:

`f`
↔ `f'`
↔ `f''`
↔ changing tangent slope.

Explicitly distinguish:

- increasing/decreasing;
- concavity;
- extrema;
- inflection points.

## First/Second Derivative Tests

Explore visually first.

Then remove scaffold.

Require analytical justification.

## Optimization

This is another highest-priority interactive area.

Build a reusable Optimization Engine.

### Open-top box

Start with flat 2D rectangle.

Slider controls cut size `x`.

Show corner cuts.

Animate folding into a 3D box.

Synchronize:

`x`
↔ `L-2x`
↔ `W-2x`
↔ box dimensions
↔ 3D object
↔ `V(x)`
↔ point on objective-function graph.

Students predict maximum before derivative analysis.

### Fencing

Dynamic 2D geometry.

Constraint and objective update simultaneously.

### Cylinder/can optimization

Use 3D where it clarifies the spatial relationship.

### Distance optimization

Use moving geometry and objective-function synchronization.

### Other reviewed AP-appropriate optimization contexts

Always end with an unsupported static AP-style optimization problem.

---

# 18. AP CALCULUS UNITS 6–10

Continue the same philosophy throughout the remaining curriculum.

## Integration and Accumulation

Build:

- signed area;
- accumulation;
- Riemann sums;
- changing number of rectangles;
- left/right/midpoint;
- integral as limit;
- FTC correspondence.

## Differential Equations

Interactive:

- slope fields;
- solution curves;
- initial conditions;
- Euler's method;
- exponential/logistic models where appropriate.

## Applications of Integration

High priority for 3D.

## Parametric / Polar

Synchronize:

- parameter;
- physical point;
- x/y components;
- graph;
- derivative information;
- polar radius/angle;
- area where appropriate.

## Infinite Sequences and Series — BC

Use visual support for:

- partial sums;
- convergence behavior;
- remainder/error;
- Taylor polynomial approximation.

Do not make convergence decisions based only on visual appearance.

Preserve analytical tests.

---

# 19. COMPLETE 3D MATHEMATICS ENGINE

Build a reusable production-grade 3D engine.

Preferred architecture:

- Three.js dynamically imported;
- framework-neutral;
- math model independent of WebGL;
- safe parser;
- no unnecessary global dependency.

3D must serve understanding.

## Required templates

1. Disk
2. Washer
3. Shell
4. Known cross sections
5. Rotating region
6. Box folding
7. Expanding sphere
8. Filling cone
9. Reviewed spatial optimization contexts.

## Disk Method

Synchronize:

2D region
↔ axis
↔ representative slice
↔ disk radius
↔ thickness
↔ disk in 3D
↔ `dV`
↔ integral
↔ final solid.

## Washer Method

Synchronize:

2D region
↔ outer radius `R`
↔ inner radius `r`
↔ washer
↔ `A = π(R²-r²)`
↔ differential volume
↔ integral
↔ solid.

## Shell Method

Synchronize:

strip
↔ radius
↔ circumference
↔ height
↔ thickness
↔ cylindrical shell
↔ `dV`
↔ integral.

Allow useful exploded-shell view.

## Known Cross Sections

Support:

- square;
- rectangle;
- equilateral triangle;
- semicircle;
- extensible reviewed shapes.

As slice position changes:

base segment
↔ cross-section geometry
↔ area
↔ 3D position
↔ integral.

## Shifted Axes

Support:

- x-axis;
- y-axis;
- `x=k`;
- `y=k`.

Radius must be geometric distance from the axis.

Never assume radius equals the raw function value.

## Rotation experience

Allow the student to WATCH the generating region rotate:

`0° → 90° → 180° → 270° → 360°`

rather than presenting the final solid instantly.

Controls:

- play;
- pause;
- scrub rotation;
- build solid;
- slice;
- rotate camera;
- zoom;
- reset;
- show/hide axis;
- show/hide region;
- show/hide slice;
- labels;
- formula;
- exploded view where useful.

## Build from slices

Allow approximation:

1 slice
→ several slices
→ many slices
→ smooth solid.

Connect naturally to Riemann-sum ideas.

## Accessibility

Every 3D model requires:

- textual state;
- exact measurements;
- formula;
- keyboard slice movement;
- reduced motion;
- 2D fallback;
- static fallback;
- WebGL-unavailable behavior.

## Performance

- lazy load;
- dispose geometries/materials;
- pause offscreen;
- adaptive mesh resolution;
- weak-device mode;
- no unnecessary continuous rendering.

---

# 20. AP PRECALCULUS INTERACTIVE DEVELOPMENT

Preserve AP Precalculus rigor and multiple-representation reasoning.

High-priority benchmark:

## Change in Tandem / Toy Car

Create a flagship synchronized experience:

physical car motion
↔ time
↔ changing quantity
↔ graph
↔ moving graph point
↔ table
↔ numerical value.

Controls:

- play;
- pause;
- reset;
- time scrubber;
- show/hide representations;
- prediction mode.

Include a transition such as:

`Static Problem → Make the Mathematics Visible`

Do not simplify the underlying AP-level task.

After exploration, remove the animation and require an original static AP-style task.

Develop similar high-value interactive mathematics throughout:

- polynomial/rational behavior;
- rates of change;
- transformations;
- exponential/logarithmic behavior;
- sinusoidal/periodic models;
- function composition;
- inverse behavior;
- multiple representations;
- calculator-required reasoning;
- AP-style modeling.

---

# 21. IB MATHEMATICS AI SL

Preserve IB assessment culture.

Do not turn IB AI into AP-style mathematics.

Strengthen:

- modelling;
- interpretation;
- technology;
- GDC use;
- data;
- regression;
- finance;
- statistics;
- probability;
- geometry;
- networks where applicable;
- critical evaluation of models;
- communication.

Support technology workflows such as TI-84 / TI-Nspire where pedagogically appropriate.

Use visualization and interaction where it clarifies mathematics.

Maintain IB-style structured-response reasoning.

---

# 22. QUESTION INTELLIGENCE ENGINE

Unify question metadata and provider behavior while preserving public/private/licensing boundaries.

Every reviewed question should support:

- curriculum;
- curriculum version;
- course;
- unit;
- lesson;
- objective;
- skill;
- prerequisite;
- representation;
- difficulty;
- cognitive demand;
- calculator policy;
- question type;
- likely misconception;
- provenance;
- originality;
- answer-verification state;
- rubric;
- accessibility;
- publication level.

Do NOT flatten the existing canonical question bank.

Do NOT expose restricted material.

Do NOT copy protected AP Classroom or IB assessment content into public storage.

Create original curriculum-aligned items.

---

# 23. QUESTION QA

No question becomes student-ready merely because AI generated it.

Require:

1. curriculum mapping;
2. mathematical solution;
3. answer verification;
4. distractor verification;
5. notation/units verification;
6. calculator-policy verification;
7. representation check;
8. cognitive-demand check;
9. originality/provenance check;
10. accessibility check;
11. publication review.

AI drafts remain drafts.

---

# 24. ASSESSMENT STUDIO

Teachers should be able to build:

- random practice;
- adaptive practice;
- mastery checks;
- exit tickets;
- mixed review;
- timed tests;
- AP-style MCQ sets;
- AP-style FRQ sets;
- AP simulation profiles;
- IB Paper-style sets;
- targeted intervention sets.

Filters should include:

- curriculum;
- unit;
- lesson;
- objective;
- skill;
- representation;
- difficulty;
- calculator;
- question type;
- misconception;
- readiness gap;
- mastery state.

---

# 25. MASTERY 3.0

Mastery must remain server-authoritative and auditable.

Mastery is NOT simply percent correct.

Use evidence including:

- overall accuracy;
- recent accuracy;
- independent evidence;
- assistance level;
- trusted-question quality;
- transfer/challenge evidence;
- multiple representations;
- retention after time;
- active days;
- spaced evidence;
- unresolved mistakes;
- confidence.

Possible conceptual form:

Accuracy

- Independence
- Representation Diversity
- Transfer
- Retention
- Evidence Across Time
  → Verified Mastery.

AI-assisted work must receive lower independence evidence than unaided work.

A student should be able to see:

Skill: Function Transformations
Score: 91%
Status: Proficient — Not Yet Mastered

Independent evidence: ✓
Multiple representations: ✓
Transfer: ✓
Retention: Missing

Next Action:
Complete retention check.

When retention is demonstrated:

Mastered ✓

Do not manipulate mastery manually without an auditable evidence reason.

---

# 26. MISTAKE BANK + SPACED RECOVERY

Incorrect responses should enter a structured recovery loop.

Wrong response
→ classify skill
→ identify likely misconception
→ targeted feedback
→ recovery practice
→ delayed review
→ retention evidence
→ mastery update.

Avoid endless repetition of nearly identical questions.

Use spaced review intelligently.

---

# 27. MISCONCEPTION INTELLIGENCE

Build a reviewed misconception system.

Examples:

- function value vs rate;
- average vs instantaneous change;
- sign interpretation;
- chain-rule omission;
- implicit-variable confusion;
- inner/outer radius reversal;
- signed area vs total area;
- shell radius/height confusion;
- additive vs multiplicative change;
- incorrect graph interpretation;
- premature rounding in IB;
- model-domain mistakes.

Never state a misconception as certain unless evidence supports certainty.

Represent:

Likely misconception
Evidence
Confidence
Diagnostic question
Recommended recovery.

---

# 28. SMART LEARNING ROUTE

Preserve deterministic explainability.

Routes:

- Support;
- Core;
- Challenge.

Routing can use:

- current lesson position;
- teacher assignment;
- readiness;
- prerequisite evidence;
- mastery;
- accuracy;
- mistake status;
- spaced review;
- recent performance;
- challenge readiness.

AI may explain or recommend.

AI must NOT be the final authority for routing.

---

# 29. READINESS INTELLIGENCE ARCHITECTURE

Do NOT create one generic Student Readiness score.

Use:

# ONE COMMON EVIDENCE ARCHITECTURE

# DIFFERENT CURRICULUM-SPECIFIC READINESS MODELS.

The platform must explicitly communicate:

"One platform does not mean one definition of readiness."

---

# 30. IB MATHEMATICS READINESS

Retain and strengthen the existing architecture.

Separate:

- AA HL;
- AA SL;
- AI HL;
- AI SL.

Potential evidence:

- MAP Growth;
- MYP Mathematics A–D;
- prerequisite diagnostic;
- approved school evidence;
- longitudinal mathematics evidence.

Flow:

Evidence
→ pathway-specific synthesis
→ skill-gap analysis
→ preparation route
→ reassessment
→ readiness trajectory.

Readiness must INFORM preparation.

It must not automatically block pathways.

Keep:

Readiness Index

separate from:

Evidence Completeness / Confidence.

Never market the readiness index as probability of IB success without local validation.

---

# 31. AP PRECALCULUS READINESS

Build a separate model.

Potential prerequisite competencies include:

- algebraic fluency;
- function notation;
- equation solving;
- graph interpretation;
- covariation;
- rates of change;
- transformations;
- proportional reasoning;
- exponential foundations;
- quantitative reasoning;
- geometry;
- introductory trigonometric fluency.

Evidence
→ diagnostic
→ gaps
→ preparation route
→ reassessment.

Do not simply reuse IB weights.

---

# 32. AP CALCULUS READINESS

Build AP Calculus-specific readiness.

Support separate AB and BC target profiles.

Potential competencies:

- function fluency;
- algebraic manipulation;
- trigonometric fluency;
- exponential/logarithmic fluency;
- inverse functions;
- composition;
- graphical reasoning;
- covariation;
- average rate of change;
- notation;
- calculator/GDC fluency;
- relevant precalculus transfer.

A student may be:

AB Readiness: Strong
BC Readiness: Developing

without being labelled incapable of BC.

Instead report:

"Three prerequisite competencies require preparation."

Then generate a preparation route.

---

# 33. GRADE 9/10 READINESS PATHWAYS

Preserve the school's specific AP-readiness pathways.

Use diagnostics and profiles to guide preparation without prematurely labelling learners.

Support transition evidence into AP Precalculus readiness where appropriate.

---

# 34. READINESS PREPARATION ROUTES

A gap should lead to action.

Example:

Target: AP Calculus BC

Trigonometric Fluency: Developing
Algebraic Manipulation: Developing
Function Composition: Strong

Generate:

- micro-lessons;
- targeted practice;
- interactive exploration;
- independent check;
- transfer task;
- retention check;
- reassessment.

When new evidence is created, update the readiness trajectory.

---

# 35. AI PEDAGOGY LAYER

AI must support thinking rather than replace it.

Default pedagogy:

Student Attempt
→ identify likely difficulty
→ Hint 1
→ Guiding Question
→ Hint 2
→ Check Student Work
→ Alternative Representation
→ Similar Practice.

Supported modes may include:

- Hint;
- Guide Me;
- Explain;
- Check My Work;
- Another Method;
- Similar Practice.

But full explanation should not always be the default.

AI should understand authorized context such as:

- course;
- unit;
- lesson;
- objective;
- current question;
- student attempt;
- mastery state;
- known gaps;
- likely misconception;
- readiness context.

AI assistance level must be recorded as part of learning evidence.

---

# 36. AI VISION

Where already supported or safely extendable, allow students to provide:

- handwritten solution;
- graph;
- table;
- diagram;
- calculator screenshot;
- printed question.

AI should identify:

- first likely error;
- missing step;
- notation issue;
- conceptual misconception.

It must state ambiguity rather than guess unreadable content.

---

# 37. AI ASSESSMENT INTEGRITY

For active/timed/graded assessments:

AI should provide guidance rather than simply expose final answers.

Do not allow AI to become an answer-retrieval mechanism for protected assessment situations.

---

# 38. TEACHER INTELLIGENCE

The teacher dashboard should answer instructional questions, not merely show charts.

Examples:

Who needs intervention?

Which prerequisite is weak?

Which misconception is most common?

Which representation is causing difficulty?

Who has unresolved spaced review?

Who appears ready for Challenge?

Who entered the course with readiness gaps?

Which students are relying heavily on AI hints?

Which objectives lack mastery evidence?

What should the teacher consider assigning next?

Provide actionable recommendations with transparent evidence.

Avoid vanity metrics.

---

# 39. STUDENT MATHEMATICAL PROFILE

Build a longitudinal profile that can represent:

- readiness;
- skills;
- mastery;
- representation strengths;
- misconceptions;
- calculator/technology fluency;
- mistakes;
- retention;
- independent performance;
- transfer performance;
- interventions;
- improvement trajectory.

The profile must describe evidence.

It must not become a permanent ability label.

---

# 40. PARENT / FAMILY REPORTING

Provide understandable reporting where authorized:

- strengths;
- priority skills;
- unresolved mistakes;
- current review needs;
- preparation priorities;
- progress trajectory.

Avoid exposing teacher-only content or question banks.

Use practical language.

---

# 41. LEADERSHIP / ADMIN INTELLIGENCE

For authorized leadership provide:

- curriculum coverage;
- adoption;
- evidence completeness;
- intervention demand;
- readiness landscape;
- shared skill gaps;
- assessment coverage;
- curriculum-quality gaps;
- accessibility/compliance indicators.

Do not rank schools/students simplistically.

Use dashboards for system improvement.

---

# 42. QATAR IDENTITY ENGINE

Qatar identity must be authentic, mathematically relevant, and not decorative.

Do not merely:

- add a Qatar flag;
- add random landmarks;
- insert national colors without pedagogical reason;
- fabricate local datasets.

Separate:

Mathematical Model
↔ Context
↔ Dataset
↔ Visual Asset
↔ Source
↔ Units
↔ Date/Version
↔ Pedagogical Reason.

Potential reviewed contexts:

- Education City;
- Doha Metro;
- Lusail;
- transport;
- energy;
- solar energy;
- climate;
- water;
- aviation;
- sports;
- population;
- finance;
- architecture;
- Islamic geometric patterns;
- navigation/history where appropriate.

Support where appropriate:

`Context: Neutral | Qatar`

The mathematical objective and cognitive demand must remain stable.

---

# 43. QATAR DATA GOVERNANCE

Real datasets require:

- source;
- publication date;
- retrieval date;
- units;
- raw data;
- transformation record;
- license/use note;
- version.

Never silently change data in a way that changes question answers.

---

# 44. VISUAL DESIGN SYSTEM

Create a consistent premium mathematics-first experience.

General visual language:

- Qatar maroon;
- ivory/warm neutral;
- charcoal;
- restrained sand/gold;
- excellent mathematical typography;
- large readable graphs;
- subtle geometric identity;
- minimal visual clutter.

Avoid:

- excessive gradients;
- unnecessary glassmorphism;
- particles;
- animation for spectacle;
- tiny mathematical text.

Existing strong lesson identities should be migrated carefully rather than flattened.

---

# 45. ACCESSIBILITY

Target WCAG 2.2 AA where feasible.

Every mathematical interaction needs a meaningful non-pointer path.

Provide:

- keyboard controls;
- visible focus;
- semantic labels;
- textual mathematical state;
- sufficient contrast;
- reduced motion;
- responsive zoom;
- alt text;
- graph descriptions;
- 3D fallback;
- table/data fallback where helpful.

Brand styling never overrides accessibility.

---

# 46. PERFORMANCE

Target ordinary school laptops, tablets and student devices.

Requirements:

- graph libraries lazy-loaded;
- Three.js lazy-loaded;
- responsive assets;
- no global 3D bundle where unnecessary;
- dispose render loops;
- pause offscreen animation;
- adaptive resolution;
- avoid multiple continuous canvases;
- sensible payload limits;
- performance budgets;
- Core-Web-Vitals-style monitoring where useful.

Do not make the platform dependent on high-end hardware.

---

# 47. OFFLINE / PWA / RESILIENCE

Strengthen:

- service-worker behavior;
- safe cached student shell;
- interrupted sessions;
- practice recovery;
- lesson continuation;
- offline queues;
- conflict reconciliation;
- account isolation.

Never cache sensitive teacher/admin/private material insecurely.

---

# 48. SECURITY

Treat security as architecture, not UI hiding.

Requirements:

- Supabase/server authority;
- RLS;
- organization isolation;
- class isolation;
- role/capability checks;
- no service-role secrets in browser;
- no private answer keys in public payloads;
- protected teacher/private banks;
- session validation;
- audit logging for sensitive changes;
- safe CORS/origin policy;
- no trust in client-generated mastery values.

GitHub Pages is public.

Anything requiring real protection must remain behind authenticated backend/storage boundaries.

---

# 49. PRIVACY & STUDENT DATA

Use synthetic data for demonstrations.

Before cross-school real-data use, ensure architecture supports:

- role scope;
- purpose limitation;
- retention policy;
- deletion policy;
- auditability;
- access boundaries;
- communication/consent requirements where institutionally required.

Do not expose student identities in public demonstrations.

---

# 50. CURRICULUM QUALITY INTELLIGENCE

Build a quality dashboard identifying:

- objectives without lessons;
- objectives without questions;
- objectives without mastery evidence;
- representation gaps;
- calculator imbalance;
- practice gaps;
- AP MCQ gaps;
- AP FRQ gaps;
- IB structured-response gaps;
- missing prerequisites;
- unreviewed Qatar contexts;
- accessibility failures;
- outdated curriculum versions;
- lesson-quality warnings.

Every dashboard result should link to a concrete curriculum action.

---

# 51. LESSON-BY-LESSON AUDIT SYSTEM

Create a machine-readable visual/content audit.

For every active lesson store:

- course;
- curriculum version;
- unit;
- lesson;
- objective;
- current content quality;
- current visual state;
- current interactivity;
- missing representation;
- proposed enhancement;
- pedagogical reason;
- 2D/3D decision;
- reusable component candidate;
- accessibility requirement;
- question coverage;
- mastery mapping;
- readiness link;
- QA status.

Prioritize AP Calculus Units 2–5 immediately after architecture dependencies are ready.

Then continue through all active mathematics courses.

---

# 52. CONTENT MIGRATION STRATEGY

Do NOT mass-rewrite every lesson.

Migration path:

Legacy Lesson
→ inventory
→ adapter/importer
→ ECHS Lesson Document
→ preserve current URL
→ shared renderer
→ reusable interaction components
→ Lesson Studio editing
→ versioned publication
→ regression comparison.

Use reference lessons to prove the architecture before large migration.

---



# 54. TESTING SYSTEM

Every major subsystem must have appropriate tests.

## Mathematical tests

Test:

- formulas;
- domains;
- signs;
- units;
- derivative values;
- integral setup;
- radii;
- shell height;
- cross-section area;
- numerical volume;
- shifted-axis geometry;
- readiness calculations;
- mastery calculations.

## Schema tests

Validate lesson/question/curriculum documents.

## Database tests

- migrations;
- RLS;
- permissions;
- account isolation.

## API tests

- authorization;
- validation;
- malformed input;
- role boundaries;
- retries.

## Browser tests

- interactions;
- keyboard;
- student flow;
- teacher flow;
- mobile;
- fallback.

## Visual regression

For canonical representative lessons/components.

## Accessibility QA

Automated plus manual high-value checks.

## Performance tests

Critical pages/components.

---

# 55. MATHEMATICAL VERIFICATION RULE

A visually impressive interaction with incorrect mathematics is a failure.

The mathematical model must be testable separately from rendering.

Especially verify:

- shifted-axis radius;
- washer inner/outer relation;
- shell radius;
- shell height;
- cross-section geometry;
- sign;
- derivative units;
- rate units;
- limiting behavior;
- approximation domains.

---

# 56. PRODUCTION DEFINITION OF "INTERACTIVE"

Do not call something interactive merely because it has next/back buttons.

High-quality mathematical interactivity should allow the learner to alter a mathematically meaningful parameter and observe consequences.

Prefer synchronized representations.

Example:

PHYSICAL MODEL
↔ GRAPH
↔ TABLE
↔ VALUE
↔ EQUATION
↔ RATE
↔ INTERPRETATION.

---

# 57. PRODUCTION DEFINITION OF "3D"

Do not market a rotatable decorative mesh as the completed 3D Mathematics Engine.

A completed 3D mathematical activity must connect geometry to mathematics.

For a washer lesson the student should be able to:

1. see the 2D region;
2. see/select the rotation axis;
3. move the representative slice;
4. identify R and r;
5. see the washer in 2D;
6. see the corresponding washer in 3D;
7. see the area formula;
8. see differential volume;
9. animate/build the solid;
10. see the volume integral;
11. solve an original static AP-style setup problem.

Anything materially weaker is incomplete.

---

# 58. SHOWCASE / PUE MODE

After the production components exist, create:

`PUE Showcase Mode`

or equivalent stakeholder-safe route.

It must use:

- real production components;
- synthetic students;
- synthetic institutional data;
- no protected assessment content;
- no real private student data.

Suggested sequence:

## 1. AP Precalculus — Toy Car

Static problem
→ difficulty visualizing covariation
→ Make the Mathematics Visible
→ animated motion + graph + table.

Message:

"I did not make the mathematics easier. I made the mathematics visible."

## 2. AP Calculus — Secant to Tangent

Static diagram.

"Imagine Q moving closer and closer to P."

Then interactive.

Message:

"What if the mathematics could move instead?"

## 3. AP Calculus — 3D Disk/Washer

Static 2D region.

"Imagine rotating this region."

Then:

rotation
→ solid
→ slice
→ R/r
→ integral.

Message:

"What if the student could see the volume before being asked to symbolize it?"

## 4. Qatar Identity

Neutral
↔ Qatar context

Same rigor.

Same objective.

Different relevance.

## 5. Guided AI

Answer machine? No.

Hint
→ Guide
→ Check
→ Another Representation
→ Similar Practice.

## 6. Mastery

Show:

90% ≠ automatically Mastered.

Reveal independence, transfer, representation, retention and evidence over time.

## 7. Readiness

Show separate:

IB Mathematics Readiness

AP Precalculus Readiness

AP Calculus Readiness.

Message:

"One platform does not mean one definition of readiness."

## 8. Teacher Intelligence

Evidence
→ misconception
→ intervention
→ next action.

---

# 59. PUE SHOWCASE RELIABILITY

The demonstration must be robust.

Provide:

- dedicated deterministic demo navigation;
- synthetic data reset;
- one-click next demo;
- graceful offline/connection fallback where technically practical;
- cached critical visual assets;
- no dependency on searching through production classes;
- no accidental display of student-private data;
- reset buttons for every major interaction.

The PUE showcase is not a separate fake application.

It is a curated window into real ECHS production capabilities.

---

# 60. PROJECT TRACKING

Maintain a living program board.

For every task record:

- ID;
- phase;
- status;
- dependency;
- implementation location;
- acceptance criteria;
- tests;
- deployment evidence;
- rollback;
- known limits;
- next dependency.

Use statuses such as:

PLANNED
IN PROGRESS
IMPLEMENTED
TESTED
DEPLOYED
VERIFIED
BLOCKED.

Do not mark a task complete because code exists locally.

Production-visible tasks require deployment verification.

---

# 61. ACCEPTANCE EVIDENCE

For every completed major feature provide an engineering note containing:

- what was changed;
- what was intentionally preserved;
- mathematical checks;
- accessibility checks;
- security implications;
- performance implications;
- test results;
- screenshots/artifacts where appropriate;
- production verification;
- remaining limitations.

---

# 62. GLOBAL DEFINITION OF DONE

Do not declare the overall ECHS Mathematics program complete until:

## Architecture

- canonical lesson document works;
- Lesson Studio is production-ready;
- reusable Math Component Registry exists;
- public/private content boundaries are secure.

## Mathematics

- major interactive components are mathematically validated;
- 3D engine meets the production benchmark;
- AP/IB content has not been weakened.

## Curriculum

- active curriculum versions are mapped;
- AP Calculus is comprehensively audited;
- AP Precalculus is comprehensively audited;
- IB AI SL is comprehensively audited;
- active Grade 9/10 pathways are mapped.

## Readiness

- IB Mathematics readiness is production-ready;
- AP Precalculus readiness is production-ready;
- AP Calculus AB/BC readiness is production-ready;
- evidence completeness is explicit;
- preparation routes function.

## Learning

- mastery is evidence-based;
- mistake recovery works;
- spaced review works;
- transfer and retention can contribute evidence;
- AI assistance is represented.

## Intelligence

- misconception intelligence exists;
- Teacher Intelligence exists;
- curriculum-quality intelligence exists;
- Student Mathematical Profile exists.

## AI

- AI supports thinking;
- active assessment integrity exists;
- AI does not authoritatively control mastery/routing;
- generated questions remain review-gated.

## Identity

- Qatar Context Engine exists;
- local context does not weaken curriculum rigor.

## Quality

- security gates pass;
- accessibility target is addressed;
- critical mobile/tablet/desktop flows pass;
- school-device performance is acceptable;
- offline/resilience behavior is tested;
- automated regression suite is healthy.

## PUE

- showcase route uses real production components;
- Toy Car works;
- Secant/Tangent works;
- 3D Washer/Disk works;
- Qatar context comparison works;
- Guided AI works;
- Mastery evidence works;
- curriculum-specific Readiness works;
- Teacher Intelligence works;
- synthetic demo data is safe.

---

# 63. HOW TO PRIORITIZE

Do not chase visually impressive features while required foundations remain unstable.

Follow dependency order.

However, once a shared component interface is stable, independent workstreams may proceed in parallel where safe.

Example later parallel workstreams:

- 3D engine;
- AP Calculus lesson visual audit;
- readiness content models;
- accessibility;
- question metadata;
- Qatar Context Library;
- Teacher Intelligence.

Do not parallelize conflicting architecture work prematurely.

---

# 64. IMMEDIATE STARTING INSTRUCTION

Start now by inspecting current `main`.

Do NOT reset the project.

Do NOT create a new platform.

Do NOT overwrite existing strong architecture.

Determine:

1. the current deployed commit;
2. which previous ECHS backlog tasks are genuinely complete;
3. which are implemented but not production-verified;
4. which dependencies remain;
5. what existing AP Calculus Units 2–5 lessons contain;
6. which current interactions should be preserved;
7. the state of Lesson Studio;
8. the state of Math Component Registry;
9. the state of the 3D engine;
10. the state of readiness;
11. the state of mastery;
12. the state of AI;
13. the state of Qatar context;
14. the state of curriculum/question QA.

Create/update a machine-readable master execution plan based on the actual repository state.

Then continue implementation from the FIRST unmet dependency.

Do not stop after producing the audit.

Proceed into implementation.

---

# 65. FINAL PRODUCT PHILOSOPHY

ECHS Mathematics should answer:

Can we have:

global curriculum rigor
AND local identity?

conceptual understanding
AND exam readiness?

interactivity
AND mathematical depth?

AI support
AND productive struggle?

personalization
AND high expectations?

readiness
AND student opportunity?

assessment
AND learning?

one ecosystem
AND different pathways?

visualization
AND rigorous symbolic mathematics?

The architectural answer must be:

YES — but only if these elements are designed as one evidence-driven learning system rather than disconnected tools.

The final philosophy is:

## IF THE MATHEMATICS IS DYNAMIC,

## THE LEARNING EXPERIENCE SHOULD NOT BE UNNECESSARILY STATIC.

## IF THE MATHEMATICS IS SPATIAL,

## DO NOT FORCE THE STUDENT TO RELY ONLY ON AN IMAGINED SOLID.

## IF A STUDENT SCORES HIGHLY,

## DO NOT CALL IT MASTERY WITHOUT SUFFICIENT EVIDENCE.

## IF A STUDENT STRUGGLES,

## IDENTIFY THE SKILL, REPRESENTATION OR PREREQUISITE — NOT ONLY THE WRONG ANSWER.

## IF AI IS USED,

## USE IT TO SUSTAIN THINKING — NOT REPLACE THINKING.

## IF ONE PLATFORM SUPPORTS MULTIPLE CURRICULA,

## RESPECT THEIR DIFFERENT PATHWAYS AND MATHEMATICAL CULTURES.

And above all:

# DO NOT MAKE THE MATHEMATICS EASIER.

# MAKE THE MATHEMATICS MORE VISIBLE,

# MORE INVESTIGABLE,

# MORE MEANINGFUL,

# AND MORE EVIDENCE-DRIVEN.

Build ECHS Mathematics as a durable production educational system, not as a collection of impressive demos.