#!/usr/bin/env python3
"""Real PostgreSQL 15 lesson-store contracts in a fresh disposable loopback DB.

Creates explicit school/session fixtures, then exercises actual grants, RLS,
SECURITY DEFINER authorization, transactions, and concurrent connections.
Never connects to a production database; no authorization outcomes are mocked.
"""
from __future__ import annotations

import argparse
import copy
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
import os
from pathlib import Path
import threading
import time
import uuid

NEW = "202609080002_lesson_persistence.sql"
TABLES = ("authored_lessons", "lesson_versions", "lesson_reviews", "lesson_publications")
CONTRACT = "echs.lesson.store.v1"
CANARY = "PRIVATE-NOTES-CANARY-NEVER-IN-STUDENT-DELIVERY"
CHECKS = {key: True for key in ("curriculum", "mathematics", "accessibility", "rights", "student_safe")}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo-root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--static-only", action="store_true")
    parser.add_argument("--report", type=Path)
    args = parser.parse_args()
    report = {"status": "RUNNING; NOT PASS", "production_calls": False, "postgres_required": 15, "checks": []}

    def save():
        if args.report:
            args.report.parent.mkdir(parents=True, exist_ok=True)
            args.report.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

    def passed(label):
        report["checks"].append(label)
        print("PASS " + label, flush=True)
        save()

    try:
        root = args.repo_root.resolve()
        legacy = sorted(p for p in (root / "supabase/migrations").glob("*.sql") if p.name < NEW)
        assert len(legacy) == 21, f"Expected 21 audited prior migrations, found {len(legacy)}"
        migration = root / "supabase/migrations" / NEW
        assert migration.is_file(), f"Missing {NEW}"
        paths = [*legacy, migration]
        report["migrations"] = [{"file": p.name, "sha256": hashlib.sha256(p.read_bytes()).hexdigest()} for p in paths]
        report["migration_count"] = 22
        passed("22 exact migration inputs present")
        if args.static_only:
            report["status"] = "STATIC INPUTS PASS; DATABASE NOT RUN"
            save()
            print(report["status"])
            return

        import psycopg
        from psycopg import sql
        from psycopg.conninfo import conninfo_to_dict
        from psycopg.types.json import Jsonb

        dsn = os.environ.get("ECHS_LESSON_TEST_DSN", "")
        assert dsn, "ECHS_LESSON_TEST_DSN is required; no default database"
        info = conninfo_to_dict(dsn)
        assert info.get("host") in ("127.0.0.1", "localhost", "::1"), "Explicit loopback host required"
        assert info.get("dbname", "").startswith("echs_lesson_test"), "Disposable echs_lesson_test* DB required"
        assert not info.get("service") and not info.get("hostaddr"), "Connection-service/hostaddr overrides forbidden"
        hostaddr = "::1" if info["host"] == "::1" else "127.0.0.1"

        def connect():
            connection = psycopg.connect(dsn, hostaddr=hostaddr, autocommit=True)
            connection.execute("set statement_timeout='10s'")
            return connection

        with connect() as conn:
            version = conn.execute("show server_version_num").fetchone()[0]
            assert int(version) // 10000 == 15, "PostgreSQL 15 required"
            report["postgres_version"] = conn.execute("show server_version").fetchone()[0]
            assert conn.execute("select current_database()").fetchone()[0].startswith("echs_lesson_test")
            assert conn.execute("select count(*) from pg_tables where schemaname='public'").fetchone()[0] == 0, "Refusing nonempty database"
            # Only infrastructure normally supplied by Supabase is bootstrapped.
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
            passed("all 21 unchanged prior migrations executed on PostgreSQL 15")

            def rows_snapshot(tables):
                return {table: sorted(json.dumps(row[0], sort_keys=True, default=str) for row in conn.execute(sql.SQL("select to_jsonb(t) from public.{} t").format(sql.Identifier(table)))) for table in tables}

            accounts = {
                "admin_a": ("a", "admin", "active"), "admin_b": ("b", "admin", "active"),
                "teacher": ("a", "teacher", "active"), "reviewer": ("a", "teacher", "active"),
                "unassigned_teacher": ("a", "teacher", "active"), "foreign_teacher": ("b", "teacher", "active"),
                "wrong_membership_teacher": ("a", "teacher", "active"), "suspended_teacher": ("a", "teacher", "suspended"),
                "student": ("a", "student", "active"), "foreign_student": ("b", "student", "active"),
                "wrong_membership_student": ("a", "student", "active"), "parent": ("a", "parent", "active"),
                "revoked_teacher": ("a", "teacher", "active"), "expired_teacher": ("a", "teacher", "active"),
            }
            classes = {"a": ("a", "active", "ap-calculus"), "second": ("a", "active", "ap-calculus"),
                       "b": ("b", "active", "ap-calculus"), "archived": ("a", "archived", "ap-calculus"),
                       "unpinned": ("a", "active", "ap-calculus"), "ib": ("a", "active", "ib-math-ai")}
            ids = {name: uuid.uuid4() for name in ["org_a", "org_b", *accounts, *("class_" + name for name in classes)]}
            for org in ("a", "b"):
                conn.execute("insert into organizations(id,name,slug) values(%s,%s,%s)", (ids["org_"+org], "Lesson fixture "+org, "lesson-fixture-"+org))
            tokens = {}
            for name, (org, role, status) in accounts.items():
                conn.execute("insert into accounts(id,organization_id,username,display_name,role,status) values(%s,%s,%s,%s,%s,%s)", (ids[name],ids["org_"+org],"lesson-fixture-"+name,name,role,status))
                tokens[name] = hashlib.sha256(("isolated-lesson-test-"+name).encode()).hexdigest()
                expiry = "now()-interval '1 minute'" if name == "expired_teacher" else "now()+interval '1 hour'"
                conn.execute("select public.api_create_session(%s,%s,"+expiry+",'fixture','loopback')", (ids[name], tokens[name]))
            conn.execute("select public.api_revoke_session(%s)", (tokens["revoked_teacher"],))
            for name, (org, status, course) in classes.items():
                conn.execute("insert into classes(id,organization_id,name,course_key,status,created_by) values(%s,%s,%s,%s,%s,%s)", (ids["class_"+name],ids["org_"+org],"Lesson fixture "+name,course,status,ids["admin_"+org]))
            membership_rows = [("a", "teacher", "teacher"), ("a", "reviewer", "teacher"), ("a", "student", "student"),
                ("a", "suspended_teacher", "teacher"), ("a", "expired_teacher", "teacher"), ("a", "revoked_teacher", "teacher"),
                ("a", "wrong_membership_teacher", "student"), ("a", "wrong_membership_student", "teacher"),
                ("b", "foreign_teacher", "teacher"), ("b", "foreign_student", "student"),
                # Deliberately malformed legacy memberships: actual schema permits these.
                ("a", "foreign_teacher", "teacher"), ("a", "foreign_student", "student"), ("b", "teacher", "teacher"),
                ("unpinned", "teacher", "teacher"), ("archived", "teacher", "teacher")]
            for cls, account, role in membership_rows:
                conn.execute("insert into class_memberships(class_id,account_id,membership_role) values(%s,%s,%s)", (ids["class_"+cls],ids[account],role))
            catalog = {}
            for position, topic in enumerate(("0", "1.1", "1.2", "1.3", "1.4", "1.5")):
                key = "ap-calculus::0::"+topic
                route = "lessons/ap-calculus/unit-1/fixture-"+topic.replace(".", "-")+".html"
                catalog[key] = {"topic": topic, "unit_index": 0, "position": position, "route": route}
                for org in ("a", "b"):
                    conn.execute("insert into lesson_catalog(organization_id,access_key,course_key,unit_index,unit_title,topic,title,position,url,is_ready) values(%s,%s,'ap-calculus',0,'Unit 1',%s,%s,%s,%s,true)", (ids["org_"+org],key,topic,"Original fixture "+topic,position,route))
            # Existing evidence is preserved. These unrelated original rows do not unlock fixture lessons.
            conn.execute("insert into learning_attempts(organization_id,account_id,client_event_id,question_id,correct,occurred_at,course,payload) values(%s,%s,'preserved-event','fixture-question',true,now(),'fixture-legacy','{}')", (ids["org_a"],ids["student"]))
            conn.execute("insert into learning_sessions(organization_id,account_id,client_session_id,mode,course,total,started_at) values(%s,%s,'preserved-session','practice','fixture-legacy',1,now())", (ids["org_a"],ids["student"]))
            conn.execute("insert into lesson_completions(organization_id,account_id,access_key,course_key,unit_index,topic,title,completed_at) values(%s,%s,'fixture-legacy::0::0','fixture-legacy',0,'0','Preserved completion',now())", (ids["org_a"],ids["student"]))
            conn.execute("insert into mastery_records(organization_id,account_id,skill_key,score,source,payload) values(%s,%s,'preserved-skill',40,'server','{\"algorithm\":\"echs-mastery-2.0-foundation\"}')", (ids["org_a"],ids["student"]))
            legacy_tables = [r[0] for r in conn.execute("select tablename from pg_tables where schemaname='public' order by tablename")]
            before_migration = rows_snapshot(legacy_tables)
            conn.execute(migration.read_text(encoding="utf-8"), prepare=False)
            assert rows_snapshot(legacy_tables) == before_migration, "Lesson migration altered existing rows"
            assert all(conn.execute(sql.SQL("select count(*) from {}").format(sql.Identifier(t))).fetchone()[0] == 0 for t in TABLES)
            protected = [t for t in legacy_tables if t not in ("class_course_version_assignments", "account_audit_log")]
            before_activity = rows_snapshot(protected)
            passed("new migration applied: 22 total; all legacy rows unchanged; zero seeded authored lessons")

            def execute(statement, params=(), role="service_role", connection=None):
                db = connection or conn
                with db.transaction():
                    db.execute(sql.SQL("set local role {}").format(sql.Identifier(role)))
                    result = db.execute(statement, params)
                    return result.fetchall() if result.description else None

            def rpc(actor, action, payload=None, role="service_role", connection=None):
                value = execute("select public.lesson_store(%s,%s,%s)", (tokens.get(actor, actor), action, Jsonb(payload or {})), role, connection)[0][0]
                assert isinstance(value, dict) and value.get("ok") is True and value.get("contract") == CONTRACT, value
                return value

            def rejects(label, action, codes):
                accepted = (codes,) if isinstance(codes, str) else tuple(codes)
                try:
                    with conn.transaction():
                        action()
                except psycopg.Error as exc:
                    assert exc.sqlstate in accepted, f"{label}: unexpected SQLSTATE {exc.sqlstate}, expected {accepted}: {exc}"
                    passed(label)
                else:
                    raise AssertionError("Expected database rejection: "+label)

            for role in ("anon", "authenticated", "fixture_unprivileged"):
                rejects(role+" cannot invoke privileged lesson RPC even with valid fixture session", lambda role=role: rpc("admin_a", "context", role=role), "42501")
                rejects(role+" cannot invoke lesson health RPC", lambda role=role:execute("select public.lesson_store_health()",role=role), "42501")
            assert execute("select public.lesson_store_health()")[0][0] == {"ok":True,"contract":CONTRACT}
            passed("service health RPC confirms deployed lesson contract without exposing data")
            for table in TABLES:
                assert conn.execute("select relrowsecurity from pg_class where oid=%s::regclass", ("public."+table,)).fetchone()[0]
                for role in ("anon", "authenticated", "fixture_unprivileged", "service_role"):
                    for statement in (f"select * from {table}", f"insert into {table} default values", f"update {table} set id=id", f"delete from {table}", f"truncate {table}"):
                        rejects(f"{role} direct {statement.split()[0]} denied on {table}", lambda s=statement,r=role: execute(s,role=r), "42501")
            for actor in ("invalid-token", "", "expired_teacher", "revoked_teacher", "suspended_teacher"):
                rejects("invalid/revoked/expired/inactive session "+repr(actor), lambda a=actor: rpc(a,"context"), "28000")
            rejects("unsupported action rejected", lambda:rpc("admin_a","unsupported"), "22023")

            registry = json.loads((root / "curriculum/registry/course-versions.v1.json").read_text(encoding="utf-8"))
            ab = next(r["id"] for r in registry["course_versions"] if r["course_code"] == "ap-calculus-ab")
            bc = next(r["id"] for r in registry["course_versions"] if r["course_code"] == "ap-calculus-bc")
            future = next(r["id"] for r in registry["course_versions"] if r["is_placeholder"])

            def pin(cls="a", course=ab, expected=None, actor="admin_a"):
                return rpc(actor,"pin_course",{"class_id":str(ids["class_"+cls]),"course_version_id":course,"expected_assignment_id":expected,"reason":"Explicit isolated-fixture review"})["assignment"]

            for actor in ("teacher","student","parent","foreign_teacher","admin_b"):
                rejects("only same-tenant admin may pin: "+actor, lambda a=actor:pin(actor=a), "42501")
            rejects("future IB2029 cannot become active", lambda:pin("ib",future), ("23514","22023"))
            rejects("archived class cannot receive active pin", lambda:pin("archived"), ("42501","23514"))
            active_pin = pin()
            pin("second")
            pin("b", actor="admin_b")
            assert active_pin["assigned_by"] == str(ids["admin_a"])
            rejects("pin conflict requires exact current assignment id", lambda:pin(), "40001")
            old_pins = rows_snapshot(["class_course_version_assignments"])
            rejects("failed pin replacement rolls back supersede and new insert", lambda:pin(course=future,expected=active_pin["id"]), ("23514","22023"))
            assert rows_snapshot(["class_course_version_assignments"]) == old_pins
            passed("explicit pin succeeds and failed replacement leaves complete pin history unchanged")
            staff_context = rpc("teacher","context")
            assert {row["id"] for row in staff_context["classes"]} == {str(ids["class_a"]),str(ids["class_unpinned"])}
            assert rpc("unassigned_teacher","context")["classes"] == []
            assert {row["id"] for row in rpc("foreign_teacher","context")["classes"]} == {str(ids["class_b"])}
            class_context = rpc("teacher","context",{"class_id":str(ids["class_a"])})
            assert class_context["current_assignment"]["id"] == active_pin["id"] and len(class_context["catalog"]) == 6
            assert future not in {row["id"] for row in class_context["course_versions"]}
            for action in ("context","list"):
                rejects("unassigned teacher cannot read scoped "+action,lambda a=action:rpc("unassigned_teacher",a,{"class_id":str(ids["class_a"])}),"42501")
                rejects("parent cannot read staff "+action,lambda a=action:rpc("parent",a,{"class_id":str(ids["class_a"])}),"42501")
            passed("context excludes archived, mismatched-role and cross-tenant classes and future courses")

            def document(key="ap-calculus::0::1.1", lesson_id=None, text="Explain a continuous join."):
                row = catalog[key]
                return {"schema_version":"echs.lesson.v1","document_version":1,"lesson_id":str(lesson_id or uuid.uuid4()),"course_version_id":ab,
                    "unit_id":"legacy:ap-calculus:unit:1","topic_id":"legacy:ap-calculus:topic:"+row["topic"],"slug":"fixture-"+str(uuid.uuid4()),
                    "title":"Original secure lesson fixture","objectives":[{"id":"fixture:continuity","text":"Explain continuity using a matching value."}],"skills":["fixture:reason"],
                    "slides":[{"id":"introduction","title":"A continuous join","layout":"single","blocks":[{"id":"explanation","type":"rich-text","version":1,"content":{"paragraphs":[{"type":"paragraph","children":[{"type":"text","text":text}]}]}}]}],
                    "publication":{"status":"draft","audience":"institutional","revision":1},"accessibility":{"language":"en","summary":"Original text fixture for access and publication contracts."},"variants":{"contexts":["neutral"]}}

            def create(actor="teacher", cls="a", key="ap-calculus::0::1.1", doc=None):
                return rpc(actor,"create",{"class_id":str(ids["class_"+cls]),"course_version_id":ab,"access_key":key,"document":doc or document(key),"private_notes":CANARY,"expected_revision":0})

            for actor, cls in (("student","a"),("parent","a"),("foreign_teacher","a"),("teacher","b"),("unassigned_teacher","a"),("wrong_membership_teacher","a"),("teacher","second")):
                rejects("class-scoped create denies "+actor+" in "+cls, lambda a=actor,c=cls:create(a,c), "42501")
            rejects("create requires an explicit active class pin", lambda:create(cls="unpinned"), ("42501","23514"))
            wrong = document();wrong["course_version_id"] = bc
            rejects("document course cannot differ from pinned request scope", lambda:create(doc=wrong), ("22023","23514"))
            bad = document();bad["publication"]["status"] = "published"
            rejects("caller cannot create published document", lambda:create(doc=bad), ("22023","23514"))
            def altered_document(path, value):
                candidate = document()
                target = candidate
                for part in path[:-1]:target = target[part]
                target[path[-1]] = value
                return candidate
            invalid_documents = [
                ("root unknown private field",("private_notes",),CANARY),
                ("nested unknown private field",("slides",0,"blocks",0,"content","private_notes"),CANARY),
                ("null required title",("title",),None),
                ("null required slides",("slides",),None),
                ("null required rich-text",("slides",0,"blocks",0,"content","paragraphs",0,"children",0,"text"),None),
                ("null block version",("slides",0,"blocks",0,"version"),None),
                ("empty objectives",("objectives",),[]),
                ("HTML text",("title",),"<script>canary</script>"),
                ("public audience",("publication","audience"),"public"),
                ("wrong unit identity",("unit_id",),"legacy:ap-calculus:unit:2"),
                ("wrong topic identity",("topic_id",),"legacy:ap-calculus:topic:9.9"),
            ]
            for label,path,value in invalid_documents:
                rejects("SQL document defence: "+label,lambda p=path,v=value:create(doc=altered_document(p,v)),"22023")
            payload = {"class_id":str(ids["class_a"]),"course_version_id":ab,"access_key":"ap-calculus::0::1.1","document":document(),"private_notes":CANARY,"expected_revision":0}
            for notes in (None, {}, "x"*20001):
                rejects("private notes reject "+type(notes).__name__+" or oversize",lambda n=notes:rpc("teacher","create",{**payload,"private_notes":n}),"22023")
            rejects("private notes are required separately",lambda:rpc("teacher","create",{k:v for k,v in payload.items() if k!="private_notes"}),"22023")
            rejects("client cannot supply organization authority",lambda:rpc("teacher","create",{**payload,"organization_id":str(ids["org_b"])}),"22023")
            record = create()
            lesson_id = record["lesson"]["id"]
            assert record["lesson"]["head_revision"] == 1
            assert record["head"]["version_number"] == 1 and record["head"]["private_notes"] == CANARY
            assert record["lesson"]["organization_id"] == str(ids["org_a"])
            assert record["lesson"]["route_path"] == catalog["ap-calculus::0::1.1"]["route"]
            version_one = record["head"]["id"]
            passed("teacher creates exact pinned/catalog-bound draft with private notes and server-owned revision")

            def get(actor="teacher", item=lesson_id):
                return rpc(actor,"get",{"lesson_id":item})

            def mutate(actor, action, current, **extra):
                return rpc(actor,action,{"lesson_id":current["lesson"]["id"],"expected_revision":current["lesson"]["head_revision"],**extra})

            def deliver(actor="student", item=lesson_id, cls="a"):
                return rpc(actor,"deliver",{"lesson_id":item,"class_id":str(ids["class_"+cls])})

            for actor in ("parent","student","foreign_teacher","unassigned_teacher","wrong_membership_teacher","admin_b"):
                rejects("draft get denied to "+actor, lambda a=actor:get(a), "P0002" if actor in ("foreign_teacher","admin_b") else "42501")
            listed = rpc("teacher","list",{"class_id":str(ids["class_a"])})
            assert [row["id"] for row in listed["lessons"]] == [lesson_id] and CANARY not in json.dumps(listed)
            for action in ("get","version","history","save","restore","request_review","approve","publish","unpublish"):
                rejects("student cannot use authoring action "+action, lambda a=action:rpc("student",a,{"lesson_id":lesson_id,"version_id":version_one,"expected_revision":1}), "42501")
            rejects("unpublished draft never delivered", lambda:deliver(), ("42501","P0002","23514"))
            rejects("nonexistent lesson does not leak a draft", lambda:get(item=str(uuid.uuid4())), "P0002")
            history = rpc("teacher","history",{"lesson_id":lesson_id,"limit":1})
            assert len(history["versions"]) == 1 and CANARY not in json.dumps(history)
            version = rpc("teacher","version",{"lesson_id":lesson_id,"version_id":version_one})
            assert version["version"]["private_notes"] == CANARY
            passed("authorized version recovery exposes notes only through staff detail; history metadata excludes notes")
            for field in ("lesson_id","course_version_id","unit_id","topic_id","slug"):
                changed = copy.deepcopy(record["head"]["document"])
                changed[field] = str(uuid.uuid4()) if field.endswith("_id") and field in ("lesson_id","course_version_id") else "fixture-altered-identity"
                rejects("save cannot change immutable "+field,lambda d=changed:mutate("teacher","save",record,document=d,private_notes=CANARY),"22023")
            for bounds in ({"limit":0},{"limit":101},{"before_version":0},{"limit":None},{"limit":1.5}):
                rejects("history rejects invalid bounds "+json.dumps(bounds),lambda b=bounds:rpc("teacher","history",{"lesson_id":lesson_id,**b}),"22023")

            legacy_doc = document("ap-calculus::0::1.4")
            legacy_doc["slides"][0]["blocks"] = [{"id":"legacy-source","type":"legacy-embedded","version":1,"content":{"source":catalog["ap-calculus::0::1.4"]["route"],"anchor":"","sha256":"0"*64,"summary":"Unimported legacy reference retained for staff review only."}}]
            legacy_record = create(key="ap-calculus::0::1.4",doc=legacy_doc)
            legacy_record = mutate("teacher","request_review",legacy_record)
            rejects("legacy reference draft cannot be approved for student publication",lambda:mutate("admin_a","approve",legacy_record,validated_version_id=legacy_record["head"]["id"],checks=CHECKS,comment="Reference only"),"23514")
            rejects("legacy reference remains unavailable to students",lambda:deliver(item=legacy_record["lesson"]["id"]),"P0002")

            rejects("stale optimistic save rejected", lambda:rpc("teacher","save",{"lesson_id":lesson_id,"expected_revision":0,"document":record["head"]["document"],"private_notes":"new"}), "40001")
            record = mutate("teacher","request_review",record)
            for field in CHECKS:
                incomplete = {k:v for k,v in CHECKS.items() if k != field}
                rejects("approval requires explicit "+field, lambda c=incomplete:mutate("admin_a","approve",record,validated_version_id=version_one,checks=c,comment="Fixture review"), ("22023","23514"))
            rejects("author cannot approve own lesson", lambda:mutate("teacher","approve",record,validated_version_id=version_one,checks=CHECKS,comment="Self review"), ("42501","23514"))
            record = mutate("reviewer","approve",record,validated_version_id=version_one,checks=CHECKS,comment="Independent original-fixture review")
            rejects("publish cannot target an unvalidated different version", lambda:mutate("teacher","publish",record,validated_version_id=str(uuid.uuid4())), ("22023","23514","40001"))
            record = mutate("teacher","publish",record,validated_version_id=version_one)
            delivered = deliver()
            assert CANARY not in json.dumps(delivered) and "private_notes" not in json.dumps(delivered)
            assert delivered["document"]["publication"]["status"] == "published"
            assert delivered["document"]["publication"]["audience"] == "institutional"
            assert delivered["binding"]["account_id"] == str(ids["student"])
            assert delivered["binding"]["organization_id"] == str(ids["org_a"])
            assert delivered["binding"]["class_id"] == str(ids["class_a"])
            assert delivered["binding"]["document"]["lesson_id"] == lesson_id
            assert delivered["binding"]["document"]["course_version_id"] == ab
            live_document = copy.deepcopy(delivered["document"])
            passed("independent complete review publishes an institutional snapshot; eligible student receives bound document without private-notes canary")

            # All four tables now contain rows, so these assertions prove actual
            # RLS filtering rather than merely selecting from empty tables.
            for table in TABLES:
                assert conn.execute("select count(*) from "+table).fetchone()[0] > 0
                for role in ("anon","authenticated","fixture_unprivileged"):
                    with conn.transaction(force_rollback=True):
                        conn.execute(sql.SQL("grant select on {} to {}").format(sql.Identifier(table),sql.Identifier(role)))
                        assert execute("select * from "+table,role=role) == []
                    passed(role+" RLS filters populated "+table+" even with temporary SELECT grant")

            for actor, cls in (("parent","a"),("foreign_student","a"),("wrong_membership_student","a"),("student","b")):
                rejects("delivery denies "+actor+" in "+cls, lambda a=actor,c=cls:deliver(a,cls=c), ("42501","P0002"))
            for table in ("lesson_versions","lesson_reviews","lesson_publications"):
                assert conn.execute("select count(*) from "+table).fetchone()[0] > 0
                for statement in (f"update {table} set id=id", f"delete from {table}"):
                    rejects("history immutable even to owner: "+statement, lambda s=statement:conn.execute(s), "23514")
            rejects("owner cannot rewrite immutable lesson route",lambda:conn.execute("update authored_lessons set route_path='lessons/changed.html',head_revision=head_revision+1 where id=%s",(lesson_id,)),"23514")
            rejects("owner cannot delete authored lesson identity",lambda:conn.execute("delete from authored_lessons where id=%s",(lesson_id,)),"23514")
            fk_doc = copy.deepcopy(record["head"]["document"])
            fk_doc["document_version"] = 100
            fk_doc["publication"]["revision"] = 100
            for label,org,author in (("version organization must match lesson tenant",ids["org_b"],ids["foreign_teacher"]),("version actor must match lesson tenant",ids["org_a"],ids["foreign_teacher"])):
                rejects(label,lambda o=org,a=author:conn.execute("insert into lesson_versions(organization_id,lesson_id,version_number,document,private_notes,created_by) values(%s,%s,100,%s,'',%s)",(o,lesson_id,Jsonb(fk_doc),a)),"23503")
            rejects("head pointer cannot reference a different lesson's version",lambda:conn.execute("update authored_lessons set head_version_id=%s,head_revision=head_revision+1 where id=%s",(legacy_record["head"]["id"],lesson_id)),"23503")
            rejects("review actor FK enforces tenant even for owner insert",lambda:conn.execute("insert into lesson_reviews(organization_id,lesson_id,version_id,revision,event_type,actor_id) values(%s,%s,%s,100,'requested',%s)",(ids["org_a"],lesson_id,version_one,ids["foreign_teacher"])),"23503")
            rejects("approved review SQL CHECK rejects NULL checks",lambda:conn.execute("insert into lesson_reviews(organization_id,lesson_id,version_id,revision,event_type,actor_id,checks) values(%s,%s,%s,100,'approved',%s,null)",(ids["org_a"],lesson_id,version_one,ids["reviewer"])),"23514")
            unsafe_publication = copy.deepcopy(live_document)
            unsafe_publication["publication"]["revision"] = 100
            unsafe_publication["private_notes"] = CANARY
            rejects("publication table rejects unknown private document fields",lambda:conn.execute("insert into lesson_publications(organization_id,lesson_id,source_version_id,revision,event_type,actor_id,document) values(%s,%s,%s,100,'published',%s,%s)",(ids["org_a"],lesson_id,version_one,ids["teacher"],Jsonb(unsafe_publication))),"23514")

            def state_rejection(label, statement, params, action, codes=("42501","23514")):
                with conn.transaction(force_rollback=True):
                    conn.execute(statement,params)
                    rejects(label,action,codes)

            state_rejection("archived class revokes delivery", "update classes set status='archived' where id=%s", (ids["class_a"],), lambda:deliver())
            state_rejection("removed student membership revokes delivery", "delete from class_memberships where class_id=%s and account_id=%s", (ids["class_a"],ids["student"]), lambda:deliver(), ("42501","P0002"))
            state_rejection("changed teacher membership revokes writes", "update class_memberships set membership_role='student' where class_id=%s and account_id=%s", (ids["class_a"],ids["teacher"]), lambda:mutate("teacher","unpublish",record,reason="Denied fixture"), "42501")
            state_rejection("superseded pin revokes delivery", "update class_course_version_assignments set state='superseded' where id=%s", (active_pin["id"],), lambda:deliver())
            state_rejection("hidden override denies published lesson", "insert into lesson_access_overrides(organization_id,class_id,access_key,state,updated_by) values(%s,%s,'ap-calculus::0::1.1','hidden',%s)", (ids["org_a"],ids["class_a"],ids["teacher"]), lambda:deliver(), ("42501","P0002","23514"))
            state_rejection("unready catalog denies published lesson", "update lesson_catalog set is_ready=false where organization_id=%s and access_key='ap-calculus::0::1.1'", (ids["org_a"],), lambda:deliver(), ("42501","P0002","23514"))
            state_rejection("catalog route drift denies stored publication", "update lesson_catalog set url='lessons/ap-calculus/unit-1/changed.html' where organization_id=%s and access_key='ap-calculus::0::1.1'", (ids["org_a"],), lambda:deliver(), "42501")
            with conn.transaction(force_rollback=True):
                replacement = pin(course=bc,expected=active_pin["id"])
                assert replacement["id"] != active_pin["id"] and replacement["course_version_id"] == bc
                rejects("repinning class cannot deliver former-course publication",lambda:deliver(),"42501")
                rejects("repinning class cannot create former-course draft",lambda:create(key="ap-calculus::0::1.5"),"42501")
            assert rows_snapshot(["class_course_version_assignments"]) == old_pins
            passed("explicit replacement pin is atomic and prevents old-course delivery")

            # Existing route and membership writers do not call lesson_store.
            # Commit their denial while an independent delivery waits, then
            # restore only these fixture values before the legacy-data audit.
            def concurrent_delivery_denial(label, statement, params, restore_statement, restore_params):
                ready = threading.Event(); pid = []
                def waiting_delivery():
                    with connect() as db:
                        pid.append(db.info.backend_pid);ready.set()
                        try:
                            rpc("student","deliver",{"lesson_id":lesson_id,"class_id":str(ids["class_a"])},connection=db)
                            return "success"
                        except psycopg.Error as exc:return exc.sqlstate
                try:
                    with connect() as locker, ThreadPoolExecutor(max_workers=1) as pool:
                        with locker.transaction():
                            locker.execute(statement,params)
                            pending = pool.submit(waiting_delivery)
                            assert ready.wait(5)
                            deadline = time.monotonic()+5
                            while time.monotonic()<deadline:
                                waiting = conn.execute("select wait_event_type from pg_stat_activity where pid=%s",(pid[0],)).fetchone()
                                if waiting and waiting[0]=="Lock":break
                                if pending.done():raise AssertionError(label+" bypassed locked scope: "+str(pending.result()))
                                time.sleep(.02)
                            else:raise AssertionError(label+" did not wait on changed scope")
                        assert pending.result(timeout=10)=="42501", label
                finally:
                    conn.execute(restore_statement,restore_params)
                assert deliver()["document"] == live_document
                passed(label+" rejects a delivery queued before the denial committed")
            concurrent_delivery_denial("catalog ready race",
                "update lesson_catalog set is_ready=false where organization_id=%s and access_key='ap-calculus::0::1.1'",(ids["org_a"],),
                "update lesson_catalog set is_ready=true where organization_id=%s and access_key='ap-calculus::0::1.1'",(ids["org_a"],))
            concurrent_delivery_denial("catalog route race",
                "update lesson_catalog set url='lessons/ap-calculus/unit-1/race-route.html' where organization_id=%s and access_key='ap-calculus::0::1.1'",(ids["org_a"],),
                "update lesson_catalog set url=%s where organization_id=%s and access_key='ap-calculus::0::1.1'",(catalog["ap-calculus::0::1.1"]["route"],ids["org_a"]))
            concurrent_delivery_denial("membership role revocation race",
                "update class_memberships set membership_role='teacher' where class_id=%s and account_id=%s",(ids["class_a"],ids["student"]),
                "update class_memberships set membership_role='student' where class_id=%s and account_id=%s",(ids["class_a"],ids["student"]))

            progress = create(key="ap-calculus::0::1.3")
            progress = mutate("teacher","request_review",progress)
            progress = mutate("admin_a","approve",progress,validated_version_id=progress["head"]["id"],checks=CHECKS,comment="Independent sequential-gate fixture review")
            progress = mutate("teacher","publish",progress,validated_version_id=progress["head"]["id"])
            progress_id = progress["lesson"]["id"]
            rejects("sequential publication requires predecessor evidence", lambda:deliver(item=progress_id), ("42501","P0002","23514"))
            with conn.transaction(force_rollback=True):
                conn.execute("insert into lesson_completions(organization_id,account_id,access_key,course_key,unit_index,topic,title,completed_at) values(%s,%s,'ap-calculus::0::1.2','ap-calculus',0,'1.2','Predecessor fixture',now())", (ids["org_a"],ids["student"]))
                rejects("completion alone does not satisfy original sequential gate", lambda:deliver(item=progress_id), ("42501","P0002","23514"))
                conn.execute("insert into learning_sessions(organization_id,account_id,client_session_id,mode,course,unit,topic,total,started_at,completed_at) values(%s,%s,'progress-fixture','practice','ap-calculus','1','1.2',0,now(),now())", (ids["org_a"],ids["student"]))
                rejects("zero-question practice cannot unlock progression", lambda:deliver(item=progress_id), ("42501","P0002","23514"))
                conn.execute("update learning_sessions set total=1 where account_id=%s and client_session_id='progress-fixture'", (ids["student"],))
                assert deliver(item=progress_id)["binding"]["document"]["lesson_id"] == progress_id
            passed("original sequential gate requires completion plus nonempty completed practice, with one-based practice unit")
            with conn.transaction(force_rollback=True):
                # Legacy schema permits an override with a mismatched organization.
                conn.execute("insert into lesson_access_overrides(organization_id,class_id,access_key,state,updated_by) values(%s,%s,'ap-calculus::0::1.3','shown',%s)", (ids["org_b"],ids["class_a"],ids["admin_b"]))
                rejects("malformed cross-tenant override cannot authorize delivery", lambda:deliver(item=progress_id), ("42501","P0002","23514"))
            with conn.transaction(force_rollback=True):
                conn.execute("insert into lesson_access_overrides(organization_id,class_id,access_key,state,updated_by) values(%s,%s,'ap-calculus::0::1.3','shown',%s)", (ids["org_a"],ids["class_a"],ids["teacher"]))
                assert deliver(item=progress_id)["binding"]["document"]["lesson_id"] == progress_id
                conn.execute("update lesson_catalog set is_ready=false where organization_id=%s and access_key='ap-calculus::0::1.3'", (ids["org_a"],))
                rejects("explicit shown never overrides an unready catalog", lambda:deliver(item=progress_id), ("42501","P0002","23514"))
            with conn.transaction(force_rollback=True):
                conn.execute("insert into class_memberships(class_id,account_id,membership_role) values(%s,%s,'student')", (ids["class_second"],ids["student"]))
                for cls,state in (("a","hidden"),("second","shown")):
                    conn.execute("insert into lesson_access_overrides(organization_id,class_id,access_key,state,updated_by) values(%s,%s,'ap-calculus::0::1.1',%s,%s)", (ids["org_a"],ids["class_"+cls],state,ids["admin_a"]))
                rejects("another enrolled class cannot override requested class hidden gate", lambda:deliver(), ("42501","P0002","23514"))
                rejects("another enrolled class cannot substitute a lesson owner class", lambda:deliver(cls="second"), ("42501","P0002"))
            passed("shown/hidden/ready precedence and exact class/tenant publication gates remain independent")

            draft = copy.deepcopy(record["head"]["document"])
            draft["publication"]["status"] = "draft"
            draft["slides"][0]["blocks"][0]["content"]["paragraphs"][0]["children"][0]["text"] = "New draft must not replace the published snapshot."
            record = mutate("teacher","save",record,document=draft,private_notes=CANARY+"-NEW")
            assert deliver()["document"] == live_document
            assert CANARY not in json.dumps(deliver())
            rejects("student cannot retrieve unpublished newer version", lambda:rpc("student","version",{"lesson_id":lesson_id,"version_id":record["head"]["id"]}), "42501")
            record = mutate("teacher","restore",record,version_id=version_one)
            assert record["head"]["id"] != version_one and record["head"]["private_notes"] == CANARY
            assert deliver()["document"] == live_document
            history = rpc("teacher","history",{"lesson_id":lesson_id,"limit":1})
            assert len(history["versions"]) == 1 and history["next_before_version"] is not None
            next_page = rpc("teacher","history",{"lesson_id":lesson_id,"before_version":history["next_before_version"],"limit":1})
            assert len(next_page["versions"]) == 1 and next_page["versions"][0]["id"] != history["versions"][0]["id"]
            assert CANARY not in json.dumps(history)+json.dumps(next_page)
            passed("save preserves prior live publication; restore creates a new draft; history paginates without notes")

            # Two independent connections contend on the same optimistic revision.
            race_record = get()
            barrier = threading.Barrier(2)
            def save_competitor(index):
                with connect() as db:
                    barrier.wait(timeout=5)
                    try:
                        result = rpc("teacher","save",{"lesson_id":lesson_id,"expected_revision":race_record["lesson"]["head_revision"],"document":race_record["head"]["document"],"private_notes":CANARY+str(index)},connection=db)
                        return ("success",result)
                    except psycopg.Error as exc:
                        return (exc.sqlstate,None)
            with ThreadPoolExecutor(max_workers=2) as pool:
                outcomes = list(pool.map(save_competitor,(1,2)))
            assert sorted(item[0] for item in outcomes) == ["40001","success"], outcomes
            record = get()
            assert record["lesson"]["head_revision"] == race_record["lesson"]["head_revision"]+1
            passed("two-connection concurrent saves produce exactly one commit and one optimistic conflict")

            # A revoked session committed while an RPC waits on its lock must not
            # authorize that RPC from a previously observed account snapshot.
            worker_pid = []; worker_ready = threading.Event()
            def queued_read():
                with connect() as db:
                    worker_pid.append(db.info.backend_pid);worker_ready.set()
                    try:
                        rpc("reviewer","get",{"lesson_id":lesson_id},connection=db)
                        return "success"
                    except psycopg.Error as exc:
                        return exc.sqlstate
            with connect() as locker, ThreadPoolExecutor(max_workers=1) as pool:
                with locker.transaction():
                    locker.execute("update private.sessions set revoked_at=now() where token_hash=%s", (tokens["reviewer"],))
                    future_read = pool.submit(queued_read)
                    assert worker_ready.wait(5)
                    deadline = time.monotonic()+5
                    while time.monotonic()<deadline:
                        waiting = conn.execute("select wait_event_type from pg_stat_activity where pid=%s", (worker_pid[0],)).fetchone()
                        if waiting and waiting[0] == "Lock":break
                        if future_read.done():raise AssertionError("RPC did not wait for locked session revocation: "+str(future_read.result()))
                        time.sleep(.02)
                    else:raise AssertionError("RPC never reached the session lock")
                assert future_read.result(timeout=10) == "28000"
            passed("two-connection session revocation defeats queued authorization without stale-session acceptance")

            record = mutate("teacher","unpublish",record,reason="Explicit isolated fixture withdrawal")
            rejects("unpublish withdraws delivery without deleting immutable versions", lambda:deliver(), ("42501","P0002","23514"))
            assert rpc("teacher","version",{"lesson_id":lesson_id,"version_id":version_one})["version"]["private_notes"] == CANARY
            assert conn.execute("select count(*) from lesson_publications").fetchone()[0] >= 2
            assert rows_snapshot(protected) == before_activity, "Lesson operations altered legacy classes, memberships, catalog, or learning/mastery evidence"
            passed("unpublish retains history; all protected legacy data and evidence remain unchanged")
            report["status"] = "PASS"
            save()
            print(f"Secure lesson PostgreSQL contracts: PASS; {len(report['checks'])} checks",flush=True)
    except BaseException as exc:
        report["status"] = "FAIL"
        report["error_type"] = type(exc).__name__
        report["error"] = str(exc)
        if getattr(exc,"sqlstate",None):report["sqlstate"] = exc.sqlstate
        save()
        raise


if __name__ == "__main__":
    main()
