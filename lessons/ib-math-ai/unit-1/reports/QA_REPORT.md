# IB Mathematics: Applications and Interpretation SL — Unit 1 Release QA

## Release decision

**Ready for ECHS platform integration.** The package is complete, self-contained, responsive, and validated as a current-course **Number and Algebra** release. It has not been pushed to or deployed on the production website by this package build.

## Release 1.0.1 — direct offline opening correction

A direct Windows-style local opening exposed a release-blocking issue in 1.0.0: lesson pages loaded the runtime as an ES module. Chromium-based browsers apply stricter origin rules to module imports under `file://`, so the page could remain permanently on **Loading lesson…** even though the same bundle worked when served over HTTP.

The 1.0.1 correction:

- replaces the module loader with ordered deferred classic scripts;
- provides a browser-global KaTeX build isolated inside a closure;
- isolates the lesson engine to prevent global identifier collisions;
- guards all browser storage access and falls back to session memory if storage is denied;
- updates all eight lesson entry pages consistently.

Post-fix validation passed for all eight lessons: initial rendering, removal of the loading state, Learn navigation, Slide Map, Practice Studio, hidden worked solutions, both extended tasks, markscheme reveal, Timed Quiz, Mastery view, and zero JavaScript errors. Machine-readable results are in `reports/offline-opening-fix-qa.json`.

## Verified scope

- 8 standalone HTML lessons covering current-course SL 1.1–1.8
- 392 Learn screens: 49 per lesson
- 320 original Practice Studio questions: 40 per lesson
- 80 independent timed-quiz questions: 10 per lesson
- 16 extended-response IB-style tasks: 2 per lesson
- 385 numerical auto-checks
- 5 stable ECHS mastery keys preserved for authenticated-bank routing

## Curriculum and pedagogy

The lessons use the current IB Mathematics: Applications and Interpretation SL course structure and make technology, modelling, interpretation, assumptions, validation, and evaluation visible throughout. Each lesson includes five concept cycles, worked examples, Student Turns, misconception clinics, an inquiry prompt, a modelling cycle, a technology lab, an investigation, an exit ticket, and mastery review.

Lesson 1.5 intentionally retains logarithms for current-course cohorts. The revised course starts teaching in August 2027, has first assessment in May 2029, and removes logarithms from AI SL. See `docs/2029_TRANSITION_NOTE.md` before assigning this package to those cohorts.

## Question and mathematical audit

- All 416 assessment IDs are unique: 320 Practice + 80 Quiz + 16 extended tasks.
- All Practice Studio levels contain exactly 10 questions per lesson.
- No exact prompt duplication occurs within or across the packaged assessment set.
- All extended-task part marks sum exactly to the stated task total.
- All prompts, answers, solutions, and markschemes required by their item type are present.
- All 385 numerical checks contain finite targets and positive tolerances.
- Every displayed numerical answer is within its checker tolerance.
- No non-zero target has a tolerance broad enough to accept zero.
- Scientific-notation checkers accept `e` notation and forms using `×`, `x`, or `*` with powers of ten.
- Context-dependent draft wording such as “the previous question” or “the same loan” was removed so cards remain valid when randomized.

Targeted corrections made during audit include arithmetic-sequence capacity/index calculations, inverse arithmetic-sequence data, geometric crossover and finite-sum values, context equations for three-variable systems, break-even revenue data, financial wording, bounds terminology, and precision handling for very small numbers.

Detailed machine-readable results are in `reports/question-audit.json` and `reports/qa-results.json`.

## Browser and rendering QA

### Responsive functional run

18 of 18 endpoint tests passed:

- all 8 lessons at 1440×900
- all 8 lessons at 390×844
- unit home at both viewports

The run verified route switching, Slide Map, local note persistence, Practice Studio, level filtering, hints, hidden solutions, timed quizzes, extended tasks, markscheme reveal, technology labs, KaTeX rendering, and horizontal-overflow protection. There were no browser console errors or page errors.

### Comprehensive render run

The exact generated HTML/CSS/data/runtime bundle was rendered in Chromium and traversed card by card:

- 392 of 392 Learn screens
- 320 of 320 Practice Studio cards
- 80 of 80 Quiz cards
- 16 of 16 extended tasks

All eight lessons passed with zero KaTeX fallback errors and zero horizontal-overflow failures. Results are recorded in `reports/comprehensive-render-audit.json`.

## Packaging and rights boundary

- No font files are packaged.
- KaTeX JavaScript is local; CSS uses system-font fallbacks.
- Lesson teaching and assessment prompts are original ECHS content.
- Attached private-bank prompts, source PDFs, and canonical bank JSON were not copied into public lesson files.
- Existing bank IDs, provenance, rights metadata, canonical chunks, and private registries were not modified.
- The authenticated bank bridge uses only course, unit, lesson, and existing mastery-skill keys.

## Re-run checks

From the package root:

```bash
python tools/validate_package.py
python tools/audit_questions.py
node --check assets/js/engine.js
node --check assets/js/katex.js
```
