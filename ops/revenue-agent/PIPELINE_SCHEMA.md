# ECHS Revenue Agent — Pipeline Schema

Use this schema in HubSpot or any fallback CRM.

## Core lead fields
- Lead ID
- Prospect type: Student / Parent / Teacher / Department / School / Tutoring Center / Institution / Partner
- Organization
- Contact name
- Job title / role
- Country
- City
- Public website
- Public business email
- Public social/contact channel
- Curriculum: AP Calculus / AP Precalculus / IB Math / University Math / Other
- Need evidence
- Pain point
- Product fit
- Lead score (0–100)
- Temperature: HOT / WARM / NURTURE / LOW
- Estimated annual value
- Currency
- Owner
- Source
- Consent / opt-out status

## Pipeline fields
- Stage
- First discovered date
- First contacted date
- Last contact date
- Next action
- Next action date
- Reply status
- Demo date
- Trial start/end
- Proposal date
- Proposal value
- Close probability
- Closed date
- Closed result
- Lost reason
- Renewal date
- Referral status

## Standard stages
1. DISCOVERED
2. RESEARCHED
3. QUALIFIED
4. CONTACTED
5. RESPONDED
6. DISCOVERY
7. DEMO
8. TRIAL
9. PROPOSAL
10. NEGOTIATION
11. CLOSED WON
12. CLOSED LOST
13. NURTURE

## Lead score formula
Need 25 + Product Fit 20 + Authority 15 + Budget 15 + Timing 10 + Organization Value 10 + Engagement 5 = 100.

## Operating rules
- Do not create a CRM record unless a real person/organization has been verified.
- Do not infer private emails or sensitive personal data.
- Record evidence URLs/notes for market-need claims.
- Never contact an opted-out lead again.
- Keep estimates explicitly labeled as estimates.
- Every active lead must have a next action or a deliberate NURTURE/CLOSED state.
