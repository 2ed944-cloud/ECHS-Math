# IB Mathematics AI SL Unit 1 — Platform QA

## Delivery scope

- 8 interactive lessons covering Topics 1.1–1.8
- 392 learning slides
- 320 Practice Studio questions
- 80 independent timed-quiz questions
- 16 extended IB-style tasks
- Shared responsive lesson shell with Learn, Practice Studio, IB Tasks, Timed Quiz, and Mastery routes
- Completion evidence recorded through the existing `echs_math_complete` and `echs_learning_lesson_events_v2` browser records
- Course, unit, lesson, and skill-key routing for the authenticated ECHS platform

## Source-package validation

The complete source package passed its bundled validators:

- lesson structure and assessment counts: passed
- 392/392 learning slides: passed
- 320/320 Practice Studio questions: passed
- 80/80 quiz questions: passed
- 16/16 extended tasks: passed
- short-prompt duplicate audit: passed
- numeric-answer and tolerance audit: passed
- KaTeX delimiter audit: passed
- local-link audit: passed

## Platform-delivery validation

- compressed lesson payloads decode successfully
- decompressed data, engine, and bootstrap JavaScript pass `node --check`
- all eight lesson records load from the delivered data payload with counts of 49 slides, 40 studio questions, 10 quiz questions, and 2 extended tasks each
- landing-page links and portal catalogue links target the shared lesson shell with the correct `lesson=1.x` query
- portal registration is loaded before `portal.js`, so the IB Mathematics AI course is present when cards and lesson pathways are rendered
- existing private bank records, IDs, provenance, rights metadata, and canonical chunks are not copied or modified

## Release note

This delivery targets the current IB Mathematics: Applications and Interpretation SL course used through the 2028 assessment sessions. It retains logarithms in Lesson 1.5. The first-assessment-2029 revision must be reconciled separately before use with that cohort.

## Remaining release gate

After merge and GitHub Pages deployment, complete a production smoke test while signed in as a student, teacher, and administrator. Confirm course visibility, lesson opening, completion recording, and skill-focused practice routing in the deployed environment.
