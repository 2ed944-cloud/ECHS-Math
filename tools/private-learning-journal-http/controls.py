"""Closed synthetic SQL controls over a private parent pipe. No SQL RPC adapter."""
import hashlib
import json
import ipaddress
import os
import sys
import time
import uuid
from pathlib import Path
from fixture import HERE, DATABASE, need, project, sha


def main(config_path):
    import psycopg
    from psycopg import sql
    path = Path(config_path).resolve()
    config = json.loads(path.read_text())
    need(sys.platform == "linux" and os.environ.get("GITHUB_ACTIONS") == "true" and os.environ.get("RUNNER_ENVIRONMENT") == "github-hosted", "disposable-runner-only")
    need(path.name == "control-private.json" and path.parent.name == "secrets" and path.parents[1].name == config["run_id"] and path.parents[2] == (HERE / "runs").resolve(), "owned-control-path")
    need(sha((HERE / "source-manifest.json").read_bytes()) == config["source_manifest_sha256"], "source-manifest")
    address = ipaddress.IPv4Address(config["db_ip"])
    need(any(address in ipaddress.ip_network(value) for value in ("10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16")), "owned-bridge-address")
    def connect():
        db = psycopg.connect(host=config["db_ip"], hostaddr=config["db_ip"], port=5432, dbname=DATABASE, user="postgres", password=config["password"], sslmode="disable", autocommit=True, connect_timeout=5)
        need(db.execute("select shobj_description(oid,'pg_database') from pg_database where datname=current_database()").fetchone()[0] == project(config["run_id"]), "fixture-database-marker")
        db.execute("set statement_timeout='5s'")
        return db
    db = connect()
    cases = {}
    locker = None
    fault = False
    def emit(value):
        print(json.dumps(value, separators=(",", ":")), flush=True)
    def token(account):
        raw = "synthetic-journal-http-" + uuid.uuid4().hex
        db.execute("select public.api_create_session(%s,%s,clock_timestamp()+interval '1 hour','fixture','owned-bridge')", (account, hashlib.sha256(raw.encode()).hexdigest()))
        return raw
    def new_case(role):
        need(role in ("student", "teacher", "parent", "admin") and len(cases) < 40, "case-limit")
        org, account, case = uuid.uuid4(), uuid.uuid4(), uuid.uuid4().hex
        with db.transaction():
            db.execute("insert into public.organizations(id,name,slug) values(%s,'Synthetic HTTP fixture',%s)", (org, "journal-http-" + case))
            db.execute("insert into public.accounts(id,organization_id,username,display_name,role,status) values(%s,%s,%s,'Synthetic HTTP actor',%s,'active')", (account, org, "journal-http-" + case, role))
            incarnation = db.execute("select id from private.learning_owner_fences where live_account_id=%s", (account,)).fetchone()[0]
            db.execute("insert into private.learning_owner_routes(organization_id,account_id) values(%s,%s)", (org, account))
            db.execute("insert into private.learning_journal_owners(organization_id,account_id,incarnation_id,adoption_epoch) values(%s,%s,%s,1)", (org, account, incarnation))
            raw = token(account)
        value = {"case": case, "owner": {"organization_id": str(org), "account_id": str(account), "incarnation_id": str(incarnation), "adoption_epoch": 1}, "token": raw}
        cases[case] = value
        return value
    def snapshot(case):
        owner = case["owner"]
        tables = ("learning_journal_owners", "learning_journal_operations", "learning_journal_attempts", "learning_journal_versions", "learning_journal_heads")
        result = {}
        for table in tables:
            rows = [r[0] for r in db.execute(sql.SQL("select to_jsonb(t)::text from private.{} t where incarnation_id=%s order by to_jsonb(t)::text").format(sql.Identifier(table)), (owner["incarnation_id"],))]
            digest = hashlib.sha256()
            for raw in sorted(x.encode() for x in rows):
                digest.update(len(raw).to_bytes(8, "big")); digest.update(raw)
            result[table] = {"count": len(rows), "sha256": digest.hexdigest()}
        return result
    emit({"ready": True})
    try:
        for line in sys.stdin:
            identifier = None
            try:
                need(len(line.encode()) <= 4096, "control-size")
                request = json.loads(line)
                identifier = request.get("id")
                need(type(identifier) is int and 1 <= identifier <= 1000, "control-id")
                action = request.get("action")
                if action == "new":
                    need(set(request) == {"id", "action", "role"}, "control-shape")
                    result = new_case(request["role"])
                else:
                    allowed = {"id", "action", "case", "operation_id"} if action == "operation" else {"id", "action", "case"}
                    need(set(request) == allowed and request["case"] in cases, "control-shape")
                    case = cases[request["case"]]; owner = case["owner"]
                    if action == "snapshot":
                        result = snapshot(case)
                    elif action == "operation":
                        op = str(uuid.UUID(request["operation_id"]))
                        need(op == request["operation_id"], "operation-id")
                        rows = db.execute("select request_text,receipt::text from private.learning_journal_operations where incarnation_id=%s and operation_id=%s", (owner["incarnation_id"], op)).fetchall()
                        need(len(rows) <= 1, "operation-unique")
                        result = None if not rows else {"request_text": rows[0][0], "receipt_text": rows[0][1]}
                    elif action in ("revoke", "expire", "demote"):
                        if action == "revoke": db.execute("update private.sessions set revoked_at=clock_timestamp() where account_id=%s", (owner["account_id"],))
                        elif action == "expire": db.execute("update private.sessions set expires_at=clock_timestamp()-interval '1 second' where account_id=%s", (owner["account_id"],))
                        else: db.execute("update public.accounts set role='parent' where id=%s", (owner["account_id"],))
                        result = True
                    elif action == "new_session":
                        result = token(owner["account_id"])
                    elif action == "lock":
                        need(locker is None, "one-lock")
                        locker = connect(); locker.execute("begin"); locker.execute("select incarnation_id from private.learning_journal_owners where incarnation_id=%s for update", (owner["incarnation_id"],))
                        result = True
                    elif action == "wait":
                        need(locker is not None, "held-lock")
                        deadline = time.monotonic() + 3; observed = False
                        while time.monotonic() < deadline:
                            db.execute("select pg_stat_clear_snapshot()")
                            if db.execute("select exists(select 1 from pg_stat_activity where application_name='echs-journal-http-postgrest' and wait_event_type='Lock' and query like '%%learning_journal_apply%%')").fetchone()[0]:
                                observed = True; break
                            time.sleep(.01)
                        need(observed, "actual-lock-wait"); result = True
                    elif action == "unlock":
                        need(locker is not None, "held-lock")
                        locker.execute("rollback"); locker.close(); locker = None; result = True
                    elif action == "fault":
                        need(not fault, "one-fault")
                        db.execute("create function private.journal_http_fixture_fail() returns trigger language plpgsql as $$begin raise exception 'Synthetic HTTP phase failure' using errcode='23514';end$$")
                        db.execute(sql.SQL("create trigger journal_http_fixture_fail after insert on private.learning_journal_heads for each row when (new.incarnation_id={}::uuid) execute function private.journal_http_fixture_fail()").format(sql.Literal(owner["incarnation_id"])))
                        fault = True; result = True
                    elif action == "unfault":
                        need(fault, "owned-fault")
                        db.execute("drop trigger journal_http_fixture_fail on private.learning_journal_heads")
                        db.execute("drop function private.journal_http_fixture_fail()")
                        fault = False; result = True
                    else:
                        raise ValueError("control-action")
                emit({"id": identifier, "data": result, "error": None})
            except Exception as error:
                emit({"id": identifier, "data": None, "error": {"type": type(error).__name__, "sqlstate": getattr(error, "sqlstate", None)}})
    finally:
        if locker is not None: locker.close()
        db.close()


if __name__ == "__main__":
    try: main(sys.argv[1])
    except Exception as error:
        print(json.dumps({"ready": False, "type": type(error).__name__, "sqlstate": getattr(error, "sqlstate", None)}), flush=True)
        raise SystemExit(1)
