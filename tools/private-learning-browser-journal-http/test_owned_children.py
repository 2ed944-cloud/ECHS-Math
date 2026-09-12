"""Bounded ownership faults plus real Linux subreaper/fork/pidfd regressions.

Each native case runs in its own initially child-free supervisor. Windows skips
are explicit; --require-linux makes any skipped native evidence a failed gate.
No Chromium, HTTP, SQL, production process or global process-name kill is used.
"""
import argparse
import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import tempfile
import time
from types import SimpleNamespace
import unittest
from unittest.mock import Mock, patch

import owned_children as owned

LINUX = sys.platform == 'linux' and Path('/proc').is_dir()
WORK_DIR = None
REAL_PATH = Path


def identity(pid=4102, **changes):
    return dict({'pid':pid, 'ppid':4101, 'pgrp':pid, 'session':pid,
                 'start':72599, 'uid':1001, 'state':'S'}, **changes)


def registry_fixture():
    value = owned.OwnedChildren.__new__(owned.OwnedChildren)
    value.owner = identity(4101, ppid=1)
    value.entries = {}; value.roots = {}; value.reaped = 0
    value.signals = 0; value.scans = 0; value._guard = Mock()
    return value


def entry(value, fd=37):
    return {'identity':dict(value), 'last':dict(value), 'fd':fd}


