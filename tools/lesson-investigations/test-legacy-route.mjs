import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const html = readFileSync(new URL('../../lessons/ib-math-ai/unit-1/lessons/IB_AI_SL_1.8_technology_equations_ECHS.html', import.meta.url), 'utf8');
const inline = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
assert.equal(inline.length, 1, 'Use the one actual inline redirect');
assert.match(html, /rel="canonical" href="IB_AI_SL_1\.6_technology_equations_ECHS\.html"/);
function run(search, hash) {
  const calls = [];
  vm.runInNewContext(inline[0], {location: Object.freeze({search, hash, replace: value => calls.push(value)})}, {timeout: 1000});
  assert.equal(calls.length, 1); return calls[0];
}
const cases = [
  {name: 'query only', search: '?course=ib-math-ai&lessonKey=u1-technology-equations', hash: '', expected: 'IB_AI_SL_1.6_technology_equations_ECHS.html?course=ib-math-ai&lessonKey=u1-technology-equations'},
  {name: 'hash only', search: '', hash: '#practice', expected: 'IB_AI_SL_1.6_technology_equations_ECHS.html#practice'},
  {name: 'query and hash, literal encoded values', search: '?course=ib-math-ai&opaque=%3F%23%26%27&repeat=a&repeat=b', hash: '#slide=12', expected: 'IB_AI_SL_1.6_technology_equations_ECHS.html?course=ib-math-ai&opaque=%3F%23%26%27&repeat=a&repeat=b#slide=12'}
];
for (const c of cases) assert.equal(run(c.search, c.hash), c.expected, c.name);
console.log(JSON.stringify({contract: 'echs.ib-legacy-route-tests.v1', status: 'PASS', cases: cases.map(c => ({name: c.name, status: 'PASS'})), scope: 'Actual inline script in a controlled VM; no browser or authentication acceptance.'}, null, 2));
