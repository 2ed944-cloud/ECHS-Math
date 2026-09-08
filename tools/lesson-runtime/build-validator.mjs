import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { listBlockDefinitions } from '../../js/lesson-runtime/block-registry.mjs';

const require = createRequire(import.meta.url);
const Ajv = require('ajv');
const standaloneCode = require('ajv/dist/standalone').default;
const esbuild = require('esbuild');
const root = new URL('../../', import.meta.url);
const schemaBytes = await readFile(new URL('schemas/echs.lesson.v1.schema.json', root));
const schema = JSON.parse(schemaBytes);
const schemaDigest = createHash('sha256').update(JSON.stringify(schema)).digest('hex');
const schemaRefs = schema.definitions.block.oneOf.map(item => item.$ref).sort();
const registryRefs = listBlockDefinitions().map(item => item.schema).sort();
if (JSON.stringify(schemaRefs) !== JSON.stringify(registryRefs)) {
  throw new Error('The explicit registry must cover exactly the canonical block schema definitions.');
}
for (const entry of listBlockDefinitions()) {
  const definition = schema.definitions[entry.schema.split('/').at(-1)];
  if (definition.properties.type.const !== entry.type || definition.properties.version.const !== entry.version) {
    throw new Error(`Registry type/version differs from the canonical schema: ${entry.type}`);
  }
}

const ajv = new Ajv({
  strict: true,
  allErrors: true,
  strictNumbers: true,
  unicodeRegExp: true,
  ownProperties: true,
  coerceTypes: false,
  useDefaults: false,
  removeAdditional: false,
  code: { source: true, esm: true, lines: true }
});
ajv.compile(schema);
const standalone = standaloneCode(ajv, { validate: schema.$id, validateBlock: schema.$id + '#/definitions/block' }) + '\nexport default validate;\n';
const compiled = await esbuild.build({
  stdin: { contents: standalone, sourcefile: 'lesson-schema-validator.js', resolveDir: fileURLToPath(new URL('.', import.meta.url)), loader: 'js' },
  bundle: true,
  write: false,
  platform: 'browser',
  format: 'esm',
  target: ['es2020'],
  minify: true,
  legalComments: 'none',
  charset: 'utf8',
  logLevel: 'silent'
});
const banner = `// Generated from schemas/echs.lesson.v1.schema.json; do not edit.\n// schema-sha256: ${schemaDigest}\n// Ajv ${require('ajv/package.json').version}; esbuild ${esbuild.version}. Rebuild: node tools/lesson-runtime/build-validator.mjs\n`;
const output = banner + compiled.outputFiles[0].text;
if (/\b(?:eval\s*\(|new\s+Function\s*\()/.test(output)) {
  throw new Error('Generated browser validator must not evaluate runtime code.');
}
const target = new URL('js/lesson-runtime/generated/validate-lesson-document.mjs', root);
if (process.argv.includes('--check')) {
  const committed = await readFile(target, 'utf8').catch(() => '');
  if (committed !== output) throw new Error('Generated validator is stale. Rebuild and commit the generated output.');
  process.stdout.write('Generated validator matches the canonical schema exactly.\n');
} else {
  await mkdir(new URL('js/lesson-runtime/generated/', root), { recursive: true });
  await writeFile(target, output);
  process.stdout.write(`Generated standalone browser validator (${Buffer.byteLength(output)} bytes).\n`);
}
