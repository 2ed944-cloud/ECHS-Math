#!/usr/bin/env python3
"""Source/stage injector tests. Synthetic HTML is not executed as a lesson."""
from __future__ import annotations
import copy
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

HERE = Path(__file__).absolute().parent
TEMP_PARENT = Path(os.environ.get('ECHS_TEST_TEMP_ROOT', HERE / 'lesson-investigations')).absolute()
spec = importlib.util.spec_from_file_location("investigation_injector_tested", HERE / "inject_lesson_investigations.py")
injector = importlib.util.module_from_spec(spec)
spec.loader.exec_module(injector)
ORIGINAL_METADATA = injector.load_preservation()
REJECTED = 0


class InjectionTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="injection-test-", dir=TEMP_PARENT)
        self.root = Path(self.temp.name)
        self.source = self.root / "source"
        self.stage = self.root / "stage"
        self.source.mkdir(); self.stage.mkdir()
        self.metadata = copy.deepcopy(ORIGINAL_METADATA)
        for row in self.metadata["lesson_sources"] + self.metadata["protected_calculus_sources"]:
            raw = (b'<!doctype html>\r\n<html><head><title>Original</title></head>\r\n<body><main id="unchanged">Original teaching</main></body></html>'
                   if row["path"] in injector.ROUTES else b'Protected fixture source: ' + row["path"].encode())
            path = self.source / row["path"]; path.parent.mkdir(parents=True, exist_ok=True); path.write_bytes(raw)
            row.update(bytes=len(raw), sha256=hashlib.sha256(raw).hexdigest())
        for relative_path in injector.ROUTES:
            raw = (self.source / relative_path).read_bytes()
            path = self.stage / relative_path; path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(injector.guarded_projection(self.source, relative_path, raw))
        self.manifest = self.root / "source-preservation.json"
        self.manifest.write_text(json.dumps(self.metadata), encoding="utf-8")
        self.patch = patch.object(injector, "MANIFEST", self.manifest)
        self.patch.start()

    def tearDown(self):
        self.patch.stop()
        # TemporaryDirectory's resolved target is a fixed child of this test area.
        self.assertTrue(self.root.resolve().is_relative_to(TEMP_PARENT.resolve()))
        self.temp.cleanup()

    def rejected(self, fn):
        global REJECTED
        with self.assertRaises((ValueError, OSError)):
            fn()
        REJECTED += 1

    def staged(self):
        return {p: (self.stage / p).read_bytes() for p in injector.ROUTES if (self.stage / p).exists()}

    def test_01_pure_transform_fifteen_routes_byte_preservation_and_idempotence(self):
        for relative_path, before in self.staged().items():
            after = injector.inject_html(before, relative_path)
            self.assertEqual(after.replace(injector.hook(relative_path).encode(), b"", 1), before)
            self.assertEqual(injector.inject_html(after, relative_path), after)
            self.assertEqual(after.count(b'type="module"'), 1)

    def test_02_exact_host_manifest_matches_python_roster_and_relative_paths(self):
        module = (HERE.parent / "lessons/shared/investigations/host-manifest.mjs").as_uri()
        code = "import {INVESTIGATION_HOSTS} from " + json.dumps(module) + "; console.log(JSON.stringify(INVESTIGATION_HOSTS));"
        result = subprocess.run(["node", "--input-type=module", "-e", code], capture_output=True, text=True, timeout=20, check=True)
        rows = json.loads(result.stdout)
        self.assertEqual(len(rows), 15)
        self.assertEqual([row['key'] for row in rows], ['ap-rates', 'arithmetic', 'geometric', 'finance', 'ap-polynomial-rates', 'ap-polynomial-zeros', 'ap-polynomial-tails', 'ap-rational-tails', 'ap-rational-zeros', 'ap-rational-poles', 'ap-rational-holes', 'ap-equivalent-forms', 'ap-function-transformations', 'ap-model-selection', 'ap-model-construction'])
        self.assertEqual(rows, [{"key": key, "course": course, "path": path} for path, (key, course, _) in injector.ROUTES.items()])
        for path, (_, _, module_path) in injector.ROUTES.items():
            self.assertEqual((self.source / path).parent.joinpath(module_path).resolve(), (self.source / "lessons/shared/investigations/host.mjs").resolve())

    def test_03_route_and_path_traversal_rejection(self):
        raw = next(iter(self.staged().values()))
        for path in ["", "index.html", "../" + next(iter(injector.ROUTES)), "/" + next(iter(injector.ROUTES)), "lessons\\test.html", "C:/private.html", "lessons/./test.html", "lessons//test.html"]:
            self.rejected(lambda p=path: injector.inject_html(raw, p))
            self.rejected(lambda p=path: injector._safe_file(self.stage, p))

    def test_04_missing_and_malformed_guard_markers_rejected(self):
        path, raw = next(iter(self.staged().items()))
        for before, after in [(b'data-echs-lesson-guard="1"', b'data-echs-lesson-guard="0"'),
                              (b'content="ap-precalculus"', b'content="ib-math-ai"'),
                              (b'id="echsLessonGateStyle"', b'id="other"'),
                              (b'visibility:hidden!important', b'visibility:visible'),
                              (b'institution-client.js', b'institution-client-other.js'),
                              (b'portal-access.js', b'portal-other.js'),
                              (b'lesson-access-guard.js', b'lesson-access-guard.js?wrong'),
                              (b'</body>', b''), (b'</body>', b'</body></body>')]:
            self.rejected(lambda b=before, a=after: injector.inject_html(raw.replace(b, a), path))
        meta=b'<meta name="echs-course" content="ap-precalculus" data-echs-lesson-guard="1">'
        self.rejected(lambda: injector.inject_html(raw.replace(b'</head>',meta+b'</head>'),path))

    def test_05_wrong_duplicate_encoded_and_noncanonical_hooks_rejected(self):
        path, raw=next(iter(self.staged().items())); good=injector.inject_html(raw,path)
        for modified in [good.replace(b'</body>',injector.hook(path).encode()+b'</body>'),
                         good.replace(b'host.mjs',b'host.mjs?custom=1'),
                         good.replace(b'type="module"',b'type="text/javascript"'),
                         good.replace(b'type="module"',b'type="module" async'),
                         good.replace(b'<script type="module"',b'<script  type="module"'),
                         raw.replace(b'</body>',b'<script src="https://other.invalid/investigations/%68ost.mjs"></script></body>'),
                         raw.replace(b'</body>',injector.COMMENT.encode()+b'</body>')]:
            self.rejected(lambda value=modified: injector.inject_html(value,path))

    def test_06_html_encoding_type_and_size_bounds(self):
        path=next(iter(injector.ROUTES))
        for raw in [b'',b'\xff',b'\0',"text",b'x'*(injector.MAX_HTML_BYTES+1)]:
            self.rejected(lambda value=raw: injector.inject_html(value,path))

    def test_07_actual_guard_file_adapter_matches_in_memory_projection(self):
        spec=importlib.util.spec_from_file_location("original_guard_for_test",HERE/'inject_learning_access_guard.py')
        guard=importlib.util.module_from_spec(spec);spec.loader.exec_module(guard)
        for path in injector.ROUTES:
            target=self.root/'guard-output'/path;target.parent.mkdir(parents=True,exist_ok=True)
            raw=(self.source/path).read_bytes();target.write_bytes(raw)
            self.assertTrue(guard.inject_lesson(self.root/'guard-output',target))
            self.assertEqual(target.read_bytes(),injector.guarded_projection(self.source,path,raw))

    def test_08_all_fifteen_prevalidated_before_any_stage_write(self):
        paths=list(injector.ROUTES);last=self.stage/paths[-1]
        last.write_bytes(last.read_bytes().replace(b'Original teaching',b'Tampered teaching'))
        before=self.staged();self.rejected(lambda: injector.run(self.stage,self.source));self.assertEqual(before,self.staged())

    def test_09_each_of_84_source_mutations_rejected_without_stage_writes(self):
        before=self.staged()
        self.assertEqual(len(self.metadata['lesson_sources'])+len(self.metadata['protected_calculus_sources']),84)
        for row in self.metadata['lesson_sources']+self.metadata['protected_calculus_sources']:
            path=self.source/row['path'];raw=path.read_bytes();path.write_bytes(bytes([raw[0]^1])+raw[1:])
            self.rejected(lambda: injector.run(self.stage,self.source));self.assertEqual(before,self.staged());path.write_bytes(raw)

    def test_10_success_changes_only_fifteen_staged_files_and_is_idempotent(self):
        other=self.stage/'untouched.html';other.write_bytes(b'Protected unchanged stage file')
        sources={r['path']:(self.source/r['path']).read_bytes() for r in self.metadata['lesson_sources']+self.metadata['protected_calculus_sources']}
        self.assertEqual(injector.run(self.stage,self.source),{'status':'PASS','routes':15,'source_pins':84,'changed':15,'already_present':0})
        once=self.staged();self.assertEqual(injector.run(self.stage,self.source)['already_present'],15);self.assertEqual(once,self.staged())
        self.assertEqual(other.read_bytes(),b'Protected unchanged stage file')
        for path,raw in sources.items():self.assertEqual((self.source/path).read_bytes(),raw)

    def test_11_missing_late_target_and_same_root_rejected(self):
        last=self.stage/list(injector.ROUTES)[-1];last.unlink();before=self.staged()
        self.rejected(lambda: injector.run(self.stage,self.source));self.assertEqual(before,self.staged())
        self.rejected(lambda: injector.run(self.source,self.source))

    def test_12_second_source_sweep_detects_drift_before_write(self):
        real=injector.verify_sources;calls=0;before=self.staged()
        def changed(root,metadata):
            nonlocal calls
            calls+=1
            if calls==2:
                p=self.source/metadata['protected_calculus_sources'][-1]['path'];p.write_bytes(b'changed')
            return real(root,metadata)
        with patch.object(injector,'verify_sources',changed):self.rejected(lambda: injector.run(self.stage,self.source))
        self.assertEqual(before,self.staged())

    def test_13_link_or_junction_components_are_not_resolved_away(self):
        relative=next(iter(injector.ROUTES));target=self.stage/relative
        original=Path.is_symlink
        for bad in [target,target.parent,self.stage]:
            with patch.object(Path,'is_symlink',lambda path: path==bad or original(path)):
                self.rejected(lambda: injector._safe_file(self.stage,relative))
        with patch.object(Path,'is_junction',lambda path:path==target.parent,create=True):
            self.rejected(lambda: injector._safe_file(self.stage,relative))

    def test_14_manifest_shape_roster_hash_type_and_duplicate_rejections(self):
        variants=[]
        for change in [lambda m:m.update(extra=True),lambda m:m['lesson_sources'].reverse(),lambda m:m.update(lesson_sources=m['lesson_sources'][:4]),lambda m:m['protected_calculus_sources'].pop(),
                       lambda m:m['protected_calculus_sources'][0].update(path='unrelated.txt'),lambda m:m['lesson_sources'][0].update(bytes=True),
                       lambda m:m['lesson_sources'][0].update(sha256='0'*63),lambda m:m['lesson_sources'].__setitem__(0,1),
                       lambda m:m['protected_calculus_sources'].__setitem__(1,copy.deepcopy(m['protected_calculus_sources'][0]))]:
            candidate=copy.deepcopy(self.metadata);change(candidate);variants.append(json.dumps(candidate))
        variants.append(json.dumps(self.metadata).replace('"version":','"version":"duplicate","version":',1))
        for text in variants:
            self.manifest.write_text(text,encoding='utf-8');self.rejected(injector.load_preservation)


if __name__ == '__main__':
    suite=unittest.defaultTestLoader.loadTestsFromTestCase(InjectionTests)
    result=unittest.TextTestRunner(verbosity=2).run(suite)
    print(json.dumps({'status':'PASS' if result.wasSuccessful() else 'FAIL','groups':result.testsRun,'rejections':REJECTED,'native_browser':False,'synthetic_stage':True,'native_guard_file_comparison':True}))
    raise SystemExit(0 if result.wasSuccessful() else 1)
