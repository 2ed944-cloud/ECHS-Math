# Curriculum foundation source review

Verified on **2026-09-08** by **Codex, official-source review**. This is a research record for ECHS-001–006, not a claim of human curriculum approval. The supplied AGENTS.md, curriculum-versioning document, and three course specifications were read first; the facts below were then independently checked on College Board and IB sources. No curriculum runtime files were changed.

## Version records

The IDs and active/future assignments below follow the supplied ECHS policy; they are internal identifiers, not publisher identifiers.

| Proposed curriculum-version ID | ECHS status | Verified edition / first assessment of this version |
|---|---|---|
| `ap-calculus-ab-2026-27` | active | Shared AB/BC CED, cover effective Fall 2020, with Fall 2026 clarification document; assessment format effective May 2027 |
| `ap-calculus-bc-2026-27` | active | Same source edition and amendment, separate BC scope; assessment format effective May 2027 |
| `ap-precalculus-2026-27` | active | CED effective Fall 2026 plus Fall 2026 clarification/correction document; assessment format effective May 2027 |
| `ib-ai-sl-first-assessment-2021` | active | Existing AI guide, teaching from August 2019, first assessment May 2021 |
| `ib-ai-sl-first-assessment-2029` | future placeholder | Revised AI brief, first teaching August 2027 and first assessment May 2029; no current-cohort activation |

For the AP rows, “first assessment” means the first examination of the **2026–27 version/profile**, not the historical first examination of the AP subject. Preserve the publisher's base-edition label separately. For all rows, no definitive final assessment date was verified: keep `last_assessment` and `effective_to` null. Month/academic-year evidence should not become a fabricated exact daily date.

## AP Calculus AB and BC

