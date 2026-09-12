// Actual browser/IDB -> loopback TLS -> unchanged J049 -> PostgREST/SQL fixture.
import assert from 'node:assert/strict';
import https from 'node:https';
import {readFile,writeFile,realpath} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {resolve,dirname} from 'node:path';
import {createRequire} from 'node:module';
import {writeSync} from 'node:fs';
import {createHash,randomUUID,X509Certificate} from 'node:crypto';
import {createJournalHandler} from './runtime/handler.mjs';
import {FIXTURE_ORIGIN,postgrestPort} from './bridge.mjs';
import {listenHttps} from './https-bridge.mjs';
import {control} from './control-client.mjs';
import {diagnostic,recordHttpObservation} from './test_http.mjs';
import {LABELS,exercise} from './browser-cases.mjs';

const HERE=dirname(fileURLToPath(import.meta.url)),hash=raw=>createHash('sha256').update(raw).digest('hex');
const MODULES=['js/owned-learning-store.mjs','js/wire-binding-model.mjs','js/journal/wire.mjs','js/journal/contract.mjs','js/journal/pending-intent.mjs','question-bank/js/learning-transition.mjs','question-bank/js/practice-flow.mjs'];
const SOURCE_NAMES=['runtime/handler.mjs','runtime/wire.mjs','runtime/contract.mjs','runtime/pending-intent.mjs','bridge.mjs','https-bridge.mjs','browser-page.mjs','controls.py','fixture.py','control-client.mjs','test_http.mjs','test_browser_http.mjs','browser-cases.mjs','browser-dependency.json',...MODULES.map(name=>'retained/c04-learning-ack-candidate/source/'+name)];
const snapshot=()=>Promise.all(SOURCE_NAMES.map(async path=>{const raw=await readFile(resolve(HERE,path));return {path,bytes:raw.length,sha256:hash(raw)}}));
function deferred(){let resolve;const promise=new Promise(yes=>resolve=yes);return {promise,resolve}}
export function assertLoopbackProxyArgs(args){
 assert.ok(Array.isArray(args)&&args.every(arg=>typeof arg==='string'));
 // This owned loopback fixture must not inherit ambient PAC/proxy settings.
 // Check the browser's observed command line, preserving the TLS exception.
 const proxy=args.filter(arg=>/^--(?:no-proxy-server|proxy-server|proxy-pac-url|proxy-auto-detect|proxy-bypass-list)(?:=|$)/.test(arg));
 assert.deepEqual(proxy,['--no-proxy-server']);
}
export const BROWSER_FAILURE_STAGES=Object.freeze(['control-start','listener-start','listener-metadata','cdp-connect','positive-context','positive-page','positive-navigation','positive-fixture','browser-identity','positive-certificate','negative-page','negative-navigation','negative-verification','tls-cleanup','group-account','group-context','group-route','group-page','group-navigation','group-fixture','group-configure','group-body','group-verification','group-cleanup','final-verification']);
export const BROWSER_NETWORK_ERRORS=Object.freeze(['ERR_CERT_AUTHORITY_INVALID','ERR_CERT_COMMON_NAME_INVALID','ERR_CERT_DATE_INVALID','ERR_CERT_INVALID','ERR_SSL_PROTOCOL_ERROR','ERR_CONNECTION_CLOSED','ERR_CONNECTION_REFUSED','ERR_CONNECTION_RESET','ERR_CONNECTION_TIMED_OUT','ERR_TIMED_OUT','ERR_ABORTED','ERR_FAILED','ERR_BLOCKED_BY_CLIENT','ERR_BLOCKED_BY_RESPONSE','ERR_NAME_NOT_RESOLVED','ERR_ADDRESS_UNREACHABLE','ERR_NETWORK_ACCESS_DENIED','ERR_EMPTY_RESPONSE']);
export function browserDiagnostic(error,stage=null){
 const read=(value,key)=>{try{return value?.[key]}catch{return undefined}},types=new Set(['Error','TimeoutError','TargetClosedError','AssertionError','TypeError','RangeError','ReferenceError']);
 let result;try{result=diagnostic({constructor:{name:'Error'},...Object.fromEntries(['sqlstate','code','operator','actual','expected'].map(key=>[key,read(error,key)])),cause:{code:read(read(error,'cause'),'code')}})}catch{result={}};
 delete result.location;
 // Bundled browser error constructors can be renamed; only fixed public
 // error categories and exact network tokens may leave the private report.
 const name=read(error,'name'),constructor=read(read(error,'constructor'),'name');
 result.type=types.has(name)?name:types.has(constructor)?constructor:'OtherError';
 if(BROWSER_FAILURE_STAGES.includes(stage))result.stage=stage;
 const rawMessage=read(error,'message'),message=typeof rawMessage==='string'&&rawMessage.length<=8192?rawMessage:'';
 const network=/\bnet::(ERR_[A-Z0-9_]+)\b/.exec(message);
 if(network&&BROWSER_NETWORK_ERRORS.includes(network[1]))result.network_error=network[1];
 const rawStack=read(error,'stack'),stack=typeof rawStack==='string'&&rawStack.length<=32768?rawStack:'';
 const match=/(?<![A-Za-z0-9_.-])test_browser_http\.mjs:(\d+):(\d+)|(?<![A-Za-z0-9_.-])browser-cases\.mjs:(\d+):(\d+)/.exec(stack);
 if(match){const line=Number(match[1]||match[3]),column=Number(match[2]||match[4]);if(Number.isInteger(line)&&line>=1&&line<=1000000&&Number.isInteger(column)&&column>=1&&column<=1000000)result.location={file:match[1]?'test_browser_http.mjs':'browser-cases.mjs',line,column};}
 return result;
}
const safeError=error=>browserDiagnostic(error);
export const failedBrowserGroup=index=>Number.isInteger(index)&&index>=0&&index<LABELS.length?LABELS[index]:'setup';
export function observeSetupBrowser(){
 const counts={requests:0,document_requests:0,responses:0,document_responses:0,failed_requests:0,route_attempted:0,route_continued:0,route_failed:0,route_abort_attempted:0,cdp_requests:0,cdp_responses:0,cdp_failed:0,domcontentloaded:0,load:0,observer_errors:0};
 const listeners=[];let saturated=false,networkError=null,documentStatus=null,identityVerified=false,disposed=false;
 const bump=name=>{if(counts[name]===255)saturated=true;else counts[name]++};
 const status=value=>{if(Number.isInteger(value)&&value>=100&&value<=599)documentStatus=value};
 const failure=message=>{networkError=browserDiagnostic({message}).network_error??'OTHER'};
 const on=(emitter,event,fn)=>{const observed=(...args)=>{try{fn(...args)}catch{bump('observer_errors')}};emitter.on(event,observed);listeners.push([emitter,event,observed])};
 return {
  attach:(page,cdp)=>{
   on(page,'request',request=>{bump('requests');if(request.isNavigationRequest())bump('document_requests')});
   on(page,'response',response=>{bump('responses');if(response.request().isNavigationRequest()){bump('document_responses');status(response.status())}});
   on(page,'requestfailed',request=>{bump('failed_requests');failure(request.failure()?.errorText)});
   on(page,'domcontentloaded',()=>bump('domcontentloaded'));on(page,'load',()=>bump('load'));
   on(cdp,'Network.requestWillBeSent',()=>bump('cdp_requests'));
   on(cdp,'Network.responseReceived',()=>bump('cdp_responses'));
   on(cdp,'Network.loadingFailed',event=>{bump('cdp_failed');failure(event.errorText)});
  },
  continueRoute:action=>{
   bump('route_attempted');
   try{const task=action();void Promise.resolve(task).then(()=>bump('route_continued'),()=>bump('route_failed'));return task}
   catch(error){bump('route_failed');throw error}
  },
  abortRoute:()=>bump('route_abort_attempted'),
  identityVerified:()=>{identityVerified=true},
  snapshot:()=>({counts:{...counts},saturated,network_error:networkError,document_status:documentStatus,identity_verified:identityVerified}),
  dispose:()=>{if(disposed)return;disposed=true;for(const [emitter,event,fn] of listeners)emitter.removeListener(event,fn);listeners.length=0},
 };
}
function bounded(task,ms,code){let timer;return Promise.race([task,new Promise((_,reject)=>timer=setTimeout(()=>reject(new Error(code)),ms))]).finally(()=>clearTimeout(timer))}

