#!/usr/bin/env python3
"""Exercise dispatch failure paths using real short-lived child processes."""
from __future__ import annotations
import contextlib
import io
import json
import os
from pathlib import Path
import sys
import tempfile
import unittest
from unittest import mock

import validate_baseline as runner
import validate_institution_baseline as institution


class BaselineRunnerTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix="echs-baseline-test-")
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        (self.root / "pass.py").write_text("print('fixture passed')\n", encoding="utf-8")
        (self.root / "fail.py").write_text("import sys\nprint('fixture failure', file=sys.stderr)\nsys.exit(7)\n", encoding="utf-8")
        (self.root / "sleep.py").write_text("import time\ntime.sleep(30)\n", encoding="utf-8")
        self.env = dict(os.environ, PYTHONIOENCODING="utf-8")

    def test_python_dispatch_uses_current_interpreter_and_keeps_failure(self):
        with mock.patch.object(runner.shutil, "which", return_value="node"):
            result = runner.run_check(runner.Check("fail.py"), self.root, self.env)
        self.assertEqual(result["command"][0], sys.executable)
        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["returncode"], 7)
        self.assertIn("fixture failure", result["stderr"])

    def test_timeout_terminates_the_dispatched_process(self):
        with mock.patch.object(runner.shutil, "which", return_value="node"):
            result = runner.run_check(runner.Check("sleep.py", timeout=0.15), self.root, self.env)
        self.assertEqual(result["status"], "timeout")
        self.assertIsNotNone(result["returncode"])
        self.assertLess(result["duration_seconds"], 12)

    def test_missing_node_is_a_failure_not_a_skip(self):
        with mock.patch.object(runner.shutil, "which", return_value=None):
            result = runner.run_check(runner.Check("pass.py"), self.root, self.env)
        self.assertEqual(result["status"], "missing_tool")

    def test_missing_test_is_a_failure_not_a_skip(self):
        result = runner.run_check(runner.Check("deleted.py"), self.root, self.env)
        self.assertEqual(result["status"], "missing_test")

    def test_actual_missing_executable_is_reported(self):
        result = runner.execute([str(self.root / "no-such-tool")], self.root, self.env, 2)
        self.assertEqual(result["status"], "missing_tool")

    def test_default_runs_every_suite_and_json_retains_failures(self):
        suites = {"core": (runner.Check("fail.py"),), "lessons": (runner.Check("pass.py"),), "bank": (runner.Check("deleted.py"),)}
        report = self.root / "reports/result.json"
        with mock.patch.object(runner.shutil, "which", return_value="node"), contextlib.redirect_stdout(io.StringIO()):
            status = runner.main(["--root", str(self.root), "--json-report", str(report)], suites=suites)
        self.assertEqual(status, 1)
        data = json.loads(report.read_text(encoding="utf-8"))
        self.assertEqual(data["selected_suites"], ["core", "lessons", "bank"])
        self.assertEqual([row["status"] for row in data["suites"]], ["failed", "passed", "failed"])
        self.assertEqual(data["failed_checks"], 2)
        self.assertIn("fixture failure", data["suites"][0]["checks"][0]["stderr"])

    def test_explicit_suite_does_not_run_others(self):
        suites = {"core": (runner.Check("fail.py"),), "lessons": (runner.Check("pass.py"),)}
        with mock.patch.object(runner.shutil, "which", return_value="node"), contextlib.redirect_stdout(io.StringIO()):
            status = runner.main(["--root", str(self.root), "--suite", "lessons"], suites=suites)
        self.assertEqual(status, 0)

    def test_unknown_suite_rejected_before_dispatch(self):
        with mock.patch.object(runner, "run_check") as dispatch, contextlib.redirect_stderr(io.StringIO()):
            with self.assertRaises(SystemExit) as result:
                runner.main(["--root", str(self.root), "--suite", "unknown"])
        self.assertEqual(result.exception.code, 2)
        dispatch.assert_not_called()

    def test_dom_dependency_failure_is_explicit(self):
        (self.root / "ui.mjs").write_text("throw Error('must not execute');", encoding="utf-8")
        failed_probe = {"status": "failed", "stderr": "Cannot find module linkedom", "stdout": "", "returncode": 1, "duration_seconds": 0}
        with mock.patch.object(runner.shutil, "which", return_value="node"), mock.patch.object(runner, "execute", return_value=failed_probe) as execute:
            result = runner.run_check(runner.Check("ui.mjs", dom=True), self.root, self.env)
        self.assertEqual(result["status"], "missing_dependency")
        self.assertIn("ECHS_TEST_DOM_MODULE", result["stderr"])
        self.assertEqual(execute.call_count, 1)

    def test_unwritable_report_does_not_report_success(self):
        suites = {"core": (runner.Check("pass.py"),)}
        with mock.patch.object(runner.shutil, "which", return_value="node"), contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
            status = runner.main(["--root", str(self.root), "--json-report", str(self.root)], suites=suites)
        self.assertEqual(status, 2)


