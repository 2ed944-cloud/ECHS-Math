# AP Lesson 0 Cinematic Redesign — Validation Record

## Scope

This release redesigns the existing AP Precalculus Lesson 0 and AP Calculus AB/BC Lesson 0 presentation layers without changing their diagnostic banks, answer keys, result calculations, course maps, exam information, completion integration, MathJax configuration, or KaTeX fallback.

## Redesigned first-day experiences

### AP Precalculus
- Cinematic opening scene: **See the function. Shape the story.**
- **Choose Your Lens** representation poll.
- **Your Next Move** productive-struggle activity.
- **Mathematical Passport** learner profile.
- Timed **Partner Relay** with listening and summarising.
- Clear 3×3 **Connection Quest** replacing the former bingo.

### AP Calculus AB/BC
- Cinematic opening scene: **Freeze the instant. Understand the change.**
- AB/BC track-selection scene.
- Motion-based **Freeze the Instant** prompt.
- **Choose Your Lens** representation poll.
- **Calculus Passport** learner profile.
- Timed **Partner Relay**.
- Clear 3×3 **Calculus Connection Quest** replacing the former bingo.

## Connection Quest clarity and safeguards

Each of the nine cells now contains:
1. one clear matching statement;
2. one required follow-up question;
3. a classmate first-name field; and
4. a confirmation control.

The interaction:
- requires a name before confirmation;
- prevents a confirmed line from reusing the same classmate;
- detects rows, columns, and diagonals;
- visibly highlights a completed line;
- saves progress locally;
- invalidates a confirmed cell when its recorded name changes; and
- includes a complete reset control.

## Validation completed

- Shared cinematic JavaScript passed Node syntax validation.
- Post-render enhancement JavaScript passed Node syntax validation.
- CSS brace-balance validation passed for all cinematic stylesheets.
- Runtime data-mutation tests passed for both course data objects.
- Both courses retained nine Connection Quest cells.
- Required first-day scene IDs remained present.
- HTML load order verified:
  - original lesson data;
  - original diagnostic data;
  - cinematic mutation layer;
  - original lesson engine;
  - post-render accessibility and quest enhancement.
- Existing diagnostic data and engine files are not changed by this release.
- Responsive and reduced-motion rules are included.
- A direct Chromium screenshot run was attempted in the build container, but the container Chromium process did not complete because its system D-Bus/browser process was unavailable. The release therefore relies on syntax, runtime mutation, structure, load-order, and responsive-CSS validation rather than claiming a successful automated browser screenshot.
