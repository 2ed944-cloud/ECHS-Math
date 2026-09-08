# Architecture and Migration Strategy

## 1. Principle

Build the future platform beside the current platform, then migrate incrementally.

Avoid a big-bang rewrite.

## 2. Target architecture

### Public/static layer
Can continue to serve:
- public shell;
- public design assets;
- public lesson renderer code;
- public course metadata safe for public release;
- public ECHS-owned question assets approved for publication.

### Authenticated institutional layer
Supabase should remain the primary secure backend for:
- accounts;
- classes;
- enrollments;
- lesson drafts;
- lesson versions;
- teacher assets;
- private question banks;
- assignments;
- learning evidence;
- mastery;
- publication policies.

### Shared rendering layer
Create a framework-neutral renderer that accepts a versioned `ECHS Lesson Document`.

Preferred first implementation:
- ES modules;
- standards-based custom elements/Web Components where useful;
- current KaTeX integration;
- existing auth/access bridge;
- dynamic imports for graph/3D modules.

Do not require a whole-site framework migration.

## 3. Canonical lesson schema

Recommended high-level structure:

```json
{
  "schema_version": "echs.lesson.v1",
  "lesson_id": "uuid",
  "course_version_id": "uuid",
  "unit_id": "uuid",
  "topic_id": "uuid",
  "slug": "1-1-can-change-occur-at-an-instant",
  "title": "Can Change Occur at an Instant?",
  "objectives": [],
  "skills": [],
  "slides": [
    {
      "id": "uuid",
      "title": "Build and move a secant line",
      "layout": "two-column",
      "blocks": []
    }
  ],
  "variants": {
    "context": ["neutral", "qatar"]
  },
  "publication": {},
  "accessibility": {}
}
```

Blocks are typed data, never arbitrary unsanitized teacher HTML.

## 4. Block schema

Base fields:
- id;
- type;
- version;
- content;
- settings;
- accessibility;
- analytics tags;
- curriculum tags.

Example block types:
- rich-text;
- math;
- callout;
- image;
- video;
- table;
- worked-example;
- reveal;
- question;
- interactive-graph;
- parameter-explorer;
- calculator-workflow;
- 3d-model;
- qatar-context;
- reflection;
- exit-ticket.

Use a registry so new blocks can be added without changing lesson documents.

## 5. Suggested Supabase tables

Names may adapt to existing schema after audit.

### Curriculum
- `curriculum_versions`
- `courses`
- `course_versions`
- `units`
- `topics`
- `objectives`
- `skills`
- `objective_skill_links`
- `prerequisite_links`

### Lessons
- `lessons`
- `lesson_versions`
- `lesson_publications`
- `lesson_assets`
- `lesson_collaborators`

### Questions
Integrate with existing canonical/private bank boundaries rather than blindly replacing them:
- `question_records`
- `question_versions`
- `question_mappings`
- `question_provenance`
- `question_reviews`
- `question_assets`
- `misconception_codes`

### Authoring
- `draft_locks`
- `authoring_events`

Use RLS.

## 6. Lesson version workflow

Draft
→ Review
→ Approved
→ Published
→ Superseded / Archived

Published version must be immutable.

Editing a published lesson creates a new draft version.

Allow rollback by republishing an earlier valid version.

## 7. Compatibility adapter

Create `legacyLessonAdapter`.

Its responsibilities:
- discover legacy page metadata;
- map existing slide titles/objectives;
- preserve canonical URL;
- wrap legacy lesson as `legacy-embedded` during transition;
- optionally import compatible sections into schema blocks;
- never mutate source automatically without a migration plan.

### AP handcrafted decks
First target should be one strong reference lesson (e.g. AP Calculus 1.1), because it contains complex interactive behavior and tests.

### IB `LESSON_DATA`
Build an importer that converts supported `LESSON_DATA` structures into the new document schema more directly.

## 8. URL stability

Existing canonical lesson URLs must remain valid.

Possible strategy:
- old URL loads the new renderer with `lesson_id` after migration;
- query parameters for course/release/lesson/slide remain supported;
- redirects preserve state.

## 9. Question-bank integration

Do not store all canonical questions again without need.

Create an abstraction:
`QuestionRepository`

Implement providers:
- public canonical provider;
- private Supabase provider;
- lesson-local original provider during migration.

Normalize them into a common read model.

Writes must respect provider/provenance boundaries.

## 10. Secure authoring

Lesson Studio should never save teacher drafts into public GitHub source directly from the browser.

Save to authenticated Supabase.

Publication pipeline may:
- publish document snapshots to a safe public delivery layer when content is public;
or
- render authenticated content from the secure API if lesson visibility requires it.

Teacher answer keys/solutions can have release policies separate from public lesson structure.

## 11. Content sanitization

Rich-text editor must output a controlled document model.

Do not permit arbitrary scripts, inline event handlers, iframes, or unsafe HTML.

External embeds require allowlisting.

## 12. Interaction plugin architecture

Create `MathBlockRegistry`.

Each plugin declares:
- `type`;
- schema;
- renderer;
- editor;
- validator;
- serializer;
- accessibility strategy;
- lazy-load bundle;
- analytics events.

Example:
`echs.volume3d.v1`

This makes 3D a block, not a bespoke lesson page.

## 13. State

Separate:
- ephemeral UI state;
- account-local resilient draft state;
- institutional persistent state;
- mastery evidence.

Never infer one from another.

## 14. Testing strategy

### Schema tests
- valid/invalid documents;
- migrations;
- round-trip serialization.

### Renderer tests
- every block;
- keyboard;
- math;
- reveal;
- publication state.

### Authoring tests
- add/delete/reorder;
- autosave;
- undo/redo;
- version restore;
- concurrent edit behavior.

### Security tests
- student cannot write;
- teacher scope enforced;
- unpublished version inaccessible;
- private solution not in public payload.

### Regression
Run current Pages and question-bank suites.

## 15. Migration phases

### M0 — inventory
Map lesson architectures and existing backend tables/functions.

### M1 — schema/renderer
No authoring yet.

### M2 — import AP 1.1 as reference
Prove complex interaction compatibility.

### M3 — import one IB AI lesson
Prove `LESSON_DATA` migration.

### M4 — Lesson Studio MVP
Text/math/image/table/question blocks.

### M5 — interaction blocks
Graphs, parameter explorers.

### M6 — 3D
Volume/cross-section blocks.

### M7 — curriculum/version integration
Coverage dashboard.

### M8 — scaled migration
Move lessons by unit without breaking URLs.

## 16. Rollback

Every migration must document:
- previous route;
- data backup;
- new feature flag;
- rollback trigger;
- rollback steps.

Never delete legacy source in the same change that first introduces its replacement.
