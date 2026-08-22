# Commercial communication and AI disclosure policy

This is a conservative operating policy for a Qatar-based deployment, not legal advice.

## Seller / commercial-license gate

Before the agent is allowed to issue a binding proposal, accept payment or describe a seller as licensed in Qatar, `commercial/pricing.json` must contain the verified legal seller name and the operator must confirm that the relevant commercial activity is covered by the seller's current Qatar commercial registration/license.

Qatar Ministry of Commerce and Industry guidance states that merchants must operate only within activities permitted by their commercial register/license. The agent must never invent a trade-license number, legal entity, registered activity or tax status.

If the seller/legal-entity field is not verified, the agent may conduct discovery and product demonstrations but must not represent that a binding local commercial contract has been issued.

## Invoices in Qatar

MOCI investor obligations state that merchants must provide detailed invoices to consumers and that the invoice must be in Arabic in addition to any other language.

Operational rule:
- Qatar-facing invoice/receipt templates must include Arabic plus any desired English version;
- legal seller identity and invoice details must come from the approved commercial record, never from model inference;
- Stripe/CRM metadata must preserve the school/deal/PO reference, but internal metadata is not a substitute for required customer-visible invoice fields.

## Public promotions / discounts

MOCI guidance requires approval for promotions/discounts in regulated promotional contexts. The agent must not launch a public advertised discount campaign, coupon promotion or time-limited sale merely because it has negotiation authority. Public promotions require the applicable operator approval/licensing check first.

Individual B2B contract negotiation remains bounded by `commercial/pricing.json` and should not be described as a public promotion.

## Direct marketing

The Qatar Communications Regulatory Authority’s current spam/direct-marketing rules require prior consent for direct marketing electronic communications and require records capable of demonstrating consent. The regulation also restricts direct-marketing communications to 09:00–21:00, with the applicable treatment of channels determined by the current regulation.

Operational rule for this agent:
- no proactive marketing message without a verified consent record;
- record who consented, when, channel, source, seller and purpose;
- allow withdrawal at any time;
- do not buy/use scraped lists for autonomous messaging;
- keep promotional communication clearly identifiable and truthful.

References:
- CRA amended Spam Regulation (current version published on cra.gov.qa)
- CRA Communications Consumer Protection Regulation

## WhatsApp

Use a dedicated business account.
Follow current WhatsApp/Meta commercial messaging rules and opt-in requirements.
Do not use automation to evade platform restrictions.

## AI identity

The agent must disclose that it is AI at the beginning of a live meeting and should not impersonate a specific human.

## Transcription

When live transcription/recording is enabled, disclose it and follow the applicable consent requirement and customer policy. If a participant objects, stop transcription and move to an approved non-transcribed channel or reschedule under an agreed format.

## Personal data / school deployment

Qatar Law No. 13 of 2016 on Protecting Personal Data Privacy requires lawful, transparent processing and appropriate administrative, technical and physical precautions. The law treats children's data as personal data of a special nature.

Sales-stage rule:
- sales conversations and demos must not request or expose real student records;
- use synthetic demo data only;
- never ask a school to upload a real student roster to prove the product during sales.

Deployment rule:
- before a school puts real student/personal data into the platform, complete a separate privacy/security deployment review;
- determine controller/processor roles and document them;
- use a written data-processing agreement where the relationship requires one;
- document processing purposes, data categories, retention/deletion, access controls, incident handling and any cross-border processing;
- obtain any authorization/approval required for processing special-nature data before such processing begins.

The AI sales agent may explain that a privacy/security review is available, but may not claim that every school deployment is automatically compliant.

## Restricted content and trademarks

Do not commercially promise or distribute third-party copyrighted/restricted question banks or use third-party endorsement claims without a documented right.

## Truthful advertising

No invented:
- customers;
- testimonials;
- performance metrics;
- approvals;
- certifications;
- scarcity;
- competitor claims.

## Go-live blockers

The agent cannot autonomously close live Qatar sales if any of these are unresolved:
- verified legal seller identity/activity;
- approved Arabic-capable invoice/receipt process;
- approved pricing/floor/discount authority;
- payment method and refund/cancellation terms;
- school data-processing/privacy package for any deployment involving real student data.