export function protocolBoundary(debug,runId,write=line=>writeSync(2,line)){
 assert.match(runId,/^[a-f0-9]{32}$/);assert.equal(typeof debug.disable,'function');let emitted=false;
 return ()=>{
  if(emitted)return;
  // Same pinned debug object used by coreBundle's protocol logger. Disable
  // before the synchronous marker so no cleanup traffic can follow it.
  assert.equal(debug.disable(),'pw:protocol');
  const line='ECHS_PROTOCOL_BOUNDARY '+JSON.stringify({contract:'echs.c04.browser-protocol-boundary.v1',run_id:runId,phase:'setup'})+'\n';
  assert.equal(write(line),Buffer.byteLength(line));emitted=true;
 };
}

export async function closeContext(context,contexts,primaryError=null){
 // Disposal is best effort; a failed required close leaves ownership recorded.
 try{for(const page of context.pages()){try{await bounded(page.evaluate(()=>window.fixture?.disposeAll()),2000,'page-dispose-deadline')}catch{}}}catch{}
 try{await bounded(context.close(),5000,'context-close-deadline');contexts.delete(context)}
 catch(error){throw primaryError||error}
}

export async function cleanupFixture({contexts,browser,negative,server,ctl}){
 // Failure of one owned resource never skips attempts on the others. The
 // caller keeps the primary test failure separate from this cleanup result.
 const failures=[];let contextsClosed=true,browserClosed=!browser,controlReaped=!ctl,listenersClosed=true;
 const note=error=>failures.push(safeError(error));
 for(const context of contexts){
  try{await closeContext(context,contexts)}
  catch(error){contextsClosed=false;note(error)}
 }
 if(browser){try{await bounded(browser.close(),5000,'browser-disconnect-deadline');browserClosed=true}catch(error){note(error)}}
 for(const listener of [negative,server]){
  if(!listener)continue;
  try{const result=await bounded(listener.close(),5000,'listener-close-deadline');assert.deepEqual(result,{listeners_closed:true,sockets_remaining:0,response_tasks_remaining:0})}
  catch(error){listenersClosed=false;note(error)}
 }
 if(ctl){try{await bounded(ctl.close(),5000,'control-close-deadline');controlReaped=true}catch(error){note(error)}}
 const cleanup={contexts_closed:contextsClosed&&contexts.size===0,browser_connection_closed:browserClosed,
  control_reaped:controlReaped,listeners_closed:listenersClosed,response_tasks_remaining:listenersClosed?0:null};
 const complete=failures.length===0&&cleanup.contexts_closed&&browserClosed&&controlReaped&&listenersClosed;
 return {cleanup_complete:complete,cleanup,...(failures.length?{cleanup_failure:failures[0]}:{})};
}

