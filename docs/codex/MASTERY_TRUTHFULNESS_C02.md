# C02 truthful practice and mastery reporting

Status: **IN PROGRESS — local acceptance and independent composition review pass; final CI and production acceptance pending.** The candidate is based on verified C09 main `21478287590fcc04ac8000180aef0f1fe91e79b8`. It preserves the accepted membership transaction and read scopes. C08 private snapshots are excluded.

## Problem and behavior

The existing foundation recomputes scores on the server from client-reported correctness, help, mode and timing. Synthetic actual-handler tests reproduced high scores labeled Mastered and legacy verified flags without authenticated grading evidence. A server recomputation does not authenticate the caller's claims.

The versioned `echs.mastery-status.v1` policy now projects current records as provisional practice or insufficient evidence. It reports `verified_mastery: false`, a practice display level, client-reported/unknown provenance and missing-evidence codes. It has no positive certification branch. Actual zero accuracy with recorded attempts remains visible; missing or invalid scores are distinct from zero. Response copies retain previous verification claims only as labeled algorithm diagnostics. Both health endpoints and aggregate responses explicitly report `grading_authoritative: false`. The retained legacy `authoritative: true` envelope continues to mean server recomputation only.

The policy is shared by backend and browser modules, with a generated synchronous copy for existing classic scripts. Student, family, teacher, heatmap, local dashboard, compatibility, portal, lesson drawer, Smart Route and gamification consumers use the same interpretation. Loading, unavailable data, missing helpers and stale responses cannot restore a certified badge. Family narrative describes recorded practice instead of asserting secure knowledge or verified transfer.

## Protected behavior

Raw learning records, server recomputation, score/confidence values, attempt ingestion, numeric adaptive routing, assignments, timetable choices, course/lesson URLs and publication gates remain unchanged. Lesson viewing/completion is separate from practice and cannot certify mastery. Existing historical milestone IDs/dates remain stored and display as historical practice. New score-only mastery milestones are not granted. Existing XP/coin arithmetic retains its historical score bonus as explicitly uncertified `legacy_practice_points`, independent of the certified count. Independent comparisons cover unchanged score, XP, coins, level and route results.

C09 guards were composed from exact original/C09/C02 sources. Four overlapping institutional report edits retain both the diagnostic fields needed by C02 and C09 organization/membership filters. Fourteen named authorization functions and both C09 test assertion sections remain unchanged. The two existing test harnesses now load the actual imported policy when executing the handlers; they do not replace authorization or status outcomes with stubs.

## Responsive and offline behavior

Narrow repairs to two existing stylesheets correct measured phone defects: role-specific desktop grid priority collapsed the hero text column, and the portal header expanded a 390px page to 623px. The intended responsive rules now win, with a readable 328px hero content column and a 390px document width. The existing desktop layout remains. A local dashboard paragraph uses its readable light/dark palette.

Six existing entry documents keep their paths and original query parameters and append the C02 evidence revision to changed scripts/styles. The worker uses a new release suffix and a fixed allowlist of 15 public assets plus six reporting documents and the home alias. These paths fetch current bytes and use only current-release cached fallbacks. Old copies are purged across historical caches. Institutional HTML retains its existing authenticated-shell validation. Invalid online HTML does not fall back to an earlier cached page. Already executing old tabs require reload; no update forcibly interrupts work.

The C01 question/media pins, protected path sets, private-data bypass, current-only archive behavior, five required shell files and bounded optional prefetch remain intact. The exact previous worker is retained only as a test fixture under `tools/`, which is excluded from Pages.

## Validation and release

The local candidate passes 19 affected commands and 18 actual Chromium groups, including both old/new workers, synthetic accounts, desktop/phone views, unavailable evidence, zero/missing distinctions, responsive widths and preserved entry behavior. There are 20 captured screenshots with representative views reviewed. Twelve new worker groups and all 26 existing C01 worker groups pass. Independent review tested 315 forged/missing/zero combinations and eight numeric sequences; it found no open composition defect. These are local scoped results, not a production claim.

`.github/workflows/mastery-truthfulness.yml` runs policy/mirror, actual handler, DOM, routing, sync and worker contracts, Deno entrypoint checks and pinned Chromium acceptance. The existing membership workflow must also pass its 26-migration PostgreSQL chain, 55 database checks and seven actual HTTP/SQL groups against the composed handlers. PR checkout may use a synthetic merge commit; evidence must bind the tested tree and source hashes to the candidate, not assume its commit ID is the PR head. Existing baseline and release checks remain required.

The backend deployment retains the C09 capability check and adds exact status-health checks for both handlers. Final release evidence must include exact changed public bytes or their existing documented Pages transformation, current deployment identity, protected API denials and browser/cache acceptance. Fixtures use synthetic accounts; no live learner or private question fixture is required.

## Migration, rollback and limits

There is **no database migration or raw-record rewrite** in C02. Preserve the new status policy and C09 guards if reverting a presentation change. Roll back affected frontend assets coherently with the worker's revision and cache rules; do not restore score-only certification labels. Old records require no data restoration.

C02 does not authenticate existing practice, implement grading receipts, repair all account-local stores or migrate private question providers. Those remain C03, C04 and C08. No positive mastery certification may be enabled until its separate server evidence contract is implemented and accepted. C09 remains verified at its sealed revision, while the full charter and ECHS-015 dependencies remain open.
