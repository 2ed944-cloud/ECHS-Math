"""Synthetic C08 fixtures and independent length-prefixed SHA-256 vectors.

No source-bank imports, environment reads, network or production content.
"""
import base64
import hashlib
import json
import struct
import uuid

CONTRACT = 'echs.private-bank.snapshot-store.v1'

def digest(value):
    return hashlib.sha256(value).hexdigest()

def frame(fields):
    result = bytearray()
    for field in fields:
        assert isinstance(field, str)
        data = field.encode('utf-8')
        result.extend(struct.pack('>I', len(data)))
        result.extend(data)
    return bytes(result)

def root(domain, leaves):
    return digest(frame([domain, str(len(leaves))]) + b''.join(frame(fields) for fields in leaves))

def canonical(record):
    return json.dumps(record, sort_keys=True, ensure_ascii=False, separators=(',', ':'), allow_nan=False)

def roots_for(files, records, mappings, units):
    by_id = {row['file_id']: row for row in files}
    questions, memberships, mapped = [], [], []
    for record in records:
        qid = record['question_id']
        questions.append((('q', qid, ''), ['question', qid, record['bank_code'], record['canonical_record_sha256'], by_id[record['source_file_id']]['source_path'], str(record['source_record_index'])]))
        for edge in record['dependencies']:
            media_path = by_id[edge['file_id']]['source_path']
            questions.append((('e', qid, media_path), ['media-edge', qid, media_path, edge['dependency_kind']]))
        for membership in record['bundle_memberships']:
            source_path = by_id[membership['file_id']]['source_path']
            index = membership['record_index']
            memberships.append(((qid, source_path, index), ['membership', qid, source_path, str(index), record['canonical_record_sha256']]))
    for mapping in mappings:
        values = [str(mapping[name]) for name in ['question_id', 'course_version_id', 'access_key', 'bank_code', 'catalog_route', 'catalog_unit_index', 'catalog_topic', 'catalog_position', 'curriculum_mapping_status', 'rights_status', 'evidence_reference']]
        mapped.append((('m', mapping['question_id'], mapping['course_version_id'], mapping['access_key']), ['mapping', *values]))
    for unit in units:
        for lesson in unit['lessons']:
            mapped.append((('u', unit['course_version_id'], str(unit['unit_index']), lesson['access_key']), ['unit-review', unit['course_version_id'], str(unit['unit_index']), lesson['access_key'], lesson['route'], lesson['topic'], str(lesson['position'])]))
    file_leaves = [['file', row['source_path'], row['kind'], row['mime_type'], str(row['byte_length']), row['sha256'], row.get('record_layout', ''), str(row['source_occurrence_count']) if 'source_occurrence_count' in row else '', row.get('source_record_root', '')] for row in sorted(files, key=lambda x: x['source_path']) if row['kind'] != 'manifest']
    return {
        'question_root': root('echs.private-bank.questions.v1', [row[1] for row in sorted(questions)]),
        'file_root': root('echs.private-bank.files.v1', file_leaves),
        'membership_root': root('echs.private-bank.memberships.v1', [row[1] for row in sorted(memberships)]),
        'mapping_root': root('echs.private-bank.mappings.v1', [row[1] for row in sorted(mapped)]),
    }

def source_root(records, file_id):
    entries = [(m['record_index'], ['source-record', str(m['record_index']), q['question_id'], q['canonical_record_sha256']]) for q in records for m in q['bundle_memberships'] if m['file_id'] == file_id]
    return {'count': len(entries), 'root': root('echs.private-bank.source-records.v1', [row[1] for row in sorted(entries)])}

