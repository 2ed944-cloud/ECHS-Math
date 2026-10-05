# Topic 1.1 A–D vessel comparison — 5 October 2026

The native vessel investigation now reconstructs the four silhouettes supplied
by the presenter, while retaining the existing lesson, original question families,
authentication, publication gates and evidence systems. It publishes no protected
AP Classroom prompt or image. The workshop's standalone HTML uses the same radius
knots and assumptions. This change is a teaching model, not a new mastery system.

Each model has a common illustrative height of 10 cm, circular horizontal sections,
no wall thickness and no leakage. The piecewise-linear radius defines the exact
volume integral. B's taper leads into a straight neck; the illustrated rim is
omitted from its interior. The values are explicitly teaching assumptions rather
than physical measurements from the AP question. Other vessels retain their lower
bulb/shoulder changes and upper rim widening.

Playback uses elapsed seconds, not a fixed percentage-per-second. The constant
inflow changes filling duration, and a new pump setting resets to an empty vessel
so each run retains a single constant inflow. The default is 6 cm³/s (adjustable
2–15 cm³/s), matching the standalone workshop demo. Time scrubbing uses seconds.
The water level, time, volume, cross-sectional area, height-rise rate and graph
point all derive from one state. A partial graph grows with the water; a future
curve is shown only when the teacher selects Compare All Four. Comparison uses
one time axis, one height axis and the same inflow. Each predicted curve ends
when its own vessel fills, without a fictitious horizontal continuation.

Wider circular sections have a larger area and a smaller instantaneous height
rise; narrower sections have a larger rise, for a fixed inflow. A visible section
line and numerical area/rate readouts support this connection. Controls use native
keyboard behavior, focus states and explicit labels. Reduced motion disables Play
and retains time scrubbing. Leaving the page, hiding the document or hiding the
owning slide stops playback. Selecting a new vessel resets the run and hides the
reasoning. No action awards mastery or changes learner records.

Validation:

- `node --check lessons/ap-precalculus/unit-1/assets/tandem-context-models-v4.js`
- `node tools/test_forum_vessels.mjs`: independent quadrature, volume conservation,
  finite-difference slopes, all four vessels, animation callbacks, pause/reset,
  scrubbing, inflow, common axes, curve endpoints, synchronized water/point,
  answer reveal, reduced motion and hidden-slide pause.
- Existing `test_ap_precalculus_1_1.mjs` and
  `test_ap_precalculus_1_1_contexts.mjs`: existing original content and models.

The controls fixture checks actual UI code with a deterministic synthetic DOM;
it does not claim a signed-in production account or browser layout check. The
existing PUE forum browser workflow remains the layout/browser release check.
The native model container retains `.lab-display` for that workflow and for the
existing lesson styles. The model's URL version is advanced to avoid an older
cached script. Rollback: revert this commit; no data migration is involved.
