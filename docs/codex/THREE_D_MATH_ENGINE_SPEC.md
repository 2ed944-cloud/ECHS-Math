# ECHS 3D Mathematics Engine Specification

## Purpose

Create reusable 3D mathematical visualization blocks where spatial structure materially improves understanding.

First production target:
AP Calculus Unit 8 volume/cross-section applications.

## Technology

Preferred baseline:
- Three.js as a dynamically imported ES module;
- framework-neutral integration;
- Web Component or renderer plugin;
- no whole-platform React dependency merely for 3D.

If an existing project dependency makes another approach clearly superior, document the reason.

## Core principle

The mathematics model is independent of rendering.

Tests should validate geometry/integrals without needing WebGL.

## Initial templates

### 1. Solid of revolution — disk
Inputs:
- region boundary;
- axis;
- interval;
- orientation.

Displays:
- 2D region;
- representative disk;
- 3D solid;
- radius;
- thickness.

### 2. Solid of revolution — washer
Adds:
- outer radius;
- inner radius;
- representative washer.

### 3. Shell method
Displays:
- shell radius;
- shell height;
- thickness;
- cylindrical shell.

### 4. Known cross sections
Support:
- square;
- rectangle with relation;
- equilateral triangle;
- semicircle;
- other reviewed templates.

## Shifted axes

Support:
- x-axis;
- y-axis;
- `y = k`;
- `x = k`.

Radius must be geometric distance to the axis, not merely function value.

## Synchronization

For advanced lesson layout synchronize:

2D region
↔ slice parameter
↔ geometry measurements
↔ differential volume expression
↔ 3D highlight.

Example washer:
`A(x) = π(R(x)^2 - r(x)^2)`

Moving x updates R/r and the highlighted cross-section.

## Interaction

Required where relevant:
- rotate;
- zoom;
- reset;
- slice slider;
- play/pause build;
- show/hide region;
- show/hide axis;
- show/hide representative element;
- labels toggle.

Optional:
- explode slices;
- method switch.

Method switch is allowed only if both setups are mathematically valid and correctly parameterized.

## 3D question types

### Recognition
Which integral matches the displayed solid?

### Radius identification
Select outer/inner radius.

### Axis change
Move the axis and predict how the setup changes.

### Cross-section identification
Identify shape/area formula.

### Reverse engineering
Given a solid and axis, identify the generating region.

### Compare methods
Choose washer vs shell and justify.

## Authoring

Teacher must configure through forms/presets, not code.

Example:
- curve 1;
- curve 2;
- interval;
- axis;
- method;
- orientation;
- color theme auto from design system;
- labels.

Use safe expression parser.

## Mathematical validation

Before publish:
- finite interval;
- valid functions;
- real-valued region where required;
- correct top/bottom or left/right relation;
- nonnegative radii;
- inner radius ≤ outer radius;
- axis relationship valid;
- cross-section area nonnegative;
- integral model consistent.

## Performance

- lazy load only when block enters/approaches viewport;
- pause rendering offscreen;
- dispose geometries/materials/listeners;
- cap mesh resolution adaptively;
- reduce quality on weak devices;
- avoid multiple continuously animating canvases.

## Accessibility

WebGL is not inherently accessible.

Provide:
- textual description;
- current slice measurements;
- keyboard slice control;
- formula;
- 2D fallback;
- data table if helpful;
- reduced-motion mode;
- static image fallback when WebGL unavailable.

## Qatar identity

3D Qatar context can include architecture only when the mathematical solid/model is defensible.

Do not claim a real building is exactly a mathematical surface unless clearly described as an approximation/model.

## Testing

Unit tests:
- radius functions;
- shell height;
- cross-section area;
- volume numerical checks;
- shifted-axis cases.

UI tests:
- slider sync;
- reset;
- method switch;
- labels;
- keyboard;
- fallback;
- cleanup.

Visual regression:
- representative canonical scenarios.

## Reference production benchmark

For a washer lesson, a student should be able to:
1. see a shaded 2D region;
2. select/observe the axis;
3. move a slice;
4. see the washer in 2D;
5. see corresponding washer in 3D;
6. read R and r;
7. see the integral setup;
8. animate the full solid;
9. answer an original AP-style setup question.

Anything materially weaker should not be marketed as the completed 3D engine.
