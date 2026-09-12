# Launch pricing recommendation — NOT ACTIVE

Status: **recommendation only**. `pricing.json` remains `configured:false`. The AI sales closer must not quote these prices until the operator explicitly approves them and activates the commercial schedule.

Reviewed: 2026-08-22.

## Market anchors

Public school-pricing benchmarks vary widely because the products and scopes are not identical:

- **DeltaMath** national 2026 list pricing: school PLUS up to 750 students at USD 900/year; INTEGRAL up to 750 at USD 1,800/year. Higher tiers add admin/reporting/integration features.
- **Albert** school/district pricing: USD 18/student/year; district pricing USD 15/student/year at 1,000+ students. School plans include adaptive practice, premium question banks, reporting, license/staff management and integrations. Albert also offers discounted school trials credited toward standard licensing.
- **IXL** classroom pricing is materially lower for a single classroom and moves larger schools to quote-based licensing.

These are directional anchors, not direct comparables. ECHS currently differentiates around advanced mathematics pathways, interactive lesson content, focused/adaptive practice, mastery/recovery, teacher/student/family/admin views and a school-managed environment, but it does not yet have the market maturity, procurement history, integration catalog or compliance collateral of large incumbents.

## Recommended launch structure

### PILOT — School Pilot

Recommended list price: **QAR 2,750**

- 90 days
- up to 100 students
- up to 8 teachers
- synthetic-demo onboarding plus school deployment setup after privacy/security readiness
- selected mathematics courses only
- 1 remote onboarding session
- full pilot fee credited against an annual school license if the annual order is executed within the approved conversion window

Recommended autonomous floor: **QAR 2,500**

Do not make the pilot free by default. A paid pilot qualifies intent and creates a clean procurement path while remaining small enough for departmental budget approval in many schools.

### SCHOOL-ANNUAL — Annual School License

Recommended list price: **QAR 7,500/year**

- 12 months
- up to 250 students
- up to 12 teachers
- available approved mathematics course catalog
- teacher/student/family/admin experience
- assignments, focused/adaptive practice, mastery/review and assessment tools
- remote onboarding
- standard support

Recommended autonomous floor: **QAR 6,500/year**

### SCHOOL-PLUS — Larger School License

Recommended list price: **QAR 12,500/year**

- 12 months
- up to 750 students
- school-wide mathematics teachers within the approved scope
- same approved platform capabilities as SCHOOL-ANNUAL
- priority onboarding and implementation planning

Recommended autonomous floor: **QAR 10,500/year**

## Negotiation authority recommendation

Suggested default autonomous discount authority: **10% maximum**, and only in exchange for an approved concession such as:

- annual prepayment;
- narrower scope;
- signed annual commitment;
- approved multi-school volume.

The absolute floor always wins over percentage discount authority. The agent may never invent a custom price below floor.

## Enterprise / district deals

Do not auto-price multi-school, district-wide, custom integration, custom hosting, large data-migration or non-standard legal/security deals. These should be marked `ENTERPRISE_REVIEW` until a repeatable SKU exists.

## Positioning rule

Do not sell on “cheapest platform.” Sell on measurable workflow value:

1. one learning route from lesson -> practice -> review -> mastery;
2. teacher visibility and intervention signals;
3. advanced mathematics/AP/IB-oriented depth where verified;
4. reduced fragmentation between content, assignments, assessment and family progress;
5. school-managed user experience.

Never claim cost savings, exam-score gains or teacher-time reductions without evidence from a verified deployment.

## Activation checklist

Before copying these values into `pricing.json` and setting `configured:true`, verify:

- legal seller name;
- commercial product name;
- Qatar commercial activity/license suitability;
- customer-visible Arabic/English invoice process;
- refund/cancellation terms;
- included course rights and commercial claims;
- pilot conversion window;
- payment terms;
- Stripe product/price mapping.
