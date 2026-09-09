# AP Precalculus 1.2 classroom redesign — 4.0.0

The main path now teaches through a warm-up, seven numbered investigations, five student turns, a written-response workshop and an exit ticket. It is intended for two teaching sessions; additional original notes, questions and extensions remain available from a practice menu. The main path is 21 slides plus the menu, within a total of 61 retained/generated slides.

The versioned `rates-1-2-classroom-data-v4.js` manifest supplies the sequence, original formative items, prompts and typed question/reflection blocks. Its fixed-template compatibility layer runs before the established lesson engine. This is a lesson-specific data adapter, not a migration to the institutional Lesson Studio schema. Existing assessment IDs, models, URLs, source metadata, rubrics and protected continuation remain intact.

## Curriculum and mathematics

Reviewed against the official College Board AP Precalculus Course and Exam Description effective Fall 2026, Topic 1.2, printed p.31:
https://apcentral.collegeboard.org/media/pdf/ap-precalculus-course-and-exam-description.pdf#page=38

- 1.2.A.1: output change/input change, equivalent constant rate, signs and units.
- 1.2.A.2–3: estimate and compare rates at points through small containing intervals.
- 1.2.B.1–3: covariation, signed rates and contextual interpretation.
- Skills 2.A and 3.A: graphical/numerical/algebraic/verbal evidence, appropriate precision.

No differentiation, formal limit calculations, trigonometry or finite-difference classification is required. Corners, jumps and symbolic extensions remain in the optional practice area. All questions are original classroom tasks, not reproduced AP Classroom items. Example measurements and printing costs are illustrative, not claims about measured school data. The new items' calculator status is no-calculator; decimal outputs are supplied when needed.

## Classroom experience

Warm-up → tank investigation → quotient consolidation → movable endpoint graph → worked graph → student turn. Further cycles develop unequal-interval comparisons, zero average versus constancy, nearby rates and signed-rate comparisons. Technology work retains full-precision values before rounding. Nine additional objective checks bring the lesson to 47 checks, including the retained 24 AP-style MCQs and six optional challenge MCQs. The six original six-point written tasks are preserved (36 self-assessed points).

The maroon/teal chapter navigation, task instructions, readable graphs and working areas support both projection and individual study. All ten investigations now have reset buttons. Keyboard controls, focus indicators, reduced-motion handling, print suppression of hidden answers, and local KaTeX remain available. Written reflection prompts use the existing account-scoped draft storage; no new records are sent to a service.

## Compatibility and verification

- New navigation writes stable slide-ID fragments; old numeric fragments resolve using the old 55-slide order.
- Existing response keys/revision are preserved because their questions are unchanged. Old saved slide indices migrate to stable IDs; resetting work preserves the current stable ID.
- Account switching clears/reloads reflection drafts as well as existing responses. Local work and self-scoring never award institutional mastery.
- Independent arithmetic checks cover all new keys and existing mathematical models. The DOM regression exercises all 47 checks, ten investigations, 18 written rubric parts, equations, reset, account isolation, route fragments and protected progression.
- Deployment and live verification continue through the existing GitHub Pages pipeline; new runtime/style/data assets are included in exact-byte live checks.
- No browser visual test was requested. Responsive and accessibility behavior is checked through source/DOM contracts; rendering is not claimed to have been visually inspected.

## Rollback

Revert this release's commit. There are no database migrations. The existing original questions and account storage revision have not been replaced. Reverting restores the former ordering and styles; new reflection/formation keys can remain inert in browser-local work. The service-worker version marker is advanced with this release to refresh lesson assets.
