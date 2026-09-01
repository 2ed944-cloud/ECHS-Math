# ECHS Follow-Up / Deal Desk Cycle — 2026-09-01

## Outbound actions
Three first value-added follow-ups were sent after the 3-business-day gate and after thread verification showed no reply, bounce, opt-out, rejection, or later outbound message:

1. Hawar International School — Bahrain
   - Gmail message: `1a05cddae1678eb0`
   - Thread: `1a042f441dd56b27`
   - Current fit verified from Hawar/IB sources: active IB Diploma Programme; students registered in both Mathematics: Analysis & Approaches and Mathematics: Applications & Interpretation.
   - Offer: standard qualified ECHS pilot, free 14-30 days, up to 3 teachers / 40 students, limited to verified-ready Math AI content.

2. Beta Cambridge School — Qatar
   - Gmail message: `1a05cddcbd3616fc`
   - Thread: `1a042f42ee126727`
   - Current fit verified from the IB registry: students registered in Mathematics: Applications & Interpretation.
   - Offer: standard qualified ECHS pilot, free 14-30 days, up to 3 teachers / 40 students, focused on one Math AI strand.

3. Success International School — Riyadh
   - Gmail message: `1a05cdde7b453d39`
   - Thread: `1a042f41d1e56404`
   - Current fit verified from the school's current public site: American pathway includes AP Calculus; school continues to operate Grade 12 and is expanding secondary provision.
   - Offer: standard qualified ECHS pilot, free 14-30 days, up to 3 teachers / 40 students, focused on one AP Calculus topic/unit.

All three sent messages were labeled `ECHS Revenue Outreach`.

## Active opportunity — Arab International Academy (AIA Lusail)
AIA's IB Diploma/CP Coordinator requested platform and pilot details on 2026-08-31 and stated the information would be shared with the Head of Mathematics. The reply sent on 2026-08-31 correctly narrowed product claims to verified-ready IB Math AI content, but incorrectly described the standard pilot as “paid.” No further outbound message was sent today because the last outbound is inside the 3-business-day gate.

Two unsent AIA drafts were removed because they compounded that pricing error, including one that invented a QAR 4,500-7,500 14-day pilot range. At the next permitted outbound point, or immediately if AIA re-engages, correct the commercial structure: the standard qualified 14-30 day pilot is free for up to 3 teachers and 40 students. A paid pilot is only for materially larger/longer scope under `PRICING_ENGINE.md`.

## Draft cleanup / commercial hygiene
Deleted unsent ECHS drafts that conflicted with the pricing engine:
- AIA superseded draft `1a05b63141f0a601`
- AIA QAR 4,500-7,500 pilot draft `1a05b635ad153c4c`
- Britus Bahrain draft `1a05cb5240053ef1` (invented BHD 350-550 bounded evaluation fee)
- GEMS World Academy Dubai draft `1a05c151fae1e8a8` (continued an ad-hoc paid short-evaluation structure)

Detected several ECHS outbound messages sent earlier on 2026-09-01 by another revenue workflow using “smaller paid first step” language, including Al Raja School, GEMS World Academy Dubai, GAAQ, American School of Doha reception route, and Inspire International Academy. Those messages were added to the `ECHS Revenue Outreach` label so their cooldown and any future correction are tracked. No additional outbound message was sent to those organizations in this cycle.

## Playbook hardening
Updated `revenue-agent/AUTONOMOUS_REVENUE_EXECUTIVE.md` to add a non-optional pilot-pricing guardrail:
- Standard qualified pilot = free, 14-30 days, up to 3 teachers / 40 students.
- A smaller/shorter/teacher-only standard evaluation must not be converted into an ad-hoc paid pilot.
- Paid pilot only for materially larger or longer requests, using the `PRICING_ENGINE.md` extended-pilot reference unless owner-approved otherwise.

Commit: `c26e8133a7d33bb1d0022c9b926ba837c1344942`.

## Exceptions honored
- Qatar Foundation / QAD / all verified QF-controlled routes: no outbound action. Search confirmed no outbound to `qf.org.qa` today.
- Al Hussan Education & Training Group: no outbound action, no draft, no meeting, no proposal. Latest inbound from Dr. Emad remains the 2026-08-24 reply; owner manual-approval rule remains in force.

## CRM / deal desk
HubSpot read access is available but the portal is not onboarded. Search for deals matching `ECHS` returned 0 records. No CRM write was attempted because the HubSpot connector requires explicit interactive confirmation for writes and this run is non-interactive.

No non-exempt opportunity currently has an agreed meeting time requiring Calendar/Meet creation. No opportunity has written agreement on scope + amount + currency + term + billing party, so no Stripe/payment step was created.

## Next actions
- AIA: wait through the current outbound cooldown unless they reply; when allowed, correct the standard-pilot price to free and move toward a 15-minute demo / defined pilot.
- Hawar, Beta Cambridge, Success International: wait for reply; next cold step, if any, is later close-the-loop only.
- Any organization that received a paid-short-pilot message today: do not contact again until the 3-business-day gate; if still active then, reconcile to the pricing engine before discussing a pilot fee.
