# AP Calculus Unit 8: interactive volume lessons

## Scope and release status

This release fills only the three existing Unit 8 volume lesson slots. All other
course records, lesson routes, question banks, account systems, teacher controls,
and mastery systems remain unchanged. Local mathematical, lesson-data,
interaction-harness, renderer-image, and selected integration checks have passed.
Actual browser and deployment verification remain pending; record their final
results below before declaring the release complete.

| Existing catalog lesson | Stable lesson number | New route under `lessons/ap-calculus/unit-8/` |
| --- | --- | --- |
| 8.5 Volumes by Cross Sections | `94-96` | `8-5-volumes-cross-sections.html` |
| 8.6 Volumes by Disc and Washer Methods | `97-98` | `8-6-disks-and-washers.html` |
| 8.7 Volume About a Line | `99-100` | `8-7-volume-about-a-line.html` |

These are ECHS lesson labels, not a renumbering of the official College Board
topic sequence. Curriculum metadata in the lesson data identifies the applicable
AP Calculus AB/BC content. Shell-method comparisons are an explicitly identified
extension; they must not be presented as an AP-required method.

## Delivery and learning behavior

The lessons use original public teaching examples and practice. They do not
publish protected AP Classroom prompts or private teacher/student materials.
Lesson content and mathematical presets are data driven through a scoped volume
engine, separate from rendering. This does not add a 3D block to the canonical
Lesson Studio schema or claim that Studio can author this component.

The renderer uses software 3D geometry with an equal-scale orthographic
projection onto Canvas 2D instead of the specification's preferred Three.js
baseline. This keeps the bounded reviewed solids independent of WebGL and avoids
adding a heavy global library or CDN dependency. It is a genuine projection of
three-dimensional model coordinates, not a fixed illustration. The renderer is
lazy loaded, draws on demand, caps device-pixel ratio and mesh resolution, and
has no independent animation loop. The controller supplies rotation, zoom,
construction, reduced-motion behavior, and cleanup. The static diagram, exact
setup, measurements, and table remain alternatives if Canvas rendering fails.
This choice does not claim a general-purpose 3D authoring engine or unrestricted
expression support.

The existing Pages build injects account and lesson-access guards into the
deployed HTML. Existing assigned-course checks, server lesson-access decisions,
teacher visibility, automatic progression, and AI-loader integration are
preserved. An admin portal visit synchronizes ready lesson routes into the
existing catalog; this does not override class publication settings.

The three catalog records use `practice: "embedded"` and
`practiceHash: "practice"`. Each page must expose `data-practice="embedded"`,
`data-practice-start="practice"`, and an actual `#practice` checkpoint. The
existing Finish lesson action records ordinary lesson completion and opens that
checkpoint. The stable schedule-range lesson numbers are preserved, so the new
lessons do not route those ranges to an unverified external question-bank topic.
Checkpoint answers and exploration do not award mastery or produce
server-trusted assessment evidence.

The mathematical relationship must remain visible across the 2D region,
representative slice, area/radius measurements, integral setup, and 3D solid.
Neutral and Qatar contexts must preserve the same mathematical model; any Qatar
design is an illustrative model rather than a claim about a real structure's
measured dimensions.

## Acceptance criteria and evidence

Required acceptance covers independently checked cross-section areas, disk and
washer radii, shifted horizontal/vertical axes, shell comparisons, exact and
numerical volume consistency, and endpoint/domain behavior. Controls must
synchronize the representations, provide reset and keyboard access, respect
reduced motion, and retain a readable static/2D explanation without 3D. Rendering
must avoid continuous hidden work and release its resources when no longer used.

Focused CI runs on Node 22:

```sh
node tools/test_volume_model.mjs
node tools/test_volume_lessons.mjs
```

The existing Pages release path additionally validates local links, public
question boundaries, authenticated learning contracts, and the exact injected
artifact. Model tests alone do not establish browser interaction or deployment.
The private jsdom interaction harness and renderer PNG inspection are additional
local evidence; they are not hosted-browser tests or checks run by the dedicated
two-script CI workflow. On the deployed platform, the established JavaScript
authentication gate still applies to access; renderer fallback does not bypass it.

