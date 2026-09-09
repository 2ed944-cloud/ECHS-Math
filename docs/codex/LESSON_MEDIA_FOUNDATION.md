# ECHS-010: private lesson media

## Scope and release status

Implementation ready for review; actual PostgreSQL 15, complete PR CI and deployment verification are pending. This document does not mark ECHS-010 complete or deployed. The preceding accepted main revision is `d873f39b8c59bf495db6008dbed02a94c19f618a`.

This stage adds image, YouTube video, semantic table and PDF resource blocks to the existing authenticated Lesson Studio and document renderer. It preserves the `echs.lesson.v1` envelope, all original version 1/version 2 blocks, the separate ECHS-009 authoring capability, existing class/course assignments and institutional release gates. Existing student lesson routes are not automatically adopted into the new renderer. No question grading, mastery, lesson completion or curriculum metadata policy changes.

## Closed content contract

The canonical source is `schemas/echs.lesson.v1.schema.json`; generated browser and Edge validators retain checked provenance. All four new blocks use version 1 and reject unrecognized fields.

| Block | Required content and bounds |
| --- | --- |
| `image@1` | `asset_id` is a canonical UUID; `alt`, `caption`, `description` are strings of at most 4,000 characters; `decorative` is boolean. Decorative images require exactly empty alt text. Other images require meaningful alt text. Caption/description may be empty, but a nonempty whitespace-only value is invalid. |
| `video@1` | `provider` is exactly `youtube`; `video_id` is an 11-character ASCII YouTube identifier, never a URL; meaningful `title` is at most 240 characters; integer `start_seconds` is 0–86,400; meaningful `transcript` is at most 4,000 characters. |
| `table@1` | Meaningful `caption` is at most 240 characters; 1–12 columns have unique stable IDs and meaningful labels of at most 240 characters; 1–100 rows have unique stable IDs and exactly one cell per column; each cell contains 1–32 existing version 2 inline nodes and meaningful content. `row_header` is boolean. |
| `resource@1` | `asset_id` is a canonical UUID; meaningful `title` is at most 240 characters; meaningful `description` is at most 4,000 characters. The referenced ready asset must be a PDF. |

Existing inline text/emphasis, conservative HTTPS links and mathematics remain the only table cell content. Actual pinned KaTeX validates mathematics at the Edge and canonical client boundary. SQL checks structure, bounds and forbidden commands; it is not a TeX parser. No asset URLs, object paths, file bytes or arbitrary embedded HTML are serialized into a lesson document. Existing document, depth and node budgets are unchanged, including the compact 1 MiB persisted-document limit enforced at the Edge.

Images use meaningful alternatives and optional descriptions. Tables render actual caption/header/cell elements with explicit row/column relationships. Videos have a transcript and require an explicit action before creating a fixed `youtube-nocookie.com` iframe; the transcript remains available without loading YouTube. External playback is removed when its slide is deactivated or the renderer is disposed. PDF resources use an explicit authenticated download action. Blob URLs are temporary in-memory resources, revoked on replacement/disposal; they are not stored in documents or browser draft storage.

## Asset ownership and byte transport

Only exact PNG, JPEG, WebP and PDF MIME types are supported. Images are at most 4 MiB, at most 4,096 pixels in either dimension and at most 16,777,216 pixels in total. PDFs are at most 8 MiB and have null width/height metadata. Structural file inspection checks signatures, lengths, container structure and dimensions, then computes SHA-256. It does not fully decode every supported format, sanitize PDF content or perform malware scanning.

The dedicated `lesson-assets` bucket is private. A server-derived object key consists solely of the canonical organization, lesson and asset UUIDs. Browser input cannot select a Storage URL, bucket or object path. The Edge calls the supported Storage API with immutable uploads (`x-upsert: false`), verifies retrieved MIME/length/hash and projects only this ready metadata:

```json
{
  "asset_id": "10000000-0000-4000-8000-000000000001",
  "mime_type": "image/png",
  "byte_length": 80,
  "width": 2,
  "height": 3,
  "sha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "state": "ready"
}
```

The sample is an illustrative contract, not a production object. Original basenames are bounded private metadata and do not appear in public ready receipts. No signed URLs are issued.

Authenticated routes beneath the fixed `lesson-api` endpoint are:

