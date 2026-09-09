import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';

const repository=fileURLToPath(new URL('../../',import.meta.url));
const require=createRequire(new URL('../../question-bank/official/tools/package.json',import.meta.url));
const {chromium}=require('playwright');
const origin='https://draft-backup-fixture.example.test',checks=[],errors=[],external=[];
const output=path.join(repository,'artifacts/lesson-studio');
const pass=label=>{checks.push(label);console.log('PASS '+label);};
const fixture=`import {createDraftBackup,DRAFT_BACKUP_DATABASE,DRAFT_BACKUP_STORE,MAX_BACKUP_PLAINTEXT_BYTES,MAX_BACKUP_CIPHERTEXT_BYTES} from '/js/lesson-studio/draft-backup.mjs';
import {createLessonDraft} from '/js/lesson-studio/draft-model.mjs';
import katex from '/lessons/ib-math-ai/unit-1/assets/js/katex.js';
const id=n=>'10000000-0000-4000-8000-'+String(n).padStart(12,'0');
const key={ok:true,contract:'echs.lesson.recovery.v1',account_id:id(1),organization_id:id(2),class_id:id(3),lesson_id:id(4),key_id:id(5),key_base64:btoa(String.fromCharCode(...new Uint8Array(32).fill(7)))};
function checkpoint(label='PRIVATE_ORIGINAL_DRAFT'){
const document=createLessonDraft({lessonId:id(4),courseVersionId:id(6),catalog:{unit_id:'legacy:ap-calculus:unit:1',topic_id:'legacy:ap-calculus:topic:1.7'},title:label,objective:'Explain an original example.',skill:'teacher:explain',summary:'Original recovery fixture.'});
const lesson={id:id(4),organization_id:id(2),class_id:id(3),course_version_id:id(6),access_key:'ap-calculus::0::1.7',route_path:'lessons/ap-calculus/unit-1/1-7-selecting-limit-procedures.html',unit_id:document.unit_id,topic_id:document.topic_id,slug:document.slug,head_revision:1,head_version_id:id(7),workflow_state:'draft'};
const head={id:id(7),lesson_id:id(4),version_number:1,document:structuredClone(document),private_notes:'PRIVATE_SERVER_NOTES'};
return {contract:'echs.lesson.checkpoint.v1',base:{ok:true,contract:'echs.lesson.store.v1',lesson,head},document,privateNotes:'PRIVATE_WORKING_NOTES',pending:null};}
async function dbRun(mode,work){return new Promise((resolve,reject)=>{const open=indexedDB.open(DRAFT_BACKUP_DATABASE,1);open.onerror=()=>reject(open.error);open.onsuccess=()=>{const db=open.result,tx=db.transaction(DRAFT_BACKUP_STORE,mode);let result;tx.oncomplete=()=>{db.close();resolve(result)};tx.onabort=()=>{db.close();reject(new Error('fixture transaction aborted'))};work(tx.objectStore(DRAFT_BACKUP_STORE),value=>result=value)}})}
window.fixture={ready:true,key,checkpoint,items:[],held:[],imports:[],cryptoCalls:[],decrypted:[],
checkKey:value=>createDraftBackup({key:value,indexedDB,crypto,isCurrent:()=>true,mathEngine:katex}),
async mount(options={}){const owner={active:true,statuses:[],controller:null};const engine={getRandomValues:crypto.getRandomValues.bind(crypto),randomUUID:crypto.randomUUID.bind(crypto),subtle:{
importKey:async(...args)=>{const imported=await crypto.subtle.importKey(...args);this.imports.push(imported);return imported;},
encrypt:async(...args)=>{this.cryptoCalls.push('encrypt');const result=crypto.subtle.encrypt(...args);if(options.holdEncrypt){await new Promise(resolve=>this.held.push({kind:'encrypt',release:resolve}));}if(options.failEncryptOnce){options.failEncryptOnce=false;await result;throw new Error('PRIVATE_CRYPTO_FAILURE');}return result;},
decrypt:async(...args)=>{this.cryptoCalls.push('decrypt');const result=crypto.subtle.decrypt(...args).then(value=>{this.decrypted.push(value);return value;});if(options.holdDecrypt){await new Promise(resolve=>this.held.push({kind:'decrypt',release:resolve}));}return result;}}};
owner.controller=await createDraftBackup({key:{...key,...options.key},indexedDB:options.brokenStorage?{open(){throw new Error('PRIVATE_STORAGE_ERROR')}}:indexedDB,crypto:engine,isCurrent:()=>owner.active,onStatus:value=>owner.statuses.push(value),mathEngine:katex});this.items.push(owner);return this.items.length-1;},
raw:()=>dbRun('readonly',(store,done)=>{const r=store.getAll();r.onsuccess=()=>done(r.result)}),
put:record=>dbRun('readwrite',store=>store.put(record)),
async removeAll(){return dbRun('readwrite',store=>store.clear())},
async forge(record,plain){const raw=Uint8Array.from(atob(key.key_base64),c=>c.charCodeAt(0));const imported=await crypto.subtle.importKey('raw',raw,'AES-GCM',false,['encrypt']);const iv=crypto.getRandomValues(new Uint8Array(12));const aad=new TextEncoder().encode(JSON.stringify([record.contract,JSON.parse(record.scope),record.branch_id,record.sequence,record.updated_at]));record.iv=iv.buffer;record.ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad,tagLength:128},imported,new TextEncoder().encode(plain));await this.put(record);},
async disposeAll(){for(const item of this.items)item.controller.dispose();this.items=[];for(const held of this.held)held.release();this.held=[];await this.removeAll();}};`;

