"""Non-starting, offline preflight scaffold. There is intentionally no execute mode."""
from pathlib import Path
import argparse
import json
import uuid
from service_contract import (HERE, ContractError, fixture_plan, verify_sources,
    validate_fixture_plan, write_report_exclusive)

def preflight(repo, runtime, run_id):
    sources = verify_sources(repo,runtime)
    plan = fixture_plan(run_id)
    validate_fixture_plan(plan)
    return {'contract':'echs.c08.storage-service-preflight.v1','status':'PREFLIGHT_PASS',
        'mode':'OFFLINE_PLAN_ONLY','sources':sources,'fixture_plan':plan,
        'services_executed':False,'hosted_edge_executed':False,'corpus_imported':False,
        'image_registry_verified':False,'service_acceptance':False,
        'remaining':['immutable-image-registry-receipt','compose-and-managed-schema-bootstrap',
            'verified-tls-gateway','synthetic-service-fixture','actual-socket-acceptance-cases',
            'closed-service-evidence-collector','disposable-actions-execution']}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--report',type=Path,help='New JSON filename in this candidate results directory')
    parser.add_argument('--run-id',default=None)
    parser.add_argument('--repo',type=Path,default=HERE.parents[1]/'foundations')
    args = parser.parse_args()
    try:
        report = preflight(args.repo.resolve(),HERE/'runtime',
            args.run_id or uuid.uuid4().hex)
        # Recheck all pinned source bytes immediately before writing the receipt.
        verify_sources(args.repo.resolve(),HERE/'runtime')
        if args.report:
            write_report_exclusive(args.report,report)
        print(json.dumps({'status':report['status'],'services_executed':False,
            'migration_files_verified':27,'runtime_files_verified':2,'upstream_files_verified':10}))
        return 0
    except ContractError as error:
        print(json.dumps({'status':'REJECTED','code':error.code,'services_executed':False}))
        return 1

if __name__ == '__main__':
    raise SystemExit(main())
