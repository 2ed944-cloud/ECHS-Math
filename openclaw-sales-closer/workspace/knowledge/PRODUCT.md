# Verified product knowledge

This file describes functions evidenced in the current repository. It is product knowledge, not a promise that every function is enabled in every future customer deployment.

## Product thesis

A connected mathematics learning environment that links:
`interactive lesson → focused/adaptive practice → review/recovery → mastery evidence → teacher action`

The current landing page positions the platform as a secure school-managed learning pathway with role-based experiences.

## Current reference courses shown publicly

- AP Calculus
- AP Precalculus
- Algebra 2 Concepts
- IB Mathematics

Do not infer that every lesson/unit is equally complete from the public course label. Verify detailed coverage when the buyer asks for a specific syllabus.

## Student experience

Repository evidence includes:
- assigned learning path;
- personalized “today’s mission”;
- overall mastery;
- daily question target;
- learning streak;
- review queue;
- adaptive practice;
- mistake/recovery workflow;
- focused tests;
- interactive lessons;
- recommended next skill;
- weekly learning rhythm;
- assignments and due work;
- knowledge map;
- strengths and priority areas;
- achievements and recent activity.

## Teacher experience

Repository evidence includes:
- class pulse / readiness;
- roster and active learners;
- average mastery;
- learners needing support;
- prioritized attention/interventions;
- class engagement;
- students;
- skill analysis;
- assignments;
- timetable;
- targeted practice assignment;
- Practice Studio;
- Test Generator;
- Lesson Portal;
- Family Reports;
- class/account management surfaces.

## Practice Studio

Repository evidence includes:
- course selection;
- question-bank selection;
- unit/lesson scope;
- focused practice;
- adaptive practice;
- due spaced review;
- mistake recovery;
- question availability counters;
- review due and mastery counters.

## Test Generator

Repository evidence includes:
- timed assessments;
- source-aware selection;
- question count/time controls;
- difficulty controls;
- auto-graded supported response types;
- interrupted-attempt continuation language;
- assignment links;
- results feeding local mastery/review/mistake systems.

Important: the page explicitly separates released “Official AP” simulation from the general test generator. Never imply access to third-party/restricted material in a commercial sale unless legal/product policy separately authorizes it.

## Family experience

Repository evidence includes:
- linked-child selector;
- mastery and accuracy summaries;
- learning streak;
- spaced-review due;
- weekly engagement;
- strengths/priorities;
- assignments;
- seven-day support plan;
- intentionally limited exposure of private question response data.

## Administrator experience

Repository evidence includes:
- school overview;
- account directory;
- student/teacher/parent/admin roles;
- account creation;
- CSV import;
- account status management;
- security posture UI;
- role-based access surfaces;
- password reset flow;
- session revocation language;
- school-managed accounts without public registration.

## Backend/authentication observations

The account API:
- uses server-side Supabase service credentials;
- derives SHA-256 hashes for session tokens/client metadata;
- enforces role checks for account operations;
- generates strong initial passwords when needed;
- records account-management audit actions;
- delegates account creation to a database RPC.

Do not convert these observations into certification claims. Do not state “fully secure”, “GDPR compliant”, “ISO certified”, “COPPA compliant”, or equivalent unless independent verification exists.

## Value themes by buyer

### Head of Mathematics
- one coherent path instead of disconnected lessons/questions;
- teacher visibility into mastery and intervention needs;
- targeted assignments and practice;
- consistent course experience.

### School leadership
- role-based institutional environment;
- school-managed identities;
- teacher/student/family/admin views;
- evidence and accountability across the learning journey.

### Teacher
- lesson resources + practice + assessment in one workflow;
- clear class priorities;
- targeted student support;
- reduced manual assembly of practice/tests.

### Parent/Family
- understandable progress story;
- actionable weekly support rather than raw data.

### Student
- clear next step;
- mistake recovery;
- visible mastery;
- focused learning rather than question overload.

## Positioning boundaries

Say:
- “The current reference implementation includes…”
- “The repository shows…”
- “For your deployment we would confirm the exact course scope…”

Do not say:
- “Used by schools across Qatar” unless a verified customer list exists.
- “Proven to improve scores by X%” without evidence.
- “Official College Board/IB platform.”
- “Replaces every LMS.”
