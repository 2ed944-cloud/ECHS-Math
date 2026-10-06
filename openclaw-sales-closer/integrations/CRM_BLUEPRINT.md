# Sales CRM blueprint

This is the canonical state model for the autonomous school-sales workflow. HubSpot can implement it once the connected portal is onboarded/configured.

## Deal stages

Use a dedicated school-platform sales pipeline with these semantic stages:

1. `NEW_INBOUND` — buyer contacted the business or otherwise has valid consent/source record.
2. `QUALIFYING` — role, school, need, scope and buying path are being established.
3. `QUALIFIED` — credible problem + suitable buyer/sponsor + plausible procurement path.
4. `MEETING_BOOKED` — meeting URL/date confirmed.
5. `DISCOVERY_COMPLETE` — success criteria and blockers captured.
6. `DEMO_COMPLETE` — relevant guided demo completed.
7. `PROPOSAL_SENT` — approved SKU/terms sent.
8. `NEGOTIATION` — buyer discussing price/scope/terms within authority.
9. `COMMERCIAL_COMMITMENT` — buyer agreed to approved commercial path, pending payment/PO.
10. `PAYMENT_PENDING` — hosted checkout/invoice/PO outstanding.
11. `CLOSED_WON` — verified payment or approved procurement state according to the active commercial policy.
12. `CLOSED_LOST` — no purchase; record loss reason.
13. `ENTERPRISE_REVIEW` — non-standard legal, security, integration, hosting, district or pricing request.

`DO_NOT_MARKET` is a contact/company communication state, not a sales stage. It must survive stage changes.

## Required deal fields

Core:
- deal name
- school/company
- buyer/contact
- buyer role
- country
- lead source
- consent status/source/time
- current stage
- next action
- next action due date

Qualification:
- student count / licensed population estimate
- teacher count
- curriculum/programs of interest
- current workflow/tools
- primary pain/problem
- required success criteria
- authority / decision participants
- budget status if volunteered
- procurement method (card, invoice, PO, bank transfer, unknown)
- target decision date

Meeting/demo:
- meeting URL
- meeting date
- AI disclosure completed
- transcription consent state
- demo route shown
- unresolved factual questions
- security/privacy questions

Commercial:
- commercial SKU
- list price
- quoted price
- discount percent
- floor checked
- term
- proposal/quote identifier
- PO reference
- Stripe customer/quote/invoice/checkout identifiers
- payment status
- loss reason

Compliance:
- `do_not_market`
- legal/security review required
- DPA/privacy review required
- student-data deployment approved
- claims needing human/technical verification

## Automation transitions

Examples:

```text
WhatsApp inbound + valid source -> NEW_INBOUND
qualification score passes -> QUALIFIED
Meet created -> MEETING_BOOKED
meeting summary completed -> DISCOVERY_COMPLETE or DEMO_COMPLETE
approved proposal generated -> PROPOSAL_SENT
buyer accepts commercial path -> COMMERCIAL_COMMITMENT
Stripe hosted route created -> PAYMENT_PENDING
invoice.paid / verified Checkout payment -> CLOSED_WON
non-standard legal/security/pricing request -> ENTERPRISE_REVIEW
opt-out -> do_not_market=true and suppress outbound marketing
```

## No-guess rules

The agent must not infer or manufacture:
- budget;
- decision authority;
- procurement approval;
- consent;
- payment status;
- legal/privacy approval;
- a school-domain relationship from an email domain alone.

Unknown values remain unknown until evidence arrives.

## HubSpot mapping

Preferred standard objects:
- COMPANY = school/organization
- CONTACT = buyer/stakeholder
- DEAL = commercial opportunity
- MEETING_EVENT / CALL = meetings and sales calls
- TASK = explicit follow-up obligations
- NOTE = concise verified meeting summary when needed
- PRODUCT + LINE_ITEM = approved commercial SKU and quoted line item

Use associations among company/contact/deal. Do not create duplicate schools simply because names differ slightly; perform domain/name resolution first.

## CRM write safety

Automations may update deterministic state from verified events. Human/model-generated free text must not overwrite buyer-entered or operator-entered contractual facts. Keep source timestamps and external IDs so writes are idempotent and auditable.
