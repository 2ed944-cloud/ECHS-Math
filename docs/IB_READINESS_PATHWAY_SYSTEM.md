# IB Mathematics Readiness & Pathway Intelligence System

## Purpose

This system adds an institution-level decision-support layer to ECHS Mathematics. It combines three complementary sources of evidence:

1. **MAP Growth Mathematics**: external standardized achievement/growth evidence.
2. **MYP Mathematics evidence**: criteria A–D from appropriate programme assessment evidence.
3. **IB Mathematics prerequisite diagnostic**: an original, server-graded diagnostic focused on prerequisites that matter when distinguishing AA/AI and SL/HL pathways.

The result is an explainable **0–100 readiness index** for each of the four DP Mathematics pathways:

- Mathematics: Analysis and Approaches HL (AA HL)
- Mathematics: Analysis and Approaches SL (AA SL)
- Mathematics: Applications and Interpretation HL (AI HL)
- Mathematics: Applications and Interpretation SL (AI SL)

The V1 index is **not a probability of future IB success**, is **not an official IB placement tool**, and is **not an official NWEA/MAP interpretation**. It is a local evidence synthesis model that must be validated against local outcomes before predictive claims are made.

## Design principle

The system is deliberately designed around this rule:

> Evidence should inform pathway preparation; it should not close pathways.

A learner with a developing AA HL profile receives an explicit preparation route. The platform does not automatically prevent enrollment.

## Institutional architecture

The readiness layer supports one organization containing multiple schools. `readiness_schools` and `readiness_student_schools` allow the institution to maintain a network-level view while preserving school-level analysis.

The evidence flow is:

```text
School-managed learner identity
        |
        +--> MAP evidence
        +--> MYP criteria A-D
        +--> IB prerequisite diagnostic
                    |
                    v
          Explainable pathway engine
          /       /       \       \
       AA HL   AA SL    AI HL    AI SL
          \       \       /       /
                    v
             Skill-gap analysis
                    |
                    v
             Preparation route
                    |
                    v
             New evidence / reassessment
                    |
                    v
             Readiness trajectory
```

At institution level:

```text
Student -> Class -> School -> Institution network
```

The dashboard exposes evidence coverage, pathway landscape, school summaries, shared skill gaps and locally validated outcome statistics.

## Evidence model

### 1. MAP layer

The importer accepts an approved CSV export and can map:

- student identifier
- test date
- testing season
- grade
- overall RIT
- achievement percentile
- growth percentile
- Number instructional-area RIT
- Algebra instructional-area RIT
- Functions instructional-area RIT
- Geometry instructional-area RIT
- Data/Statistics instructional-area RIT

When an achievement percentile is available, it is used as the normalized overall MAP signal. Domain RIT values are normalized using configurable local anchors. These anchors are heuristic configuration in V1; they are not represented as NWEA cut scores for IB pathways.

### 2. MYP Mathematics layer

Criterion values are normalized from 0–8 to 0–100 and used differently by pathway. The default baseline gives stronger emphasis to criterion A for AA and relatively more weight to criteria B/D in AI, while all four criteria contribute.

This is a local modelling choice and is versioned/configurable.

### 3. IB prerequisite diagnostic

The diagnostic contains 30 original multiple-choice items, three per skill cluster:

- number & quantitative fluency
- algebraic & symbolic fluency
- functions & representation
- geometry & coordinate reasoning
- trigonometric fluency
- statistics & data analysis
- probability reasoning
- mathematical modelling
- reasoning & justification
- mathematical communication

Answer keys exist only in the server function. The browser receives questions/options without correct answers. Raw responses are not retained; the database stores the skill profile, overall result and a SHA-256 response digest.

## Default weighting

The baseline model combines evidence layers with these configurable weights:

| Evidence layer | Default weight |
|---|---:|
| MAP | 0.40 |
| MYP Mathematics | 0.30 |
| IB prerequisite diagnostic | 0.30 |

If a layer is missing, the available layer weights are re-normalized for the current index. However, the system separately preserves **evidence completeness**, so a one-layer result is visibly labelled `Screening only` rather than being presented with high confidence.

Default interpretation bands:

