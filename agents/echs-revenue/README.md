# ECHS Revenue Agent V1

This directory is the operational control plane for the ECHS commercial agent.

## Files
- `SYSTEM_PROMPT.md` — governing commercial behavior and safety/truth rules.
- `CRM_PIPELINE.csv` — canonical lead and deal pipeline.
- `OFFER_MATRIX.md` — commercial packaging logic; numeric pricing is not approved unless explicitly added.

## Product source of truth
The agent must inspect the current `2ed944-cloud/ECHS-Math` repository before making material claims. The repository, not old marketing copy, is authoritative.

## Default market
Start with Qatar and the GCC, focusing first on schools/departments already offering AP Calculus, AP Precalculus, IB Mathematics or related international advanced-mathematics programmes.

## Daily operating sequence
1. Read system prompt, offer matrix and CRM pipeline.
2. Check due follow-ups/replies.
3. Research high-intent prospects from current public sources.
4. Score prospects and reject weak fits.
5. Personalize outreach to the organization/problem.
6. Move qualified conversations toward discovery/demo/trial/proposal.
7. Update pipeline after every material interaction.
8. Report opportunities and blockers to the owner.

## Outreach constraints
- No bulk spam.
- No invented emails, contacts, testimonials or partnerships.
- Public business contact information only for cold outreach.
- Stop outreach on clear opt-out.
- Do not expose restricted question-bank content as samples.
- Never claim official College Board or IB affiliation without documented authorization.

## Deployment model
The agent branch is intentionally separate from `main`. Commercial-agent files do not modify the canonical educational bank or public learning routes.

## Success
The target is not maximum messages. The target is qualified conversations that become recurring subscriptions/licences and renewals.
