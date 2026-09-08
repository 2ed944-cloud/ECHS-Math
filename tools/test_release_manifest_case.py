#!/usr/bin/env python3
"""Exercise the existing release validator's manifest rule on real file names."""
import ast
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'question-bank/official/tools/validate_release.py'
# The validator executes the full bank audit at module scope; load only its actual
# path helper so this regression stays independent of bank contents and reports.
tree = ast.parse(SOURCE.read_text(encoding='utf-8'))
helpers = [node for node in tree.body if isinstance(node, ast.FunctionDef) and node.name == 'has_case_colliding_manifest']
assert len(helpers) == 1, 'Release manifest helper is required'
namespace = {'Path': Path}
exec(compile(ast.Module(body=helpers, type_ignores=[]), str(SOURCE), 'exec'), namespace)
has_collision = namespace['has_case_colliding_manifest']


class ManifestCaseTests(unittest.TestCase):
    def test_lowercase_manifest_is_not_an_uppercase_duplicate(self):
        with tempfile.TemporaryDirectory(prefix='echs-manifest-lower-') as temporary:
            root = Path(temporary)
            (root / 'manifest.json').write_text('{}', encoding='utf-8')
            self.assertFalse(has_collision(root))

    def test_actual_uppercase_entry_is_rejected(self):
        with tempfile.TemporaryDirectory(prefix='echs-manifest-upper-') as temporary:
            root = Path(temporary)
            (root / 'MANIFEST.json').write_text('{}', encoding='utf-8')
            self.assertTrue(has_collision(root))

    def test_nested_uppercase_entry_does_not_alias_root_manifest(self):
        with tempfile.TemporaryDirectory(prefix='echs-manifest-nested-') as temporary:
            root = Path(temporary)
            (root / 'nested').mkdir()
            (root / 'nested/MANIFEST.json').write_text('{}', encoding='utf-8')
            self.assertFalse(has_collision(root))


if __name__ == '__main__':
    unittest.main(verbosity=2)
