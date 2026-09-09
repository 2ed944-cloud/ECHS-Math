/* C02 real-browser read-model acceptance. Actual application HTML/JS/CSS and
 * institution client bootstrap; every account/API response is synthetic.
 * No production credentials, requests, grading receipts or database writes. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {chromium} from '../question-bank/official/tools/node_modules/playwright/index.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.resolve(process.env.ECHS_MASTERY_BROWSER_OUTPUT||'artifacts/mastery-truthfulness/browser');
await fs.mkdir(output,{recursive:true});
const checks=[],errors=[],requests=[],unexpectedAPI=[],screenshots=[];
const layoutMetrics=[],caseFilter=process.env.ECHS_MASTERY_CASE_FILTER||'';
if(caseFilter&&process.env.CI)throw Error('Partial diagnostic browser runs are forbidden in CI');
const servedSources=new Map();
const sourceFiles=['question-bank/js/learning-system.js','question-bank/js/student-cloud.js','question-bank/js/parent-cloud.js','question-bank/js/teacher-cloud.js','question-bank/js/teacher-evidence-heatmap.js','question-bank/js/dashboard.js','question-bank/js/parent.js','question-bank/js/learning-home.js','js/portal.js','js/lesson-portal-overhaul.js','js/smart-learning-route.js','js/gamification-overlay.js'];
sourceFiles.push('index.html','preview.html','question-bank/student.html','question-bank/teacher.html','question-bank/parent.html','question-bank/dashboard.html','tools/fixtures/c02-prior-worker.js','sw.js','css/echs-design-system-v5-1.css','css/lesson-portal-overhaul.css');
const priorWorker=await fs.readFile(path.join(root,'tools/fixtures/c02-prior-worker.js'));
const priorWorkerSHA='c0be954dcfc94284ed4299985fa7ead8e6d97b29325f5c92b52b68af50ead30a';
assert.equal(createHash('sha256').update(priorWorker).digest('hex'),priorWorkerSHA,'Frozen C01 worker used only by the warm-cache fixture');
async function sourceRecords(){return Promise.all(sourceFiles.map(async file=>{const bytes=await fs.readFile(path.join(root,file));return{path:file,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};}));}
const sourceBefore=await sourceRecords();
let origin,browser,mode='high',currentCase='startup';
const org='00000000-0000-4000-8000-000000000002',studentId='00000000-0000-4000-8000-000000000003',classId='00000000-0000-4000-8000-000000000004';
const accounts={student:{id:studentId,organization_id:org,role:'student',status:'active',display_name:'Synthetic Learner',username:'synthetic-learner',grade:'12',organization_name:'Synthetic ECHS QA'},teacher:{id:'00000000-0000-4000-8000-000000000005',organization_id:org,role:'teacher',status:'active',display_name:'Synthetic Teacher',username:'synthetic-teacher',organization_name:'Synthetic ECHS QA'},parent:{id:'00000000-0000-4000-8000-000000000006',organization_id:org,role:'parent',status:'active',display_name:'Synthetic Family',username:'synthetic-family',organization_name:'Synthetic ECHS QA'}};
const classRow={id:classId,name:'Synthetic Calculus Class',course_key:'ap-calculus-ab',academic_year:'Synthetic QA'};
const raw={key:'ap-calculus::1::1.1',course:'ap-calculus',unit:'1',topic:'1.1',title:'Instantaneous change',score:97,accuracy:100,attempts:24,correct:24,recent:Array(12).fill(true),confidence:.94,independent_evidence:24,active_days:3,retention_evidence:8,transfer_evidence:24,level:'Mastered',verified_mastery:true,source:'server',payload:{level:'Mastered',verified:true},last_verified_at:'2026-01-01T00:00:00Z'};
function record(){return mode==='missing'?{title:raw.title,topic:'1.1',course:raw.course,unit:'1',score:null}:mode==='zero'?{...raw,score:0,accuracy:0}:raw;}
function studentData(){const r=record();return {ok:true,student:accounts.student,classes:[classRow],counters:{attempts:mode==='missing'?0:24,mastery:r.score,accuracy:r.accuracy,mastered_topics:9,total_topics:1,questions_today:4,streak:2,weekly_minutes:20,review_due:0,open_mistakes:0},mastery:[r],strengths:[r],priorities:[r],assignments:[],recent_sessions:[],verified_mastery:true};}
function classData(){const r=record();return {ok:true,class:classRow,summary:{students:2,active_this_week:1,average_mastery:r.score,average_accuracy:r.accuracy,need_support:0,mastered_topics:9},students:[{...accounts.student,mastery:r.score,accuracy:r.accuracy,attempts:r.attempts||0,open_mistakes:0,last_login_at:new Date().toISOString()},{id:'00000000-0000-4000-8000-000000000007',display_name:'Synthetic New Learner',username:'synthetic-new',mastery:null,accuracy:null,attempts:0,open_mistakes:0}],assignments:[],support_priorities:[]};}
function matrix(){return {ok:true,authoritative:true,class:classRow,students:[accounts.student],skills:[{skill_key:'limits',title:'Instantaneous change',lesson_ids:['1.1'],average_score:record().score}],matrix:[{...record(),account_id:studentId,skill_key:'limits'}],coverage:{percent:100}};}
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.woff2':'font/woff2'};
const legacyMarkup=async kind=>{
  const file=kind==='parent'?'parent.js':'learning-home.js',source=await fs.readFile(path.join(root,'question-bank/js',file),'utf8');
  const ids=[...new Set([...source.matchAll(/\$\("([\w-]+)"\)/g)].map(match=>match[1]))];
  const nodes=ids.map(id=>id==='importReport'?`<label>Import historical report <input type="file" id="${id}"></label>`:id==='printReport'||id==='useCurrent'?`<button id="${id}">${id==='useCurrent'?'Use current report':'Print report'}</button>`:`<section id="${id}"></section>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>C02 compatibility ${kind}</title><link rel="stylesheet" href="/question-bank/css/learning-system.css"><style>body{font:16px Arial;background:#faf8f7;color:#241c22;margin:20px}main{max-width:1000px;margin:auto}section{margin:12px 0}h1{color:#7b1e46}</style></head><body><main><h1>Historical ${kind==='parent'?'family report':'learning home'} compatibility</h1><p>Synthetic records; this is a test fixture for an existing classic consumer.</p>${nodes}</main><script src="/question-bank/js/learning-system.js"></script><script src="/question-bank/js/${file}"></script></body></html>`;
};
const server=http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,origin||'http://127.0.0.1');requests.push({case:currentCase,method:req.method,path:url.pathname});
    const send=(status,body,type='application/json')=>{res.writeHead(status,{'content-type':type,'cache-control':'no-store'});res.end(typeof body==='string'||Buffer.isBuffer(body)?body:JSON.stringify(body));};
    if(url.pathname==='/config/institution.json')return send(200,{enabled:true,api_base:origin+'/__c02/api',site_base:origin+'/',setup_enabled:false,session_storage:'session',institution_name:'Synthetic ECHS QA'});
    if(url.pathname==='/sw.js')return send(200,url.searchParams.get('echsEvidence')==='c02-v1'?await fs.readFile(path.join(root,'sw.js')):priorWorker,'text/javascript');
    if(url.pathname==='/__c02/cache-prime.html')return send(200,'<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Synthetic previous worker</title></head><body><main>Isolated cache fixture</main></body></html>','text/html');
    if(url.pathname.startsWith('/__c02/api/')){
      const actor=accounts[String(req.headers.authorization||'').replace('Bearer synthetic-','')];
      if(!actor){unexpectedAPI.push({case:currentCase,method:req.method,path:url.pathname,reason:'Missing or unknown synthetic token'});return send(401,{ok:false,error:{message:'Synthetic session required'}});}
      const route=url.pathname.slice('/__c02/api/'.length);
      if(route==='account-api/me')return send(200,{ok:true,account:actor});
      if(route==='account-api/accounts')return send(200,{ok:true,accounts:[accounts.student]});
      if(route==='institution-api/dashboard/student')return send(mode==='error'?503:200,mode==='error'?{ok:false,error:{message:'Synthetic unavailable'}}:studentData());
      if(route==='institution-api/classes')return send(200,{ok:true,classes:[classRow]});
      if(route===`institution-api/classes/${classId}/dashboard`)return send(200,classData());
      if(route===`institution-api/classes/${classId}/lesson-access`)return send(200,{ok:true,lessons:[]});
      if(route==='institution-api/children')return send(200,{ok:true,students:[accounts.student]});
      if(route==='institution-api/timetable')return send(200,{ok:true,entries:[]});
      if(route==='mastery-evidence/sync'){for await(const chunk of req){}return send(200,{ok:true,authoritative:true,synced_at:new Date().toISOString(),mastery:[record()]});}
      if(route===`mastery-evidence/classes/${classId}`)return send(mode==='error'?503:200,mode==='error'?{ok:false,error:{message:'Synthetic unavailable'}}:matrix());
      if(route==='practice-bank-api/inventory')return send(200,{ok:true,banks:[]});
      unexpectedAPI.push({case:currentCase,method:req.method,path:route});return send(400,{ok:false,error:{message:'Unexpected synthetic API request'}});
    }
    if(url.pathname==='/__c02/legacy-parent.html')return send(200,await legacyMarkup('parent'),'text/html');
    if(url.pathname==='/__c02/learning-home.html')return send(200,await legacyMarkup('home'),'text/html');
    const name=decodeURIComponent(url.pathname).replace(/^\/+/, '')||'index.html';
    if(/^(?:supabase|\.git|\.env|question-bank\/official\/(?:data|admin\/data|media))/.test(name))return send(404,'Not served by this fixture','text/plain');
    const file=path.resolve(root,name);if(!file.startsWith(root+path.sep))return send(404,'');
    const bytes=await fs.readFile(file),digest=createHash('sha256').update(bytes).digest('hex');
    if(servedSources.has(name)&&servedSources.get(name).sha256!==digest)errors.push({case:currentCase,message:'A source file changed during browser execution: '+name});
    servedSources.set(name,{path:name,bytes:bytes.length,sha256:digest});
    return send(200,bytes,types[path.extname(file)]||'application/octet-stream');
  }catch{res.writeHead(404,{'cache-control':'no-store'});res.end('Not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin=`http://127.0.0.1:${server.address().port}`;
async function test(name,run){if(caseFilter&&!name.includes(caseFilter))return;currentCase=name;try{await run();checks.push({name,status:'PASS'});console.log('PASS '+name);}catch(error){checks.push({name,status:'FAIL',error:String(error.message)});console.log('FAIL '+name+': '+error.message);}}
async function open(route,role='student',{missingHelper=false,mobile=false,workers=false}={}){
  const ctx=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},isMobile:mobile,reducedMotion:'reduce',serviceWorkers:workers?'allow':'block'});
  await ctx.route('**/*',async r=>{const url=new URL(r.request().url());if(url.origin===origin){
    if(missingHelper&&url.pathname==='/question-bank/js/learning-system.js')return r.fulfill({status:200,contentType:'text/javascript',body:(await fs.readFile(path.join(root,'question-bank/js/learning-system.js'),'utf8'))+'\n/* Synthetic old API surface: retain every original numeric/helper method, remove new certification projections. */\nwindow.ECHSLearning=Object.freeze({...window.ECHSLearning,projectLearningReport:undefined,projectMasteryRecord:undefined,projectPracticeAchievement:undefined});delete window.ECHSMasteryStatus;'});
    return r.continue();
  }if(url.hostname==='fonts.googleapis.com')return r.fulfill({status:200,contentType:'text/css',body:'/* Isolated deterministic system font fallback. */'});return r.abort();});
  await ctx.addInitScript(({actor,role,raw})=>{
    sessionStorage.setItem('echs_institution_token_v1','synthetic-'+role);sessionStorage.setItem('echs_institution_account_v1',JSON.stringify(actor));sessionStorage.setItem('echs_institution_expires_v1',new Date(Date.now()+3600000).toISOString());
    localStorage.setItem('echs_learning_events_v2',JSON.stringify(Array.from({length:24},(_,i)=>({id:'synthetic-'+i,questionId:'synthetic-'+i,correct:true,at:new Date().toISOString()}))));
    localStorage.setItem('echs_learning_mastery_v2',JSON.stringify({[raw.key]:raw}));localStorage.setItem('echs_learning_achievements_v2',JSON.stringify({'first-mastery':{id:'first-mastery',title:'Topic Master',description:'Master your first topic.',earnedAt:'2025-01-01'}}));
  },{actor:accounts[role],role,raw});
  const page=await ctx.newPage();page.setDefaultTimeout(15000);page.on('pageerror',error=>errors.push({case:currentCase,message:error.message}));
  await page.goto(origin+route,{waitUntil:'domcontentloaded'});return{ctx,page};
}
async function shot(page,name){
  const mobile=name.endsWith('-mobile'), expectedWidth=page.viewportSize().width;
  if(name==='lesson-portal-mobile'||name==='lesson-portal-desktop')await page.evaluate(()=>{window.scrollTo({top:0,behavior:'instant'});});
  const metrics={name,...await page.evaluate(expectedWidth=>{
    const hero=document.querySelector('.experienceHero'),content=hero?.querySelector('.experienceHeroContent');
    return {viewport:innerWidth,clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,heroWidth:content?.getBoundingClientRect().width??null,heroGrid:hero?getComputedStyle(hero).gridTemplateColumns:null,metricWidth:document.querySelector('.premiumMetric')?.getBoundingClientRect().width??null,metricGrid:document.querySelector('.premiumMetrics')?getComputedStyle(document.querySelector('.premiumMetrics')).gridTemplateColumns:null,stylesheets:[...document.styleSheets].map(s=>s.href),overflow:[...document.querySelectorAll('body *')].filter(n=>{const s=getComputedStyle(n),r=n.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&(r.width>expectedWidth+1||r.right>expectedWidth+1||r.left < -1)}).slice(0,45).map(n=>{const r=n.getBoundingClientRect(),s=getComputedStyle(n);return {tag:n.tagName,id:n.id,class:String(n.className),width:r.width,left:r.left,right:r.right,position:s.position,overflowX:s.overflowX,minWidth:s.minWidth,grid:s.gridTemplateColumns}})};
  },expectedWidth)};
  layoutMetrics.push(metrics);
  if(mobile){
    assert.equal(metrics.clientWidth,390,name+': the viewport is 390px');
    assert.ok(metrics.scrollWidth<=391,name+': no document-wide horizontal overflow');
    if(metrics.heroGrid){assert.ok(metrics.heroWidth>=280,name+': readable hero content');assert.equal(metrics.heroGrid.trim().split(/\s+/).length,1,name+': responsive single hero column');}
    if(metrics.metricGrid){assert.ok(metrics.metricWidth>=280,name+': readable metric card');assert.equal(metrics.metricGrid.trim().split(/\s+/).length,1,name+': existing single-column phone metric layout');}
  }else if(metrics.heroGrid){assert.equal(metrics.heroGrid.trim().split(/\s+/).length,2,name+': desktop two-column hero preserved');}

  await page.screenshot({path:path.join(output,name+'.png'),fullPage:true});screenshots.push(name+'.png');
  if(mobile){await page.screenshot({path:path.join(output,name+'-viewport.png')});screenshots.push(name+'-viewport.png');}
}
async function rawPreserved(page){assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem('echs_learning_mastery_v2'))[key].score,raw.key),97);assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem('echs_learning_mastery_v2'))[key].payload.verified,raw.key),true);}

