# Product Knowledge — Verified Repository Facts

This file is the sales agent's factual product baseline. It is derived from the current `ECHS-Math` repository. The sales agent must distinguish **verified implementation facts** from **commercial/legal claims that still require owner approval**.

## Product positioning

Current repository positioning:

> A connected mathematics learning experience in which lessons, practice, review, assessment and visible mastery work together in one school-managed pathway.

The current repository is branded **ECHS Mathematics / Education City High School**. **Commercial rights to sell, license, white-label or reuse that branding are not established by source code.** External sales deployment must use the approved commercial product/brand from the private sales policy.

## Verified learning architecture

The landing experience describes a connected pathway:

1. **Learn** — interactive lessons and assigned learning.
2. **Practise** — focused practice connected to course/unit/lesson.
3. **Review & Recover** — mistakes return for review.
4. **Master** — performance and recovery contribute to visible mastery evidence.

### Current course pathways visible in the repository

- AP Calculus
- AP Precalculus
- Algebra 2 Concepts
- IB Mathematics

Do not claim complete coverage of any external syllabus unless the deployed curriculum audit explicitly verifies it.

## Student experience

Verified in `question-bank/student.html`:

- role-specific student dashboard;
- today's mission;
- overall mastery;
- daily question target;
- learning streak;
- spaced-review queue;
- adaptive practice launch;
- review and mistake recovery;
- focused tests;
- interactive lessons;
- recommended next skill based on learning evidence;
- weekly learning rhythm/time;
- teacher assignments and due work;
- unit knowledge map with Starting / Developing / Proficient / Mastered progression;
- strengths and recommended focus areas;
- achievements and recent activity.

### Safe sales statement

"Students get one connected route across lessons, practice, review and assessment, with visible mastery and a clear recommended next step."

### Do not automatically claim

- a proven increase in exam scores;
- a specific percentage improvement in attainment;
- AI personalization unless the exact decision logic is confirmed and accurately described;
- predictive analytics;
- accessibility certification;
- a mobile native app.

## Practice Studio

Verified in `question-bank/practice.html`:

- course → bank → unit/lesson → session setup;
- one focused course/bank route;
- complete-question practice;
- available question count and selected-bank count;
- reviews due and mastered skills indicators;
- learning modes:
  - focused/manual practice;
  - adaptive practice;
  - due spaced review;
  - mistake recovery;
- selectable course/question bank/scope/unit/lesson controls;
- a learn → practise → master workflow.

### Safe sales statement

"Practice can be targeted to a specific course, bank, unit and lesson, while the same environment also supports adaptive, due-review and mistake-recovery modes."

## Test Generator

Verified in `question-bank/exam.html`:

- timed assessment builder;
- selection by group/bundle/collection;
- difficulty filters;
- configurable question count and minutes;
- support shown for MCQ, true/false and exact-answer fill blanks;
- results update mastery/review timing/Mistake Bank in the current learning system;
- assignment links;
- continue-after-interruption behavior indicated by the product UI;
- public page explicitly separates released Official AP simulation from the regular test builder.

### Safe sales statement

"Teachers can build focused timed mathematics tests from the platform's practice sources, and the resulting evidence feeds the same mastery/review system."

## Teacher experience

Verified in `question-bank/teacher.html`:

- Class Pulse;
- Today's Attention;
- student view;
- Skill Analysis;
- Assignments;
- timetable entry;
- Practice Studio;
- Test Generator;
- Lesson Portal;
- Family Reports;
- class readiness/on-track indicator;
- student count;
- active-this-week indicator;
- average mastery;
- learners needing support;
- highest-value attention/intervention list based on learning evidence;
- class engagement pulse;
- create assignment action;
- account import entry point.

### Safe sales statement

"Teachers can move from class-level evidence to targeted action without switching between disconnected lesson, practice and assessment systems."

## Family / parent experience

Verified in `question-bank/parent.html`:

- linked-student selector;
- family progress story;
- mastery, accuracy, streak and reviews-due metrics;
- seven-day engagement rhythm;
- strengths and priorities;
- teacher assignments and completion status;
- seven-day support plan;
- printable report action;
- design intent explicitly avoids exposing unrelated students or unnecessary private response data.

