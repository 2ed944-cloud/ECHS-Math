# ECHS Lesson Studio Specification

## Objective

Allow a teacher to create, edit, duplicate, reorder, preview, publish and restore interactive mathematics lessons without writing HTML.

## Core user modes

### Edit
Teacher authors content.

### Preview
Exactly how the student will experience the current draft.

### Present
Classroom full-screen mode with teacher reveal controls.

### Student
Published learning experience.

## Primary interface

Desktop layout:

Left: slide navigator  
Center: canvas  
Right: properties / block inspector  
Top: save/version/preview/publish

## Slide operations

Required:
- add;
- duplicate;
- delete;
- rename;
- reorder;
- drag;
- hide;
- teacher-only slide;
- duplicate across lesson;
- move/copy between lessons where authorized.

Deletion should use a recoverable trash/undo state.

## Block insertion

`+ Add block`

Categories:

### Content
- heading
- rich text
- math
- callout
- image
- video
- table
- file/resource

### Teaching
- learning objective
- prior-knowledge prompt
- worked example
- step reveal
- misconception
- teacher note
- reflection
- exit ticket

### Assessment
- MCQ
- numeric
- symbolic
- short response
- multi-part
- bank question
- AP FRQ
- IB structured question

### Interactive
- graph
- parameter explorer
- data/table explorer
- calculator workflow
- simulation
- 3D model

### Context
- Qatar context
- neutral/context switch

## Rich text

Teacher should edit visually.

Support:
- headings;
- paragraphs;
- lists;
- emphasis;
- links;
- inline math;
- accessible callouts.

Do not store arbitrary unsafe HTML.

## Math editor

Default:
- visual math input.

Advanced:
- optional LaTeX source.

Live render.

Validate malformed expressions before publish.

## Graph block

Teacher config:
- function(s);
- domain;
- axes;
- points;
- labels;
- sliders;
- draggable points;
- tangent/secant;
- area;
- table sync;
- prompt;
- reset state.

Provide presets so teachers do not code JSON for common interactions.

## 3D block

Teacher chooses template:
- solid of revolution;
- cross-sectional solid;
- surface/curve context if supported.

Then configures with guided fields.

Do not expose Three.js code.

## Question block

Teacher can:
- search bank;
- insert by ID;
- create new;
- create similar draft;
- create Qatar-context variant;
- set release policy;
- attach hint;
- attach misconception tags.

## Layout

Provide constrained templates:
- single focus;
- 50/50;
- 40/60;
- three-panel;
- media + explanation;
- graph + controls;
- 2D + formula + 3D.

Do not allow unconstrained pixel positioning that creates inaccessible layouts.

## Themes

Course theme may change accents, but core components stay consistent.

Teacher may choose approved variants, not arbitrary CSS.

## Autosave

Requirements:
- debounce;
- visible saved/saving/offline state;
- retry;
- account-scoped offline draft queue;
- conflict detection;
- last-server-version comparison.

Offline draft recovery must not cross accounts.

## Versioning

Actions:
- Save draft
- Request review
- Publish
- View history
- Restore as new draft
- Compare versions

Published version immutable.

## Collaboration

MVP can use soft lock:
- user editing;
- last activity;
- take over with warning.

Later:
- real-time collaboration if valuable.

Do not implement complex CRDT collaboration before basic authoring is reliable.

## Publication

Checks before publish:
- required metadata;
- curriculum mapping;
- broken asset;
- invalid math;
- inaccessible image without alt text;
- broken question reference;
- unauthorized private question;
- invalid 3D model;
- unsupported block version.

## Legacy import

### AP handcrafted
Importer can create a lesson record with legacy slides, then progressively convert supported elements.

### IB LESSON_DATA
Build a more direct converter.

Always preview migration diff.

## Presentation mode

Features:
- full screen;
- next/back;
- jump;
- progressive reveal;
- teacher solution reveal;
- timer optional;
- reset interaction;
- QR/deep link optional;
- large math.

Presentation interactions must not modify student mastery.

## AI authoring assistant

Permitted draft actions:
- rewrite explanation;
- suggest an example;
- suggest misconception;
- generate original similar question;
- generate context variant;
- generate scaffold;
- generate challenge.

All AI output:
- visibly draft;
- editable;
- never auto-published;
- assessment content routed through QA.

## Acceptance criteria for MVP

A teacher can:
1. create a new lesson;
2. add 5 slides;
3. add text/math/image/table/question blocks;
4. reorder slides;
5. edit content;
6. preview;
7. publish;
8. sign in as student and view;
9. revise;
10. restore old version;

without editing repository HTML.

Current legacy lessons continue to work.
