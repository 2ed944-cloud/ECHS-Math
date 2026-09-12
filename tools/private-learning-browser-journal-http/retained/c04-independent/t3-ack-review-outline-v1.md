# T3 review outline: commit an exact delivery receipt without losing newer work

Draft for review after the T2 successor is frozen. This file does not enable transport, authorize owner adoption, or claim native T3 acceptance. T2 is still being repaired and tested. Its final manifest must replace the provisional source references before implementation.

The accepted HTTP boundary is PR376 at `f127a8e9d5a18be2f19bd8bb3d5e30b159dbb169`, tree `42148dda6ec82d8bf470cd17a9b9f2752170aa3d`. Both PostgreSQL majors passed all twenty real HTTP cases in run34660368314. The relevant immutable modules remain J049 V3: `pending-intent.mjs` SHA `10aa9c3ba04aa0e32483763b5b8ef17d489b6449f4b8738563254d427811f69d` and `contract.mjs` SHA `050a652f28e957aaabd7e87428b4811dbeb2ebfad80552023ebef9c931271e84`.

## Trusted delivery and the first receipt

The receipt transition must consume a result from an explicitly injected trusted delivery port, with an exact route, request string, status and bounded raw response. A public method accepting arbitrary caller-provided `verified:true` or a receipt object is not delivery evidence. The default candidate has no network port. Synthetic native test ports remain explicitly distinguished from the accepted real HTTP fixture, and neither establishes production adoption.

Read the durable in-flight mapping first. Send only its stored exact apply body and UUID; do not reconstruct it from the latest projection or current heads. Capture the current owner/session authority, operation mapping and lifecycle state before delivery. A per-delivery abort controller must stop the underlying operation on deadline or disposal and cancel late response bodies. Storage transactions must not span the network request.

Use the exact V3 `acknowledgeIntent` helper. Only a successful status200 reply to the exact raw apply request can establish the first ACK. Lookup is informational until an immutable first receipt already exists. HTTP207, timeouts, malformed or partial replies, a changed request, a foreign owner, missing lookup and changed known receipt preserve pending state. The same-UUID/different-value counterexample is mandatory: a lookup receipt cannot establish equality of the original opaque values.

Persist the first accepted raw reply/status and its canonical immutable receipt. A later reply may report a different current owner revision or reset generation; those observations do not replace the first raw evidence or the immutable receipt. Do not compare a new whole response to the first response as if its changing `current` field were immutable.

## One native transaction

After pure validation, open one strict transaction covering owners, latest pending records, immutable source bundles and bindings, wire intents and retained receipt metadata. Recheck live authority, the exact wire mapping and current first-ACK state inside that transaction. Two tabs delivering the same stored intent must converge on one first receipt and one counter transition. The losing observer may return an already committed result only after reading and validating that result; it must not overwrite first evidence.

For each source record, compare full owner scope, kind, record ID, assigned local revision and exact stored source JSON against the current pending row. Delete a pending row only when all match. A newer row remains pending. An equal revision with different bytes or an inconsistent source link is corruption and aborts the entire transaction. Validate duplicate revision/source identities explicitly before relying on the scope-global revision guarantee. Never clear by record ID alone.

The same transaction marks exactly that bundle acknowledged, retains the exact wire and receipt, clears only the matching in-flight pointer, advances the queue past exactly that bundle, and adjusts counters only for rows actually cleared. It does not delete command receipts, attempt identity stamps, history, bundles, per-key producer lineage or newer projections. It emits no legacy effects and grants no mastery, publication, lesson access or grading authority.

Account the complete serialized retained metadata, including duplicated raw strings, pending-intent receipt text and first-response evidence. Refuse an over-capacity ACK atomically while preserving the pending request and source; do not partially clear rows to make room. A lost transaction completion is recovered by inspecting the already committed exact receipt, not by applying local learning effects again.

## Queue dependencies and reset observations

After ACK, a later mutable producer resolves its expected server revision from the exact acknowledged predecessor record. Verify captured predecessor bundle/index/kind/ID/local revision/context/generation against that predecessor's immutable source, operation mapping and receipt. Do not substitute a newly queried head. Preserve complete compound ordering and hold unresolved predecessors.

If an accepted reply reports a later reset generation, retain the historical receipt but block subsequent materialization under the old context. Clearing a matching pending row records historical delivery; it does not make the value current after reset or authorize its re-upload. Future local production needs a separately reviewed reconciliation/context decision. This slice emits no reset requests or tombstones and never maps local reset flags to remote semantics.

## Required native cases

- Exact apply success, duplicate concurrent deliveries, lost completion and reload preserve one first raw receipt and one counter transition.
- First lookup, changed-value same-UUID lookup, HTTP207, partial response, timeout and malformed or foreign receipts retain the exact request and all pending rows.
- ACK for revision r preserves newer r+1; same-r changed JSON, wrong source identity or duplicate revision aborts all writes.
- Transaction abort/quota failure at every ACK write preserves every participating store; actual committed completion loss recovers without replaying local effects.
- A changed current wrapper with the same known immutable receipt is accepted as observation; a changed immutable receipt fails.
- Old-generation exact replay can acknowledge historical delivery but blocks subsequent old-context materialization; no generation refresh or reset resurrection occurs.
- Acknowledged predecessor supplies only its matching record revision; pending, wrong-index, wrong-kind, wrong-generation and malformed predecessor evidence hold the whole dependent bundle.
- Owner change, expiry, versionchange, blocked open, late network completion, response cancellation and reentrant callbacks cannot report success through a stale handle.
- Original T1/T2 native cases and provisional engine behavior remain intact; no authority, public runtime or active network rollout is introduced.

Actual browser-to-HTTP/database integration and complete producer/reader/adoption coverage remain later acceptance gates. Native tests with a synthetic delivery port must not be relabeled as hosted or production proof.
