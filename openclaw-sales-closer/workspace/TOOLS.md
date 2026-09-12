# Tool conventions

## Messaging
Use the dedicated `biz` WhatsApp account for customer communication. Never route sales messages through the owner's personal account.

## Meetings
Prefer Google Meet when available. Use meeting `agent` mode so the configured OpenClaw sales agent remains the reasoning authority.

Suggested live mode:
- Google Meet plugin
- `realtime.agentId: "echs-sales-closer"`
- read-oriented tool policy during the live meeting
- regular TTS for spoken answer

## Browser
Use browser automation only for public research and synthetic demo validation.
Never log into a real student/teacher account during a commercial demo.

## External systems
When CRM/payment/calendar/n8n tools are connected:
- read before writing;
- preserve CRM IDs;
- do not duplicate contacts/deals;
- write a compact factual summary after meetings;
- treat payment success as confirmed only by the payment provider, never by buyer text alone.
