"""Disposable browser HTTPS/PostgREST integration. Default is a network-free source preflight."""
import argparse
import hashlib
import importlib.metadata
import json
import os
import re
import shutil
import stat
import subprocess
import sys
import time
import urllib.error
import urllib.request
import uuid
from pathlib import Path
from fixture import HERE, DATABASE, credentials, execution_guard, image_tags, install, need, owned_network, cleanup_identity, project, rest_environment, sha, source_receipt
from certs import generate_tls, public_metadata
from processes import OwnedProcess, cdp_endpoint, verify_cdp_owner, listener_absent
from owned_children import OwnedChildren

IMAGE_IDS = {
    'postgres@sha256:9b1d34adbce1dd07ee6e94b4a2cf698884b89bd44a6c9c12f5da8f3acbfe4957': 'sha256:40710ae201396ad27dfd01526815d5ad83c83850e7cb16dce9f0012da66f4689',
    'postgres@sha256:67f41722b7a8cbdb868a44a4995c846eddfdc2973bccb291ce937dce88ad5675': 'sha256:7296f210ae81031ec955dbad9a67a84fe958572a2153b8d0826a647522904dc1',
    'postgrest/postgrest@sha256:c9dc201e555f5d8e37e7f39cdd4df0229774996e213bfd7de8d10ac609030f2c': 'sha256:fc3d286fec899d5a5bebbb98eac771ced1ccaa44deac8ce2fc23fe5d262eb3d9',
}

DEPENDENCY_SCRIPT = """const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=process.argv[1],entry=path.join(root,'question-bank/official/tools/node_modules/playwright');
const pw=require(entry),core=require.resolve('playwright-core/package.json',{paths:[entry]}),raw=fs.readFileSync(path.join(path.dirname(core),'browsers.json'));
const browser=JSON.parse(raw).browsers.find(x=>x.name==='chromium');
process.stdout.write(JSON.stringify({playwright:JSON.parse(fs.readFileSync(path.join(entry,'package.json'))).version,playwright_core:JSON.parse(fs.readFileSync(core)).version,descriptor_sha256:crypto.createHash('sha256').update(raw).digest('hex'),descriptor_bytes:raw.length,browser,executable:pw.chromium.executablePath(),node:process.version}));"""


def browser_arguments(executable, profile, spki):
    need(type(spki) is str and re.fullmatch(r'[A-Za-z0-9+/]{43}=', spki), 'browser-spki')
    need(profile.is_absolute() and not profile.exists(), 'fresh-browser-profile')
    return [str(executable), '--headless=new', '--no-sandbox', '--disable-setuid-sandbox',
            '--remote-debugging-address=127.0.0.1', '--remote-debugging-port=0',
            '--user-data-dir=' + str(profile), '--enable-automation',
            '--ignore-certificate-errors-spki-list=' + spki,
            '--disable-crashpad-for-testing', '--disable-breakpad', '--disable-crash-reporter',
            '--disable-background-networking', '--disable-component-update', '--disable-sync',
            '--no-first-run', '--no-default-browser-check', '--disable-default-apps',
            '--password-store=basic', '--use-mock-keychain', 'about:blank']


def require_private_directory(path, parent):
    need(path.is_absolute() and not path.is_symlink() and path.resolve().parent == parent.resolve(), 'private-directory-path')
    for part in (path,*path.parents):
        need(not part.is_symlink() and not getattr(part,'is_junction',lambda:False)(), 'private-directory-link')
    info=path.stat();need(stat.S_ISDIR(info.st_mode) and stat.S_IMODE(info.st_mode)==0o700 and info.st_uid==os.getuid(), 'private-directory-owner-mode')

PREFIX = "tools/private-learning-browser-journal-http/"
WORKFLOW = ".github/workflows/private-learning-browser-journal-http.yml"


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, request, response, code, message, headers, new_url):
        return None


