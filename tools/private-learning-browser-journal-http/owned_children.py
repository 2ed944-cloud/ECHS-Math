"""Owned Linux descendants of one dedicated, initially child-free supervisor.

Call enable before *any* launch, register each direct Popen before calling scan,
and leave its wait/poll to its creator. No other thread/handler may reap children.
After root close/wait attempts, cleanup kills only proven non-root descendants,
including helpers that called setsid or were orphaned before the first scan.
This is cooperative fixture supervision, not containment of hostile processes.

Primary contracts: man7.org/linux/man-pages/man2/PR_SET_CHILD_SUBREAPER.2const.html,
man7.org/linux/man-pages/man2/pidfd_open.2.html, pidfd_send_signal.2.html and
waitpid.2.html; docs.python.org/3/library/os.html#os.pidfd_open. Pidfds retain the
signal/wait target across PID reuse; PPID/UID/start observations establish scope.
"""
import ctypes
import math
import os
from pathlib import Path
import select
import signal
import subprocess
import sys
import threading
import time

from processes import process_info

PR_SET_CHILD_SUBREAPER = 36
PR_GET_CHILD_SUBREAPER = 37
MAX_PROC_ENTRIES = 65536
MAX_OWNED = 4096
SCAN_SECONDS = 2.0
_ENABLED_PID = None


class _CaptureRace(ValueError):
    pass


def need(value, code):
    if not value:
        raise ValueError(code)


def _key(value):
    return value['pid'], value['uid'], value['start']


def _subreaper(set_value=None):
    libc = ctypes.CDLL(None, use_errno=True)
    function = libc.prctl
    function.restype = ctypes.c_int
    if set_value is not None:
        result = function(ctypes.c_int(PR_SET_CHILD_SUBREAPER), ctypes.c_ulong(set_value),
                          ctypes.c_ulong(0), ctypes.c_ulong(0), ctypes.c_ulong(0))
    else:
        value = ctypes.c_int()
        result = function(ctypes.c_int(PR_GET_CHILD_SUBREAPER), ctypes.byref(value),
                          ctypes.c_ulong(0), ctypes.c_ulong(0), ctypes.c_ulong(0))
    if result != 0:
        raise OSError(ctypes.get_errno(), 'owned-subreaper-prctl')
    return value.value if set_value is None else None


def _direct_children(pid, deadline):
    """Include children launched by any supervisor thread, not just the leader."""
    found = set()
    tasks = list((Path('/proc') / str(pid) / 'task').iterdir())
    need(0 < len(tasks) < MAX_PROC_ENTRIES, 'owned-thread-inventory')
    for task in tasks:
        need(time.monotonic() < deadline, 'owned-scan-deadline')
        if not task.name.isdigit():
            continue
        try:
            raw = (task / 'children').read_text(encoding='ascii')
        except FileNotFoundError:
            # A supervisor worker can exit; the next scan confirms its children.
            continue
        need(len(raw) < MAX_PROC_ENTRIES * 12, 'owned-children-limit')
        values = raw.split()
        need(all(v.isascii() and v.isdigit() and int(v) > 1 for v in values), 'owned-children-invalid')
        found.update(map(int, values))
    return found


def _inventory(deadline):
    entries = list(Path('/proc').iterdir())
    need(len(entries) < MAX_PROC_ENTRIES, 'owned-proc-inventory-limit')
    result = {}
    for path in entries:
        need(time.monotonic() < deadline, 'owned-scan-deadline')
        if not path.name.isdigit() or int(path.name) <= 1:
            continue
        try:
            value = process_info(int(path.name))
        except ProcessLookupError:
            continue
        # Inaccessible/malformed entries are not silently treated as absence.
        if value is not None:
            need(type(value['ppid']) is int and value['ppid'] >= 0 and value['start'] > 0,
                 'owned-proc-identity')
            result[value['pid']] = value
    return result


def _descendants(table, supervisor):
    children = {}
    for value in table.values():
        children.setdefault(value['ppid'], []).append(value)
    result = {}; pending = [supervisor]
    while pending:
        parent = pending.pop()
        for value in children.get(parent, []):
            need(value['pid'] != supervisor and value['pid'] not in result, 'owned-ancestry-cycle')
            result[value['pid']] = value; pending.append(value['pid'])
            need(len(result) <= MAX_OWNED, 'owned-descendant-limit')
    return result


def _exited(fd):
    poll = select.poll(); poll.register(fd, select.POLLIN | select.POLLHUP | select.POLLERR)
    events = poll.poll(0)
    need(not any(flags & select.POLLNVAL for _, flags in events), 'owned-pidfd-invalid')
    return bool(events)


