# ECHS Stripe Catalog

Status: live Stripe products created for internal sales execution. Prices are provisional internal list prices and should only be sent after commercial scope is agreed.

## Live products

- ECHS Teacher Annual
  - Product: prod_V7RFt9uawHySR5
  - Price: price_1U7CMfGbxoraGGSse3vmXPcR
  - QAR 900 / year

- ECHS Department Core Annual
  - Product: prod_V7RGPBGf874jQO
  - Price: price_1U7CNyGbxoraGGSsHRbeJrGm
  - QAR 7,500 / year

- ECHS Department Pro Annual
  - Product: prod_V7RGX2Km41OjIN
  - Price: price_1U7CO7GbxoraGGSsA6gX7sWx
  - QAR 12,500 / year

- ECHS School Advanced Mathematics Annual
  - Product: prod_V7RGTfjbk7PpK6
  - Price: price_1U7COHGbxoraGGSs4Tb0cp5g
  - QAR 22,500 / year

- ECHS Tutoring Center Annual
  - Product: prod_V7RGv6tLEYHG90
  - Price: price_1U7CONGbxoraGGSs9kNxejSA
  - QAR 10,000 / year

- ECHS Multi-Campus Enterprise Annual
  - Product: prod_V7RHBchZfUv0fB
  - Price: price_1U7COWGbxoraGGSs2eS7sT5r
  - Starting reference QAR 40,000 / year
  - Do not use as a self-serve checkout without scoping the enterprise deal.

## Payment-link status
Stripe currently rejects QAR subscription Payment Links because no compatible payment method is activated for the selected currency/account configuration.

### Agent fallback
Until a QAR-compatible payment method is active:
1. Do not tell prospects that checkout is ready.
2. Continue through proposal and written commercial agreement.
3. Use institutional procurement/invoice/bank-transfer workflow when available, or create Stripe Checkout only after a compatible payment method/currency is confirmed.
4. Preserve the agreed price/currency in the deal record.
5. Do not silently convert the buyer to another currency without agreement.

## Security
Product and price IDs are operational identifiers, not secrets. Never store Stripe API keys, secrets, tokens or card data in GitHub, Gmail or CRM notes.
