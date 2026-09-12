"""Linux child-session ownership for disposable browser fixtures only."""
import os
from pathlib import Path
import signal
import subprocess
import time


def need(value, code):
    if not value:
        raise ValueError(code)


def process_info(pid):
    need(type(pid) is int and pid > 1, 'process-pid')
    path = Path('/proc') / str(pid)
    try:
        value = (path / 'stat').read_text().rsplit(') ', 1)[1].split()
        return {'pid': pid, 'ppid': int(value[1]), 'pgrp': int(value[2]), 'session': int(value[3]),
                'start': int(value[19]), 'uid': path.stat().st_uid, 'state': value[0]}
    except FileNotFoundError:
        return None


def group_members(group, session, uid):
    need(type(group) is int and group > 1 and session == group and type(uid) is int, 'process-group')
    entries = list(Path('/proc').iterdir()); need(len(entries) < 65536, 'process-inventory-limit')
    result = []
    for item in entries:
        if item.name.isdigit() and int(item.name) > 1:
            try:
                value = process_info(int(item.name))
            except ProcessLookupError:
                continue
            except PermissionError:
                # Different-UID processes are explicitly outside this owner.
                # An unreadable process of our UID makes the inventory unknown.
                try:
                    need(item.stat().st_uid != uid, 'process-owned-inventory-unreadable')
                except FileNotFoundError:
                    pass
                continue
            if value and value['pgrp'] == group:
                need(value['session'] == session and value['uid'] == uid, 'process-group-owner')
                result.append(value)
    return result


class OwnedProcess:
    def __init__(self, argv, *, env, cwd, role, reap=None, stdout=None, stderr=None):
        need(os.name == 'posix' and Path('/proc').is_dir(), 'linux-process-supervisor')
        need(role in ('http','browser','driver') and type(argv) is list and argv and all(type(x) is str for x in argv), 'process-launch')
        need(reap is None or callable(reap), 'process-reap-callback')
        for handle in (stdout,stderr):
            need(handle is None or (hasattr(handle,'fileno') and type(handle.fileno()) is int and handle.fileno()>=0), 'process-output-handle')
        self.role = role; self.child = None; self.identity = None; self.closed = False; self.reap = reap
        self.child = subprocess.Popen(argv, cwd=cwd, env=env, stdin=subprocess.DEVNULL,
                                      stdout=subprocess.DEVNULL if stdout is None else stdout,
                                      stderr=subprocess.DEVNULL if stderr is None else stderr,
                                      start_new_session=True, close_fds=True)
        # The child remains unreaped until this identity is captured, including
        # an immediately exiting child. No process-name based ownership is used.
        try:
            self.identity = process_info(self.child.pid)
            need(self.identity is not None and self.identity['pgrp'] == self.child.pid
                 and self.identity['session'] == self.child.pid and self.identity['uid'] == os.getuid(), 'process-identity')
        except Exception:
            # A startup failure cannot lose the Popen-owned direct child. Kill
            # its group only if its independent identity was fully established.
            value = self.identity
            if value and value['pgrp'] == self.child.pid and value['session'] == self.child.pid and value['uid'] == os.getuid():
                try:
                    os.killpg(self.child.pid, signal.SIGKILL)
                except ProcessLookupError:
                    pass
            else:
                self.child.kill()
            self.child.wait(timeout=3)
            raise

    def members(self):
        need(self.identity is not None, 'process-not-owned')
        leader = process_info(self.identity['pid'])
        if leader:
            need(all(leader[key] == self.identity[key] for key in ('pid','pgrp','session','start','uid')), 'process-identity-changed')
        return group_members(self.identity['pgrp'], self.identity['session'], self.identity['uid'])

    def wait(self, timeout):
        need(type(timeout) in (int,float) and 0 < timeout <= 900, 'process-deadline')
        return self.child.wait(timeout=timeout)

    def close(self):
        if self.closed:
            return {'role':self.role,'reaped':True,'group_members_remaining':0}
        need(self.child is not None and self.identity is not None, 'process-cleanup-unknown')
        callback_failed=False
        def adopted():
            nonlocal callback_failed
            if self.reap:
                try:
                    self.reap()
                except Exception:
                    callback_failed=True
        adopted()
        try:
            for sig, seconds in ((signal.SIGTERM, 3), (signal.SIGKILL, 3)):
                values = self.members()
                if not values:
                    break
                try:
                    os.killpg(self.identity['pgrp'], sig)
                except ProcessLookupError:
                    pass
                deadline = time.monotonic() + seconds
                while time.monotonic() < deadline:
                    self.child.poll();adopted()
                    if not self.members():
                        break
                    time.sleep(.025)
            self.child.wait(timeout=1);adopted()
            need(not self.members(), 'process-group-remains')
        except Exception:
            # Failure to inventory descendants cannot bypass cleanup of a
            # separately re-verified, unreaped direct Popen child. This narrow
            # fallback never signals a group or an identity-mismatched PID.
            if self.child.returncode is None:
                leader=process_info(self.identity['pid'])
                if leader and all(leader[key]==self.identity[key] for key in ('pid','pgrp','session','start','uid')):
                    self.child.kill();self.child.wait(timeout=3)
            raise
        need(not callback_failed,'process-descendant-cleanup-unknown')
        self.closed = True
        return {'role':self.role,'reaped':True,'group_members_remaining':0}


