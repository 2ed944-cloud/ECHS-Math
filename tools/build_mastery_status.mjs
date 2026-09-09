import fs from 'node:fs';
import {createHash} from 'node:crypto';

const args = process.argv.slice(2);
if (args.length > 1 || (args.length === 1 && args[0] !== '--check')) throw new Error('Usage: node tools/build_mastery_status.mjs [--check]');
const source = new URL('../supabase/functions/_shared/mastery-status.mjs', import.meta.url);
const target = new URL('../js/learning-evidence-status.mjs', import.meta.url);
const classicTarget = new URL('../question-bank/js/learning-system.js', import.meta.url);
const bytes = fs.readFileSync(source);
const begin = '// BEGIN GENERATED ECHS MASTERY STATUS';
const end = '// END GENERATED ECHS MASTERY STATUS';
// This closed, synchronous copy runs before every classic dashboard consumer.
// Strip only declared ESM exports, never transform the policy's implementation.
const classic = `${begin}\nconst MASTERY_STATUS = (() => {\n${bytes.toString('utf8').replace(/\r\n/g, '\n').replace(/^export (?=(?:const|function) )/gm, '')}\nreturn Object.freeze({STATUS_CONTRACT,projectMasteryStatus,projectMasteryRecord,projectMasterySummary});\n})();\n${end}`;
const existing = fs.readFileSync(classicTarget, 'utf8').replace(/\r\n/g, '\n');
if (existing.split(begin).length !== 2 || existing.split(end).length !== 2) throw new Error('Expected exactly one classic policy marker pair.');
const start = existing.indexOf(begin), finish = existing.indexOf(end) + end.length;
const generated = existing.slice(0, start) + classic + existing.slice(finish);
if (args.includes('--check')) {
  if (!fs.existsSync(target) || !fs.readFileSync(target).equals(bytes)) throw new Error('Mastery status public mirror differs from the canonical policy; run the builder.');
  if (existing !== generated) throw new Error('Synchronous classic mastery policy differs from the canonical policy; run the builder.');
} else {
  fs.writeFileSync(target, bytes);
  fs.writeFileSync(classicTarget, generated);
}
console.log(JSON.stringify({status:'PASS',check:args.includes('--check'),bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),classic_sha256:createHash('sha256').update(classic).digest('hex')}));
