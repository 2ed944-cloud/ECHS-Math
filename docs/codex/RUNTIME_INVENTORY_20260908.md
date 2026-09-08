# ECHS-001 — canonical runtime inventory

Inspected `2ed944-cloud/ECHS-Math` main commit `fda45056e7b11e3f1d45bf96f7c8c36246d69e8d` on 2026-09-08. The supplied 2026-09-07 baseline still matches main. This is a source audit, not a claim about live database contents, deployed grants, or production account behavior.

The companion `RUNTIME_INVENTORY_20260908.json` contains machine-readable paths, script load order, deployment exclusions, all canonical Edge Functions and migrations, critical tests, and detailed backend/content findings with source references.

## Runtime and deployment

`index.html` loads `data/courses.js` followed by course-specific overlays, then the portal/access/institution layers. A newer filename is not evidence of a canonical lesson route; follow this catalogue and its redirects. `preview.html` uses a separate demonstration catalogue.

Production remains static HTML/CSS/JavaScript on GitHub Pages. `.github/workflows/deploy-pages.yml` checks out an exact commit, runs the existing regression suites, copies to `_pages`, injects lesson guards, fingerprints institutional assets, writes deployment identity, validates, and deploys that same artifact. PR runs validate without deploying. Source lesson HTML is not the exact final Pages artifact because guard injection is a build step.

Canonical institutional source is `supabase/functions`, `supabase/migrations`, and `supabase/config.toml`. A main change to migrations/functions triggers `.github/workflows/deploy-institution-backend.yml`, which applies migrations and redeploys functions. Adding a migration therefore requires executable database tests before merge.

Historical `.echs-backups`, `*.bak`, and `integration` copies are explicitly excluded from Pages. `.staging`, `packages`, and `.deploy` are not canonical runtime authorities and do not have explicit exclusions in the present rsync command. This is an artifact-policy observation, not evidence that every historical path is reachable over HTTP. `platform` and `docs` contain design/release records; `tools` is validation/tooling and is excluded from Pages.

## Authentication, publication, and evidence

ECHS uses custom school-account UUIDs and opaque hashed bearer sessions. It does not equate these identities with Supabase Auth users. The configured Edge Functions disable gateway JWT verification and enforce school sessions or bootstrap authorization themselves. Protected tables use RLS with direct anon/authenticated access revoked; service-role Edge Functions enforce institutional authorization. New tables must follow this boundary explicitly.

The lesson guard retains course enrolment and server lesson-release checks before setting `data-lesson-gate="allowed"`. The finish-to-practice bridge keeps `course`, `unit`, `topic`, `lessonKey`, and `accessKey` routing context. Lesson completion and local readiness are not institutional mastery. Existing trusted-evidence aggregation and source/rights publication gates remain separate responsibilities.

Current aliases combine AB and BC as `ap-calculus`; new version IDs must not inherit that ambiguity. Legacy class/course keys, URLs, completion keys, and current cohort behavior remain unchanged during the additive version-model phase.

## Lesson and question architecture

AP Calculus 1.1 is the handcrafted reference deck, reached both by its canonical page and an existing introductory redirect. AP 1.7–1.16 use the continuation engine with lesson-local original practice. Recent IB 1.1, 1.2 and 1.4 use split model/question/runtime modules; IB 1.3 is a concrete layered `LESSON_DATA` reference. Other generated/readiness packages require explicit adapters, not filename-based mass conversion.

Question providers are the audited public canonical bank, authenticated private banks, and lesson-local original practice. The existing eligibility, provenance, licensing and answer-verification gates remain authoritative. The foundation renderer must not duplicate private prompts, answers, teacher notes or markschemes into static assets.

## Findings that constrain this cycle

- A local VM reproduction confirmed that the active legacy mastery bridge can replay a global unowned queue with a different account's credentials and drops raw engine evidence/completions. Repair is a separate tested slice after this inventory.
- Existing source validators are valuable but do not prove database role/tenant isolation. ECHS-003 needs executable database tests.
- Current class-membership mutation, older API aliases, atomic skill remapping and evidence-authenticity assumptions have additional source-observed risks, detailed in the JSON. Do not use them as new version/publication authorization shortcuts. A source observation is not a claim of a tested exploit.
- A legacy IB view-based readiness indicator is local UI progress. Compatibility contracts must never turn it into mastery evidence.
- Several existing lesson tests incorrectly pass file-URL pathname strings to CommonJS `require`; Windows execution reproduces the failure. Preserve the tests and repair path conversion in ECHS-002.

## Acceptance evidence and rollback

`python tools/test_runtime_inventory.py` validates the inventory, canonical references, archive classification and critical-test paths. This slice adds documentation and an inventory check only: no lesson, production route, publication gate, database or runtime behavior changes. Rollback is a normal revert of this documentation/tooling slice; all prior sources remain available.

ECHS-007 has not started. Its readiness is determined only after ECHS-002–006 validation and compatibility evidence are complete.
