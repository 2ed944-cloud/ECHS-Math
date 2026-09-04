# Final activation inputs — local-first launch

Fill these only with verified operator information. Do not put API secrets in this file; secrets belong in the local machine secret/env store.

## A. Launch computer — required now

- Operating system (macOS / Linux Desktop / Windows): `PENDING`
- Computer can stay powered on and connected during sales availability hours: `PENDING`
- Sleep can be disabled during those hours: `PENDING`
- `deploy/local-first-setup.sh` completed if macOS/Linux Desktop: `PENDING`
- OpenClaw config validation/doctor healthy: `PENDING`

A VPS and a second meeting computer are **not required for launch**. They remain optional upgrades after revenue or reliability data justifies them.

## B. Seller identity — required before binding live Qatar school sales

- Legal seller name: `PENDING`
- Commercial registration / licensed activity checked for platform/software/education sales: `PENDING`
- Customer-facing commercial/product name: `PENDING`
- Seller address / invoice details: `PENDING`
- Arabic invoice identity/text reviewed: `PENDING`

## C. Commercial terms — required before the agent may quote

Recommended launch schedule awaiting approval:

| SKU | Recommended list price | Recommended floor | Term / limit |
| --- | ---: | ---: | --- |
| PILOT | QAR 2,750 | QAR 2,500 | 90 days, up to 100 students / 8 teachers |
| SCHOOL-ANNUAL | QAR 7,500/year | QAR 6,500/year | 12 months, up to 250 students / 12 teachers |
| SCHOOL-PLUS | QAR 12,500/year | QAR 10,500/year | 12 months, up to 750 students |

- Prices approved? `PENDING`
- Maximum autonomous discount approved: recommended `10%`, subject to floor: `PENDING`
- Pilot fee fully credited to annual conversion? `PENDING`
- Pilot conversion window: `PENDING`
- Payment terms for invoice/PO: `PENDING`
- Refund/cancellation terms: `PENDING`
- Governing contract / standard order-form terms reviewed: `PENDING`

## D. Dedicated sales number — required for WhatsApp

- Dedicated Qatar business number: `PENDING`
- Number is separate from the owner's personal WhatsApp identity: `PENDING`
- WhatsApp/WhatsApp Business activated: `PENDING`
- OpenClaw `biz` account QR paired: `PENDING`

Never commit the phone's WhatsApp auth directory to Git.

## E. Model authentication — prefer subscription OAuth

Preferred low-cost path:

```bash
openclaw models auth login --provider openai
openclaw models list --provider openai
```

- ChatGPT/Codex OAuth completed on the launch computer: `PENDING`
- `openai/gpt-5.6-luna` visible: `PENDING`
- `openai/gpt-5.6-terra` visible: `PENDING`
- `openai/gpt-5.6-sol` visible: `PENDING`

Do not assume a tier is available. If the signed-in account exposes a different set, update the config to the verified model list.

## F. Voice meetings — small variable cost only

Reasoning should use subscription OAuth when available. The launch config uses no-key Microsoft TTS.

Google Meet agent-mode realtime transcription still needs a provider key for reliable talk-back:
- dedicated OpenAI API project for transcription created: `PENDING`
- small monthly budget/alert configured: `PENDING`
- project-scoped API key stored locally, never committed: `PENDING`
- macOS: BlackHole 2ch + SoX ready; or Linux Desktop: PipeWire-Pulse ready: `PENDING`
- signed-in Google/Chrome sales profile ready: `PENDING`
- `openclaw googlemeet setup --transport chrome --mode agent` passes: `PENDING`
- `googlemeet test-listen` passes: `PENDING`
- `googlemeet test-speech` passes: `PENDING`

## G. Payments / CRM

- Stripe account: `CONNECTED — product/price creation deliberately deferred until pricing approval`
- Approved Stripe products/prices created: `PENDING`
- Payment/Invoice/PO flow smoke-tested: `PENDING`
- HubSpot: `OPTIONAL FOR LAUNCH — connected in ChatGPT, portal onboarding not completed`
- HubSpot sales pipeline/properties: `DEFER UNTIL REQUESTED/ONBOARDED`
- Payment -> CLOSED_WON event path tested: `PENDING`

OpenClaw session memory plus structured meeting summaries are sufficient for the first controlled smoke tests; HubSpot is not a launch blocker.

## H. School data deployment

- Sales demo uses synthetic data only: `READY`
- Privacy/security deployment package reviewed for real student data: `PENDING`
- Controller/processor roles and DPA path defined: `PENDING`
- Special-nature/children-data requirements reviewed before real data: `PENDING`

## Release rule

The AI may perform safe product conversations and internal simulation before all fields are complete. It must not autonomously accept binding live school sales until the legal seller, commercial terms, payment path and applicable data/privacy gates are verified.