class GuardTests(unittest.TestCase):
    def test_non_linux_enable_is_explicit_failure(self):
        with patch('owned_children.sys.platform', 'win32'):
            with self.assertRaisesRegex(ValueError, '^owned-linux-required$'):
                owned.OwnedChildren.enable()

    def test_descendant_scope_uses_parent_chain_not_name_or_group(self):
        root = identity(); detached = identity(4103, ppid=4102, session=9000, pgrp=9000)
        unrelated = identity(4104, ppid=9001, session=4102, pgrp=4102)
        result = owned._descendants({v['pid']:v for v in [root, detached, unrelated]},4101)
        self.assertEqual(set(result), {4102,4103})
        with self.assertRaisesRegex(ValueError, '^owned-ancestry-cycle$'):
            owned._descendants({4102:root,4101:identity(4101,ppid=4102)},4101)
        with patch('owned_children.MAX_OWNED',1):
            with self.assertRaisesRegex(ValueError, '^owned-descendant-limit$'):
                owned._descendants({4102:root,4103:detached},4101)

    def test_inaccessible_inventory_is_not_empty_proof(self):
        fake = Mock(); fake.iterdir.return_value = [SimpleNamespace(name='4102')]
        with patch('owned_children.Path',return_value=fake), patch('owned_children.process_info',side_effect=PermissionError('fixture')):
            with self.assertRaises(PermissionError):
                owned._inventory(time.monotonic()+1)
        with patch('owned_children.Path',return_value=fake):
            with self.assertRaisesRegex(ValueError,'^owned-scan-deadline$'):
                owned._inventory(time.monotonic()-1)

    def test_new_direct_child_omitted_from_snapshot_never_passes(self):
        value = registry_fixture()
        with patch('owned_children._inventory',return_value={}), patch('owned_children._direct_children',return_value={4102}):
            with self.assertRaisesRegex(ValueError,'^owned-inventory-raced-or-incomplete$'):
                value.scan()
        self.assertEqual(value.scans,0)

    def test_live_known_descendant_omitted_from_snapshot_never_passes(self):
        value = registry_fixture(); row = identity(); value.entries[owned._key(row)] = entry(row)
        with patch('owned_children._inventory',return_value={}), patch('owned_children._direct_children',return_value=set()), patch('owned_children.process_info',return_value=row):
            with self.assertRaisesRegex(ValueError,'^owned-inventory-raced-or-incomplete$'):
                value.scan()
        self.assertEqual(value.entries[owned._key(row)]['fd'],37)

    def test_just_reaped_snapshot_does_not_reopen_retired_identity(self):
        value = registry_fixture(); row = identity(); value.entries[owned._key(row)] = entry(row)
        with patch('owned_children._inventory',return_value={4102:row}), patch('owned_children._direct_children',return_value=set()), patch('owned_children.process_info',return_value=None), patch('owned_children._exited',return_value=True), patch('owned_children.os.close') as close, patch('owned_children.os.pidfd_open',create=True) as reopen:
            self.assertEqual(value.scan(),[])
        close.assert_called_once_with(37); reopen.assert_not_called()

    def test_pid_reuse_or_uid_change_cannot_signal_replacement(self):
        for changed in [identity(start=72600),identity(uid=1002)]:
            value = registry_fixture(); row = identity(); value.entries[owned._key(row)] = entry(row)
            value.scan = Mock()
            with self.subTest(changed=changed), patch('owned_children.process_info',return_value=changed), patch('owned_children.signal.pidfd_send_signal',create=True) as send:
                with self.assertRaisesRegex(ValueError,'^owned-signal-identity$'):
                    value._signal_descendants(15)
                send.assert_not_called()

    def test_capture_race_closes_fd_and_foreign_uid_never_opens_one(self):
        value = registry_fixture()
        with patch('owned_children.os.pidfd_open',return_value=37,create=True) as open_fd, patch('owned_children.os.close') as close, patch('owned_children.process_info',return_value=identity(start=72600)):
            with self.assertRaisesRegex(ValueError,'^owned-capture-changed$'):
                value._remember(identity())
            close.assert_called_once_with(37)
            with self.assertRaisesRegex(ValueError,'^owned-descendant-uid$'):
                value._remember(identity(uid=1002))
            open_fd.assert_called_once_with(4102,0)
        self.assertEqual(value.entries,{})
        # No native process is launched for this API failure probe. It is a
        # real Popen-shaped handle whose wait must remain exclusively caller
        # owned after capture fails and a cleanup scan later observes the PID.
        child=subprocess.Popen.__new__(subprocess.Popen)
        child.pid=4102;child.returncode=None;child._child_created=False
        child.wait=Mock();child.poll=Mock()
        with patch('owned_children.process_info',return_value=identity()), patch('owned_children.os.pidfd_open',side_effect=OSError('fixture capture failure'),create=True):
            with self.assertRaises(OSError):value.register_root(child)
        self.assertIs(value.roots[owned._key(identity())],child)
        value.entries[owned._key(identity())]=entry(identity());value.scan=Mock()
        with patch('owned_children.os.waitid',create=True) as wait, patch('owned_children.signal.pidfd_send_signal',create=True) as send:
            self.assertEqual(value.reap_adopted(),0);value._signal_descendants(15)
        wait.assert_not_called();send.assert_not_called();child.wait.assert_not_called();child.poll.assert_not_called()

    def test_nonroot_signal_uses_pidfd_and_never_signals_registered_root(self):
        value = registry_fixture(); root = identity(); helper = identity(4103)
        value.entries = {owned._key(root):entry(root),owned._key(helper):entry(helper,38)}
        value.roots[owned._key(root)] = Mock(pid=4102,returncode=None)
        value.scan = Mock()
        with patch('owned_children.process_info',return_value=helper), patch('owned_children.signal.pidfd_send_signal',create=True) as send, patch('owned_children.os.kill') as kill, patch('owned_children.os.killpg',create=True) as kill_group:
            value._signal_descendants(15)
        send.assert_called_once_with(38,15,None,0); kill.assert_not_called(); kill_group.assert_not_called()

    def test_adopted_wait_uses_exact_pidfd_without_stealing_popen_wait(self):
        value = registry_fixture(); root = identity(); helper = identity(4103,state='Z')
        value.entries = {owned._key(root):entry(root),owned._key(helper):entry(helper,38)}
        child = Mock(pid=4102,returncode=None); value.roots[owned._key(root)] = child
        value.scan = Mock()
        with patch('owned_children.process_info',return_value=helper), patch('owned_children.os.P_PIDFD',3,create=True), patch('owned_children.os.WEXITED',4,create=True), patch('owned_children.os.WNOHANG',1,create=True), patch('owned_children.os.waitid',return_value=SimpleNamespace(si_pid=4103,si_code=2,si_status=9),create=True) as wait:
            self.assertEqual(value.reap_adopted(),1)
        wait.assert_called_once_with(3,38,5); child.wait.assert_not_called(); child.poll.assert_not_called()
        self.assertIsNone(child.returncode)
        self.assertEqual(value.entries[owned._key(helper)]['reap'],{'code':2,'status':9})

    def test_wait_echild_with_still_present_adopted_identity_fails(self):
        value = registry_fixture(); row = identity(state='Z')
        value.entries[owned._key(row)] = entry(row); value.scan = Mock()
        with patch('owned_children.process_info',return_value=row), patch('owned_children.os.P_PIDFD',3,create=True), patch('owned_children.os.WEXITED',4,create=True), patch('owned_children.os.WNOHANG',1,create=True), patch('owned_children.os.waitid',side_effect=ChildProcessError(),create=True):
            with self.assertRaisesRegex(ValueError,'^owned-reap-not-child$'):
                value.reap_adopted()

    def test_zero_proof_requires_caller_reaped_roots_and_no_remaining_children(self):
        value = registry_fixture(); child = Mock(pid=4102,returncode=None)
        value.roots[owned._key(identity())] = child
        value.scan = Mock(return_value=[]); value.reap_adopted = Mock()
        with self.assertRaisesRegex(ValueError,'^owned-roots-not-reaped$'):
            value.assert_empty()
        child.returncode = 23
        with patch('owned_children._direct_children',return_value={4103}):
            with self.assertRaisesRegex(ValueError,'^owned-children-remain$'):
                value.assert_empty()
        child.wait.assert_not_called(); child.poll.assert_not_called()

    def test_cleanup_deadlines_are_bounded_and_boolean_is_not_seconds(self):
        value = registry_fixture()
        for duration in [True,False,0,-1,11,'3',float('inf'),float('nan')]:
            for key in ['term_seconds','kill_seconds']:
                with self.subTest(duration=str(duration),key=key):
                    with self.assertRaisesRegex(ValueError,'^owned-cleanup-deadline$'):
                        value.cleanup(**{key:duration})


