# ECHS Question and Assessment Engine Specification

## Goal

Create one normalized question interface while preserving distinct sources, rights, private/public boundaries, and AP/IB assessment cultures.

## Do not flatten existing data

ECHS already has a sophisticated canonical AP bank with publication gates.

The new engine should abstract across providers rather than destroy provenance.

## Normalized question model

Recommended fields:

### Identity
- id
- version
- provider
- status

### Curriculum
- curriculum_version_id
- course
- unit
- topic
- objective
- practice/skill

### Assessment
- type
- subtype
- calculator_policy
- difficulty
- estimated_time
- marks
- command_term
- representations

### Content
- stem
- parts
- choices
- response_schema
- media

### Answering
- expected_answer
- equivalence_rules
- tolerance
- precision
- units
- solution
- rubric

### Learning
- misconception_tags
- prerequisite_tags
- hints
- scaffold
- extension

### Governance
- provenance
- rights
- originality
- author
- reviewer
- verification flags
- publication policy

## Types

Support:
- single MCQ;
- multi-select;
- numeric;
- symbolic;
- short text;
- multi-part structured;
- AP FRQ;
- IB structured response;
- graph response/interpretation;
- table interpretation;
- drag/match where meaningful;
- interactive parameter question;
- 3D spatial question.

## Blueprint engine

Teacher can specify:
- course version;
- units/topics;
- skills/practices;
- representation;
- difficulty;
- calculator;
- question type;
- count;
- context;
- misconception target.

Engine returns eligible reviewed questions.

## Difficulty

Do not use one opaque AI score.

Store:
- intended tier;
- evidence when available;
- complexity descriptors.

Possible dimensions:
- procedural steps;
- representation switch;
- abstraction;
- reasoning;
- unfamiliarity;
- context load;
- algebra burden.

## AP Calculus profile

Validation checks:
- AP practice;
- representation;
- calculator policy;
- notation;
- rationale/justification when required;
- original prompt.

## AP Precalculus profile

Checks:
- practice;
- modeling/covariation;
- function family;
- representation;
- calculator;
- reasoning.

## IB AI SL profile

Checks:
- command term;
- marks;
- technology expectation;
- precision;
- multi-part dependency;
- interpretation;
- context;
- markscheme structure.

## Distractor generator

Generate distractors from misconception transforms.

Example framework:
1. compute correct answer;
2. apply candidate misconception;
3. reject duplicates;
4. reject implausible/unreadable results;
5. verify only one correct option;
6. label misconception privately.

Never create three random numbers.

## Similar-question generation

“Generate similar” must preserve a declared blueprint, not surface wording.

Pipeline:
- extract blueprint;
- generate new parameters/context/representation;
- solve independently;
- validate;
- compare difficulty;
- originality check;
- mark draft.

## Qatar-context variant

Keep target mathematics fixed.

Variant can change:
- dataset;
- story;
- labels/units;
- image/diagram.

Then re-run mathematical validation because new data can change difficulty or answer behavior.

## QA gate

A question is student-ready only after:

1. schema valid;
2. curriculum mapped;
3. source/rights valid;
4. prompt complete;
5. answer independently verified;
6. mathematical verification passed;
7. choices unique/valid;
8. solution/rubric valid;
9. KaTeX/math render valid;
10. media valid;
11. accessibility valid;
12. calculator policy valid;
13. reviewer approval.

Integrate with existing strict bank gates rather than weakening them.

## Assessment Studio

Teacher actions:
- manual selection;
- blueprint generation;
- mix banks;
- mix lessons;
- set versions;
- randomize order/variants;
- calculator sections;
- timing;
- attempts;
- release answers later;
- preview student view;
- export/print if supported.

## AP simulation

Assessment profile determines:
- sections;
- timing;
- calculator mode;
- weights;
- delivery.

## IB simulation

Support:
- Paper 1/Paper 2 current profile;
- marks;
- multi-part layout;
- technology required;
- teacher markscheme;
- solution release.

## Response grading

Auto-grade only where defensible.

Symbolic grading requires mathematical equivalence, not string equality.

FRQ/IB extended response can use:
- teacher scoring;
- structured rubric;
- optional AI suggestion clearly marked non-authoritative.

Never let an AI score silently become official grade evidence without policy and review.

## Analytics

Record:
- question;
- version;
- attempt;
- response;
- correctness;
- time;
- hints;
- misconception evidence;
- skill/representation;
- route;
- assignment context.

Avoid storing unnecessary sensitive data.

## Publication boundary

A student endpoint must never receive:
- hidden answer;
- rubric;
- restricted prompt;
- teacher note;
- private source asset

before authorized release.
