"""Process ownership guards and real Linux children; no Chromium/SQL claim."""
import argparse
import hashlib
import io
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

import processes

WORK_DIR = None
REAL_PATH = Path
LINUX = sys.platform == 'linux' and Path('/proc').is_dir()
ROUTE = '/devtools/browser/12345678-1234-1234-1234-123456789abc'


def identity(pid=4102, **changes):
    return dict({'pid':pid, 'ppid':1, 'pgrp':pid, 'session':pid, 'start':72599, 'uid':1001, 'state':'S'}, **changes)


def owned():
    value = processes.OwnedProcess.__new__(processes.OwnedProcess)
    value.identity = identity(); value.child = Mock(pid=4102,returncode=None); value.closed = False; value.role = 'browser'; value.reap = None
    return value


class GuardTests(unittest.TestCase):
    def setUp(self):
        # Windows has no SIGKILL constant; guard tests model the Linux API while
        # all real process tests below remain explicitly unavailable there.
        linux_signals = patch('processes.signal',SimpleNamespace(SIGTERM=15,SIGKILL=9))
        linux_signals.start(); self.addCleanup(linux_signals.stop)

    def temporary(self):
        directory = tempfile.TemporaryDirectory(prefix='echs-process-guard-', dir=WORK_DIR)
        self.addCleanup(directory.cleanup)
        return Path(directory.name).resolve()

    def proc_map(self, root):
        def mapped(value):
            text = str(value)
            if text == '/proc':
                return root
            if text.startswith('/proc/'):
                return root / text[6:]
            return REAL_PATH(value)
        return mapped

    def test_stat_parser_preserves_start_group_session_with_complex_comm(self):
        root = self.temporary(); directory = root / '4102'; directory.mkdir()
        fields = ['S','1','4102','4102'] + ['0'] * 15 + ['72599']
        (directory / 'stat').write_text('4102 (fixture ) complex name) ' + ' '.join(fields))
        with patch('processes.Path', self.proc_map(root)):
            result = processes.process_info(4102)
        self.assertEqual(result, identity(uid=directory.stat().st_uid))

    def test_missing_process_is_distinct_from_forbidden_pid(self):
        root = self.temporary()
        with patch('processes.Path', self.proc_map(root)):
            self.assertIsNone(processes.process_info(4102))
            for pid in [0, 1, -1, True, '4102']:
                with self.subTest(pid_type=type(pid).__name__):
                    with self.assertRaisesRegex(ValueError, '^process-pid$'):
                        processes.process_info(pid)

    def test_inventory_skips_pid_one_and_unrelated_groups_and_handles_exit_race(self):
        root = self.temporary()
        for name in ['1','4102','4103','4104','self']:
            (root / name).mkdir()
        def read(pid):
            if pid == 4102:
                return identity()
            if pid == 4103:
                return identity(4103)
            if pid == 4104:
                raise ProcessLookupError()
            self.fail('Inventory attempted forbidden PID1 or nonnumeric entry')
        with patch('processes.Path', self.proc_map(root)), patch('processes.process_info', side_effect=read):
            self.assertEqual(processes.group_members(4102,4102,1001), [identity()])

    def test_inventory_permission_failure_cannot_prove_absence(self):
        root = self.temporary(); (root / '4102').mkdir()
        with patch('processes.Path', self.proc_map(root)), patch('processes.process_info', side_effect=PermissionError()):
            with self.assertRaises((PermissionError, ValueError)):
                processes.group_members(4102,4102,(root / '4102').stat().st_uid)

    def test_foreign_owner_or_session_in_group_is_refused(self):
        root = self.temporary(); (root / '4102').mkdir()
        for row in [identity(uid=1002), identity(session=4103)]:
            with self.subTest(changed=row['uid'] != 1001), patch('processes.Path', self.proc_map(root)), patch('processes.process_info', return_value=row):
                with self.assertRaisesRegex(ValueError, '^process-group-owner$'):
                    processes.group_members(4102,4102,1001)

    def test_reused_leader_is_never_signalled(self):
        value = owned()
        with patch('processes.process_info', return_value=identity(start=72600)), patch('processes.os.killpg', create=True) as kill:
            with self.assertRaisesRegex(ValueError, '^process-identity-changed$'):
                value.close()
            kill.assert_not_called()
            value.child.kill.assert_not_called()
        self.assertFalse(value.closed)
        verified = owned(); verified.members = Mock(side_effect=PermissionError('inventory'))
        with patch('processes.process_info',return_value=identity()), patch('processes.os.killpg',create=True) as kill:
            with self.assertRaises(PermissionError):
                verified.close()
            kill.assert_not_called()
        verified.child.kill.assert_called_once_with(); verified.child.wait.assert_called_once_with(timeout=3)
        self.assertFalse(verified.closed)

    def test_unconfirmed_cleanup_remains_failure_after_bounded_signals(self):
        value = owned(); value.members = Mock(return_value=[identity()])
        clock = iter(range(0,100,4))
        with patch('processes.os.killpg', create=True) as kill, patch('processes.time.monotonic', side_effect=lambda:next(clock)), patch('processes.time.sleep'), patch('processes.process_info',return_value=None):
            with self.assertRaisesRegex(ValueError, '^process-group-remains$'):
                value.close()
        self.assertEqual([call.args for call in kill.call_args_list], [(4102,15),(4102,9)])
        self.assertFalse(value.closed)
        value = owned(); value.reap = Mock(side_effect=ValueError('owned-descendant-unconfirmed'))
        value.members = Mock(side_effect=[[identity()],[],[],[]])
        with patch('processes.os.killpg',create=True) as kill:
            with self.assertRaisesRegex(ValueError,'^process-descendant-cleanup-unknown$'):
                value.close()
            kill.assert_called_once_with(4102,15)
        value.child.wait.assert_called_once_with(timeout=1)
        self.assertFalse(value.closed)

    def test_confirmed_cleanup_only_targets_owned_group_and_is_idempotent(self):
        value = owned(); value.members = Mock(side_effect=[[identity()],[],[],[]]); value.reap = Mock()
        with patch('processes.os.killpg', create=True) as kill:
            result = value.close()
            self.assertEqual(result, {'role':'browser','reaped':True,'group_members_remaining':0})
            self.assertEqual(value.close(), result)
            kill.assert_called_once_with(4102,signal.SIGTERM)
        value.child.wait.assert_called_once_with(timeout=1)
        self.assertGreaterEqual(value.reap.call_count,2)
        raced = owned(); raced.members = Mock(side_effect=[[identity()],[],[],[]])
        with patch('processes.os.killpg',create=True,side_effect=ProcessLookupError()):
            self.assertEqual(raced.close()['group_members_remaining'],0)
        raced.child.wait.assert_called_once_with(timeout=1)
        self.assertTrue(raced.closed)

    def test_constructor_capture_failure_reaps_direct_child_without_unowned_group_signal(self):
        child = Mock(pid=4102); fake_os = SimpleNamespace(name='posix',getuid=lambda:1001,killpg=Mock())
        fake_path = Mock(); fake_path.is_dir.return_value = True
        with patch('processes.os', fake_os), patch('processes.Path', return_value=fake_path), patch('processes.subprocess.Popen',return_value=child), patch('processes.process_info',return_value=None):
            with self.assertRaisesRegex(ValueError, '^process-identity$'):
                processes.OwnedProcess(['python','fixture.py'],env={},cwd='.',role='browser')
        child.kill.assert_called_once_with(); child.wait.assert_called_once_with(timeout=3); fake_os.killpg.assert_not_called()

    def test_launch_has_private_session_and_wait_requires_positive_bounded_deadline(self):
        child = Mock(pid=4102); fake_os = SimpleNamespace(name='posix',getuid=lambda:1001)
        fake_path = Mock(); fake_path.is_dir.return_value = True
        with patch('processes.os',fake_os), patch('processes.Path',return_value=fake_path), patch('processes.subprocess.Popen',return_value=child) as launch, patch('processes.process_info',return_value=identity()):
            value = processes.OwnedProcess(['python','fixture.py'],env={'LANG':'C'},cwd='.',role='driver')
        self.assertIs(launch.call_args.kwargs['start_new_session'],True)
        self.assertIs(launch.call_args.kwargs['close_fds'],True)
        self.assertEqual([launch.call_args.kwargs[key] for key in ['stdin','stdout','stderr']],[subprocess.DEVNULL]*3)
        target = SimpleNamespace(fileno=lambda:73)
        with patch('processes.os',fake_os), patch('processes.Path',return_value=fake_path), patch('processes.subprocess.Popen',return_value=child) as capture, patch('processes.process_info',return_value=identity()):
            processes.OwnedProcess(['python','fixture.py'],env={},cwd='.',role='driver',stdout=target,stderr=target)
            self.assertIs(capture.call_args.kwargs['stdout'],target)
            self.assertIs(capture.call_args.kwargs['stderr'],target)
            capture.reset_mock()
            for invalid in [subprocess.PIPE,73,SimpleNamespace(fileno=lambda:-1),SimpleNamespace(fileno=lambda:True)]:
                with self.assertRaisesRegex(ValueError,'^process-output-handle$'):
                    processes.OwnedProcess(['python','fixture.py'],env={},cwd='.',role='driver',stdout=invalid)
            capture.assert_not_called()
        for deadline in [0,-1,901,True,'10',float('nan')]:
            with self.subTest(type=type(deadline).__name__):
                with self.assertRaisesRegex(ValueError,'^process-deadline$'):
                    value.wait(deadline)
        child.wait.assert_not_called()

    def test_cdp_discovery_rejects_malformed_oversize_or_linked_file(self):
        root = self.temporary(); path = root / 'DevToolsActivePort'
        path.write_bytes(('45678\n'+ROUTE+'\n').encode())
        self.assertEqual(processes.cdp_endpoint(root),'ws://127.0.0.1:45678'+ROUTE)
        for raw in [b'80\n'+ROUTE.encode(),b'45678\n/other\n',b'45678\n'+ROUTE.encode()+b'\nextra',b'x'*257,b'\xff']:
            with self.subTest(length=len(raw)):
                path.write_bytes(raw)
                with self.assertRaises(ValueError):
                    processes.cdp_endpoint(root)
        fake = Mock(); fake.is_symlink.return_value = True
        fake_root = Mock(); fake_root.__truediv__ = Mock(return_value=fake)
        with patch('processes.Path',return_value=fake_root):
            with self.assertRaisesRegex(ValueError,'^cdp-discovery-file$'):
                processes.cdp_endpoint(root)

    def test_socket_inventory_requires_exact_single_loopback_listener(self):
        root = self.temporary(); (root / 'net').mkdir(); path = root / 'net/tcp'; ipv6 = root / 'net/tcp6'
        ipv6.write_text('header\n')
        def record(address='0100007F',state='0A'):
            return f'0: {address}:B26E 00000000:0000 {state} 0:0 0:0 0 1001 0 900001\n'
        with patch('processes.Path',self.proc_map(root)):
            path.write_text('header\n'+record())
            self.assertEqual(processes.socket_inode(45678),'900001')
            self.assertFalse(processes.listener_absent(45678))
            for body in [record('00000000'),record('0200007F'),record()+record(),record(state='01'),'']:
                path.write_text('header\n'+body)
                with self.assertRaises(ValueError):
                    processes.socket_inode(45678)
            self.assertTrue(processes.listener_absent(45678))
            ipv6.write_text('header\n'+record('00000000000000000000000000000000'))
            self.assertFalse(processes.listener_absent(45678))
            ipv6.unlink()
            with self.assertRaisesRegex(ValueError,'^listener-inventory-missing$'):
                processes.listener_absent(45678)

    def test_cdp_endpoint_rejects_foreign_origin_before_socket_lookup(self):
        child = Mock()
        for endpoint in ['http://127.0.0.1:45678'+ROUTE,'ws://localhost:45678'+ROUTE,'ws://127.0.0.2:45678'+ROUTE,'ws://user@127.0.0.1:45678'+ROUTE,'ws://@127.0.0.1:45678'+ROUTE,'ws://:password@127.0.0.1:45678'+ROUTE,'ws://127.0.0.1:45678'+ROUTE+'?secret=x','ws://127.0.0.1:45678'+ROUTE+'#fragment']:
            with self.subTest(kind=endpoint.split(':')[0]), patch('processes.socket_inode') as read:
                with self.assertRaisesRegex(ValueError,'^cdp-origin$'):
                    processes.verify_cdp_owner(child,endpoint)
                read.assert_not_called()
        child.members.assert_not_called()

    def test_cdp_socket_inode_must_belong_to_verified_process_member(self):
        root = self.temporary(); directory = root / '4102/fd'; directory.mkdir(parents=True)
        (directory / '3').write_bytes(b'')
        child = Mock(); child.members.return_value = [identity()]
        with patch('processes.Path',self.proc_map(root)), patch('processes.socket_inode',return_value='900001'), patch('processes.os.readlink',return_value='socket:[900001]'):
            self.assertEqual(processes.verify_cdp_owner(child,'ws://127.0.0.1:45678'+ROUTE),{'loopback':True,'owned_browser_listener':True})
        with patch('processes.Path',self.proc_map(root)), patch('processes.socket_inode',return_value='900001'), patch('processes.os.readlink',return_value='socket:[900002]'):
            with self.assertRaisesRegex(ValueError,'^cdp-socket-not-owned$'):
                processes.verify_cdp_owner(child,'ws://127.0.0.1:45678'+ROUTE)


