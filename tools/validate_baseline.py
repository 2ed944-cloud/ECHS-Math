#!/usr/bin/env python3
"""Portable, fail-closed dispatch for the existing credential-free release checks."""
from __future__ import annotations

import argparse
from dataclasses import dataclass
from datetime import datetime, timezone
import json
import math
import os
from pathlib import Path
import shutil
import signal
import subprocess
import sys
import time


@dataclass(frozen=True)
class Check:
    path: str
    args: tuple[str, ...] = ()
    timeout: float = 120
    dom: bool = False


CORE = (
    Check("tools/test_validate_baseline.py"),
    Check("tools/test_runtime_inventory.py"),
    Check("tools/validate_supabase_migration_versions.py"),
    Check("tools/validate_initial_setup.py"),
    Check("tools/validate_institution_baseline.py", timeout=180),
    Check("tools/validate_mastery_foundation.py"),
    Check("tools/validate_mastery_guards.py"),
    Check("tools/test_mastery_sync.mjs"),
    Check("tools/test_mastery_sync_endpoint.mjs"),
    Check("tools/validate_auth_shell_cache.py"),
    Check("tools/validate_learning_system.py"),
    Check("tools/validate_smart_learning_route.py"),
    Check("tools/validate_readiness_system.py"),
    Check("supabase/functions/readiness-api/readiness-engine.test.mjs"),
    Check("tools/test_platform_resilience.mjs"),
    Check("tools/test_portal_workspace.mjs"),
    Check("tools/test_login_recovery.mjs"),
    Check("tools/test_practice_interactions.mjs"),
    Check("tools/test_institution_identity_mount.mjs"),
    Check("tools/test_learning_system.mjs"),
    Check("tools/test_learning_access_contract.py", (".",)),
    Check("tools/test_lesson_visibility_contract.py", (".",)),
    Check("tools/test_lesson_visibility_progression.mjs"),
    Check("tools/test_practice_scope_access.py"),
    Check("tools/test_calculus_only_practice.py"),
    Check("tools/test_practice_course_isolation.mjs"),
    Check("tools/test_student_single_bank.mjs"),
    Check("tools/test_practice_global_bridge.mjs"),
    Check("tools/validate_local_links.py", (".",), timeout=240),
)
LESSON_NAMES = (
    "ap_precalculus_1_1", "ap_precalculus_1_2", "ib_ai_1_1_merged_v7",
    "ib_ai_1_2_arithmetic_v7", "ib_ai_1_4_finance_v8", "ap_calculus_1_1",
    "ap_calculus_1_2", "ap_calculus_1_3_1_4", "ap_calculus_1_5",
    "ap_calculus_1_6", "ap_calculus_midunit", "ap_calculus_unit1_continuation",
)
LESSONS = tuple(
    check for name in LESSON_NAMES for check in (
        Check(f"tools/test_{name}.mjs"),
        Check(f"tools/test_{name}_ui.mjs", dom=True),
    )
) + (
    Check("tools/test_ap_precalculus_1_1_contexts.mjs"),
    Check("tools/test_ap_calculus_midunit_batch2.mjs"),
    Check("tools/test_ap_calculus_midunit_batch3.mjs"),
)
BANK = (
    Check("tools/test_release_manifest_case.py"),
    Check("tools/validate_private_bank_foundation.py"),
    Check("tools/test_ap_calculus_private_bank_support.py"),
    Check("tools/test_private_bank_inventory_counts.py"),
    Check("tools/test_private_bank_exact_replacement.py"),
    Check("tools/test_private_bank_exact_snapshot.py"),
    Check("tools/test_private_bank_source_archive_chunking.py"),
    Check("tools/test_specific_private_bank_delete.py"),
    Check("question-bank/official/tools/validate_admin_overlays.mjs"),
    Check("question-bank/official/tools/validate_katex.mjs", timeout=240),
    Check("question-bank/official/tools/browser_smoke.mjs", timeout=300),
    Check("question-bank/official/tools/validate_release.py", timeout=300),
)
SUITES = {"core": CORE, "lessons": LESSONS, "bank": BANK}


def positive_timeout(value: str) -> float:
    result = float(value)
    if not math.isfinite(result) or result <= 0:
        raise argparse.ArgumentTypeError("timeout must be a finite positive number")
    return result


def stop_process_tree(process: subprocess.Popen) -> None:
    """Terminate only the test's own process group/tree, including nested validators."""
    if os.name == "nt":
        subprocess.run(
            ["taskkill", "/PID", str(process.pid), "/T", "/F"],
            capture_output=True, timeout=10, check=False,
        )
    else:
        try:
            os.killpg(process.pid, signal.SIGKILL)
        except ProcessLookupError:
            pass
    if process.poll() is None:
        process.kill()


