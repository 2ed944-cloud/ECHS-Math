# ECHS platform improvements — 4 September 2026

This release improves the shared platform around the existing courses and banks.

## Lesson workspace

- Search all available courses or just the selected course; match search words in any order.
- Keep teacher release and course-assignment checks on every search result.
- Show result counts, a Not started filter, and distinct empty-course/search states with a reset action.
- Preserve all objectives and resources in lesson details.
- Honor course deep links, open the containing unit, and record lesson launches from the details drawer for Continue learning.
- Keep the drawer open while bookmarking, expose bookmark state, and preserve unit completion totals during filtering.
- Index mastery once per course per render instead of repeatedly scanning it for every lesson.
- Prevent the question-bank inventory from overwriting the mastery counter.

## Sign-in and shared UI

- Recover from configuration and session-check connection failures, with explicit retry and bounded requests.
- Preserve valid sessions during temporary failures and protect a new session from stale responses.
- Keep safe lesson return URLs for both existing sessions and new logins.
- Add password visibility, Caps Lock feedback, accessible busy/error states, and duplicate-submit protection.
- Keep the restored IB Unit 2 slide at the top after reload so mobile headings remain visible.
- Improve keyboard course tabs, mobile navigation dismissal, focus visibility, touch targets, wrapping and reduced-motion behavior.

## Practice and progress

- Require a response before checking so an accidental empty submission does not create an incorrect attempt.
- Preserve zero as a valid response; expose selected-choice state to assistive technology.
- Keep keyboard shortcuts from submitting answers behind dialogs or intercepting normal link/button activation.
- Make the practice-filter background inert and prevent unrelated question-content updates from closing the filters.
- Sync the learning engine's actual attempts, sessions and review records, retaining stable server deduplication IDs.
- Queue offline uploads per account, including after an offline reload, and verify ownership when reconnecting.

## Caching and release reliability

- Bypass service-worker caches for authorization-bearing requests, Supabase responses and signed assets.
- Honor private/no-store response headers, return valid failure responses, and finish background cache writes.
- Keep core cache installation independent of missing optional resources.
- Refresh shared course data and changed platform assets; retain the established GitHub Pages release path.

## Validation and scope

Four new Node behavior suites cover session races, sync payloads, queue ownership, caching, search release boundaries, sign-in recovery, redirects, blank submissions and keyboard behavior. They run in the Pages build before publishing.

Existing access/publication, identity, course isolation, authentication, premium UI and AI-tutor safeguards passed locally. Local HTML validation found zero broken references among 1,643 checked references.

These checks use isolated fixtures and source validation. This release does not certify every mathematical question, browser layout, external emulator, production account or backend integration. Curriculum content, private banks, rosters, account credentials, release policies and hint-only assessment rules were not rewritten.
