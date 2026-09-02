# ECHS Demo Engine

## Objective
Turn prospect interest into a concrete evaluation of ECHS against the institution's real mathematics workflow.

## Demo trigger
Start a demo flow when a qualified prospect:
- asks to see the platform,
- asks how it works,
- asks whether it supports their AP/IB program,
- asks for a trial,
- or shows enough buying intent that a visual walkthrough would reduce uncertainty.

## Step 1 — Build the Demo Brief
Before creating or scheduling a demo, collect or infer from verified public/prospect information:
- Institution and country.
- Curriculum: AP Calculus AB/BC, AP Precalculus, IB Math AA/AI, or other verified fit.
- Role of attendee.
- Likely pain: lesson preparation, practice, question bank, assignment workflow, student practice, assessment, consistency, teacher time, exam readiness.
- Estimated users.
- Existing solution if known.
- Desired next decision.

## Step 2 — Select only relevant ECHS flows
Verify each selected capability against the repository/current product before showing it.

Possible flows include, when verified:
- Interactive lesson content.
- Mapped practice.
- Question-bank workflow.
- Teacher interface.
- Student workflow/cloud flow.
- Teacher cloud/workflow.
- AP Calculus content.
- AP Precalculus content.
- IB Mathematics content when production-ready for that requested use.
- Assessment/practice routing.

Do not show irrelevant features simply to make the demo longer.

## Prospect-requested demo accounts
When a qualified institution asks for temporary reviewer/demo accounts:
- Treat the request as a positive buying signal and move it into an active demo evaluation rather than continuing generic follow-up.
- Verify that secure account provisioning is actually available before promising credentials or a delivery date. Never invent usernames/passwords, expose secrets, or use placeholder credentials that are not backed by the authenticated account service.
- Current institutional roles are `admin`, `teacher`, `student`, and `parent`. There is no separate `coordinator` role. A coordinator who only needs to review the product should normally receive non-privileged teacher/reviewer access rather than administrator rights.
- Keep the first review time-limited and least-privilege. Prefer synthetic/demo learner data and no SIS/LMS/SSO connection unless a later approved pilot requires it.
- Show only repository-verified content/capabilities. If an operational production smoke test remains outstanding, describe the capability as repository-validated rather than claiming exhaustive production acceptance.
- The structured demo/reviewer access is not an excuse to invent a fee. The standard qualified pilot in `PRICING_ENGINE.md` remains free for 14-30 days, up to 3 teachers and 40 students. A paid pilot is only for materially larger/longer scope under the pricing engine.
- If provisioning is blocked because no authenticated platform-admin session or provisioning capability is available, do not fabricate access. Record the blocker and surface it for secure owner/admin action.

## Async Demo Mode
Preferred for cold/warm institutional sales when a live meeting is not yet necessary.

Target duration: 4-7 minutes.

Structure:
1. 15-25 sec: acknowledge their program and problem.
2. 45-60 sec: show the ECHS learning environment.
3. 60-90 sec: show the relevant course/content.
4. 60-90 sec: show practice/question-bank/teacher workflow relevant to the buyer.
5. 30-60 sec: show how a pilot would work for their teachers/students.
6. 15-30 sec: single CTA — short call or pilot.

If video-generation/recording tools are available, create a polished prospect-specific walkthrough. If no reliable screen-recording tool is available, provide a concise guided demo using verified links/screenshots/content and offer a live Google Meet.

## Live Demo Mode
When the prospect agrees to a meeting:
1. Use Calendar availability to identify suitable times.
2. Confirm a time with the prospect.
3. Create a Google Calendar event with Google Meet and attendee email.
4. Include a concise agenda in the event description.
5. Prepare the Demo Brief and talking points before the meeting.

Current limitation: unless a connected meeting-bot capability is available, the agent cannot independently enter Google Meet as a human participant and speak/share screen in real time. In that case, the agent should prepare the full demo package, agenda, scripts, objections and follow-up for the owner, or use asynchronous demo mode.

## Demo agenda template
- 2 min — goals and current workflow.
- 5 min — relevant ECHS workflow.
- 3 min — practice/assessment/teacher use case.
- 2 min — pilot structure and success criteria.
- 3 min — questions and next step.

## Demo discovery questions
Use only the questions needed for the next decision, such as:
- How are your AP/IB mathematics teachers currently sourcing and organizing practice?
- Is the bigger pain content quality, teacher preparation time, student practice, or assessment workflow?
- Roughly how many teachers/students would be involved in an initial rollout?
- Do you want to evaluate with one class first or across the department?

## Demo success criteria
Before a pilot, agree on 2-4 observable criteria, for example:
- Teachers can locate and assign suitable practice efficiently.
- Students can access and complete the target workflow.
- Content matches the intended AP/IB course level.
- Department leadership sees enough value to justify annual adoption.

## Post-demo action
Within the same business day when practical:
- Send a short recap.
- Confirm agreed pain/fit.
- State the proposed pilot or commercial next step.
- Include exactly one decision/CTA.
- Update CRM stage to DEMO COMPLETED or PILOT PROPOSED.

## Rule
A demo is a decision tool, not a product tour. Every screen shown should help the buyer decide whether ECHS solves a current problem.
