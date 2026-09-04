# ECHS AI Sales Closer — OpenClaw workspace

Production-oriented workspace for an AI sales representative that can qualify inbound school leads, research the organization, conduct Google Meet/Zoom/Teams conversations, guide a live product demo, handle objections, negotiate only inside approved commercial limits, produce a proposal, and hand the customer into payment/onboarding.

## What is included

- Dedicated OpenClaw workspace (`workspace/`)
- Product and buyer knowledge grounded in this repository
- Sales, discovery, demo, objection, negotiation, closing and follow-up playbooks
- Claims and compliance guardrails
- OpenClaw skills for sales conversations, meeting closing and quality review
- Example OpenClaw config for a dedicated WhatsApp business account and Google Meet
- Commercial configuration file with a hard **do-not-quote-until-configured** gate
- Evaluation scenarios for adversarial buyer simulations
- A public-safe guided school demo at `/demo/school/` using synthetic data only
- Deployment checklist and installer helper

## Design principle

This agent is not a generic chatbot. It is a bounded sales closer.

It may autonomously:
1. respond to opted-in/inbound prospects;
2. discover the buyer's situation and decision process;
3. qualify or disqualify;
4. research public facts about the school;
5. schedule and conduct meetings;
6. guide the demo;
7. answer product questions from verified product knowledge;
8. negotiate within configured bounds;
9. create an approved proposal/order summary;
10. send the configured payment/contract route;
11. follow up at a reasonable cadence;
12. maintain CRM-style notes.

It must never:
- pretend to be a human;
- impersonate Mohammad Abu Ghuwaleh;
- invent product functions, customers, certifications, integrations, legal assurances or security guarantees;
- claim College Board/IB endorsement or licensing unless a verified commercial/legal record explicitly authorizes the claim;
- send unsolicited direct marketing when consent is absent;
- quote a price while `commercial/pricing.json` has `configured: false`;
- accept non-standard legal terms;
- expose real student data in a demo;
- use secrets stored in this repository.

## Current commercial positioning

The repository is presently an Education City High School mathematics deployment. The sales agent must call it a **reference implementation** unless the commercial product name and licensing position are explicitly configured. It must not imply ECHS, Qatar Foundation, College Board or IB endorses third-party commercialization.

## Suggested production architecture

```text
Website / QR / campaign / referral
              |
              v
       consent / inbound lead
              |
              v
      WhatsApp business number
              |
              v
        OpenClaw Gateway
              |
              v
     agent: echs-sales-closer
              |
     +--------+---------+
     |                  |
     v                  v
 Google Meet        CRM / n8n
     |                  |
     v                  v
Guided demo       proposal/payment
```

## Quick deployment

1. Install OpenClaw on a Linux/macOS host.
2. Install WhatsApp + Google Meet plugins.
3. Copy `workspace/` to `~/.openclaw/workspace-echs-sales`.
4. Merge the example config into `~/.openclaw/openclaw.json`.
5. Link a dedicated WhatsApp account:
   ```bash
   openclaw channels login --channel whatsapp --account biz
   ```
6. Configure speech/transcription credentials required by meeting `agent` mode.
7. Fill `workspace/commercial/pricing.json`.
8. Run the evaluation suite manually before allowing live customer conversations.
9. Run:
   ```bash
   openclaw googlemeet setup
   openclaw gateway restart
   openclaw gateway status
   ```

See `DEPLOYMENT_CHECKLIST.md` for the release gate.
