# Final activation inputs

Fill these only with verified operator information. Do not put API secrets in this file; secrets belong in the VPS secret/env store.

## A. Seller identity — required before binding Qatar sales

- Legal seller name: `PENDING`
- Commercial registration / licensed activity checked for platform/software/education sales: `PENDING`
- Customer-facing commercial/product name: `PENDING`
- Seller address / invoice details: `PENDING`
- Arabic invoice identity/text reviewed: `PENDING`

## B. Commercial terms — required before the agent may quote

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

## C. Sales number — required for WhatsApp

- Dedicated Qatar business number acquired: `PENDING`
- Number is not a personal WhatsApp identity: `PENDING`
- WhatsApp/WhatsApp Business activated: `PENDING`
- OpenClaw `biz` account QR paired: `PENDING`

## D. OpenAI API — required for model, transcription and TTS

Do **not** paste the key here.

- Dedicated OpenAI API project created: `PENDING`
- Billing / monthly spend limit configured: `PENDING`
- Project-scoped API key stored on VPS only: `PENDING`

## E. Infrastructure — required for 24/7 operation

- VPS provisioned (Ubuntu 24.04 / Debian 12, 4 GB RAM recommended): `PENDING`
- SSH key login works: `PENDING`
- Gateway 18789 not public: `PENDING`
- `vps-bootstrap.sh` completed: `PENDING`
- OpenClaw config validation/doctor healthy: `PENDING`

## F. Meet node — required for autonomous voice meetings

- Always-on macOS or Linux Desktop available: `PENDING`
- Node paired as `sales-meet-node`: `PENDING`
- Dedicated Google sales account/profile: `PENDING`
- `googlemeet test-listen` passes: `PENDING`
- `googlemeet test-speech` passes: `PENDING`

## G. Payments / CRM

- Stripe account selected and usable: `CONNECTED — product/price creation deliberately deferred until pricing approval`
- Approved Stripe products/prices created: `PENDING`
- Payment/Invoice/PO flow smoke-tested: `PENDING`
- HubSpot connection present: `CONNECTED — portal onboarding not completed`
- HubSpot sales pipeline/properties created: `PENDING`
- Payment -> CLOSED_WON event path tested: `PENDING`

## H. School data deployment

- Sales demo uses synthetic data only: `READY`
- Privacy/security deployment package reviewed for real student data: `PENDING`
- Controller/processor roles and DPA path defined: `PENDING`
- Special-nature/children-data requirements reviewed before real data: `PENDING`

## Release rule

The AI may perform safe product conversations and internal simulation before all fields are complete. It must not autonomously accept live binding school sales until the legal seller, commercial terms, payment path and applicable data/privacy gates are verified.
