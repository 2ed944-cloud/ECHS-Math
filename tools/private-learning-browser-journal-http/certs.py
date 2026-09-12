"""Ephemeral loopback leaves for owned fixtures; no trust-store installation.

OpenSSL 3 CLI: docs.openssl.org/3.0/man1/openssl-req/,
openssl-x509/, openssl-pkey/ and man5/x509v3_config/.
The caller owns the secrets directory and its eventual guarded cleanup.
"""
import base64
from datetime import datetime, timezone
import hashlib
import os
from pathlib import Path
import re
import shutil
import ssl
import stat
import subprocess
import time

COMMAND_TIMEOUT_SECONDS = 10
MAX_OUTPUT_BYTES = 32768
METADATA_FIELDS = frozenset(['der_sha256', 'spki_sha256', 'spki_sha256_base64',
    'san_ip_addresses', 'ca', 'extended_key_usage', 'key_algorithm', 'key_curve',
    'not_before', 'not_after'])
CONFIG = b'''[req]
distinguished_name = dn
prompt = no
x509_extensions = leaf
[dn]
CN = ECHS loopback fixture
[leaf]
subjectAltName = IP:127.0.0.1
basicConstraints = critical,CA:FALSE
keyUsage = critical,digitalSignature
extendedKeyUsage = serverAuth
'''


class CertificateError(ValueError):
    def __init__(self, code):
        self.code = code
        super().__init__(code)


def require(condition, code):
    if not condition:
        raise CertificateError(code)


def plain_path(path, *, directory):
    """Reject links/junctions in the supplied path before resolving it."""
    path = Path(path)
    require(path.is_absolute() and '..' not in path.parts, 'tls-path')
    for item in [*reversed(path.parents), path]:
        require(not item.is_symlink() and not getattr(item, 'is_junction', lambda: False)(), 'tls-link')
    try:
        info = path.stat(follow_symlinks=False)
    except OSError:
        raise CertificateError('tls-path') from None
    require(stat.S_ISDIR(info.st_mode) if directory else stat.S_ISREG(info.st_mode), 'tls-path')
    if not directory:
        require(info.st_nlink == 1, 'tls-link')
    return path.resolve(strict=True)


def private_file(path, content=b''):
    flags = os.O_CREAT | os.O_EXCL | os.O_WRONLY | getattr(os, 'O_NOFOLLOW', 0)
    try:
        fd = os.open(path, flags, 0o600)
        with os.fdopen(fd, 'wb') as out:
            out.write(content)
        plain_path(path, directory=False)
    except (OSError, ValueError):
        raise CertificateError('tls-create') from None


def command(executable, args, *, cwd, input_bytes=None):
    # An explicit config is used for req; ambient providers/config/RNG overrides
    # must not silently change fixture generation or write outside its directory.
    forbidden = ['OPENSSL_CONF', 'OPENSSL_CONF_INCLUDE', 'OPENSSL_MODULES', 'OPENSSL_ENGINES', 'RANDFILE']
    require(not any(os.environ.get(k) for k in forbidden), 'tls-environment')
    env = dict(os.environ, LC_ALL='C', LANG='C')
    try:
        result = subprocess.run([executable, *args], input=input_bytes,
            stdin=subprocess.DEVNULL if input_bytes is None else None,
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, cwd=cwd, env=env,
            timeout=COMMAND_TIMEOUT_SECONDS, check=False, shell=False)
    except subprocess.TimeoutExpired:
        raise CertificateError('tls-command-timeout') from None
    except (OSError, ValueError):
        raise CertificateError('tls-command-failed') from None
    require(len(result.stdout) <= MAX_OUTPUT_BYTES and len(result.stderr) <= MAX_OUTPUT_BYTES, 'tls-command-output')
    require(result.returncode == 0, 'tls-command-failed')
    return result.stdout


def ascii_output(value):
    """Keep malformed CLI output out of exception diagnostics as well."""
    try:
        return value.decode('ascii', errors='strict')
    except UnicodeDecodeError:
        raise CertificateError('tls-command-encoding') from None


def inspect_leaf(executable, certificate, key, tls_dir):
    for path in [certificate, key]:
        require(plain_path(path, directory=False).parent == tls_dir, 'tls-containment')
        require(0 < path.stat().st_size <= 8192, 'tls-file-size')
        if os.name == 'posix':
            require(stat.S_IMODE(path.stat().st_mode) == 0o600, 'tls-permissions')
    def x509(*args):
        return command(executable, ['x509', '-in', str(certificate), *args], cwd=tls_dir)
    der = x509('-outform', 'DER')
    public_pem = x509('-pubkey', '-noout')
    spki = command(executable, ['pkey', '-pubin', '-outform', 'DER'], cwd=tls_dir, input_bytes=public_pem)
    key_spki = command(executable, ['pkey', '-in', str(key), '-pubout', '-outform', 'DER'], cwd=tls_dir)
    require(spki == key_spki and 64 <= len(spki) <= 256, 'tls-key-mismatch')
    details = ascii_output(x509('-noout', '-text'))
    require('Public Key Algorithm: id-ecPublicKey' in details and 'NIST CURVE: P-256' in details, 'tls-key-algorithm')
    expected = {
        'subjectAltName': 'X509v3 Subject Alternative Name: IP Address:127.0.0.1',
        'basicConstraints': 'X509v3 Basic Constraints: critical CA:FALSE',
        'keyUsage': 'X509v3 Key Usage: critical Digital Signature',
        'extendedKeyUsage': 'X509v3 Extended Key Usage: TLS Web Server Authentication',
    }
    for name, value in expected.items():
        actual = ' '.join(ascii_output(x509('-noout', '-ext', name)).split())
        require(actual == value, 'tls-extension')
    dates = ascii_output(x509('-noout', '-dates')).splitlines()
    require(len(dates) == 2 and dates[0].startswith('notBefore=') and dates[1].startswith('notAfter='), 'tls-validity')
    try:
        start, end = [ssl.cert_time_to_seconds(line.split('=', 1)[1]) for line in dates]
    except (ValueError, OverflowError):
        raise CertificateError('tls-validity') from None
    require(end - start == 86400 and start <= time.time() < end and time.time() - start < 120, 'tls-validity')
    command(executable, ['verify', '-CAfile', str(certificate), '-no-CApath', '-no-CAstore',
        '-check_ss_sig', '-purpose', 'sslserver', '-verify_ip', '127.0.0.1', str(certificate)], cwd=tls_dir)
    digest = hashlib.sha256(spki).digest()
    return {
        'der_sha256': hashlib.sha256(der).hexdigest(), 'spki_sha256': digest.hex(),
        'spki_sha256_base64': base64.b64encode(digest).decode('ascii'),
        'san_ip_addresses': ['127.0.0.1'], 'ca': False,
        'extended_key_usage': ['serverAuth'], 'key_algorithm': 'EC', 'key_curve': 'P-256',
        'not_before': datetime.fromtimestamp(start, timezone.utc).isoformat(),
        'not_after': datetime.fromtimestamp(end, timezone.utc).isoformat(),
    }


