# ECHS Follow-Up + Deal Desk — 2026-09-02

## Outcome

The strongest active opportunity is **Arab International Academy (AIA) Doha**. The MYP Mathematics Coordinator asked for three demo accounts, then supplied three verified AIA school addresses and confirmed the preferred review structure: two teacher/reviewer accounts plus one coordinator reviewer.

### AIA Doha action

- Replied in-thread and confirmed receipt of the three school addresses.
- Corrected the commercial structure explicitly: structured reviewer access and the standard qualified ECHS pilot are **no-charge** within the standard envelope of 14–30 days, up to 3 teachers and 40 students.
- Confirmed least-privilege evaluation boundaries: synthetic/demo learner data, no SIS/LMS/SSO connection, and no privileged administrator rights for the coordinator reviewer.
- Sent message ID: `1a0621402b372f8e`.
- Current stage: **ACTIVE DEMO EVALUATION / PROVISIONING REQUESTED**.

### AIA operational blocker

The current production account service supports `admin`, `teacher`, `student`, and `parent` roles; there is no distinct coordinator role. Teacher/reviewer accounts must be provisioned through an authenticated platform administrator session. The current revenue automation does not have a secure authenticated platform-admin provisioning capability, so no placeholder or fabricated credentials were issued. The coordinator should be represented as a non-privileged teacher/reviewer unless an administrator role is explicitly required later.

The strongest repository-validated IB content available for a safe first review is **IB Mathematics: Applications & Interpretation SL Unit 1**, merged into `main` and repository-validated. Final Unit 1 totals are 488 Learn slides, 416 Practice Studio questions, 112 timed-quiz questions, and 24 extended IB-style tasks. The remaining release note still calls for signed-in production smoke testing across roles/devices, so external claims should remain `repository-validated`, not `fully production-accepted`.

## Follow-ups sent

### First value-added follow-ups

1. **Abdul Rahman Kanoo International School (ARKIS), Bahrain**
   - Current official site confirms 2026–27 admissions, more than 2,200 students, and an IB Diploma Programme in Grades 11–12.
   - Follow-up offered the standard no-charge 14–30 day pilot only if Math AI is part of the current DP Mathematics provision.
   - Message ID: `1a062144bc4bc02c`.

2. **The Hamilton International School, Doha**
   - Current official site confirms an active IB Diploma Programme alongside the American High School Diploma pathway in Grades 11–12.
   - Follow-up offered the standard no-charge 14–30 day pilot only if Math AI is in the current DP Mathematics subject mix.
   - Message ID: `1a062146701345e1`.

### Final close-the-loop messages

3. **SEK International School Qatar / SEK Education Group**
   - Final close-the-loop sent after the prior value-added follow-up and the required cooldown.
   - Restated the no-charge 14–30 day, 1–3 teacher, up-to-40-student Mathematics AI SL evaluation at one selected school.
   - Explicitly stated outreach will stop unless they re-engage.
   - Message ID: `1a062149d786dc86`.
   - Status: **STOP COLD OUTREACH unless prospect re-engages**.

4. **Doha British School**
   - Final close-the-loop sent after the prior value-added follow-up and the required cooldown.
   - Restated a one-Sixth-Form-team no-charge Mathematics AI SL evaluation and expansion only if evidence supports it.
   - Explicitly stated outreach will stop unless they re-engage.
   - Message ID: `1a06214ba844a5a5`.
   - Status: **STOP COLD OUTREACH unless prospect re-engages**.

## Draft hygiene / commercial correction

Deleted **11 unsafe or superseded ECHS drafts** that could have reintroduced ad-hoc paid first steps, unsupported lesson claims, or superseded ASD content. This included drafts for AIA Doha, AIA Lusail, Bloom World Academy, AAG, 800 SAT, KiS Riyadh, JKS and superseded ASD variants.

Important: already-sent rogue messages from other workflows that proposed small paid teacher-only evaluations remain sent and cannot be recalled. They must respect the normal 3-business-day cooldown; do not send immediate correction messages unless the prospect replies. Future contact must restore the standard free-pilot structure.

## Demo-engine hardening

Updated `revenue-agent/DEMO_ENGINE.md` to add explicit demo-account guardrails:
- verify secure provisioning capability before promising credentials or a delivery date;
- never invent usernames/passwords or expose secrets;
- coordinator reviewers should normally use least-privilege teacher/reviewer access because there is no coordinator backend role;
- use synthetic/demo data and avoid SIS/LMS/SSO for the first review;
- describe repository-validated capabilities accurately when production smoke acceptance remains outstanding;
- do not convert reviewer access or a standard qualified pilot into an ad-hoc paid pilot;
- if authenticated platform-admin provisioning is unavailable, record the blocker rather than fabricating access.

Commit: `402df34d174f060afb8de39f10ed54e4f3058fed`.

## Exceptions honored

### Qatar Foundation / QAD
- No outbound communication was sent to `qf.org.qa` or another Qatar Foundation route in this cycle.
- No reply, demo invitation, calendar event, proposal or payment action was taken.

### Al Hussan Education & Training Group
- No follow-up, close-the-loop, draft, meeting invitation, proposal or other outbound communication was created or sent.
- The latest inbound located remains Dr. Emad Odd-Tallah's 24 August message.
- Status remains **OWNER MANUAL APPROVAL / WAIT FOR DR. EMAD**.

## CRM / Deal Desk

- HubSpot search for `ECHS` deals returned **0 deals**.
- HubSpot portal is available for reads, but no CRM write was made during this non-interactive run.
- No prospect has agreed a meeting time in the reviewed threads; no Calendar/Meet action was required.
- No non-excluded prospect has agreed scope + amount + currency + term + billing party; no Stripe/payment step was created.

## Next commercial priority

**AIA Doha is the priority deal.** The next operational requirement is secure provisioning of the three requested reviewer accounts through an authenticated platform administrator workflow. Do not send placeholder credentials. Once access is genuinely provisioned, the evaluation should stay narrow, least-privilege, no-charge, and centered on repository-validated IB Mathematics AI SL content before any broader pilot or annual licensing discussion.
