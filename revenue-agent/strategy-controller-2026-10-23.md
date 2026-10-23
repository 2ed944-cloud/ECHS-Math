# ECHS Revenue Strategy Controller — 2026-10-23

## Decision (no repricing)
**Hold provisional annual list prices, defined tier scope, annual-recurring licensing, 14–30-day standard free pilot, and 80% effective-annual-quote floor.** Do not infer willingness to pay or price resistance from silence. PRICING_ENGINE.md requires a structural review after ~10 qualified pricing conversations, 3 institutional closes, or a clearly material corroborated market signal; threshold is not established by accessible evidence.

## Source freshness (reviewed 2026-10-23)
- HubSpot live read: DEAL=0; QUOTE=0; SUBSCRIPTION=0; INVOICE=0; PRODUCT=0. Those are zero *records in this HubSpot account*, not verified zero revenue across all sales channels.
- Gmail live label and messages: inaccessible in the non-interactive run; connector requested user interaction. Therefore current replies, total reach, country/segment conversion, demo/pilot/proposal counts and price objections are **unverified**, not zero.
- Stripe live catalog and transactions: inaccessible in the non-interactive run; connector requested user interaction. Therefore current payments, ARR and subscriptions are **unverified**, not zero. Historical 2026-08-28 audit described no payments then only; do not carry that zero forward.
- GitHub branch echs-revenue-agent: before this review the most recent commit was 9b4e43639e9e9d4d3bd44e7c5c27585e95d1a39c on 2026-09-18. The last operational sales follow-up log predates it (2026-09-02). Repository is not a live email or payment ledger.

## Current internal baseline (unchanged)
Teacher QAR 900/year; Department Core 7,500/year (100 students / 5 teachers / primary pathway); Department Pro 12,500/year (250 students / 10 teachers / multiple supported paths); School 22,500/year (500 students / 25 teachers); Center 10,000/year (150 active students / 10 instructors); Enterprise starting reference QAR 40,000/year, scoped by campuses/users/programs/services. Standard qualified pilot: free, 14–30 days, up to 3 teachers and 40 students; extended material pilots separately scoped. Discounts per COMMERCIAL_AUTHORITY_MATRIX.md: generally 0–10%, 10–15% with consideration, 15–20% strategic only; do not breach 80% effective annual floor without explicit owner decision; do not stack discounts.

## Latest usable historical cohort (do not extrapolate)
The 2026-08-28 structured cohort covered 31 initial prospects: Qatar 6; UAE 11; Saudi Arabia 8; Kuwait 2; Bahrain 1; regional groups 3. It recorded 1 substantive reply (Al Hussan) and 1 auto-acknowledgement (ENS); later discussions and unlabelled buyer replies make this unsuitable as a complete current cohort. Network operators were ~12/31 (1 human positive reply) vs single schools ~19/31 (0 then); not statistically reliable. Do not calculate new 2026-10-23 country/segment conversion rates without deduplicated Gmail data.

## Buyer-quality examples from verified historical repository
- Al Hussan (Saudi, AP network): buyer-led enterprise product, implementation and pricing diligence. Annual planning guidance was approximately SAR 7,750 department small / SAR 12,900 department established / SAR 23,200 school / starting SAR 41,300 network. No verified competitor quote, price objection, discount request or outcome *in the historical repository*, not an assurance about live Gmail.
- AIA Doha (Qatar, IB): reviewer/demo evaluation requested three school accounts; secure account provisioning was the recorded block. Not a completed demonstration, launched pilot or buyer-confirmed annual license.
- UniHawk and LSQ appeared in prior controller reviews as meeting interest/acceptance, but cannot be restaged from accessible current Gmail and should not be called completed demos.
- TAISM (Oman): historical need/timing decline, not price objection.
No current deployment/implementation hours have been reliably measured. Requirements for integration, custom content, unusual reports and white label should remain separately quoted.

## Highest-performing *directional* audience, message, offer
1. Audience: named academic/curriculum leaders at multi-campus operators with verified AP Calculus/Precalculus fit; secondary: IB coordinators and Heads of Mathematics at premium IB schools; tutoring networks only when the teacher workflow complements existing lessons.
2. Message: one verified course/topic pain -> specific teacher-led practice/assessment/question-bank workflow -> measurable improvement, rather than a broad AI marketing tour. Do not claim unverified production features or whole-program coverage.
3. Offer: one short decision-maker meeting OR standard low-risk free 14–30-day, 1–3 teacher / <=40 student controlled proof with defined evaluation criteria and no default SIS/LMS/SSO integration; discuss Department Pro/School/Enterprise annual licensing only once scope and buyer authority are clear.
The historical cases identify a promising hypothesis, not a statistically proven conversion winner.

## Funnel instrumentation required for next actionable pricing review
Use one institution+campus-parent account identity; deduplicate outreach threads and connect all buyer replies independent of Gmail label. Record first-touch date, country, segment, verified course fit, buyer role/authority, message variant, offer variant, explicit reply type (automated/human/qualified/rejection), meeting scheduled vs **held**, demo held, pilot provisioning vs **activated**, target users, proposal sent vs accepted, pricing discussed by buyer, quote ID & tier/currency, price objections (verbatim), discount (requested/offered/agreed), competitor and competing quote, adoption/usage, actual onboarding and support hours, customization/integrations, win/loss date and reason, invoice and payment id, renewal/ARR. Denominators must use cohorts with sufficient elapsed observation time; report both absolute counts and rates; never equate 'not logged' with 'did not happen.'

## Go/no-go for future price change
Need ~10 real qualified conversations with buyer response to a scoped tier/price OR 3 independently verified closed institutional contracts OR a material corroborated signal; measure close/objection/discount by tier, real support cost, implementation burden and ARR. Until then: **no pricing, package or 80%-floor change.**

## Operational priorities
1. Restore noninteractive authorized Gmail/Stripe read access and reconcile the inbox to CRM.
2. Close the reviewer provisioning gap and document real meetings / pilots.
3. Capture quotes and buyer response in a real deal record, with proper source attribution.
4. Fix QAR Stripe payment-method/payment-link compatibility or use buyer-approved institutional invoice/bank-transfer; preserve commercial currency.
5. Resist generic bulk outreach; focus on qualified academic buyers, limited follow-ups, bounce/opt-out suppression.
