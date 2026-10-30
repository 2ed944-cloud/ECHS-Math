# ECHS Revenue Strategy Controller — 2026-10-30

## Controller decision
**NO CHANGE** to provisional annual list prices, tier limits, standard qualified pilot, discount-authority ladder, annual-recurring preference, or 80%-of-standard-quote commercial floor. This is an evidence-preservation decision, not evidence that current prices are optimal. Follow `PRICING_ENGINE.md`: require roughly 10 genuinely qualified buyer pricing conversations, 3 independently verified institutional closes, or a corroborated material market signal before structural repricing.

## Sources and freshness — 30 October 2026
- **HubSpot, live read today** (portal account 149155379): DEAL 0, QUOTE 0, SUBSCRIPTION 0, INVOICE 0, PRODUCT 0, LINE_ITEM 0; COMPANY 1 (HubSpot sample), CONTACT 2 (HubSpot sample); MEETING_EVENT 2, both explicitly sample/test meetings. These are portal records, **not proof of zero revenue or zero activity outside HubSpot**. The portal reports onboarding incomplete and is not a trustworthy normalized ECHS pipeline.
- **Gmail:** attempting to list the `ECHS Revenue Outreach` label required user interaction unavailable to this run. No current Gmail reply, bounce, pricing, meeting or closed-sale count can be asserted. Buyer replies may also exist outside this label, per the September audit; do not extrapolate label-only metrics.
- **Stripe:** the live account listing required user interaction unavailable to this run; therefore current live products, payments, subscriptions, invoices, MRR, ARR and revenue **are unverified, not zero**. `STRIPE_CATALOG.md` is a historical six-product identifier/price inventory only. Its QAR payment-link compatibility note is not a newly verified live status.
- **GitHub:** branch `echs-revenue-agent` was successfully read. Latest commit before today's review was `cdce19a363245967d257006929bd4a3c73c6e8bf` on **2026-10-23**, updating a controller report. Latest operational follow-up log is **2026-09-02**. Reports are historical audits, not a real-time transaction ledger.
- **No independent material market-price/competitor signal** was established by these sources.

## Baseline annual list prices and scope (unchanged; QAR)
| Tier | Annual list | Capacity/notes |
|---|---:|---|
| Individual Teacher | 900 | One teacher; not unlimited school deployment |
| Department Core | 7,500 | Up to 100 students / 5 teachers; one program focus |
| Department Pro | 12,500 | Up to 250 students / 10 teachers; multiple verified supported courses |
| School Advanced Mathematics | 22,500 | Up to 500 students / 25 teachers; verified programs |
| Tutoring Center | 10,000 | Up to 150 active students / 10 instructors |
| Multi-Campus Enterprise | from 40,000 | Scope campuses, users, content and services; three-option proposal |

Standard qualified pilot remains **free, 14–30 days, up to 3 teachers / 40 students, pre-agreed success criteria**. Materially longer/larger pilot has QAR 2,500 reference, credited to the first annual license if agreed and converted. No ad-hoc paid teacher-only evaluation tier. Separately scope/invoice content customization, SIS/LMS/SSO, white-labeling, unusual reporting and dedicated implementation. Protect recurring annual economics. Discount ladder: 0–10% only with reason; 10–15% for value in exchange; 15–20% exceptional; never below 80% effective annual quote without explicit owner decision; do not stack maximum incentives.

## Last verifiable historical funnel / country and segment evidence
The 2026-08-28 structured outreach cohort covers 31 prospects; **it is not a current October cohort**:
- Qatar 6 (0 substantive replies at 28 Aug), UAE 11 (0; one auto-acknowledgement), Saudi Arabia 8 (1 substantive Al Hussan reply), Kuwait 2 (0), Bahrain 1 (0), regional networks 3 (0).
- In that early cohort multi-campus/network operators were ~12 with one substantive reply (~8.3%) versus ~19 single schools with zero. This is exploratory and biased by short observation time, unequal fit, outreach timing, and later unlabelled replies; do **not** declare a statistically established winning country or segment or quote these as October conversion rates.
- Later historical reviews identified Qatar IB engagement (AIA Doha school reviewer-account request, AIA Lusail internal evaluation, LSQ meeting agreed, ASD internal review), Saudi AP network diligence (Al Hussan), and tutoring-group meeting interest (UniHawk). These were **different cohorts and stages**. Do not divide them by the August country denominators.
- Historical 28 Aug structured cohort had **0 completed demos, 0 activated institutional pilots, 0 formal proposals, and 0 closed institutional deals then**. These are **not** verified October zeros. No reliable current demo/pilot/proposal/close conversion rates can be calculated.
- TAISM (Oman) had declined because additional resources were not needed at that time; timing/need rejection, **not** a price objection.

