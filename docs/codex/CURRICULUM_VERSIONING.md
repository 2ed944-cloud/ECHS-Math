# Curriculum Versioning

Curriculum is data, not hard-coded application behavior.

## Why this is mandatory

As of 7 September 2026:
- College Board has Fall 2026 clarifications for AP Calculus AB/BC and AP Precalculus.
- AP Calculus and AP Precalculus exam timing/count changes take effect in May 2027.
- IB Mathematics AI has an active curriculum with first assessment 2021.
- IB has published information for a revised mathematics course with first assessment 2029.

A single unversioned `course = IB AI SL` record will eventually become incorrect.

## Model

### curriculum_family
Examples:
- `college-board-ap`
- `ib-dp`

### curriculum_version
Fields:
- id
- family
- name
- effective_from
- effective_to
- first_assessment
- last_assessment
- status (`active`, `future`, `retired`)
- source_reference
- verified_at
- verified_by

### course_version
Examples:
- `ap-calculus-ab-2026-27`
- `ap-calculus-bc-2026-27`
- `ap-precalculus-2026-27`
- `ib-ai-sl-first-assessment-2021`
- `ib-ai-sl-first-assessment-2029` (future)

## Cohort assignment

A class is assigned to a course version.

Never infer a future syllabus merely from the current calendar year.

Example:
An IB AI SL student beginning DP in 2026 and assessed in 2028 belongs to the current first-assessment-2021 course version, not the future first-assessment-2029 version.

## Assessment profiles

Exam format must be configuration.

Example fields:
- sections;
- question counts;
- timing;
- weighting;
- calculator policy;
- delivery mode;
- response mode;
- effective exam dates.

Do not encode “AP Calculus has 45 MCQs” into UI logic.

For May 2027, AP Calculus uses 42 MCQs:
- 29 no-calculator, 62 minutes;
- 13 calculator-required, 38 minutes;
and 6 FRQs:
- 2 calculator-required, 30 minutes;
- 4 no-calculator, 60 minutes.

For May 2027, AP Precalculus uses:
- 42 MCQs total;
- 4 FRQs total;
with calculator/non-calculator partitions defined by College Board.

Reverify exact AP Precalculus FRQ subtype/timing configuration from the current official exam page before coding.

## Question mappings

A question can map to multiple curriculum versions only if reviewed.

Mapping requires:
- objective;
- skill/practice;
- unit/topic;
- calculator policy;
- validity date;
- reviewer.

Never automatically carry old mappings into a revised syllabus.

## Lesson mappings

Lesson content can be shared across course versions, but objective mappings are version-specific.

## Source verification job

Build a curriculum verification checklist, not a web scraper that silently edits production.

At least annually or when an official update is announced:
1. compare authoritative documents;
2. create a proposed curriculum version diff;
3. review;
4. publish;
5. assign cohorts deliberately.

## UI behavior

Teacher sees:
- course name;
- curriculum version;
- assessment year;
- future-version warning when applicable.

Student sees a clean course name but the system retains version metadata.

## Future-proofing

Do not make IB 2029 a reason to change current 2026–28 course content now.

Build the architecture now; activate the future version only for the correct cohort.