class ActualLinuxTests(unittest.TestCase):
    def setUp(self):
        if not LINUX:
            self.skipTest('Real Linux /proc/process-group prerequisite unavailable')
        directory = tempfile.TemporaryDirectory(prefix='echs-process-actual-',dir=WORK_DIR)
        self.addCleanup(directory.cleanup); self.root = Path(directory.name).resolve()

    def start(self, body):
        child = processes.OwnedProcess([sys.executable,'-B','-c',body,str(self.root)],env=dict(os.environ),cwd=self.root,role='browser')
        self.addCleanup(child.close)
        return child

    def ready(self, child):
        deadline = time.monotonic()+5
        while time.monotonic()<deadline:
            if (self.root / 'ready').is_file():
                return
            if child.child.poll() is not None:
                self.fail('Owned fixture exited before readiness')
            time.sleep(.02)
        self.fail('Owned fixture readiness deadline exceeded')

    def test_native_exited_direct_child_is_reaped_and_group_absence_observed(self):
        child = self.start('raise SystemExit(0)')
        self.assertEqual(child.wait(5),0)
        self.assertEqual(child.close(),{'role':'browser','reaped':True,'group_members_remaining':0})
        self.assertIsNone(processes.process_info(child.identity['pid']))
        # The actual wrapper execs into the registered root rather than creating
        # a second child. Exercise both its 2MiB cap and a lower inherited hard
        # limit; only these owned Linux children receive changed resource limits.
        import resource
        from run import PROTOCOL_LOG_LIMIT, protocol_driver_arguments
        inherited_hard=resource.getrlimit(resource.RLIMIT_FSIZE)[1]
        expected_cap=PROTOCOL_LOG_LIMIT if inherited_hard==resource.RLIM_INFINITY else min(PROTOCOL_LOG_LIMIT,inherited_hard)
        body="""import json,os,resource,signal,sys,time
from pathlib import Path
root=Path(sys.argv[1]);signal.signal(signal.SIGXFSZ,signal.SIG_DFL)
(root/'ready.json').write_text(json.dumps({'pid':os.getpid(),'pgrp':os.getpgrp(),'session':os.getsid(0),'uid':os.getuid(),'limits':resource.getrlimit(resource.RLIMIT_FSIZE)}))
deadline=time.monotonic()+10
while not (root/'begin').exists():
 if time.monotonic()>deadline:raise SystemExit(91)
 time.sleep(.01)
while True:os.write(2,b'x'*4096)
"""
        for name,cap in [('wrapper',expected_cap),('inherited',min(8192,expected_cap))]:
            with self.subTest(cap_case=name):
                directory=self.root/name;directory.mkdir();log=directory/'stderr.bin'
                argv=protocol_driver_arguments([sys.executable,'-B','-c',body,str(directory)])
                if name=='inherited':
                    prefix='import os,resource,sys;resource.setrlimit(resource.RLIMIT_FSIZE,('+str(cap)+','+str(cap)+'));os.execv(sys.argv[1],sys.argv[1:])'
                    argv=[sys.executable,'-B','-c',prefix,*argv]
                with log.open('xb') as output:
                    log.chmod(0o600)
                    wrapped=processes.OwnedProcess(argv,env=dict(os.environ),cwd=directory,role='driver',stderr=output)
                    self.addCleanup(wrapped.close);deadline=time.monotonic()+5
                    while not (directory/'ready.json').is_file():
                        self.assertIsNone(wrapped.child.poll(),'Wrapper exited before identity capture')
                        self.assertLess(time.monotonic(),deadline,'Wrapper identity deadline')
                        time.sleep(.01)
                    # File visibility can precede the final buffered write.
                    while True:
                        try:actual=json.loads((directory/'ready.json').read_bytes());break
                        except json.JSONDecodeError:
                            self.assertLess(time.monotonic(),deadline,'Wrapper identity write deadline');time.sleep(.01)
                    observed=processes.process_info(wrapped.child.pid)
                    for key in ['pid','pgrp','session','uid','start']:self.assertEqual(observed[key],wrapped.identity[key])
                    self.assertEqual(actual,{key:wrapped.identity[key] for key in ['pid','pgrp','session','uid']}|{'limits':[cap,cap]})
                    self.assertEqual(wrapped.child.pid,wrapped.identity['pid']);self.assertEqual(wrapped.identity['pid'],wrapped.identity['pgrp'])
                    self.assertEqual(wrapped.identity['pid'],wrapped.identity['session'])
                    (directory/'begin').write_bytes(b'go')
                    self.assertEqual(wrapped.wait(10),-signal.SIGXFSZ)
                    self.assertEqual(log.stat().st_size,cap);self.assertLessEqual(log.stat().st_size,2097152)
                    self.assertEqual(wrapped.close(),{'role':'driver','reaped':True,'group_members_remaining':0})
                    self.assertIsNone(processes.process_info(wrapped.identity['pid']))

        # Same existing native group: a real pipe must keep draining after its
        # private storage cap, without applying file limits to this child.
        import shutil
        from run import BrowserStderrCapture, BROWSER_STDERR_LIMIT
        from owned_children import OwnedChildren
        registry=OwnedChildren.enable();parent=Path(WORK_DIR or tempfile.gettempdir()).resolve()
        directory=Path(tempfile.mkdtemp(prefix='echs-stderr-native-',dir=parent)).resolve()
        self.assertEqual(directory.parent,parent);private=directory/'secrets';private.mkdir(mode=0o700)
        capture=BrowserStderrCapture(private/'browser-stderr.log',private);flood=None
        def cleanup_capture():
            cleaned=False
            try:
                if flood is not None and not flood.closed:flood.close()
                registry.cleanup(term_seconds=1,kill_seconds=1);registry.assert_empty();cleaned=True
            finally:
                finished=capture.finish(cleaned,timeout=1)
                # An unexpected stuck reader retains its private directory.
                # Never unlink its file while that reader may still use it.
                closed=finished['reader_joined'] and finished['eof_observed'] and not capture.thread.is_alive() and capture.writer.closed and capture.stream.closed and capture.read_fd is None
                if closed:
                    self.assertEqual(directory.resolve().parent,parent);shutil.rmtree(directory)
                self.assertTrue(closed,'Private reader closure incomplete; directory retained')
        self.addCleanup(cleanup_capture)
        body=r"""import json,os,resource,sys,time
from pathlib import Path
root=Path(sys.argv[1]);line=b'[123:456:0912/113000.123456:ERROR:content/browser/network_service_instance_impl.cc:722] SYNTHETIC_PRIVATE_URL_https://private.invalid/session/123\n'
initial=line*2048
view=memoryview(initial)
while view:
 count=os.write(2,view);view=view[count:]
(root/'ready.json').write_text(json.dumps({'initial':len(initial),'limits':resource.getrlimit(resource.RLIMIT_FSIZE)}))
deadline=time.monotonic()+15
while not (root/'continue').exists():
 if time.monotonic()>deadline:raise SystemExit(91)
 time.sleep(.01)
chunk=b'SYNTHETIC_PRIVATE_TAIL_'+b'x'*4073+b'\n'
for _ in range(2048):
 view=memoryview(chunk)
 while view:
  count=os.write(2,view);view=view[count:]
(root/'completed').write_text('complete')
"""
        initial_limits=list(resource.getrlimit(resource.RLIMIT_FSIZE))
        flood=processes.OwnedProcess([sys.executable,'-B','-c',body,str(directory)],env=dict(os.environ),cwd=directory,role='browser',stderr=capture.writer)
        registry.register_root(flood.child);capture.close_writer();deadline=time.monotonic()+8
        while True:
            self.assertIsNone(flood.child.poll(),'Pipe writer exited before cutoff handshake')
            self.assertLess(time.monotonic(),deadline,'Pipe-capacity flood stalled before handshake')
            try:ready=json.loads((directory/'ready.json').read_bytes());break
            except (FileNotFoundError,json.JSONDecodeError):time.sleep(.01)
        self.assertGreater(ready['initial'],131072);self.assertLess(ready['initial'],BROWSER_STDERR_LIMIT)
        self.assertEqual(ready['limits'],initial_limits)
        while capture.path.stat().st_size<ready['initial']:
            self.assertLess(time.monotonic(),deadline,'Reader did not drain the initial pipe burst');time.sleep(.01)
        frozen=capture.snapshot(True);self.assertEqual(frozen['cutoff'],ready['initial'])
        self.assertFalse(frozen['capped']);self.assertFalse(frozen['partial_line']);self.assertFalse(frozen['reader_error'])
        with capture.path.open('rb') as stream:prefix=stream.read(frozen['cutoff']+1)
        self.assertEqual(len(prefix),frozen['cutoff']);self.assertTrue(prefix.endswith(b'\n'))
        (directory/'continue').write_bytes(b'go')
        self.assertEqual(flood.wait(10),0,'Drain/discard stalled the owned pipe writer')
        self.assertTrue((directory/'completed').is_file())
        registry.scan();self.assertEqual(flood.close(),{'role':'browser','reaped':True,'group_members_remaining':0})
        registry.cleanup(term_seconds=1,kill_seconds=1);registry.assert_empty()
        finished=capture.finish(True,timeout=2)
        self.assertTrue(finished['reader_joined']);self.assertTrue(finished['owned_children_reaped']);self.assertTrue(finished['eof_observed'])
        self.assertTrue(capture.capped);self.assertEqual(capture.path.stat().st_size,BROWSER_STDERR_LIMIT)
        self.assertEqual({key:finished[key] for key in frozen},frozen);self.assertEqual(capture.snapshot(True),frozen)
        with capture.path.open('rb') as stream:self.assertEqual(stream.read(frozen['cutoff']),prefix)
        self.assertEqual(resource.getrlimit(resource.RLIMIT_FSIZE),tuple(initial_limits))
        self.assertTrue(capture.writer.closed);self.assertTrue(capture.stream.closed);self.assertIsNone(capture.read_fd)
        self.assertIsNone(processes.process_info(flood.identity['pid']))

    def test_native_term_resistant_direct_child_is_killed_and_reaped(self):
        child = self.start("import signal,time,sys;from pathlib import Path;signal.signal(signal.SIGTERM,signal.SIG_IGN);Path(sys.argv[1],'ready').write_text('ready');time.sleep(30)")
        self.ready(child)
        self.assertEqual(child.close()['group_members_remaining'],0)
        self.assertEqual(child.child.returncode,-signal.SIGKILL)
        self.assertIsNone(processes.process_info(child.identity['pid']))

    def test_native_loopback_listener_identity_and_release(self):
        body = "import socket,time,sys;from pathlib import Path;s=socket.socket();s.bind(('127.0.0.1',0));s.listen(1);p=Path(sys.argv[1]);(p/'DevToolsActivePort').write_text(str(s.getsockname()[1])+'\\n"+ROUTE+"\\n');(p/'ready').write_text('ready');time.sleep(30)"
        child = self.start(body); self.ready(child)
        endpoint = processes.cdp_endpoint(self.root)
        self.assertEqual(processes.verify_cdp_owner(child,endpoint),{'loopback':True,'owned_browser_listener':True})
        from urllib.parse import urlsplit
        port = urlsplit(endpoint).port
        child.close()
        with self.assertRaisesRegex(ValueError,'^cdp-listener-count$'):
            processes.socket_inode(port)
        self.assertTrue(processes.listener_absent(port))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--require-linux',action='store_true')
    parser.add_argument('--work-dir',type=Path)
    parser.add_argument('--report',required=True,type=Path)
    args = parser.parse_args(); WORK_DIR = args.work_dir
    stream = io.StringIO()
    suite = unittest.defaultTestLoader.loadTestsFromModule(__import__(__name__))
    result = unittest.TextTestRunner(stream=stream,verbosity=2).run(suite)
    failed = not result.wasSuccessful() or args.require_linux and bool(result.skipped)
    report = {'contract':'echs.browser-journal.supervisor-tests.v1','status':'FAIL' if failed else 'PARTIAL' if result.skipped else 'PASS',
              'tests':result.testsRun,'failures':len(result.failures),'errors':len(result.errors),'skipped':len(result.skipped),
              'actual_linux_available':LINUX,'required_actual':args.require_linux,
              'skip_reasons':[reason for _,reason in result.skipped],
              'failed_identifiers':[test.id() for test,_ in result.failures+result.errors],
              'sources':[{'path':name,'sha256':hashlib.sha256(Path(__file__).with_name(name).read_bytes()).hexdigest()} for name in ['processes.py','test_supervisor.py']],
              'scope':'Ownership guards and direct Linux child/group/socket tests only; no escaped-descendant, Chromium, browser, SQL or production acceptance.'}
    with args.report.open('x',encoding='utf-8',newline='\n') as out:
        json.dump(report,out,indent=2); out.write('\n')
    print(json.dumps(report))
    raise SystemExit(1 if failed else 0)
