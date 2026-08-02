# Access model

| Role | Courses | Lessons | Practice | Timetable | Administration |
| --- | --- | --- | --- | --- | --- |
| Student | Assigned classes only | Assigned course lessons | Completed lessons and teacher assignments | Own enrolled mathematics classes, read only | No |
| Teacher | All courses | All lessons | All practice controls, including multi-bank and multi-lesson assignments | Own teaching timetable, read only | Class and assignment management |
| Administrator | All courses | All lessons | All practice controls | View and publish every teacher timetable | Full school control |
| Parent | Linked student reports | No direct lesson catalogue | No direct practice | No direct timetable | Family reporting only |
| Guest | None | None | None | None | Sign-in gateway only |

## ECHS Smart Learning Route

The Smart Learning Route is a deterministic presentation and routing layer. It
does not use a chatbot, generative model, or paid third-party API. It reads only
the institutional and learning evidence already available to the signed-in
role:

1. The student's current or next mathematics period.
2. The teacher's nearest open assignment and mapped lesson.
3. The previous lesson in the same course as a prerequisite signal.
4. Verified mastery, synchronized accuracy, open mistakes, and spaced reviews.

The student receives one of three routes: **Support** (6 questions), **Core**
(8 questions), or **Challenge** (10 questions). Support is selected when review,
mistake, prerequisite, or accuracy evidence is fragile. Challenge requires
strong target mastery and accuracy with no due review. Core is the safe default.

Teachers see private class-level route groups and can open the existing
multi-bank, multi-lesson assignment studio with the corresponding activity,
difficulty, and short question count prepared. Administrators see operational
coverage only; they do not change individual learning evidence or grant
mastery. Mastery continues to be awarded solely by the server-trusted evidence
engine using multiple suitable attempts and recovery evidence.