try{
  browser=await chromium.launch({headless:true,executablePath:process.env.ECHS_CHROMIUM_PATH||undefined,args:['--no-proxy-server','--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1']});
  for(const mobile of [false,true]){
    const device=mobile?'mobile':'desktop';
    await test('Student cloud '+device+' shows provisional score and historical practice badges',async()=>{mode='high';const{ctx,page}=await open('/question-bank/student.html','student',{mobile});try{
      await page.waitForFunction(()=>document.getElementById('heroMastery')?.textContent==='97%');assert.equal(await page.locator('#masteredCount').textContent(),'0');assert.match(await page.locator('#journeySection p').textContent(),/recorded practice.*authenticated grading/);assert.match(await page.locator('#masteryTrend').textContent(),/practice/);assert.doesNotMatch(await page.locator('#masteryList').textContent(),/Mastered/);await page.locator('#echsMasteryGame').waitFor();assert.match(await page.locator('#echsMasteryGame').textContent(),/Historical topic practice milestone/);assert.match(await page.locator('#echsMasteryGame').textContent(),/468 XP/);assert.match(await page.locator('#echsMasteryGame').textContent(),/78 coins/);assert.doesNotMatch(await page.locator('#echsMasteryGame').textContent(),/skills mastered/);await rawPreserved(page);await shot(page,'student-'+device);
    }finally{await ctx.close();}});
    await test('Family cloud '+device+' rejects cached certified counts',async()=>{mode='high';const{ctx,page}=await open('/question-bank/parent.html','parent',{mobile});try{
      await page.waitForFunction(()=>document.getElementById('familyMastery')?.textContent==='97%');assert.equal(await page.locator('#parentMastered').textContent(),'0');assert.match(await page.locator('#familyMessage').textContent(),/provisional/);assert.doesNotMatch(await page.locator('#familyStrengths').textContent(),/Mastered/);assert.match(await page.locator('#familyNarrativeText').textContent(),/transfer is not verified/);assert.equal(await page.locator('#familyNarrativeTitle').textContent(),'Strong recorded practice');await shot(page,'family-'+device);
    }finally{await ctx.close();}});
    await test('Teacher cloud, actual heatmap and Smart Route '+device+' keep scores provisional',async()=>{mode='high';const{ctx,page}=await open('/question-bank/teacher.html','teacher',{mobile});try{
      await page.waitForFunction(()=>document.getElementById('studentRows')?.textContent.includes('Strong practice'));await page.waitForFunction(()=>document.getElementById('classHeatmap')?.textContent.includes('Provisional practice'));assert.doesNotMatch(await page.locator('#studentRows').textContent(),/Mastered/);assert.equal(await page.locator('#classHeatmap .mastered').count(),0);assert.equal(await page.locator('#classHeatmap .evidenceCell strong').textContent(),'97');await page.locator('#smartRoute-teacher .slrLane').first().waitFor();assert.deepEqual(await page.locator('#smartRoute-teacher .slrLaneCount').allTextContents(),['1','0','1']);await shot(page,'teacher-'+device);
    }finally{await ctx.close();}});
    await test('Local dashboard '+device+' keeps raw numeric practice and no new mastery award',async()=>{mode='high';const{ctx,page}=await open('/question-bank/dashboard.html','student',{mobile});try{
      await page.waitForFunction(()=>document.getElementById('masteryRows')?.textContent.includes('97%'));assert.equal(await page.locator('#heroMastery').textContent(),'0');assert.doesNotMatch(await page.locator('#masteryRows').textContent(),/Mastered/);assert.match(await page.locator('#achievementGrid').textContent(),/Historical topic practice milestone/);await rawPreserved(page);await page.evaluate(()=>document.documentElement.dataset.theme='light');await page.waitForFunction(()=>getComputedStyle(document.querySelector('.studioHeroContent>p')).color==='rgb(93, 113, 132)');await page.evaluate(()=>document.documentElement.dataset.theme='dark');await page.waitForFunction(()=>getComputedStyle(document.querySelector('.studioHeroContent>p')).color==='rgb(183, 198, 209)');await page.evaluate(()=>document.documentElement.dataset.theme='light');await page.waitForFunction(()=>getComputedStyle(document.querySelector('.studioHeroContent>p')).color==='rgb(93, 113, 132)');await shot(page,'local-dashboard-'+device);
    }finally{await ctx.close();}});
    await test('Portal and details drawer '+device+' separate lesson completion from practice',async()=>{mode='high';const{ctx,page}=await open('/index.html?course=ap-calculus-ab','teacher',{mobile});try{
      await page.locator('#units .lessonCardOpen').first().waitFor();const card=page.locator('#units .lesson[data-number="1.1"]').first();assert.match(await card.locator('.lessonCardStatus').textContent(),/Practice recorded/);assert.equal(await page.locator('#statQuestions').textContent(),'0');await card.locator('.lessonCardOpen').click();await page.locator('#lessonDetailDialog[open]').waitFor();assert.doesNotMatch(await page.locator('#lessonDrawerStatus').textContent(),/Mastered/);await shot(page,'lesson-drawer-'+device);await page.keyboard.press('Escape');await page.locator('#lessonDetailDialog[open]').waitFor({state:'hidden'});await shot(page,'lesson-portal-'+device);
    }finally{await ctx.close();}});
  }
  await test('Student missing and actual zero evidence recover without changing recorded raw scores',async()=>{mode='high';const{ctx,page}=await open('/question-bank/student.html');try{
    await page.waitForFunction(()=>document.getElementById('heroMastery')?.textContent==='97%');mode='missing';await page.locator('#syncNow').click();await page.waitForFunction(()=>document.getElementById('heroMastery')?.textContent==='—');assert.match(await page.locator('#masteryList').textContent(),/Insufficient/);mode='zero';await page.locator('#syncNow').click();await page.waitForFunction(()=>document.getElementById('heroMastery')?.textContent==='0%');assert.match(await page.locator('#masteryTrend').textContent(),/Starting practice/);await rawPreserved(page);
  }finally{await ctx.close();}});
  await test('Heatmap failure clears current high score and later success recovers provisionally',async()=>{mode='high';const{ctx,page}=await open('/question-bank/teacher.html','teacher');try{
    await page.waitForFunction(()=>document.getElementById('classHeatmap')?.textContent.includes('Provisional practice'));mode='error';await page.locator('#classSelector').dispatchEvent('change');await page.waitForFunction(()=>document.getElementById('classHeatmap')?.textContent.includes('Synthetic unavailable'));assert.equal(await page.locator('#classHeatmap .evidenceCell').count(),0);mode='high';await page.locator('#classSelector').dispatchEvent('change');await page.waitForFunction(()=>document.getElementById('classHeatmap')?.textContent.includes('Provisional practice'));
  }finally{await ctx.close();}});
  await test('Mixed cached learning engine fails closed on each active classic screen',async()=>{mode='high';for(const [route,role]of [['student.html','student'],['parent.html','parent'],['teacher.html','teacher'],['dashboard.html','student']]){const{ctx,page}=await open('/question-bank/'+route,role,{missingHelper:true});try{await page.locator('[data-mastery-status-unavailable]').first().waitFor();assert.match(await page.locator('main').first().textContent(),/unavailable in this cached version/);assert.equal(await page.locator('.masteryBadge.mastered').count(),0);}finally{await ctx.close();}}});
  for(const kind of ['legacy-parent','learning-home'])await test('Existing '+kind+' compatibility consumer renders truthful historical/local state',async()=>{const{ctx,page}=await open('/__c02/'+kind+'.html');try{
    await page.waitForFunction(()=>document.body.textContent.includes('Synthetic')||document.body.textContent.includes('Student'));if(kind==='legacy-parent'){await page.waitForFunction(()=>document.getElementById('strengthList')?.textContent.includes('practice'));assert.equal(await page.locator('#heroMastered').textContent(),'0');assert.match(await page.locator('#parentAchievements').textContent(),/Historical/);}else{await page.waitForFunction(()=>document.getElementById('homeWelcome')?.textContent.includes('learning plan'));assert.equal(await page.locator('#homeMastered').textContent(),'0');}await shot(page,kind+'-compatibility');
  }finally{await ctx.close();}});
  await test('Actual preview entry omits the helper and keeps practice certification unavailable',async()=>{const{ctx,page}=await open('/preview.html','teacher');try{
    await page.locator('#units .lessonCardOpen').first().waitFor();assert.equal(await page.evaluate(()=>Boolean(window.ECHSMasteryStatus)),false);assert.equal(await page.locator('#statQuestions').count(),0,'Preview has no certified counter slot');assert.equal(await page.locator('#units .mastered').count(),0);assert.doesNotMatch(await page.locator('#units').textContent(),/Skill mastered|Practice recorded/);await page.locator('#units .lessonCardOpen').first().click();await page.locator('#lessonDetailDialog[open]').waitFor();assert.doesNotMatch(await page.locator('#lessonDrawerStatus').textContent(),/Mastered/);
  }finally{await ctx.close();}});
  await test('Fresh entry query keys bypass a proven stale prior-worker script cache on first online visit',async()=>{mode='high';const{ctx,page}=await open('/__c02/cache-prime.html','student',{workers:true});try{
    await page.evaluate(async()=>{await navigator.serviceWorker.register('/sw.js');await navigator.serviceWorker.ready;});
    await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
    const legacy='/question-bank/js/learning-system.js?v=20260726-phase2';
    const prime=()=>page.evaluate(async legacy=>{const cache=await caches.open('synthetic-prior-script-cache');await cache.put(legacy,new Response('window.__c02OldScriptExecuted=true;', {headers:{'content-type':'text/javascript'}}));await cache.put('/question-bank/js/dashboard.js?v=20260726-phase2',new Response('window.__c02OldDashboardExecuted=true;', {headers:{'content-type':'text/javascript'}}));},legacy);
    await prime();await page.evaluate(legacy=>new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=legacy;script.onload=resolve;script.onerror=()=>reject(Error('Old worker probe did not execute'));document.head.append(script);}),legacy);
    assert.equal(await page.evaluate(()=>window.__c02OldScriptExecuted),true,'The prior worker demonstrably serves the historical script key');
    await prime();await page.goto(origin+'/question-bank/dashboard.html',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.getElementById('masteryRows')?.textContent.includes('97%'));assert.equal(await page.locator('#heroMastery').textContent(),'0');assert.equal(await page.evaluate(()=>Boolean(window.__c02OldScriptExecuted||window.__c02OldDashboardExecuted)),false);assert.match(await page.locator('main').textContent(),/They are provisional; verified mastery requires authenticated grading/);await rawPreserved(page);
  }finally{await ctx.close();}});
  await test('Updated worker purges old reporting HTML and never uses a cross-release offline label',async()=>{mode='high';const{ctx,page}=await open('/__c02/cache-prime.html','student',{workers:true});try{
    const stalePaths=['/question-bank/student.html','/question-bank/teacher.html','/question-bank/parent.html','/question-bank/dashboard.html','/index.html','/preview.html','/question-bank/js/learning-system.js','/question-bank/js/dashboard.js','/js/portal.js'];
    await page.evaluate(async paths=>{const old=await caches.open('synthetic-unknown-pre-C02');for(const path of paths)await old.put(path,new Response('OLD MASTERED CANARY',{headers:{'content-type':path.endsWith('.html')?'text/html':'text/javascript'}}));await old.put('/unrelated-public.txt',new Response('KEEP'));},stalePaths);
    await page.evaluate(async()=>{await navigator.serviceWorker.register('/sw.js?echsEvidence=c02-v1');await navigator.serviceWorker.ready;});await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
    const remaining=await page.evaluate(async()=>[...(await(await caches.open('synthetic-unknown-pre-C02')).keys())].map(r=>new URL(r.url).pathname));assert.deepEqual(remaining,['/unrelated-public.txt']);
    // Explicit successful online reads populate current runtime, then offline probes
    // must use that release even if a separate old cache is reintroduced afterwards.
    const currentPaths=['/question-bank/student.html','/question-bank/dashboard.html','/index.html','/question-bank/js/learning-system.js','/question-bank/js/dashboard.js'];
    for(const path of currentPaths)assert.equal(await page.evaluate(async path=>(await fetch(path)).status,path),200);
    await page.evaluate(async paths=>{const old=await caches.open('synthetic-late-old-cache');for(const path of paths)await old.put(path,new Response('OLD MASTERED CANARY',{headers:{'content-type':path.endsWith('.html')?'text/html':'text/javascript'}}));},currentPaths);
    await ctx.setOffline(true);
    const offline=await page.evaluate(async paths=>Promise.all(paths.map(async path=>{try{const r=await fetch(path);return{path,status:r.status,text:await r.text()}}catch{return{path,status:0,text:''}}})),currentPaths);
    for(const result of offline){assert.equal(result.status,200,result.path+': current public shell remains offline');assert.doesNotMatch(result.text,/OLD MASTERED CANARY/);}
    assert.match(offline.find(x=>x.path==='/question-bank/student.html').text,/recorded practice.*authenticated grading/s);assert.match(offline.find(x=>x.path==='/question-bank/dashboard.html').text,/They are provisional; verified mastery requires authenticated grading/);
    await ctx.setOffline(false);
  }finally{await ctx.close();}});
}finally{
  await browser?.close();await new Promise(resolve=>server.close(resolve));
  const source=await sourceRecords();if(JSON.stringify(source)!==JSON.stringify(sourceBefore))errors.push({case:'source integrity',message:'An owned source changed during browser execution'});
  const report={contract:'echs.mastery-browser.v1',diagnostic_filter:caseFilter||null,complete_run:!caseFilter,head_sha:process.env.GITHUB_SHA||null,run_id:process.env.GITHUB_RUN_ID||null,status:checks.some(row=>row.status==='FAIL')||errors.length||unexpectedAPI.length?'FAIL':caseFilter?'DIAGNOSTIC_PASS':'PASS',cases:checks.length,passed:checks.filter(row=>row.status==='PASS').length,failed:checks.filter(row=>row.status==='FAIL').length,checks,pageErrors:errors,unexpectedAPI,source,source_unchanged:JSON.stringify(source)===JSON.stringify(sourceBefore),served_sources:[...servedSources.values()].sort((a,b)=>a.path.localeCompare(b.path)),screenshots,productionCalls:0,externalRequestsBlocked:true,prior_worker_sha256:priorWorkerSHA,scope:'Actual current consumer pages/client/helper closure with synthetic account API. Two compatibility consumers use explicitly labeled test markup. The missing-helper case removes the new projection exports while retaining the actual legacy helper surface. Warm-cache proof uses a pinned prior C01 worker in isolated Chrome, with external DNS blocked. No production tenant or authenticated grading acceptance. Separate real-browser cases run the byte-pinned prior worker and the actual C02 worker; the latter proves old HTML/asset purge and current-release offline fallback. Already executing older tabs still need reload.'};
  await fs.writeFile(path.join(output,'results.json'),JSON.stringify(report,null,2)+'\n');await fs.writeFile(path.join(output,'request-metadata.json'),JSON.stringify(requests,null,2)+'\n');
  await fs.writeFile(path.join(output,'layout-metrics.json'),JSON.stringify({diagnostic_filter:caseFilter||null,source,metrics:layoutMetrics},null,2)+'\n');
  console.log(JSON.stringify({cases:report.cases,passed:report.passed,failed:report.failed,pageErrors:errors.length,unexpectedAPI:unexpectedAPI.length}));if(report.failed||errors.length||unexpectedAPI.length)process.exitCode=1;
}