def readiness_observation(status, payload):
    need(type(status) is int and 100 <= status <= 599, "readiness-status")
    need(status not in (301, 302, 303, 307, 308), "readiness-redirect")
    code = None
    if len(payload) <= 1024:
        try:
            value = json.loads(payload)
            candidate = value.get("code") if isinstance(value, dict) else None
            if type(candidate) is str and re.fullmatch(r"[A-Z0-9]{5,8}", candidate): code = candidate
        except (ValueError, UnicodeError): pass
    # PostgREST v14.17 Error.hs maps SQLSTATE class28 to HTTP403. The
    # native handler's client401 mapping is outside this direct SQL probe.
    return {"http_status": status, "code": code, "ready": status == 403 and code == "28000"}


def start_network(docker, identifier, plan):
    plan["network_planned"] = True
    docker("network", "create", "--driver", "bridge", "--internal", "--label", "echs.journal.http.run=" + identifier, project(identifier))


def remove_planned_network(docker, identifier):
    name = project(identifier)
    query = ("network", "ls", "--filter", "name=^" + name + "$", "--format", "{{.Name}}")
    names = docker(*query).decode().splitlines()
    if names:
        need(names == [name], "cleanup-exact-network")
        value = json.loads(docker("network", "inspect", name))[0]
        need(value["Name"] == name and value.get("Labels") == {"echs.journal.http.run": identifier} and not value["Containers"], "cleanup-network-owner")
        docker("network", "rm", value["Id"])
    need(not docker(*query).strip(), "cleanup-network-remains")


def verify(repo, published=False):
    import contract
    return contract.sources(repo, published)


FAILURE_STAGES = frozenset({'checkout','dependency-identity','ephemeral-tls','image-resolution',
    'network-create','postgres-start','install-exact-schema','postgrest-start','postgrest-readiness',
    'browser-launch','actual-http-cases','actual-browser-cases','post-execution-identity',
    'browser-cdp-recheck','actual-browser-driver-start','actual-browser-driver-wait',
    'actual-browser-driver-output','actual-browser-driver-cleanup','actual-browser-report-check'})
FAILURE_TYPES = frozenset({'ValueError','TypeError','KeyError','AssertionError','TimeoutError',
    'TimeoutExpired','PermissionError','FileNotFoundError','OSError','CalledProcessError',
    'OperationalError','InterfaceError','DatabaseError','CertificateError'})
FAILURE_SOURCE_NAMES = ('run.py','processes.py','owned_children.py','fixture.py','certs.py','contract.py')