function tlsCall(origin,cert,route,raw,token){
 assert.ok(['state','heads','apply','operation'].includes(route));assert.equal(typeof raw,'string');
 return new Promise((resolve,reject)=>{
  const parts=[];let total=0;const started=performance.now();
  const request=https.request(origin+'/functions/v1/learning-journal/'+route,{method:'POST',ca:cert,rejectUnauthorized:true,agent:false,headers:{'content-type':'application/json',authorization:'Bearer '+token,origin},timeout:12000},response=>{
   response.on('data',part=>{total+=part.length;if(total>1048576||performance.now()-started>12000){request.destroy(new Error('node-response-bound'));return;}parts.push(part)});
   response.once('end',()=>{try{const raw=Buffer.concat(parts).toString('utf8');resolve({status:response.statusCode,raw,data:JSON.parse(raw)})}catch{reject(new Error('node-response-json'))}});
   response.once('error',reject);
  });
  request.once('timeout',()=>request.destroy(new Error('node-response-deadline')));request.once('error',reject);request.end(raw);
 });
}

async function main(){
 const [configPath,python,output]=process.argv.slice(2),config=JSON.parse(await readFile(configPath,'utf8'));
 assert.equal(config.contract,'echs.c04.journal-http-private-run.v1');assert.equal(process.platform,'linux');assert.equal(process.env.GITHUB_ACTIONS,'true');assert.equal(process.env.RUNNER_ENVIRONMENT,'github-hosted');
 assert.match(config.run_id,/^[a-f0-9]{32}$/);assert.equal(await realpath(configPath),resolve(HERE,'runs',config.run_id,'secrets','control-private.json'));
 assert.equal(hash(await readFile(resolve(HERE,'source-manifest.json'))),config.source_manifest_sha256);
 const sourceBefore=await snapshot(),pin=JSON.parse(await readFile(resolve(HERE,'browser-dependency.json'))),repo=resolve(config.repo);
 assert.equal(await realpath(resolve(repo,'tools/private-learning-browser-journal-http')),await realpath(HERE));
 const packageRoot=resolve(repo,'question-bank/official/tools/node_modules/playwright');
 const {chromium}=await import(pathToFileURL(resolve(packageRoot,'index.mjs')));
 assert.equal(JSON.parse(await readFile(resolve(packageRoot,'package.json'))).version,pin.playwright);
 const require=createRequire(await realpath(resolve(packageRoot,'index.mjs'))),coreRoot=dirname(require.resolve('playwright-core/package.json'));
 assert.equal(JSON.parse(await readFile(resolve(coreRoot,'package.json'))).version,'1.61.1');
 // Pin the private logger API and exact formatting, not just the package name.
 assert.equal(hash(await readFile(resolve(coreRoot,'lib/utilsBundle.js'))),'1295945f0054d2504c9b751945b15aa3c672530ad5a340f3f9636e5e238f304a');
 assert.equal(hash(await readFile(resolve(coreRoot,'lib/coreBundle.js'))),'6be5c2ea035554e9b184b1dbc7aa5e7f1fb428dd1b5c202022858dcfae9bee27');
 assert.equal(process.env.DEBUG,'pw:protocol');assert.equal(process.env.DEBUG_COLORS,'0');assert.equal(process.env.MAX_LOG_LENGTH,'16384');
 const endProtocol=protocolBoundary(require(resolve(coreRoot,'lib/utilsBundle.js')).debug,config.run_id);
 const cert=await readFile(config.tls.positive.certificate_path),key=await readFile(config.tls.positive.key_path),otherCert=await readFile(config.tls.negative.certificate_path),otherKey=await readFile(config.tls.negative.key_path);
 const leaf=new X509Certificate(cert),other=new X509Certificate(otherCert);
 assert.equal(hash(leaf.raw),config.tls.positive.metadata.der_sha256);assert.equal(hash(other.raw),config.tls.negative.metadata.der_sha256);
 assert.equal(hash(leaf.publicKey.export({type:'spki',format:'der'})),config.tls.positive.metadata.spki_sha256);assert.notEqual(hash(leaf.raw),hash(other.raw));assert.notEqual(leaf.fingerprint256,other.fingerprint256);
 const entries=[{path:'/',type:'text/html; charset=utf-8',body:Buffer.from('<!doctype html><html lang="en"><meta charset="utf-8"><title>Isolated journal fixture</title><link rel="icon" href="/favicon.ico"><script type="module" src="/browser-page.mjs"></script><body>Isolated synthetic journal fixture</body></html>')},
  {path:'/browser-page.mjs',type:'text/javascript; charset=utf-8',body:await readFile(resolve(HERE,'browser-page.mjs'))},{path:'/favicon.ico',type:'image/x-icon',body:Buffer.alloc(0)}];
 for(const name of MODULES)entries.push({path:'/source/'+name,type:'text/javascript; charset=utf-8',body:await readFile(resolve(HERE,'retained/c04-learning-ack-candidate/source',name))});
 assert.equal(entries.length,10);
 const outcomes=[],unexpected=[],pageErrors=[],nativeObservations=[],rpcObservations=[],rpcPayloads=[],contexts=new Set(),faults=new Set(),setup=observeSetupBrowser();
 let ctl,server,negative,browser,pendingFault=null,stage='control-start',failureStage=null,currentGroup=null;
 const report={contract:'echs.c04.browser-journal-http-actual.v1',status:'RUNNING; NOT ACCEPTED',planned_groups:LABELS,checks:outcomes,production_calls:0,hosted_edge_executed:false,hosted_tls_executed:false,production_authority_accepted:false,native_browser_executed:false,real_https_executed:false,postgrest_executed:false,database_executed:false,cleanup_complete:false};
 const command=(action,c,extra={})=>ctl.call(action,{case:c.case,...extra});
 function arm(mode,id,c){
  assert.equal(pendingFault,null);assert.ok(['pause','drop','partial','207'].includes(mode));
  const enter=deferred(),gate=deferred(),abort=deferred();
  const value={mode,id,c,proved:false,entered:bounded(enter.promise,8000,'fault-entry-deadline'),aborted:abort.promise,release:()=>gate.resolve(null),gate:gate.promise,enter:enter.resolve,abort:abort.resolve};
  value.entered.catch(()=>{});pendingFault=value;faults.add(value);return value;
 }
 async function afterResponse(request,response,signal,client){
  if(!pendingFault||!request.url.endsWith('/apply')||response.status!==200)return null;
  const value=pendingFault,data=await response.clone().json();assert.equal(data.receipt.operation_id,value.id);pendingFault=null;value.client=client;
  const stored=await command('operation',value.c,{operation_id:value.id});assert.ok(stored);assert.deepEqual(JSON.parse(stored.receipt_text),data.receipt);value.proved=true;
  const onAbort=()=>{value.abort(true);value.release()};signal.addEventListener('abort',onAbort,{once:true});if(signal.aborted)onAbort();
  value.enter(true);
  try{if(value.mode==='pause')await value.gate;return value.mode==='pause'?null:value.mode}finally{signal.removeEventListener('abort',onAbort);faults.delete(value)}
 }
 function guard(context,{allowNegative=false,observeSetup=false}={}){
  context.on('page',page=>page.on('pageerror',()=>pageErrors.push({kind:'pageerror'})));
  const validPaths=new Set(entries.map(row=>row.path));
  return context.route('**/*',route=>{
   const request=route.request(),url=new URL(request.url());
   const positive=url.origin===server.origin&&!url.search&&!url.hash&&(validPaths.has(url.pathname)||/^\/functions\/v1\/learning-journal\/(state|heads|apply|operation)$/.test(url.pathname));
   const negativeAllowed=allowNegative&&url.origin===negative.origin&&url.pathname==='/'&&!url.search&&!url.hash;
   if(positive||negativeAllowed){if(observeSetup&&positive)return setup.continueRoute(()=>route.continue());return route.continue();}
   if(observeSetup)setup.abortRoute();
   unexpected.push({url_sha256:hash(request.url()),method:['GET','POST','OPTIONS'].includes(request.method())?request.method():'OTHER'});return route.abort('blockedbyclient');
  });
 }
 async function newPage(context,c){
  const previousStage=stage;
  stage='group-page';const page=await context.newPage();
  stage='group-navigation';await page.goto(server.origin,{waitUntil:'load',timeout:10000});
  stage='group-fixture';await page.waitForFunction(()=>!!window.fixture,undefined,{timeout:5000});
  stage='group-configure';
  await page.evaluate(({owner,token,session_tag})=>fixture.configure({owner,token,session_tag}),c);stage=previousStage;return page;
 }
 async function group(index,fn){
  assert.equal(outcomes.length,index);currentGroup=index;stage='group-account';const began=performance.now(),c=await ctl.call('new',{role:'student'});c.session_tag='synthetic_'+randomUUID().replaceAll('-','');
  stage='group-context';const context=await browser.newContext({serviceWorkers:'block',ignoreHTTPSErrors:false});contexts.add(context);stage='group-route';await guard(context);
  let details,primaryError;
  try{const page=await newPage(context,c);stage='group-body';details=await bounded(fn(page,c,context),45000,'browser-group-deadline');stage='group-verification';assert.deepEqual(unexpected,[]);assert.deepEqual(pageErrors,[])}
  catch(error){primaryError=error;failureStage=stage;throw error}
  finally{
   for(const fault of faults)fault.release();
   stage='group-cleanup';await closeContext(context,contexts,primaryError);
  }
  outcomes.push({name:LABELS[index],status:'PASS',elapsed_ms:Math.round(performance.now()-began),details});
  currentGroup=null;
 }
 try{
  ctl=await control(configPath,python);report.database_executed=true;
  const port=postgrestPort('http://'+config.rest_ip+':3000',{fetchImpl:async(url,options)=>{
   const match=/^\{"p_token_hash":"[a-f0-9]{64}","p_payload":([\s\S]+)\}$/.exec(options.body);assert.ok(match);
   const parsed=JSON.parse(match[1]);if(typeof parsed.operation_id==='string')rpcPayloads.push({operation_id:parsed.operation_id,payload_sha256:hash(match[1])});
   return fetch(url,options);
  },observe:row=>{rpcObservations.push(row);report.postgrest_executed=true}});
  stage='listener-start';server=await listenHttps({cert,key,entries,afterResponse,setupDiagnostics:true,handlerFactory:origin=>createJournalHandler({supabaseUrl:FIXTURE_ORIGIN,serviceKey:config.service_key,allowedOrigins:[origin],fetchImpl:port})});
  negative=await listenHttps({cert:otherCert,key:otherKey,entries,handlerFactory:()=>()=>new Response('{}')});
  stage='listener-metadata';await writeFile(resolve(dirname(configPath),'listener-private.json'),JSON.stringify([Number(new URL(server.origin).port),Number(new URL(negative.origin).port)]),{flag:'wx',mode:0o600});
  assert.match(config.cdp_endpoint,/^ws:\/\/127\.0\.0\.1:\d+\/devtools\/browser\/[a-f0-9-]{36}$/);
  stage='cdp-connect';browser=await chromium.connectOverCDP(config.cdp_endpoint,{timeout:10000});
  stage='positive-context';const tlsContext=await browser.newContext({serviceWorkers:'block',ignoreHTTPSErrors:false});contexts.add(tlsContext);await guard(tlsContext,{allowNegative:true,observeSetup:true});
  stage='positive-page';const page=await tlsContext.newPage();
  stage='browser-identity';
  const cdp=await tlsContext.newCDPSession(page),version=await cdp.send('Browser.getVersion'),commandLine=await cdp.send('Browser.getBrowserCommandLine');
  assert.equal(version.product.split('/').at(-1),pin.version);assert.ok(version.revision.startsWith('@'));
  const args=commandLine.arguments,spki='--ignore-certificate-errors-spki-list='+config.tls.positive.metadata.spki_sha256_base64;
  assertLoopbackProxyArgs(args);
  assert.equal(args.filter(arg=>arg.startsWith('--ignore-certificate-errors-spki-list=')).length,1);assert.ok(args.includes(spki));
  assert.equal(args.filter(arg=>arg.startsWith('--user-data-dir=')).length,1);assert.ok(args.includes('--user-data-dir='+config.browser_profile));assert.ok(args.includes('--enable-automation'));
  assert.ok(!args.some(arg=>/^--(?:ignore-certificate-errors(?:=|$)|allow-insecure-localhost(?:=|$))/.test(arg)));
  setup.identityVerified();setup.attach(page,cdp);await cdp.send('Network.enable');
  stage='positive-navigation';await page.goto(server.origin,{waitUntil:'load',timeout:10000});endProtocol();
  stage='positive-fixture';await page.waitForFunction(()=>!!window.fixture,undefined,{timeout:5000});
  stage='positive-certificate';const chain=await cdp.send('Network.getCertificate',{origin:server.origin});assert.equal(chain.tableNames.length,1);
  const observedLeaf=new X509Certificate(Buffer.from(chain.tableNames[0],'base64'));
  assert.equal(hash(observedLeaf.raw),config.tls.positive.metadata.der_sha256);assert.equal(hash(observedLeaf.publicKey.export({type:'spki',format:'der'})),config.tls.positive.metadata.spki_sha256);
  stage='negative-page';const bad=await tlsContext.newPage();let certificateRejected=false;
  stage='negative-navigation';
  try{await bad.goto(negative.origin,{waitUntil:'load',timeout:5000})}catch(error){certificateRejected=/net::ERR_CERT_AUTHORITY_INVALID/.test(error.message)}
  stage='negative-verification';assert.equal(certificateRejected,true);assert.equal(negative.metrics.requests,0);assert.equal(await bad.evaluate(()=>!!window.fixture),false);
  report.tls={accepted_leaf:true,served_der_sha256:hash(observedLeaf.raw),served_spki_sha256:hash(observedLeaf.publicKey.export({type:'spki',format:'der'})),narrow_spki_exception:true,fresh_explicit_profile:true,unrelated_leaf_rejected:true,negative_application_requests:0,broad_tls_flags:false};
  report.browser={product:version.product,revision:version.revision,playwright:pin.playwright,descriptor_revision:pin.revision,executable_sha256:config.browser_executable_sha256};
  report.native_browser_executed=true;report.real_https_executed=true;
  stage='tls-cleanup';await cdp.detach();await tlsContext.close();contexts.delete(tlsContext);await negative.close();negative=null;
  const api=async(route,raw,c)=>{const result=await tlsCall(server.origin,cert,route,raw,c.token);recordHttpObservation(nativeObservations,route,result.status,result.data);return result};
  await exercise({group,api,command,arm,newPage,rpcPayloads});
  stage='final-verification';assert.deepEqual(outcomes.map(row=>row.name),LABELS);assert.deepEqual(await snapshot(),sourceBefore);assert.deepEqual(unexpected,[]);assert.deepEqual(pageErrors,[]);
  Object.assign(report,{status:'ACTUAL BROWSER HTTPS POSTGREST SQL PASS',source_files:sourceBefore,static_routes:10,served_t3_modules:7,held_transport_served:false});
 }catch(error){report.status='FAIL; NO ACCEPTANCE';report.failure=browserDiagnostic(error,failureStage??stage);report.failed_group=failedBrowserGroup(currentGroup);if(currentGroup===null&&outcomes.length===0)report.setup_observation={contract:'echs.c04.browser-setup-observation.v1',browser:setup.snapshot(),transport:server?.setupObservation()??null}}
 finally{
  try{endProtocol()}catch{report.status='FAIL; NO ACCEPTANCE'}
  // Diagnostic listeners must not prevent independent owned cleanup attempts.
  try{setup.dispose()}catch{}
  for(const fault of faults)fault.release();
  const cleaned=await cleanupFixture({contexts,browser,negative,server,ctl});Object.assign(report,cleaned);
  if(!cleaned.cleanup_complete)report.status='FAIL; NO ACCEPTANCE';
  try{assert.deepEqual(await snapshot(),sourceBefore)}catch{report.status='FAIL; NO ACCEPTANCE';report.source_changed=true}
  report.unexpected_requests=unexpected;report.page_errors=pageErrors;report.rpc_observations=rpcObservations.slice(-12);report.http_observations=nativeObservations.slice(-12);report.source_files=sourceBefore;
  await writeFile(output,JSON.stringify(report)+'\n',{flag:'wx'});
 }
 process.stdout.write(JSON.stringify({status:report.status,groups:outcomes.length,cleanup_complete:report.cleanup_complete})+'\n');if(report.status!=='ACTUAL BROWSER HTTPS POSTGREST SQL PASS')process.exitCode=1;
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1]))main().catch(()=>{process.stdout.write('{"status":"FAIL BEFORE REPORT; NO ACCEPTANCE"}\n');process.exitCode=1});
