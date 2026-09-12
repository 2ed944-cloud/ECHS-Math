# Deployment checklist

## Gate A — product and legal readiness
- [ ] Confirm the commercial product name.
- [ ] Confirm the legal seller/entity name and invoice details.
- [ ] Confirm the seller has the right to commercialize every component being offered.
- [ ] Review the `Official AP` area separately; do not sell access to protected/restricted material without verified rights.
- [ ] Confirm whether ECHS/QF logos or names may appear in a commercial demo.
- [ ] Confirm privacy notice, data-processing terms and school data retention policy.
- [ ] Confirm whether meeting transcription/recording is allowed and how consent will be announced.
- [ ] Obtain legal review of the standard order form / agreement before autonomous closing is enabled.

## Gate B — commercial readiness
- [ ] Fill `workspace/commercial/pricing.json` and set `configured` to `true`.
- [ ] Define pilot rules and pilot-to-paid conversion.
- [ ] Define maximum autonomous discount.
- [ ] Define payment route.
- [ ] Define standard contract/order form.
- [ ] Define tax/VAT handling if applicable.
- [ ] Define refund/cancellation policy.

## Gate C — channel readiness
- [ ] Dedicated business number is active.
- [ ] `openclaw channels login --channel whatsapp --account biz` completed.
- [ ] Unknown sender policy is intentionally configured.
- [ ] Consent source and timestamp are captured for marketing follow-up.
- [ ] Opt-out is honored immediately.
- [ ] Qatar direct-marketing quiet hours are enforced for any permitted proactive marketing contact.

## Gate D — meetings
- [ ] Google Meet plugin installed.
- [ ] `openclaw googlemeet setup` passes.
- [ ] Realtime transcription configured for `agent` mode.
- [ ] TTS voice configured.
- [ ] AI identity disclosure is tested at meeting opening.
- [ ] Synthetic demo route works on desktop and mobile.
- [ ] No real student records appear in the demo.
- [ ] Meeting summary is generated without storing unnecessary sensitive content.

## Gate E — sales quality
- [ ] Run all scenarios in `evals/scenarios.json`.
- [ ] 100% pass on prohibited-claim tests.
- [ ] 100% pass on pricing-boundary tests.
- [ ] 100% pass on consent/opt-out tests.
- [ ] At least 90% on product-fact accuracy.
- [ ] At least 85% on discovery and objection-handling rubrics.
- [ ] Two human-reviewed mock meetings with no critical error.

## Gate F — production
- [ ] Start with inbound/opted-in leads only.
- [ ] Review the first 20 real conversations.
- [ ] Review the first 10 meetings.
- [ ] Keep non-standard legal terms and pricing exceptions outside autonomous authority.
- [ ] Audit lost deals weekly and update playbooks rather than loosening guardrails.