| Verification | Result |
| --- | --- |
| Mathematical model tests | PASS: 12 scenarios, 6 cross-section shapes, 273 numerical checks |
| Lesson data and integration tests | PASS: 3 lessons, 42 stages, 6 independently verified MCQs, 148 KaTeX formulas |
| Private jsdom interaction harness | PASS: 146 interaction checks across 42 stages, including back/forward-cache restoration and rendering fallback; no browser visual claim |
| Actual renderer PNG inspection | PASS: 6 representative cases inspected; these are renderer outputs, not full-page browser screenshots |
| Portal workspace and lesson visibility progression tests | PASS |
| Actual desktop/narrow-screen layout, keyboard, reduced-motion, and fallback behavior | Pending browser verification |
| Injected lesson guards and embedded completion route | Pending artifact verification |
| Remaining existing release contracts | Pending release checks |
| Commit, deployed SHA, and live lesson routes | Pending deployment |

The dedicated volume workflow and Pages workflow run separately. A green volume
workflow is not a declared dependency of the Pages deploy job; require both
workflows to pass for the release revision before accepting the deployment.

## Catalog source review for the publication gate

The first PR artifact build correctly rejected a stale `data/courses.js` source
pin. The existing investigations README requires a source review before refreshing
a pin. Reversing only this release's three Unit 8 URL/status/practice edits
restored every catalog byte at parent `cc8fff3150380c16091e6edce1913a12f3a1d22d`:
220763 bytes, SHA-256
`2e47966085306e025c9dd8661882986adc3c695b56994887b2044a8408cf4aad`.
The reviewed current catalog is 221160 bytes, SHA-256
`89a9384f27817af2f6a8ec1dbbbe42aed637194374c40e7a0470ea47ee626f73`.

Only that row in `tools/lesson-investigations/source-preservation.json` is
refreshed. The other 83 pins, the 69-file protected roster, historical
`AP_CALCULUS_U2_U5_SOURCE_BASELINE.json` receipt, and all verifier logic remain
unchanged. The volume integration test now checks the current catalog against
its reviewed publication pin. This is a reviewed input update, not a relaxed gate.

## Rollback

Revert only this release's three catalog-record changes and the added Unit 8
assets/workflow. Restore each record's previous empty URL and `status: "flow"`,
and remove its new embedded-practice properties. Restore the catalog's reviewed
publication pin to match the rollback content. Preserve lesson numbers,
titles, access keys, all unrelated records, and account/progress data. No
database or mastery migration is introduced. Existing server catalog and teacher
publication decisions remain authoritative; withdraw these lessons through the
normal teacher controls if rollback follows publication.

## 28 September 2026 follow-up: geometry and classroom projection

This scoped follow-up keeps the three catalog routes, access keys, question-bank
boundaries, and mastery contracts. It adds a face-on section view, a manual
construction slider for nonrotational solids, a slide-view layout, and explicit
flat-region / complete-solid / isolate-slice controls. Construction switches off
cutaway so a full turn actually finishes the full solid. The compact tutor icon
retains its full accessible name and tooltip and clears the lesson footer.

The new original sphere investigation connects idealized pearl geometry to
Qatar's documented pearling heritage. It explicitly distinguishes the ideal
sphere from real pearls and marks the 3 mm radius as illustrative. The existing
water-storage application now opens its matching rectangular-section model.
No private AP Classroom questions are added to public hosting.

Independent geometry tests calculate polygon profile areas, oriented triangular
mesh volumes, distances to shifted axes, the sphere equation, and partial-sweep
volumes. The analytic integrals remain exact. Rasterized curved surfaces are
finite polygon approximations: the tested full/partial models currently differ
from analytic volume by at most 0.586%. These checks do not claim that every
pixel or any future AI response is mathematically exact. All geometric axes
share an equal scale before the orthographic camera projection.

Local results: 13 scenarios and 6 cross-section shapes; 276 numerical checks;
409,723 independent geometry checks; 43 stages and 152 KaTeX formulas; 163
isolated DOM interaction checks. The existing tutor validator passes.
The CI workflow additionally checks the actual source pages in Chromium at
1440px and 390px, including keyboard navigation, reduced motion, and tutor/Next
clearance. Browser evidence and deployment status must be recorded after CI.

Performance budget: no added runtime dependencies or external geometry assets;
renderer loads only for the scoped volume workspace; bounded meshes and
on-demand frames remain, with animation stopped on visibility/lifecycle exit.
No database migration or synthetic mastery records are introduced.
Rollback: revert this follow-up commit; the previous three live lesson routes
remain valid and the existing account, publication, and learner data stay intact.
