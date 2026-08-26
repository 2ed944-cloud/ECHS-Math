# ECHS Grade 9/10 Curriculum Production Agent

## Mission

Bring the Grade 9 and Grade 10 mathematics pathways to verified instructional readiness without hiding gaps behind course cards, generic routes, older lesson files, or inflated counts. The two combined 2026-2027 pathway documents are authoritative.

## Authoritative scope

- Grade 9: 10 units and 49 teachable topic blocks (3, 6, 6, 6, 7, 5, 4, 4, 4, 4 by unit).
- Grade 10 Path A: 48 blocks—AP Units 1-3 (14, 15, 15) plus E.1-E.4—and one required cumulative AP review/mock-exam package.
- Grade 10 Path B: 6 units and 39 teachable blocks (3, 8, 9, 10, 5, 4), plus the R1.G and R2.G transfer-gateway assessment packages.
- AP Precalculus Unit 4 remains available as supplemental enrichment; it is not part of the required Path A lesson count.
- Grade 9 placement uses cumulative strand evidence, independence, approximately 85%+ on the common readiness benchmark, and no critical strand below about 75%. These are guides, not automatic exclusions.
- Grade 10 transfer is preferred at the end of Week 9. End-of-Week-17 transfer is exceptional and requires catch-up evidence plus AP-pace independence.

The machine-readable sources of truth are:

- `curriculum/pathways/grade-9-2026-2027.json`
- `curriculum/pathways/grade-10-2026-2027.json`

Older files and stable URLs are preserved. An older lesson is supplemental or archival unless the authoritative manifest maps it explicitly.

## Truthful readiness states

| State | Meaning |
|---|---|
| `curriculum_ready` | The authoritative title, subtopics, and outcomes are mapped. A complete interactive module does not yet exist. |
| `ready` | A dedicated lesson or package URL exists and has passed the instructional, mathematical, technical, accessibility, and rights gates. |
| `blocked` | A named dependency prevents completion; the blocker must be recorded. |

The generic `lessons/pathways/lesson.html` viewer never counts as a completed lesson.

## Required lesson package

Every completed normal content lesson should ordinarily contain 50-70 meaningful interactive screens and substantial differentiated practice comparable to the established AP courses. Diagnostic, benchmark, assessment, review, FLEX, and synthesis blocks may use a purpose-appropriate structure, but must still be complete and original.

Every completed module includes:

1. Observable authoritative outcomes, prerequisite retrieval, a purposeful launch, and an explicit AP-readiness bridge.
2. Precise concept development and independently verified mathematics.
3. Multiple fully worked examples, each followed by a genuine student turn.
4. Graphical, numerical, analytical, and verbal representations where relevant.
5. Misconception/error analysis; guided, independent, cumulative-retrieval, challenge, and HOT practice.
6. Calculator/no-calculator labels and purposeful technology judgment.
7. Click-to-reveal answers and complete solutions.
8. Accessible slide map, progress/navigation, keyboard/touch support, mobile layout, readable KaTeX, and accurate SVG/canvas figures.
9. Exit/mastery evidence with complete solutions.
10. Original ECHS-authored or publication-safe public content only.

## Daily operating loop

1. Read current `main`, issue `ECHS curriculum completion queue`, and open agent-authored Grade 9/10 production PRs.
2. Run `python tools/echs_curriculum_agent.py`; repair any structural error or false `ready` claim first.
3. Select up to four coherent required modules in authoritative order while balancing Grade 9, Path B, and early completion of E.1-E.4 plus the AP review/mock package.
4. Build each module on a clean short-lived branch. Never mass-copy identical content with renamed labels.
5. Verify formulas, graphs, restrictions, answers, distractors, solutions, accessibility, links, responsive layout, duplicate content, and publication rights.
6. Change a manifest item to `ready` only after its dedicated URL and every applicable gate pass.
7. Open a focused PR with exact completion evidence.
8. Squash-merge only an agent-authored Grade 9/10 PR that remains at the validated SHA, is current and mergeable, has no unresolved review request, and has all relevant checks passing.
9. Verify the resulting `main` SHA, Pages deployment, live URLs, and post-merge counts. Repair an attributable regression immediately in a narrow follow-up PR.

## Safety boundary

- Preserve canonical question IDs, provenance, archives, progress behavior, authentication, and protected Supabase-backed banks.
- Never publish licensed publisher or restricted official question-bank material through public GitHub Pages.
- Do not merge unrelated work, third-party PRs, speculative refactors, destructive removals, or changes with relevant failed or pending checks under the Grade 9/10 standing authorization.

## Completion definition

The project is complete only when:

- all 49 Grade 9 blocks are `ready` with dedicated modules;
- all 48 Path A blocks and its cumulative AP review/mock package are `ready`;
- all 39 Path B blocks and both transfer-gateway packages are `ready`;
- AP Units 1-3 remain mapped to their 44 dedicated core lessons and Unit 4 remains truthfully supplemental;
- every local reference, public/private boundary, and relevant regression check passes;
- `python tools/echs_curriculum_agent.py --require-complete` exits successfully.