def cdp_endpoint(profile):
    path = Path(profile) / 'DevToolsActivePort'
    need(not path.is_symlink() and path.is_file(), 'cdp-discovery-file')
    raw = path.read_bytes(); need(len(raw) <= 256, 'cdp-discovery-size')
    lines = raw.decode('ascii').splitlines()
    need(len(lines) == 2 and lines[0].isdigit() and 1024 <= int(lines[0]) <= 65535, 'cdp-discovery-port')
    import re
    need(re.fullmatch('/devtools/browser/[a-f0-9-]{36}', lines[1]), 'cdp-discovery-route')
    return 'ws://127.0.0.1:' + lines[0] + lines[1]


def socket_inode(port):
    """Require a listening IPv4 socket bound specifically to 127.0.0.1."""
    need(type(port) is int and 1024 <= port <= 65535, 'cdp-port')
    found = []
    for line in Path('/proc/net/tcp').read_text().splitlines()[1:]:
        values = line.split(); address, raw_port = values[1].split(':')
        if int(raw_port,16) == port and values[3] == '0A':
            need(address == '0100007F', 'cdp-not-loopback')
            found.append(values[9])
    need(len(found) == 1, 'cdp-listener-count')
    return found[0]


def listener_absent(port):
    need(type(port) is int and 1024 <= port <= 65535, 'listener-port')
    for name in ('tcp','tcp6'):
        path=Path('/proc/net')/name
        need(path.is_file(), 'listener-inventory-missing')
        for line in path.read_text().splitlines()[1:]:
            values=line.split()
            if int(values[1].rsplit(':',1)[1],16)==port and values[3]=='0A':
                return False
    return True


def verify_cdp_owner(process, endpoint):
    from urllib.parse import urlsplit
    value = urlsplit(endpoint)
    need(value.scheme == 'ws' and value.hostname == '127.0.0.1' and value.port and not value.query and not value.fragment and value.username is None and value.password is None, 'cdp-origin')
    inode = socket_inode(value.port); wanted = 'socket:[' + inode + ']'; matches = []
    for member in process.members():
        directory = Path('/proc') / str(member['pid']) / 'fd'
        try:
            for path in directory.iterdir():
                try:
                    if os.readlink(path) == wanted:
                        matches.append(member['pid'])
                except FileNotFoundError:
                    continue
        except FileNotFoundError:
            continue
    need(matches, 'cdp-socket-not-owned')
    return {'loopback':True,'owned_browser_listener':True}
