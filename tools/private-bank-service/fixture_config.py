"""Generate private disposable configuration from the reviewed Supabase service set.

No Docker or network operations. Secret return values must never enter reports.
"""
from pathlib import Path
import base64
import hashlib
import hmac
import json
import secrets
import time
from service_contract import HERE, INIT_SQL, IMAGE_TAGS, ORIGIN, fixture_plan, need, validate_image_receipt

def b64(data):
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('ascii')

def mint_credentials():
    secret=secrets.token_hex(32)
    def jwt(role,subject=None):
        value={'iss':'supabase','role':role,'iat':int(time.time())-1,'exp':int(time.time())+14400}
        if subject:value.update(sub=subject,aud='authenticated')
        unsigned=b64(b'{"alg":"HS256","typ":"JWT"}')+'.'+b64(json.dumps(value,separators=(',',':')).encode())
        return unsigned+'.'+b64(hmac.new(secret.encode(),unsigned.encode(),hashlib.sha256).digest())
    return {'POSTGRES_PASSWORD':secrets.token_hex(24),'JWT_SECRET':secret,'JWT_EXPIRY':'14400',
        'ANON_KEY':jwt('anon'),'SERVICE_ROLE_KEY':jwt('service_role'),
        'AUTHENTICATED_KEY':jwt('authenticated','44444444-4444-4444-8444-444444444444'),
        'S3_PROTOCOL_ACCESS_KEY_ID':secrets.token_hex(16),'S3_PROTOCOL_ACCESS_KEY_SECRET':secrets.token_hex(32)}

