"""Run real loopback TLS tests with fresh ephemeral certificates, then remove them."""
from pathlib import Path
import argparse
import subprocess
import tempfile
from generate_tls import generate_tls
from service_contract import HERE, need

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--report',type=Path,default=HERE/'results'/'tls-test-results.json')
    args=parser.parse_args()
    report=args.report.absolute()
    need(report.parent==HERE/'results' and not report.exists(),'report-path')
    with tempfile.TemporaryDirectory(prefix='tls-test-',dir=HERE) as name:
        temporary=Path(name).resolve()
        need(temporary.parent==HERE and temporary.name.startswith('tls-test-'),'temporary-path')
        secrets=temporary/'tls'
        generate_tls(secrets)
        result=subprocess.run(['node',str(HERE/'test_tls_gateway.mjs'),str(secrets),str(report)],timeout=40,check=False)
        return result.returncode

if __name__=='__main__':
    raise SystemExit(main())
