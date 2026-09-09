// Independent JavaScript implementation of the C08 framed archive roots.
// Only original synthetic fixture data crosses the Python process boundary.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {readFileSync, mkdirSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve, dirname} from 'node:path';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const python = process.env.ECHS_TEST_PYTHON || (process.platform === 'win32' ? 'python' : 'python3');
const reportPath = resolve(repo, process.argv[2] || 'reports/private-snapshot-hash.json');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const frame = fields => Buffer.concat(fields.map(value => {
  assert.equal(typeof value, 'string');
  const bytes = Buffer.from(value, 'utf8'), prefix = Buffer.alloc(4);
  prefix.writeUInt32BE(bytes.byteLength);
  return Buffer.concat([prefix, bytes]);
}));
const root = (domain, leaves) => hash(Buffer.concat([frame([domain, String(leaves.length)]), ...leaves.map(frame)]));
const compare = (a, b) => {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
  }
  return 0;
};
const orderedRoot = (domain, entries) => root(domain, entries.sort((a, b) => compare(a.key, b.key)).map(x => x.leaf));
function rootsFor({files, records, mappings, reserve}) {
  const byId = new Map(files.map(file => [file.file_id, file]));
  const questions = [], memberships = [], mapped = [];
  for (const q of records) {
    questions.push({key: ['q', q.question_id, ''], leaf: ['question', q.question_id, q.bank_code, q.canonical_record_sha256, byId.get(q.source_file_id).source_path, String(q.source_record_index)]});
    for (const edge of q.dependencies) {
      const path = byId.get(edge.file_id).source_path;
      questions.push({key: ['e', q.question_id, path], leaf: ['media-edge', q.question_id, path, edge.dependency_kind]});
    }
    for (const member of q.bundle_memberships) {
      const path = byId.get(member.file_id).source_path;
      memberships.push({key: [q.question_id, path, member.record_index], leaf: ['membership', q.question_id, path, String(member.record_index), q.canonical_record_sha256]});
    }
  }
  for (const m of mappings) {
    mapped.push({key: ['m', m.question_id, m.course_version_id, m.access_key], leaf: ['mapping', ...['question_id', 'course_version_id', 'access_key', 'bank_code', 'catalog_route', 'catalog_unit_index', 'catalog_topic', 'catalog_position', 'curriculum_mapping_status', 'rights_status', 'evidence_reference'].map(key => String(m[key]))]});
  }
  for (const unit of reserve.unit_review_sets) for (const lesson of unit.lessons) {
    mapped.push({key: ['u', unit.course_version_id, String(unit.unit_index), lesson.access_key], leaf: ['unit-review', unit.course_version_id, String(unit.unit_index), lesson.access_key, lesson.route, lesson.topic, String(lesson.position)]});
  }
  return {
    question_root: orderedRoot('echs.private-bank.questions.v1', questions),
    file_root: root('echs.private-bank.files.v1', files.filter(f => f.kind !== 'manifest').sort((a, b) => compare([a.source_path], [b.source_path])).map(f => ['file', f.source_path, f.kind, f.mime_type, String(f.byte_length), f.sha256, f.record_layout || '', f.source_occurrence_count === undefined ? '' : String(f.source_occurrence_count), f.source_record_root || ''])),
    membership_root: orderedRoot('echs.private-bank.memberships.v1', memberships),
    mapping_root: orderedRoot('echs.private-bank.mappings.v1', mapped),
  };
}

const report = {contract: 'echs.private-snapshot-hash-test.v1', status: 'RUNNING; NOT PASS', production_calls: false, external_network: false, database_executed: false, checks: []};
const test = (name, fn) => {fn(); report.checks.push(name); console.log('PASS ' + name);};
try {
  const run = spawnSync(python, ['-X', 'utf8', '-c', "import sys,json;sys.path.insert(0,'tools');from private_snapshot_fixture import fixture,root;f=fixture('00000000-0000-4000-8000-000000000123',with_manifest=True);f.pop('objects');f['empty_root']=root('synthetic.empty.v1',[]);print(json.dumps(f,ensure_ascii=False))"], {cwd: repo, encoding: 'utf8', timeout: 10000, maxBuffer: 1024 * 1024});
  assert.equal(run.status, 0, 'Synthetic Python fixture must execute successfully');
  const value = JSON.parse(run.stdout);
  const expected = Object.fromEntries(['question_root', 'file_root', 'membership_root', 'mapping_root'].map(k => [k, value.reserve[k]]));
  test('length framing has the fixed Unicode and delimiter golden vector', () => assert.equal(frame(['', 'π', 'a:b|c']).toString('hex'), '0000000000000002cf8000000005613a627c63'));
  test('field boundaries and UTF-8 byte lengths are unambiguous', () => {
    assert.notDeepEqual(frame(['ab', 'c']), frame(['a', 'bc']));
    assert.notDeepEqual(frame(['é']), frame(['e\u0301']));
    assert.equal(frame(['π']).readUInt32BE(), 2);
    assert.throws(() => frame([null]));
  });
  test('empty roots retain their domain and explicit leaf count', () => {
    assert.equal(root('synthetic.empty.v1', []), value.empty_root);
    assert.notEqual(root('another.v1', []), value.empty_root);
  });
  test('all four complete archive roots match independent Python', () => assert.deepEqual(rootsFor(value), expected));
  test('input order does not alter roots while numeric source indexes sort numerically', () => {
    const changed = structuredClone(value);
    changed.files.reverse(); changed.records.reverse(); changed.mappings.reverse(); changed.reserve.unit_review_sets[0].lessons.reverse();
    for (const q of changed.records) q.bundle_memberships.reverse();
    assert.deepEqual(rootsFor(changed), expected);
    assert.deepEqual([{key: ['a', 'b', 10]}, {key: ['a', 'b', 2]}].sort((a, b) => compare(a.key, b.key)).map(x => x.key[2]), [2, 10]);
  });
  test('omitted media dependencies and source occurrences change their respective roots', () => {
    const changed = structuredClone(value); changed.records[0].dependencies = [];
    assert.notEqual(rootsFor(changed).question_root, expected.question_root);
    changed.records[0].bundle_memberships.pop();
    assert.notEqual(rootsFor(changed).membership_root, expected.membership_root);
  });
  test('unit-set identity including unmapped teaching lessons contributes to mapping root', () => {
    const changed = structuredClone(value); changed.reserve.unit_review_sets[0].lessons[1].position++;
    assert.notEqual(rootsFor(changed).mapping_root, expected.mapping_root);
  });
  test('manifest self-exclusion is explicit and source or media bytes still contribute', () => {
    const changed = structuredClone(value); changed.files.find(f => f.kind === 'manifest').sha256 = '0'.repeat(64);
    assert.deepEqual(rootsFor(changed), expected);
    changed.files.find(f => f.kind === 'media').sha256 = '0'.repeat(64);
    assert.notEqual(rootsFor(changed).file_root, expected.file_root);
  });
  report.roots = expected;
  report.source_sha256 = Object.fromEntries(['tools/private_snapshot_fixture.py', 'tools/test_private_snapshot_hash.mjs'].map(path => [path, hash(readFileSync(resolve(repo, path)))]));
  report.status = 'PASS';
} catch (error) {
  report.status = 'FAIL';
  report.error_type = error.name;
  throw error;
} finally {
  mkdirSync(dirname(reportPath), {recursive: true});
  writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
}
