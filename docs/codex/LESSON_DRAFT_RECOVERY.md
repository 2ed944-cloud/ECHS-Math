# ECHS-011: editing history and encrypted draft recovery

## Release status

Implementation and local integration checks are in progress. ECHS-011 is not yet merged or deployed. The accepted predecessor is ECHS-010, PR #358, main `33d90e6025946450e15e91afa16696ae5d245bf4`. Actual PostgreSQL migration execution, complete PR checks and production acceptance remain required before completion.

## Architecture and protected behavior

`draft-session.mjs` still owns the canonical draft, separate private notes, debounce, serialized compare-and-swap saves and ambiguous-response reconciliation. It adds bounded local editing history and a validated recovery checkpoint. `draft-backup.mjs` encrypts these checkpoints into IndexedDB. `app.mjs` presents recovery choices only after the existing institutional client verifies staff access, reads the lesson and obtains its recovery key. The server remains authoritative for every draft revision and permission.

This stage preserves all existing lesson URLs, handcrafted/data-driven engines, Pages deployment, published snapshots, question publication gates and mastery/sync behavior. There is no student-route adoption, public teacher content, framework migration, curriculum change or question-bank change. The existing service-worker rules already bypass private API traffic and refresh Studio modules; its cache version is advanced for the new shell.

## Editing history

Undo/redo stores accepted document/private-note states, limited to 50 states and a combined 20 MiB of compact JSON UTF-8 snapshots. This is a content budget, not an exact JavaScript heap measurement. Typing in the same field/block coalesces for one second; structural actions form separate operations. Composition commits after the composition ends. Native text-input undo remains available inside editing controls; keyboard Ctrl/Cmd-Z, Shift-Z and Ctrl-Y outside inputs use lesson history.

Server acknowledgements do not create history entries. Historical document states are rebased onto the latest acknowledged publication/revision metadata before saving. New edits clear redo; successful reload and disposal clear both stacks. Undo while a save is in flight retains the intended local reversion and saves it against the acknowledged revision. History is memory-only and is not placed in checkpoints or public preview.

## Private recovery key

`202609090001_lesson_draft_recovery.sql` adds a private, immutable 32-byte random key for each account/organization/class/lesson scope. The service-only RPC `lesson_draft_recovery_key` derives identity from the institutional session and reuses existing staff/lesson authorization; caller-provided tenant/account fields are not accepted. Every key release verifies current access, including session expiry after database waits. Direct public/authenticated/service-role table access is denied. Key material is never logged or embedded in Pages assets.

`POST /lessons/:id/recovery-key` accepts exactly `{}` and returns exactly:

```text
ok, contract, account_id, organization_id, class_id, lesson_id, key_id, key_base64
```

`contract` is `echs.lesson.recovery.v1`; the key is canonical base64 encoding of 32 bytes. The client validates every scope against its verified account and known lesson binding. Existing authoring/media capability contracts remain unchanged. A separate data-free `GET /health/recovery` and context field expose the exact capability only when the actual database supports it:

```json
{"contract":"echs.lesson.recovery.v1","cipher":"AES-256-GCM","checkpoint_version":1,"max_plaintext_bytes":4194304}
```

Missing capability or storage failure disables device recovery while ordinary authenticated server saves remain available.

## Checkpoint and encryption contract

The closed `echs.lesson.checkpoint.v1` checkpoint includes the projected base lesson/head, latest canonical document, separate private notes and optional in-flight/uncertain sent snapshot. It excludes history, review/publication arrays, credentials, raw invalid editor buffers, uploaded bytes and preview state. Every document and notes field is validated; total plaintext is at most 4 MiB. At the largest supported document sizes, duplicated pending/base snapshots can exceed this checkpoint budget: the backup reports failure while the normal server save continues.

Each tab receives a fresh branch UUID. The IndexedDB database `echs-lesson-draft-backups-v1`, store `checkpoints`, contains ciphertext and only opaque scope IDs, branch IDs, sequence numbers, timestamps, format and deletion metadata. Encryption uses a nonextractable in-memory AES-256-GCM CryptoKey, a fresh 12-byte random IV and a 128-bit authentication tag. Additional authenticated data binds format, exact scope, branch, sequence and timestamp. Decryption verifies bounds, authentication, fatal UTF-8 decoding, closed JSON structure and canonical content before returning any candidate. Storage/crypto operations have a five-second bound, and each recovery list returns at most 32 valid candidate branches with a warning when more exist. The write queue retains one active write and only the newest waiting write; superseded plaintext buffers are cleared immediately.

