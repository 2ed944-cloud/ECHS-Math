"""Offline source/configuration/cleanup fault tests. No Docker or SQL calls."""
import base64
import copy
import hashlib
import hmac
import io
import json
import sys
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from unittest.mock import patch
import fixture
import run_services as run

RUN = "a" * 32
NAME = fixture.project(RUN)


def network_fixture():
    values = {}
    members = {}
    for index, service in enumerate(("db", "rest"), 2):
        identifier = str(index) * 64
        members[identifier] = {}
        values[service] = {"Id": identifier, "Name": "/" + NAME + "-" + service, "Image": "sha256:" + "c" * 64,
                           "Config": {"Labels": {"echs.journal.http.run": RUN, "echs.journal.http.service": service}},
                           "HostConfig": {"PortBindings": {}}, "NetworkSettings": {"Networks": {NAME: {"IPAddress": "172.29.0." + str(index)}}}}
    network = {"Name": NAME, "Id": "d" * 64, "Driver": "bridge", "Internal": True, "EnableIPv6": False,
               "Labels": {"echs.journal.http.run": RUN}, "IPAM": {"Config": [{"Subnet": "172.29.0.0/24"}]}, "Containers": members}
    return network, values


class Guards(unittest.TestCase):
    def test_01_closed_postgres15_and17_matrix(self):
        for major in (15, 17): self.assertEqual(fixture.image_tags(major)["db"], "postgres:" + str(major))
        for major in (14, 16, 18, "17", True, None):
            with self.assertRaises(ValueError): fixture.image_tags(major)

    def test_02_ephemeral_jwts_are_valid_and_role_distinct(self):
        value = fixture.credentials()
        self.assertRegex(value["password"], r"^[a-f0-9]{48}$")
        tokens = set()
        for name, role in (("service_key", "service_role"), ("anon_key", "anon"), ("authenticated_key", "authenticated")):
            token = value[name]; tokens.add(token)
            head, body, signature = token.split(".")
            self.assertEqual(json.loads(base64.urlsafe_b64decode(body + "=="))["role"], role)
            expected = hmac.new(value["jwt_secret"].encode(), (head + "." + body).encode(), hashlib.sha256).digest()
            self.assertEqual(base64.urlsafe_b64decode(signature + "=="), expected)
        self.assertEqual(len(tokens), 3)

    def test_03_postgrest_config_fixed_host_and_no_in_database_override(self):
        config = fixture.rest_environment("a" * 48, "b" * 64)
        self.assertIn("@db:5432/echs_journal_http_fixture?application_name=echs-journal-http-postgrest", config["PGRST_DB_URI"])
        self.assertEqual(config["PGRST_DB_CONFIG"], "false")
        self.assertEqual(config["PGRST_DB_SCHEMAS"], "public")
        with self.assertRaises(ValueError): fixture.rest_environment("remote;host=example.com", "b" * 64)

    def test_04_owned_internal_network_accepts_exact_two_members(self):
        network, values = network_fixture()
        result = fixture.owned_network(network, values, RUN)
        self.assertEqual(result["services"]["rest"]["ipv4"], "172.29.0.3")
        self.assertFalse(result["published_ports"])

    def test_05_network_owner_and_unexpected_members_are_rejected(self):
        for change in (lambda n: n["Labels"].clear(), lambda n: n["Containers"].update({"e" * 64: {}})):
            network, values = network_fixture(); change(network)
            with self.assertRaises(ValueError): fixture.owned_network(network, values, RUN)

    def test_06_published_ports_and_secondary_attachment_rejected(self):
        for change in (lambda c: c["HostConfig"]["PortBindings"].update({"5432/tcp": [{"HostPort": "5432"}]}), lambda c: c["NetworkSettings"]["Networks"].update({"bridge": {"IPAddress": "172.18.0.3"}})):
            network, values = network_fixture(); change(values["db"])
            with self.assertRaises(ValueError): fixture.owned_network(network, values, RUN)

    def test_07_public_subnet_and_external_network_rejected(self):
        for change in (lambda n: n["IPAM"]["Config"][0].update({"Subnet": "8.8.8.0/24"}), lambda n: n.update({"Internal": False}), lambda n: n.update({"EnableIPv6": True})):
            network, values = network_fixture(); change(network)
            with self.assertRaises(ValueError): fixture.owned_network(network, values, RUN)

    def test_08_cleanup_requires_exact_container_ownership(self):
        _, values = network_fixture(); fixture.cleanup_identity(values["db"], RUN, "db")
        changed = copy.deepcopy(values["db"]); changed["Config"]["Labels"]["echs.journal.http.run"] = "b" * 32
        with self.assertRaises(ValueError): fixture.cleanup_identity(changed, RUN, "db")

    def test_09_execution_requires_github_hosted_linux_and_exact_workspace(self):
        repo = Path.cwd(); env = {"GITHUB_ACTIONS": "true", "RUNNER_ENVIRONMENT": "github-hosted", "GITHUB_WORKSPACE": str(repo), "GITHUB_SHA": "f" * 40}
        fixture.execution_guard(env, "linux", repo)
        for update in ({"GITHUB_ACTIONS": "false"}, {"RUNNER_ENVIRONMENT": "self-hosted"}, {"GITHUB_WORKSPACE": str(repo.parent)}, {"GITHUB_SHA": "main"}):
            with self.assertRaises(ValueError): fixture.execution_guard({**env, **update}, "linux", repo)
        with self.assertRaises(ValueError): fixture.execution_guard(env, "win32", repo)

    def test_10_ambient_credentials_and_connection_overrides_rejected(self):
        repo = Path.cwd(); env = {"GITHUB_ACTIONS": "true", "RUNNER_ENVIRONMENT": "github-hosted", "GITHUB_WORKSPACE": str(repo), "GITHUB_SHA": "f" * 40}
        for name in ("PGHOST", "SUPABASE_ACCESS_TOKEN", "DATABASE_URL", "DOCKER_HOST", "DOCKER_CONTEXT", "https_proxy", "NODE_OPTIONS"):
            with self.assertRaises(ValueError): fixture.execution_guard({**env, name: "synthetic"}, "linux", repo)

    def test_11_ambiguous_network_create_is_registered_then_cleaned(self):
        state = {"exists": False}; plan = {}
        def docker(*args):
            if args[:2] == ("network", "create"):
                state["exists"] = True; raise TimeoutError("synthetic create acknowledgement loss")
            if args[:2] == ("network", "ls"): return (NAME + "\n" if state["exists"] else "").encode()
            if args[:2] == ("network", "inspect"): return json.dumps([{"Name": NAME, "Id": "c" * 64, "Labels": {"echs.journal.http.run": RUN}, "Containers": {}}]).encode()
            if args[:2] == ("network", "rm"): state["exists"] = False; return b""
            self.fail("unexpected command")
        with self.assertRaises(TimeoutError): run.start_network(docker, RUN, plan)
        self.assertTrue(plan["network_planned"])
        run.remove_planned_network(docker, RUN); self.assertFalse(state["exists"])

    def test_12_foreign_network_is_never_removed(self):
        removed = []
        def docker(*args):
            if args[:2] == ("network", "ls"): return (NAME + "\n").encode()
            if args[:2] == ("network", "inspect"): return json.dumps([{"Name": NAME, "Id": "c" * 64, "Labels": {"echs.journal.http.run": "b" * 32}, "Containers": {}}]).encode()
            removed.append(args); return b""
        with self.assertRaises(ValueError): run.remove_planned_network(docker, RUN)
        self.assertEqual(removed, [])

    def test_13_network_absence_must_be_verified_after_removal(self):
        def docker(*args):
            if args[:2] == ("network", "ls"): return (NAME + "\n").encode()
            if args[:2] == ("network", "inspect"): return json.dumps([{"Name": NAME, "Id": "c" * 64, "Labels": {"echs.journal.http.run": RUN}, "Containers": {}}]).encode()
            return b""
        with self.assertRaises(ValueError): run.remove_planned_network(docker, RUN)

    def test_14_readiness_redirects_are_not_followed(self):
        self.assertIsNone(run.NoRedirect().redirect_request(None, None, 302, "found", {}, "https://example.com"))

    def test_15_source_preflight_matches_exact_inputs_and_both_matrix_targets(self):
        repo = Path(sys.argv[1]).resolve()
        before = fixture.source_receipt(repo)
        for major in (15, 17):
            with patch.object(sys, "argv", ["run.py", "--repo", str(repo), "--postgres-major", str(major)]), patch.object(subprocess_guard, "run", side_effect=AssertionError("unexpected child")), redirect_stdout(io.StringIO()) as stream:
                self.assertEqual(run.main(), 0)
                self.assertFalse(json.loads(stream.getvalue())["actual_http"])
        self.assertEqual(fixture.source_receipt(repo), before)


    def test_16_direct_sql_readiness_requires_exact_postgrest_status_and_code(self):
        self.assertEqual(run.readiness_observation(403, b'{"code":"28000"}'), {"http_status": 403, "code": "28000", "ready": True})
        for status, payload in ((401, b'{"code":"28000"}'), (403, b'{"code":"42501"}'), (200, b'{"code":"28000"}'), (403, b'{}'), (403, b'not json'), (403, b'{"code":"28000","padding":"' + b'x' * 1024 + b'"}')):
            self.assertFalse(run.readiness_observation(status, payload)["ready"])
        for status in (301, 302, 303, 307, 308):
            with self.assertRaises(ValueError): run.readiness_observation(status, b'{"code":"28000"}')

    def test_17_readiness_metadata_never_retains_raw_response_fields(self):
        for payload in (b'{"code":"28000","details":"synthetic-private-value"}', b'{"code":"synthetic-private-value"}', b'{"code":28000}', b'[]', b'\xff'):
            observed = run.readiness_observation(403, payload)
            self.assertEqual(set(observed), {"http_status", "code", "ready"})
            self.assertNotIn("synthetic-private-value", json.dumps(observed))
            self.assertTrue(observed["code"] is None or observed["code"] == "28000")


subprocess_guard = run.subprocess
if __name__ == "__main__":
    output = Path(sys.argv[2])
    result = unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(Guards))
    report = {"contract": "echs.c04.owner-fence-retry-offline.v1", "status": "PASS" if result.wasSuccessful() else "FAIL", "groups": result.testsRun, "failed": len(result.failures), "errors": len(result.errors), "skipped": len(result.skipped), "docker_executed": False, "database_executed": False, "network_requests": 0}
    with output.open("x", encoding="utf-8") as stream: json.dump(report, stream, indent=2); stream.write("\n")
    raise SystemExit(0 if result.wasSuccessful() else 1)
