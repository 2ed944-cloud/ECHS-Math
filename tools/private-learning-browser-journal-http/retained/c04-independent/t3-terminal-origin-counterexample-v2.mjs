import {createServer} from 'node:http';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {chromium} from '../../foundations/question-bank/official/tools/node_modules/playwright/index.mjs';
const here=new URL('../c04-learning-ack-candidate/',import.meta.url),prior=new URL('../c04-learning-p2b-candidate/',here),hash=b=>createHash('sha256').update(b).digest('hex');
const file=name=>readFileSync(new URL(name,here));
if(!process.argv[2]||existsSync(process.argv[2]))throw Error('Fresh report filename required');
const priorManifest=readFileSync(new URL('candidate-manifest.json',prior));if(hash(priorManifest)!=='817c3395b1589c74391cce55fd7dffdae9de3a28c2b1f9fd90e371428c788722')throw Error('Original manifest changed');
const copy=JSON.parse(file('COPY_RECEIPT.json'));for(const r of [...copy.source_files,...copy.preserved_original_tests]){const raw=readFileSync(new URL(r.path,prior));if(raw.length!==r.bytes||hash(raw)!==r.sha256)throw Error('Original source/test changed '+r.path)}
const names=['source/js/owned-learning-store.mjs','source/js/owned-learning-transport.mjs','source/question-bank/js/learning-transition.mjs','source/question-bank/js/practice-flow.mjs','browser-page.mjs','source/js/wire-binding-model.mjs','source/js/journal/wire.mjs','source/js/journal/contract.mjs','source/js/journal/pending-intent.mjs'];
const before=names.map(path=>({path,bytes:file(path).length,sha256:hash(file(path))}));
const routes=new Map();for(const name of names.filter(n=>n!=='test_browser.mjs'))routes.set('/candidate/'+name,file(name));
for(const name of ['js/owned-learning-store.mjs','question-bank/js/learning-transition.mjs','question-bank/js/practice-flow.mjs'])routes.set('/original/'+name,readFileSync(new URL('source/'+name,prior)));
const network=[],unexpected=[],errors=[];let origin;
const server=createServer((req,res)=>{network.push(req.url);res.setHeader('cache-control','no-store');if(req.url==='/'){res.setHeader('content-type','text/html');res.end('<!doctype html><title>T3 native receipt fixture</title><script type="module" src="/candidate/browser-page.mjs"></script>');return}if(routes.has(req.url)){res.setHeader('content-type','text/javascript');res.end(routes.get(req.url));return}unexpected.push(req.url);res.writeHead(404);res.end()});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1']});
const outcomes=[];const assert=(value,label)=>{if(!value)throw Error(label)};
async function page(context){const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(origin);await p.waitForFunction(()=>!!window.fixture);return p}
async function test(name,fn){const context=await browser.newContext();let deadline;await context.route('**/*',route=>route.request().url().startsWith(origin+'/')?route.continue():(unexpected.push(route.request().url()),route.abort()));try{const p=await page(context);const details=await Promise.race([fn(p,context),new Promise((_,reject)=>{deadline=setTimeout(()=>reject(Error('Native test deadline')),60000)})]);outcomes.push({name,status:'PASS',details:details??null});process.stdout.write('PASS '+name+'\n')}catch(e){outcomes.push({name,status:'FAIL',error:String(e.stack||e)});process.stdout.write('FAIL '+name+' '+e.message+'\n')}finally{clearTimeout(deadline);await context.close()}}
try{
await test('PEER01 acknowledged terminal witness accepts a context installed after its source command',async p=>{
 const result=await p.evaluate(async()=>{
  await fixture.open();const s=fixture.stores[0];
  const question=fixture.q('peer-origin'),descriptor=s.query('topicDescriptor',[question]);
  const firstContext=await s.installRemoteContext({keys:[{kind:'review',record_id:question.id},{kind:'mastery',record_id:descriptor.key}]});
  const first=await s.commit(s.prepare('recordAttempt',[{question,correct:false}]))
  const firstAck=await s.deliverNext();if(!firstAck.acknowledged)throw Error('Initial ACK failed');
  const secondContext=await s.installRemoteContext({keys:[{kind:'sessions',record_id:'unused-session'}]});
  fixture.tick();await s.commit(s.prepare('recordAttempt',[{question,correct:true}]));
  const next=await s.materializeNext(),owner=s.binding(),key=[owner.organization_id,owner.account_id,owner.incarnation_id,1,first.operation_id];
  const valid=await s.wireIntent(next.intent.id),before=await fixture.dump();
  await fixture.mutate('bindings',key,v=>({...v,origin:{...v.origin,context_id:secondContext.context_id}}));
  const changed=await fixture.dump();let code=null,accepted=null;
  try{accepted=await s.wireIntent(next.intent.id)}catch(error){code=error.code}
  const after=await fixture.dump(),context=changed.contexts.find(c=>c.id===secondContext.context_id),bundle=JSON.parse(changed.bundles.find(b=>b.id===first.operation_id).raw);
  return {code,accepted:!!accepted,rawUnchanged:accepted?.exact_raw===valid.exact_raw,
    firstContext:firstContext.context_id,secondContext:secondContext.context_id,
    sourceCommandRevision:bundle.command_revision,laterContextInstalledRevision:context.installed_command_revision,
    changedStores:fixture.names.filter(n=>JSON.stringify(before[n])!==JSON.stringify(changed[n])),
    beforeBinding:before.bindings.find(b=>b.id===first.operation_id),afterBinding:changed.bindings.find(b=>b.id===first.operation_id),
    noValidationWrites:JSON.stringify(changed)===JSON.stringify(after)};
 });
 assert(result.accepted&&result.code===null&&result.rawUnchanged,'gap did not reproduce');
 assert(result.changedStores.join()==='bindings'&&result.sourceCommandRevision<=result.laterContextInstalledRevision&&result.noValidationWrites,'one-record origin timing corruption');
 return result;
});
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
for(const r of before)assert(file(r.path).length===r.bytes&&hash(file(r.path))===r.sha256,'Source changed during tests');
const failed=outcomes.filter(x=>x.status==='FAIL').length,report={contract:'echs.peer.t3-terminal-origin-counterexample.v1',status:failed||unexpected.length||errors.length?'FAIL':'PASS',groups:outcomes.length,passed:outcomes.length-failed,failed,skipped:0,outcomes,source_files:before,original_manifest_sha256:hash(priorManifest),loopback_requests:network.length,unexpected_requests:unexpected,page_errors:errors,chromium_version:browser.version(),node_version:process.version,scope:'One native corruption counterexample on developing T3; PASS means the suspected origin gap was reproduced. Synthetic ports only; no actual browser-to-server HTTP or production calls.'};
writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n',{flag:'wx'});process.stdout.write(JSON.stringify({status:report.status,groups:report.groups,failed})+'\n');if(report.status!=='PASS')process.exitCode=1;
