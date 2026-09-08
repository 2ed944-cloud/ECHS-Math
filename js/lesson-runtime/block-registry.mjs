/** Explicit rendering capabilities. Validation is owned by the canonical JSON schema. */
const definitions = [
  { type: 'rich-text', version: 1, schema: '#/definitions/richTextBlock', capabilities: { text: true, math: true, referenceOnly: false, interactive: false } },
  { type: 'math', version: 1, schema: '#/definitions/mathBlock', capabilities: { text: false, math: true, referenceOnly: false, interactive: false } },
  { type: 'callout', version: 1, schema: '#/definitions/calloutBlock', capabilities: { text: true, math: true, referenceOnly: false, interactive: false } },
  { type: 'legacy-embedded', version: 1, schema: '#/definitions/legacyEmbeddedBlock', capabilities: { text: true, math: false, referenceOnly: true, interactive: false } }
];

for (const definition of definitions) {
  Object.freeze(definition.capabilities);
  Object.freeze(definition);
}
Object.freeze(definitions);

export const LESSON_SCHEMA_VERSION = 'echs.lesson.v1';
export const LESSON_SCHEMA_PATH = 'schemas/echs.lesson.v1.schema.json';

export function getBlockDefinition(type, version = 1) {
  return definitions.find(item => item.type === type && item.version === version) ?? null;
}

export function listBlockDefinitions() {
  return definitions;
}

export function isSupportedBlock(type, version = 1) {
  return getBlockDefinition(type, version) !== null;
}
