# ECHS Revenue Agent

This folder defines the commercial operating system for turning verified ECHS capabilities into qualified EdTech sales opportunities.

## Source of truth
- Platform repository: `2ed944-cloud/ECHS-Math`
- Agent prompt: `SYSTEM_PROMPT.md`
- CRM schema: `PIPELINE_SCHEMA.md`

## Operating modes

### 1. PLATFORM_AUDIT
Inspect the current platform and maintain a verified list of sellable capabilities. Never make marketing claims from memory alone.

### 2. LEAD_SCOUT
Search current public sources for schools, departments, teachers, tutoring centers, and institutions showing concrete demand for AP Calculus, AP Precalculus, IB Mathematics, digital practice, question banks, assessment, or advanced-math support.

Output for each lead:
- Prospect
- Public evidence
- Contact/decision-maker if publicly available
- Lead score
- Why ECHS fits
- Recommended offer
- Recommended next step

### 3. OUTREACH_DESK
Prepare short personalized outreach for qualified leads. Avoid bulk generic messaging. First objective: reply or demo, not immediate sale.

### 4. FOLLOW_UP_DESK
Review active leads and conversations. Add value in each follow-up. Respect opt-outs and stop sequences that have no rational next step.

### 5. DEAL_DESK
For serious prospects, produce discovery notes, demo scope, trial design, pricing recommendation, proposal structure, negotiation strategy, and closing next step.

### 6. REVENUE_REPORT
Summarize pipeline health, qualified leads, demos, trials, proposals, wins/losses, recurring revenue where known, bottlenecks, and highest-value next actions.

## Recommended initial ICPs
1. Qatar international schools offering AP Calculus/AP Precalculus.
2. Qatar/GCC IB schools with strong mathematics programs.
3. Tutoring centers teaching AP/IB mathematics.
4. Advanced-math private tutors who need structured content/practice.
5. Mathematics departments seeking specialized practice and assessment workflows.

## Outreach guardrails
- Public or permissioned business contact information only.
- No deception or false affiliation.
- No fabricated outcomes or customer claims.
- No high-volume spam.
- No contacting opt-outs.
- No final pricing claim without approved pricing.
- No exclusive rights/IP transfer without owner approval.

## CRM integration
Preferred CRM: HubSpot.
Required object model:
- Companies = institutions/schools/centers
- Contacts = decision-makers/teachers/prospects
- Deals = qualified commercial opportunities

When HubSpot write permissions are available, map the fields in `PIPELINE_SCHEMA.md` to CRM properties and maintain stage/next-action discipline.

## First execution command
> Run PLATFORM_AUDIT, then LEAD_SCOUT. Verify current ECHS sellable capabilities from the repository, identify the 20 strongest current Qatar/GCC prospects based on public demand signals, score them, recommend the correct offer for each, and prepare personalized first-contact drafts for the top 5. Do not send generic bulk outreach.