class OwnedChildren:
    @classmethod
    def enable(cls):
        global _ENABLED_PID
        need(sys.platform == 'linux' and Path('/proc/self/stat').is_file(), 'owned-linux-required')
        need(all(hasattr(os, name) for name in ('pidfd_open', 'waitid', 'P_PIDFD'))
             and hasattr(signal, 'pidfd_send_signal'), 'owned-pidfd-required')
        pid = os.getpid()
        need(pid > 1 and _ENABLED_PID != pid, 'owned-dedicated-supervisor-required')
        need(threading.active_count() == 1 and len(list(Path('/proc/self/task').iterdir())) == 1,
             'owned-enable-before-threads')
        need(signal.getsignal(signal.SIGCHLD) == signal.SIG_DFL, 'owned-sigchld-handler')
        need(_subreaper() == 0, 'owned-preexisting-subreaper')
        owner = process_info(pid)
        need(owner is not None and owner['uid'] == os.getuid() == os.geteuid(), 'owned-supervisor-identity')
        deadline = time.monotonic() + SCAN_SECONDS
        need(not _direct_children(pid, deadline) and not _descendants(_inventory(deadline), pid),
             'owned-preexisting-children')
        _subreaper(1)
        try:
            need(_subreaper() == 1, 'owned-subreaper-not-enabled')
            need(not _direct_children(pid, deadline), 'owned-child-during-enable')
            # Probe kernel support before any child can be launched.
            fd = os.pidfd_open(pid, 0)
            try:
                signal.pidfd_send_signal(fd, 0, None, 0)
            finally:
                os.close(fd)
        except BaseException:
            _subreaper(0)
            raise
        result = cls.__new__(cls)
        result.owner = owner; result.entries = {}; result.roots = {}
        result.reaped = 0; result.signals = 0; result.scans = 0
        _ENABLED_PID = pid
        return result

    def _guard(self):
        need(os.getpid() == self.owner['pid'], 'owned-supervisor-forked')
        current = process_info(self.owner['pid'])
        need(current is not None and _key(current) == _key(self.owner)
             and current['uid'] == os.getuid() == os.geteuid(), 'owned-supervisor-changed')
        need(_subreaper() == 1 and signal.getsignal(signal.SIGCHLD) == signal.SIG_DFL,
             'owned-supervision-changed')
        for key, child in self.roots.items():
            need(child.pid == key[0], 'owned-root-handle-changed')

    def _remember(self, value):
        need(value['pid'] != self.owner['pid'] and value['uid'] == self.owner['uid'], 'owned-descendant-uid')
        key = _key(value)
        if key in self.entries:
            entry = self.entries[key]
            need(entry['fd'] is not None, 'owned-retired-identity-reused')
            entry['last'] = value
            return entry
        need(len(self.entries) < MAX_OWNED, 'owned-registry-limit')
        try:
            fd = os.pidfd_open(value['pid'], 0)
        except ProcessLookupError:
            return None
        try:
            current = process_info(value['pid'])
            if current is None:
                os.close(fd); return None
            if _key(current) != key or current['ppid'] != value['ppid']:
                raise _CaptureRace('owned-capture-changed')
            entry = {'identity':dict(value), 'last':current, 'fd':fd, 'reap':None}
            self.entries[key] = entry
            return entry
        except BaseException:
            os.close(fd)
            raise

    def register_root(self, child):
        self._guard()
        need(isinstance(child, subprocess.Popen) and child.returncode is None, 'owned-popen-root-required')
        value = process_info(child.pid)
        need(value is not None and value['ppid'] == self.owner['pid'], 'owned-root-parent')
        need(value['uid'] == self.owner['uid'] and type(value['start']) is int and value['start'] > 0,
             'owned-root-identity')
        key = _key(value)
        need(key not in self.roots and key not in self.entries, 'owned-root-already-observed')
        # Reserve wait ownership before pidfd capture can fail. The caller has
        # already created this direct Popen and must retain its wait even if a
        # later cleanup scan is the first successful descendant observation.
        self.roots[key] = child
        entry = self._remember(value)
        need(entry is not None, 'owned-root-disappeared')
        return dict(entry['identity'])

    def scan(self, *, _deadline=None):
        self._guard(); deadline = time.monotonic() + SCAN_SECONDS
        if _deadline is not None:
            deadline = min(deadline, _deadline)
        for _ in range(3):
            table = _inventory(deadline); found = _descendants(table, self.owner['pid'])
            direct = _direct_children(self.owner['pid'], deadline)
            if not direct.issubset(found):
                continue  # Orphan adoption raced this snapshot; retry, never omit it.
            complete = True
            for key, entry in self.entries.items():
                if entry['fd'] is None:
                    continue
                current = process_info(key[0])
                if current is None or _key(current) != key:
                    need(_exited(entry['fd']), 'owned-identity-changed')
                    os.close(entry['fd']); entry['fd'] = None; entry['last'] = None
                elif key[0] not in found or _key(found[key[0]]) != key:
                    complete = False
            if not complete:
                continue
            confirmed = {}
            for value in found.values():
                current = process_info(value['pid'])
                if current is None:
                    continue  # The inventory may include a just-reaped child.
                if _key(current) != _key(value) or current['ppid'] != value['ppid']:
                    complete = False; break
                try:
                    if self._remember(current) is not None:
                        confirmed[current['pid']] = current
                except _CaptureRace:
                    complete = False; break
            if not complete:
                continue
            # A second direct-child observation catches launches/adoptions during
            # capture. Every live registered child still belongs to Popen.wait.
            if not _direct_children(self.owner['pid'], deadline).issubset(confirmed):
                continue
            self.scans += 1
            return [dict(value) for value in confirmed.values()]
        raise ValueError('owned-inventory-raced-or-incomplete')

    def reap_adopted(self, *, _deadline=None):
        self.scan(_deadline=_deadline); count = 0
        for key, entry in list(self.entries.items()):
            if key in self.roots or entry['fd'] is None:
                continue
            current = process_info(key[0])
            if current is None:
                continue
            need(_key(current) == key, 'owned-reap-identity')
            if current['ppid'] != self.owner['pid']:
                continue
            try:
                result = os.waitid(os.P_PIDFD, entry['fd'], os.WEXITED | os.WNOHANG)
            except ChildProcessError:
                need(process_info(key[0]) is None, 'owned-reap-not-child')
                continue
            if result is not None:
                need(result.si_pid == key[0], 'owned-reap-result')
                # Keep the exact child's terminal cause/status internally. A
                # count of sent signals cannot prove which signal ended it.
                need(type(result.si_code) is int and type(result.si_status) is int,
                     'owned-reap-status')
                entry['reap'] = {'code':result.si_code, 'status':result.si_status}
                count += 1; self.reaped += 1
        return count

    def _signal_descendants(self, sig, *, _deadline=None):
        self.scan(_deadline=_deadline)
        for key, entry in list(self.entries.items()):
            if key in self.roots or entry['fd'] is None:
                continue
            current = process_info(key[0])
            if current is None:
                continue
            need(_key(current) == key, 'owned-signal-identity')
            if current['state'] == 'Z':
                continue
            # Never signal by PID or group. A stale pidfd cannot target a reused
            # PID, even if exit races this final UID/start comparison.
            try:
                signal.pidfd_send_signal(entry['fd'], sig, None, 0)
                self.signals += 1
            except ProcessLookupError:
                pass

    def cleanup(self, *, term_seconds=3, kill_seconds=3):
        self._guard()
        for value in (term_seconds, kill_seconds):
            need(type(value) in (int, float) and math.isfinite(value) and 0 < value <= 10,
                 'owned-cleanup-deadline')
        start = time.monotonic()
        # Both signal phases share absolute deadlines. Final inventory has at
        # most SCAN_SECONDS extra; a slow/incomplete /proc scan remains failure.
        final_deadline = start + term_seconds + kill_seconds + SCAN_SECONDS
        for sig, deadline in ((signal.SIGTERM, start + term_seconds),
                              (signal.SIGKILL, start + term_seconds + kill_seconds)):
            while time.monotonic() < deadline:
                self._signal_descendants(sig, _deadline=final_deadline)
                self.reap_adopted(_deadline=final_deadline)
                if not self.scan(_deadline=final_deadline):
                    return self.assert_empty(_deadline=final_deadline)
                time.sleep(min(.025, max(0, deadline-time.monotonic())))
        return self.assert_empty(_deadline=final_deadline)

    def assert_empty(self, *, _deadline=None):
        # Two complete observations, including all supervisor threads' children.
        self.scan(_deadline=_deadline); self.reap_adopted(_deadline=_deadline)
        remaining = self.scan(_deadline=_deadline)
        need(all(child.returncode is not None for child in self.roots.values()), 'owned-roots-not-reaped')
        need(not remaining, 'owned-descendants-remain')
        deadline = time.monotonic() + SCAN_SECONDS
        if _deadline is not None:
            deadline = min(deadline, _deadline)
        need(not _direct_children(self.owner['pid'], deadline), 'owned-children-remain')
        return {'subreaper_enabled':True, 'registered_roots':len(self.roots),
                'registered_roots_reaped_by_registry':0, 'descendants_observed':len(self.entries),
                'adopted_descendants_reaped':self.reaped, 'pidfd_signals_sent':self.signals,
                'complete_scans':self.scans, 'descendants_remaining':0}
