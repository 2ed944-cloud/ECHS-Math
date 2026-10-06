# Sales claims register

The agent may state only claims in the `VERIFIED` table without additional approval.

## VERIFIED — repository-backed

| Claim | Allowed wording |
|---|---|
| Role-based experiences | “The current implementation has distinct student, teacher, family and administrator experiences.” |
| Interactive learning path | “Lessons, practice, review and mastery are designed as one connected pathway.” |
| Focused/adaptive practice | “Practice supports focused routes and an adaptive mode in the current implementation.” |
| Mistake recovery | “The current student workflow includes review and mistake recovery.” |
| Mastery evidence | “The current implementation surfaces mastery evidence to students and teachers.” |
| Assignments | “Teacher and student experiences include assignments.” |
| Test generator | “The current implementation includes a timed test generator with configurable question scope/count/time.” |
| Family view | “The current implementation includes a family progress experience.” |
| School-managed accounts | “The current implementation includes school-managed role accounts and no public registration on the landing flow.” |
| Bulk import UI | “The administrator experience includes CSV account import.” |
| Backend role checks/auditing | “Repository backend code includes role checks and account-operation audit logging.” |

## CONDITIONAL — use qualifier

### Security
Allowed:
“The current implementation includes role checks, hashed session-token handling, audit logging and server-side account operations. Formal security/compliance certification should be reviewed against your requirements.”

Not allowed:
“100% secure”, “unhackable”, “ISO 27001”, “GDPR compliant”, “Qatar-compliant” unless a verified assessment is added.

### Curriculum alignment
Allowed:
“The reference implementation currently presents AP Calculus, AP Precalculus, Algebra 2 Concepts and IB Mathematics pathways. We should confirm your exact syllabus and depth during scoping.”

Do not claim formal authorization/endorsement.

### Official AP content
The repository contains areas labelled for Official AP workflows. This is a restricted-claim topic.
Do not offer, license, transfer or promise protected third-party content unless the seller adds a written rights record to this workspace.

## UNVERIFIED / prohibited until evidence is added

- College Board endorsement, partnership or license.
- IB endorsement, partnership or license.
- Education City High School / Qatar Foundation endorsement of third-party commercialization.
- Customer count.
- score-improvement percentages;
- teacher-hours saved;
- uptime/SLA;
- penetration testing;
- ISO/SOC certification;
- government approval;
- SSO integrations not evidenced/configured;
- integrations with ManageBac, Google Classroom, Canvas, Moodle, PowerSchool, etc.;
- native mobile apps;
- AI tutoring functions not evidenced in the sales build;
- 24/7 human support;
- specific hosting/data residency promises.

## Claim resolution procedure

When asked an unverified question:
1. acknowledge the requirement;
2. state only what is known;
3. capture the requirement in the deal;
4. do not fabricate;
5. if it is material to the purchase, mark `TECHNICAL_OR_LEGAL_VERIFICATION_REQUIRED`.
