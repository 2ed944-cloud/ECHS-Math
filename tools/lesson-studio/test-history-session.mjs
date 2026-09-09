import test from 'node:test';
import assert from 'node:assert/strict';
import {createHistorySession} from '../../js/lesson-studio/history-session.mjs';
import {createLessonDraft} from '../../js/lesson-studio/draft-model.mjs';

const clone = value => structuredClone(value);
const id = n => `10000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const ORG=id(1), CLASS=id(2), LESSON=id(3), COURSE=id(4), AUTHOR=id(5), REVIEWER=id(6);
const checks = {curriculum:true,mathematics:true,accessibility:true,rights:true,student_safe:true};
const stamp = n => new Date(Date.UTC(2026,8,9,0,0,n)).toISOString();
const deferred = () => { let resolve,reject; const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject}; };
const tick = () => new Promise(resolve => setImmediate(resolve));
const error = (status=0,code='network_error') => Object.assign(new Error('PRIVATE UNTRUSTED SERVER BODY'),{status,code});
const metadata = version => Object.fromEntries(Object.entries(version).filter(([key])=>!['document','private_notes'].includes(key)));
function makeVersion(number) {
  const document=createLessonDraft({lessonId:LESSON,courseVersionId:COURSE,
    catalog:{unit_id:'legacy:ap-calculus:unit:1',topic_id:'legacy:ap-calculus:topic:1.7'},
    title:'Teacher-authored fixture',objective:'Explain this original example.',skill:'teacher:reason',summary:'A private version history fixture.'});
  document.document_version=number;document.publication.revision=number;document.slides[0].title=`Version ${number}`;
  return {id:id(10000+number),organization_id:ORG,lesson_id:LESSON,version_number:number,created_by:AUTHOR,created_at:stamp(number),restored_from_version_id:null,
    document,private_notes:`Private notes ${number}`};
}
function fixture({action='restore',count=3,post,get,history,fetchVersion,actorId,sessionOptions={}}={}) {
  const allVersions = new Map(Array.from({length:count},(_,index)=>{const row=makeVersion(index+1);return [row.id,row];}));
  let remote={ok:true,contract:'echs.lesson.store.v1',lesson:{id:LESSON,organization_id:ORG,class_id:CLASS,course_version_id:COURSE,
    access_key:'ap-calculus::0::1.7',legacy_course_key:'ap-calculus',route_path:'lessons/ap-calculus/unit-1/1-7-selecting-limit-procedures.html',
    unit_id:'legacy:ap-calculus:unit:1',topic_id:'legacy:ap-calculus:topic:1.7',slug:makeVersion(1).document.slug,created_by:AUTHOR,
    created_at:stamp(0),updated_at:stamp(count),head_revision:count,head_version_id:id(10000+count),workflow_state:'draft',approved_version_id:null,approved_review_id:null,active_publication_id:null},
    head:clone(allVersions.get(id(10000+count))),versions:[],reviews:[],publications:[]};
  function record() {remote.versions=[...allVersions.values()].sort((a,b)=>b.version_number-a.version_number).slice(0,25).map(metadata);return clone(remote);}
  function commit(name,body,actor=actorId||AUTHOR) {
    if(body.expected_revision!==remote.lesson.head_revision)throw error(409,'revision_conflict');
    const number=remote.lesson.head_revision+1, eventId=id(20000+number), head=remote.head;
    if(name==='restore') {
      const source=allVersions.get(body.version_id);assert.ok(source);
      const version=clone(source);version.id=id(10000+number);version.version_number=number;version.created_by=actor;version.created_at=stamp(number);
      version.restored_from_version_id=source.id;version.document.document_version=number;version.document.publication.revision=number;
      allVersions.set(version.id,version);remote.head=version;remote.lesson.head_version_id=version.id;remote.lesson.workflow_state='draft';
      remote.lesson.approved_version_id=null;remote.lesson.approved_review_id=null;
    } else if(name==='requestReview'||name==='approve') {
      const approved=name==='approve';
      remote.reviews.unshift({id:eventId,organization_id:ORG,lesson_id:LESSON,version_id:head.id,revision:number,event_type:approved?'approved':'requested',
        actor_id:actor,checks:approved?clone(body.checks):null,comment:approved?body.comment:'',created_at:stamp(number)});
      remote.lesson.workflow_state=approved?'approved':'review';
      if(approved){remote.lesson.approved_version_id=head.id;remote.lesson.approved_review_id=eventId;}
    } else {
      const publish=name==='publish',live=remote.publications.find(row=>row.id===remote.lesson.active_publication_id);
      remote.publications.unshift({id:eventId,organization_id:ORG,lesson_id:LESSON,source_version_id:publish?head.id:live.source_version_id,
        revision:number,event_type:publish?'published':'unpublished',actor_id:actor,reason:publish?'':body.reason.trim(),created_at:stamp(number)});
      remote.lesson.active_publication_id=publish?eventId:null;remote.lesson.workflow_state=publish?'published':'draft';
      if(!publish){remote.lesson.approved_version_id=null;remote.lesson.approved_review_id=null;}
    }
    remote.lesson.head_revision=number;remote.lesson.updated_at=stamp(number);remote.reviews=remote.reviews.slice(0,25);remote.publications=remote.publications.slice(0,25);
    return record();
  }
  if(['approve','publish','unpublish'].includes(action))commit('requestReview',{expected_revision:remote.lesson.head_revision},AUTHOR);
  if(['publish','unpublish'].includes(action))commit('approve',{expected_revision:remote.lesson.head_revision,checks,comment:'Independent review'},REVIEWER);
  if(action==='unpublish')commit('publish',{expected_revision:remote.lesson.head_revision},AUTHOR);
  let actor={id:actorId||(action==='approve'?REVIEWER:AUTHOR),organization_id:ORG,role:'teacher',status:'active'},active=true;
  const calls=[],changes=[];
  const client={assertCurrent(){if(!active)throw error(401,'session_changed');return clone(actor);},
    async get(lessonId,options){calls.push({action:'get',lessonId,options});return get?get(record):record();},
    async history(lessonId,options={},request){calls.push({action:'history',lessonId,options:clone(options),request});
      const page=()=>{const all=[...allVersions.values()].filter(row=>row.version_number<(options.before_version||Infinity)).sort((a,b)=>b.version_number-a.version_number),rows=all.slice(0,options.limit||25);
        return {ok:true,contract:'echs.lesson.store.v1',versions:rows.map(metadata),next_before_version:all.length>rows.length?rows.at(-1).version_number:null};};
      return history?history(options,page):page();},
    async version(lessonId,versionId,options){calls.push({action:'version',lessonId,versionId,options});
      const found=()=>({ok:true,contract:'echs.lesson.store.v1',lesson:record().lesson,version:clone(allVersions.get(versionId))});
      return fetchVersion?fetchVersion(versionId,found):found();}};
  for(const name of ['restore','requestReview','approve','publish','unpublish'])client[name]=async (lessonId,input,options)=>{
    const body=typeof input==='number'?{expected_revision:input}:clone(input);calls.push({action:name,lessonId,body,options});
    const apply=()=>commit(name,body,actor.id);return post?post(name,body,apply):apply();};
  const session=createHistorySession({client,record:record(),onChange:value=>changes.push(value),...sessionOptions});
  const body=()=>action==='restore'?{version_id:id(10001)}:action==='approve'?{checks:clone(checks),comment:'Checked mathematics and student access.'}:action==='unpublish'?{reason:'  Replace this published explanation.  '}:{};
  async function prepare(){if(action==='restore')await session.select(id(10001));calls.length=0;}
  return {session,client,calls,changes,record,commit,body,prepare,allVersions,mutate:fn=>fn(remote),actor:value=>{actor={...actor,...value};},revoke:()=>{active=false;}};
}

test('constructor requires closed authoritative metadata and never invokes getters',()=>{
  const f=fixture();let invoked=0;const record=f.record();Object.defineProperty(record.lesson,'created_by',{enumerable:true,get(){invoked++;return AUTHOR;}});
  assert.throws(()=>createHistorySession({client:f.client,record}));assert.equal(invoked,0);
  for(const mutate of [r=>delete r.head.created_by,r=>r.head.created_by='teacher',r=>r.versions[0].private_notes='leak',r=>r.lesson.class_id=id(55),r=>r.head.created_at='not a date',r=>r.extra='private']){
    const value=f.record();mutate(value);if(value.lesson.class_id===id(55))value.lesson.organization_id=id(99);
    assert.throws(()=>createHistorySession({client:f.client,record:value}));
  }
  const cyclic=f.record();cyclic.head.document.loop=cyclic;assert.throws(()=>createHistorySession({client:f.client,record:cyclic}));
  const huge=f.record();huge.head.private_notes='x'.repeat(3*1024*1024);assert.throws(()=>createHistorySession({client:f.client,record:huge}));
});

test('snapshots are defensive and construction emits no callback',async()=>{
  const f=fixture();assert.equal(f.changes.length,0);const value=f.session.snapshot();value.record.head.private_notes='changed';value.versions[0].id=id(99);
  assert.equal(f.session.snapshot().record.head.private_notes,'Private notes 3');await f.session.select(id(10001));
  const selected=f.session.snapshot().selected;selected.version.document.title='changed';assert.equal(f.session.snapshot().selected.version.document.title,'Teacher-authored fixture');
  assert.deepEqual(Object.keys(selected).sort(),['lesson','version']);
});

test('refresh and exclusive pagination load distinct metadata, including skipped revision numbers',async()=>{
  const f=fixture({count:60});f.allVersions.delete(id(10040));await f.session.refresh();
  assert.deepEqual(f.calls.map(row=>row.action),['get','history']);assert.equal(f.session.snapshot().versions.length,25);const cursor=f.session.snapshot().nextBefore;
  await f.session.loadMore();assert.equal(f.calls.at(-1).options.before_version,cursor);assert.equal(f.session.snapshot().versions.length,50);
  await f.session.loadMore();assert.equal(f.session.snapshot().versions.length,59);assert.equal(f.session.snapshot().nextBefore,null);
  const before=f.calls.length;await f.session.loadMore();assert.equal(f.calls.length,before);
  assert.ok(f.session.snapshot().versions.every(row=>!('document'in row)&&!('private_notes'in row)));
});

test('history metadata is capped at1000 without losing the fact more records exist',async()=>{
  const f=fixture({count:1005});await f.session.refresh();for(let index=0;index<39;index++)await f.session.loadMore();
  assert.equal(f.session.snapshot().versions.length,1000);assert.equal(f.session.snapshot().historyLimitReached,true);assert.equal(f.session.snapshot().nextBefore,6);
  const before=f.calls.length;await f.session.loadMore();assert.equal(f.calls.length,before);
});

test('malformed pages cannot inject bodies, duplicates, order changes or invalid cursors',async()=>{
  for(const corrupt of [page=>page.versions[0].document={},page=>page.versions.reverse(),page=>page.versions[1]=clone(page.versions[0]),
    page=>page.next_before_version=999,page=>page.versions[0].organization_id=id(99),page=>page.versions[0].created_by='unknown']){
    const f=fixture({count:60,history:(_,page)=>{const value=page();corrupt(value);return value;}}),before=f.session.snapshot().versions;
    await f.session.refresh();assert.equal(f.session.snapshot().status,'error');assert.deepEqual(f.session.snapshot().versions,before);
  }
});

test('latest selection wins and superseded requests are aborted',async()=>{
  const held=deferred();const f=fixture({fetchVersion:(versionId,found)=>versionId===id(10001)?held.promise.then(found):found()});
  const first=f.session.select(id(10001));await tick();await f.session.select(id(10002));assert.equal(f.session.snapshot().selected.version.id,id(10002));
  assert.equal(f.calls[0].options.signal.aborted,true);held.resolve();await first;assert.equal(f.session.snapshot().selected.version.id,id(10002));assert.equal(f.session.snapshot().status,'ready');
});

test('selected version scope is checked and newer head metadata requires explicit refresh',async()=>{
  const bad=fixture({fetchVersion:(_,found)=>{const value=found();value.lesson.class_id=id(99);return value;}});await bad.session.select(id(10001));assert.equal(bad.session.snapshot().selected,null);
  const f=fixture();f.commit('requestReview',{expected_revision:3});await f.session.select(id(10001));assert.equal(f.session.snapshot().status,'conflict');
  const before=f.calls.length;await f.session.act('restore',{version_id:id(10001)});assert.equal(f.calls.length,before);await f.session.refresh();assert.equal(f.session.snapshot().record.lesson.head_revision,4);
});

test('all five actions use only the captured CAS revision and confirm exact server outcomes',async()=>{
  for(const action of ['restore','requestReview','approve','publish','unpublish']){
    const f=fixture({action});await f.prepare();const before=f.record();await f.session.act(action,f.body());const after=f.session.snapshot();
    assert.equal(after.status,'ready',action);assert.equal(after.pending,null,action);assert.equal(f.calls.length,1,action);
    assert.equal(f.calls[0].body.expected_revision,before.lesson.head_revision);assert.equal(after.record.lesson.head_revision,before.lesson.head_revision+1);
    if(action==='restore'){assert.notEqual(after.record.head.id,before.head.id);assert.equal(after.record.head.restored_from_version_id,id(10001));assert.equal(after.record.head.private_notes,'Private notes 1');}
  }
});

test('closed action payload rejects authority fields, coercion, getters and unknown operations',async()=>{
  const f=fixture({action:'requestReview'});let invoked=0;
  for(const [action,body] of [['save',{}],['requestReview',{expected_revision:3}],['publish',{actor_id:AUTHOR}],['unpublish',{reason:'x',organization_id:ORG}],
    ['approve',{checks,comment:''}],['restore',{version_id:'bad'}],['requestReview',[]]])await f.session.act(action,body);
  const hostile={};Object.defineProperty(hostile,'actor_id',{enumerable:true,get(){invoked++;return AUTHOR;}});await f.session.act('requestReview',hostile);
  assert.equal(invoked,0);assert.equal(f.calls.length,0);assert.equal(f.session.snapshot().error.code,'invalid_request');
});

test('review eligibility excludes both original author and current-version author',()=>{
  const owner=fixture({action:'approve',actorId:AUTHOR});assert.equal(owner.session.snapshot().canApprove,false);
  const independent=fixture({action:'approve'});assert.equal(independent.session.snapshot().canApprove,true);
  const record=independent.record();record.head.created_by=REVIEWER;const session=createHistorySession({client:independent.client,record});assert.equal(session.snapshot().canApprove,false);
});

test('unknown results for every action require fresh state and an explicit retry',async()=>{
  for(const action of ['restore','requestReview','approve','publish','unpublish']){
    let first=true;const f=fixture({action,post:(_,body,apply)=>{if(first){first=false;throw error(503);}return apply();}});await f.prepare();
    await f.session.act(action,f.body());assert.equal(f.session.snapshot().status,'uncertain',action);assert.equal(f.calls.length,1);
    assert.deepEqual(Object.keys(f.session.snapshot().pending).sort(),['action','canRetry','expectedRevision']);
    await f.session.reconcile();assert.equal(f.session.snapshot().status,'retryable',action);assert.equal(f.session.snapshot().pending.canRetry,true);
    await f.session.act(action,f.body());assert.equal(f.calls.filter(row=>row.action===action).length,1);
    await f.session.reconcile({retry:true});assert.equal(f.session.snapshot().status,'ready',action);
    assert.deepEqual(f.calls.map(row=>row.action),[action,'get','get',action]);
  }
});

test('lost acknowledgements for every action reconcile without duplicate mutation',async()=>{
  for(const action of ['restore','requestReview','approve','publish','unpublish']){
    const f=fixture({action,post:(_,body,apply)=>{apply();throw error(0,'timeout');}});await f.prepare();await f.session.act(action,f.body());
    await f.session.reconcile({retry:true});assert.equal(f.session.snapshot().status,'ready',action);assert.equal(f.session.snapshot().pending,null);
    assert.deepEqual(f.calls.map(row=>row.action),[action,'get']);
  }
});

test('unrelated actors or event facts never masquerade as an acknowledged action',async()=>{
  const cases=[['requestReview',r=>r.reviews[0].actor_id=REVIEWER],['requestReview',r=>r.reviews[0].comment='Other request'],
    ['approve',r=>r.reviews[0].comment='Different review'],['approve',r=>r.lesson.approved_review_id=id(99)],
    ['publish',r=>r.publications[0].source_version_id=id(10001)],['publish',r=>r.publications[0].actor_id=REVIEWER],
    ['unpublish',r=>r.publications[0].reason='Another reason'],['unpublish',r=>r.publications[0].source_version_id=id(10001)],
    ['restore',r=>r.head.created_by=REVIEWER],['restore',r=>r.head.restored_from_version_id=id(10002)],
    ['restore',r=>r.head.private_notes='Different private notes'],['restore',r=>r.head.document.title='Other contents']];
  for(const [action,corrupt] of cases){
    let f;f=fixture({action,post:(_,body,apply)=>{apply();f.mutate(corrupt);return f.record();}});await f.prepare();await f.session.act(action,f.body());
    assert.equal(f.session.snapshot().status,'uncertain',action);await f.session.reconcile({retry:true});assert.equal(f.session.snapshot().status,'conflict',action);
    assert.ok(f.session.snapshot().pending);assert.equal(f.calls.filter(row=>row.action===action).length,1);
  }
});

test('intervening revisions are conflicts even if an older matching event remains visible',async()=>{
  const f=fixture({action:'requestReview',post:(_,body,apply)=>{apply();throw error(503);}});await f.session.act('requestReview',{});
  f.commit('approve',{expected_revision:4,checks,comment:'Another reviewer'},REVIEWER);
  await f.session.reconcile({retry:true});assert.equal(f.session.snapshot().status,'conflict');assert.equal(f.session.snapshot().pending.expectedRevision,3);
  assert.equal(f.session.snapshot().record.lesson.head_revision,5);await f.session.reconcile({retry:true});assert.equal(f.calls.filter(row=>row.action==='requestReview').length,1);
});

test('definite409 reads current display state but retains a nonretryable intent until refresh',async()=>{
  const f=fixture({action:'requestReview'});f.commit('requestReview',{expected_revision:3},REVIEWER);await f.session.act('requestReview',{});
  assert.equal(f.session.snapshot().status,'conflict');assert.equal(f.session.snapshot().record.lesson.head_revision,4);assert.equal(f.session.snapshot().pending.canRetry,false);
  assert.deepEqual(f.calls.map(row=>row.action),['requestReview','get']);await f.session.reconcile({retry:true});assert.equal(f.session.snapshot().status,'conflict');
  await f.session.refresh();assert.equal(f.session.snapshot().status,'ready');assert.equal(f.session.snapshot().pending,null);
});

test('failed reconciliation preserves pending action and safe errors without private server text',async()=>{
  let offline=true;const f=fixture({action:'requestReview',post:()=>{throw error(503);},get:record=>{if(offline)throw error(503);return record();}});
  await f.session.act('requestReview',{});await f.session.reconcile({retry:true});assert.equal(f.session.snapshot().status,'uncertain');assert.ok(f.session.snapshot().pending);
  assert.equal(JSON.stringify(f.session.snapshot().error).includes('PRIVATE'),false);offline=false;await f.session.reconcile();assert.equal(f.session.snapshot().status,'retryable');
  assert.equal(f.calls.filter(row=>row.action==='requestReview').length,1);
});

test('a failed explicit refresh does not discard pending intent or partially adopt fresh state',async()=>{
  const f=fixture({action:'requestReview',post:(_,body,apply)=>{apply();throw error(503);},history:()=>{throw error(503);}});
  await f.session.act('requestReview',{});await f.session.refresh();assert.ok(f.session.snapshot().pending);assert.equal(f.session.snapshot().record.lesson.head_revision,3);
  await f.session.reconcile();assert.equal(f.session.snapshot().status,'ready');assert.equal(f.session.snapshot().record.lesson.head_revision,4);
});

test('concurrent actions are never queued or resent while an operation is held',async()=>{
  const held=deferred(),f=fixture({action:'requestReview',post:(_,body,apply)=>held.promise.then(apply)});const operation=f.session.act('requestReview',{});await tick();
  await f.session.act('requestReview',{});await f.session.refresh();await f.session.reconcile({retry:true});assert.equal(f.calls.length,1);
  held.resolve();await operation;assert.equal(f.session.snapshot().status,'ready');
});

test('dispose aborts requests, clears every private reference and ignores late mutation acknowledgements',async()=>{
  const held=deferred(),f=fixture({action:'requestReview',post:(_,body,apply)=>held.promise.then(apply)});const operation=f.session.act('requestReview',{});await tick();
  const count=f.changes.length;f.session.dispose();assert.equal(f.calls[0].options.signal.aborted,true);held.resolve();await operation;
  assert.equal(f.changes.length,count);const value=f.session.snapshot();assert.equal(value.status,'disposed');assert.equal(value.record,null);assert.equal(value.selected,null);assert.equal(value.pending,null);assert.deepEqual(value.versions,[]);
});

test('account, organization, role or route loss clears state before any late read is adopted',async()=>{
  for(const changed of [{id:REVIEWER},{organization_id:id(99)},{role:'admin'},{status:'suspended'}]){
    const held=deferred(),f=fixture({get:record=>held.promise.then(record)}),reading=f.session.refresh();await tick();f.actor(changed);held.resolve();await reading;
    assert.equal(f.session.snapshot().status,'disposed');assert.equal(f.session.snapshot().record,null);
  }
  let route=true;const held=deferred(),f=fixture({get:record=>held.promise.then(record),sessionOptions:{isCurrent:()=>route}}),reading=f.session.refresh();route=false;held.resolve();await reading;
  assert.equal(f.session.snapshot().record,null);
});

test('authorization refusals on reads and writes dispose even if an injected client remains current',async()=>{
  for(const status of [401,403]){
    const reading=fixture({get:()=>{throw error(status);}});await reading.session.refresh();assert.equal(reading.session.snapshot().status,'disposed');
    const writing=fixture({action:'requestReview',post:()=>{throw error(status);}});await writing.session.act('requestReview',{});assert.equal(writing.session.snapshot().status,'disposed');
  }
});

test('whole-lesson get404 clears cached private state during refresh and reconciliation',async()=>{
  const reading=fixture({get:()=>{throw error(404,'lesson_unavailable');}});await reading.session.select(id(10001));await reading.session.refresh();
  assert.equal(reading.session.snapshot().status,'disposed');assert.equal(reading.session.snapshot().record,null);assert.equal(reading.session.snapshot().selected,null);
  const pending=fixture({action:'requestReview',post:()=>{throw error(503);},get:()=>{throw error(404,'lesson_unavailable');}});
  await pending.session.act('requestReview',{});await pending.session.reconcile({retry:true});assert.equal(pending.session.snapshot().status,'disposed');
  assert.equal(pending.session.snapshot().pending,null);assert.equal(pending.calls.filter(row=>row.action==='requestReview').length,1);
});

test('whole-lesson history404 clears cached state on the first page and on older-page requests',async()=>{
  for(const mode of ['first','older']){
    const f=fixture({count:40,history:(options,page)=>{if(mode==='first'||options.before_version)throw error(404,'lesson_unavailable');return page();}});
    await f.session.refresh();if(mode==='older')await f.session.loadMore();assert.equal(f.session.snapshot().status,'disposed',mode);
    assert.deepEqual(f.session.snapshot().versions,[]);assert.equal(f.session.snapshot().record,null);
  }
});

test('a missing specific version remains recoverable after fresh whole-lesson access is confirmed',async()=>{
  const f=fixture({fetchVersion:(versionId,found)=>{if(versionId===id(19999))throw error(404,'lesson_unavailable');return found();}});
  await f.session.select(id(10001));f.calls.length=0;await f.session.select(id(19999));
  assert.deepEqual(f.calls.map(row=>row.action),['version','get']);assert.equal(f.session.snapshot().status,'error');
  assert.equal(f.session.snapshot().error.code,'lesson_unavailable');assert.ok(f.session.snapshot().record);assert.equal(f.session.snapshot().selected,null);
  await f.session.select(id(10002));assert.equal(f.session.snapshot().status,'ready');assert.equal(f.session.snapshot().selected.version.id,id(10002));
});

test('specific version404 cannot retain private state when its scope probe fails or is invalid',async()=>{
  for(const status of [401,403,404,503]){
    const f=fixture({fetchVersion:()=>{throw error(404,'lesson_unavailable');},get:()=>{throw error(status);}});
    await f.session.select(id(19999));assert.deepEqual(f.calls.map(row=>row.action),['version','get']);assert.equal(f.session.snapshot().status,'disposed',String(status));
  }
  const bad=fixture({fetchVersion:()=>{throw error(404,'lesson_unavailable');},get:record=>{const value=record();value.lesson.class_id=id(99);return value;}});
  await bad.session.select(id(19999));assert.equal(bad.session.snapshot().status,'disposed');
});

test('temporary ordinary history reads retain pending intent, while confirmed membership denial clears it',async()=>{
  let refusal=503;const f=fixture({count:40,action:'requestReview',post:()=>{throw error(503);},history:()=>{throw error(refusal);}});
  await f.session.act('requestReview',{});await f.session.loadMore();assert.ok(f.session.snapshot().record);assert.ok(f.session.snapshot().pending);
  refusal=404;await f.session.loadMore();assert.equal(f.session.snapshot().status,'disposed');assert.equal(f.session.snapshot().record,null);
});

test('definite validation/not-found errors do not retain an ambiguous retry intent',async()=>{
  for(const status of [400,404,413,415,422]){
    const f=fixture({action:'requestReview',post:()=>{throw error(status,'invalid_request');}});await f.session.act('requestReview',{});
    assert.equal(f.session.snapshot().status,'error');assert.equal(f.session.snapshot().pending,null);assert.equal(f.calls.length,1);
  }
});

test('unpublish confirmation uses the older live snapshot source rather than the newer draft head',async()=>{
  const f=fixture({action:'unpublish'});f.commit('restore',{expected_revision:6,version_id:id(10001)});await f.session.refresh();
  assert.equal(f.session.snapshot().record.head.version_number,7);assert.equal(f.session.snapshot().record.lesson.workflow_state,'draft');
  await f.session.act('unpublish',{reason:'Withdraw older snapshot'});assert.equal(f.session.snapshot().status,'ready');
  assert.equal(f.session.snapshot().record.publications[0].source_version_id,id(10003));assert.equal(f.session.snapshot().record.lesson.active_publication_id,null);
});

test('object key order differences do not break exact lost-ack confirmation',async()=>{
  function reverse(value){if(Array.isArray(value))return value.map(reverse);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).reverse().map(key=>[key,reverse(value[key])]));return value;}
  const f=fixture({action:'approve',post:(_,body,apply)=>{apply();throw error(503);},get:record=>reverse(record())});await f.session.act('approve',f.body());await f.session.reconcile();
  assert.equal(f.session.snapshot().status,'ready');assert.equal(f.calls.filter(row=>row.action==='approve').length,1);
});

test('retry options are closed and do not coerce consent',async()=>{
  const f=fixture({action:'requestReview',post:()=>{throw error(503);}});await f.session.act('requestReview',{});
  for(const option of [{retry:'true'},{retry:true,expected_revision:3},[]])await f.session.reconcile(option);
  assert.equal(f.calls.length,1);assert.ok(f.session.snapshot().pending);
});