const browser=await chromium.launch({headless:true,executablePath:process.env.ECHS_CHROMIUM_PATH||undefined});
const context=await browser.newContext({serviceWorkers:'block'});
await context.route('**/*',async route=>{
  const url=new URL(route.request().url());if(url.origin!==origin){external.push(url.href);return route.abort();}
  if(url.pathname==='/fixture.html')return route.fulfill({contentType:'text/html',body:'<!doctype html><html><head><meta charset="utf-8"><title>Encrypted draft fixture</title></head><body><script type="module" src="/fixture.mjs"></script></body></html>'});
  if(url.pathname==='/fixture.mjs')return route.fulfill({contentType:'text/javascript',body:fixture});
  const file=path.resolve(repository,'.'+decodeURIComponent(url.pathname));if(!file.startsWith(path.resolve(repository)+path.sep))return route.fulfill({status:403,body:''});
  try{return route.fulfill({contentType:/\.m?js$/.test(file)?'text/javascript':'application/octet-stream',body:await readFile(file)});}catch{return route.fulfill({status:404,body:''});}
});
const page=await context.newPage();page.setDefaultTimeout(10000);page.on('pageerror',error=>errors.push(error.message));
const open=async p=>{await p.goto(origin+'/fixture.html');await p.waitForFunction(()=>window.fixture?.ready);};
try{
  await open(page);
  assert.equal(await page.evaluate(async()=>{const n=await fixture.mount();return fixture.items[n].controller.write(fixture.checkpoint())}),true);
  const inspected=await page.evaluate(async()=>{const rows=await fixture.raw(),key=fixture.imports[0];let exported=false;try{await crypto.subtle.exportKey('raw',key);exported=true}catch{}
    const row=rows[0];return {count:rows.length,fields:Object.keys(row).sort(),iv:row.iv.byteLength,bytes:row.ciphertext.byteLength,keyExtractable:key.extractable,exported,
      plaintext:JSON.stringify(row).includes('PRIVATE_'),rawKey:JSON.stringify(row).includes(fixture.key.key_base64),local:Object.keys(localStorage),session:Object.keys(sessionStorage)};});
  assert.equal(inspected.count,1);assert.equal(inspected.iv,12);assert.ok(inspected.bytes>16);assert.equal(inspected.keyExtractable,false);assert.equal(inspected.exported,false);
  assert.equal(inspected.plaintext,false);assert.equal(inspected.rawKey,false);assert.deepEqual(inspected.local,[]);assert.deepEqual(inspected.session,[]);
  assert.deepEqual(inspected.fields,['branch_id','ciphertext','contract','deleted','id','iv','scope','sequence','updated_at']);
  pass('actual IndexedDB stores only scoped ciphertext/nonce metadata and AES-256 keys are nonextractable and memory-only');

  const before=await page.evaluate(async()=>{const row=(await fixture.raw())[0];return {iv:[...new Uint8Array(row.iv)],cipher:[...new Uint8Array(row.ciphertext)],sequence:row.sequence}});
  assert.equal(await page.evaluate(()=>fixture.items[0].controller.write(fixture.checkpoint())),true);
  const after=await page.evaluate(async()=>{const row=(await fixture.raw())[0];return {iv:[...new Uint8Array(row.iv)],cipher:[...new Uint8Array(row.ciphertext)],sequence:row.sequence}});
  assert.notDeepEqual(after.iv,before.iv);assert.notDeepEqual(after.cipher,before.cipher);assert.equal(after.sequence,before.sequence+1);
  pass('each committed checkpoint uses a fresh twelve-byte nonce and monotonically increasing authenticated sequence');

  await page.reload();await page.waitForFunction(()=>fixture?.ready);
  const recovered=await page.evaluate(async()=>{await fixture.mount();return fixture.items[0].controller.list()});
  assert.equal(recovered.length,1);assert.equal(recovered[0].checkpoint.privateNotes,'PRIVATE_WORKING_NOTES');assert.equal(recovered[0].checkpoint.document.title,'PRIVATE_ORIGINAL_DRAFT');
  const other=await context.newPage();other.on('pageerror',error=>errors.push(error.message));await open(other);
  const otherBranch=await other.evaluate(async()=>{await fixture.mount();await fixture.items[0].controller.write(fixture.checkpoint('SECOND_TAB_DRAFT'));return fixture.items[0].controller.branch_id});
  const ownBranch=await page.evaluate(()=>fixture.items[0].controller.branch_id);assert.notEqual(otherBranch,ownBranch);
  assert.equal((await page.evaluate(()=>fixture.items[0].controller.list())).length,2);
  await other.evaluate(()=>fixture.items[0].controller.clear());assert.equal((await page.evaluate(()=>fixture.items[0].controller.list())).length,1);await other.close();
  pass('reload recovery decrypts the same authorized scope while independent tabs retain separate branches and deletions');

  for(const field of ['account_id','organization_id','class_id','lesson_id','key_id']){
    const count=await page.evaluate(async field=>{const n=await fixture.mount({key:{[field]:'10000000-0000-4000-8000-000000000099'}});return (await fixture.items[n].controller.list()).length},field);assert.equal(count,0);
  }
  assert.equal(await page.evaluate(async()=>{const n=await fixture.mount({key:{key_base64:btoa(String.fromCharCode(...new Uint8Array(32).fill(8)))}});return (await fixture.items[n].controller.list()).length}),0);
  pass('account, organization, class, lesson, key identity and wrong key material cannot reveal another scope checkpoint');

  await page.evaluate(()=>fixture.disposeAll());await page.evaluate(async()=>{await fixture.mount();await fixture.items[0].controller.write(fixture.checkpoint())});
  const corrupt=await page.evaluate(async()=>{const original=(await fixture.raw())[0],n=fixture.cryptoCalls.filter(c=>c==='decrypt').length;
    await fixture.put({...original,ciphertext:new ArrayBuffer(4*1024*1024+17)});const huge=await fixture.items[0].controller.list();const noDecrypt=fixture.cryptoCalls.filter(c=>c==='decrypt').length===n;
    await fixture.put({...original,sequence:original.sequence+1});const tampered=await fixture.items[0].controller.list();
    await fixture.put({...original,extra:'PRIVATE_EXTRA'});const extra=await fixture.items[0].controller.list();
    await fixture.forge(original,'{"privateNotes":"PRIVATE_MALFORMED"}');const malformed=await fixture.items[0].controller.list();
    return {huge:huge.length,noDecrypt,tampered:tampered.length,extra:extra.length,malformed:malformed.length,statuses:fixture.items[0].statuses};});
  assert.deepEqual([corrupt.huge,corrupt.tampered,corrupt.extra,corrupt.malformed],[0,0,0,0]);assert.equal(corrupt.noDecrypt,true);
  assert.equal(corrupt.statuses.some(status=>status.status==='warning'),true);assert.equal(JSON.stringify(corrupt.statuses).includes('PRIVATE_'),false);
  pass('oversized ciphertext is rejected before decryption; authenticated metadata tampering, unknown fields and malformed plaintext return sanitized warnings');

  await page.evaluate(()=>fixture.disposeAll());
  const invalid=await page.evaluate(async()=>{await fixture.mount();const checkpoint=fixture.checkpoint();checkpoint.base.lesson.organization_id='10000000-0000-4000-8000-000000000099';
    const wrong=await fixture.items[0].controller.write(checkpoint);let touched=0;const getter=fixture.checkpoint();Object.defineProperty(getter,'privateNotes',{enumerable:true,get(){touched++;return 'PRIVATE_GETTER'}});
    const hooked=await fixture.items[0].controller.write(getter);const large=fixture.checkpoint();large.privateNotes='x'.repeat(4*1024*1024+1);
    const oversized=await fixture.items[0].controller.write(large);return {wrong,hooked,touched,oversized,rows:(await fixture.raw()).length};});
  assert.deepEqual(invalid,{wrong:false,hooked:false,touched:0,oversized:false,rows:0});
  pass('checkpoint canonical scope, descriptor safety and plaintext size are checked before any durable write');

  await page.evaluate(()=>fixture.disposeAll());
  const badKeys=await page.evaluate(async()=>{let hooks=0;const results=[];
    for(const patch of [{extra:'PRIVATE_EXTRA'},{key_base64:btoa('short')},{key_base64:'A'.repeat(42)+'B='},{ok:false},{account_id:'wrong'}]){
      try{await fixture.mount({key:patch});results.push(false)}catch(error){results.push(!error.message.includes('PRIVATE'))}
    }
    const malformed={...fixture.key};Object.defineProperty(malformed,'key_base64',{enumerable:true,get(){hooks++;return fixture.key.key_base64}});
    try{await fixture.checkKey(malformed);results.push(false)}catch{results.push(true)}
    return {results,hooks};});
  assert.deepEqual(badKeys,{results:[true,true,true,true,true,true],hooks:0});
  pass('fresh key envelopes reject extra fields, noncanonical or wrong-length keys and descriptor hooks without executing them');

  await page.evaluate(async()=>{await fixture.mount({holdEncrypt:true});fixture.first=fixture.items[0].controller.write(fixture.checkpoint('ACTIVE_FIRST'));});
  await page.waitForFunction(()=>fixture.held.length===1);
  const coalesced=await page.evaluate(async()=>{
    const original=TextEncoder.prototype.encode,captured=[];
    TextEncoder.prototype.encode=function(text){const bytes=original.call(this,text);if(text.startsWith('{"contract":"echs.lesson.checkpoint.v1"'))captured.push(bytes);return bytes;};
    const buffers=[],waiting=[];
    try{for(let n=0;n<40;n++){waiting.push(fixture.items[0].controller.write(fixture.checkpoint('LATEST_'+n)));buffers.push(captured.at(-1));}}
    finally{TextEncoder.prototype.encode=original;}
    fixture.latest=waiting.pop();fixture.waitingBuffers=buffers;
    return {superseded:await Promise.all(waiting),wiped:buffers.slice(0,-1).every(bytes=>bytes.every(value=>value===0)),latestIntact:buffers.at(-1).some(value=>value!==0),encrypts:fixture.cryptoCalls.filter(value=>value==='encrypt').length};
  });
  assert.deepEqual(coalesced.superseded,Array(39).fill(false));assert.equal(coalesced.wiped,true);assert.equal(coalesced.latestIntact,true);
  const encryptsBefore=coalesced.encrypts;await page.evaluate(()=>fixture.held[0].release());
  assert.equal(await page.evaluate(()=>fixture.first),true);await page.waitForFunction(()=>fixture.held.length===2);
  assert.equal(await page.evaluate(()=>fixture.items[0].statuses.at(-1).status),'saving');
  await page.evaluate(()=>fixture.held[1].release());assert.equal(await page.evaluate(()=>fixture.latest),true);
  assert.equal(await page.evaluate(()=>fixture.cryptoCalls.filter(value=>value==='encrypt').length),encryptsBefore+1);
  assert.equal((await page.evaluate(()=>fixture.items[0].controller.list()))[0].checkpoint.document.title,'LATEST_39');
  assert.equal(await page.evaluate(()=>fixture.waitingBuffers.every(bytes=>bytes.every(value=>value===0))),true);
  assert.equal(await page.evaluate(()=>fixture.items[0].statuses.at(-1).status),'saved');
  pass('rapid edits retain only active and latest waiting plaintext, immediately wipe superseded buffers and report saved only for the newest commit');

  await page.evaluate(()=>fixture.disposeAll());
  await page.evaluate(async()=>{await fixture.mount({holdEncrypt:true});fixture.pending=fixture.items[0].controller.write(fixture.checkpoint('CANCELLED_BEFORE_CLEAR'));});
  await page.waitForFunction(()=>fixture.held.length===1);
  assert.equal(await page.evaluate(()=>fixture.items[0].controller.clear()),true);
  assert.equal(await page.evaluate(()=>fixture.pending),false);
  await page.evaluate(()=>{fixture.held[0].release();});
  assert.equal((await page.evaluate(()=>fixture.items[0].controller.list())).length,0);
  await page.evaluate(()=>{fixture.pending=fixture.items[0].controller.write(fixture.checkpoint('NEW_EDIT_AFTER_CLEAR'));});
  await page.waitForFunction(()=>fixture.held.length===2);await page.evaluate(()=>fixture.held[1].release());
  assert.equal(await page.evaluate(()=>fixture.pending),true);assert.equal((await page.evaluate(()=>fixture.items[0].controller.list()))[0].checkpoint.document.title,'NEW_EDIT_AFTER_CLEAR');
  pass('clear immediately cancels pre-clear encryption, prevents late resurrection and permits a later edit in the same factory');

  await page.evaluate(()=>fixture.disposeAll());
  await page.evaluate(async()=>{await fixture.mount({holdEncrypt:true});await fixture.mount();fixture.pending=fixture.items[0].controller.write(fixture.checkpoint('REMOTE_DELETE_RACE'));});
  await page.waitForFunction(()=>fixture.held.length===1);
  assert.equal(await page.evaluate(()=>fixture.items[1].controller.remove(fixture.items[0].controller.branch_id)),true);
  await page.evaluate(()=>fixture.held[0].release());assert.equal(await page.evaluate(()=>fixture.pending),false);
  assert.equal((await page.evaluate(()=>fixture.items[1].controller.list())).length,0);
  pass('atomic sequence comparison rejects a stale writer after another authorized branch writes its tombstone');

  for(const failure of [false,true]){
    await page.evaluate(()=>fixture.disposeAll());
    await page.evaluate(async failure=>{await fixture.mount({holdEncrypt:true,failEncryptOnce:failure});await fixture.mount();fixture.active=fixture.items[0].controller.write(fixture.checkpoint('ACTIVE_BEFORE_FOREIGN_DELETE'));},failure);
    await page.waitForFunction(()=>fixture.held.length===1);
    await page.evaluate(()=>{fixture.queued=fixture.items[0].controller.write(fixture.checkpoint('QUEUED_BEFORE_FOREIGN_DELETE'));});
    assert.equal(await page.evaluate(()=>fixture.items[1].controller.remove(fixture.items[0].controller.branch_id)),true);
    await page.evaluate(()=>fixture.held[0].release());
    assert.equal(await page.evaluate(()=>fixture.active),false);assert.equal(await page.evaluate(()=>fixture.queued),false);
    assert.equal(await page.evaluate(()=>fixture.held.length),1);assert.deepEqual(await page.evaluate(()=>fixture.items[1].controller.list()),[]);
    await page.evaluate(()=>{fixture.explicit=fixture.items[0].controller.write(fixture.checkpoint('EXPLICIT_EDIT_AFTER_OBSERVATION'));});
    await page.waitForFunction(()=>fixture.held.length===2);await page.evaluate(()=>fixture.held[1].release());
    assert.equal(await page.evaluate(()=>fixture.explicit),true);
    assert.equal((await page.evaluate(()=>fixture.items[1].controller.list()))[0].checkpoint.document.title,'EXPLICIT_EDIT_AFTER_OBSERVATION');
  }
  pass('foreign deletion cancels both active and pre-delete queued writes even when encryption fails before CAS, while a later explicit edit may recreate the branch');

  await page.evaluate(()=>fixture.disposeAll());
  const unseen=await page.evaluate(async()=>{await fixture.mount();await fixture.mount();await fixture.items[1].controller.remove(fixture.items[0].controller.branch_id);
    const first=await fixture.items[0].controller.write(fixture.checkpoint('INTENT_BEFORE_TOMBSTONE_OBSERVATION'));
    const hidden=(await fixture.items[1].controller.list()).length;
    const later=await fixture.items[0].controller.write(fixture.checkpoint('EXPLICIT_INTENT_AFTER_OBSERVATION'));
    return {first,hidden,later};});
  assert.deepEqual(unseen,{first:false,hidden:0,later:true});
  pass('a foreign tombstone present before the first read invalidates earlier unacknowledged intents instead of becoming a fresh write baseline');

  await page.evaluate(()=>fixture.disposeAll());
  await page.evaluate(async()=>{await fixture.mount({holdEncrypt:true});fixture.pending=fixture.items[0].controller.write(fixture.checkpoint('DISPOSED_DRAFT'));});
  await page.waitForFunction(()=>fixture.held.length===1);await page.evaluate(()=>fixture.items[0].controller.dispose());
  assert.equal(await page.evaluate(()=>fixture.pending),false);await page.evaluate(()=>fixture.held[0].release());
  assert.equal((await page.evaluate(()=>fixture.raw())).length,0);assert.equal(await page.evaluate(()=>fixture.items[0].controller.write(fixture.checkpoint())),false);
  pass('synchronous disposal cancels pending writes and drops key authority before late crypto resolves');

  await page.evaluate(()=>fixture.disposeAll());await page.evaluate(async()=>{await fixture.mount();await fixture.items[0].controller.write(fixture.checkpoint());await fixture.mount({holdDecrypt:true});fixture.pendingList=fixture.items[1].controller.list();});
  await page.waitForFunction(()=>fixture.held.length===1);await page.evaluate(()=>{fixture.items[1].active=false;fixture.held[0].release();});
  assert.deepEqual(await page.evaluate(()=>fixture.pendingList),[]);assert.equal((await page.evaluate(()=>fixture.raw())).length,1);
  pass('ownership changes during decryption yield no candidate or content callback and retain only encrypted recovery data');

  const abandonedIndex=await page.evaluate(async()=>{const n=await fixture.mount({holdDecrypt:true});fixture.abandoned=fixture.items[n].controller.list();return n;});
  await page.waitForFunction(()=>fixture.held.length===2&&fixture.decrypted.length>0);
  await page.waitForFunction(()=>fixture.decrypted.at(-1).byteLength>0&&new Uint8Array(fixture.decrypted.at(-1)).some(value=>value!==0));
  await page.evaluate(n=>fixture.items[n].controller.dispose(),abandonedIndex);
  assert.deepEqual(await page.evaluate(()=>fixture.abandoned),[]);
  await page.evaluate(()=>fixture.held[1].release());
  await page.waitForFunction(()=>new Uint8Array(fixture.decrypted.at(-1)).every(value=>value===0));
  pass('uncooperative decrypt results arriving after disposal are explicitly wiped even when no caller receives the plaintext');

  const failed=await page.evaluate(async()=>{let message;try{await fixture.mount({brokenStorage:true})}catch(error){message=error.message}
    const original=IDBDatabase.prototype.transaction;IDBDatabase.prototype.transaction=function(name,mode,...rest){if(mode==='readwrite')throw new DOMException('PRIVATE_QUOTA_DETAILS','QuotaExceededError');return original.call(this,name,mode,...rest)};
    let saved;try{saved=await fixture.items[0].controller.write(fixture.checkpoint('UNSAVED_STORAGE_FAILURE'))}finally{IDBDatabase.prototype.transaction=original}
    return {message,saved,recovered:(await fixture.items[0].controller.list())[0].checkpoint.document.title,statuses:fixture.items[0].statuses};});
  assert.equal(failed.message.includes('PRIVATE_'),false);assert.equal(failed.saved,false);assert.equal(failed.recovered,'PRIVATE_ORIGINAL_DRAFT');
  assert.equal(JSON.stringify(failed.statuses).includes('PRIVATE_'),false);assert.equal(failed.statuses.some(s=>s.status==='error'),true);
  pass('unavailable IndexedDB and write quota failures stay recoverable, sanitize errors and preserve the last successful checkpoint');

  await page.evaluate(async()=>{const original=(await fixture.raw())[0];for(let n=0;n<40;n++){const branch='10000000-0000-4000-8000-'+String(100+n).padStart(12,'0');await fixture.put({...original,id:original.scope+'/'+branch,branch_id:branch,deleted:true,iv:null,ciphertext:null});}});
  assert.equal((await page.evaluate(()=>fixture.items[0].controller.list())).length,1);
  pass('old tombstones do not crowd recoverable branches out of the bounded candidate list');

  assert.deepEqual(await page.evaluate(()=>[Object.keys(localStorage),Object.keys(sessionStorage)]),[[],[]]);assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  await mkdir(output,{recursive:true});await writeFile(path.join(output,'draft-backup-results.json'),JSON.stringify({ok:true,groups:checks.length,checks,browser_errors:errors,
    scope:'Real Chrome WebCrypto and IndexedDB with synthetic fresh-authorized keys/checkpoints; no network service, production account, key endpoint or app integration is simulated as proven.'},null,2)+'\n');
}finally{await context.close();await browser.close();}