class InstitutionFixtureTests(unittest.TestCase):
    def test_activation_timeout_cannot_change_original_config(self):
        with tempfile.TemporaryDirectory(prefix="echs-institution-timeout-") as temporary:
            root = Path(temporary)
            (root / "tools").mkdir()
            (root / "config").mkdir()
            config = root / "config/institution.json"
            original = b'{"enabled":true}\r\n'
            config.write_bytes(original)
            ready = root / "fixture-was-mutated"
            (root / institution.VALIDATORS[0]).write_text(
                "import json,time\nfrom pathlib import Path\np=Path('config/institution.json')\n"
                "assert json.loads(p.read_text())['enabled'] is True\n"
                "p.write_text('{\"enabled\":false}')\n"
                f"Path({str(ready)!r}).write_text('ready')\ntime.sleep(30)\n", encoding="utf-8")
            (root / institution.VALIDATORS[1]).write_text("raise SystemExit(0)\n", encoding="utf-8")
            wrapper = (
                f"import sys;sys.path.insert(0,{str(Path(__file__).resolve().parent)!r});"
                "from pathlib import Path;import validate_institution_baseline as v;"
                f"raise SystemExit(v.main(Path({str(root)!r})))"
            )
            result = runner.execute([sys.executable, "-c", wrapper], root, dict(os.environ), 1.5)
            self.assertEqual(result["status"], "timeout")
            self.assertTrue(ready.is_file(), "The fixture config was changed before the timeout")
            self.assertEqual(config.read_bytes(), original)

    def test_enabled_configuration_runs_activation_and_preserves_original_on_failure(self):
        with tempfile.TemporaryDirectory(prefix="echs-institution-failure-") as temporary:
            root = Path(temporary)
            (root / "tools").mkdir()
            (root / "config").mkdir()
            config = root / "config/institution.json"
            original = b'{"enabled":true}\r\n'
            config.write_bytes(original)
            (root / institution.VALIDATORS[0]).write_text(
                "import json\nfrom pathlib import Path\np=Path('config/institution.json')\n"
                "assert json.loads(p.read_text())['enabled'] is True\n"
                "p.write_text('{\"enabled\":false}')\nraise SystemExit(9)\n", encoding="utf-8")
            (root / institution.VALIDATORS[1]).write_text("raise SystemExit(0)\n", encoding="utf-8")
            with contextlib.redirect_stdout(io.StringIO()):
                result = institution.main(root)
            self.assertEqual(result, 9, "Enabled config must run and retain activation failure")
            self.assertEqual(config.read_bytes(), original)

    def test_fixture_preserves_real_config_and_isolates_mutation(self):
        with tempfile.TemporaryDirectory(prefix="echs-institution-test-") as temporary:
            root = Path(temporary) / "source"
            copied = Path(temporary) / "fixture"
            (root / "tools").mkdir(parents=True)
            (root / "config").mkdir()
            config = root / "config/institution.json"
            original = b'{"enabled":true,"api_base":"https://fixture.invalid"}\r\n'
            config.write_bytes(original)
            for name in institution.VALIDATORS:
                (root / name).write_text("required = ['config/institution.json', '../outside-secret.txt']\n", encoding="utf-8")
            institution.copy_fixture(root, copied)
            fixture_config = copied / "config/institution.json"
            self.assertEqual(fixture_config.read_bytes(), original)
            fixture_config.write_text('{"enabled":false}', encoding="utf-8")
            self.assertEqual(config.read_bytes(), original)
            self.assertFalse((copied.parent / "outside-secret.txt").exists())


if __name__ == "__main__":
    unittest.main(verbosity=2)
