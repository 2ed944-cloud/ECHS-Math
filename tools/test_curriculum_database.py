#!/usr/bin/env python3
"""Isolated PostgreSQL 15 integration tests. Never connect to a production database."""
from __future__ import annotations
import argparse
import copy
import hashlib
import json
import os
from pathlib import Path
import re
import uuid

NEW = "202609080001_curriculum_versions.sql"
TABLES = ("curriculum_versions", "course_versions", "class_course_version_assignments")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo-root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--legacy-root", type=Path)
    parser.add_argument("--static-only", action="store_true", help="Check migration/seed inputs only; does not claim database tests passed")
    parser.add_argument("--report", type=Path)
    args = parser.parse_args()
    root = args.repo_root.resolve()
    legacy_root = (args.legacy_root or root).resolve()
    legacy = sorted(p for p in (legacy_root / "supabase/migrations").glob("*.sql") if p.name < NEW)
    assert len(legacy) == 20, f"Expected the 20 audited legacy migrations; found {len(legacy)}"
    migration = root / "supabase/migrations" / NEW
    registry = json.loads((root / "curriculum/registry/course-versions.v1.json").read_text(encoding="utf-8"))
    source = migration.read_text(encoding="utf-8")
    for label, field in (("curriculum", "curriculum_versions"), ("courses", "course_versions")):
        match = re.search(rf"\${label}\$(.*?)\${label}\$", source, re.S)
        assert match and json.loads(match.group(1)) == registry[field], f"SQL {field} seeds differ from verified registry"
    assert len(registry["curriculum_versions"]) == 4 and len(registry["course_versions"]) == 5
    report = {"postgres_required": 15, "production_calls": False, "migration_count": 21, "checks": [],
              "migrations": [{"file": p.name, "sha256": hashlib.sha256(p.read_bytes()).hexdigest()} for p in [*legacy, migration]]}
    def passed(label):
        report["checks"].append(label)
        print("PASS " + label, flush=True)
    def finish(status):
        report["status"] = status
        if args.report:
            args.report.parent.mkdir(parents=True, exist_ok=True)
            args.report.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
        print(f"Curriculum database: {status}; {len(report['checks'])} checks")
    passed("21 migration inputs and exact 4/5 registry seed parity")
    if args.static_only:
        finish("STATIC INPUTS PASS; DATABASE NOT RUN")
        return

    import psycopg
    from psycopg import sql
    from psycopg.conninfo import conninfo_to_dict
    from psycopg.types.json import Jsonb
    dsn = os.environ.get("ECHS_CURRICULUM_TEST_DSN", "")
    assert dsn, "ECHS_CURRICULUM_TEST_DSN is required; no default database connection"
    info = conninfo_to_dict(dsn)
    assert info.get("host") in ("127.0.0.1", "localhost", "::1"), "Only an explicit loopback test server is allowed"
    assert info.get("dbname", "").startswith("echs_curriculum_test"), "Database name must begin echs_curriculum_test"
    assert not info.get("service") and not info.get("hostaddr"), "Connection-service/hostaddr overrides are not allowed"
    # Explicit hostaddr prevents environment/service defaults or DNS from moving
    # a test connection away from loopback after the DSN checks above.
    with psycopg.connect(dsn, hostaddr="::1" if info["host"] == "::1" else "127.0.0.1", autocommit=True) as conn:
        assert int(conn.execute("show server_version_num").fetchone()[0]) // 10000 == 15, "PostgreSQL 15 required"
        assert conn.execute("select current_database()").fetchone()[0].startswith("echs_curriculum_test")
        assert conn.execute("select count(*) from pg_tables where schemaname='public'").fetchone()[0] == 0, "Refusing a nonempty database"
        # Explicit fixture infrastructure, not production migrations or fake policy outcomes.
        conn.execute("""
          create role anon nologin noinherit nobypassrls;
          create role authenticated nologin noinherit nobypassrls;
          create role service_role nologin noinherit bypassrls;
          create role fixture_unprivileged nologin noinherit nobypassrls;
          create schema storage;
          create schema extensions;
          create extension pgcrypto with schema extensions;
          create table storage.buckets(id text primary key,name text not null,public boolean not null default false,file_size_limit bigint,allowed_mime_types text[]);
          grant usage on schema public,storage,extensions to anon,authenticated,service_role,fixture_unprivileged;
          set search_path=public,extensions;
        """)
        for path in legacy:
            conn.execute(path.read_text(encoding="utf-8"), prepare=False)
        passed("all 20 existing migrations executed on PostgreSQL 15")
        ids = {name: uuid.uuid4() for name in ("org_a", "org_b", "admin_a", "admin_b", "teacher", "student", "inactive_admin", "class_a", "class_b", "archived_class")}
        for suffix in ("a", "b"):
            conn.execute("insert into organizations(id,name,slug) values(%s,%s,%s)", (ids["org_"+suffix], "Fixture "+suffix, "fixture-"+suffix))
        for name, role, org, status in (("admin_a","admin","a","active"),("admin_b","admin","b","active"),("teacher","teacher","a","active"),("student","student","a","active"),("inactive_admin","admin","a","suspended")):
            conn.execute("insert into accounts(id,organization_id,username,display_name,role,status) values(%s,%s,%s,%s,%s,%s)", (ids[name],ids["org_"+org],"fixture-"+name,name,role,status))
        for name, org, status in (("class_a","a","active"),("class_b","b","active"),("archived_class","a","archived")):
            conn.execute("insert into classes(id,organization_id,name,course_key,academic_year,status,created_by) values(%s,%s,%s,'ap-calculus','2026-27',%s,%s)", (ids[name],ids["org_"+org],name,status,ids["admin_"+org]))
        conn.execute("insert into class_memberships(class_id,account_id,membership_role) values(%s,%s,'student')", (ids["class_a"],ids["student"]))
        conn.execute("insert into learning_attempts(organization_id,account_id,client_event_id,question_id,correct,occurred_at,course,payload) values(%s,%s,'preserved-event','fixture-question',true,now(),'fixture-legacy','{}')", (ids["org_a"],ids["student"]))
        conn.execute("insert into learning_sessions(organization_id,account_id,client_session_id,mode,course,total,started_at) values(%s,%s,'preserved-session','practice','ap-calculus',1,now())", (ids["org_a"],ids["student"]))
        conn.execute("insert into lesson_completions(organization_id,account_id,access_key,course_key,unit_index,topic,title,completed_at) values(%s,%s,'ap-calculus::0::1.7','ap-calculus',0,'1.7','Preserved lesson',now())", (ids["org_a"],ids["student"]))
        conn.execute("insert into mastery_records(organization_id,account_id,skill_key,score,source,payload) values(%s,%s,'fixture-preserved-skill',40,'server','{\"algorithm\":\"echs-mastery-2.0-foundation\"}')", (ids["org_a"],ids["student"]))
        legacy_tables = [row[0] for row in conn.execute("select tablename from pg_tables where schemaname='public' order by tablename")]
        def snapshot():
            return {table: sorted(json.dumps(row[0], sort_keys=True, default=str) for row in conn.execute(sql.SQL("select to_jsonb(t) from public.{} t").format(sql.Identifier(table)))) for table in legacy_tables}
        before = snapshot()
        conn.execute(source, prepare=False)
        assert snapshot() == before, "Additive migration changed existing data"
        assert conn.execute("select count(*) from class_course_version_assignments").fetchone()[0] == 0
        passed("new migration applied; all legacy table rows unchanged; no automatic assignments")

        def run(statement, params=(), role="service_role"):
            with conn.transaction():
                conn.execute(sql.SQL("set local role {}").format(sql.Identifier(role)))
                return conn.execute(statement, params).fetchall() if statement.lstrip().lower().startswith("select") else conn.execute(statement, params)
        def rejects(label, action, code=None):
            try:
                with conn.transaction():
                    action()
            except psycopg.Error as exc:
                if code: assert exc.sqlstate == code, f"{label}: {exc.sqlstate} != {code}: {exc}"
                passed(label)
            else:
                raise AssertionError(f"Expected rejection: {label}")
        def as_service():
            conn.execute("set local role service_role")
        for table in TABLES:
            assert conn.execute("select relrowsecurity from pg_class where oid=%s::regclass", ("public."+table,)).fetchone()[0]
            assert len(run("select * from "+table)) == (4 if table=="curriculum_versions" else 5 if table=="course_versions" else 0)
            for role in ("anon","authenticated","fixture_unprivileged"):
                for statement in (f"select * from {table}", f"insert into {table} default values", f"update {table} set created_at=created_at", f"delete from {table}", f"truncate {table}"):
                    rejects(f"{role} denied {statement.split()[0]} {table}", lambda s=statement,r=role: run(s,role=r), "42501")
                # Demonstrate RLS itself, independent of denied table privileges.
                with conn.transaction(force_rollback=True):
                    conn.execute(sql.SQL("grant select on {} to {}").format(sql.Identifier(table),sql.Identifier(role)))
                    assert run("select * from "+table,role=role)==[]
                passed(f"{role} RLS filters {table} even with temporary SELECT grant")
            rejects(f"service_role cannot truncate immutable {table}", lambda t=table: run("truncate "+t), "42501")
        constraints = {row[0]: row[1] for row in conn.execute("select conname,pg_get_constraintdef(oid) from pg_constraint where conrelid='class_course_version_assignments'::regclass")}
        assert "FOREIGN KEY (organization_id, class_id) REFERENCES classes(organization_id, id)" in constraints["curriculum_assignment_class_tenant"]
        assert "FOREIGN KEY (organization_id, assigned_by) REFERENCES accounts(organization_id, id)" in constraints["curriculum_assignment_actor_tenant"]
        passed("exact tenant composite class/actor foreign keys exist")

        def insert_record(kind, record):
            if kind=="curriculum":
                return run("insert into curriculum_versions(id,version_key,family,status,record) values(%s,%s,%s,%s,%s)", (record.get("id",str(uuid.uuid4())),record.get("key","fixture-"+str(uuid.uuid4())),record.get("family","college-board-ap"),record.get("status","active"),Jsonb(record)))
            return run("insert into course_versions(id,version_key,curriculum_version_id,course_code,status,is_placeholder,record) values(%s,%s,%s,%s,%s,%s,%s)", (record.get("id",str(uuid.uuid4())),record.get("key","fixture-"+str(uuid.uuid4())),record.get("curriculum_version_id",registry["curriculum_versions"][0]["id"]),record.get("course_code","fixture"),record.get("status","active"),record.get("is_placeholder",False),Jsonb(record)))
        def clone(kind):
            record=copy.deepcopy(registry[kind+"_versions"][0]); record.update(id=str(uuid.uuid4()),key="fixture-"+str(uuid.uuid4())); return record
        for kind, fields in (("curriculum",["id","key","family","name","status","first_assessment","last_assessment","effective_from","effective_to","edition","source_references","verified_at","verified_by","verification_kind"]),("course",["id","key","curriculum_version_id","course_code","title","school_year","status","is_placeholder","assessment_profile","scope","source_references","verified_at"])):
            for field in fields:
                record=clone(kind); del record[field]
                rejects(f"{kind} missing required {field}",lambda r=record,k=kind: insert_record(k,r))
            for field,value in (("source_references",None),("source_references",[]),("source_references",[123]),("source_references",[""]),("source_references",[" "]),("source_references",["same","same"]),("verified_at",None),("verified_at",""),("verified_at","2026-02-31"),("verified_at",42)):
                record=clone(kind); record[field]=value
                rejects(f"{kind} rejects invalid {field} {value!r}",lambda r=record,k=kind: insert_record(k,r))
            for statement in (f"update {kind}_versions set created_at=created_at",f"delete from {kind}_versions"):
                rejects(f"immutable {kind}: {statement.split()[0]}",lambda s=statement: run(s),"23514")
        record=clone("curriculum"); record["status"]="retired"; insert_record("curriculum",record); retired_parent=record["id"]
        record=clone("course"); record["curriculum_version_id"]=retired_parent
        rejects("active course cannot use retired curriculum",lambda:insert_record("course",record),"23514")
        record["status"]="retired"; insert_record("course",record); retired_course=record["id"]
        future=registry["course_versions"][-1]["id"]; ab=registry["course_versions"][0]["id"]; bc=registry["course_versions"][1]["id"]
        def pin(course=ab, class_id=None, actor=None, org=None, state="active", reason="Explicit fixture review"):
            assignment=uuid.uuid4()
            run("insert into class_course_version_assignments(id,organization_id,class_id,course_version_id,assigned_by,state,reason) values(%s,%s,%s,%s,%s,%s,%s)",(assignment,org or ids["org_a"],class_id or ids["class_a"],course,actor or ids["admin_a"],state,reason))
            return assignment
        rejects("cross-tenant class FK",lambda:pin(class_id=ids["class_b"],state="planned"),"23503")
        rejects("cross-tenant actor rejected",lambda:pin(actor=ids["admin_b"],state="planned"),"42501")
        for actor in ("teacher","student","inactive_admin"):
            rejects("non-active-admin actor "+actor,lambda a=actor:pin(actor=ids[a]),"42501")
        rejects("archived class active pin blocked",lambda:pin(class_id=ids["archived_class"]),"23514")
        rejects("future IB2029 active pin blocked",lambda:pin(course=future),"23514")
        rejects("retired course/curriculum active pin blocked",lambda:pin(course=retired_course),"23514")
        rejects("new superseded history cannot be fabricated",lambda:pin(state="superseded"),"23514")
        rejects("assignment reason required",lambda:pin(reason=" "),"23514")
        planned=pin(course=future,state="planned"); passed("explicit planned future IB pin allowed without activation")
        rejects("planned pin cannot auto-activate",lambda:run("update class_course_version_assignments set state='active' where id=%s",(planned,)),"23514")
        active=pin(); passed("explicit reviewed active admin pin succeeds")
        rejects("one active pin per class",lambda:pin(course=bc),"23505")
        rejects("pin identity cannot be rewritten",lambda:run("update class_course_version_assignments set reason='rewritten' where id=%s",(active,)),"23514")
        rejects("pin history cannot be deleted",lambda:run("delete from class_course_version_assignments where id=%s",(active,)),"23514")
        def failed_replace():
            with conn.transaction():
                run("update class_course_version_assignments set state='superseded' where id=%s",(active,))
                pin(course=future)
        rejects("failed supersede/new-pin transaction rolls back",failed_replace,"23514")
        assert run("select state from class_course_version_assignments where id=%s",(active,))==[("active",)]
        with conn.transaction():
            run("update class_course_version_assignments set state='superseded' where id=%s",(active,))
            replacement=pin(course=bc)
        assert run("select state from class_course_version_assignments where id=%s",(active,))==[("superseded",)]
        assert run("select state from class_course_version_assignments where id=%s",(replacement,))==[("active",)]
        rejects("superseded pin cannot reactivate",lambda:run("update class_course_version_assignments set state='active' where id=%s",(active,)),"23514")
        passed("successful replacement retains immutable superseded history")
        assert snapshot()==before, "Tests or additive assignment paths altered legacy class/evidence rows"
        passed("legacy classes, accounts, memberships and all evidence rows unchanged after assignment tests")
        finish("PASS")

if __name__ == "__main__":
    main()