def execute(command: list[str], root: Path, env: dict[str, str], timeout: float) -> dict:
    started = time.monotonic()
    process = None
    result = {"command": command, "timeout_seconds": timeout,
              "stdout": "", "stderr": "", "returncode": None}
    try:
        options = {"creationflags": subprocess.CREATE_NEW_PROCESS_GROUP} if os.name == "nt" else {"start_new_session": True}
        process = subprocess.Popen(
            command, cwd=root, env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            text=True, encoding="utf-8", errors="replace", **options,
        )
        try:
            result["stdout"], result["stderr"] = process.communicate(timeout=timeout)
            result["returncode"] = process.returncode
            result["status"] = "passed" if process.returncode == 0 else "failed"
        except subprocess.TimeoutExpired:
            stop_process_tree(process)
            result["stdout"], result["stderr"] = process.communicate(timeout=10)
            result["returncode"] = process.returncode
            result["status"] = "timeout"
            result["stderr"] += f"\nExceeded {timeout:g} seconds."
    except FileNotFoundError as error:
        result.update(status="missing_tool", stderr=str(error))
    except (OSError, subprocess.SubprocessError) as error:
        if process is not None and process.poll() is None:
            process.kill()
        result.update(status="error", stderr=str(error))
    except KeyboardInterrupt:
        if process is not None:
            stop_process_tree(process)
        raise
    result["duration_seconds"] = round(time.monotonic() - started, 3)
    return result


def run_check(check: Check, root: Path, env: dict[str, str], timeout: float | None = None) -> dict:
    script = root / check.path
    result = {"path": check.path, "status": "missing_test", "returncode": None,
              "command": [], "stdout": "", "stderr": "", "duration_seconds": 0}
    if not script.is_file():
        result["stderr"] = f"Required test is missing: {script}"
        return result
    node = shutil.which("node", path=env.get("PATH"))
    if node is None:
        # Python validators also invoke Node syntax/runtime checks.
        result.update(status="missing_tool", stderr="Node.js is required; install Node 22 or newer and add it to PATH.")
        return result
    limit = timeout if timeout is not None else check.timeout
    if check.dom:
        probe = (
            "const {createRequire}=require('node:module');"
            "const r=createRequire(process.argv[1]);"
            "const mod=process.env.ECHS_TEST_DOM_MODULE||'linkedom';"
            "const pkg=r(mod+'/package.json');"
            "if(pkg.version!=='0.18.12')throw Error('Expected linkedom 0.18.12; found '+pkg.version);"
            "if(typeof r(mod).parseHTML!=='function')throw Error('linkedom parseHTML missing');"
        )
        dependency = execute([node, "-e", probe, str(script)], root, env, min(limit, 20))
        if dependency["status"] != "passed":
            dependency["status"] = "missing_dependency" if dependency["status"] == "failed" else dependency["status"]
            dependency["stderr"] += "\nSet ECHS_TEST_DOM_MODULE to the absolute linkedom 0.18.12 package directory."
            return {"path": check.path, **dependency}
    runtime = sys.executable if script.suffix == ".py" else node
    return {"path": check.path, **execute([runtime, str(script), *check.args], root, env, limit)}


def main(argv: list[str] | None = None, *, suites: dict[str, tuple[Check, ...]] | None = None) -> int:
    registry = SUITES if suites is None else suites
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--suite", action="append", choices=tuple(registry), help="Repeat to select groups; default: all.")
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--timeout", type=positive_timeout, help="Override the timeout in seconds for every selected check.")
    parser.add_argument("--json-report", type=Path, help="Write complete per-check output and status as JSON.")
    parser.add_argument("--list", action="store_true", help="List selected checks without running them.")
    args = parser.parse_args(argv)
    selected = list(dict.fromkeys(args.suite or registry))
    root = args.root.resolve()
    if not root.is_dir():
        parser.error(f"repository root is not a directory: {root}")
    if args.list:
        for name in selected:
            print(f"[{name}]")
            for check in registry[name]:
                print(f"  {check.path} {' '.join(check.args)} (timeout {check.timeout:g}s)")
        return 0
    env = dict(os.environ)
    env.update(PYTHONIOENCODING="utf-8", PYTHONUTF8="1", ECHS_TEST_PYTHON=sys.executable)
    # A partial browser group is never sufficient for the baseline release check.
    env["ECHS_SMOKE_GROUP"] = "all"
    report = {"schema_version": 1, "started_at": datetime.now(timezone.utc).isoformat(),
              "root": str(root), "python": sys.executable, "selected_suites": selected, "suites": []}
    failed = 0
    for name in selected:
        print(f"\n=== {name}: {len(registry[name])} required checks ===", flush=True)
        checks = []
        for check in registry[name]:
            print(f"[{name}] RUN {check.path}", flush=True)
            result = run_check(check, root, env, args.timeout)
            checks.append(result)
            for stream in ("stdout", "stderr"):
                if result[stream]:
                    print(result[stream].rstrip(), flush=True)
            print(f"[{name}] {result['status'].upper()} {check.path} ({result['duration_seconds']:g}s)", flush=True)
            failed += result["status"] != "passed"
        suite_passed = all(check["status"] == "passed" for check in checks) and bool(checks)
        if not checks:
            failed += 1
        report["suites"].append({"name": name, "status": "passed" if suite_passed else "failed", "checks": checks})
    report.update(status="failed" if failed else "passed", failed_checks=failed,
                  finished_at=datetime.now(timezone.utc).isoformat())
    if args.json_report:
        try:
            args.json_report.parent.mkdir(parents=True, exist_ok=True)
            args.json_report.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
        except OSError as error:
            print(f"Could not write JSON report: {error}", file=sys.stderr)
            return 2
    print(f"\nBaseline {report['status'].upper()}: {failed} failed check(s).", flush=True)
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