| Readiness index | Band |
|---|---|
| 80–100 | Strong |
| 70–79.99 | On track |
| 55–69.99 | Developing |
| <55 | Needs foundation |

These bands are intervention language, not automatic admissions cutoffs.

## Pathway-specific logic

The four pathways are not created by applying one threshold to one MAP score. Each pathway has different within-layer skill weights.

The baseline emphasizes, for example:

- **AA HL**: algebra, functions, trigonometry, symbolic reasoning and MYP criterion A.
- **AA SL**: algebra/functions with a somewhat more balanced prerequisite profile.
- **AI HL**: data/statistics, probability, modelling and functional interpretation.
- **AI SL**: quantitative/data reasoning and modelling with a lower symbolic burden than AA.

All weights are visible in the model JSON and versioned on activation.

## Mathematical form

For pathway \(p\), each evidence layer produces a normalized layer score \(L_{p,k}\). With configured evidence-layer weights \(w_k\), the current readiness index is

\[
R_p = \frac{\sum_{k\in A}w_kL_{p,k}}{\sum_{k\in A}w_k},
\]

where \(A\) is the set of available evidence layers.

Evidence completeness is calculated independently as

\[
C = \frac{\sum_{k\in A} w_k}{\sum_k w_k}.
\]

This distinction is intentional: a student can have a high screening index from MAP while still having low evidence completeness.

## Skill-gap engine

The engine synthesizes available skill evidence and compares it with pathway-sensitive prerequisite targets. A gap record includes:

- skill key
- current estimated skill score
- target score
- deficit
- pathway weight
- priority
- evidence sources
- targeted recommendation

The highest-impact unresolved gaps become preparation interventions. When later evidence removes the gap, the prior active intervention is automatically resolved as mastered during recomputation.

## Readiness trajectory

Every recomputation writes four immutable snapshots. Historical snapshots retain:

- model version
- pathway
- readiness index/band
- confidence
- evidence completeness
- component layer scores
- skill profile
- gaps/reasons
- school at the time of computation
- timestamp

This enables longitudinal review rather than overwriting a learner with one current label.

## Multi-school network support

An organization can contain multiple IB schools. Administrators can:

- create school records
- assign filtered learners to a current school and academic year
- filter the cohort by school
- compare evidence coverage and average target-pathway readiness across schools
- preserve a school ID on evidence, snapshots and later outcomes

The school comparison is intentionally described as a system-improvement lens, not a league table.

## Role model

The feature reuses the platform’s existing institutional accounts and custom session tokens.

### Administrator

Can:

- see all organization students
- manage readiness schools/assignments
- import MAP and MYP evidence
- import completed IB outcomes
- recompute profiles in batches
- create/activate versioned model configurations
- view local validation statistics

### Teacher

Can:

- see only students in assigned classes
- inspect student profiles
- add dated MYP criterion evidence
- administer the IB prerequisite diagnostic to authorized students
- update preparation-route status
- recompute students in authorized scope

### Student

Can:

- see only self
- inspect all four pathway indices and evidence completeness
- choose a target pathway
- complete the diagnostic
- track preparation interventions

### Parent

Read access follows the existing parent-student link scope. Mutation routes reject the parent role.

## Imports and identity matching

Bulk imports do not create accounts. They match existing school-managed student identities by one explicitly selected identifier type:

- external school/student ID
- username
- email
- internal account UUID

Rows that do not match are rejected with row-level reasons. This avoids accidental shadow identities.

## Privacy and security controls

The feature follows the institutional backend pattern:

- browser clients do not receive a Supabase service-role key
- all readiness tables have RLS enabled
- `anon` and `authenticated` receive no direct table privileges
- server access runs through `readiness-api`
- custom institutional bearer tokens are resolved through `api_session_lookup`
- every student read/write is role-scoped
- key administrative and student actions are written to `account_audit_log`
- diagnostic correct answers are never returned to the browser
- raw diagnostic responses are not retained
- demonstration mode contains only synthetic data and is visibly labelled

Before using real data across a school network, the institution should confirm data-governance, retention, access, purpose-limitation and student/parent communication requirements.

## Local validation

The administrator can import completed DP Mathematics outcomes containing:

- student identifier
- pathway
- academic year
- final IB grade
- outcome date
- completion flag

The validation engine links each outcome to the latest compatible readiness snapshot that existed on or before the outcome date when possible.

Current statistics include:

- sample size
- Pearson correlation between readiness index and final grade
- classification accuracy at the configured `On track` threshold
- sensitivity
- specificity
- observed success rate by readiness band

The default validation success definition is final grade **5 or above**, but it is configurable.

### Minimum validation discipline

Do not reinterpret the readiness index as a probability just because the correlation is positive.

Before predictive claims, the institution should at minimum:

1. obtain a sufficiently large multi-cohort sample;
2. reserve a hold-out cohort or use rigorous cross-validation;
3. check calibration, not only classification accuracy;
4. test performance separately by pathway and school;
5. investigate systematic bias and missing-evidence patterns;
6. compare the model with simpler baselines such as MAP-only and teacher judgment;
7. review model changes through academic governance;
8. preserve the system as decision support rather than an automatic placement gate.

## API routes

`readiness-api` exposes:

| Method | Route | Scope |
|---|---|---|
| GET | `/health` | public health check |
| GET | `/overview` | authenticated role scope |
| GET | `/students` | authenticated role scope |
| GET | `/students/:id` | authorized student scope |
| POST | `/students/:id/recompute` | teacher/admin authorized scope |
| POST | `/recompute` | teacher/admin, max 100 per call |
| GET | `/schools` | authenticated |
| POST | `/schools` | admin |
| POST | `/schools/assign` | admin |
| POST | `/map/import` | admin |
| POST | `/myp/evidence` | teacher/admin |
| POST | `/myp/import` | admin |
| GET | `/diagnostic` | student/teacher/admin |
| POST | `/diagnostic/submit` | student/teacher/admin |
| POST | `/preference` | student/teacher/admin |
| PATCH | `/interventions/:id` | student/teacher/admin in scope |
| GET | `/model` | teacher/admin |
| PUT | `/model` | admin |
| POST | `/outcomes/import` | admin |
| GET | `/validation` | admin |

## Database objects

The migration creates:

- `readiness_schools`
- `readiness_student_schools`
- `readiness_models`
- `readiness_import_batches`
- `map_assessments`
- `myp_math_evidence`
- `readiness_diagnostic_attempts`
- `readiness_snapshots`
- `readiness_interventions`
- `readiness_preferences`
- `readiness_outcomes`

It also seeds a default school and baseline model for existing organizations.

## User interface

`/readiness/index.html` provides:

- network overview
- school comparison
- cohort evidence matrix
- search/filter by evidence profile, target pathway, school and class
- student readiness passport
- four pathway cards
- component evidence scores
- readiness trajectory SVG
- skill profile with provenance
- actionable preparation route
- MYP evidence entry
- secure diagnostic flow
- CSV MAP/MYP/outcome imports with header mapping and preview
- school network management
- versioned model editor
- local validation dashboard
- cohort CSV export
- synthetic stakeholder demonstration at `?demo=1`

## Deployment

The production deployment requires:

1. applying the migration with the existing Supabase deployment workflow;
2. deploying `readiness-api` with `verify_jwt = false` because this platform uses its own institutional bearer-token session contract;
3. preserving `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and `ALLOWED_ORIGINS` as Edge Function secrets/environment variables;
4. running readiness-specific CI gates;
5. health checking `/readiness-api/health` after deployment.

The service-role key must never be exposed in browser code or repository configuration.

## Demonstration mode

Open:

```text
/readiness/index.html?demo=1
```

The demo contains synthetic students, synthetic school assignments and synthetic validation statistics. It is suitable for product demonstrations without exposing student data. The diagnostic demo submission also returns a deliberately synthetic result and is labelled accordingly.

## Future calibration path

Once the institution has adequate approved historical data, V2 can compare interpretable statistical models such as ordinal/logistic regression with stronger non-linear candidates. Any move from an index to a probability should require explicit out-of-sample calibration evidence and governance approval.

The current architecture already stores versioned inputs/snapshots/outcomes needed for that work without requiring the V1 interface to make unsupported predictive claims.