| Route | Contract |
| --- | --- |
| `POST /lessons/:lesson/assets` | Raw bytes with exact MIME, caller-generated UUID in `x-echs-asset-id` and a canonically percent-encoded basename in `x-echs-asset-name`. Returns 201 for a newly finalized asset or 200 for an idempotent/reconciled result. |
| `GET /lessons/:lesson/assets` | Authorized staff ready-asset list, at most 128 receipts. |
| `GET /lessons/:lesson/assets/:asset` | Authorized ready metadata. Student delivery requires explicit `class_id` query and an exact current published reference. |
| `GET /lessons/:lesson/assets/:asset/bytes` | Same scope and publication checks, private bytes, followed by another current authorization check before returning the body. |
| `POST /lessons/:lesson/assets/:asset/cleanup` | Exact JSON `{}`; original uploader or authorized class administrator may close an expired pending reservation, then remove its object through the Storage API. Ready assets cannot be removed. |

Upload/metadata JSON uses `{ok:true, contract:'echs.lesson.store.v1', lesson_id, asset}`; list responses use `assets`. Byte responses carry exact MIME, `Content-Length`, `X-Content-Type-Options: nosniff`, private/no-store caching and a restrictive response CSP. PDFs use attachment disposition. Clients obtain metadata first and verify retrieved bytes against it; they do not trust URL possession as authorization.

Upload IDs belong to one logical attempt. A retry preserves the same ID, lesson, uploader, original name, MIME, dimensions, length and SHA-256. A conflicting owner or payload fails rather than adopting an existing object. Lost upload acknowledgements are reconciled by reading and checking that exact object; lost finalize acknowledgements are reconciled against database state. An uncertain result does not trigger blind deletion or a replacement upload.

## Migration, authorization and retention

`202609080004_lesson_media.sql` is migration 24. It adds media validation dispatch, `lesson_assets`, append-only `lesson_version_assets`, reference-checking triggers, two service-only RPCs and dedicated restrictive Storage policies. The prior version 1/version 2 SQL validator branches are copied without semantic changes. Existing public records, class pins, learner evidence and prior immutable snapshots are not rewritten.

All direct application-role access to the two new tables is revoked, including direct `service_role` DML. `lesson_asset_store` is a service-only `SECURITY DEFINER` transaction accepting the hashed school session token, action and closed payload. It delegates current authorization and locking to the original `lesson_store`; caller actor/organization claims never establish access. Student reads invoke original delivery authorization, including current class membership, active exact course pin, ready catalog/release/sequential gates and current publication reference. Staff reads retain the existing authorized history/recovery behavior; new reservation and finalization additionally require the current exact active course pin.

Original account/session/class/lesson locks remain held throughout asset work. A final clock-based expiry check rejects and rolls back an operation whose session expires while it waits on an additional upload-ID or asset-row lock. Current role, tenant and membership checks remain enforced by the original transaction. A separate-connection database regression exercises this lock-wait expiry boundary.

The metadata state transition is `pending -> ready` or `pending -> cleanup`. Both terminal states retain immutable identity and metadata. Save, review and publication verify every asset reference is ready, of the correct type and belongs to the exact organization/class/lesson. Every immutable saved version records its attachments. Removing a block or restoring an old version does not detach historical assets. A restored draft leaves the old published snapshot live until an explicit publication action changes it.

Each lesson may reserve at most 128 pending/ready assets and 128 MiB total reserved bytes. Cleanup records do not consume these quotas. Pending reservations at least 24 hours old can be atomically moved to terminal cleanup before object deletion; a concurrent finalize cannot change them back to ready. Failed deletion may leave a private terminal object and can be retried through the same authorized cleanup route. A newly aborted upload may remain pending until retry or expiry. Ready assets, including ready but currently unattached uploads, are retained. This stage does not add automatic expiry jobs, a general asset-library manager or ready-asset garbage collection; sustained retained uploads can exhaust the lesson quota and require a separately reviewed retention extension.

## Supported Storage boundary and limitations

The migration uses the supported bucket configuration and RLS model. It adds restrictive `anon`/`authenticated` exclusions for this bucket without granting access or changing other bucket policies. It does not install triggers on managed `storage.objects`, intercept Storage metadata upserts, or delete production object metadata directly. Production object writes/deletes go through the Storage API. The database reads completed object metadata to gate finalization.

The media capability and every asset RPC fail closed when the bucket is public, has incompatible size/MIME configuration, or its required RLS protection is absent. Other broad permissive application policies cannot override the dedicated restrictive exclusions. Service credentials, database owners and Storage administrators remain trusted: these checks do not establish immutability against an administrator modifying database state or Storage bytes. Hash verification detects changed retrieved bytes but is not content sanitization. A supported Storage configuration change must be tested before rollout.

