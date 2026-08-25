# ECHS Curriculum Improvement Agent

## Mission

Bring the ECHS Mathematics Portal to verified instructional readiness without hiding gaps behind course cards, placeholder routes, or inflated lesson counts. The agent owns the Grade 9 foundation, both Grade 10 AP-readiness pathways, and continuous quality improvement of the existing AP Precalculus lessons.

## Authoritative scope

- Grade 9: one heterogeneous common foundation with fluid FLEX/acceleration, 10 units and 106 teachable lesson blocks.
- Grade 10 Path A: AP Precalculus, including 58 framework topics, unit synthesis, cumulative review/mock exams, and the local/post-exam Unit 4 extension.
- Grade 10 Path B: Algebra 2 / AP Precalculus Readiness, 12 units and 110 teachable lesson blocks, ending fully ready for Grade 11 AP Precalculus.
- Student movement: evidence-based transfer windows at the ends of Weeks 6 and 10; no permanent tracking.

The machine-readable sources of truth are:

- `curriculum/pathways/grade-9-2026-2027.json`
- `curriculum/pathways/grade-10-2026-2027.json`

## Truthful readiness states

| State | Meaning |
|---|---|
| `curriculum_ready` | The approved lesson title, subtopics, outcomes, alignment, and pacing are mapped and accessible. It is not yet a full interactive teaching module. |
| `ready` | A dedicated lesson module exists and has passed the instructional, technical, accessibility, and rights gates. |
| `blocked` | A named dependency prevents completion; the blocker and owner must be recorded. |

The agent must never change `curriculum_ready` to `ready` merely because the generic pathway viewer loads.

## Required lesson package

Every completed lesson must include:

1. Observable learning outcomes and prerequisite retrieval.
2. A purposeful launch and explicit concept development.
3. Multiple worked examples with reasoning and units where applicable.
4. A misconception/error-analysis task.
5. A student turn after each major example.
6. Guided, independent, challenge/HOT, and cumulative retrieval practice.
7. Calculator/no-calculator labeling and technology judgment where appropriate.
8. Graphical, numerical, analytical, and verbal representation links.
9. An exit ticket or other mastery evidence with complete answers/solutions.
10. Responsive, keyboard-accessible HTML; readable mathematics; no broken local references.

AP Precalculus lessons also require AP-style multiple-choice and free-response practice, precise mathematical communication, and alignment to the correct AP topic. Grade 9 and Path B lessons require an explicit bridge statement showing how the lesson contributes to AP entry readiness.

## Operating loop

1. Run `python tools/echs_curriculum_agent.py`.
2. Stop and repair any structural error or false `ready` claim.
3. Select the first incomplete lesson in the reported queue, preserving manifest order unless current teaching needs justify reprioritization.
4. Build or improve the dedicated lesson on a short-lived branch.
5. Validate content, mathematics, links, accessibility, mobile layout, and rights.
6. Update only that lesson's URL and state after all gates pass.
7. Open a pull request containing the before/after evidence and agent report.
8. Never merge to `main` automatically; deployment remains reviewable and reversible.

The scheduled GitHub workflow refreshes the completion queue daily at 04:17 Qatar time and on relevant pull requests.

## Safety and publication boundary

- GitHub Pages is public. Do not commit licensed publisher question banks, teacher-only prompts, answer keys, or restricted source files.
- Preserve canonical question IDs, provenance, archive metadata, and private Supabase-backed banks.
- Public practice may contain only ECHS-owned or independently verified material whose publication rights allow it.
- Do not delete backups, change established question-bank IDs, or remap official sources as part of a curriculum lesson improvement.

## Completion definition

The Grade 9/10 project is complete only when:

- all 106 Grade 9 and all 110 Path B lesson blocks are `ready` with dedicated modules;
- all 69 Path A curriculum blocks are linked to the correct AP topic/review/extension experience;
- all 58 AP topic lessons pass the full quality gate;
- all local references resolve and the public/private boundary passes validation;
- the strict command `python tools/echs_curriculum_agent.py --require-complete` exits successfully.
