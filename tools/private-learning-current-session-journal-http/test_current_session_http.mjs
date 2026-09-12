// Additive canonical-session browser -> native HTTPS -> unchanged J049/SQL.
import assert from 'node:assert/strict';
import https from 'node:https';
import {readFile,writeFile,realpath} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {resolve,dirname} from 'node:path';
import {createRequire} from 'node:module';
import {createHash,randomUUID,X509Certificate} from 'node:crypto';
import {createJournalHandler} from '../private-learning-browser-journal-http/runtime/handler.mjs';
import {readWire} from '../private-learning-browser-journal-http/runtime/wire.mjs';
import {FIXTURE_ORIGIN,postgrestPort} from '../private-learning-browser-journal-http/bridge.mjs';
import {listenHttps} from '../private-learning-browser-journal-http/https-bridge.mjs';
import {assertLoopbackProxyArgs,assertBrowserLoggingArgs,assertNetworkServiceArgs,protocolBoundary,requireFixtureAbsent,closeContext,cleanupFixture,browserDiagnostic} from '../private-learning-browser-journal-http/test_browser_http.mjs';
import {control} from './session-control-client.mjs';
import {createSessionFixture,SESSION_PATHS} from './session-fixture.mjs';
import {listenSessionHttps,createBodyHold} from './session-https-bridge.mjs';
import {LABELS,exercise} from './current-session-cases.mjs';

