"""Certificate guards and actual OpenSSL/TLS checks; absence is never a PASS."""
import argparse
import base64
import copy
import hashlib
import io
import json
import os
from pathlib import Path
import shutil
import socket
import ssl
import stat
import subprocess
import tempfile
import threading
import unittest
from unittest.mock import patch

import certs

OPENSSL = shutil.which('openssl')
WORK_DIR = None


def sample_bundle():
    def leaf(digit):
        spki = digit * 64
        return {'certificate_path': '/private/never-publish.pem', 'key_path': '/private/never-publish.key',
            'metadata': {'der_sha256': digit * 64, 'spki_sha256': spki,
                'spki_sha256_base64': base64.b64encode(bytes.fromhex(spki)).decode(),
                'san_ip_addresses': ['127.0.0.1'], 'ca': False, 'extended_key_usage': ['serverAuth'],
                'key_algorithm': 'EC', 'key_curve': 'P-256',
                'not_before': '2026-09-12T00:00:00+00:00', 'not_after': '2026-09-13T00:00:00+00:00'}}
    return {'positive': leaf('a'), 'negative': leaf('b'), 'openssl_version': 'OpenSSL 3.0.16'}


class GuardTests(unittest.TestCase):
    def temporary(self):
        value = tempfile.TemporaryDirectory(prefix='echs-tls-guard-', dir=WORK_DIR)
        self.addCleanup(value.cleanup)
        return Path(value.name).resolve()

    def test_public_projection_excludes_paths_and_detaches_lists(self):
        source = sample_bundle()
        result = certs.public_metadata(source)
        serialized = json.dumps(result)
        self.assertNotIn('/private/', serialized)
        self.assertNotIn('key_path', serialized)
        source['positive']['metadata']['san_ip_addresses'].append('10.0.0.1')
        self.assertEqual(result['positive']['san_ip_addresses'], ['127.0.0.1'])

    def test_closed_metadata_rejects_hidden_secret_fields(self):
        for location in ['bundle', 'leaf', 'metadata']:
            with self.subTest(location=location):
                value = sample_bundle()
                target = value if location == 'bundle' else value['positive'] if location == 'leaf' else value['positive']['metadata']
                target['service_key'] = 'do-not-report'
                with self.assertRaisesRegex(certs.CertificateError, '^tls-metadata$'):
                    certs.public_metadata(value)

    def test_invalid_identity_metadata_and_validity_are_rejected(self):
        mutations = {'ca': True, 'san_ip_addresses': ['localhost'], 'key_curve': 'P-384',
            'extended_key_usage': ['clientAuth'], 'spki_sha256_base64': 'wrong',
            'der_sha256': 'not-a-hash', 'not_after': '2027-09-13T00:00:00+00:00'}
        for key, value in mutations.items():
            with self.subTest(field=key):
                source = sample_bundle()
                source['positive']['metadata'][key] = value
                with self.assertRaises(certs.CertificateError):
                    certs.public_metadata(source)

    def test_negative_leaf_cannot_reuse_positive_identity(self):
        source = sample_bundle()
        source['negative'] = copy.deepcopy(source['positive'])
        with self.assertRaisesRegex(certs.CertificateError, '^tls-independent-leaves$'):
            certs.public_metadata(source)

    def test_nonexistent_or_relative_parent_has_no_side_effect(self):
        root = self.temporary()
        for path in [root / 'absent', Path('relative'), root / '..' / root.name]:
            with self.subTest(path=path.name):
                with self.assertRaises(certs.CertificateError):
                    certs.generate_tls(path, 'absent-openssl')
                self.assertEqual(list(root.iterdir()), [])

    def test_exclusive_file_creation_preserves_existing_bytes(self):
        root = self.temporary()
        path = root / 'keep'
        path.write_bytes(b'preserve')
        with self.assertRaisesRegex(certs.CertificateError, '^tls-create$'):
            certs.private_file(path, b'change')
        self.assertEqual(path.read_bytes(), b'preserve')

    def test_linked_parent_is_refused_before_openssl(self):
        root = self.temporary()
        target = root / 'real'
        target.mkdir()
        link = root / 'link'
        try:
            link.symlink_to(target, target_is_directory=True)
        except OSError:
            self.skipTest('OS does not permit creation of symlinks in this test context')
        with self.assertRaisesRegex(certs.CertificateError, '^tls-link$'):
            certs.generate_tls(link, 'absent-openssl')
        self.assertEqual(list(target.iterdir()), [])

    def test_ambient_openssl_override_is_refused(self):
        with patch.dict(os.environ, {'OPENSSL_CONF': 'untrusted'}), patch('certs.subprocess.run') as run:
            with self.assertRaisesRegex(certs.CertificateError, '^tls-environment$'):
                certs.command('openssl', ['version'], cwd=self.temporary())
            run.assert_not_called()

    def test_process_failure_never_discloses_output(self):
        failure = subprocess.CompletedProcess(['openssl'], 1, b'PRIVATE KEY secret', b'password private')
        with patch('certs.subprocess.run', return_value=failure):
            with self.assertRaisesRegex(certs.CertificateError, '^tls-command-failed$'):
                certs.command('openssl', ['version'], cwd=self.temporary())
        with self.assertRaisesRegex(certs.CertificateError, '^tls-command-encoding$'):
            certs.ascii_output(b'PRIVATE KEY secret\xff')
        self.assertEqual(certs.ascii_output(b'OpenSSL 3.0.16\n'), 'OpenSSL 3.0.16\n')

    def test_process_timeout_and_oversize_output_are_bounded(self):
        for result in [subprocess.TimeoutExpired(['openssl'], 10, output=b'secret'),
                       subprocess.CompletedProcess(['openssl'], 0, b'x' * 32769, b'')]:
            with self.subTest(kind=type(result).__name__):
                kwargs = {'side_effect': result} if isinstance(result, Exception) else {'return_value': result}
                with patch('certs.subprocess.run', **kwargs) as run:
                    with self.assertRaises(certs.CertificateError):
                        certs.command('openssl', ['version'], cwd=self.temporary())
                    self.assertEqual(run.call_args.kwargs['timeout'], 10)
                    self.assertIs(run.call_args.kwargs['shell'], False)


