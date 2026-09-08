# ECHS-003 metadata acceptance review

Reviewed against the supplied `CURRICULUM_VERSIONING.md`, `AP_CALCULUS_SPEC.md`, `AP_PRECALCULUS_SPEC.md`, and `IB_AI_SL_SPEC.md`, using the official-source findings retained in [CURRICULUM_SOURCES_20260908.md](CURRICULUM_SOURCES_20260908.md).

This acceptance concerns the additive metadata foundation. It does not certify every existing lesson, objective mapping, interactive component or assessment item against those complete course specifications.

| Requested requirement | Implemented metadata or control | Boundary |
|---|---|---|
| Separate curriculum family/version/course identity | Four immutable curriculum snapshots; five distinct course snapshots; explicit parent UUIDs | Existing legacy aliases remain unchanged and are not silently mapped to these records |
| Effective dates, assessment periods, status and source verification | Explicit fields, original edition labels, source-reference IDs, retrieval/verification dates and verifier provenance | Unverified final assessment cutoffs/exact daily boundaries stay null |
| AP Calculus AB and BC have distinct scope | Separate AB/BC keys and UUIDs; AB Units 1–8 with objective-scope requirement; BC Units 1–10 with shared-unit extension flag | The registry does not yet import every objective or identify each existing lesson as AB/BC compliant; reviewed objective-level mappings remain a later slice |
| May 2027 AP Calculus assessment is configuration | 42 MCQ/100 minutes/50%, split 29/62/no calculator and 13/38/graphing required; 6 FRQ/90 minutes/50%, split 2/30/graphing required and 4/60/no calculator | Metadata only; current exam/practice components are not reconfigured by ECHS-003 |
| AP hybrid delivery and response mode | Hybrid digital profile, digital MCQ and handwritten FRQ response modes, effective exam month | No new handwriting-upload product flow is implied |
| AP Precalculus Units 1–3 examined; Unit 4 not examined | Explicit `exam_assessed_units` and `non_exam_units` | Objective/skill-level item mappings are not copied automatically |
| Reverified Precalculus assessment counts, subtype/timing and calculator partitions | 42 MCQ/105 minutes/62.5%, 29/65/no calculator and 13/40/graphing required; 4 FRQ/70 minutes/37.5%, two 35-minute parts and four purpose categories | Exact source review retained; existing lesson/item wording is not thereby certified |
| Current IB AI SL remains first assessment 2021 | Separate active curriculum/course records; five content areas | Existing 2026–28 cohorts are neither reassigned nor rewritten |
| IB Paper 1/Paper 2 and exploration profile | Each paper 90 minutes, 80 marks, 40%, technology required; short/extended response distinction; exploration 20 marks/20% without fabricated exam timer | GDC procedures, command terms, marking criteria and practice simulations require later content/schema work |
| IB first assessment 2029 remains future | Immutable future placeholder, no imported objective map, no current-cohort use; active pin rejected; explicit planned pin permitted | Full new guide/objectives were not verified; no automatic calendar activation or migration |
| Explicit cohort/class adoption | Named tenant FKs, active-admin stored actor, reason, immutable pin history, one active pin/class, transaction rollback | No current runtime reads/writes pins; a future Edge API must authenticate the actor and derive tenant/account IDs from the existing school session |
| Question/lesson mapping requires reviewed version-specific evidence | No legacy mappings or evidence are automatically copied | Objective/skill/representation/calculator validity/reviewer mappings remain unimplemented in this metadata-only slice |
| AP/IB pedagogical and interactive lesson standards | Existing product is preserved | Practices, representation-specific mastery, misconception review, question authenticity, 3D/GDC tools, teacher authoring, response release and lesson QA belong to their later implementation slices |
| Teacher/student version UI and annual review process | Explicit lookup returns defensive copies; source record and migration/rollback checklist documented | No new UI or background source scraper; annual verification should produce a reviewed new snapshot |

Database execution is a release gate: the complete PostgreSQL 15 migration/RLS/FK/transaction suite must pass before this migration reaches main. A static-only seed check or successful module test is not database execution.
