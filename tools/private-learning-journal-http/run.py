"""Disposable HTTP/PostgREST integration. Default is a network-free source preflight."""
import argparse
import hashlib
import importlib.metadata
import json
import os
import re
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.request
import uuid
from pathlib import Path
from fixture import HERE, DATABASE, credentials, execution_guard, image_tags, install, need, owned_network, cleanup_identity, project, rest_environment, sha, source_receipt

PREFIX = "tools/private-learning-journal-http/"
WORKFLOW = ".github/workflows/private-learning-journal-http.yml"


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


def local_path(path, repo, published):
    if published or HERE.resolve() == (repo / PREFIX).resolve():
        return repo / path
    if path == WORKFLOW:
        return HERE / "workflow.yml"
    need(path.startswith(PREFIX) and ".." not in Path(path).parts, "candidate-source-path")
    return HERE / path.removeprefix(PREFIX)


def verify(repo, published=False):
    inputs = source_receipt(repo)
    raw = (HERE / "source-manifest.json").read_bytes()
    manifest = json.loads(raw)
    need(manifest["contract"] == "echs.c04.journal-http-service-sources.v1", "manifest")
    paths = set()
    for row in manifest["files"]:
        need(row["path"] not in paths, "source-duplicate"); paths.add(row["path"])
        content = local_path(row["path"], repo, published).read_bytes()
        need(len(content) == row["bytes"] and sha(content) == row["sha256"], "source-changed")
    need(WORKFLOW in paths and PREFIX + "run.py" in paths and PREFIX + "input-pins.json" in paths, "source-closure")
    return {"manifest_sha256": sha(raw), "source_files": manifest["files"], "inputs": inputs}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", type=Path, default=HERE.parents[1])
    parser.add_argument("--postgres-major", type=int, choices=(15, 17), required=True)
    parser.add_argument("--execute", action="store_true")
    args = parser.parse_args(); repo = args.repo.resolve(); tags = image_tags(args.postgres_major)
    receipt = verify(repo, args.execute)
    if not args.execute:
        print(json.dumps({"status": "SOURCE PREFLIGHT PASS; SERVICES NOT EXECUTED", "postgres_major": args.postgres_major, "images": tags, "source_files": len(receipt["source_files"]), "inputs": len(receipt["inputs"]), "actual_http": False}))
        return 0
    execution_guard(os.environ, sys.platform, repo)
    need(importlib.metadata.version("psycopg") == "3.2.9", "driver-version")
    import psycopg
    paths = {name: shutil.which(name) for name in ("docker", "node", "git")}
    need(all(paths.values()), "runner-tools")
    identifier = uuid.uuid4().hex; name = project(identifier)
    run_dir = HERE / "runs" / identifier
    need(not run_dir.exists() and run_dir.resolve().parent == (HERE / "runs").resolve(), "fresh-run-directory")
    for parent in (HERE, *HERE.parents): need(not parent.is_symlink(), "linked-workspace")
    run_dir.mkdir(parents=True, mode=0o700)
    secrets_dir = run_dir / "secrets"; secrets_dir.mkdir(mode=0o700)
    (secrets_dir / "home").mkdir(); (secrets_dir / "docker").mkdir()
    env = {"PATH": os.environ["PATH"], "HOME": str(secrets_dir / "home"), "DOCKER_CONFIG": str(secrets_dir / "docker"), "LANG": "C.UTF-8", "PYTHONDONTWRITEBYTECODE": "1", "GITHUB_ACTIONS": "true", "RUNNER_ENVIRONMENT": "github-hosted"}
    stage = "checkout"; created = []; plan = {"network_planned": False}; cleanup_ok = False
    report = {"contract": "echs.c04.journal-http-service-run.v1", "status": "RUNNING; NOT ACCEPTED", "run_id": identifier, "postgres_major": args.postgres_major, "production_calls": 0, "hosted_edge_executed": False, "tls_executed": False, "browser_persistence_executed": False, "service_start_attempted": False, "cleanup_complete": False}
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
    try:
        need(command([paths["git"], "-C", str(repo), "rev-parse", "HEAD"]).decode().strip() == os.environ["GITHUB_SHA"], "checkout-head")
        report["tested_sha"] = os.environ["GITHUB_SHA"]
        report["tested_tree"] = command([paths["git"], "-C", str(repo), "rev-parse", "HEAD^{tree}"]).decode().strip()
        # Compare all executable candidate sources and the manifest to actual Git
        # HEAD; immutable prerequisite hashes are verified independently above.
        for row in receipt["source_files"]:
            data = command([paths["git"], "-C", str(repo), "show", "HEAD:" + row["path"]])
            need(len(data) == row["bytes"] and sha(data) == row["sha256"], "checkout-source")
        need(command([paths["git"], "-C", str(repo), "show", "HEAD:" + PREFIX + "source-manifest.json"]) == (HERE / "source-manifest.json").read_bytes(), "checkout-manifest")
        save(run_dir / "source-receipt.json", receipt)
        need(json.loads(docker("context", "inspect", "default", "--format", "{{json .Endpoints.docker.Host}}")) == "unix:///var/run/docker.sock", "local-docker-only")
        need(not docker("network", "ls", "--filter", "name=^" + name + "$", "--format", "{{.Name}}").strip(), "fresh-network")
        need(not docker("ps", "-a", "--filter", "label=echs.journal.http.run=" + identifier, "--format", "{{.ID}}").strip(), "fresh-containers")
        stage = "image-resolution"; images = {}
        for service, tag in tags.items():
            docker("pull", "--platform", "linux/amd64", tag, timeout=240)
            value = json.loads(docker("image", "inspect", tag))[0]
            need(value["Os"] == "linux" and value["Architecture"] == "amd64" and re.fullmatch("sha256:[a-f0-9]{64}", value["Id"]), "image-platform")
            repository = tag.rsplit(":", 1)[0]
            digests = [x for x in value["RepoDigests"] if x.startswith(repository + "@sha256:")]
            need(len(digests) == 1 and re.fullmatch(re.escape(repository) + r"@sha256:[a-f0-9]{64}", digests[0]), "image-digest")
            images[service] = {"tag": tag, "image_id": value["Id"], "repository_digest": digests[0]}
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
        with db: report["installation"] = install(db, repo, values["password"], identifier, args.postgres_major)
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
        config = {"contract": "echs.c04.journal-http-private-run.v1", "run_id": identifier, "db_ip": db_ip, "rest_ip": rest_ip, "password": values["password"], "service_key": values["service_key"], "anon_key": values["anon_key"], "authenticated_key": values["authenticated_key"], "source_manifest_sha256": receipt["manifest_sha256"]}
        private_config = private_file("control-private.json", config)
        stage = "actual-http-cases"
        command([paths["node"], str(HERE / "test_http.mjs"), str(private_config), sys.executable, str(run_dir / "http-results.json")], timeout=180)
        outcome = json.loads((run_dir / "http-results.json").read_text())
        need(outcome["status"] == "ACTUAL HTTP POSTGREST SQL PASS" and outcome["checks"] == outcome["planned_groups"] and len(outcome["checks"]) == 20, "http-acceptance")
        need(outcome["real_http_executed"] is True and outcome["postgrest_executed"] is True and outcome["database_executed"] is True, "actual-execution")
        need(verify(repo, True) == receipt, "source-drift")
        report["status"] = "ACTUAL HTTP POSTGREST SQL PASS"; report["groups"] = 20
    except Exception as error:
        report["status"] = "FAIL; NO ACCEPTANCE"; report["failure"] = {"stage": stage, "type": type(error).__name__, "sqlstate": getattr(error, "sqlstate", None)}
    finally:
        try:
            for service in reversed(created):
                # Missing resources are fine only if the exact planned name is
                # absent; never broaden removal to a label/name prefix.
                names = docker("ps", "-a", "--filter", "name=^/" + name + "-" + service + "$", "--format", "{{.Names}}").decode().splitlines()
                if names:
                    need(names == [name + "-" + service], "cleanup-exact-name")
                    value = inspect_container(service); cleanup_identity(value, identifier, service)
                    docker("rm", "-f", "-v", value["Id"])
            if plan["network_planned"]:
                remove_planned_network(docker, identifier)
            need(not docker("ps", "-a", "--filter", "label=echs.journal.http.run=" + identifier, "--format", "{{.ID}}").strip(), "cleanup-containers-remain")
            cleanup_ok = True
        except Exception as error:
            report["status"] = "FAIL; NO ACCEPTANCE"; report["cleanup_failure_type"] = type(error).__name__
        report["cleanup_complete"] = cleanup_ok
        need(secrets_dir.resolve().parent == run_dir.resolve() and run_dir.resolve().parent == (HERE / "runs").resolve(), "secret-cleanup-path")
        shutil.rmtree(secrets_dir)
        # Closed metadata-only evidence is copied into a fresh artifact directory.
        # No service logs, config files, JWTs, tokens, bodies or private pipes.
        save(run_dir / "run-report.json", report)
        artifact = Path(os.environ["RUNNER_TEMP"]) / ("private-learning-journal-http-" + str(args.postgres_major))
        need(not artifact.exists(), "fresh-artifact-directory"); artifact.mkdir(mode=0o700)
        rows = []
        for filename in ("source-receipt.json", "image-receipt.json", "http-results.json", "run-report.json"):
            path = run_dir / filename
            if path.exists():
                data = path.read_bytes(); need(len(data) <= 1024 * 1024, "artifact-size")
                (artifact / filename).write_bytes(data); rows.append({"path": filename, "bytes": len(data), "sha256": sha(data)})
        save(artifact / "artifact-index.json", {"status": report["status"], "members": rows, "cleanup_complete": cleanup_ok})
    print(json.dumps({"status": report["status"], "postgres_major": args.postgres_major, "cleanup_complete": cleanup_ok, "run_id": identifier}))
    return 0 if report["status"] == "ACTUAL HTTP POSTGREST SQL PASS" and cleanup_ok else 1


if __name__ == "__main__":
    try: raise SystemExit(main())
    except Exception as error:
        print(json.dumps({"status": "REJECTED; NO ACCEPTANCE", "type": type(error).__name__}))
        raise SystemExit(1)