def generate_tls(secrets_dir: Path, openssl: str) -> dict:
    """Create one owned tls child exclusively; partial files remain for cleanup."""
    parent = plain_path(secrets_dir, directory=True)
    require(isinstance(openssl, str) and openssl and '\0' not in openssl, 'tls-openssl')
    found = shutil.which(openssl)
    require(found is not None, 'tls-openssl-unavailable')
    executable = str(Path(found).resolve(strict=True))
    tls_dir = parent / 'tls'
    require(not tls_dir.exists() and not tls_dir.is_symlink(), 'tls-already-exists')
    try:
        tls_dir.mkdir(mode=0o700)
    except OSError:
        raise CertificateError('tls-create') from None
    require(plain_path(tls_dir, directory=True).parent == parent, 'tls-containment')
    if os.name == 'posix':
        require(stat.S_IMODE(tls_dir.stat().st_mode) == 0o700, 'tls-permissions')
    version = ascii_output(command(executable, ['version'], cwd=tls_dir))
    match = re.match(r'^OpenSSL (3\.\d+\.\d+[a-z]?)\b', version)
    require(match is not None, 'tls-openssl-version')
    config = tls_dir / 'openssl.cnf'
    private_file(config, CONFIG)
    bundle = {'openssl_version': 'OpenSSL ' + match.group(1)}
    for label in ['positive', 'negative']:
        certificate, key = tls_dir / (label + '.pem'), tls_dir / (label + '.key')
        private_file(certificate)
        private_file(key)
        command(executable, ['req', '-x509', '-newkey', 'ec', '-pkeyopt', 'ec_paramgen_curve:P-256',
            '-nodes', '-sha256', '-days', '1', '-batch', '-config', str(config),
            '-extensions', 'leaf', '-keyout', str(key), '-out', str(certificate)], cwd=tls_dir)
        bundle[label] = {'certificate_path': str(certificate), 'key_path': str(key),
            'metadata': inspect_leaf(executable, certificate, key, tls_dir)}
    public_metadata(bundle)
    return bundle


def public_metadata(bundle):
    """Closed report projection: no paths, PEM, private key, token or raw CLI."""
    require(type(bundle) is dict and set(bundle) == {'positive', 'negative', 'openssl_version'}, 'tls-metadata')
    require(type(bundle['openssl_version']) is str and re.fullmatch(r'OpenSSL 3\.\d+\.\d+[a-z]?', bundle['openssl_version']), 'tls-metadata')
    output = {'openssl_version': bundle['openssl_version']}
    for label in ['positive', 'negative']:
        leaf = bundle[label]
        require(type(leaf) is dict and set(leaf) == {'certificate_path', 'key_path', 'metadata'}, 'tls-metadata')
        m = leaf['metadata']
        require(type(m) is dict and set(m) == METADATA_FIELDS, 'tls-metadata')
        require(all(type(m[k]) is str and re.fullmatch(r'[0-9a-f]{64}', m[k]) for k in ['der_sha256', 'spki_sha256']), 'tls-metadata')
        require(m['spki_sha256_base64'] == base64.b64encode(bytes.fromhex(m['spki_sha256'])).decode('ascii'), 'tls-metadata')
        require(m['san_ip_addresses'] == ['127.0.0.1'] and m['ca'] is False and m['extended_key_usage'] == ['serverAuth'], 'tls-metadata')
        require(m['key_algorithm'] == 'EC' and m['key_curve'] == 'P-256', 'tls-metadata')
        try:
            require(all(type(m[k]) is str and re.fullmatch(r'\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\+00:00', m[k]) for k in ['not_before', 'not_after']), 'tls-metadata')
            duration = datetime.fromisoformat(m['not_after']) - datetime.fromisoformat(m['not_before'])
            require(duration.total_seconds() == 86400, 'tls-metadata')
        except (ValueError, TypeError):
            raise CertificateError('tls-metadata') from None
        output[label] = {k: list(v) if isinstance(v, list) else v for k, v in m.items()}
    require(output['positive']['der_sha256'] != output['negative']['der_sha256'] and
        output['positive']['spki_sha256'] != output['negative']['spki_sha256'], 'tls-independent-leaves')
    return output