The ciphertext limit is 4 MiB plus the 16-byte authentication tag. The encryption and transaction implementation follows the [W3C Web Cryptography API](https://www.w3.org/TR/webcrypto/) and [IndexedDB transaction model](https://w3c.github.io/IndexedDB/#transaction-lifetime). Cryptography does not replace server authorization. No decryption key, token, plaintext document or plaintext teacher note is persisted by this module in browser storage.

## Recovery, conflicts and failure behavior

Opening a lesson first verifies current school access. Teachers can recover or explicitly delete individual device branches, or retain backups and use the server draft. The current server record is fetched again after selecting a backup, because another teacher may have edited while the dialog was open.

Recovery is allowed only into a freshly loaded, unchanged editing session. An unchanged server base permits safe resumption. If the server contains exactly the pending sent content at the next revision, recovery recognizes the lost acknowledgement and preserves any newer local edits without duplicating the acknowledged save. Any other revision blocks autosave and retains the local work as a conflict with its original base. Explicit reload/discard uses the existing confirmation dialog.

A recovered candidate is removed only after the work is already confirmed on the server or copied successfully into the new encrypted branch. Saves first attempt a bounded one-second checkpoint of their pending intent; storage rejection or timeout cannot block the authenticated save. Reconnection retries uncertain writes by reading the server first. Device backup status is separate from server Saved status. Atomic sequence checks, local generations and tombstones prevent delayed writes from resurrecting a discarded checkpoint or replacing another tab's branch.

Disposal clears keys and editor/recovery memory, cancels outstanding work and retains only completed ciphertext. Account/configuration/route changes reject late responses. Encrypted data remains unusable until a fresh server key request authorizes the same account and lesson. Cold offline reopening is intentionally unavailable; an already verified open tab can edit offline and recover after reconnecting.

## Validation

Run the original suites plus the new contracts:

```text
node tools/lesson-studio/test-draft-model.mjs
node tools/lesson-studio/test-draft-session.mjs
node tools/lesson-studio/test-api-client.mjs
node tools/lesson-studio/test-draft-backup.mjs
node tools/lesson-studio/test-studio-browser.mjs
node tools/lesson-studio/test-studio-content-v2.mjs
node tools/lesson-studio/test-studio-media.mjs
node tools/lesson-studio/test-studio-recovery.mjs
node tools/test_lesson_recovery_api.mjs
python tools/test_lesson_recovery_database.py --help
node tools/test_lesson_recovery_e2e.mjs
python tools/validate_baseline.py
```

Browser tests use synthetic accounts, actual production HTML/modules, real WebCrypto/IndexedDB and the real HTTP handler with an isolated RPC adapter. They verify recovery, lost acknowledgement, conflict, multiple tabs, denied access, account switch, storage failure, composition, responsive controls and absence of mastery requests. They are not substitutes for real PostgreSQL/RLS tests. The dedicated `lesson-recovery.yml` runs all preceding 24 migrations and database/HTTP checks before applying migration 25 and exercising the actual handler/transport/SQL boundary.

## Security limits and rollback

Backend administrators and the deployed application remain trusted. Encryption at rest does not protect content from compromised same-origin JavaScript while an authorized session holds a key, nor does it provide a separate offline credential. Browser eviction, private browsing, device loss, crashes before a write commits and oversized checkpoints can prevent recovery; the UI distinguishes backup failures from acknowledged server saves. Incomplete invalid field buffers remain in the open editor only. Pending lesson creation and upload bytes are outside this checkpoint contract.

Rollback the Studio shell/modules to the preceding accepted revision while retaining the additive migration and existing encrypted data. Do not delete recovery keys or rotate them without a migration that preserves decryption of existing checkpoints. Do not drop private tables, rewrite immutable versions or move key material into public configuration. A forward corrective migration is required for database changes. ECHS-012 must not start until ECHS-011 passes its complete acceptance and deployment checks.
