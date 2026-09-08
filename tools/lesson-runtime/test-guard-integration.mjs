import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';

// Isolated browser integration, not a production authorization/DB test.
// Executes original portal-access.js + lesson-access-guard.js against local
// institution API responses. Unrelated tutor startup and redirect destinations
// are replaced at the HTTP boundary to keep this test offline and bounded.
const root=fileURLToPath(new URL('../../',import.meta.url));
const require=createRequire(new URL('../../question-bank/official/tools/package.json',import.meta.url));
const {chromium}=require('playwright');
const output=process.env.ECHS_GUARD_EVIDENCE || path.join(root,'artifacts/lesson-runtime');
const calls=[],blocked=[],checks=[];
const scenarios=new Set(['released','unreleased','unassigned','guest','parent','teacher','admin','api-failure']);
const title='Continuity & joins';
const accessKey='ap-calculus::0::1.7';
const lessonKey=`${accessKey}::${title}`;
const types={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.json':'application/json','.css':'text/css','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf'};
const json=(route,status,body)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
const landingPaths=new Set(['/login.html','/question-bank/student.html','/question-bank/parent.html','/question-bank/teacher.html','/question-bank/admin.html','/question-bank/practice.html','/index.html']);
// Fulfill the same fixture bytes and API responses at the browser boundary.
// This avoids host Chrome loopback stalls before any guard code executes.
const origin='http://127.0.0.1:4173';
async function fulfillFixture(route){
  try {
    const request=route.request(),url=new URL(request.url());
    if(url.pathname==='/__guard_fixture__/api'){
      const scenario=url.searchParams.get('scenario'),apiPath=url.searchParams.get('path');
      if(!scenarios.has(scenario))return json(route,400,{error:'Unknown fixture scenario'});
      const raw=request.postData()||'';
      const body=raw?JSON.parse(raw):undefined;
      calls.push({scenario,path:apiPath,method:request.method(),body});
      if(apiPath==='/me'){
        return json(route,200,scenario==='guest'?null:{id:'guard-fixture-account',role:['parent','teacher','admin'].includes(scenario)?scenario:'student'});
      }
      if(apiPath==='/dashboard/student'){
        return json(route,200,{classes:scenario==='unassigned'?[]:[{classes:{id:'fixture-class',course_key:'ap-calculus'}}]});
      }
      if(apiPath==='/lesson-access/check'){
        if(scenario==='api-failure')return json(route,503,{error:'Intentional fixture failure'});
        const correctRoute=body?.course_key==='ap-calculus'&&body?.access_key===accessKey;
        return json(route,200,{allowed:correctRoute&&scenario!=='unreleased',reason:correctRoute?'lesson-not-released':'wrong-lesson-route'});
      }
      return json(route,500,{error:'Unexpected fixture API route'});
    }
    if(landingPaths.has(url.pathname)){
      return route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><html lang="en"><title>Local redirect destination</title><p>Isolated redirect destination; no production scripts.</p></html>'});
    }
    if(url.pathname==='/js/lesson-ai-loader.js'){
      return route.fulfill({status:200,contentType:'text/javascript',body:'// Unrelated tutor startup is intentionally stubbed at this isolated test HTTP boundary.'});
    }
    const file=path.resolve(root,'.'+decodeURIComponent(url.pathname));
    if(!file.startsWith(path.resolve(root)+path.sep))return route.fulfill({status:403,body:''});
    if(!(await stat(file)).isFile())return route.fulfill({status:404,body:''});
    return route.fulfill({status:200,contentType:types[path.extname(file)]||'application/octet-stream',body:await readFile(file)});
  } catch {return route.fulfill({status:404,body:''});}
}
await mkdir(output,{recursive:true});
const base=origin+'/tools/lesson-runtime/fixtures/guard-integration.html';
let browser;
const pass=label=>{checks.push(label);console.log('PASS '+label);};
function fixtureURL(scenario){
  const url=new URL(base);
  url.search=new URLSearchParams({course:'ap-calculus',unit:'0',topic:'1.7',lessonKey,accessKey,title,scope:'lesson',scenario});
  url.hash='slide=1';return url.href;
}
async function newPage(){
  const context=await browser.newContext({serviceWorkers:'block'});
  await context.route('**/*',route=>{
    if(new URL(route.request().url()).origin===origin)return fulfillFixture(route);
    blocked.push(route.request().url());return route.abort();
  });
  const page=await context.newPage();page.setDefaultTimeout(15000);
  const events=[],errors=[];
  page.on('console',message=>{const text=message.text();if(text.startsWith('ECHS_GUARD_FIXTURE '))events.push(JSON.parse(text.slice(19)));});
  page.on('pageerror',error=>errors.push(error.message));
  return {context,page,events,errors};
}
function noScoredEvidence(events){
  assert.deepEqual(events.filter(event=>event.kind==='learning-call'),[]);
  assert.deepEqual(events.filter(event=>event.kind==='learning-event'&&event.name!=='echs:lesson-completed'),[]);
  assert.deepEqual(events.filter(event=>event.kind==='storage-write'&&!(event.store==='localStorage'&&event.key==='echs_math_complete')),[]);
}
async function assertOnlyCompletionStorage(page,expected){
  assert.deepEqual(await page.evaluate(()=>({local:Object.fromEntries(Object.entries(localStorage)),session:Object.fromEntries(Object.entries(sessionStorage))})),{
    local:expected?{echs_math_complete:JSON.stringify([lessonKey])}:{},session:{}
  });
}
try {
  browser=await chromium.launch({headless:true,executablePath:process.env.ECHS_CHROMIUM_PATH||undefined});
  const allowed=await newPage();
  await allowed.page.goto(fixtureURL('released'));
  await allowed.page.waitForFunction(()=>fixture.ready);
  assert.equal(await allowed.page.evaluate(()=>fixture.error),undefined);
  assert.equal(await allowed.page.evaluate(()=>fixture.controller?.mode),'document');
  assert.equal(await allowed.page.locator('[data-finish-lesson]').count(),1);
  assert.equal(await allowed.page.evaluate(()=>document.documentElement.dataset.echsLessonCourse),'ap-calculus');
  assert.deepEqual(calls.filter(call=>call.scenario==='released').map(call=>call.path),['/me','/dashboard/student','/lesson-access/check']);
  assert.deepEqual(calls.find(call=>call.scenario==='released'&&call.path==='/lesson-access/check'),{scenario:'released',path:'/lesson-access/check',method:'POST',body:{course_key:'ap-calculus',access_key:accessKey}});
  const gateIndex=allowed.events.findIndex(event=>event.kind==='gate'&&event.value==='allowed');
  const mountIndex=allowed.events.findIndex(event=>event.kind==='mounted');
  assert.ok(gateIndex>=0&&mountIndex>gateIndex,'The real guard must allow the route before mounting.');
  await allowed.page.getByRole('button',{name:'Next',exact:true}).click();
  await allowed.page.getByRole('button',{name:'Previous',exact:true}).click();
  await assertOnlyCompletionStorage(allowed.page,false);
  assert.deepEqual(allowed.events.filter(event=>['storage-write','learning-event','learning-call'].includes(event.kind)),[]);
  pass('real portal resolves student assignment; real guard checks the exact released route before renderer mounts; viewing/navigation produces no evidence');

  await Promise.all([
    allowed.page.waitForURL(url=>url.pathname==='/question-bank/practice.html'),
    allowed.page.getByRole('button',{name:'Continue to lesson practice',exact:true}).click()
  ]);
  const practiceURL=new URL(allowed.page.url());
  assert.equal(practiceURL.origin,origin);
  assert.deepEqual(Object.fromEntries(practiceURL.searchParams),{course:'ap-calculus',unit:'0',topic:'1.7',from:lessonKey,accessKey,title,mode:'adaptive',autostart:'1'});
  assert.equal(practiceURL.hash,'');
  await assertOnlyCompletionStorage(allowed.page,true);
  assert.deepEqual(allowed.events.filter(event=>event.kind==='learning-event'),[{scenario:'released',kind:'learning-event',name:'echs:lesson-completed',detail:{key:lessonKey}}]);
  assert.equal(allowed.events.filter(event=>event.kind==='storage-write').length,1);
  noScoredEvidence(allowed.events);
  pass('renderer delegates to original finish: one explicit completion, correct focused-practice parameters, no attempt/session/mastery writes');

  await allowed.page.goto(fixtureURL('released'));await allowed.page.waitForFunction(()=>fixture.ready);
  await Promise.all([allowed.page.waitForURL(url=>url.pathname==='/question-bank/practice.html'),allowed.page.getByRole('button',{name:'Continue to lesson practice',exact:true}).click()]);
  assert.equal(allowed.events.filter(event=>event.kind==='learning-event').length,1);
  assert.equal(allowed.events.filter(event=>event.kind==='storage-write').length,1);
  await assertOnlyCompletionStorage(allowed.page,true);noScoredEvidence(allowed.events);
  assert.deepEqual(allowed.errors,[]);await allowed.context.close();
  pass('reopening completed lesson preserves idempotent completion and original practice handoff');

  for(const [scenario,target,notice,expectedAPIs] of [
    ['unreleased','/question-bank/student.html','lesson-not-released',['/me','/dashboard/student','/lesson-access/check']],
    ['unassigned','/question-bank/student.html','course-not-assigned',['/me','/dashboard/student']],
    ['guest','/login.html',null,['/me']],
    ['parent','/question-bank/parent.html',null,['/me']],
    ['api-failure','/login.html',null,['/me','/dashboard/student','/lesson-access/check']]
  ]){
    const run=await newPage();const requested=fixtureURL(scenario);
    await run.page.goto(requested);
    await run.page.waitForURL(url=>url.pathname===target);
    const destination=new URL(run.page.url());assert.equal(destination.origin,origin);
    if(notice)assert.equal(destination.searchParams.get('notice'),notice);
    if(target==='/login.html')assert.equal(destination.searchParams.get('next'),requested);
    assert.deepEqual(calls.filter(call=>call.scenario===scenario).map(call=>call.path),expectedAPIs);
    assert.deepEqual(run.events.filter(event=>event.kind==='mounted'||event.kind==='gate'&&event.value==='allowed'),[]);
    assert.deepEqual(run.events.filter(event=>['storage-write','learning-event','learning-call'].includes(event.kind)),[]);
    await assertOnlyCompletionStorage(run.page,false);assert.deepEqual(run.errors,[]);
    await run.context.close();
    pass(`real guard ${scenario}: correct redirect, no permitted gate/rendering/completion/scored evidence`);
  }
  for(const role of ['teacher','admin']){
    const run=await newPage();await run.page.goto(fixtureURL(role));await run.page.waitForFunction(()=>fixture.ready);
    assert.equal(await run.page.evaluate(()=>fixture.controller?.mode),'document');
    assert.deepEqual(calls.filter(call=>call.scenario===role).map(call=>call.path),['/me']);
    await assertOnlyCompletionStorage(run.page,false);noScoredEvidence(run.events);assert.deepEqual(run.errors,[]);
    await run.context.close();pass(`existing ${role} full-course access policy preserved without student release API call`);
  }
  assert.deepEqual(blocked,[]);pass('every browser request stayed on this isolated local fixture origin');
  await writeFile(path.join(output,'guard-integration-results.json'),JSON.stringify({status:'PASS',scope:'Original portal + guard + renderer, local original sample, simulated institution API; no production requests or database authorization claims.',checks,apiCalls:calls,blockedRequests:blocked},null,2)+'\n');
} finally {
  if(browser)await browser.close();
}