### Safe sales statement

"Families receive a simplified view of progress, assignments, strengths, priorities and practical next actions rather than a teacher-style data dump."

## Administration / school control

Verified in `question-bank/admin.html`:

- school overview;
- account directory;
- account roles: admin, teacher, student, parent;
- account status: active, suspended, archived;
- CSV account import, up to 500 rows per import according to current UI;
- individual account creation;
- generated initial-password option;
- password reset;
- suspension/session-revocation behavior described by the UI;
- school/student IDs and grades;
- live directory metrics;
- recent login/activity view;
- security-posture section.

The current UI states that passwords are stored as secure hashes and that existing passwords are not retrievable. Before a contractual security claim, validate the deployed backend and security review rather than relying only on UI copy.

### Safe sales statement

"The platform includes role-based school account management, bulk account provisioning and administrative controls for learner/teacher/family access."

## Question bank boundaries

Verified in repository `README.md` at the current audited release:

- canonical records: 1,217;
- 876 MCQ and 341 FRQ;
- public student-ready records: 1,104;
- teacher/archive-restricted records: 113;
- the repository states that only independently verified, exactly lesson-mapped, ECHS-owned records whose source metadata permits public publication enter student practice/exam flows;
- restricted records retain archive metadata while withholding prompt/choices/answers/solutions/rubrics/media from public student data;
- course-specific private practice banks may live in private Supabase storage/database and therefore do not necessarily appear in the public GitHub catalogue.

These numbers describe the current repository snapshot; they can change. Never promise a static number in a proposal without re-checking the deployed release.

### Critical AP/third-party wording rule

The repository contains AP-related pathways and a section labelled Official AP. **Do not infer from that label that the commercial seller is endorsed by, partnered with or licensed by College Board.**

Approved wording unless the claims register is later expanded:

- "AP Calculus learning pathway"
- "AP Precalculus learning pathway"
- "AP-aligned / AP-related" only when alignment has been separately verified for the commercial build

Prohibited without written verification:

- "College Board partner"
- "College Board licensed"
- "official College Board platform"
- "all official College Board questions"
- any trademark/endorsement statement beyond nominative course references

Apply the same principle to IB and any other curriculum body.

## Deployment/privacy boundary

Repository `README.md` explicitly notes that GitHub Pages is a **public static host** and is not an authenticated school-only boundary. The current student runtime filters/redacts public material, while genuinely private teacher/admin deployment requires an authenticated host.

Therefore:

- do not sell GitHub Pages itself as the production private school deployment;
- production proposals must describe the actual authenticated deployment selected for the customer;
- never expose production credentials or real learner data in the sales demo.

## Buyer-to-value map

| Buyer | Likely value areas | First demo route |
|---|---|---|
| Principal / school leader | one managed learning environment, visibility, implementation | School overview → teacher → family |
| Head of Mathematics | instructional control, evidence, intervention, assessments | Teacher → skill analysis → assignments → test generator |
| Mathematics teacher | lesson-to-practice workflow, targeted assignments, tests | Lesson portal → practice → test generator → mistakes |
| Digital learning / IT | account lifecycle, authenticated deployment, operational controls | Admin → identity/access → deployment architecture |
| Parent/family stakeholder | clear progress and practical support | Family Progress Center |
| Student representative | clear next step, practice/review/mastery | Student Journey → Practice Studio |

## Product facts the agent must re-check before every proposal

- current course list;
- current question-bank counts;
- deployment architecture;
- enabled roles/features in the buyer's package;
- commercial brand name;
- support/onboarding scope;
- integrations actually configured;
- pricing and term;
- data/privacy documents;
- third-party curriculum/trademark wording.

## Unknown until configured

The repository alone does **not** establish:

- commercial list price;
- subscription period;
- school license model;
- legal seller entity;
- commercial rights to the ECHS name/logo;
- support SLA;
- onboarding fee;
- hosting region;
- DPA/data-residency commitments;
- SSO integrations;
- payment processor;
- tax treatment;
- refund rules;
- procurement terms;
- customer references;
- outcome studies;
- certification/accreditation;
- third-party endorsement/licensing.

If asked about one of these before it is configured, say it is not part of the currently verified product facts and do not improvise.
