"""Closed synthetic fixture controls over real managed PostgreSQL.

No transport RPC adapter and no storage.objects DML. Actual handler RPCs and
Storage calls must use the real HTTP services. Stdout is a private parent pipe;
it contains ephemeral synthetic tokens and must never be saved as a CI log.
"""
from pathlib import Path
import argparse
import base64
import hashlib
import importlib.util
import json
import sys
import uuid
from service_contract import HERE, need, digest, local_file, run_identifier

FIXTURE_HASH='6e8b91bbe5cfa869cdfb9a426b967f8c1ee25ee64a5c196863ec574037bbce7a'

def load_fixture(repo):
    data=local_file(repo,'tools/private_snapshot_fixture.py')
    need(len(data)==8127 and digest(data)==FIXTURE_HASH,'synthetic-fixture-source')
    spec=importlib.util.spec_from_file_location('c08_service_original_synthetic_fixture',Path(repo)/'tools/private_snapshot_fixture.py')
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    return module

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--run-dir',type=Path,required=True);parser.add_argument('--repo',type=Path,required=True)
    args=parser.parse_args();run_dir=args.run_dir.absolute();run_identifier(run_dir.name)
    need(run_dir.parent==HERE/'runs' and not run_dir.is_symlink() and not run_dir.is_junction(),'run-directory')
    config=json.loads((run_dir/'control.json').read_text());secret=json.loads((run_dir/'secrets'/'credentials.json').read_text())
    need(config['project']=='echs-c08-service-'+run_dir.name and type(config['db_port']) is int and 1<=config['db_port']<=65535,'database-fixture')
    fixture_module=load_fixture(args.repo)
    import psycopg
    from psycopg.types.json import Jsonb
    db=psycopg.connect(host='127.0.0.1',port=config['db_port'],user='postgres',password=secret['POSTGRES_PASSWORD'],
        dbname='postgres',sslmode='disable',autocommit=True,connect_timeout=5,application_name='echs-c08-service-seed')
    need(db.info.hostaddr=='127.0.0.1' and db.info.dbname=='postgres','database-fixture')
    need(db.execute("select shobj_description(oid,'pg_database') from pg_database where datname=current_database()").fetchone()[0]==config['project'],'database-owner-marker')
    db.execute("set statement_timeout='8s'")
    cases={}
    def rpc(case,action,payload,file=False):
        name='private_bank_snapshot_file' if file else 'private_bank_snapshot_import'
        with db.transaction():
            db.execute('set local role service_role')
            return db.execute('select public.'+name+'(%s,%s,%s)',(digest(case['tokens']['admin'].encode()),action,Jsonb(payload))).fetchone()[0]
    def new_case(size):
        need(size in ('small','6mib','11mib','16mib') and len(cases)<40,'case-request')
        tag=uuid.uuid4().hex
        ids={n:str(uuid.uuid4()) for n in ('org','foreign_org','admin','second_admin','foreign_admin','teacher','student','parent')}
        tokens={}
        with db.transaction():
            for n in ('org','foreign_org'):
                db.execute('insert into organizations(id,name,slug) values(%s,%s,%s)',(ids[n],'Synthetic service fixture','c08-service-'+n+'-'+tag))
            for n in ('admin','second_admin','foreign_admin','teacher','student','parent'):
                role='admin' if 'admin' in n else n
                org=ids['foreign_org'] if n=='foreign_admin' else ids['org']
                db.execute("insert into accounts(id,organization_id,username,display_name,role,status) values(%s,%s,%s,'Synthetic service actor',%s,'active')",(ids[n],org,'c08-'+n+'-'+tag,role))
                tokens[n]='synthetic-c08-service-'+n+'-'+uuid.uuid4().hex
                db.execute("select public.api_create_session(%s,%s,clock_timestamp()+interval '1 hour','fixture','loopback')",(ids[n],digest(tokens[n].encode())))
            course=str(db.execute("select id from course_versions where course_code='ap-calculus-ab' and status='active' and not is_placeholder").fetchone()[0])
            for position,topic in enumerate(('1.1','1.2')):
                db.execute("insert into lesson_catalog(organization_id,access_key,course_key,unit_index,unit_title,topic,title,position,url,is_ready) values(%s,%s,'ap-calculus',0,'Synthetic unit',%s,'Synthetic service lesson',%s,%s,true)",
                    (ids['org'],'ap-calculus::0::'+topic,topic,position,'lessons/ap-calculus/unit-1/synthetic-'+topic.replace('.','-')+'.html'))
        f=fixture_module.fixture(course,with_manifest=True)
        recipes={k:{'base64':base64.b64encode(v).decode()} for k,v in f['objects'].items()}
        for mime,extension in [('image/svg+xml','svg'),('image/jpeg','jpg'),('image/webp','webp'),('image/gif','gif')]:
            file_id=str(uuid.uuid4())
            # Opaque original fixture bytes: tests verify MIME policy/byte identity,
            # never decoder validity, image safety, or rendered media content.
            content=('Synthetic C08 opaque MIME fixture '+extension+'\n').encode()
            row={'file_id':file_id,'kind':'media','source_path':'synthetic/opaque.'+extension,'mime_type':mime,'byte_length':len(content),'sha256':digest(content)}
            f['files'].append(row);f['objects'][file_id]=content;recipes[file_id]={'base64':base64.b64encode(content).decode()}
        if size!='small':
            count={'6mib':6*1024*1024+1,'11mib':11*1024*1024,'16mib':16*1024*1024}[size]
            file_id=str(uuid.uuid4());content=b'A'*count
            f['files'].append({'file_id':file_id,'kind':'media','source_path':'synthetic/size-probe.png','mime_type':'image/png','byte_length':count,'sha256':digest(content)})
            f['objects'][file_id]=content;recipes[file_id]={'repeat_byte':65,'byte_length':count}
        roots=fixture_module.roots_for(f['files'],f['records'],f['mappings'],f['reserve']['unit_review_sets'])
        manifest=next(r for r in f['files'] if r['kind']=='manifest')
        manifest_bytes=fixture_module.canonical({'contract':'synthetic-service-fixture.v1','roots':roots}).encode()
        manifest.update(sha256=digest(manifest_bytes),byte_length=len(manifest_bytes))
        f['objects'][manifest['file_id']]=manifest_bytes;recipes[manifest['file_id']]={'base64':base64.b64encode(manifest_bytes).decode()}
        f['reserve'].update(roots)
        f['reserve'].update(manifest_sha256=digest(manifest_bytes),expected_file_count=sum(r['kind']!='manifest' for r in f['files']),
            expected_media_count=sum(r['kind']=='media' for r in f['files']),expected_total_bytes=sum(r['byte_length'] for r in f['files']))
        case={'ids':ids,'tokens':tokens,'f':f};sid=f['reserve']['snapshot_id'];cases[sid]=case
        rpc(case,'reserve',f['reserve']);rpc(case,'register',fixture_module.payload(sid,'files',f['files']),True)
        return {'ids':ids,'tokens':tokens,'snapshot_id':sid,'files':f['files'],'recipes':recipes}
    def emit(value):
        print(json.dumps(value,separators=(',',':')),flush=True)
    emit({'ready':True,'actual_managed_postgres':True,'storage_metadata_dml':False})
    try:
        for line in sys.stdin:
            request_id=None
            try:
                need(len(line.encode())<=4096,'control-size')
                request=json.loads(line);request_id=request.get('id')
                need(type(request_id) is int and request_id>=1,'control-id')
                action=request.get('action')
                if action=='new_case':
                    need(set(request)=={'id','action','size'},'control-shape');result=new_case(request['size'])
                else:
                    need(set(request)=={'id','action','snapshot_id'},'control-shape')
                    case=cases[request['snapshot_id']];sid=request['snapshot_id'];actor=case['ids']['admin']
                    if action in ('revoke','expire','demote','suspend'):
                        statements={'revoke':'update private.sessions set revoked_at=clock_timestamp() where account_id=%s',
                            'expire':"update private.sessions set expires_at=clock_timestamp()-interval '1 second' where account_id=%s",
                            'demote':"update accounts set role='teacher' where id=%s",'suspend':"update accounts set status='suspended' where id=%s"}
                        db.execute(statements[action],(actor,));result=True
                    elif action=='abort':result=rpc(case,'abort',fixture_module.payload(sid))['state']
                    elif action=='seal_fixture':
                        f=case['f'];rpc(case,'records',fixture_module.payload(sid,'records',f['records']))
                        rpc(case,'mappings',fixture_module.payload(sid,'mappings',f['mappings']))
                        for row in f['files']:
                            if row['kind']=='source-json':
                                payload=fixture_module.payload(sid);payload.update({k:row[k] for k in ('file_id','source_occurrence_count','source_record_root')})
                                rpc(case,'verify_records',payload,True)
                        result=rpc(case,'seal',fixture_module.payload(sid))['state']
                    elif action=='stats':
                        rows=db.execute('select file_id,state from private_bank_snapshot_files where organization_id=%s and snapshot_id=%s',(case['ids']['org'],sid)).fetchall()
                        result={'state':db.execute('select state from private_bank_snapshots where id=%s',(sid,)).fetchone()[0],
                            'files':{str(r[0]):r[1] for r in rows},
                            'receipt_events':db.execute("select count(*) from private_bank_snapshot_events where snapshot_id=%s and event_type='verify_bytes'",(sid,)).fetchone()[0],
                            'object_rows':db.execute("select count(*) from storage.objects where bucket_id='private-bank-snapshots' and name like %s",(case['ids']['org']+'/'+sid+'/%',)).fetchone()[0]}
                    else:raise ValueError('Unsupported synthetic control')
                emit({'id':request_id,'data':result,'error':None})
            except Exception as error:
                emit({'id':request_id,'data':None,'error':{'type':type(error).__name__,'code':getattr(error,'sqlstate',None)}})
    finally:db.close()

if __name__=='__main__':
    try:main()
    except Exception as error:
        print(json.dumps({'ready':False,'error_type':type(error).__name__,'code':getattr(error,'sqlstate',None)}),flush=True)
        raise SystemExit(1)
