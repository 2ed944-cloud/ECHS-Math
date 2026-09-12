"""Synthetic-only configuration and source guards. Importing never connects."""
import base64
import hashlib
import hmac
import ipaddress
import json
import os
import re
import secrets
import time
from pathlib import Path
import contract as provenance

HERE = Path(__file__).resolve().parent
IMAGES = {"db": None, "rest": "postgrest/postgrest:v14.17"}
DATABASE = "echs_journal_http_fixture"


def image_tags(major):
    need(type(major) is int and major in (15, 17), "postgres-matrix")
    return {"db": "postgres:" + str(major), "rest": IMAGES["rest"]}


def need(value, label):
    if not value:
        raise ValueError(label)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def run_id(value):
    need(type(value) is str and re.fullmatch("[a-f0-9]{32}", value), "run-id")
    return value


def project(value):
    return "echs-journal-http-" + run_id(value)


def source_receipt(repo):
    need(repo.resolve() == provenance.REPO.resolve(), "successor-repository")
    pins, _ = provenance.sources()
    return pins["files"]


def execution_guard(environ, platform, repo):
    need(platform == "linux" and environ.get("GITHUB_ACTIONS") == "true" and environ.get("RUNNER_ENVIRONMENT") == "github-hosted", "github-hosted-only")
    need(Path(environ.get("GITHUB_WORKSPACE", "/absent")).resolve() == repo.resolve(), "workspace")
    need(re.fullmatch("[a-f0-9]{40}", environ.get("GITHUB_SHA", "")), "checkout")
    forbidden = ("PG", "SUPABASE_", "DATABASE_", "DOCKER_HOST", "DOCKER_CONTEXT", "HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "NODE_OPTIONS")
    need(not any(k.upper().startswith(forbidden) for k in environ), "ambient-connection-override")


def credentials():
    secret = secrets.token_hex(32)
    def jwt(role):
        def b64(data):
            return base64.urlsafe_b64encode(data).rstrip(b"=").decode()
        content = {"role": role, "iat": int(time.time()) - 1, "exp": int(time.time()) + 3600}
        body = b64(b'{"alg":"HS256","typ":"JWT"}') + "." + b64(json.dumps(content, separators=(",", ":")).encode())
        return body + "." + b64(hmac.new(secret.encode(), body.encode(), hashlib.sha256).digest())
    return {"password": secrets.token_hex(24), "jwt_secret": secret, "service_key": jwt("service_role"), "anon_key": jwt("anon"), "authenticated_key": jwt("authenticated")}


def owned_network(network, inspections, identifier):
    name = project(identifier)
    need(network["Name"] == name and network["Driver"] == "bridge" and network["Internal"] is True and network["EnableIPv6"] is False, "network-boundary")
    need(network.get("Labels") == {"echs.journal.http.run": identifier}, "network-owner")
    subnet = ipaddress.IPv4Network(network["IPAM"]["Config"][0]["Subnet"], strict=True)
    ranges = [ipaddress.ip_network(x) for x in ("10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16")]
    need(any(subnet.subnet_of(x) for x in ranges), "network-private")
    expected_ids = {value["Id"] for value in inspections.values()}
    need(set(network["Containers"]) == expected_ids, "network-members")
    observed = {}
    for service, value in inspections.items():
        need(service in IMAGES and value["Name"] == "/" + name + "-" + service, "container-name")
        need(value["Config"]["Labels"].get("echs.journal.http.run") == identifier and value["Config"]["Labels"].get("echs.journal.http.service") == service, "container-owner")
        need(not value["HostConfig"].get("PortBindings") and set(value["NetworkSettings"]["Networks"]) == {name}, "unpublished-network")
        address = value["NetworkSettings"]["Networks"][name]["IPAddress"]
        need(ipaddress.IPv4Address(address) in subnet, "container-ip")
        observed[service] = {"container_id": value["Id"], "ipv4": address, "image_id": value["Image"]}
    return {"name": name, "network_id": network["Id"], "internal": True, "published_ports": False, "services": observed}


def cleanup_identity(value, identifier, service):
    name = project(identifier)
    need(service in IMAGES and value["Name"] == "/" + name + "-" + service, "cleanup-name")
    need(value["Config"]["Labels"].get("echs.journal.http.run") == identifier and value["Config"]["Labels"].get("echs.journal.http.service") == service, "cleanup-owner")
    need(set(value["NetworkSettings"]["Networks"]) == {name}, "cleanup-network")


def rest_environment(password, secret):
    need(re.fullmatch("[a-f0-9]{48}", password) and re.fullmatch("[a-f0-9]{64}", secret), "generated-credentials")
    return {"PGRST_DB_URI": "postgres://authenticator:" + password + "@db:5432/" + DATABASE + "?application_name=echs-journal-http-postgrest",
            "PGRST_DB_SCHEMAS": "public", "PGRST_DB_ANON_ROLE": "anon", "PGRST_JWT_SECRET": secret,
            "PGRST_DB_CONFIG": "false", "PGRST_DB_POOL": "4", "PGRST_DB_POOL_ACQUISITION_TIMEOUT": "3",
            "PGRST_DB_PRE_REQUEST": "public.owner_fence_retry_attempt",
            "PGRST_SERVER_PORT": "3000", "PGRST_LOG_LEVEL": "crit"}


BOOTSTRAP = """
create role anon nologin noinherit nobypassrls;
create role authenticated nologin noinherit nobypassrls;
create role service_role nologin noinherit bypassrls;
create role fixture_unprivileged nologin noinherit nobypassrls;
create schema storage; create schema extensions;
create extension pgcrypto with schema extensions;
create table storage.buckets(id text primary key,name text not null,public boolean not null default false,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid primary key default extensions.gen_random_uuid(),bucket_id text references storage.buckets(id),name text,owner uuid,metadata jsonb);
grant usage on schema public,storage,extensions to anon,authenticated,service_role,fixture_unprivileged;
set search_path=public,extensions;
"""


def install(db, repo, password, identifier, major):
    from psycopg import sql
    records = source_receipt(repo)
    need(db.info.dbname == DATABASE and db.execute("select count(*) from pg_tables where schemaname in ('public','private','storage')").fetchone()[0] == 0, "empty-fixture-only")
    image_tags(major)
    need(int(db.execute("show server_version_num").fetchone()[0]) // 10000 == major, "postgres-major")
    need(db.execute("select count(*) from pg_roles where rolname in ('anon','authenticated','service_role','authenticator')").fetchone()[0] == 0, "empty-roles")
    with db.transaction():
        db.execute(BOOTSTRAP, prepare=False)
        for item in sorted((x for x in records if x["path"].startswith("supabase/migrations/")), key=lambda x: x["path"]):
            db.execute((repo / item["path"]).read_text(encoding="utf-8"), prepare=False)
        provenance.validate_delta()
        db.execute((HERE / "owner-fence.sql").read_text(encoding="utf-8"), prepare=False)
        db.execute((repo / "tools/private-learning-operation-journal/operation-journal.sql").read_text(encoding="utf-8"), prepare=False)
        # A fixture-only nontransactional counter observes attempts even when
        # the request transaction aborts. Never installed in production SQL.
        db.execute("""create sequence private.owner_fence_retry_attempts;
        create function public.owner_fence_retry_attempt() returns void
        language plpgsql volatile security definer set search_path=pg_catalog as $$
        begin perform nextval('private.owner_fence_retry_attempts'); end $$;
        create function public.owner_fence_retry_probe(p_action text,p_org uuid,p_account uuid) returns void
        language plpgsql volatile security definer set search_path=pg_catalog as $$
        begin
          if p_action='adopt' then
            insert into private.learning_owner_routes(organization_id,account_id) values(p_org,p_account);
          elsif p_action='truncate' then
            truncate public.learning_sessions;
          else raise exception using errcode='22023',message='Invalid fixture action'; end if;
        end $$;
        revoke all on function public.owner_fence_retry_attempt() from public;
        revoke all on function public.owner_fence_retry_probe(text,uuid,uuid) from public,anon,authenticated;
        grant execute on function public.owner_fence_retry_attempt() to anon,authenticated,service_role;
        grant execute on function public.owner_fence_retry_probe(text,uuid,uuid) to service_role;""", prepare=False)
        db.execute(sql.SQL("create role authenticator login noinherit password {}").format(sql.Literal(password)))
        db.execute("grant anon, authenticated, service_role to authenticator")
        db.execute("alter role service_role set statement_timeout='8s'")
        db.execute("alter role service_role set lock_timeout='6s'")
        db.execute(sql.SQL("comment on database {} is {}").format(sql.Identifier(DATABASE), sql.Literal(project(identifier))))
    need(db.execute("select count(*) from private.learning_journal_owners").fetchone()[0] == 0, "no-automatic-adoption")
    return {"migrations": 27, "journal_owners_initial": 0, "postgres_version": db.execute("show server_version").fetchone()[0], "storage_service_executed": False}
