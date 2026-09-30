#!/usr/bin/env python3
import tempfile
import unittest
from pathlib import Path
from inject_precalc_unit1_classroom import HOOK, PATHS, inject, run
from inject_learning_access_guard import inject_lesson

class Injection(unittest.TestCase):
    def test_bounded_byte_preserving_guarded_injection(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp)
            entry=root/'lessons/shared/classroom/precalc-unit1/entry.js'
            entry.parent.mkdir(parents=True);entry.write_text('/* fixture */')
            for item in PATHS:
                path=root/item;path.parent.mkdir(parents=True,exist_ok=True)
                path.write_text('<!doctype html><html><head><title>Fixture</title></head><body><section>Original bank &amp; simulation</section></body></html>')
                with self.assertRaises(ValueError):inject(root,path)
                inject_lesson(root,path)
            before={item:(root/item).read_bytes() for item in PATHS}
            self.assertEqual(run(root),14);self.assertEqual(run(root),0)
            for item in PATHS:
                self.assertEqual((root/item).read_bytes().replace(HOOK.encode(),b''),before[item])
            path=root/PATHS[0];text=path.read_text()
            path.write_text(text.replace('content="ap-precalculus"','content="ap-calculus"'))
            with self.assertRaises(ValueError):inject(root,path)
            path.write_text(text.replace(HOOK,HOOK+HOOK))
            with self.assertRaises(ValueError):inject(root,path)
            other=root/'lessons/ap-precalculus/unit-2/other.html';other.parent.mkdir(parents=True);other.write_text(text)
            with self.assertRaises(ValueError):inject(root,other)

if __name__=='__main__':unittest.main()
