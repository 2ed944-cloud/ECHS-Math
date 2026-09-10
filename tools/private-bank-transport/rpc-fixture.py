"""Actual service-role SQL behind a closed stdio adapter; never a Storage service.

Starts only after this run's fresh 27-migration/222-check database report.
Controls create or affect only fresh synthetic IDs owned by this process.
No caller SQL, production tokens, raw error messages or question-bank sources.
"""
import argparse,base64,datetime,hashlib,json,os,sys,uuid
from pathlib import Path
from contract import HERE,REPO,sources,connection_guard,check_connection,closed,rpc_request

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--database-report',type=Path,required=True);args=parser.parse_args()
    _,migrations=sources();accepted=json.loads(args.database_report.read_text())
    assert accepted['status']=='PASS' and accepted['migrations']==migrations and accepted['migration_count']==27 and len(accepted['checks'])==222
    assert accepted['production_calls'] is False and accepted['external_network'] is False
    import psycopg
    from psycopg.conninfo import conninfo_to_dict
    from psycopg.types.json import Jsonb
    sys.path.insert(0,str(REPO/'tools'))
    from private_snapshot_fixture import fixture,payload,digest
    dsn=os.environ.get('ECHS_BANK_TEST_DSN','');assert dsn
    info=conninfo_to_dict(dsn);address=connection_guard(info,'echs_bank_test_transport_')
    def emit(v):print(json.dumps(v,default=lambda x:x.isoformat() if isinstance(x,datetime.datetime) else str(x),separators=(',',':')),flush=True)
    with psycopg.connect(dsn,hostaddr=address,autocommit=True,connect_timeout=5) as db:
        check_connection(db,info,address);db.execute("set statement_timeout='8s'")
        assert db.execute('select public.private_bank_snapshot_capabilities()').fetchone()[0]['immutable_ready'] is True
        cases={};max_cases=40
        def sql_rpc(name,values):
            with db.transaction():
                db.execute('set local role service_role')
                if name=='api_session_lookup':return [row[0] for row in db.execute('select to_jsonb(x) from public.api_session_lookup(%s) x',(values['p_token_hash'],))]
                statement={'private_bank_snapshot_import':'select public.private_bank_snapshot_import(%s,%s,%s)',
                           'private_bank_snapshot_file':'select public.private_bank_snapshot_file(%s,%s,%s)'}[name]
                return db.execute(statement,(values['p_token_hash'],values['p_action'],Jsonb(values['p_payload']))).fetchone()[0]
        def call(case,action,body,file=False):
            return sql_rpc('private_bank_snapshot_file' if file else 'private_bank_snapshot_import',{'p_token_hash':digest(case['tokens']['admin'].encode()),'p_action':action,'p_payload':body})
        def object_row(case,file_id):
            assert file_id in case['f']['objects']
            key='/'.join([case['ids']['org'],case['f']['reserve']['snapshot_id'],file_id])
            db.execute("insert into storage.objects(bucket_id,name,metadata) values('private-bank-snapshots',%s,'{}') on conflict(bucket_id,name) do nothing",(key,))
        def new_case(mode):
            assert mode in ['staging','ready','aborted','quota'] and len(cases)<max_cases
            tag=uuid.uuid4().hex;ids={n:str(uuid.uuid4()) for n in ['org','foreign_org','admin','second_admin','foreign_admin','teacher','student','parent']};tokens={}
            for n in ['org','foreign_org']:db.execute('insert into organizations(id,name,slug) values(%s,%s,%s)',(ids[n],'Synthetic transport SQL fixture','c08-transport-'+n+'-'+tag))
            for n in ['admin','second_admin','foreign_admin','teacher','student','parent']:
                role='admin' if 'admin' in n else n;org=ids['foreign_org'] if n=='foreign_admin' else ids['org']
                db.execute("insert into accounts(id,organization_id,username,display_name,role,status) values(%s,%s,%s,'Synthetic transport actor',%s,'active')",(ids[n],org,'c08-'+n+'-'+tag,role))
                tokens[n]='synthetic-c08-transport-'+n+'-'+tag
                db.execute("select public.api_create_session(%s,%s,clock_timestamp()+interval '1 hour','fixture','loopback')",(ids[n],digest(tokens[n].encode())))
            course=str(db.execute("select id from course_versions where course_code='ap-calculus-ab' and status='active' and not is_placeholder").fetchone()[0])
            for position,topic in enumerate(['1.1','1.2']):db.execute("insert into lesson_catalog(organization_id,access_key,course_key,unit_index,unit_title,topic,title,position,url,is_ready) values(%s,%s,'ap-calculus',0,'Synthetic unit',%s,'Synthetic transport lesson',%s,%s,true)",(ids['org'],'ap-calculus::0::'+topic,topic,position,'lessons/ap-calculus/unit-1/synthetic-'+topic.replace('.','-')+'.html'))
            f=fixture(course,with_manifest=True);case={'ids':ids,'tokens':tokens,'f':f};sid=f['reserve']['snapshot_id'];cases[sid]=case
            if mode=='quota':f['reserve']['expected_media_count']=1
            call(case,'reserve',f['reserve'])
            registration=payload(sid,'files',f['files'] if mode!='quota' else f['files'][:3]);call(case,'register',registration,True)
            quota_code=None
            if mode=='quota':
                try:call(case,'register',payload(sid,'files',[f['files'][3]]),True)
                except psycopg.Error as e:quota_code=e.sqlstate
                assert quota_code=='23514'
            if mode=='ready':
                # Explicit synthetic terminal fixture setup, not handler evidence
                # of record verification or real Storage bytes.
                for row in f['files']:
                    object_row(case,row['file_id']);p=payload(sid);p.update({k:row[k] for k in ['file_id','sha256','byte_length','mime_type']});call(case,'verify_bytes',p,True)
                call(case,'records',payload(sid,'records',f['records']));call(case,'mappings',payload(sid,'mappings',f['mappings']))
                for row in f['files']:
                    if row['kind']=='source-json':
                        p=payload(sid);p.update({k:row[k] for k in ['file_id','source_occurrence_count','source_record_root']});call(case,'verify_records',p,True)
                assert call(case,'seal',payload(sid))['state']=='ready'
            if mode=='aborted':assert call(case,'abort',payload(sid))['state']=='aborted'
            return {'ids':ids,'tokens':tokens,'snapshot_id':sid,'reserve_request_id':f['reserve']['request_id'],'files':f['files'],
                    'bytes_base64':{k:base64.b64encode(v).decode() for k,v in f['objects'].items()},'quota_code':quota_code}
        emit({'ready':True,'postgres_version':db.execute('show server_version').fetchone()[0],'migrations':migrations,'storage_service_executed':False})
        for line in sys.stdin:
            request_id=None
            try:
                assert len(line.encode())<=16384;request=json.loads(line);request_id=request['id'];assert type(request_id)==int
                if 'control' not in request:
                    name,values=rpc_request(request);result=sql_rpc(name,values)
                else:
                    control=request['control']
                    if control=='new_case':closed(request,['id','control','mode']);result=new_case(request['mode'])
                    else:
                        keys=['id','control','snapshot_id']+(['file_id'] if control=='object_exists' else [])
                        closed(request,keys);case=cases[request['snapshot_id']];ids=case['ids'];sid=request['snapshot_id']
                        if control=='object_exists':object_row(case,request['file_id']);result=True
                        elif control in ['revoke','expire','demote','suspend']:
                            if control=='revoke':db.execute('update private.sessions set revoked_at=clock_timestamp() where account_id=%s',(ids['admin'],))
                            elif control=='expire':db.execute("update private.sessions set expires_at=clock_timestamp()-interval '1 second' where account_id=%s",(ids['admin'],))
                            elif control=='demote':db.execute("update accounts set role='teacher' where id=%s",(ids['admin'],))
                            else:db.execute("update accounts set status='suspended' where id=%s",(ids['admin'],))
                            result=True
                        elif control=='abort':result=call(case,'abort',payload(sid))['state']
                        elif control=='stats':
                            rows=db.execute('select file_id,state,source_content_verified_at from private_bank_snapshot_files where organization_id=%s and snapshot_id=%s order by file_id',(ids['org'],sid)).fetchall()
                            result={'state':db.execute('select state from private_bank_snapshots where organization_id=%s and id=%s',(ids['org'],sid)).fetchone()[0],
                                    'files':{str(r[0]):{'state':r[1],'records_verified':r[2] is not None} for r in rows},
                                    'receipt_events':db.execute("select count(*) from private_bank_snapshot_events where organization_id=%s and snapshot_id=%s and event_type='verify_bytes'",(ids['org'],sid)).fetchone()[0],
                                    'question_rows':db.execute('select count(*) from private_bank_snapshot_questions where organization_id=%s and snapshot_id=%s',(ids['org'],sid)).fetchone()[0],
                                    'object_rows':db.execute("select count(*) from storage.objects where bucket_id='private-bank-snapshots' and name like %s",(ids['org']+'/'+sid+'/%',)).fetchone()[0]}
                        else:raise ValueError('Unsupported fixture control')
                emit({'id':request_id,'data':result,'error':None})
            except psycopg.Error as e:emit({'id':request_id,'data':None,'error':{'code':e.sqlstate}})
            except Exception as e:emit({'id':request_id,'data':None,'error':{'code':'fixture_invalid_request','type':type(e).__name__}})
if __name__=='__main__':
    try:main()
    except Exception as e:print(json.dumps({'ready':False,'error':{'type':type(e).__name__,'code':getattr(e,'sqlstate',None)}}),flush=True);sys.exit(1)
