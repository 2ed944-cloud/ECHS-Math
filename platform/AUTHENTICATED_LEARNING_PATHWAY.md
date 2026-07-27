# ECHS Authenticated Learning Pathway

## Product rule

The public website is a sign-in gateway, not a public catalogue of lessons or question collections.

- Students see only courses assigned through class membership.
- Teachers and administrators retain complete course access.
- Parents remain in the family reporting experience.
- A student completes a lesson before its focused practice becomes available.
- Practice evidence, review recovery and recent accuracy move the related skill toward mastery.

## Student sequence

1. Open an assigned course.
2. Complete the next lesson.
3. Unlock focused practice for that lesson.
4. Recover mistakes through spaced review.
5. Reach skill mastery and continue to the next lesson.

## Visible bank names

Student-facing interfaces use neutral ECHS labels:

- AP Calculus Bank 1, AP Calculus Bank 2, and so on.
- AP Precalculus Bank 1, AP Precalculus Bank 2, and so on.

Original publisher, source, provenance, rights, ISBN and import metadata remain in canonical internal records. They are not deleted or rewritten.

## Gamification

The platform uses an original ECHS identity for XP, levels, coins, streaks, quests and achievement badges. It does not reproduce another platform's name, logo, artwork or branded interface.

## Static hosting boundary

GitHub Pages serves static files. The build injects authentication and assigned-course guards into deployed lesson and learning pages, removes those routes from the public sitemap and marks them for no indexing. This protects the intended product flow and ordinary access.

Static hosting cannot provide cryptographic secrecy for source files that are still published to the Pages artifact. A later security phase should move lesson HTML and question payloads behind authenticated object storage or an authenticated API when strict content confidentiality is required.
