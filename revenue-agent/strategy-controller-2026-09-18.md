# ECHS Revenue Strategy Controller — 2026-09-18

## Controller decision

**Keep all list prices, tier scopes, pilot rules, recurring annual licensing, and the 80% commercial floor unchanged.**

The evidence threshold in `PRICING_ENGINE.md` is not met. The pricing engine requires a meaningful review after roughly 10 qualified pricing conversations or 3 closed institutional deals. Current CRM evidence contains **0 deals and 0 quotes**, and there is no newly verified closed institutional deal in the systems available to this run.

Do not infer price resistance from silence, non-response, or operational friction.

## Data freshness and source controls

### HubSpot — current read
Verified in the current review:
- DEAL: 0 records.
- QUOTE: 0 records.
- SUBSCRIPTION: 0 records.
- INVOICE: 0 records.
- PRODUCT: 0 ECHS catalog records.
- HubSpot currently contains only sample company/contact/email data and is not functioning as a complete sales source of truth.

Therefore HubSpot cannot currently provide segment conversion, ARR, proposal conversion, deployment size, discount, or loss-reason evidence.

### Gmail — not refreshable in this non-interactive run
The connected Gmail source required interactive user input and could not be refreshed. Do not fabricate a current Gmail reply count, country conversion rate, demo count, or pricing-conversation count from stale snapshots.

The latest repository-backed sales logs show AIA Doha as an active demo/reviewer evaluation requiring secure account provisioning, and earlier controller evidence identified Al Hussan as the strongest enterprise due-diligence/pricing conversation. These are directional signals only until Gmail is refreshed again.

### Stripe — live account not refreshable in this non-interactive run
The Stripe connector also required interactive user input and could not be refreshed. Do not claim that current Stripe payment activity is zero.

Last verified live Stripe evidence recorded in `pricing-review-2026-08-28.md` was:
- 0 PaymentIntents,
- 0 charges,
- 0 subscriptions.

The repository catalog still records the approved annual list architecture:
- Teacher: QAR 900/year.
- Department Core: QAR 7,500/year.
- Department Pro: QAR 12,500/year.
- School Advanced Mathematics: QAR 22,500/year.
- Tutoring Center: QAR 10,000/year.
- Multi-Campus Enterprise: starting QAR 40,000/year.

`STRIPE_CATALOG.md` still records the QAR subscription payment-link compatibility issue. Treat that as a closing/operations issue, not a pricing signal.

### GitHub revenue-agent branch — current state
The `echs-revenue-agent` branch was current only through **2026-09-02** before this controller review. Its last prior commit was `49966bb6e162ce8dcf0170dfca6f09d7c2856839` (`Log ECHS follow-up and deal desk cycle for 2026-09-02`). The most recent operational sales log before this review was `follow-up-cycle-2026-09-02.md`.

This means post-2026-09-02 Gmail activity was not being mirrored reliably into the repository. Future conversion analysis should not rely on GitHub alone.

## Funnel status that can be verified safely

- Closed-won institutional deals: **0 verified**.
- HubSpot formal deals: **0**.
- HubSpot formal quotes: **0**.
- HubSpot subscriptions/invoices: **0**.
- Completed pricing-evidence threshold: **not met**.
- Verified price objections: **none in repository-backed evidence**.
- Verified discount requests: **none in repository-backed evidence**.
- Verified competitor quotes: **none in repository-backed evidence**.
- Verified closed-lost due to price: **none**.

Do not publish a precise current positive-reply rate, demo rate, pilot rate, proposal rate, country conversion rate, or segment conversion rate until Gmail is refreshed and normalized.

## Strongest evidence-backed audience / message / offer

The best current pattern remains:

**Audience**
- Multi-campus school groups or high-fit international schools.
- Direct academic/curriculum leadership, IB/AP coordinators, Heads of Mathematics, or central academic decision-makers.
- Verified AP Calculus/AP Precalculus or matched IB Mathematics AI need.

**Message**
- One exact curriculum/workflow problem rather than a broad platform tour.
- Teacher private-bank / assessment workflow / mapped practice / differentiated practice when verified.
- Clear statement of what is production- or repository-validated; no unsupported coverage claims.

**Offer**
- Standard qualified pilot: free, 14–30 days, up to 3 teachers and 40 students.
- No SIS/LMS/SSO integration for the first proof unless specifically required and separately scoped.
- Defined success criteria before the pilot.
- Small first deployment with an explicit expansion path to Department Pro, School, or Enterprise annual licensing.

This pattern is supported by the strongest repository-backed opportunities: Al Hussan (enterprise due diligence) and AIA Doha (reviewer/demo evaluation).

## Outreach controller directive

Future outreach should prioritize **quality over volume**. The 2026-09-01 scout log recorded roughly 36 sent messages in the prior 24 hours plus multiple hard bounces; that is a sender-reputation warning. Do not resume broad-volume outreach merely to increase top-of-funnel counts.

Prioritize, in order:
1. Direct academic decision-makers at multi-campus groups with exact AP/IB fit.
2. Premium IB/AP schools with a current curriculum need and a named coordinator/Head of Mathematics route.
3. Multi-centre tutoring/test-prep operators only where ECHS complements, rather than replaces, the existing instructional model.

Default outreach structure:
- verified institution-specific relevance;
- one specific mathematics workflow pain;
- one proof point;
- one low-friction CTA: 15-minute discussion or the standard free pilot;
- no price in cold first touch;
- no ad-hoc paid micro-pilot;
- no more than two cold follow-ups without reply;
- suppress bounced, rejected, opted-out, and recently contacted organizations.

## Operational priorities before scaling

1. **Secure reviewer-account provisioning** — AIA Doha's repository-backed blocker is operational, not commercial. Do not fabricate credentials or promise access before authenticated provisioning is available.
2. **CRM hygiene** — create/maintain real companies, contacts, deals, next actions and deal stages in HubSpot when the workflow can do so reliably. Current HubSpot data is not usable for conversion analytics.
3. **Gmail normalization** — ensure all sent/replied ECHS sales threads are consistently labeled and mirrored into CRM/audit logs.
4. **Payment readiness** — preserve QAR economics; use institutional invoice/bank transfer where needed until compatible Stripe checkout is confirmed.
5. **Support measurement** — for the first three real pilots, track setup hours, onboarding hours, support contacts, mapping/custom-content work, and decision-maker time. Do not expand standard support scope before actual burden is measured.

## Evidence needed before any price/scope change

Do not recommend a structural price or scope change until at least one of these thresholds is reached:
- roughly **10 qualified pricing conversations**, or
- **3 closed institutional deals**, or
- a clearly material market signal supported by multiple credible buyers.

For each pricing conversation capture:
- country and buyer segment;
- tier quoted and normalized QAR economics;
- teachers, students, campuses and programs in scope;
- annual-prepay / multi-year acceptance;
- exact price objection wording;
- competitor and competing quote if any;
- discount requested/offered/accepted;
- onboarding/support/customization requested;
- actual implementation hours;
- demo -> pilot -> proposal -> close outcome;
- closed-lost reason.

## Pricing conclusion

There is **no verified evidence to lower or raise list prices, broaden included scope, bundle material customization, or weaken the 80% floor**. The commercial problem to solve first is sales-process execution and instrumentation: secure provisioning, consistent CRM capture, clean Gmail attribution, high-fit targeting, and enough real pricing conversations to measure willingness to pay.
