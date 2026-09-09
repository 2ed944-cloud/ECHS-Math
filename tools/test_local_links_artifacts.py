"""Generated browser fixtures are excluded; production lesson links still fail."""
from pathlib import Path
from tempfile import TemporaryDirectory, gettempdir
import unittest
from validate_local_links import validate

class LocalLinkArtifactTests(unittest.TestCase):
    def test_generated_html_does_not_pollute_product_validation(self):
        with TemporaryDirectory() as folder:
            root=Path(folder)
            self.assertEqual(root.resolve().parent,Path(gettempdir()).resolve())
            (root/'artifacts/fixture').mkdir(parents=True)
            (root/'artifacts/fixture/index.html').write_text('<a href="missing.pdf">QA only</a>',encoding='utf-8')
            self.assertEqual(validate(root),(0,[]))
            (root/'lessons').mkdir()
            (root/'lessons/lesson.html').write_text('<a href="missing.pdf">Product</a>',encoding='utf-8')
            checked, errors=validate(root)
            self.assertEqual(checked,1)
            self.assertEqual(len(errors),1)
            self.assertIn('missing.pdf',errors[0])
            (root/'lessons/missing.pdf').write_bytes(b'%PDF-fixture')
            self.assertEqual(validate(root),(1,[]))

if __name__=='__main__':unittest.main(verbosity=2)
