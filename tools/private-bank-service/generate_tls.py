"""Generate an ephemeral test CA and fixed-host certificate inside this candidate.

No trust-store installation, production certificate, network or key logging.
"""
from datetime import datetime, timedelta, timezone
from pathlib import Path
from service_contract import HERE, need

def generate_tls(directory):
    from cryptography import x509
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import rsa
    from cryptography.x509.oid import NameOID, ExtendedKeyUsageOID
    directory=Path(directory).absolute()
    need(directory.resolve().is_relative_to(HERE.resolve()) and directory != HERE, 'tls-directory')
    for p in (directory,*directory.parents):
        need(not p.is_symlink() and not p.is_junction(),'linked-tls-directory')
    need(not directory.exists(),'tls-directory-exists')
    directory.mkdir(mode=0o700)
    now=datetime.now(timezone.utc)
    ca_key=rsa.generate_private_key(public_exponent=65537,key_size=2048)
    leaf_key=rsa.generate_private_key(public_exponent=65537,key_size=2048)
    issuer=x509.Name([x509.NameAttribute(NameOID.COMMON_NAME,'Ephemeral C08 fixture CA')])
    ca=(x509.CertificateBuilder().subject_name(issuer).issuer_name(issuer)
        .public_key(ca_key.public_key()).serial_number(x509.random_serial_number())
        .not_valid_before(now-timedelta(minutes=1)).not_valid_after(now+timedelta(hours=4))
        .add_extension(x509.BasicConstraints(ca=True,path_length=0),critical=True)
        .add_extension(x509.KeyUsage(False,False,False,False,False,True,True,None,None),critical=True)
        .sign(ca_key,hashes.SHA256()))
    name=x509.Name([x509.NameAttribute(NameOID.COMMON_NAME,'echsc08servicetest.supabase.co')])
    leaf=(x509.CertificateBuilder().subject_name(name).issuer_name(issuer)
        .public_key(leaf_key.public_key()).serial_number(x509.random_serial_number())
        .not_valid_before(now-timedelta(minutes=1)).not_valid_after(now+timedelta(hours=2))
        .add_extension(x509.BasicConstraints(ca=False,path_length=None),critical=True)
        .add_extension(x509.SubjectAlternativeName([x509.DNSName('echsc08servicetest.supabase.co')]),critical=False)
        .add_extension(x509.ExtendedKeyUsage([ExtendedKeyUsageOID.SERVER_AUTH]),critical=False)
        .add_extension(x509.KeyUsage(True,False,True,False,False,False,False,None,None),critical=True)
        .sign(ca_key,hashes.SHA256()))
    values={'ca.pem':ca.public_bytes(serialization.Encoding.PEM),
        'server.pem':leaf.public_bytes(serialization.Encoding.PEM),
        'server-key.pem':leaf_key.private_bytes(serialization.Encoding.PEM,
            serialization.PrivateFormat.PKCS8,serialization.NoEncryption())}
    for name,value in values.items():
        p=directory/name
        with p.open('xb') as f:f.write(value)
        p.chmod(0o600)
    # The CA private key never leaves this call; only a short-lived server key is written.
    return {'hostname':'echsc08servicetest.supabase.co','ca_fingerprint_sha256':ca.fingerprint(hashes.SHA256()).hex(),
        'leaf_fingerprint_sha256':leaf.fingerprint(hashes.SHA256()).hex()}
