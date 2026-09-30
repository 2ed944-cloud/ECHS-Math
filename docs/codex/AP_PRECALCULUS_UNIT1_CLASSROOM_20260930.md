# AP Precalculus Unit 1 interactive slides

The normal guarded entry into Topics 1.1–1.14 now opens a bounded HTML classroom
adapter with 204 slides and 16 mathematical explorations. Each lesson contains
goals, notes and worked examples, original formative questions, student attempts,
stepwise worked reasoning, simulation predictions, and a final reflection.

## Sources and curriculum

The user requested the teaching sequence of the prepared ECHS PowerPoint lessons,
delivered as interactive platform slides. Text, equations and image descriptions
were reviewed from the supplied decks. Protected AP Classroom prompts and images
were not republished. These examples use original statements and numbers; this is
a teaching adaptation, not a literal copy of every PowerPoint exercise.

| Topics | Prepared material used | HTML slides | Explorations |
|---|---|---:|---:|
| 1.1 | ECHS_AP_Precalculus_Lessons_1_1_and_1_2, slides 2–29 | 15 | 2 |
| 1.2 | Updated Lesson 1.2 worksheet; combined 1.1/1.2, slides 30–66 | 16 | 1 |
| 1.3 | Updated Lesson 1.3 worksheet; Equal Intervals Examples | 16 | 1 |
| 1.4 | Lesson 1.4 worksheet (ready) | 15 | 1 |
| 1.5 | Lesson 1.5 worksheet | 15 | 1 |
| 1.6 | Lesson 1.6 worksheet | 14 | 1 |
| 1.7 | AP_Precalculus_1.7_ECHS | 15 | 1 |
| 1.8 | Lesson 1.8 ECHS | 15 | 1 |
| 1.9 | Lesson 1.9 ECHS | 14 | 1 |
| 1.10 | Audited platform topic: holes and domain exclusions | 13 | 1 |
| 1.11 | Audited platform topic: division and binomial expansion | 13 | 2 |
| 1.12 | Audited platform topic: transformations and point/set mapping | 14 | 1 |
| 1.13 | Audited platform topic: model selection, assumptions and residuals | 14 | 1 |
| 1.14 | Audited platform topic: construction and contextual domain | 15 | 1 |

The record version is `ap-precalculus-2026-27`, mapped by Topic 1.1–1.14 to
the AP Precalculus CED effective Fall 2026 and current clarification document.
Metadata carries the three AP Precalculus mathematical practices and primary
source links. Included endpoints of a restricted polynomial domain may be local
extrema by one-sided comparisons. Raw output differences, average rates, changes
in average rates and changes per input unit are distinguished for nonunit widths.
Hypothetical contextual values are labeled, with suitable units and domains.

## Compatibility and authority

Canonical historical lesson files and banks remain unchanged. A separate build
transform runs after the existing lesson guard and investigation injection,
adding one early route-capture bootstrap to precisely fourteen guarded copies.
It requires the existing AP Precalculus guard and never sets access attributes.
The normal entry opens the new slides. `classroom=0`, `forum=1`, native deep links
and explicit quiz/exam/practice/studio/teacher/mode routes retain the historical
deck. `classroom=1` explicitly opens the new slides; `#classroom-slide-id` is a
stable new slide deep link. The original requested route is captured before the
native engines rewrite their hashes.

“More practice & original lesson” restores the original deck. A return button
reopens the adapter at the same slide. The existing question bank, private
publication gates, evidence, assignment checks, account bar and tutor are owned
by their current systems. No new learner API, grade, completion or mastery event
is written. Drafts, selections and reveal state remain in memory for the current
owner and open tab. A paper attempt is self-acknowledgment, not a verified answer.
Notes can reveal their explanation immediately; activity answers require a
typed/selected attempt or a paper attempt. Editing an answer hides its solution
and closes the model. Revisiting a slide retains the draft but recreates a model
only after an explicit Explore action.

Startup waits for the existing allowed lesson gate and portal decision. The
adapter captures and subscribes to the canonical owner authority; account,
organization, role, session, status, expiry, epoch, course and unchanged query
route are rechecked before mutations and after lazy imports. Revocation,
pagehide, denied access, query-route changes and expiry dispose the owned UI,
listeners, pending models and in-memory state. BFCache return attempts a fresh
owner-bound startup. Import failure leaves the historical deck available.

## Rendering and models

Content is separate from presentation in `lessons/shared/classroom/precalc-unit1`.
This is a bounded data-driven compatibility pilot, not a replacement of the
canonical Lesson Studio schema or a new teacher publishing system. Teachers can
continue using the existing authoring systems. No framework or global graphing
library is introduced.

Text uses safe DOM construction. TeX is rendered with the existing local KaTeX,
with trust disabled. Polynomial graphs use declared coefficients, domains,
windows and accompanying sample tables. Topic 1.2/1.3 secants update both endpoint
values, interval rates and all three difference layers. Topics 1.4–1.14 reuse the
already audited stateless polynomial, rational, equivalence and modeling views,
loaded after a prediction. Topic 1.1 ports the identical car/vessel DOM nodes and
restores them on exit; native controls and handlers remain attached. Car motion
is paused after restoration, including owner revocation.

The layout supports 1440×1000, 1366×768 and 390×844. Content may scroll vertically
inside a slide; the navigation remains visible. Graphs/table containers have
bounded widths, large controls and accessible labels. Shortcuts do not steal
typing, native model controls or dialogs. Reduced-motion styles apply, and the
native car retains its reduced-motion quarter-lap control.

## Verification and rollback

Local checks verify all fourteen paths, 204 slides, 16 models, 185 TeX expressions,
31 independently calculated numeric answers, domain/identity/sign cases, numeric
fraction parsing, staged-reveal state, and synthetic owner failure/late-import
paths. Injection tests check precise allowlisting, required guards, idempotence,
malformed hooks, and byte preservation after removing the hook. Existing access,
visibility, investigation-owner, polynomial and rational model tests also run.

The `AP Precalculus Unit 1 interactive classroom` workflow uses real canonical
decks and production build hooks with a clearly synthetic read-only authority.
It blocks external requests, exercises all slides at three viewport sizes,
changes model controls, checks solutions/keyboard navigation/original restoration,
tests denied roles and revocation, checks no new storage writes and exports
screenshots. This does not claim a signed-in production server authorization test.
The unchanged access contracts and Pages release checks remain required.

For a per-link rollback use `?classroom=0`. For global rollback remove only the
new build-injection step; original lessons and existing investigations remain
available without the adapter. No learner migration or data deletion is needed.
