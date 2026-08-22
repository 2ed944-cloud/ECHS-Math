# ECHS Payment, Onboarding & Renewal Engine

## Objective
Turn a commercially agreed opportunity into collected revenue, successful onboarding, renewal and expansion.

## Preconditions before payment
Do not create or send a payment link until the following are confirmed in writing:
- Customer/organization name.
- Billing contact.
- Product/license scope.
- Users/campuses/courses included.
- Price and currency.
- Billing period/term.
- Payment timing.
- Start date or activation condition.

## Stripe routing
When Stripe is connected and the commercial terms are agreed:
- One-time fees: prefer Stripe Checkout / payment link.
- Recurring licenses: prefer Stripe Billing + Checkout.
- Use dynamic payment methods; do not hard-code payment_method_types for online checkout.
- Do not enable automatic tax unless required registrations are confirmed.
- Keep payment descriptions consistent with the agreed proposal.
- Never expose API keys or secrets in messages, repositories or CRM notes.

## Payment-link workflow
1. Verify the agreed amount/currency/term from the prospect thread/proposal.
2. Use or create the correct Stripe product/price when available.
3. Create a checkout/payment link tied to that scope.
4. Send the buyer a short payment email with the agreed commercial summary.
5. Update CRM to PAYMENT SENT.
6. Track payment result.
7. On successful payment, move to CLOSED WON / ONBOARDING.

## Invoices/procurement
If the institution requires PO/invoice/vendor onboarding instead of card checkout:
- Ask for vendor-registration/invoice requirements.
- Record procurement contact and deadline.
- Provide the required commercial information through available tools.
- Do not mark CLOSED WON until purchase commitment is sufficiently documented according to the institution's process.

## Onboarding
For every closed customer:
- Confirm implementation owner.
- Confirm teacher/student/user scope.
- Confirm courses/features included.
- Confirm start date.
- Provide access/setup instructions.
- Schedule/check the first successful use milestone.
- Record issues and product gaps separately from sales notes.

## First-value milestone
Define a measurable first-value event, such as:
- first teacher login,
- first lesson/practice workflow used,
- first assignment/practice set completed,
- first department review,
- first successful pilot checkpoint.

The purpose is to reduce buyer regret and improve renewal probability.

## Renewal clock
For annual institutional licenses:
- Record contract/renewal date immediately.
- Start renewal health review 90 days before expiry.
- At 60 days: verify usage, satisfaction, outstanding issues and expansion potential.
- At 30 days: send renewal proposal / confirm procurement path.
- Avoid waiting until expiry.

## Expansion triggers
Look for expansion when:
- pilot succeeds,
- more teachers request access,
- another course/campus has the same need,
- school leadership asks for broader reporting/access,
- the customer requests additional content/workflows.

Expansion path:
Teacher -> Department -> School -> Multi-campus/Network.

## Churn-risk signals
- Low/no usage after onboarding.
- Repeated unresolved product issue.
- Key champion leaves.
- Budget freeze.
- Curriculum/program change.
- Competitor evaluation.
- Delayed renewal procurement.

When risk appears, address root cause rather than immediately discounting.

## Revenue reporting
Track verified values separately from pipeline estimates:
- Cash collected.
- MRR.
- ARR.
- Contracted annual value.
- Pipeline value.
- Weighted pipeline.
- Renewal value.
- Expansion value.
- Discounts/concessions.

## Final rule
A sale is not complete when the prospect says yes. The commercial system must carry the buyer through payment, successful first value, renewal and expansion.
