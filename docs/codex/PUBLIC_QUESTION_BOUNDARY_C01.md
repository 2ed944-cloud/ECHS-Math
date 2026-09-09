# ECHS-C01 — official question-bank Pages boundary

Status: implemented locally; CI and exact production acceptance pending. This note covers the **official bank only**. The active legacy textbook datasets require the separate P0 ECHS-C08 migration recorded in the master board. Public Git source/history and previously saved copies remain outside the protection a Pages build can provide.

## Problem and resulting artifact

The original Pages copy included raw official question data, admin corrections and packaging copies even though the student app used a smaller approved release. Existing archive redaction cleared a short field list and retained unreviewed content-bearing extras. Old service-worker caches could also return prior archive bytes after deployment.

The build now runs `tools/project_public_question_bank.py` after staging source and before guard injection/fingerprinting. It constructs and validates an exact official data/media projection:

- **1,104 approved questions** retain their original record and student-chunk bytes. Their canonical gate, provenance and rights records are unchanged.
- **1,217 archive IDs** remain available. The **113 restricted rows** and corresponding index entries use a closed, typed metadata projection; no unknown prompt, answer, solution, OCR, hint or reviewer-note fields are inherited. Restricted flags require actual booleans, not Python-equal integer substitutes.
- **1,277 media files** remain: 1,193 directly referenced SVGs plus 84 transitive raster dependencies. All are copied byte-for-byte. Outside media is excluded. Provenance-only `audit.sourceCropPath` strings remain in unchanged approved records but do not authorize direct media publication.
- A deterministic 115,305-byte manifest pins the media allowlist. SHA-256 is `c4fcdce623c44155185719ab4612045a5f3ef7fd1b979a7019c3e68655b13069`. The worker rejects an invalid or unavailable manifest for media cache fallback.
- `admin/teacher.html` and `admin/import.html` are transformed only in the artifact to use approved student data and an explicit public-review notice. Original URL aliases and form IDs remain. Canonical source authoring tools remain unchanged. Imported local batches still cannot become student-ready.
- Official raw/admin data and `.staging`, `.deploy`, `packages`, backups and generated `artifacts` are excluded. Public trust metadata and recorded rights documents remain exact.

The source shape, file sets, question counts and media closure are deliberately pinned. A future intentional question release must review and update this boundary alongside the canonical publication pipeline; silently adding a file or raising a count fails the build.

## Cache behavior

Official data uses exact file allowlists rather than directory-prefix permission. Media uses the pinned transitive closure. Denied paths are fetched without caching and never fall back to old cached bodies.

Activation purges denied paths and prior same-URL archive/teacher/import content from all caches, including caches with unfamiliar names. Official cache fallback reads only the current release's runtime cache. This prevents an old denylist-redacted archive from surviving simply because its URL is still valid. Approved public content retains tested offline caching; private/session responses remain uncacheable.

## Preserved behavior and security limits

No canonical lesson, question source, original teacher tool, answer/provenance gate, account, assignment, mastery record or database migration changes. Existing guard injection, fingerprinting, Pages deployment and current URLs remain in place. Teacher Pages URLs provide approved public review, not a client-side security boundary for private authoring.

This is not a new license or an audit of every pixel in approved source-page images. The current recorded publication gate is preserved. Public repository/history, historical downloads and the 5,882-question legacy static provider are explicitly unresolved; C05/C08 own them. No production private learner/teacher fixture is used.

## Validation and evidence

Local acceptance completed before CI:

- 9 projection unit groups, including malformed metadata, strict booleans, source drift, SVG/path safety and source-preservation failures.
- 20 worker groups covering manifest bounds/pin, failure recovery, exact paths, stale arbitrary caches, approved offline media and private/session exclusions.
- 12 independent preservation groups against the actual corpus: all approved IDs/bytes, archive projection, transitive media, shells, gate/trust/rights and source immutability.
- Existing platform resilience checks.
- 22 execution-board tests and a generated-artifact/product-link isolation test.
- 2,129 official-bank source files match actual main Git blobs, including all question data, media, gate, rights and UI inputs. Two pre-existing locally changed validation reports are explicitly excluded from this source identity claim, the release manifest and Pages. The initial whole-tree mismatch is retained separately; no report or question source was overwritten to produce a pass.

Independent review reproduced both an unknown-student-path stale cache leak and a same-URL old archive/shell leak in intermediate candidates. Both were fixed and independently retested. Those failing diagnostics are retained separately from final proof.

`tools/build_public_question_fixture.py` builds a separate projected UI fixture and retains the actual auth modules and guard injection. `tools/test_public_question_browser.mjs` exercises approved practice, restricted archive metadata, teacher/import aliases and normalization, signed-out redirect, and the actual Chromium service worker. Its account/API transport is synthetic and external math assets are fulfilled from the pinned local package. Browser/CI results and reviewed screenshots must be attached to the final release receipt; intermediate navigation diagnostics are not a pass.

CI adds master-board integrity and a dedicated projected-artifact Chromium workflow, while the existing Pages job runs projection, preservation, worker and final artifact validation. The canonical source-bank baseline tests remain intact. Generated browser fixtures are excluded from local HTML link scanning and Pages; the new test proves identical broken links in real lessons still fail.

## Deployment, rollback and next dependency

No database migration. Production acceptance must verify the exact merged `deployment.json` revision, worker/manifest hashes, projected archive types, approved record/media hashes, safe teacher/import shells, original lesson guards and denied raw paths. Do not label this release VERIFIED merely because source tests pass.

The canonical source remains the rollback/reference path. If an intentional source change violates projection pins, the build fails and the last accepted artifact stays deployed. Prefer a forward repair or a narrow UI rollback that retains projection and cache exclusions. A wholesale rollback to the old copy/worker would restore known exposure and is not a safe rollback plan. Worker fixes require a fresh cache version while preserving denied-path rules.

Next: C02 truthful evidence reporting, C08 verified private legacy delivery and C03/C04 grading/account ownership. AP 1.1 and new interactive components wait for those foundations. C01 does not certify the whole charter or complete platform confidentiality.
