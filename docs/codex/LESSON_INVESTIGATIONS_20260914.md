# Interactive lesson investigations — 14 September 2026

This release adds original teaching investigations to four existing lessons: AP Precalculus 1.3 and IB Mathematics AI SL 1.2–1.4. Students open **Explore this idea**, predict, manipulate a model, compare graphs and tables, and explain their reasoning. The existing lesson remains the canonical lesson at its current URL.

This is a bounded first release of the broader lesson improvement programme. It does not certify every existing question, complete every AP/IB lesson, import AP Classroom questions, or complete the proposed general 3D engine.

## Teaching and curriculum

| Existing route | Added activities | Purpose |
|---|---:|---|
| AP Precalculus 1.3 | 5 | Linear/quadratic interval rates; moving car and reversal; differences versus rates; rotating vessel comparison; evidence and transfer |
| IB AI SL 1.2 | 6 | Arithmetic terms and finite totals; indexing; model limitations; interpretation |
| IB AI SL 1.3 | 6 | Geometric recurrence and finite sums; sign/zero/unit ratios; alternative models; rebound distance; whole-stage decisions |
| IB AI SL 1.4 | 7 | Percentage factors; compounding; GDC setup; first credited threshold; depreciation; inflation; interpretation |

The supplied sequence deck maps to platform lessons 1.2 and 1.3; the supplied finance deck maps to platform lesson 1.4. Lesson numbers and URLs are preserved. New examples follow the warmup, exploration, notes, error analysis, application and explanation pattern without republishing deck extracts or restricted questions.

AP Precalculus uses the current [College Board CED](https://apcentral.collegeboard.org/media/pdf/ap-precalculus-course-and-exam-description.pdf) and [Fall 2026 clarifications](https://apcentral.collegeboard.org/media/pdf/ap-precalculus-ced-clarification-and-guidance.pdf), checked 14 September 2026. Topic 1.3 records retain objectives 1.3.A/B and version `ap-precalculus-2026-27`. The vessel is a comparison with a nonquadratic relationship: it does not imply that every curved graph is quadratic. A finite sample does not uniquely identify an arbitrary function.

IB uses the [Mathematics: applications and interpretation guide, first assessment 2021](https://ibo.org/globalassets/new-structure/university-admission/pdfs/dp-mathematics-applications-and-interpretation-guide-en.pdf), SL 1.2–1.4. The 2029 curriculum remains separate. Regular-payment finance models are outside this addition. All money scenarios are invented teaching data; internal calculations retain precision and displayed money uses two decimal places.

AP Classroom was used for a read-only topic coverage review. Coverage review is not permission to publish protected items and is not a claim that every resource or progress question has been audited. The new prompts, explanations and model parameters are original public teaching material. No AP Classroom images, questions, signed URLs or scoring keys are included.

## Runtime and deployment

- `lessons/shared/investigations/host.mjs` and its exact route manifest mount an optional native dialog outside legacy deck roots. Workspace code loads on first activation.
- `workspace.mjs` composes original activity data with bounded mathematical models and accessible DOM/SVG views. The car supports time scrubbing, play/pause/reset and reduced motion. All visual models have numerical/text alternatives.
- The vessel uses true three-dimensional geometry with orthographic projection into SVG. Water volume and height come from the same cylinder/frustum model. Camera rotation changes the view, not the mathematics. The bounded mesh has no background rendering loop or external 3D dependency.
- `tools/inject_lesson_investigations.py` runs after the existing access-guard injection in the existing Pages workflow. It adds one fixed module hook to exactly four staged pages.
- All four original lesson source files remain byte-for-byte unchanged, including the immutable IB 1.3 import source and script order. The build verifies 73 source hashes: four lesson inputs and the existing 69-file Calculus protection roster. Pins are from production commit `dcc65f84dafd2dc5cb4518ea03d18b4087ddf4ff`, not an older reconstructed checkout.
- A separate IB 1.8 legacy redirect repair retains both the query string and fragment when resolving the canonical technology lesson.
- The service worker changes only its release version. Existing network/cache policies and the GitHub Pages destination are preserved.

No database migration, Edge Function change, private-bank upload, curriculum assignment change, question publication change or production fixture is required.

## Access, evidence and publication boundaries

The launcher waits for the existing lesson gate, authenticated portal access and canonical owner authority. It checks course/route/identity before opening and before user interactions, and disposes its UI on owner revocation, route changes, page exit or gate loss. Fragment navigation remains owned by the original lesson. Focus returns to the launcher on close; modal keyboard events do not advance the underlying deck.

The additions are public teaching assets. The client gate is not a secure storage mechanism. They contain no private answer key, teacher material, credential, student record or new privileged request. They do not emit learning-attempt or completion evidence, write learner persistence, or grant mastery from viewing, revealing, moving controls or entering predictions. Free explanations are ungraded. Existing assessment/publication systems are unchanged.

Only source modules, tests, build metadata and this technical document belong in the release. Local deck extracts, private audits and next-release candidates are excluded. CI uploads screenshots of original teaching activities and a synthetic browser report; it does not upload staged legacy HTML or account data.

## Validation and limits

The existing full baseline command passed 68 checks: 29 core, 27 lesson and 12 bank checks, with zero failures. The bank release checker retains its existing reported warning; this release does not claim that unrelated warning was removed.

New tests independently check rate/difference identities, sequence formulas and degeneracies, compounding and adjacent threshold decisions, volume inversion and camera geometry, component cleanup and controls, owner/course/route boundaries, modal preservation and redirect query/fragment handling. Injector tests verify exact staged source provenance, all 73 source mutations, malformed or duplicate hooks, late-file failures and idempotence before any stage write.

The native browser runner exercises all 24 activities on desktop and a 390-pixel phone viewport, changes range endpoints, checks overflow and script errors, and verifies URL, legacy slide state, persistence, evidence events, focus restoration and owner revocation. It stages the real access-guard and investigation transforms. Four authority scripts are explicitly stubbed for synthetic portal/owner state; these tests are not hosted authentication, RLS, database or production-account proof. The report binds runtime and build sources by SHA-256.

Run the reproducible command group in `tools/lesson-investigations/README.md`. GitHub CI repeats these checks on the exact candidate revision before release. CI results and the deployed commit must be recorded in the release acceptance receipt; a local pass alone is not a deployment claim.

## Rollback and remaining work

Revert the release commit to remove the optional runtime and its stage hook, revert the redirect change and restore the preceding worker version, then deploy through the existing Pages workflow. There is no database rollback or learner-record conversion. All canonical lesson content and old URLs remain available throughout.

The source pins intentionally fail the build if a protected input drifts. A later authorized edit must review and update its relevant pin alongside preservation tests; it must not silently regenerate all pins. The fixed integration currently covers four routes only. Broader polynomial/rational lessons, further IB lessons, exact-example figure repairs and complete AP Classroom coverage remain subsequent reviewed work. No general Lesson Studio interactive-block capability or whole-platform completion is claimed.
