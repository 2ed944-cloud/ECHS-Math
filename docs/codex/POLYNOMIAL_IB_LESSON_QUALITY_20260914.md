# Polynomial investigations and IB lesson quality

This release extends the original teaching workspaces from AP Precalculus 1.3 and IB AI SL 1.2–1.4 to AP Precalculus 1.4–1.6. It adds twelve original activities: one warmup, one linked exploration, one notes/error-analysis activity and one transfer task per AP topic. The resulting seven workspaces contain 36 activities. Existing lesson URLs, access checks and publication policy remain canonical.

## Curriculum and teaching

The AP records reference the College Board AP Precalculus Course and Exam Description and Fall 2026 clarification document, checked 14 September 2026. They use the active `ap-precalculus-2026-27` version. Topic 1.4 distinguishes secant averages, turns, stationary inflection, concavity, and extrema on a stated restricted domain. Topic 1.5 keeps multiplicity, real intercepts and nonreal conjugate zeros distinct. Topic 1.6 compares algebraic tails with finite graph windows and separates relative agreement from absolute vertical distance. Worked examples are original public teaching material, not AP Classroom questions or scoring keys.

The IB changes use the first-assessment-2021 AI SL curriculum. In lesson 1.5, the existing fourteen quiz questions remain available with their original IDs and answers: twelve in SL core and two in an optional extension. Rational exponent identities and logarithm-law algebra receive explicit scope labels where they occur. Numerical GDC work stays visible in the core route. Both IB papers permit calculator use; the optional fluency activity makes no contrary paper claim. The future first-assessment-2029 curriculum is unaffected.

Authoritative references:

- [AP Precalculus CED](https://apcentral.collegeboard.org/media/pdf/ap-precalculus-course-and-exam-description.pdf)
- [AP Precalculus clarification effective Fall 2026](https://apcentral.collegeboard.org/media/pdf/ap-precalculus-ced-clarification-and-guidance-effective-fall-2026.pdf)
- [IB Mathematics: applications and interpretation guide](https://ibo.org/globalassets/new-structure/university-admission/pdfs/dp-mathematics-applications-and-interpretation-guide-en.pdf)

## Architecture and changes

`lessons/shared/investigations/` gains a pure bounded polynomial model, original content records and a DOM/SVG view. The existing stateless workspace mounts and disposes it through the existing guarded host. Graphs, feature tables and controls derive from the same declared formula. Complex zeros have a separate equal-scale complex plane; finite samples never establish global mathematical claims. No arbitrary expression evaluator or root-solving dependency is introduced.

The Pages injector adds the existing optional launcher to three further allowlisted staged HTML routes after the canonical access guard. The source-preservation manifest now has seven lesson inputs and the unchanged 69-file AP Calculus Units 2–5 roster. The original four lesson pins are unchanged. The AP 1.6 source HTML is unchanged. AP 1.4 changes only its zero-polynomial readout and secant plotting bounds; AP 1.5 changes only the zero function's symmetry readout. A hash-pinned inverse comparison restores every other byte, including existing prose, questions, IDs and answer payloads.

The scoped IB `LESSON_DATA` engine successor accepts an optional complete two-scope quiz partition. Only the canonical 1.5 and 1.6 HTML pages opt into `engine-lesson-quality-v1.js` and the two matching `unit-1-gdc-*-lesson-quality-v1.js` variants, through three script-source substitutions per page. The original shared engine and GDC scripts remain byte-exact historical import inputs for lesson 1.3 and its 18-file source closure. The versioned variants retain the reviewed behavior of unconfigured lessons. Responses retain original IDs; restarting a scope clears only that scope, and core totals exclude optional results. The lesson's pre-existing local readiness display continues to be a local indicator, not trusted mastery certification. A narrow element-only math bridge reuses the existing KaTeX renderer with `trust:false`; the two GDC overlays call it only for their own inserted content. Lesson 1.6 clips straight lines to the actual graph bounds rather than clamping endpoint heights into an incorrect chord.

The vessel's initial elevation is corrected to 20 degrees, a valid point on its slider's five-degree scale. Native browser checks compare every initial/reset slider value with its displayed readout. The service worker release version changes to refresh reviewed lesson assets.

## Validation

The release workflow runs the existing investigation model/lifecycle tests, fourteen build-injector groups, fifteen polynomial model groups, fourteen polynomial component groups, sixteen original-content groups and five legacy renderer groups. IB adds twenty-three controlled component groups and ten native browser checks for scope isolation, retained question IDs, calculator formula rendering, mobile controls and a steep-line example. The component checks also prove the original shared pins and reverse only the three script-source substitutions to verify both original HTML hashes. The exact original eight AP/IB comparison files come from a pinned historical Git revision in the runner temporary directory; they are never bundled as test fixtures in public Pages assets.

The historical IB reference importer still verifies all 18 source pins, composes its exact sixteen-script closure and reproduces 78 teaching slots, with 20 native blocks and 58 retained references. The separate legacy IB 1.6 browser QA must exercise its complete composition of 81 screens, 106 practice questions, fourteen quiz questions and eight written tasks; the earlier 73/96/14/5 counts belong to its definitive base layer and remain independently tested.

The legacy IB 1.5 visual check separately verifies its 73/96/14/5 base layer and the complete 78/103/14/6 composition with appended calculator activities. The shared platform validators require the scoped engine for exactly lessons 1.5 and 1.6 and retain the historical engine contract for the other lessons. Browser failures must produce a report, and every owned browser context receives an independent cleanup attempt. Calculator QA distinguishes the local coaching interface from the existing external TI-84 provider: the provider response is intercepted in local tests, so those checks do not certify the external service.

The investigation native harness exercises all seven actual staged routes, 36 activities, desktop/mobile graphs, native slider endpoints and initial/reset readout agreement, modal focus/return/Escape, unchanged deep links and legacy state, absence of learner writes, and owner revocation. It hashes runtime and staged source before and after and attempts browser/server/fixture cleanup independently. Its portal and owner authority are explicitly synthetic; it is not production authentication evidence. The IB native harness uses the actual legacy HTML and installed math library, with synthetic local workspaces and external requests blocked. Test reports and screenshots are CI artifacts.

Run the commands in `tools/lesson-investigations/README.md` and `tools/ib-lesson-quality/README.md`, plus `python tools/validate_baseline.py --json-report .baseline-results/baseline.json`. Passing checks and exact head/asset evidence are recorded in the release acceptance report; this document describes their scope rather than asserting unobserved deployment success.

## Security, migration and rollback

No database migration, backend deployment, account change, question publication-gate change or new mastery write is required. Optional investigations have no storage/network/assessment authority. Original AP Classroom or private teacher materials are not added to public assets. Existing IB public lesson content is retained. No AP Calculus Unit 2–5 source changes are included.

Rollback is a Git revert of the release commit followed by the existing Pages deployment. Reverting restores the previous host roster, source pins, runtime and service-worker version. Original source comparison pins remain review evidence. No database rollback is necessary. IB responses continue to use their original question IDs; the previous engine can read those responses, while the optional scope-selection/timer keys are inert when unused.

## Remaining scope

This is a bounded lesson release. It does not claim a complete AP Classroom inventory, full-course certification, a general-purpose 3D authoring engine, or completion of every AP/IB lesson improvement. Later topics need their own curriculum review, content/interaction work and acceptance evidence. Secure AP Classroom coverage remains dependent on the current signed-in session; restricted questions are not bulk republished into GitHub Pages.