def fixture(course_id, *, with_manifest=False):
    uid = lambda: str(uuid.uuid4())
    snapshot_id, source_id, review_id, image_id, extra_id = [uid() for _ in range(5)]
    questions = [
        {'id': 'SYNTHETIC-A', 'prompt': 'Original synthetic archive text: π.', 'answer': 'Synthetic fixture only'},
        {'id': 'SYNTHETIC-B', 'prompt': 'Second original synthetic archive question.', 'answer': 'Synthetic fixture only'},
    ]
    records = []
    for index, question in enumerate(questions):
        text = canonical(question)
        records.append({'question_id': question['id'], 'bank_code': 'ADAMS10', 'canonical_record_text': text, 'canonical_record_sha256': digest(text.encode()), 'source_file_id': source_id, 'source_record_index': index,
                        'bundle_memberships': [{'file_id': source_id, 'record_index': index}] + ([{'file_id': review_id, 'record_index': 0}] if index == 0 else []),
                        'dependencies': [{'file_id': image_id, 'dependency_kind': 'direct-image'}] if index == 0 else []})
    source_bytes = json.dumps({'questions': questions}, ensure_ascii=False, indent=2).encode() + b'\n'
    review_bytes = json.dumps({'questions': [{'question': questions[0], 'editorial': 'Synthetic wrapper stays in source bytes.'}]}, ensure_ascii=False, indent=2).encode() + b'\n'
    png = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD3sAAAAASUVORK5CYII=')
    specs = [(source_id, 'source-json', 'synthetic/source.json', 'application/json', source_bytes, 'questions'), (review_id, 'source-json', 'synthetic/review.json', 'application/json', review_bytes, 'review-questions'),
             (image_id, 'media', 'synthetic/figure.png', 'image/png', png, None), (extra_id, 'media', 'synthetic/extra.png', 'image/png', png, None)]
    files = []
    objects = {}
    for file_id, kind, source_path, mime, data, layout in specs:
        row = {'file_id': file_id, 'kind': kind, 'source_path': source_path, 'mime_type': mime, 'byte_length': len(data), 'sha256': digest(data)}
        if layout:
            receipt = source_root(records, file_id)
            row.update(record_layout=layout, source_occurrence_count=receipt['count'], source_record_root=receipt['root'])
        files.append(row)
        objects[file_id] = data
    mappings = [{'question_id': 'SYNTHETIC-A', 'course_version_id': course_id, 'access_key': 'ap-calculus::0::1.1', 'bank_code': 'ADAMS10', 'catalog_route': 'lessons/ap-calculus/unit-1/synthetic-1-1.html',
                 'catalog_unit_index': 0, 'catalog_topic': '1.1', 'catalog_position': 0, 'curriculum_mapping_status': 'unresolved', 'rights_status': 'archive-only', 'evidence_reference': 'Synthetic unresolved archive fixture; no student release.'}]
    units = [{'course_version_id': course_id, 'unit_index': 0, 'lessons': [{'access_key': 'ap-calculus::0::1.1', 'route': 'lessons/ap-calculus/unit-1/synthetic-1-1.html', 'topic': '1.1', 'position': 0},
                                                                      {'access_key': 'ap-calculus::0::1.2', 'route': 'lessons/ap-calculus/unit-1/synthetic-1-2.html', 'topic': '1.2', 'position': 1}]}]
    roots = roots_for(files, records, mappings, units)
    manifest_bytes = canonical({'contract': 'synthetic-archive-plan.v1', 'roots': roots}).encode()
    if with_manifest:
        manifest_id = uid()
        files.append({'file_id': manifest_id, 'kind': 'manifest', 'source_path': 'synthetic/manifest.json', 'mime_type': 'application/json', 'byte_length': len(manifest_bytes), 'sha256': digest(manifest_bytes)})
        objects[manifest_id] = manifest_bytes
    reserve = {'snapshot_id': snapshot_id, 'request_id': uid(), 'collection_key': 'synthetic-' + snapshot_id, 'bank_codes': ['ADAMS10'], 'source_main': 'a' * 40, 'manifest_sha256': digest(manifest_bytes),
               'expected_question_count': 2, 'expected_file_count': 4, 'expected_media_count': 2, 'expected_manifest_count': int(with_manifest), 'expected_occurrence_count': 3,
               'expected_dependency_count': 1, 'expected_mapping_count': 1, 'expected_total_bytes': sum(row['byte_length'] for row in files), **roots, 'unit_review_sets': units}
    return {'reserve': reserve, 'files': files, 'records': records, 'mappings': mappings, 'objects': objects}

def payload(snapshot, key=None, value=None):
    result = {'snapshot_id': snapshot, 'request_id': str(uuid.uuid4())}
    if key:
        result[key] = value
    return result
