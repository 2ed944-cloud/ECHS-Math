import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const esbuild = require('esbuild');
const root = new URL('../../', import.meta.url);
const sourcePaths = [
  'js/lesson-runtime/schema.mjs',
  'js/lesson-runtime/block-registry.mjs',
  'js/lesson-runtime/generated/validate-lesson-document.mjs',
  'js/lesson-runtime/math-expression.mjs'
];
const sha256 = value => createHash('sha256').update(value).digest('hex');
const sources = [];
for (const path of sourcePaths) {
  const text = (await readFile(new URL(path, root), 'utf8')).replace(/\r\n?/g, '\n');
  sources.push({ path, sha256_lf: sha256(text) });
}
const canonical = JSON.parse(await readFile(new URL('schemas/echs.lesson.v1.schema.json', root), 'utf8'));
const schemaDigest = sha256(JSON.stringify(canonical));
const generated = await readFile(new URL(sourcePaths[2], root), 'utf8');
if (!generated.includes(`// schema-sha256: ${schemaDigest}\n`)) {
  throw new Error('The canonical validator is stale. Run build-validator.mjs first.');
}
const compiled = await esbuild.build({
  absWorkingDir: fileURLToPath(root),
  entryPoints: [sourcePaths[0]],
  bundle: true,
  write: false,
  metafile: true,
  platform: 'browser',
  format: 'esm',
  target: ['es2020'],
  minify: true,
  legalComments: 'none',
  charset: 'utf8',
  logLevel: 'silent'
});
const inputs = Object.keys(compiled.metafile.inputs).map(path => path.replaceAll('\\', '/')).sort();
if (JSON.stringify(inputs) !== JSON.stringify([...sourcePaths].sort())) {
  throw new Error('The server validator must bundle exactly the reviewed canonical runtime modules.');
}
if (Object.values(compiled.metafile.outputs).some(output => output.imports.length)) {
  throw new Error('The deployed validator must have no external imports.');
}
const provenance = {
  format: 'echs.server-lesson-validator.v1',
  schema_version: canonical.properties.schema_version.const,
  schema_sha256_json: schemaDigest,
  source_hash_normalization: 'UTF-8 source text with CRLF/CR normalized to LF',
  sources,
  build: { tool: 'esbuild', version: esbuild.version, target: 'es2020', platform: 'browser', format: 'esm' }
};
const banner = '// Generated from the canonical lesson runtime; do not edit.\n' +
  `// schema-sha256: ${schemaDigest}\n` +
  '// Rebuild: node tools/lesson-runtime/build-server-validator.mjs\n';
const output = banner + compiled.outputFiles[0].text;
if (/\b(?:eval\s*\(|new\s+Function\s*\()/.test(output)) {
  throw new Error('The deployed validator must not evaluate runtime code.');
}
provenance.output_sha256 = sha256(output);
const directory = new URL('supabase/functions/lesson-api/generated/', root);
const targets = [
  [new URL('schema.mjs', directory), output],
  [new URL('schema.provenance.json', directory), JSON.stringify(provenance, null, 2) + '\n']
];
if (process.argv.includes('--check')) {
  for (const [path, text] of targets) {
    if (await readFile(path, 'utf8').catch(() => '') !== text) {
      throw new Error(`Generated server validator or provenance is stale: ${fileURLToPath(path)}`);
    }
  }
  process.stdout.write('Deployed server validator and provenance match the canonical runtime exactly.\n');
} else {
  await mkdir(directory, { recursive: true });
  for (const [path, text] of targets) await writeFile(path, text);
  process.stdout.write(`Generated self-contained server validator (${Buffer.byteLength(output)} bytes).\n`);
}