Supabase documents the Storage schema as metadata accessed through its API, with RLS used for access control: [Storage schema design](https://supabase.com/docs/guides/storage/schema/design). The PostgreSQL test bootstrap represents managed infrastructure explicitly; it is not a migration for a production Storage installation.

No production staff login, class assignment, teacher draft, review, publication, asset upload or student-private read is performed as part of the current validation. Browser fixtures and isolated PostgreSQL tests cannot replace authorized teacher acceptance. External YouTube availability/privacy and downloaded PDF behavior remain outside this application's content validation boundary. A downloaded file cannot be recalled from a user's device by later withdrawing a lesson.

## Validation and deployment acceptance

Run from the repository root after installing exact dependencies:

```sh
npx --yes pnpm@11.19.0 --dir tools/lesson-runtime install --frozen-lockfile --ignore-scripts
node tools/lesson-runtime/build-validator.mjs --check
node tools/lesson-runtime/build-server-validator.mjs --check
node tools/lesson-runtime/test-schema.mjs
node tools/lesson-runtime/test-server-document.mjs
node tools/lesson-runtime/test-content-v2.mjs
node tools/test_lesson_persistence_api.mjs
node tools/lesson-runtime/test-media-content.mjs
node tools/lesson-runtime/test-asset-contract.mjs
node tools/test_lesson_asset_bytes.mjs
node tools/test_lesson_asset_storage.mjs
node tools/test_lesson_media_api.mjs
python tools/test_lesson_media_database.py --static-only --report reports/lesson-media-static.json
deno check --frozen --config supabase/functions/lesson-api/deno.json supabase/functions/lesson-api/index.ts
```

The completed local suites at this writing include 18 original schema groups, 15 server-document groups, 10 content-v2 groups, 23 existing API groups, five new media groups covering 92 shared content cases, 10 byte-inspection groups, 14 Storage protocol groups and 24 transport-inclusive media API groups. Static database input checks and the frozen deployable Deno check pass. Ten new Studio browser groups and eight institutional-media groups also pass locally. This is not an actual database execution result. Complete CI remains pending.

The new `Private lesson media contracts` workflow (`.github/workflows/lesson-media.yml`) checks generated provenance and the exact deployable Deno entrypoint. Its browser job runs `test-media-renderer.mjs` and `test-institutional-media.mjs`, uploading `artifacts/lesson-media/`. The separate Studio workflow exercises authoring, invalid buffers, upload cancellation, state clearing and preview behavior.

The PostgreSQL 15 job creates an explicit disposable loopback database with a name beginning `echs_lesson_test`. It first runs all 22 prior migrations and the unchanged 235 persistence checks/eight HTTP-SQL groups, then migration 23 and the unchanged 203 content-v2 checks/seven HTTP-transport-SQL groups. Only after these pass does it apply migration 24 and run:

```sh
python tools/test_lesson_media_database.py --baseline-report reports/lesson-content-v2-database.json --report reports/lesson-media-database.json
node tools/test_lesson_media_e2e.mjs
```

The new database suite uses actual roles, grants, RLS, sessions, memberships, course pins, transactions, immutable history and separate connections for races; authorization outcomes are not mocked. The HTTP suite uses the actual handler, fixed PostgREST transport, Storage client and real SQL RPC bridge. Its explicit in-process Storage adapter supplies isolated bytes and corresponding fixture metadata; it does not claim to have exercised a real hosted Storage provider. Reports distinguish those boundaries and record migration hashes and PostgreSQL version. These actual tests must pass before merge; local static checks do not substitute for them.

After deployment, verify the exact commit, migration 24 application, all existing backend deployment checks and the new data-free `GET /health/media` response. That route returns the unchanged store contract plus the exact independent `echs.lesson.media.v1` capability only when the actual deployed transport can confirm the SQL validator and private bucket readiness. It returns 503 if missing, malformed or unsupported. Existing `/health` and `/health/authoring` remain unchanged; private context and media require authentication. Public capability health exposes neither accounts nor asset records. Pages and Edge deploy independently, so Studio must keep new media writes disabled unless the exact media capability is present.

## Rollback requirements

Before any media document or reservation exists, the preceding application release can be restored while leaving harmless additive database infrastructure in place. Once media content is stored, preserve compatible readers, validators, immutable versions, attachment rows and ready objects. Disable new media authoring/upload controls before changing the service; do not revert to a validator that strands existing drafts or snapshots.

Use a forward corrective migration for database defects. Do not drop the new tables, delete historical attachments, empty the bucket, rewrite publication snapshots or remove metadata directly as rollback. Withdrawal uses the existing explicit unpublish operation, which blocks future authorized student retrieval while preserving staff history. Pending-object cleanup must retain the atomic terminal transition; deletion after a stale pending-state observation is unsafe. Existing handcrafted routes remain unchanged. Any future ready-object retention/deletion system needs a separate transactional design and acceptance tests for concurrent attachment and publication.
