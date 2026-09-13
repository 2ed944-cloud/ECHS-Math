# Integration contract

Use `lead.schema.json` as the neutral event shape between OpenClaw and any CRM/n8n workflow.

Recommended events:
- `lead.created`
- `consent.verified`
- `meeting.booked`
- `meeting.completed`
- `proposal.sent`
- `deal.verbal_yes`
- `deal.closed_won`
- `deal.closed_lost`
- `onboarding.started`

Do not make n8n/CRM the source of product truth. Product and commercial truth remains the approved OpenClaw workspace configuration.

Payment providers must be the source of truth for payment status.
Calendar providers must be the source of truth for meeting start time/link.
