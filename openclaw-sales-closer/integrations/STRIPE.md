# Stripe quote-to-cash design

Status: architecture prepared; do not create live prices or payment links until `workspace/commercial/pricing.json` is approved and `configured:true`.

## Approved integration shape

### Standard pilot / simple one-time sale

```text
approved SKU
  -> Stripe-hosted Checkout / Payment Link
  -> buyer pays on Stripe
  -> verified payment event
  -> CRM deal CLOSED_WON
  -> onboarding handoff
```

The AI agent sends only Stripe-hosted URLs. It never handles raw card data.

### Annual B2B school license

Preferred sales-led flow:

```text
qualified school
  -> approved deal/SKU in CRM
  -> Stripe Quote or invoice flow
  -> buyer approval / PO as applicable
  -> Hosted Invoice Page or approved bank-payment path
  -> invoice.paid
  -> CLOSED_WON
```

For smaller buyers that prefer card payment and do not require procurement terms, Stripe-hosted Checkout can also be used for the approved annual SKU.

## Stripe objects

Create one Stripe Product per approved commercial SKU, with immutable internal mapping from `pricing.json`:

- `PILOT`
- `SCHOOL-ANNUAL`
- `SCHOOL-PLUS` (only after operator approval)

Create prices only from the approved active table. The agent may select among existing approved Price IDs; it must not create a new amount from conversation context.

Recommended metadata on Checkout/Invoice/Quote objects:

- `crm_deal_id`
- `school_name`
- `commercial_sku`
- `quoted_amount_qar`
- `consent_source`
- `sales_agent=echs-sales-closer`
- `purchase_order_reference` when supplied

Do not place student names, student identifiers or sensitive educational data in Stripe metadata.

## Events that update sales state

At minimum handle:

- `checkout.session.completed`
- `invoice.paid`
- `invoice.payment_failed`
- `charge.refunded`
- `credit_note.created`

`invoice.paid` is the canonical success event for invoice-based sales. Do not mark an invoice deal CLOSED_WON merely because an invoice was created or sent.

## Idempotency

All programmatic create operations must use an idempotency key derived from the immutable CRM deal/action identifier so retries cannot create duplicate commercial documents.

## Security

- use a dedicated Stripe integration credential with the minimum permissions needed;
- prefer a restricted key for server/API work where supported;
- keep all Stripe secrets in the VPS secret/environment store;
- verify webhook signatures;
- never expose secret keys to OpenClaw conversation memory;
- use Stripe-hosted payment surfaces instead of handling PAN/CVC data.

## Enterprise procurement

For schools requiring a purchase order, net payment terms, wire/bank transfer, vendor forms or non-standard contract terms, retain the deal in `PAYMENT_PENDING` / `ENTERPRISE_REVIEW` until the required procurement artifact is verified.

## Qatar-facing invoices

The customer-visible invoicing process must meet the approved Qatar commercial/invoice requirements, including the Arabic invoice requirement documented in `workspace/policy/COMPLIANCE.md`. Stripe metadata alone does not satisfy customer-visible invoice obligations.

## Agent authority

The sales agent may:

- select an approved SKU;
- apply a permitted discount without crossing its floor;
- request/generate the approved hosted payment route;
- send the hosted URL;
- follow payment status;
- start onboarding after verified paid/approved-PO state.

The sales agent may not:

- invent a new SKU;
- set an arbitrary amount;
- create a discount below floor;
- mark a failed/unpaid transaction as won;
- issue a refund outside the approved refund policy;
- change legal/payment terms because a buyer asks during a call.
