#!/usr/bin/env python3
"""Test-only JSON-lines bridge from the real HTTP handler to real PostgreSQL.

Requires an already migrated PostgreSQL 15 disposable loopback database. No
SQL text, role names, credentials or arbitrary function names come from stdin.
"""
from __future__ import annotations

from datetime import date, datetime
import hashlib
import json
import os
import sys
import uuid


def emit(value):
    def encode(item):
        if isinstance(item, (date, datetime)):return item.isoformat()
        if isinstance(item, uuid.UUID):return str(item)
        raise TypeError("Unsupported fixture value")
    print(json.dumps(value, default=encode, separators=(",", ":")), flush=True)


def main():
    import psycopg
    from psycopg.conninfo import conninfo_to_dict
    from psycopg.types.json import Jsonb

    assert sys.argv[1:] in ([], ['--content-v2'], ['--media'], ['--recovery'], ['--history'], ['--ib13-import']), 'Only explicit versioned fixture modes are supported'
    ib13_import = sys.argv[1:] == ['--ib13-import']
    history = sys.argv[1:] == ['--history']
    recovery = sys.argv[1:] in (['--recovery'], ['--history'], ['--ib13-import'])
    media = sys.argv[1:] == ['--media']
    content_v2 = sys.argv[1:] in (['--content-v2'], ['--media'], ['--recovery'], ['--history'], ['--ib13-import'])

    dsn = os.environ.get("ECHS_LESSON_TEST_DSN", "")
    assert dsn, "Explicit disposable database required"
    info = conninfo_to_dict(dsn)
    assert info.get("host") in ("127.0.0.1", "localhost", "::1"), "Loopback required"
    assert info.get("dbname", "").startswith("echs_lesson_test"), "Disposable test DB required"
    assert not info.get("hostaddr") and not info.get("service"), "Overrides forbidden"
    hostaddr = "::1" if info["host"] == "::1" else "127.0.0.1"
    with psycopg.connect(dsn, hostaddr=hostaddr, autocommit=True) as conn:
        conn.execute("set statement_timeout='10s'")
        assert int(conn.execute("show server_version_num").fetchone()[0]) // 10000 == 15
        assert conn.execute("select current_database()").fetchone()[0].startswith("echs_lesson_test")
        assert conn.execute("select public.lesson_store_health()").fetchone()[0] == {"ok": True, "contract": "echs.lesson.store.v1"}
        course_code = 'ib-math-ai-sl' if ib13_import else 'ap-calculus-ab'
        course_key = 'ib-math-ai' if ib13_import else 'ap-calculus'
        topic = '1.3' if ib13_import else '1.7'
        access_key = course_key + '::0::' + topic
        course = conn.execute("select id from public.course_versions where course_code=%s and status='active' and not is_placeholder", (course_code,)).fetchall()
        assert len(course) == 1, "Exactly one seeded active course version required"
        if ib13_import:
            assert str(course[0][0]) == '9a875b4c-61af-5001-9f31-a22044f6f58d', 'Current IB 2021 version required'
        nonce = uuid.uuid4().hex
        names = ("organization", "foreign_organization", "class", "foreign_class", "admin", "teacher", "reviewer", "student", "foreign_teacher", "parent", "unassigned_teacher")
        ids = {name: uuid.uuid4() for name in names}
        tokens = {name: "isolated-e2e-"+name+"-"+uuid.uuid4().hex for name in ("admin", "teacher", "reviewer", "student", "foreign_teacher", "parent", "unassigned_teacher")}
        route = 'lessons/ib-math-ai/unit-1/lessons/IB_AI_SL_1.3_geometric_sequences_ECHS.html' if ib13_import else 'lessons/ap-calculus/unit-1/1-7-selecting-limit-procedures.html'
        with conn.transaction():
            if history:
                # Explicit disposable fixture only: create a compatible alternate
                # course identity so the actual administrator pin RPC can change
                # scope. This is not a curriculum source or a production record.
                alternate_id = uuid.uuid4()
                alternate_key = 'isolated-history-bc-' + nonce
                conn.execute("""insert into public.course_versions
                    (id,version_key,curriculum_version_id,course_code,status,is_placeholder,record)
                    select %s,%s,curriculum_version_id,'ap-calculus-bc','active',false,
                    record || %s from public.course_versions where id=%s""",
                    (alternate_id,alternate_key,Jsonb({'id':str(alternate_id),'key':alternate_key,
                     'course_code':'ap-calculus-bc','title':'Isolated history pin fixture; not an authored curriculum'}),course[0][0]))
                ids['alternate_course_version_id'] = alternate_id
            for name in ("organization", "foreign_organization"):
                conn.execute("insert into public.organizations(id,name,slug) values(%s,%s,%s)", (ids[name], "Isolated HTTP lesson fixture", "lesson-http-"+name+"-"+nonce))
            for name, token in tokens.items():
                org = ids["foreign_organization"] if name == "foreign_teacher" else ids["organization"]
                role = "teacher" if name in ("teacher", "reviewer", "foreign_teacher", "unassigned_teacher") else name
                conn.execute("insert into public.accounts(id,organization_id,username,display_name,role,status) values(%s,%s,%s,%s,%s,'active')", (ids[name],org,"lesson-http-"+name+"-"+nonce,name,role))
                conn.execute("select public.api_create_session(%s,%s,now()+interval '1 hour','fixture','loopback')", (ids[name],hashlib.sha256(token.encode()).hexdigest()))
            for name, org, creator in (("class", "organization", "admin"), ("foreign_class", "foreign_organization", "foreign_teacher")):
                conn.execute("insert into public.classes(id,organization_id,name,course_key,status,created_by) values(%s,%s,%s,%s,'active',%s)", (ids[name],ids[org],"Isolated HTTP class",course_key,ids[creator]))
            for name in ("teacher", "reviewer", "student"):
                conn.execute("insert into public.class_memberships(class_id,account_id,membership_role) values(%s,%s,%s)", (ids["class"],ids[name],"student" if name == "student" else "teacher"))
            conn.execute("insert into public.class_memberships(class_id,account_id,membership_role) values(%s,%s,'teacher')", (ids["foreign_class"],ids["foreign_teacher"]))
            # Existing first-lesson fixtures use position zero; IB import uses its
            # exact position three and remains private, with no fabricated mastery.
            conn.execute("insert into public.lesson_catalog(organization_id,access_key,course_key,unit_index,unit_title,topic,title,position,url,is_ready) values(%s,%s,%s,0,'Unit 1',%s,%s,%s,%s,true)", (ids['organization'],access_key,course_key,topic,'Geometric Sequences and Series' if ib13_import else 'Original HTTP fixture',3 if ib13_import else 0,route))
        emit({"event":"ready", "postgres_version":conn.execute("show server_version").fetchone()[0], "fixture":{**ids,"course_version_id":course[0][0],"tokens":tokens,"route_path":route,"access_key":access_key}})

        for line in sys.stdin:
            request_id = None
            try:
                assert len(line.encode()) <= 2400000
                request = json.loads(line)
                assert isinstance(request,dict) and set(request)=={"id","name","args"}
                request_id = request["id"]
                assert isinstance(request_id,int) and not isinstance(request_id,bool) and request_id>0
                name, args = request["name"], request["args"]
                assert isinstance(args,dict)
                if media and name in ('fixture_storage_metadata','fixture_storage_remove'):
                    # Explicit isolated provider-metadata fixture, never a deployed
                    # RPC or authorization stub. Only this process's new fixture
                    # organization's lesson assets may be touched. Byte storage
                    # lives in the Node HTTP adapter; SQL authorization remains real.
                    assert set(args)=={'lesson_id','asset_id'}
                    lesson_id, asset_id = uuid.UUID(args['lesson_id']),uuid.UUID(args['asset_id'])
                    row=conn.execute('select organization_id,lesson_id,id,mime_type,byte_length,state from public.lesson_assets where organization_id=%s and lesson_id=%s and id=%s',(ids['organization'],lesson_id,asset_id)).fetchone()
                    assert row is not None
                    key='/'.join(str(value) for value in row[:3])
                    with conn.transaction():
                        if name=='fixture_storage_metadata':
                            assert row[5]=='pending'
                            conn.execute('insert into storage.objects(bucket_id,name,metadata) values(%s,%s,%s)',('lesson-assets',key,Jsonb({'mimetype':row[3],'size':row[4]})))
                        else:
                            assert row[5]=='cleanup'
                            conn.execute('delete from storage.objects where bucket_id=%s and name=%s',('lesson-assets',key))
                    emit({'id':request_id,'result':{'data':{'ok':True},'error':None}})
                    continue
                with conn.transaction():
                    conn.execute("set local role service_role")
                    if name == "api_session_lookup":
                        assert set(args)=={"p_token_hash"} and isinstance(args["p_token_hash"],str)
                        data = [row[0] for row in conn.execute("select to_jsonb(s) from public.api_session_lookup(%s) s", (args["p_token_hash"],))]
                    elif name == "lesson_store":
                        assert set(args)=={"p_token_hash","p_action","p_payload"}
                        assert isinstance(args["p_token_hash"],str) and isinstance(args["p_action"],str) and isinstance(args["p_payload"],dict)
                        data = conn.execute("select public.lesson_store(%s,%s,%s)", (args["p_token_hash"],args["p_action"],Jsonb(args["p_payload"]))).fetchone()[0]
                    elif name == "lesson_store_health":
                        assert not args
                        data = conn.execute("select public.lesson_store_health()").fetchone()[0]
                    elif name == "lesson_content_capabilities" and content_v2:
                        assert not args
                        data = conn.execute("select public.lesson_content_capabilities()").fetchone()[0]
                    elif name == 'lesson_media_capabilities' and (media or recovery):
                        assert not args
                        data=conn.execute('select public.lesson_media_capabilities()').fetchone()[0]
                    elif name == 'lesson_asset_store' and media:
                        assert set(args)=={'p_token_hash','p_action','p_payload'}
                        assert isinstance(args['p_token_hash'],str) and isinstance(args['p_action'],str) and isinstance(args['p_payload'],dict)
                        data=conn.execute('select public.lesson_asset_store(%s,%s,%s)',(args['p_token_hash'],args['p_action'],Jsonb(args['p_payload']))).fetchone()[0]
                    elif name == 'lesson_recovery_capabilities' and recovery:
                        assert not args
                        data=conn.execute('select public.lesson_recovery_capabilities()').fetchone()[0]
                    elif name == 'lesson_draft_recovery_key' and recovery:
                        assert set(args)=={'p_token_hash','p_payload'} and isinstance(args['p_token_hash'],str) and isinstance(args['p_payload'],dict)
                        data=conn.execute('select public.lesson_draft_recovery_key(%s,%s)',(args['p_token_hash'],Jsonb(args['p_payload']))).fetchone()[0]
                    else:
                        raise AssertionError("Function is not allowed")
                emit({"id":request_id,"result":{"data":data,"error":None}})
            except psycopg.Error as exc:
                emit({"id":request_id,"result":{"data":None,"error":{"code":exc.sqlstate or "XX000"}}})
            except (AssertionError,TypeError,ValueError,KeyError):
                emit({"id":request_id,"result":{"data":None,"error":{"code":"22023"}}})


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        # No DSN, database error detail, fixture tokens, SQL text or row contents.
        emit({"event":"startup_error","error":{"code":getattr(exc,"sqlstate",None) or type(exc).__name__}})
        sys.exit(1)