## Reply quality, pricing, and buyer intent
- **Al Hussan, Saudi multi-campus AP:** strongest historical substantive enterprise buyer-led licensing and implementation due diligence. Buyer sought AP Calculus/Precalculus workflow, teacher private bank, implementation, technical requirements, onboarding/training, reporting/support, licensing and pilot evaluation. Non-binding planning references shared: SAR 7,750 small department; SAR 12,900 established department; SAR 23,200 school; network starting SAR 41,300 annually. No objection/discount request/competitor comparison appears in historical repository. The actual negotiated/outcome status cannot be verified from today's Gmail. Manual/owner-approval-only outbound restriction remains in the operational log.
- **AIA Doha, Qatar IB:** requested three school reviewer accounts (two teacher/reviewer, one least-privilege coordinator reviewer). Secure authenticated provisioning was blocked, no credentials fabricated. A request for reviewer access is **not** a demo completed, pilot activated, or annual sale. Treat IB AI SL Unit 1 as repository-validated, not production-smoke-accepted without operational test. No outbound to AIA until owner clears setup.
- **AIA Lusail / LSQ / UniHawk / ASD:** earlier documented review/meeting interest, but no evidence in accessible live systems today of meeting actually held, pilot deployed, formal proposal accepted or payment. Do not count historical seller-initiated QAR 2,500–4,000 teacher-only test messages as pricing acceptance; they were superseded by the canonical free standard pilot.
- **Price objections / discounts / competitor mentions:** none documented in reviewed historical evidence. Live current counts **unknown**, not zero.
- **Deal outcomes, deployment sizes, support burden:** no independently verified signed institutional terms, payments, actual activated cohort sizes, measured onboarding hours, support contacts, customization hours or implementation costs in today's accessible sources. Historical suggested pilot scope: 1–3 teachers, up to 40 students, one or two campuses for AP network proof. That is a *proposal envelope*, not actual usage.

## Highest-potential audience, message, offer — a directional hypothesis
1. **Audience:** named Heads of Mathematics / AP coordinators / IB coordinators / central academic decision-makers in high-fit multi-campus AP operators, then premium IB international schools, then tutoring networks where digital practice complements tutoring.
2. **Message:** institution-specific AP Calculus/AP Precalculus or repository-validated IB Math AI selected unit, one concrete teacher pain, mapped practice / question bank / assessment workflow *only after verifying production readiness*, transparent scope and measurable evaluation criteria. Avoid generic AI platform tours, unverified IB AA breadth, or unsupported claims.
3. **Offer:** short buyer-led demo or **standard free 14–30-day bounded pilot** with 1–3 teachers / <=40 students, no default SIS/LMS integration, followed by annual Department Pro / School / appropriately scoped Enterprise options. For a network use one-campus proof before expansion; for tutoring use one-centre proof.

Historical Al Hussan and AIA reviewer requests support this messaging **hypothesis**, not comparative message conversion proof. Sender reputation caution: September 1 audit noted ~36 sent messages over 24 hours and hard bounces; prefer fewer high-fit qualified prospects, deduplication, verified contact routes, suppression of opt-outs and closed threads. No autonomous outreach to designated protected accounts.

## Evidence needed for any repricing / scope decision
- Recover **read-only non-interactive authorized Gmail and live Stripe**, deduplicate by buyer organization/campus and follow *all* inbound threads including unlabelled replies; link to CRM opportunities.
- Build cohorts by first-touch date and country/segment, separating initial contact, automated response, human reply, qualified reply, meeting scheduled vs held, actual demo held, reviewer account provisioned, pilot **activated**, scoped proposal sent, buyer-responded annual price, invoice/payment, closed-won/lost.
- For each of roughly ten buyer-responded pricing conversations (historically around **one** clearly buyer-initiated licensing conversation; current number unknown), capture tier, currency, student/teacher/campus count, procurement authority, buyer response to annual price, competitors and exact quote, objection verbatim, proposed/agreed discounts, payment term, delivery costs, and next decision.
- Alternatively, capture three verified signed/paid institutional deals with scope and service economics, or a clearly corroborated market-wide material signal.
- Measure actual onboarding and support hours on the first three activated pilots before broadening base-tier scope.

## Final instruction for future revenue cycles
**Hold the annual QAR list and 80% floor.** Fix authenticated reviewer provisioning, CRM/label synchronization and QAR billing readiness. Prioritize high-quality AP/IB academic buyers and time-bounded workflow-first pilots. Never report non-observed CRM/Stripe activity as revenue, and never infer price resistance from silence. Re-review structurally only when the defined evidence threshold is met.
