# IB Mathematics: Applications and Interpretation SL — Unit 1 Definitive v3 QA

## Release status

**Merged into `main` and repository-validated.** Pull request **#149** installed the definitive Unit 1 v3 release on the existing canonical IB Mathematics AI course on 2 August 2026. The merge commit is `2c7c8bf7a8f5b5883c3cfa2cd5776c77f2daaf11`.

The release preserves all eight stable lesson URLs, the existing lesson engine and baseline lesson data, mastery keys, authenticated practice routing, canonical question-bank IDs, provenance, rights metadata, chunks and private Supabase records. It does not create a second IB course card.

## Definitive v3 scope

Each of the eight lessons keeps its validated baseline of 49 Learn slides, 40 Practice Studio questions, 10 quiz questions and 2 extended tasks. The v3 enhancement layer adds, per lesson:

- 12 source-informed Learn slides: four deep dives, four complete worked examples and four Student Transfer or misconception slides;
- 12 new original Practice Studio questions, balanced as 3 Foundation, 3 Application, 3 Reasoning and 3 Challenge;
- 4 new timed-quiz questions;
- 1 new extended-response IB-style task;
- lesson-specific original SVG diagrams and a premium responsive visual layer;
- explicit reference-basis metadata and current-course/2029-transition wording.

Final delivered totals:

| Measure | Per lesson | Unit total |
|---|---:|---:|
| Learn slides | 61 | 488 |
| Practice Studio questions | 52 | 416 |
| Timed-quiz questions | 14 | 112 |
| Extended IB-style tasks | 3 | 24 |

## Reference basis and rights boundary

The supplied materials were used to strengthen terminology, sequencing, worked-example depth, technology use and assessment coverage:

- Pearson, *Mathematics: Applications and Interpretation for the IB Diploma — Standard Level*;
- Haese Mathematics, *Mathematics: Applications and Interpretation SL 2*;
- Christos Nikolaidis, Topic 1A notes and the supplied MAI exercise collections for rounding, exponents, systems, arithmetic sequences and geometric sequences.

The implementation is an original ECHS adaptation. No textbook pages, screenshots, proprietary diagrams or verbatim exercise banks are embedded in the public lesson files.

## Mathematical and assessment audit

The v3 validator passed:

- 8/8 enhancement packs present;
- 4/4 deep dives per lesson;
- 12/12 added practice questions per lesson;
- exact 3/3/3/3 level balance per lesson;
- 4/4 added quiz questions per lesson;
- 1/1 added extended task per lesson;
- 136/136 added assessment IDs unique;
- 128/128 added practice and quiz prompts unique;
- every extended-task part mark sums to its stated total;
- all numerical check targets are finite and all tolerances are positive;
- final overlay counts resolve to 61/52/14/3 in all eight representative lesson tests.

Machine-readable results are recorded in `reports/v3-enhancement-audit.json`.

## Technical validation completed

- `node --check` passed for the eight lesson-specific `data/lesson-1.x-v3.js` overlays, `data/unit-1-v3-enhancements.js` and the portal registration update.
- All eight lesson wrappers load scripts in offline-safe ordered classic-script form: canonical data, v3 content, enhancement layer, local KaTeX and the existing engine.
- The representative overlay test produced the expected final counts and 13 questions at each Practice Studio level.
- No font files were introduced.
- No canonical bank records or private-bank metadata were changed.

At the exact pre-merge head of pull request #149, the repository workflows completed successfully:

- **IB Lesson Platform QA**, including source integration, guarded lesson-artifact construction and exact guarded-artifact validation;
- **Deploy ECHS Mathematics to GitHub Pages**;
- **Independent question-bank audit snapshot**.

The canonical delivery catalogue on `main` records release `3.0.0` and the final 488/416/112/24 totals.

## Visual redesign

The v3 visual layer retains the ECHS maroon identity while adding lesson-specific accents. Repetitive illustrations are replaced at runtime with distinct, accessible SVG compositions using nested sets, stepped processes, connected cards, graphs and scale lines.

Additional improvements include:

- a fully redesigned Unit 1 landing page;
- clearer source-synthesis cards;
- larger formula panels;
- clearer separation of worked examples and Student Transfer tasks;
- revealable complete checks and misconception clinics;
- dynamic route counts for the expanded Practice, Quiz and IB Task sets;
- reduced-motion support, responsive layouts and print-safe fallbacks.

## Curriculum-version note

This release targets the current AI SL course used through the 2028 assessment sessions. Lesson 1.5 is upgraded to **Exponent Laws and Logarithms** and intentionally retains logarithms for the current cohort. The landing page and lesson metadata mark the first-assessment-2029 transition, in which logarithms are removed from AI SL.

## Remaining operational acceptance

The previous baseline browser audit remains evidence for the underlying 49/40/10/2 package and is not relabelled as an exhaustive v3 browser audit. After production deployment propagates, complete a signed-in smoke test at desktop and mobile widths and confirm:

- the Unit 1 landing page and all eight lesson URLs open correctly;
- KaTeX, SVG diagrams and horizontal-overflow protection behave correctly;
- Learn, Practice Studio, IB Tasks, Timed Quiz and Mastery routes operate as expected;
- completion events and mastery-focused practice routing work for student, teacher and administrator roles.

This role-based production smoke test is the remaining operational acceptance step; the v3 source, mathematical structure and guarded platform integration have passed the repository release gates.