The official [AB exam page](https://apcentral.collegeboard.org/courses/ap-calculus-ab/exam) and [BC exam page](https://apcentral.collegeboard.org/courses/ap-calculus-bc/exam) were checked separately. Both explicitly identify unchanged course content for 2026–27 and revised MC counts/timing beginning May 2027. Use separate AB and BC profile IDs with the following verified structure:

| Component | Items | Minutes | Calculator | Exam weight |
|---|---:|---:|---|---:|
| MC section | 42 | 100 | split below | 50% |
| MC A | 29 | 62 | prohibited | not separately stated |
| MC B | 13 | 38 | graphing calculator required | not separately stated |
| FRQ section | 6 | 90 | split below | 50% |
| FRQ A | 2 | 30 | graphing calculator required | not separately stated |
| FRQ B | 4 | 60 | prohibited | not separately stated |

Both use hybrid digital delivery: Bluebook MC responses and displayed FRQ prompts, with FRQ responses handwritten in paper booklets. The currently listed regular examination date is May 10, 2027; that date is a scheduled administration, not a universal daily effective-from boundary for all administrations. Questions use symbolic, graphical, tabular, and verbal information, with contextual reasoning among the FRQs.

The [shared CED](https://apcentral.collegeboard.org/media/pdf/ap-calculus-ab-and-bc-course-and-exam-description.pdf) retains its Fall 2020 title while current preliminary matter is dated 2026. Its scope explicitly marks BC-only material within shared units: 6.11–6.13, 7.5, 7.9, and 8.13, plus all of Units 9–10. These are topic exclusions for AB, not a complete objective-level import rule; preserve individual AB/BC applicability during later objective mapping.

The [Fall 2026 amendment](https://apcentral.collegeboard.org/media/pdf/ap-calculus-ab-bc-course-and-exam-description-clarifications.pdf), pp. 1–2, also clarifies FUN-1.C.1 (closed-interval extreme-value guarantee) and FUN-7.B.2 (a differential equation may have infinitely many solutions). It confirms the MC timing/count changes and updates resource/technology wording. Retain both sources in the version evidence; a single “2026 CED” label loses the amendment relationship.

Current unit MC percentage ranges, independently checked on the [AB course page](https://apcentral.collegeboard.org/courses/ap-calculus-ab) and [BC course page](https://apcentral.collegeboard.org/courses/ap-calculus-bc):

| Unit | AB | BC |
|---|---|---|
| 1 | 10–15 | 5–10 |
| 2 | 10–15 | 5–10 |
| 3 | 5–10 | 5–10 |
| 4 | 10–15 | 5–10 |
| 5 | 15–20 | 10–15 |
| 6 | 15–20 | 15–20 |
| 7 | 5–10 | 5–10 |
| 8 | 10–15 | 5–10 |
| 9 | excluded | 10–15 |
| 10 | excluded | 15–20 |

These are ranges, not a per-student mastery weighting or exact blueprint item count.

## AP Precalculus

The [current exam page](https://apcentral.collegeboard.org/courses/ap-precalculus/exam) confirms the following **May 2027** structure. Subpart weights are proportions of the entire exam, not percentages of their enclosing section.

| Component | Items | Minutes | Calculator | Exam weight |
|---|---:|---:|---|---:|
| MC section | 42 | 105 | split below | 62.5% |
| MC A | 29 | 65 | prohibited | 43.75% |
| MC B | 13 | 40 | graphing calculator required | 18.75% |
| FRQ section | 4 | 70 | split below | 37.5% |
| FRQ A | 2 | 35 | graphing calculator required | 18.75% |
| FRQ B | 2 | 35 | prohibited | 18.75% |

Delivery is hybrid digital with handwritten FRQ answers. The currently listed regular examination is May 11, 2027. All four FRQ categories, in question order, are **Function Concepts; Modeling a Non-Periodic Context; Modeling a Periodic Context; Symbolic Manipulations**. Do not use the former Q1 category label in the new profile.

The [CED](https://apcentral.collegeboard.org/media/pdf/ap-precalculus-course-and-exam-description.pdf), printed p. 129 / PDF p. 136, specifies six rubric points per FRQ, 24 total. Q1 uses Units 1–2 without a context; Q2 uses Units 1–2 in context; Q3 uses Unit 3 in context; Q4 uses Units 2–3 without a context. Calculator permission follows the A/B split above. Radian mode is used on the examination. The inner title explicitly says effective Fall 2026; PDF text extraction retains an older cover fragment, so use the inner edition title with its amendment.

The [Fall 2026 correction document](https://apcentral.collegeboard.org/media/pdf/ap-precalculus-ced-clarification-and-guidance.pdf), pp. 1–5, includes EK clarifications across Units 1–3 and exam changes. It changes MC A from 28 to 29 and 80 to 65 minutes, MC B from 12 to 13, and each FRQ part from 30 to 35 minutes. Q1 C(i) is modified without a scoring-guideline change; Q2 B(iii) is removed and C expanded, with updated scoring guidelines. It also excludes assessing the open-versus-closed interval convention for increasing/decreasing descriptions. Attach this source to the version instead of importing an unamended framework.

The [course page](https://apcentral.collegeboard.org/courses/ap-precalculus) confirms Units 1–3 are examined and Unit 4 is additional, nonexam content. MC unit weight ranges: polynomial/rational 30–40%; exponential/logarithmic 25–40%; trigonometric/polar 30–35%. Unit 4 must remain available as a distinct course scope flag, not silently appear in exam generation.

## IB AI SL: active 2021 version

The [IB mathematics curriculum page](https://ibo.org/programmes/diploma-programme/curriculum/mathematics/) confirms current mathematics courses began teaching in August 2019 with first assessment May 2021. The [official existing AI guide](https://ibo.org/globalassets/new-structure/university-admission/pdfs/dp-mathematics-applications-and-interpretation-guide-en.pdf), printed p. 74 / PDF p. 80, gives the SL assessment structure:

| Component | Format | Minutes | Marks | Final weight | Technology |
|---|---|---:|---:|---:|---|
| Paper 1 | compulsory short responses | 90 | 80 | 40% | required |
| Paper 2 | compulsory extended responses | 90 | 80 | 40% | required |
| Exploration | internal investigation | no exam timer | 20 | 20% | do not model as a timed calculator paper |

External papers total 180 minutes and 80% of the result. Guide printed p. 76 / PDF p. 82 requires GDC access throughout both papers and a clean formula booklet. A fixed question count is not specified; keep it null. The exploration is teacher assessed and IB moderated. The current guide's five exploration criteria must not be replaced by the future four-criterion model.

## IB AI SL: separate future 2029 placeholder

The [official curriculum-updates index](https://ibo.org/university-admission/latest-curriculum-updates) places revised AI mathematics under first teaching August 2027 and first assessment May 2029. The [future AI subject brief](https://ibo.org/globalassets/new-structure/programmes/dp/pdfs/sb_maths_application_en.pdf), pp. 1 and 3–4, independently labels first assessment 2029. Its SL timing and weights remain 90 minutes/40% for each paper, with technology required, plus a 20% exploration. The new exploration has four criteria, totaling 20 points (4, 6, 4, 6).

The [AI changes page](https://ibo.org/university-admission/latest-curriculum-updates/dp-mathematics-applications-and-interpretation-updates/) explicitly reduces each SL paper from **80 to 75 marks**. It identifies future SL removals including logarithms and trapezoidal area approximation. These are future metadata, not changes for the active 2021 version.

The English changes page contains an apparent course-name copyediting error in its overview; the AI heading, dedicated AI brief, and index corroborate the facts used here. A full new AI guide and complete objective mapping were not verified in this public-source review. Keep the 2029 curriculum a future placeholder and any known examination metadata preview-only until an intentional adoption workflow is completed.

## Explicit unresolved boundaries

- An official last assessment/resit cutoff for the 2021 IB version was not verified. Do not invent December 2028 or auto-migrate cohorts on 1 January 2029.
- “2026–28 cohort uses the active version” is ECHS cohort policy supported by the verified transition schedule; enrollment should explicitly pin its version.
- Do not infer a digital/paper delivery mode for IB from these sources; the technology requirement is verified, the delivery-mode field was not.
- Source verification does not establish that all existing ECHS lessons meet every framework objective. Objective-level coverage and content QA remain separate records.
- No AP Classroom/private question text, restricted sample prompts, or answer keys were imported for this research.
