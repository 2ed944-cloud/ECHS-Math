# ECHS Mathematics — Phase 1: Platform Foundation

## Goal

Turn the current lesson portal, Practice Studio and Official AP centre into one coherent, free, installable mathematics platform without changing the canonical Official AP question boundary.

## Production rules

- Work on a branch and review through a pull request.
- Do not regenerate canonical question IDs.
- Do not mix textbook questions with Official AP records.
- Do not expose teacher/archive-only Official AP content.
- Do not remove provenance, source, rights, lesson, topic, unit or audit metadata.
- Do not claim a collection is complete unless an automated inventory gate passes.

## Workstreams

### 1. Unified platform experience

- [x] Rebuild the main portal as a connected learning dashboard.
- [x] Add global links for Lessons, Practice, Tests, Progress and Official AP.
- [x] Keep Practice Studio and Official AP visually and structurally distinct.
- [x] Add Continue Learning, Practice, Assessment and Official AP entry cards.
- [x] Add live publisher-library counts from the repository catalog.
- [x] Add a responsive navigation menu.
- [x] Add light/dark appearance controls.
- [x] Add online/offline status.
- [x] Preserve keyboard search with `/` and add `Alt+P` for Practice Studio.

### 2. Mobile and installable web app

- [x] Upgrade the Web App Manifest.
- [x] Add app shortcuts for lessons, practice, tests and Official AP.
- [x] Add install-prompt support.
- [x] Add an accessible offline fallback.
- [x] Upgrade service-worker caching and update notifications.
- [x] Respect reduced-motion preferences.

### 3. Practice-platform performance

- [x] Cache loaded question payloads for the current session.
- [x] Limit large collection loading to four concurrent payloads.
- [x] Report multi-file loading progress.
- [x] Keep source question order stable.
- [x] Preserve content duplicates while preventing the same canonical ID from loading twice.
- [x] Improve accessible labels and disabled states during loading and answer checking.

### 4. Question-bank completion gates

#### Pearson Precalculus

- [x] 4,528 questions registered.
- [x] 16 chapter JSON files present.
- [x] 16 chapter media packages present.
- [x] 4,528 unique IDs validated.
- [x] 10,741 image references checked.
- [x] 4,210 answer references checked.
- [x] All four AP Precalculus units represented.
- [x] Practice Studio reports the collection as **Complete**.

#### Existing Calculus collections

The base catalog currently registers:

- Calculus: Early Transcendentals — 3,309 questions.
- Calculus: A Complete Course — 2,170 questions.
- Pearson Calculus Preliminaries — 403 questions.

These collections remain under their existing catalog and source rules.

#### Additional uploaded collections

`CAF5S` is a separate foundation/college-algebra collection. It is not required to declare the 4,528-question Pearson AP Precalculus collection complete. It can be integrated as an additional collection after its own payload and media validation gate passes.

### 5. Automated quality assurance

- [x] Add a repository-level Python validation gate.
- [x] Validate required platform files.
- [x] Validate manifest structure and icon paths.
- [x] Validate all 4,528 Pearson Precalculus IDs.
- [x] Validate chapter and media-package counts.
- [x] Check core local HTML references.
- [x] Add JavaScript syntax checks in GitHub Actions.
- [x] Add JSON syntax checks in GitHub Actions.

## Phase 1 merge gate

Phase 1 is ready for production review when:

1. `Platform Foundation QA` passes on the pull request.
2. The portal home, Practice Home, Practice Studio, Test Generator and Progress pages pass desktop and mobile visual review.
3. Pearson Precalculus displays 4,528 questions and `Complete` coverage.
4. A full practice set can be generated from at least two AP Precalculus units.
5. A test can be generated and scored locally.
6. Official AP pages still expose only student-ready records.
7. The user explicitly approves merging the pull request.
