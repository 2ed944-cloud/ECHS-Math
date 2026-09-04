# Sales monitoring reference

Current OpenClaw releases configure heartbeat instructions through the agent heartbeat/monitor configuration rather than relying on this workspace file. The active production prompt is therefore duplicated in `config/openclaw.sales.example.json5`; treat that config as authoritative.

Monitoring policy:

1. meetings in the next 24 hours that lack research/prep;
2. consented active deals with a promised follow-up due;
3. proposals with an explicit buyer-agreed decision date that has passed;
4. closed-won customers needing onboarding handoff;
5. conversations containing unresolved factual/technical questions;
6. failed integrations or channel health issues.

Do not generate marketing contact merely because a lead is idle.
Do not contact anyone marked `DO_NOT_MARKET`.
Recurring timed work belongs in OpenClaw automations/calendar workflows, not heartbeat.
If nothing needs action, remain quiet.
