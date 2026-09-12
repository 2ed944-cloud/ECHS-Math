import {createServer} from 'node:http';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {chromium} from '../../foundations/question-bank/official/tools/node_modules/playwright/index.mjs';
const here=new URL('../c04-learning-wire-binding-candidate/',import.meta.url),prior=new URL('../c04-learning-p2b-candidate/',here),hash=b=>createHash('sha256').update(b).digest('hex');
const file=name=>readFileSync(new URL(name,here));
const frozen=file('source-manifest-v3.json');if(hash(frozen)!=='34d4640a7fb9176ce93500bdc50ce9273b3be3791f99446e79a0282b92666968')throw Error('Frozen T2 manifest changed');for(const r of JSON.parse(frozen).source_files){const b=file(r.path);if(b.length!==r.bytes||hash(b)!==r.sha256)throw Error('Frozen T2 source changed')}
if(!process.argv[2]||existsSync(process.argv[2]))throw Error('Fresh report filename required');
const priorManifest=readFileSync(new URL('candidate-manifest.json',prior));if(hash(priorManifest)!=='817c3395b1589c74391cce55fd7dffdae9de3a28c2b1f9fd90e371428c788722')throw Error('Original manifest changed');
const copy=JSON.parse(file('COPY_RECEIPT.json'));for(const r of [...copy.source_files,...copy.preserved_original_tests]){const raw=readFileSync(new URL(r.path,prior));if(raw.length!==r.bytes||hash(raw)!==r.sha256)throw Error('Original source/test changed '+r.path)}
const names=['source/js/owned-learning-store.mjs','source/js/owned-learning-transport.mjs','source/question-bank/js/learning-transition.mjs','source/question-bank/js/practice-flow.mjs','browser-page.mjs','test_browser.mjs','source/js/wire-binding-model.mjs','source/js/journal/wire.mjs','source/js/journal/contract.mjs','source/js/journal/pending-intent.mjs'];
const before=names.map(path=>({path,bytes:file(path).length,sha256:hash(file(path))}));
const routes=new Map();for(const name of names.filter(n=>n!=='test_browser.mjs'))routes.set('/candidate/'+name,file(name));
for(const name of ['js/owned-learning-store.mjs','question-bank/js/learning-transition.mjs','question-bank/js/practice-flow.mjs'])routes.set('/original/'+name,readFileSync(new URL('source/'+name,prior)));
const network=[],unexpected=[],errors=[];let origin;
const server=createServer((req,res)=>{network.push(req.url);res.setHeader('cache-control','no-store');if(req.url==='/'){res.setHeader('content-type','text/html');res.end('<!doctype html><title>T1 native source bundle fixture</title><script type="module" src="/candidate/browser-page.mjs"></script>');return}if(routes.has(req.url)){res.setHeader('content-type','text/javascript');res.end(routes.get(req.url));return}unexpected.push(req.url);res.writeHead(404);res.end()});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1']});
const outcomes=[];const assert=(value,label)=>{if(!value)throw Error(label)};
async function page(context){const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(origin);await p.waitForFunction(()=>!!window.fixture);return p}
async function test(name,fn){const context=await browser.newContext();let deadline;await context.route('**/*',route=>route.request().url().startsWith(origin+'/')?route.continue():(unexpected.push(route.request().url()),route.abort()));try{const p=await page(context);const details=await Promise.race([fn(p,context),new Promise((_,reject)=>{deadline=setTimeout(()=>reject(Error('Native test deadline')),60000)})]);outcomes.push({name,status:'PASS',details:details??null});process.stdout.write('PASS '+name+'\n')}catch(e){outcomes.push({name,status:'FAIL',error:String(e.stack||e)});process.stdout.write('FAIL '+name+' '+e.message+'\n')}finally{clearTimeout(deadline);await context.close()}}
try{
await test('Frozen T2 can resolve installed after cleanup invalidates authority',async p=>{
 const result=await p.evaluate(async()=>{
  await fixture.open();const s=fixture.stores[0];let registered=false,aborts=0;
  fixture.observationHook(({signal})=>{if(!registered){registered=true;signal.addEventListener('abort',()=>{aborts++;fixture.change({status:'inactive'})},{once:true})}});
  let resolved=null,errorCode=null;
  try{resolved=await s.installRemoteContext()}catch(e){errorCode=e.code}
  let staleHandleRejected=false,handleCode=null;try{s.binding()}catch(e){staleHandleRejected=true;handleCode=e.code}
  const dump=await fixture.dump();return {aborts,installedResult:resolved?.installed===true,errorCode,staleHandleRejected,handleCode,contexts:dump.contexts.length,activeStatus:fixture.identity().status,wireRows:dump.wire.length};
 });
 assert(result.aborts===1&&result.activeStatus==='inactive'&&result.staleHandleRejected,'cleanup reentrantly invalidated account');
 assert(result.installedResult&&result.errorCode===null&&result.contexts===1&&result.wireRows===0,'predecessor stale-success edge must reproduce exactly');return result;
});
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
for(const r of before)assert(file(r.path).length===r.bytes&&hash(file(r.path))===r.sha256,'Source changed during tests');
const failed=outcomes.filter(x=>x.status==='FAIL').length,report={contract:'echs.c04.t2-cleanup-reentrant-counterexample.v1',status:failed||unexpected.length||errors.length?'FAIL':'PASS',groups:outcomes.length,passed:outcomes.length-failed,failed,skipped:0,outcomes,source_files:before,original_manifest_sha256:hash(priorManifest),loopback_requests:network.length,unexpected_requests:unexpected,page_errors:errors,chromium_version:browser.version(),node_version:process.version,scope:'Independent counterexample: frozen T2 can report installed after synchronous cleanup-abort invalidates its account authority. PASS means the known predecessor defect was reproduced; it does not mean lifecycle acceptance. Context commits under the original valid scope before cleanup; no cross-owner write or network occurred. Successor fix is required before use.'};
writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n',{flag:'wx'});process.stdout.write(JSON.stringify({status:report.status,groups:report.groups,failed})+'\n');if(report.status!=='PASS')process.exitCode=1;