def compose_fixture(run_id,run_dir,image_receipt,approved_image_receipt_sha256):
    plan=fixture_plan(run_id)
    run_dir=Path(run_dir).absolute()
    for p in (run_dir,*run_dir.parents):
        need(not p.is_symlink() and not p.is_junction(),'linked-run-directory')
    need(run_dir.resolve().is_relative_to((HERE/'runs').resolve())
         and run_dir.name==run_id and run_dir.parent==HERE/'runs','run-directory')
    refs=validate_image_receipt(image_receipt,approved_image_receipt_sha256)
    labels=plan['ownership_labels']
    def common(name):
        return {'image':refs[name],'platform':'linux/amd64','restart':'no','labels':dict(labels),'networks':['isolated'],
            'logging':{'driver':'none'},'stop_grace_period':'10s'}
    def health(command,start='10s'):
        return {'test':command,'interval':'5s','timeout':'5s','retries':20,'start_period':start}
    def bind(relative,target):
        p=run_dir/'upstream'/relative
        need(p.resolve().is_relative_to(run_dir.resolve()),'mount-path')
        return {'type':'bind','source':p.as_posix(),'target':target,'read_only':True}
    mounts={'_supabase':'migrations/97-_supabase.sql','jwt':'init-scripts/99-jwt.sql',
        'logs':'migrations/99-logs.sql','pooler':'migrations/99-pooler.sql',
        'realtime':'migrations/99-realtime.sql','roles':'init-scripts/99-roles.sql','webhooks':'init-scripts/98-webhooks.sql'}
    services={name:common(name) for name in IMAGE_TAGS}
    services['db'].update(environment={'POSTGRES_HOST':'/var/run/postgresql','PGPORT':'5432','POSTGRES_PORT':'5432',
        'PGPASSWORD':'${POSTGRES_PASSWORD}','POSTGRES_PASSWORD':'${POSTGRES_PASSWORD}','PGDATABASE':'postgres','POSTGRES_DB':'postgres',
        'JWT_SECRET':'${JWT_SECRET}','JWT_EXP':'${JWT_EXPIRY}'},
        volumes=[bind('docker/volumes/db/'+n+'.sql','/docker-entrypoint-initdb.d/'+target) for n,target in mounts.items()]
            +['db-data:/var/lib/postgresql/data','db-config:/etc/postgresql-custom'],
        ports=['127.0.0.1::5432'],
        healthcheck=health(['CMD','pg_isready','-U','postgres','-h','localhost']),
        command=['postgres','-c','config_file=/etc/postgresql/postgresql.conf','-c','log_min_messages=fatal'])
    services['auth'].update(depends_on={'db':{'condition':'service_healthy'}},
        environment={'GOTRUE_API_HOST':'0.0.0.0','GOTRUE_API_PORT':'9999','API_EXTERNAL_URL':ORIGIN+'/auth/v1',
            'GOTRUE_DB_DRIVER':'postgres','GOTRUE_DB_DATABASE_URL':'postgres://supabase_auth_admin:${POSTGRES_PASSWORD}@db:5432/postgres',
            'GOTRUE_SITE_URL':ORIGIN,'GOTRUE_URI_ALLOW_LIST':'','GOTRUE_DISABLE_SIGNUP':'true',
            'GOTRUE_JWT_ADMIN_ROLES':'service_role','GOTRUE_JWT_AUD':'authenticated','GOTRUE_JWT_DEFAULT_GROUP_NAME':'authenticated',
            'GOTRUE_JWT_EXP':'${JWT_EXPIRY}','GOTRUE_JWT_SECRET':'${JWT_SECRET}','GOTRUE_JWT_ISSUER':ORIGIN+'/auth/v1',
            'GOTRUE_EXTERNAL_EMAIL_ENABLED':'false','GOTRUE_EXTERNAL_ANONYMOUS_USERS_ENABLED':'false',
            'GOTRUE_MAILER_AUTOCONFIRM':'false','GOTRUE_EXTERNAL_PHONE_ENABLED':'false','GOTRUE_SMS_AUTOCONFIRM':'false'},
        healthcheck=health(['CMD','wget','--no-verbose','--tries=1','--spider','http://localhost:9999/health']))
    services['rest'].update(depends_on={'db':{'condition':'service_healthy'}},
        environment={'PGRST_DB_URI':'postgres://authenticator:${POSTGRES_PASSWORD}@db:5432/postgres',
            'PGRST_DB_SCHEMAS':'public','PGRST_DB_MAX_ROWS':'1000','PGRST_DB_EXTRA_SEARCH_PATH':'public',
            'PGRST_DB_ANON_ROLE':'anon','PGRST_ADMIN_SERVER_PORT':'3001','PGRST_ADMIN_SERVER_HOST':'localhost',
            'PGRST_JWT_SECRET':'${JWT_SECRET}','PGRST_DB_USE_LEGACY_GUCS':'false',
            'PGRST_APP_SETTINGS_JWT_SECRET':'${JWT_SECRET}','PGRST_APP_SETTINGS_JWT_EXP':'${JWT_EXPIRY}'},
        ports=['127.0.0.1::3000'],healthcheck=health(['CMD','postgrest','--ready']),command=['postgrest'])
    services['storage'].update(depends_on={'db':{'condition':'service_healthy'},'rest':{'condition':'service_started'},'imgproxy':{'condition':'service_started'}},
        environment={'ANON_KEY':'${ANON_KEY}','SERVICE_KEY':'${SERVICE_ROLE_KEY}','POSTGREST_URL':'http://rest:3000',
            'AUTH_JWT_SECRET':'${JWT_SECRET}','DATABASE_URL':'postgres://supabase_storage_admin:${POSTGRES_PASSWORD}@db:5432/postgres',
            'STORAGE_PUBLIC_URL':ORIGIN,'REQUEST_ALLOW_X_FORWARDED_PATH':'true','FILE_SIZE_LIMIT':'52428800',
            'STORAGE_BACKEND':'file','GLOBAL_S3_BUCKET':'synthetic-c08-fixture','FILE_STORAGE_BACKEND_PATH':'/var/lib/storage',
            'TENANT_ID':'synthetic-c08-fixture','REGION':'local','ENABLE_IMAGE_TRANSFORMATION':'true','IMGPROXY_URL':'http://imgproxy:5001',
            'S3_PROTOCOL_ACCESS_KEY_ID':'${S3_PROTOCOL_ACCESS_KEY_ID}','S3_PROTOCOL_ACCESS_KEY_SECRET':'${S3_PROTOCOL_ACCESS_KEY_SECRET}'},
        volumes=['storage-data:/var/lib/storage'],ports=['127.0.0.1::5000'],
        healthcheck=health(['CMD','wget','--no-verbose','--tries=1','--spider','http://storage:5000/status']))
    services['imgproxy'].update(environment={'IMGPROXY_BIND':':5001','IMGPROXY_LOCAL_FILESYSTEM_ROOT':'/',
        'IMGPROXY_USE_ETAG':'true','IMGPROXY_AUTO_WEBP':'false','IMGPROXY_MAX_SRC_RESOLUTION':'16.8'},
        volumes=['storage-data:/var/lib/storage'],healthcheck=health(['CMD','imgproxy','health']))
    value={'name':plan['project'],'services':services,
        'networks':{'isolated':{'name':plan['network']['name'],'internal':True,'external':False,'labels':dict(labels)}},
        'volumes':{n:{'name':plan['project']+'_'+n,'external':False,'labels':dict(labels)} for n in ('db-data','db-config','storage-data')}}
    # This exact source-derived set is the only configuration the runner starts.
    need(len(mounts)==7 and set('docker/volumes/db/'+n+'.sql' for n in mounts)==set(INIT_SQL),'initialization-closure')
    return value
