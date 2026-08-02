# IB Mathematics: Applications and Interpretation SL — Unit 1 Definitive v3 QA

## Release decision

**Ready for pull-request preview and independent browser sign-off.** The redesign is implemented as an additive, offline-safe enhancement layer over the already validated Unit 1 package. Stable lesson URLs, base lesson data, shared engine behaviour, mastery keys and private-bank routing are preserved.

The branch is not merged or deployed by this report.

## Definitive v3 scope

Each of the eight lessons keeps its original validated baseline of 49 Learn slides, 40 Practice Studio questions, 10 quiz questions and 2 extended tasks. The v3 layer adds, per lesson:

- 12 source-informed Learn slides: four deep dives, four complete worked examples and four Student Transfer/misconception slides;
- 12 new original Practice Studio questions, balanced as 3 Foundation, 3 Application, 3 Reasoning and 3 Challenge;
- 4 new timed-quiz questions;
- 1 new extended-response IB-style task;
- lesson-specific original SVG diagrams and a premium responsive visual layer;
- explicit source-basis metadata and transparent current-course/2029-transition wording.

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
- 128/128 added practice/quiz prompts unique;
- every extended-task part mark sums to its stated total;
- all numerical check targets are finite and all tolerances are positive;
- final overlay counts resolve to 61/52/14/3 in all eight representative lesson tests.

Machine-readable results are recorded in `reports/v3-enhancement-audit.json`.

## Technical validation completed

- `node --check` passed for:
  - eight lesson-specific `data/lesson-1.x-v3.js` overlays;
  - `data/unit-1-v3-enhancements.js`;
  - the portal registration update.
- All eight lesson wrappers load the scripts in offline-safe ordered classic-script form:
  1. canonical lesson data;
  2. v3 reference content;
  3. v3 enhancement layer;
  4. local KaTeX;
  5. the existing lesson engine.
- The representative overlay test was executed for lessons 1.1–1.8 and produced the expected final counts and 13 questions at each Practice Studio level.
- The original baseline data remains unchanged, so the previous package validator and baseline browser evidence remain valid for the underlying 49/40/10/2 package.
- No font files are introduced.
- No question-bank IDs, provenance, rights metadata, canonical chunks or authenticated-bank records are changed.

Run the new validator from the Unit 1 root:

```bash
python tools/validate_v3_enhancement.py
```

## Visual redesign

The v3 visual layer retains the ECHS maroon identity while adding a lesson-specific accent system. Repetitive concept illustrations are replaced at runtime with distinct, accessible SVG compositions using five visual grammars: nested sets, stepped processes, connected cards, graphs and scale lines.

Additional improvements include:

- a fully redesigned Unit 1 landing page;
- clearer source-synthesis cards;
- larger formula panels;
- worked-example and Student Transfer separation;
- revealable complete checks and misconception clinics;
- dynamic route counts for the expanded Practice, Quiz and IB Task sets;
- reduced-motion support, responsive layouts and print-safe fallbacks.

## Curriculum-version note

This release targets the current AI SL course used through the 2028 assessment sessions. Lesson 1.5 is upgraded to **Exponent Laws and Logarithms** and intentionally retains logarithms for the current cohort. The landing page and lesson metadata clearly mark the first-assessment-2029 transition, in which logarithms are removed from AI SL.

## Remaining release gate

Before merge, run a Chromium preview traversal on the pull-request branch at desktop and mobile widths and verify:

- all 488 final Learn slides;
- all 416 final Practice Studio cards;
- all 112 final quiz cards;
- all 24 final extended tasks;
- KaTeX rendering and horizontal-overflow protection;
- completion events and mastery records while signed in as student, teacher and administrator.

The existing baseline browser audit is not silently relabelled as a v3 browser audit.