const HERE=dirname(fileURLToPath(import.meta.url)),BASE=resolve(HERE,'../private-learning-browser-journal-http');
const hash=raw=>createHash('sha256').update(raw).digest('hex');
async function bounded(promise,ms,code){let timer;try{return await Promise.race([promise,new Promise((_,reject)=>timer=setTimeout(()=>reject(Error(code)),ms))])}finally{clearTimeout(timer)}}
export function sessionDiagnostic(error,stage){
 const value=browserDiagnostic(error,stage);delete value.location;let stack;try{stack=error?.stack}catch{}
 if(typeof stack==='string'&&stack.length<=32768){const match=/(?:^|[/\\])(test_current_session_http\.mjs|current-session-cases\.mjs):(\d+):(\d+)/m.exec(stack);if(match&&Number(match[2])>=1&&Number(match[2])<=1000000&&Number(match[3])>=1&&Number(match[3])<=1000000)value.location={file:match[1],line:Number(match[2]),column:Number(match[3])}}
 return value;
}
export async function main(){
 const [configPath,python,output]=process.argv.slice(2),config=JSON.parse(await readFile(configPath,'utf8'));
 assert.equal(config.contract,'echs.c04.journal-http-private-run.v1');assert.equal(process.platform,'linux');assert.equal(process.env.GITHUB_ACTIONS,'true');assert.equal(process.env.RUNNER_ENVIRONMENT,'github-hosted');
 assert.match(config.run_id,/^[a-f0-9]{32}$/);assert.equal(await realpath(configPath),resolve(BASE,'runs',config.run_id,'secrets','control-private.json'));
 assert.equal(resolve(output),resolve(BASE,'runs',config.run_id,'current-session-results.json'));
 assert.equal(hash(await readFile(resolve(BASE,'source-manifest.json'))),config.source_manifest_sha256);
 assert.match(config.current_session_manifest_sha256,/^[a-f0-9]{64}$/);assert.equal(hash(await readFile(resolve(HERE,'source-manifest.json'))),config.current_session_manifest_sha256);
 const selected=JSON.parse(await readFile(resolve(HERE,'selected-source.json'))),repo=resolve(config.repo);
 assert.equal(selected.predecessor_manifest_sha256,'660bb66c7a37cab21972dc540a32fd2df788f9756333852bb10b848bf95eef76');assert.equal(selected.files.length,13);assert.equal(selected.files.filter(row=>row.served).length,12);
 for(const row of selected.files){const raw=await readFile(resolve(HERE,row.path));assert.equal(raw.length,row.bytes);assert.equal(hash(raw),row.sha256)}
 const names=['test_current_session_http.mjs','current-session-browser-page.mjs','current-session-cases.mjs','session-fixture.mjs','session-https-bridge.mjs','session-controls.py','session-control-client.mjs','selected-source.json',...selected.files.map(row=>row.path)];
 const snapshot=()=>Promise.all(names.map(async path=>{const raw=await readFile(resolve(HERE,path));return {path,bytes:raw.length,sha256:hash(raw)}}));
 const sourceBefore=await snapshot(),pin=JSON.parse(await readFile(resolve(BASE,'browser-dependency.json')));
 assert.equal(await realpath(resolve(repo,'tools/private-learning-current-session-journal-http')),await realpath(HERE));
 const packageRoot=resolve(repo,'question-bank/official/tools/node_modules/playwright'),{chromium}=await import(pathToFileURL(resolve(packageRoot,'index.mjs')));
 const require=createRequire(await realpath(resolve(packageRoot,'index.mjs'))),coreRoot=dirname(require.resolve('playwright-core/package.json'));
 for(const folder of [packageRoot,coreRoot])assert.equal(JSON.parse(await readFile(resolve(folder,'package.json'))).version,pin.playwright);
 assert.equal(hash(await readFile(resolve(coreRoot,'lib/utilsBundle.js'))),'1295945f0054d2504c9b751945b15aa3c672530ad5a340f3f9636e5e238f304a');
 assert.equal(hash(await readFile(resolve(coreRoot,'lib/coreBundle.js'))),'6be5c2ea035554e9b184b1dbc7aa5e7f1fb428dd1b5c202022858dcfae9bee27');
 assert.equal(process.env.DEBUG,'pw:protocol');assert.equal(process.env.DEBUG_COLORS,'0');assert.equal(process.env.MAX_LOG_LENGTH,'16384');
 const endProtocol=protocolBoundary(require(resolve(coreRoot,'lib/utilsBundle.js')).debug,config.run_id);
 const cert=await readFile(config.tls.positive.certificate_path),key=await readFile(config.tls.positive.key_path),otherCert=await readFile(config.tls.negative.certificate_path),otherKey=await readFile(config.tls.negative.key_path);
 const leaf=new X509Certificate(cert),other=new X509Certificate(otherCert);assert.equal(hash(leaf.raw),config.tls.positive.metadata.der_sha256);assert.equal(hash(other.raw),config.tls.negative.metadata.der_sha256);assert.notEqual(leaf.fingerprint256,other.fingerprint256);
 const html='<!doctype html><html lang="en" data-owned-learning="p2-practice"><meta charset="utf-8"><title>Isolated current-session fixture</title><link rel="icon" href="/favicon.ico"><script src="/source/js/institution-client.js"></script><script src="/source/question-bank/js/learning-system.js"></script><script type="module" src="/browser-page.mjs"></script><body>Isolated synthetic account fixture</body></html>';
 const entries=[{path:'/',type:'text/html; charset=utf-8',body:Buffer.from(html)},{path:'/browser-page.mjs',type:'text/javascript; charset=utf-8',body:await readFile(resolve(HERE,'current-session-browser-page.mjs'))},{path:'/favicon.ico',type:'image/x-icon',body:Buffer.alloc(0)}];
 for(const row of selected.files.filter(row=>row.served))entries.push({path:'/source/'+row.path.slice(9),type:'text/javascript; charset=utf-8',body:await readFile(resolve(HERE,row.path))});assert.equal(entries.length,15);
 const contexts=new Set(),outcomes=[],unexpected=[],pageErrors=[],journal=[],accounts=[],rpcPayloads=[],holds=new Set();
 let ctl,server,negative,browser,armed=null,mutation=null,stage='control-start',failureStage=null,currentGroup=null;
 const report={contract:'echs.c04.current-session-journal-http-actual.v1',status:'FAIL; NO ACCEPTANCE',planned_groups:LABELS,checks:outcomes,run_id:config.run_id,production_calls:0,active_adoption:false,production_auth_executed:false,synthetic_account_api:true,same_origin_fixture:true,native_browser_executed:false,real_https_executed:false,canonical_client_executed:false,journal_handler_executed:false,postgrest_executed:false,database_executed:false,cleanup_complete:false};
 const command=(action,c,extra={})=>ctl.call(action,{case:c.case,...extra});
 const register=(c,override={})=>{const expires_at=new Date(Date.now()+1800000).toISOString(),account={id:c.owner.account_id,organization_id:c.owner.organization_id,role:'student',status:'active',expires_at,...override};server.session.register({token:c.token,account});return {token:c.token,account,expires_at}};
 const freshCase=async(role='student',missing=false)=>{const c=await ctl.call(missing?'new_missing_owner':'new',missing?{}:{role});c.session=register(c,{role});return c};
 function arm(path,c=null){assert.equal(armed,null);const hold=createBodyHold();holds.add(hold);armed={path,token:c?.token??null,hold};return hold}
 function clearFaults(){armed=null;mutation=null;for(const hold of holds)hold.close()}
 async function guard(context,{allowNegative=false}={}){
  context.on('page',page=>page.on('pageerror',()=>pageErrors.push({kind:'pageerror'})));
  const validPaths=new Set([...entries.map(row=>row.path),...Object.values(SESSION_PATHS)]);
  await context.route('**/*',route=>{const request=route.request(),url=new URL(request.url());
   const positive=url.origin===server.origin&&!url.search&&!url.hash&&(validPaths.has(url.pathname)||/^\/functions\/v1\/learning-journal\/(state|heads|apply|operation)$/.test(url.pathname));
   const bad=allowNegative&&url.origin===negative.origin&&url.pathname==='/'&&!url.search&&!url.hash;
   if(positive||bad)return route.continue();unexpected.push({url_sha256:hash(request.url()),method:['GET','POST','OPTIONS'].includes(request.method())?request.method():'OTHER'});return route.abort('blockedbyclient');
  });
 }
 async function newContext(){const creating=browser.newContext({serviceWorkers:'block',ignoreHTTPSErrors:false}).then(context=>{contexts.add(context);return context});const context=await bounded(creating,5000,'session-context-deadline');await bounded(guard(context),5000,'session-route-deadline');return context}
 async function newPage(context,c=null){stage='group-page';const page=await context.newPage();stage='group-navigation';await page.goto(server.origin,{waitUntil:'load',timeout:10000});await page.waitForFunction(()=>!!window.fixture&&!!window.ECHSInstitution&&!!window.ECHSLearning,undefined,{timeout:5000});if(c)await page.evaluate(value=>fixture.setSession(value),c.session);stage='group-body';return page}
 async function beforeImport(context,c,probe){
  const path=server.origin+'/source/question-bank/js/learning-system.js';let release,timer,primary,result;const gate=new Promise(resolve=>release=resolve);
  const intercept=route=>gate.then(()=>route.continue());await context.route(path,intercept);const page=await context.newPage();
  const navigation=page.goto(server.origin,{waitUntil:'load',timeout:10000});navigation.catch(()=>{});
  try{timer=setTimeout(release,5000);await page.waitForFunction(()=>!!window.ECHSInstitution&&!window.ECHSLearning,undefined,{timeout:3000});await page.evaluate(value=>ECHSInstitution.setSession(value,true),c.session);result=await probe(page)}
  catch(error){primary=error}
  finally{clearTimeout(timer);release();for(const cleanup of [()=>navigation,()=>bounded(context.unroute(path,intercept),2000,'fixture-unroute-deadline'),()=>bounded(page.close(),2000,'fixture-page-close-deadline')])try{await cleanup()}catch(error){primary??=error}}
  if(primary)throw primary;return result;
 }
 async function group(index,fn){
  assert.equal(index,outcomes.length);currentGroup=index;const beforeContexts=new Set(contexts),began=performance.now();let primary,details;
  journal.length=0;accounts.length=0;rpcPayloads.length=0;assert.equal(armed,null);assert.equal(mutation,null);
  try{stage='group-account';const c=await freshCase();stage='group-context';const context=await newContext();stage='group-body';details=await bounded(fn({c,context}),45000,'current-session-group-deadline');assert.deepEqual(unexpected,[]);assert.deepEqual(pageErrors,[])}
  catch(error){primary=error;failureStage=stage;throw error}
  finally{clearFaults();stage='group-cleanup';let cleanupFailed=false;for(const context of [...contexts])if(!beforeContexts.has(context))try{await closeContext(context,contexts)}catch{cleanupFailed=true}
   for(const hold of holds){try{const value=await bounded(hold.finished,2000,'session-hold-final-deadline');if(value.failed||!value.settled)cleanupFailed=true}catch{cleanupFailed=true}}holds.clear();
   if(cleanupFailed&&!primary)throw Error('current-session-group-cleanup');
  }
  const elapsed=Math.round(performance.now()-began);assert.ok(elapsed<=90000);outcomes.push({name:LABELS[index],status:'PASS',elapsed_ms:elapsed,details});currentGroup=null;
 }
 const api=(route,raw,c)=>new Promise((resolveReply,reject)=>{const request=https.request(server.origin+'/functions/v1/learning-journal/'+route,{method:'POST',ca:cert,headers:{authorization:'Bearer '+c.token,'content-type':'application/json','content-length':Buffer.byteLength(raw)},timeout:8000},response=>{const parts=[];let bytes=0;response.on('data',part=>{bytes+=part.length;if(bytes>1048576)response.destroy(Error('fixture-response-size'));else parts.push(part)});response.once('error',reject);response.once('end',()=>{try{const text=Buffer.concat(parts).toString();resolveReply({status:response.statusCode,raw:text,data:JSON.parse(text)})}catch(error){reject(error)}})});request.once('error',reject);request.once('timeout',()=>request.destroy(Error('fixture-api-deadline')));request.end(raw)});
 try{
  ctl=await control(configPath,python);report.database_executed=true;
  const port=postgrestPort('http://'+config.rest_ip+':3000',{fetchImpl:async(url,options)=>{const match=/^\{"p_token_hash":"[a-f0-9]{64}","p_payload":([\s\S]+)\}$/.exec(options.body);assert.ok(match);const parsed=JSON.parse(match[1]);if(typeof parsed.operation_id==='string')rpcPayloads.push({operation_id:parsed.operation_id,payload_sha256:hash(match[1])});return fetch(url,options)},observe:()=>{report.postgrest_executed=true}});
  stage='listener-start';server=await listenSessionHttps({cert,key,entries,sessionFactory:origin=>{const fixture=createSessionFixture({origin});return {register:fixture.register,close:fixture.close,response(request){const reply=fixture.response(request);accounts.push({path:new URL(request.url).pathname,status:reply.status});return reply}}},
   handlerFactory:origin=>{const handler=createJournalHandler({supabaseUrl:FIXTURE_ORIGIN,serviceKey:config.service_key,allowedOrigins:[origin],fetchImpl:port});return async request=>{report.journal_handler_executed=true;const raw=request.method==='POST'?await readWire(request.clone().body,{timeoutMs:3000}):'',reply=await handler(request);const replyRaw=await readWire(reply.clone().body,{timeoutMs:3000});const row={path:new URL(request.url).pathname,token:request.headers.get('authorization'),raw,status:reply.status,replyRaw};journal.push(row);if(mutation){const fn=mutation;mutation=null;return fn(reply,row)}return reply}},
   selectBodyHold(request){if(armed&&new URL(request.url).pathname===armed.path&&(armed.token===null||request.headers.get('authorization')==='Bearer '+armed.token)){const {hold}=armed;armed=null;return hold}return null}});
  negative=await listenHttps({cert:otherCert,key:otherKey,entries,handlerFactory:()=>()=>new Response('{}')});
  stage='listener-metadata';await writeFile(resolve(dirname(configPath),'current-session-listener-private.json'),JSON.stringify([Number(new URL(server.origin).port),Number(new URL(negative.origin).port)]),{flag:'wx',mode:0o600});
  assert.match(config.cdp_endpoint,/^ws:\/\/127\.0\.0\.1:\d+\/devtools\/browser\/[a-f0-9-]{36}$/);stage='cdp-connect';browser=await chromium.connectOverCDP(config.cdp_endpoint,{timeout:10000});
  const context=await browser.newContext({serviceWorkers:'block',ignoreHTTPSErrors:false});contexts.add(context);await guard(context,{allowNegative:true});const page=await context.newPage(),cdp=await context.newCDPSession(page);
  stage='browser-identity';const version=await cdp.send('Browser.getVersion'),commandLine=await cdp.send('Browser.getBrowserCommandLine'),args=commandLine.arguments;
  assert.equal(version.product.split('/').at(-1),pin.version);assert.ok(version.revision.startsWith('@'));assertLoopbackProxyArgs(args);assertBrowserLoggingArgs(args);assertNetworkServiceArgs(args);
  assert.deepEqual(args.filter(arg=>arg.startsWith('--ignore-certificate-errors-spki-list=')),['--ignore-certificate-errors-spki-list='+config.tls.positive.metadata.spki_sha256_base64]);assert.deepEqual(args.filter(arg=>arg.startsWith('--user-data-dir=')),['--user-data-dir='+config.browser_profile]);assert.ok(args.includes('--enable-automation'));assert.ok(!args.some(arg=>/^--(?:ignore-certificate-errors(?:=|$)|allow-insecure-localhost(?:=|$))/.test(arg)));
  await cdp.send('Network.enable');stage='positive-navigation';await page.goto(server.origin,{waitUntil:'load',timeout:10000});endProtocol();await page.waitForFunction(()=>!!window.fixture&&!!window.ECHSInstitution&&!!window.ECHSLearning,undefined,{timeout:5000});
  stage='positive-certificate';const chain=await cdp.send('Network.getCertificate',{origin:server.origin});assert.equal(chain.tableNames.length,1);const observed=new X509Certificate(Buffer.from(chain.tableNames[0],'base64'));assert.equal(hash(observed.raw),config.tls.positive.metadata.der_sha256);assert.equal(hash(observed.publicKey.export({type:'spki',format:'der'})),config.tls.positive.metadata.spki_sha256);
  const bad=await context.newPage();let rejected=false;stage='negative-navigation';try{await bad.goto(negative.origin,{waitUntil:'load',timeout:5000})}catch(error){rejected=/net::ERR_CERT_AUTHORITY_INVALID/.test(error.message)}assert.equal(rejected,true);assert.equal(negative.metrics.requests,0);await requireFixtureAbsent(bad);
  report.tls={accepted_leaf:true,served_der_sha256:hash(observed.raw),served_spki_sha256:hash(observed.publicKey.export({type:'spki',format:'der'})),narrow_spki_exception:true,fresh_explicit_profile:true,unrelated_leaf_rejected:true,negative_application_requests:0,broad_tls_flags:false};
  report.browser={product:version.product,revision:version.revision,playwright:pin.playwright,descriptor_revision:pin.revision,executable_sha256:config.browser_executable_sha256};report.native_browser_executed=report.real_https_executed=report.canonical_client_executed=true;
  await cdp.detach();await closeContext(context,contexts);await negative.close();negative=null;
  const clientSource=await readFile(resolve(HERE,'selected/js/institution-client.js'),'utf8');for(const name of ['localLearningPayload','sendLearningQueue','syncLearning','flushPending','scheduleLearningSync'])assert.match(clientSource,new RegExp('function '+name+'\\([^)]*\\)\\{if\\(ownedLearningHeld\\(\\)\\)return heldLearning\\(\\);'));
  await exercise({group,newPage,newContext,beforeImport,freshCase,register,command,api,arm,journal,accounts,rpcPayloads,mutate(fn){assert.equal(mutation,null);mutation=fn},close:context=>closeContext(context,contexts)});
  stage='final-verification';assert.deepEqual(outcomes.map(row=>row.name),LABELS);assert.deepEqual(await snapshot(),sourceBefore);assert.deepEqual(unexpected,[]);assert.deepEqual(pageErrors,[]);report.status='ACTUAL CURRENT SESSION HTTPS POSTGREST SQL PASS';
 }catch(error){report.status='FAIL; NO ACCEPTANCE';report.failure=sessionDiagnostic(error,failureStage??stage);report.failed_group=currentGroup===null?'setup':LABELS[currentGroup]}
 finally{
  try{endProtocol()}catch{report.status='FAIL; NO ACCEPTANCE'}clearFaults();
  const cleaned=await cleanupFixture({contexts,browser,negative,server,ctl});Object.assign(report,cleaned);if(!cleaned.cleanup_complete)report.status='FAIL; NO ACCEPTANCE';
  try{assert.deepEqual(await snapshot(),sourceBefore)}catch{report.status='FAIL; NO ACCEPTANCE';report.source_changed=true}
  Object.assign(report,{unexpected_requests:unexpected,page_errors:pageErrors,source_files:sourceBefore,static_routes:15,served_runtime_scripts:12,retained_html_served:false});await writeFile(output,JSON.stringify(report)+'\n',{flag:'wx'});
 }
 process.stdout.write(JSON.stringify({status:report.status,groups:outcomes.length,cleanup_complete:report.cleanup_complete})+'\n');if(report.status!=='ACTUAL CURRENT SESSION HTTPS POSTGREST SQL PASS')process.exitCode=1;
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1]))main().catch(()=>{process.stdout.write('{"status":"FAIL BEFORE REPORT; NO ACCEPTANCE"}\n');process.exitCode=1});
