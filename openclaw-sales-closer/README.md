# OpenClaw Autonomous Sales Closer — ECHS-Math

This package is a production-oriented foundation for an AI sales representative that can qualify inbound prospects, research schools, conduct sales conversations, host guided product meetings, handle standard objections, negotiate within approved commercial boundaries, issue an approved next step, and maintain CRM state.

It is deliberately designed as a **transparent AI representative**, not an impersonation of a human or of the platform owner.

## What this package covers

- Dedicated WhatsApp sales identity through OpenClaw.
- Voice calls through the OpenClaw Voice Call plugin.
- Google Meet participation through the OpenClaw Google Meet plugin.
- Browser-driven guided product demonstrations.
- Qualification, discovery, meeting, objection, negotiation and closing playbooks.
- A claims register that blocks unsupported product, legal, security, licensing and affiliation statements.
- Configurable pricing authority. No price is invented when pricing is not configured.
- CRM stage/field contract for HubSpot, n8n or another CRM adapter.
- Evaluation scenarios that must pass before autonomous external selling is enabled.
- A synthetic-data guided school demo page at `/sales-demo/`.

## Architecture

```text
Inbound prospect
  ├─ WhatsApp
  ├─ Website / form
  ├─ Email
  └─ Phone
        ↓
OpenClaw Sales Closer
        ↓
Consent + identity disclosure
        ↓
Qualification / school research
        ↓
Discovery
        ↓
Meeting booking
        ↓
Google Meet / phone conversation
        ↓
Guided demo + objection handling
        ↓
Commercial qualification
        ↓
Negotiation within sales-policy.yaml
        ↓
Approved proposal / payment / procurement next step
        ↓
CRM update + follow-up
```

## OpenClaw workspace layout

OpenClaw loads workspace skills from `<workspace>/skills`. Copy or link:

```text
openclaw-sales-closer/skills/echs-sales-closer/
```

into:

```text
~/.openclaw/workspace/skills/echs-sales-closer/
```

Then verify:

```bash
openclaw skills list
```

The skill follows OpenClaw's `SKILL.md` format with YAML frontmatter.

## Runtime components

### 1. WhatsApp

Use a **dedicated business number** for the AI sales representative. Do not use the owner's personal number. Pair it with:

```bash
openclaw channels add --channel whatsapp --account sales
openclaw channels login --channel whatsapp --account sales
```

Production DM admission should be configured intentionally. For inbound lead capture, use only a policy consistent with the selected WhatsApp deployment and applicable consent requirements.

### 2. Voice

Install the official voice plugin on the Gateway host:

```bash
openclaw plugins install @openclaw/voice-call
```

Supported provider configuration is external to this repository. Credentials must stay in the OpenClaw secret/config surface or environment, never in Git.

### 3. Google Meet

Install the official Google Meet plugin on the Gateway/meeting host:

```bash
openclaw plugins install npm:@openclaw/google-meet
```

For two-way Chrome audio, follow the OpenClaw host-audio setup for the deployment OS. Run `openclaw googlemeet setup` before enabling autonomous attendance.

### 4. Browser demo

OpenClaw's managed browser should use a dedicated profile. The sales agent may browse the public demo, navigate product pages, take screenshots and perform deterministic clicks. Production accounts containing real learner data must never be used for sales demos.

## Required commercial configuration before external launch

The system is **fail-closed** until the following are populated in `config/sales-policy.example.yaml` and copied to a private deployment config:

- commercial product name / white-label name;
- confirmation that the seller has rights to commercialize the platform;
- approved customer segments and territories;
- list price and currency;
- discount authority and absolute floor;
- pilot rules;
- approved contract/proposal templates;
- payment/procurement paths;
- data-processing/privacy documents;
- verified claims/affiliations;
- escalation rules for non-standard legal or security terms.

## Non-negotiable launch gates

Autonomous external selling must remain disabled if any of these is unresolved:

1. **Commercial rights** to sell/rebrand the platform are not confirmed.
2. Pricing is not configured.
3. Contract/proposal/payment flow is not approved.
4. Security/privacy claims have not been reviewed for the intended customer environment.
5. The agent has not passed the evaluation suite.
6. Meeting identity disclosure has not been enabled.
7. A demo tenant/page with synthetic data is not available.

## Verified product evidence used by the sales knowledge base

The current repository supports a connected school mathematics experience including:

- school-managed role experiences for student, teacher, parent and administrator;
- interactive lesson portal;
- focused, adaptive, spaced-review and mistake-recovery practice modes;
- student mastery, review queue, learning streak, knowledge map and recommendations;
- teacher class pulse, assignment workflow, skill analysis and interventions;
- timed test generation with mastery/review/Mistake Bank updates;
- family progress, assignments and a seven-day support plan;
- school account directory, role management, account import and session/password controls.

Claims about third-party endorsement, licensing, official status, compliance certifications, uptime, integrations, learning outcomes or security certifications are **not inferred** from these features. See `governance/COMPLIANCE_AND_CLAIMS.md`.

## Deployment order

1. Review `governance/COMPLIANCE_AND_CLAIMS.md`.
2. Fill a private copy of `config/sales-policy.example.yaml`.
3. Load the `echs-sales-closer` skill into the OpenClaw workspace.
4. Connect a dedicated WhatsApp identity.
5. Connect CRM and calendar adapters.
6. Configure voice and Google Meet.
7. Publish/verify the synthetic `/sales-demo/` route.
8. Run every scenario in `evals/EVAL_SUITE.md`.
9. Start in supervised mode, then enable standard autonomous closes only after logs show stable behavior.

## Deliberate limitations

This repository contains no phone-provider secret, WhatsApp credential, payment credential, CRM token, Google OAuth token or production customer data. Those credentials belong on the eventual OpenClaw Gateway/automation host and cannot safely be committed to GitHub.