def wait_for(predicate, seconds=4):
    deadline = time.monotonic()+seconds
    while time.monotonic() < deadline:
        result = predicate()
        if result:
            return result
        time.sleep(.01)
    raise AssertionError('native-fixture-deadline')


def expect_error(code, operation):
    try:
        operation()
    except ValueError as error:
        assert str(error) == code, (code,str(error))
    else:
        raise AssertionError('expected '+code)


DETACHED_SCRIPT = r'''
import json, os, signal, sys, time
os.read(int(sys.argv[1]), 1); os.close(int(sys.argv[1]))
if os.fork() == 0:
    os.setsid()
    if os.fork() != 0:
        os._exit(0)
    signal.signal(signal.SIGTERM, signal.SIG_IGN)
    # A bounded self-exit prevents an indefinitely abandoned fixture on a
    # supervisor crash. Normal cleanup proves SIGKILL before this deadline.
    signal.alarm(15)
    with open(sys.argv[2], 'w') as out:
        json.dump({'pid':os.getpid(),'ppid':os.getppid(),
                   'pgrp':os.getpgrp(),'session':os.getsid(0)},out)
    while True: time.sleep(.05)
os._exit(23)
'''


def run_scenario(name):
    assert LINUX, 'native-linux-required'
    children = []; registry = None
    with tempfile.TemporaryDirectory(prefix='echs-owned-children-',dir=WORK_DIR) as directory:
        try:
            if name == 'preexisting':
                child = subprocess.Popen([sys.executable,'-c','import time; time.sleep(15)'],stdin=subprocess.DEVNULL,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
                children.append(child)
                expect_error('owned-preexisting-children',owned.OwnedChildren.enable)
                assert owned._subreaper() == 0
                child.terminate(); assert child.wait(timeout=3) < 0
                return {'case':name,'preexisting_child_rejected':True,'subreaper_unchanged':True}
            if name == 'sigchld':
                signal.signal(signal.SIGCHLD,signal.SIG_IGN)
                expect_error('owned-sigchld-handler',owned.OwnedChildren.enable)
                signal.signal(signal.SIGCHLD,signal.SIG_DFL)
                assert owned._subreaper() == 0
                return {'case':name,'ignored_sigchld_rejected':True}
            registry = owned.OwnedChildren.enable()
            if name == 'enable-guards':
                expect_error('owned-dedicated-supervisor-required',owned.OwnedChildren.enable)
                # A forked process must not operate its parent's inherited
                # registry. The raw fork is not a registered Popen root.
                pid = os.fork()
                if pid == 0:
                    try:
                        expect_error('owned-supervisor-forked',registry.scan)
                        os._exit(0)
                    except BaseException:
                        os._exit(97)
                result = os.waitpid(pid,0)
                assert result == (pid,0)
                return dict(registry.assert_empty(),case=name,inherited_registry_rejected=True)
            if name == 'root-wait':
                child = subprocess.Popen([sys.executable,'-c','import sys,time; time.sleep(.05); sys.exit(29)'],stdin=subprocess.DEVNULL,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
                children.append(child); registry.register_root(child)
                expect_error('owned-root-already-observed',lambda:registry.register_root(child))
                wait_for(lambda: owned.process_info(child.pid)['state'] == 'Z')
                assert registry.reap_adopted() == 0 and child.returncode is None
                expect_error('owned-roots-not-reaped',registry.assert_empty)
                assert child.wait(timeout=3) == 29
                return dict(registry.cleanup(term_seconds=.1,kill_seconds=1),case=name,popen_returncode=29)
            if name == 'live-root':
                child = subprocess.Popen([sys.executable,'-c','import time; time.sleep(15)'],stdin=subprocess.DEVNULL,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
                children.append(child); registry.register_root(child)
                expect_error('owned-roots-not-reaped',lambda:registry.cleanup(term_seconds=.05,kill_seconds=.05))
                assert child.poll() is None and registry.signals == 0
                child.terminate(); assert child.wait(timeout=3) < 0
                return dict(registry.assert_empty(),case=name,live_root_not_signalled=True)
            if name in ('detached','late-adoption'):
                marker = Path(directory)/'detached.json'
                read_fd,write_fd = os.pipe()
                try:
                    child = subprocess.Popen([sys.executable,'-c',DETACHED_SCRIPT,str(read_fd),str(marker)],pass_fds=(read_fd,),start_new_session=True,stdin=subprocess.DEVNULL,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
                    children.append(child); registry.register_root(child)
                    os.close(read_fd); read_fd = None
                    os.write(write_fd,b'x'); os.close(write_fd); write_fd = None
                finally:
                    for fd in (read_fd,write_fd):
                        if fd is not None: os.close(fd)
                wait_for(lambda:marker.is_file() and marker.stat().st_size > 0)
                # The file is closed before the signal-ignoring grandchild
                # loops; tolerate only the short regular-file write window.
                def read_marker():
                    try: return json.loads(marker.read_text())
                    except json.JSONDecodeError: return None
                detached = wait_for(read_marker)
                wait_for(lambda: owned.process_info(child.pid)['state'] == 'Z')
                if name == 'detached':
                    registry.reap_adopted()
                    assert child.returncode is None  # Registry did not wait it.
                assert child.wait(timeout=3) == 23
                # late-adoption deliberately performs NO scan until after the
                # root has exited and both fork/setsid edges have disappeared.
                found = registry.scan()
                assert any(v['pid'] == detached['pid'] and v['ppid'] == os.getpid() for v in found)
                detached_identity = next(v for v in found if v['pid'] == detached['pid'])
                assert detached['pgrp'] != child.pid and detached['session'] != child.pid
                proof = registry.cleanup(term_seconds=.1,kill_seconds=1)
                assert proof['adopted_descendants_reaped'] >= 1
                assert registry.entries[owned._key(detached_identity)]['reap'] == {'code':os.CLD_KILLED,'status':signal.SIGKILL}
                assert owned.process_info(detached['pid']) is None
                assert child.returncode == 23
                return dict(proof,case=name,popen_returncode=23,detached_session=True,term_ignored_then_killed=True)
            raise ValueError('unknown-native-case')
        finally:
            # Only this scenario's direct Popen handles are killed/waited here.
            # The registry separately owns exact descendant identities.
            for child in children:
                if child.poll() is None:
                    child.kill()
                child.wait(timeout=3)
            if registry is not None:
                registry.cleanup(term_seconds=.1,kill_seconds=1)


@unittest.skipUnless(LINUX,'Linux /proc, subreaper and pidfd native evidence unavailable on this platform')
class NativeLinuxTests(unittest.TestCase):
    def run_case(self,name):
        command = [sys.executable,'-B',str(Path(__file__).resolve()),'--scenario',name]
        if WORK_DIR is not None: command += ['--work-dir',str(WORK_DIR)]
        completed = subprocess.run(command,stdin=subprocess.DEVNULL,capture_output=True,text=True,timeout=22)
        self.assertEqual(completed.returncode,0,completed.stderr[-6000:])
        self.assertLess(len(completed.stdout),16000)
        proof = json.loads(completed.stdout)
        self.assertEqual(proof['case'],name)
        if 'descendants_remaining' in proof:
            self.assertEqual(proof['descendants_remaining'],0)
            self.assertEqual(proof['registered_roots_reaped_by_registry'],0)
        return proof

    def test_actual_detached_double_fork_cleanup_and_popen_status(self):
        proof = self.run_case('detached')
        self.assertEqual(proof['popen_returncode'],23)
        self.assertTrue(proof['detached_session'] and proof['term_ignored_then_killed'])

    def test_actual_orphan_adopted_before_first_scan(self):
        self.run_case('late-adoption')

    def test_actual_zombie_root_remains_owned_by_popen_wait(self):
        self.assertEqual(self.run_case('root-wait')['popen_returncode'],29)

    def test_actual_live_registered_root_is_not_terminated_by_registry(self):
        self.assertTrue(self.run_case('live-root')['live_root_not_signalled'])

    def test_actual_preexisting_child_is_rejected_before_prctl(self):
        self.run_case('preexisting')

    def test_actual_ignored_sigchld_is_rejected(self):
        self.run_case('sigchld')

    def test_actual_second_enable_and_forked_registry_are_rejected(self):
        self.run_case('enable-guards')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--scenario',choices=['detached','late-adoption','root-wait','live-root','preexisting','sigchld','enable-guards'])
    parser.add_argument('--require-linux',action='store_true')
    parser.add_argument('--work-dir',type=Path)
    args,unittest_args = parser.parse_known_args()
    WORK_DIR = args.work_dir.resolve() if args.work_dir else None
    if args.scenario:
        print(json.dumps(run_scenario(args.scenario),sort_keys=True))
    else:
        program = unittest.main(argv=[sys.argv[0],*unittest_args],exit=False,verbosity=2)
        result = program.result
        strict_skips = args.require_linux and bool(result.skipped)
        print(json.dumps({'tests':result.testsRun,'failures':len(result.failures),'errors':len(result.errors),
                          'skipped':len(result.skipped),'require_linux':args.require_linux,
                          'native_linux_available':LINUX,'status':'FAIL' if not result.wasSuccessful() or strict_skips else ('PARTIAL' if result.skipped else 'PASS')},sort_keys=True))
        sys.exit(0 if result.wasSuccessful() and not strict_skips else 1)