class ActualCertificateTests(unittest.TestCase):
    def setUp(self):
        if OPENSSL is None:
            self.skipTest('OpenSSL executable unavailable; actual generation/TLS not executed')
        self.temp = tempfile.TemporaryDirectory(prefix='echs-tls-actual-', dir=WORK_DIR)
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve()
        self.bundle = certs.generate_tls(self.root, OPENSSL)

    def test_generated_leaves_are_fresh_private_and_exclusive(self):
        metadata = certs.public_metadata(self.bundle)
        self.assertNotEqual(metadata['positive']['spki_sha256'], metadata['negative']['spki_sha256'])
        before = {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in (self.root / 'tls').iterdir()}
        with self.assertRaisesRegex(certs.CertificateError, '^tls-already-exists$'):
            certs.generate_tls(self.root, OPENSSL)
        self.assertEqual(before, {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in (self.root / 'tls').iterdir()})
        if os.name == 'posix':
            self.assertEqual(stat.S_IMODE((self.root / 'tls').stat().st_mode), 0o700)
            self.assertTrue(all(stat.S_IMODE(p.stat().st_mode) == 0o600 for p in (self.root / 'tls').iterdir()))
        second = self.root / 'second'
        second.mkdir(mode=0o700)
        another = certs.generate_tls(second, OPENSSL)
        self.assertNotEqual(metadata['positive']['spki_sha256'], another['positive']['metadata']['spki_sha256'])

    def test_independent_tls_verification_observes_leaf_and_rejects_other_leaf(self):
        trusted = ssl.create_default_context(cafile=self.bundle['positive']['certificate_path'])
        for label in ['positive', 'negative']:
            with self.subTest(leaf=label):
                server_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
                leaf = self.bundle[label]
                server_context.load_cert_chain(leaf['certificate_path'], leaf['key_path'])
                listener = socket.socket()
                listener.bind(('127.0.0.1', 0))
                listener.listen(1)
                listener.settimeout(3)
                address = listener.getsockname()
                outcomes = []
                def serve():
                    try:
                        connection, _ = listener.accept()
                        connection.settimeout(3)
                        with connection, server_context.wrap_socket(connection, server_side=True):
                            outcomes.append('connected')
                    except (ssl.SSLError, OSError):
                        outcomes.append('rejected')
                worker = threading.Thread(target=serve, daemon=True)
                worker.start()
                try:
                    if label == 'positive':
                        with socket.create_connection(address, timeout=3) as connection:
                            with trusted.wrap_socket(connection, server_hostname='127.0.0.1') as secured:
                                self.assertEqual(hashlib.sha256(secured.getpeercert(binary_form=True)).hexdigest(), leaf['metadata']['der_sha256'])
                    else:
                        with socket.create_connection(address, timeout=3) as connection:
                            with self.assertRaises(ssl.SSLCertVerificationError):
                                trusted.wrap_socket(connection, server_hostname='127.0.0.1')
                finally:
                    listener.close()
                    worker.join(4)
                self.assertFalse(worker.is_alive())
                self.assertEqual(outcomes, ['connected' if label == 'positive' else 'rejected'])

    def test_certificate_key_mismatch_is_rejected(self):
        with self.assertRaisesRegex(certs.CertificateError, '^tls-key-mismatch$'):
            certs.inspect_leaf(OPENSSL, Path(self.bundle['positive']['certificate_path']),
                Path(self.bundle['negative']['key_path']), self.root / 'tls')

    def test_wrong_san_ca_and_eku_are_rejected_from_actual_certificates(self):
        tls = self.root / 'tls'
        for index, (before, after) in enumerate([(b'IP:127.0.0.1', b'IP:127.0.0.2'),
                (b'CA:FALSE', b'CA:TRUE'), (b'extendedKeyUsage = serverAuth', b'extendedKeyUsage = clientAuth')]):
            with self.subTest(extension=index):
                config, certificate, key = [tls / (f'wrong{index}' + suffix) for suffix in ['.cnf', '.pem', '.key']]
                certs.private_file(config, certs.CONFIG.replace(before, after))
                certs.private_file(certificate)
                certs.private_file(key)
                certs.command(OPENSSL, ['req', '-x509', '-newkey', 'ec', '-pkeyopt', 'ec_paramgen_curve:P-256',
                    '-nodes', '-sha256', '-days', '1', '-batch', '-config', str(config),
                    '-extensions', 'leaf', '-keyout', str(key), '-out', str(certificate)], cwd=tls)
                with self.assertRaisesRegex(certs.CertificateError, '^tls-extension$'):
                    certs.inspect_leaf(OPENSSL, certificate, key, tls)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--openssl')
    parser.add_argument('--require-openssl', action='store_true')
    parser.add_argument('--work-dir', type=Path)
    parser.add_argument('--report', required=True, type=Path)
    args = parser.parse_args()
    if args.openssl:
        OPENSSL = shutil.which(args.openssl)
    WORK_DIR = args.work_dir
    stream = io.StringIO()
    suite = unittest.defaultTestLoader.loadTestsFromModule(__import__(__name__))
    result = unittest.TextTestRunner(stream=stream, verbosity=2).run(suite)
    failed = not result.wasSuccessful() or args.require_openssl and bool(result.skipped)
    report = {'contract': 'echs.browser-journal.certificate-tests.v1',
        'status': 'FAIL' if failed else 'PASS' if not result.skipped else 'PARTIAL',
        'tests': result.testsRun, 'failures': len(result.failures), 'errors': len(result.errors),
        'skipped': len(result.skipped), 'actual_openssl_available': OPENSSL is not None,
        'required_actual': args.require_openssl,
        'skip_reasons': [reason for _, reason in result.skipped],
        'sources': [{'path': name, 'sha256': hashlib.sha256(Path(__file__).with_name(name).read_bytes()).hexdigest()}
            for name in ['certs.py', 'test_certs.py']],
        'scope': 'Local guards plus actual OpenSSL generation and Python TLS only when executed; no browser or hosted TLS claim.'}
    with args.report.open('x', encoding='utf-8', newline='\n') as out:
        json.dump(report, out, indent=2)
        out.write('\n')
    print(json.dumps(report))
    if failed:
        # unittest traces are not published: exceptions may contain private paths.
        print('Certificate checks failed; failed test identifiers: ' + ', '.join(t.id() for t, _ in result.failures + result.errors))
    raise SystemExit(1 if failed else 0)