def failure_metadata(error, stage):
    """Closed diagnostic fields only; exception messages and paths stay private."""
    name=type(error).__name__
    result={'type':name if name in FAILURE_TYPES else 'OtherError','sqlstate':None}
    if type(stage) is str and stage in FAILURE_STAGES:result['stage']=stage
    for key in ('errno','sqlstate'):
        try:value=getattr(error,key,None)
        except Exception:value=None
        if key=='errno' and type(value) is int and 1<=value<=4095:result[key]=value
        elif key=='sqlstate' and type(value) is str and re.fullmatch('[A-Z0-9]{5}',value):result[key]=value
    names={os.path.normcase(os.path.abspath(HERE/name)):name for name in FAILURE_SOURCE_NAMES}
    trace=error.__traceback__
    while trace:
        filename=os.path.normcase(os.path.abspath(trace.tb_frame.f_code.co_filename))
        if filename in names and type(trace.tb_lineno) is int and 1<=trace.tb_lineno<=1000000:
            result['location']={'file':names[filename],'line':trace.tb_lineno}
        trace=trace.tb_next
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", type=Path, default=HERE.parents[1])
    parser.add_argument("--postgres-major", type=int, choices=(15, 17), required=True)
    parser.add_argument("--execute", action="store_true")
    args = parser.parse_args(); repo = Path(os.path.abspath(args.repo)); tags = image_tags(args.postgres_major)
    receipt = verify(repo, args.execute)
    if not args.execute:
        print(json.dumps({"status": "SOURCE PREFLIGHT PASS; SERVICES NOT EXECUTED", "postgres_major": args.postgres_major, "images": tags, "source_files": len(receipt["source_files"]), "inputs": len(receipt["inputs"]), "actual_http": False}))
        return 0
    execution_guard(os.environ, sys.platform, repo)
    need(importlib.metadata.version("psycopg") == "3.2.9", "driver-version")
    import psycopg
    paths = {name: shutil.which(name) for name in ("docker", "node", "git", "openssl")}
    need(all(paths.values()), "runner-tools")
    identifier = uuid.uuid4().hex; name = project(identifier)
    run_dir = HERE / "runs" / identifier
    import contract
    contract.guarded_path(run_dir, HERE)
    need(not run_dir.exists(), "fresh-run-directory")
    run_dir.mkdir(parents=True, mode=0o700)
    secrets_dir = run_dir / "secrets"; secrets_dir.mkdir(mode=0o700)
    (secrets_dir / "home").mkdir(); (secrets_dir / "docker").mkdir()
    env = {"PATH": os.environ["PATH"], "HOME": str(secrets_dir / "home"), "DOCKER_CONFIG": str(secrets_dir / "docker"), "LANG": "C.UTF-8", "PYTHONDONTWRITEBYTECODE": "1", "GITHUB_ACTIONS": "true", "RUNNER_ENVIRONMENT": "github-hosted"}
    stage = "checkout"; created = []; plan = {"network_planned": False}; cleanup_ok = False
    registry = None; processes = []; browser_endpoint = None; browser_process = None
    report = {"contract": "echs.c04.browser-journal-service-run.v1", "status": "RUNNING; NOT ACCEPTED", "run_id": identifier, "postgres_major": args.postgres_major, "production_calls": 0, "hosted_edge_executed": False, "hosted_tls_executed": False, "tls_executed": False, "browser_persistence_executed": False, "service_start_attempted": False, "cleanup_complete": False}
    def save(path, value):
        with path.open("x", encoding="utf-8", newline="\n") as stream: json.dump(value, stream, indent=2); stream.write("\n")
    def command(argv, timeout=60):
        result = subprocess.run(argv, env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=timeout, check=False)
        need(result.returncode == 0, "command-failed")
        return result.stdout
    def docker(*argv, timeout=60): return command([paths["docker"], "--context", "default", *argv], timeout)
    def inspect_container(service): return json.loads(docker("inspect", name + "-" + service))[0]
    def network_receipt(services):
        network = json.loads(docker("network", "inspect", name))[0]
        return owned_network(network, {key: inspect_container(key) for key in services}, identifier)
    def private_file(filename, value):
        path = secrets_dir / filename
        with path.open("x", encoding="utf-8", newline="\n") as stream:
            if isinstance(value, str): stream.write(value)
            else: json.dump(value, stream)
        path.chmod(0o600)
        return path
    def launch(argv, role):
        need(registry is not None, 'child-registry-required')
        child=OwnedProcess(argv,env=env,cwd=str(repo),role=role,reap=registry.reap_adopted)
        # Register before waiting or starting any second child.
        processes.append(child);registry.register_root(child.child)
        return child
    def run_child(argv, role, timeout, output):
        nonlocal stage
        if role=='driver':stage='actual-browser-driver-start'
        child=launch(argv,role)
        if role=='driver':stage='actual-browser-driver-wait'
        exit_code=child.wait(timeout)
        need(exit_code==0,'child-test-failed')
        if role=='driver':stage='actual-browser-driver-output'
        output_path=contract.guarded_path(run_dir/output,run_dir)
        need(output_path.is_file() and output_path.stat().st_nlink==1,'child-output-file')
        output_bytes=output_path.read_bytes();need(0<len(output_bytes)<=1048576,'child-output-size')
        report.setdefault('child_executions',[]).append({'role':role,'run_id':identifier,
          'postgres_major':args.postgres_major,'source_manifest_sha256':receipt['manifest_sha256'],
          'exit_code':exit_code,'output':{'path':output,'bytes':len(output_bytes),'sha256':sha(output_bytes)}})
        if role=='driver':stage='actual-browser-driver-cleanup'
        registry.scan(); report.setdefault('process_cleanup',[]).append(child.close())
    try:
        require_private_directory(secrets_dir,run_dir)
        registry=OwnedChildren.enable()
        need(command([paths["git"], "-C", str(repo), "rev-parse", "HEAD"]).decode().strip() == os.environ["GITHUB_SHA"], "checkout-head")
        report["tested_sha"] = os.environ["GITHUB_SHA"]
        report["tested_tree"] = command([paths["git"], "-C", str(repo), "rev-parse", "HEAD^{tree}"]).decode().strip()
        parents=command([paths['git'],'-C',str(repo),'show','-s','--format=%P','HEAD']).decode().strip().split()
        event_name=os.environ['GITHUB_EVENT_NAME'];event=json.loads(Path(os.environ['GITHUB_EVENT_PATH']).read_bytes())
        need(event_name in ('pull_request','push','workflow_dispatch'),'ci-event')
        checkout={'contract':'echs.c04.browser-http-checkout.v1','event':event_name,'tested_commit':report['tested_sha'],'tested_tree':report['tested_tree'],'parents':parents,'head':report['tested_sha'],'base':None}
        if event_name=='pull_request':
            checkout.update(head=event['pull_request']['head']['sha'],base=event['pull_request']['base']['sha'])
            need(parents==[checkout['base'],checkout['head']],'tested-pull-request-merge')
        need(all(re.fullmatch('[a-f0-9]{40}',value) for value in [checkout['tested_commit'],checkout['tested_tree'],checkout['head'],*parents]),'checkout-identities')
        save(run_dir/'checkout.json',checkout)
        # Compare all executable candidate sources and the manifest to actual Git
        # HEAD; immutable prerequisite hashes are verified independently above.
        for row in receipt["source_files"]:
            data = command([paths["git"], "-C", str(repo), "show", "HEAD:" + row["path"]])
            need(len(data) == row["bytes"] and sha(data) == row["sha256"], "checkout-source")
        need(command([paths["git"], "-C", str(repo), "show", "HEAD:" + PREFIX + "source-manifest.json"]) == (HERE / "source-manifest.json").read_bytes(), "checkout-manifest")
        save(run_dir / "source-receipt.json", receipt)
        stage='dependency-identity'
        browser_cache=Path(os.environ['RUNNER_TEMP']).resolve()/'echs-browser-bin'
        need(os.environ.get('PLAYWRIGHT_BROWSERS_PATH')==str(browser_cache),'browser-cache-location')
        env['PLAYWRIGHT_BROWSERS_PATH']=str(browser_cache)
        details=json.loads(command([paths['node'],'-e',DEPENDENCY_SCRIPT,str(repo)]))
        pin=json.loads((HERE/'browser-dependency.json').read_bytes())
        need(details['playwright']==details['playwright_core']==pin['playwright'],'playwright-version')
        need(details['descriptor_sha256']==pin['browsers_json_sha256'] and details['descriptor_bytes']==pin['browsers_json_bytes'],'browser-descriptor')
        need(details['browser']['revision']==pin['revision'] and details['browser']['browserVersion']==pin['version'],'browser-build')
        need(re.fullmatch(r'v24\.\d+\.\d+',details['node']) and sys.version_info[:2]==(3,12),'runtime-versions')
        executable=Path(details['executable'])
        need(executable.is_absolute() and not executable.is_symlink() and executable.resolve().is_relative_to(browser_cache) and executable.is_file(),'owned-browser-executable')
        executable_hash=sha(executable.read_bytes())
        version=command([str(executable),'--version'],timeout=10).decode('ascii').strip()
        need(version.endswith(pin['version']),'actual-browser-binary-version')
        save(run_dir/'dependency-receipt.json',{'playwright':details['playwright'],'playwright_core':details['playwright_core'],'descriptor_sha256':details['descriptor_sha256'],'descriptor_bytes':details['descriptor_bytes'],'browser_revision':pin['revision'],'browser_version':pin['version'],'actual_browser_version':version,'browser_executable_sha256':executable_hash,'node':details['node'],'python':'.'.join(map(str,sys.version_info[:3])),'driver':'3.2.9'})
        stage='ephemeral-tls'
        tls=generate_tls(secrets_dir,paths['openssl']);save(run_dir/'tls-material.json',public_metadata(tls))
        need(json.loads(docker("context", "inspect", "default", "--format", "{{json .Endpoints.docker.Host}}")) == "unix:///var/run/docker.sock", "local-docker-only")
        need(not docker("network", "ls", "--filter", "name=^" + name + "$", "--format", "{{.Name}}").strip(), "fresh-network")
        need(not docker("ps", "-a", "--filter", "label=echs.journal.http.run=" + identifier, "--format", "{{.ID}}").strip(), "fresh-containers")
        stage = "image-resolution"; images = {}
        for service, tag in tags.items():
            docker("pull", "--platform", "linux/amd64", tag, timeout=240)
            value = json.loads(docker("image", "inspect", tag))[0]
            need(value["Os"] == "linux" and value["Architecture"] == "amd64" and re.fullmatch("sha256:[a-f0-9]{64}", value["Id"]), "image-platform")
            need(tag in value['RepoDigests'] and value['Id']==IMAGE_IDS[tag], 'immutable-image-identity')
            images[service] = {"reference": tag, "image_id": value["Id"], "repository_digest": tag}
        save(run_dir / "image-receipt.json", images)
        values = credentials()
        db_env = private_file("db.env", "POSTGRES_USER=postgres\nPOSTGRES_PASSWORD=" + values["password"] + "\nPOSTGRES_DB=" + DATABASE + "\n")
        rest_env = private_file("rest.env", "".join(k + "=" + v + "\n" for k, v in rest_environment(values["password"], values["jwt_secret"]).items()))
        stage = "network-create"
        start_network(docker, identifier, plan)
        def start(service, env_file, extra):
            report["service_start_attempted"] = True
            args = ["run", "-d", "--name", name + "-" + service, "--network", name, "--network-alias", service,
                    "--label", "echs.journal.http.run=" + identifier, "--label", "echs.journal.http.service=" + service,
                    "--restart", "no", "--log-driver", "none", "--memory", "1g", "--cpus", "2", "--env-file", str(env_file)]
            if service == "db": args += ["--tmpfs", "/var/lib/postgresql/data:rw,nosuid,size=768m"]
            # Register the planned, uniquely named resource before launch so a
            # partially successful docker run is still subject to owned cleanup.
            created.append(service)
            docker(*args, images[service]["image_id"], *extra)
            actual = inspect_container(service)
            need(actual["Image"] == images[service]["image_id"], "running-image")
        stage = "postgres-start"; start("db", db_env, ["postgres", "-c", "log_min_messages=fatal", "-c", "log_statement=none"])
        network = network_receipt(["db"]); db_ip = network["services"]["db"]["ipv4"]
        deadline = time.monotonic() + 45; db = None
        while time.monotonic() < deadline:
            try:
                db = psycopg.connect(host=db_ip, hostaddr=db_ip, port=5432, dbname=DATABASE, user="postgres", password=values["password"], sslmode="disable", autocommit=True, connect_timeout=2)
                break
            except psycopg.OperationalError: time.sleep(.25)
        need(db is not None, "postgres-readiness")
        stage = "install-exact-schema"
        with db:
            from psycopg import sql
            db.execute("set statement_timeout='15s'")
            db.execute("set lock_timeout='5s'")
            need(db.info.dbname==DATABASE and int(db.execute('show server_version_num').fetchone()[0])//10000==args.postgres_major,'owned-connected-major')
            need(db.execute("select count(*) from pg_tables where schemaname in ('public','private','storage')").fetchone()[0]==0,'fresh-before-marker')
            need(db.execute("select shobj_description(oid,'pg_database') from pg_database where datname=current_database()").fetchone()[0] is None,'fresh-database-marker')
            db.execute(sql.SQL('comment on database {} is {}').format(sql.Identifier(DATABASE),sql.Literal(project(identifier))))
            report["installation"] = install(db, repo, values["password"], identifier, args.postgres_major)
        stage = "postgrest-start"; start("rest", rest_env, ["postgrest"])
        network = network_receipt(["db", "rest"]); report["network"] = network
        rest_ip = network["services"]["rest"]["ipv4"]
        stage = "postgrest-readiness"; ready = False; deadline = time.monotonic() + 30
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect())
        while time.monotonic() < deadline:
            req = urllib.request.Request("http://" + rest_ip + ":3000/rpc/learning_journal_state", data=json.dumps({"p_token_hash": "0" * 64, "p_payload": {}}).encode(), headers={"Authorization": "Bearer " + values["service_key"], "Content-Type": "application/json"}, method="POST")
            try:
                with opener.open(req, timeout=2) as response:
                    report["readiness"] = readiness_observation(response.status, response.read(1025))
            except urllib.error.HTTPError as error:
                with error:
                    report["readiness"] = readiness_observation(error.code, error.read(1025))
            except (urllib.error.URLError, TimeoutError, ConnectionError): pass
            if report.get("readiness", {}).get("ready") is True: ready = True; break
            time.sleep(.25)
        need(ready, "postgrest-schema-ready")
        report["fresh_sql_denial_observed"] = True
        stage='browser-launch'
        profile=secrets_dir/'browser-profile'
        argv=browser_arguments(executable,profile,tls['positive']['metadata']['spki_sha256_base64'])
        browser_process=launch(argv,'browser');deadline=time.monotonic()+15
        while time.monotonic()<deadline:
            need(browser_process.child.poll() is None,'browser-start-exit')
            if (profile/'DevToolsActivePort').is_file():
                browser_endpoint=cdp_endpoint(profile)
                report['browser_cdp']=verify_cdp_owner(browser_process,browser_endpoint)
                break
            time.sleep(.05)
        need(browser_endpoint is not None,'browser-start-deadline')
        config = {"contract": "echs.c04.journal-http-private-run.v1", "run_id": identifier, "db_ip": db_ip, "rest_ip": rest_ip, "password": values["password"], "service_key": values["service_key"], "anon_key": values["anon_key"], "authenticated_key": values["authenticated_key"], "source_manifest_sha256": receipt["manifest_sha256"],
                  'repo':str(repo),'tls':tls,'browser_profile':str(profile),'browser_executable_sha256':executable_hash,'cdp_endpoint':browser_endpoint}
        private_config = private_file("control-private.json", config)
        stage = "actual-http-cases"
        run_child([paths["node"], str(HERE / "test_http.mjs"), str(private_config), sys.executable, str(run_dir / "http-results.json")], 'http', 180, 'http-results.json')
        outcome = json.loads((run_dir / "http-results.json").read_text())
        need(outcome["status"] == "ACTUAL HTTP POSTGREST SQL PASS" and outcome["checks"] == outcome["planned_groups"] and len(outcome["checks"]) == 20, "http-acceptance")
        need(outcome["real_http_executed"] is True and outcome["postgrest_executed"] is True and outcome["database_executed"] is True, "actual-execution")
        need(verify(repo, True) == receipt, "source-drift")
        report["groups"] = 20
        stage = "browser-cdp-recheck"
        verify_cdp_owner(browser_process,browser_endpoint)
        run_child([paths['node'],str(HERE/'test_browser_http.mjs'),str(private_config),sys.executable,str(run_dir/'browser-results.json')],'driver',660,'browser-results.json')
        stage='actual-browser-report-check'
        actual=json.loads((run_dir/'browser-results.json').read_bytes())
        need(actual['status']=='ACTUAL BROWSER HTTPS POSTGREST SQL PASS' and len(actual['checks'])==12
             and [row['name'] for row in actual['checks']]==actual['planned_groups'] and all(row['status']=='PASS' for row in actual['checks']),'browser-actual-groups')
        need(all(actual[key] is True for key in ('native_browser_executed','real_https_executed','postgrest_executed','database_executed','cleanup_complete')),'browser-actual-boundary')
        need(actual['unexpected_requests']==actual['page_errors']==[] and actual['tls']['negative_application_requests']==0,'browser-network-boundary')
        report['browser_groups']=12;report['tls_executed']=True;report['browser_persistence_executed']=True
        stage='post-execution-identity'
        with psycopg.connect(host=db_ip,hostaddr=db_ip,port=5432,dbname=DATABASE,user='postgres',password=values['password'],sslmode='disable',autocommit=True,connect_timeout=3) as checked:
            checked.execute("set statement_timeout='5s'")
            need(checked.execute("select shobj_description(oid,'pg_database') from pg_database where datname=current_database()").fetchone()[0]==project(identifier),'post-run-marker')
            report['postgres_version_after']=checked.execute('show server_version').fetchone()[0]
            need(int(checked.execute('show server_version_num').fetchone()[0])//10000==args.postgres_major,'post-run-major')
            need(report['postgres_version_after']==report['installation']['postgres_version'],'same-postgres-version')
        need(sha(executable.read_bytes())==executable_hash,'browser-binary-drift')
        need(verify(repo, True) == receipt, "final-browser-source-drift")
        report["status"] = "ACTUAL BROWSER JOURNAL SERVICES PASS"

    except Exception as error:
        report["status"] = "FAIL; NO ACCEPTANCE"; report["failure"] = failure_metadata(error,stage)
    finally:
        process_ok=True
        try:
            if registry:
                registry.scan()
        except Exception as error:
            process_ok=False;report['process_initial_scan_failure_type']=type(error).__name__
        # Each owner cleanup is attempted independently even when registry
        # inventory or an earlier owner's cleanup is unavailable.
        for child in reversed(processes):
            try:
                if not child.closed:
                    report.setdefault('process_cleanup',[]).append(child.close())
            except Exception as error:
                process_ok=False;report.setdefault('process_cleanup_errors',[]).append({'role':child.role,'type':type(error).__name__})
        try:
            if registry:
                report['descendant_cleanup']=registry.cleanup(term_seconds=3,kill_seconds=3)
                report['descendant_absence']=registry.assert_empty()
        except Exception as error:
            process_ok=False;report['descendant_cleanup_failure_type']=type(error).__name__
        try:
            if browser_endpoint:
                from urllib.parse import urlsplit
                port=urlsplit(browser_endpoint).port
                need(listener_absent(port),'cdp-listener-remains')
                report['cdp_listener_absent']=True
            listeners=secrets_dir/'listener-private.json'
            if listeners.exists():
                need(not listeners.is_symlink() and listeners.stat().st_size<=128,'listener-private-file')
                ports=json.loads(listeners.read_bytes())
                need(type(ports) is list and len(ports)==2 and len(set(ports))==2 and all(type(port) is int for port in ports),'listener-private-shape')
                need(all(listener_absent(port) for port in ports),'tls-listener-remains')
                report['tls_listeners_absent']=True
        except Exception as error:
            process_ok=False;report['process_cleanup_failure_type']=type(error).__name__
        report['process_cleanup_complete']=process_ok
        if not process_ok:
            report['status']='FAIL; NO ACCEPTANCE'
        cleanup_ok=process_ok
        for service in reversed(created):
            try:
                # Missing resources are fine only if the exact planned name is
                # absent; never broaden removal to a label/name prefix.
                names = docker("ps", "-a", "--filter", "name=^/" + name + "-" + service + "$", "--format", "{{.Names}}").decode().splitlines()
                if names:
                    need(names == [name + "-" + service], "cleanup-exact-name")
                    value = inspect_container(service); cleanup_identity(value, identifier, service)
                    docker("rm", "-f", "-v", value["Id"])
                need(not docker("ps","-a","--filter","name=^/"+name+"-"+service+"$","--format","{{.Names}}").strip(),'cleanup-service-remains')
            except Exception as error:
                cleanup_ok=False;report['status']='FAIL; NO ACCEPTANCE'
                report.setdefault('container_cleanup_errors',[]).append({'service':service,'type':type(error).__name__})
        try:
            if plan["network_planned"]:
                remove_planned_network(docker, identifier)
        except Exception as error:
            cleanup_ok=False;report['status']='FAIL; NO ACCEPTANCE';report['network_cleanup_failure_type']=type(error).__name__
        try:
            need(not docker("ps", "-a", "--filter", "label=echs.journal.http.run=" + identifier, "--format", "{{.ID}}").strip(), "cleanup-containers-remain")
        except Exception as error:
            cleanup_ok=False;report["status"] = "FAIL; NO ACCEPTANCE"; report["cleanup_failure_type"] = type(error).__name__
        try:
            final_receipt=verify(repo,True)
            need(final_receipt==receipt,'cleanup-source-drift')
            save(run_dir/'final-source-receipt.json',final_receipt)
        except Exception as error:
            cleanup_ok=False;report['status']='FAIL; NO ACCEPTANCE';report['final_source_failure_type']=type(error).__name__
        # Source/reporting errors must never bypass guarded private cleanup.
        try:
            require_private_directory(secrets_dir,run_dir)
            need(run_dir.resolve().parent == (HERE / "runs").resolve(), "secret-cleanup-path")
            shutil.rmtree(secrets_dir)
            need(not secrets_dir.exists(),'secrets-remain');report['secrets_removed']=True
        except Exception as error:
            cleanup_ok=False;report['status']='FAIL; NO ACCEPTANCE';report['private_cleanup_failure_type']=type(error).__name__
        report["cleanup_complete"] = cleanup_ok
        # Closed metadata-only evidence is copied into a fresh artifact directory.
        # No service logs, config files, JWTs, tokens, bodies or private pipes.
        save(run_dir / "run-report.json", report)
        artifact = Path(os.environ["RUNNER_TEMP"]) / ("private-learning-browser-journal-http-" + str(args.postgres_major))
        need(not artifact.exists(), "fresh-artifact-directory"); artifact.mkdir(mode=0o700)
        rows = []
        for filename in ("checkout.json", "source-receipt.json", "image-receipt.json", "http-results.json", "browser-results.json", "dependency-receipt.json", "tls-material.json", "final-source-receipt.json", "run-report.json"):
            path = run_dir / filename
            if path.exists():
                data = path.read_bytes(); need(len(data) <= 1024 * 1024, "artifact-size")
                (artifact / filename).write_bytes(data); rows.append({"path": filename, "bytes": len(data), "sha256": sha(data)})
        save(artifact / "run-members.json", {"status": report["status"], "members": rows, "cleanup_complete": cleanup_ok})
    print(json.dumps({"status": report["status"], "postgres_major": args.postgres_major, "cleanup_complete": cleanup_ok, "run_id": identifier}))
    return 0 if report["status"] == "ACTUAL BROWSER JOURNAL SERVICES PASS" and cleanup_ok else 1


if __name__ == "__main__":
    try: raise SystemExit(main())
    except Exception as error:
        print(json.dumps({"status": "REJECTED; NO ACCEPTANCE", "type": type(error).__name__}))
        raise SystemExit(1)
