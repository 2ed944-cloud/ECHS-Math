import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';

const arg=name=>{const i=process.argv.indexOf(name);return i<0?null:process.argv[i+1];};
assert.ok(arg('--repo')&&arg('--style-root')&&arg('--report-dir'),'Supply exact candidate --repo, retained --style-root and fresh --report-dir.');
const repo=path.resolve(arg('--repo')),styleRoot=path.resolve(arg('--style-root')),out=path.resolve(arg('--report-dir'));
await mkdir(out,{recursive:false});
const require=createRequire(import.meta.url),pwPath=process.env.ECHS_PLAYWRIGHT_MODULE||'playwright', {chromium}=require(pwPath);
const sha=b=>createHash('sha256').update(b).digest('hex'),prefix='lessons/shared/investigations/';
const contentModule=await import(pathToFileURL(path.join(repo,prefix+'ap-rational-content.mjs')));
const {factorLedger,rationalAt}=await import(pathToFileURL(path.join(repo,prefix+'ap-rational-model.mjs')));
const content=contentModule.AP_RATIONAL_CONTENT,lessonKeys=Object.keys(content);
assert.equal(lessonKeys.length,4);
const sources=new Map(),pins=new Map();
for(const name of ['rational-view.mjs','ap-rational-model.mjs','ap-rational-content.mjs','visuals.mjs','vase-model.mjs']){
 const file=path.join(repo,prefix+name),raw=await readFile(file);sources.set('/'+prefix+name,{raw,type:'text/javascript; charset=utf-8'});pins.set(file,raw);
}
const stylePath=path.join(styleRoot,prefix+'investigations.css'),style=await readFile(stylePath);pins.set(stylePath,style);sources.set('/'+prefix+'investigations.css',{raw:style,type:'text/css; charset=utf-8'});
const selfPath=fileURLToPath(import.meta.url),self=await readFile(selfPath);pins.set(selfPath,self);
const fixture=Buffer.from(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Isolated rational view fixture</title><link rel="stylesheet" href="/${prefix}investigations.css"></head><body><dialog class="ei-dialog" open><div class="ei-shell"><header class="ei-header"><div><span class="ei-eyebrow">Isolated component fixture</span><h1>Rational functions</h1></div><label>Explorer <select id="scene"></select></label></header><main class="ei-main" id="fixture"></main><footer class="ei-footer"><p>No account, lesson host or assessment connection</p></footer></div></dialog><script type="module" src="/fixture.mjs"></script></body></html>`);
const script=Buffer.from(`import {AP_RATIONAL_CONTENT as content} from '/${prefix}ap-rational-content.mjs';
import {mountRational} from '/${prefix}rational-view.mjs';
const root=document.querySelector('#fixture'),select=document.querySelector('#scene');let handle;
for(const [key,lesson] of Object.entries(content)){const option=document.createElement('option');option.value=key;option.textContent=lesson.topic;select.append(option);}
function show(){handle?.dispose();root.replaceChildren();const scene=content[select.value].scenes.find(row=>row.model==='rational');const title=document.createElement('h2');title.textContent=scene.title;root.append(title);const intro=document.createElement('div');intro.className='ei-intro';for(const text of scene.text){const p=document.createElement('p');p.textContent=text;intro.append(p);}root.append(intro);const card=document.createElement('div');card.className='ei-card';root.append(card);handle=mountRational({root:card,window,scene});document.body.dataset.scene=select.value;}
select.addEventListener('change',show);show();window.fixtureReady=true;
window.disposeFixture=()=>{select.removeEventListener('change',show);handle?.dispose();delete window.fixtureReady;};`);
sources.set('/fixture.html',{raw:fixture,type:'text/html; charset=utf-8'});sources.set('/fixture.mjs',{raw:script,type:'text/javascript; charset=utf-8'});
const report={contract:'echs.ap-rational.native-view.v1',status:'RUNNING',scope:'Native Chrome isolated DOM/SVG view with exact candidate module/content and retained style over owned loopback HTTP. No active lesson host, auth, backend, mastery, assessment, publication or Linux claim.',
 source_before:[...pins].map(([file,raw])=>({path:file,bytes:raw.length,sha256:sha(raw)})),fixture:[...sources].filter(([p])=>p.startsWith('/fixture')).map(([p,{raw}])=>({path:p,bytes:raw.length,sha256:sha(raw)})),
 checks:[],screenshots:[],requests:[],blocked_off_origin:0,page_errors:[],console_errors:[],cleanup:{contexts:false,browser:false,server:false,sockets:false},source_unchanged:false};
const contexts=new Set(),sockets=new Set(),responseChecks=[];let browser,origin,stage='setup';
const server=createServer((req,res)=>{const u=new URL(req.url,'http://127.0.0.1');if(req.method==='GET'&&u.pathname==='/favicon.ico'){res.writeHead(204);res.end();return;}const row=sources.get(u.pathname);if(req.method!=='GET'||!row||u.search){res.writeHead(404);res.end();return;}report.requests.push(u.pathname);res.writeHead(200,{'Content-Type':row.type,'Cache-Control':'no-store'});res.end(row.raw);});
server.on('connection',socket=>{sockets.add(socket);socket.once('close',()=>sockets.delete(socket));});
const bounded=(task,ms,label)=>{let timer;return Promise.race([task,new Promise((_,j)=>{timer=setTimeout(()=>j(Error(label)),ms);})]).finally(()=>clearTimeout(timer));};
const check=(name,data={})=>{report.checks.push({name,pass:true,...data});console.log('PASS '+name);};
const frame=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
async function choose(page,key){await page.locator('#scene').selectOption(key);await page.waitForFunction(key=>document.body.dataset.scene===key,key);await frame(page);}
async function setRange(page,key,value){const range=page.locator(`[data-rational-control="${key}"]`),c=await range.evaluate(n=>({min:Number(n.min),max:Number(n.max),step:Number(n.step)}));assert.ok(value>=c.min&&value<=c.max);const steps=(value-c.min)/c.step;assert.ok(Number.isInteger(steps));await range.focus();await range.press('Home');for(let i=0;i<steps;i++)await range.press('ArrowRight');assert.equal(Number(await range.inputValue()),value);await frame(page);assert.equal(await page.locator('[data-rational-error]').isVisible(),false);}
async function reset(page){const button=page.locator('[data-rational-reset]');await button.focus();await button.press('Enter');await frame(page);}
async function snapshot(page,key){const result=await page.locator('.ei-rational-view').evaluate(section=>{const svg=section.querySelector('[data-rational-plot]');return{
 controls:[...section.querySelectorAll('[data-rational-control]')].map(n=>({key:n.dataset.rationalControl,value:Number(n.value),output:section.querySelector(`output[for="${n.id}"]`).value,label:document.getElementById(n.getAttribute('aria-labelledby')).textContent})),
 domain:section.querySelector('[data-rational-domain]').textContent,formula:section.querySelector('[data-rational-formula]').textContent,tails:section.querySelector('[data-rational-tails]').textContent,
 ymin:Number(svg.dataset.ymin),ymax:Number(svg.dataset.ymax),branches:[...svg.querySelectorAll('[data-rational-branch]')].map(n=>n.getAttribute('points').split(' ').map(pair=>pair.split(',').map(Number))),
 holes:[...svg.querySelectorAll('[data-rational-hole]')].map(n=>({x:Number(n.dataset.rationalHole),y:Number(n.dataset.holeY),cx:Number(n.getAttribute('cx')),cy:Number(n.getAttribute('cy')),fill:getComputedStyle(n).fill,stroke:getComputedStyle(n).stroke})),
 poles:[...svg.querySelectorAll('[data-rational-pole]')].map(n=>Number(n.dataset.rationalPole)),zeros:[...svg.querySelectorAll('[data-rational-zero]')].map(n=>Number(n.dataset.rationalZero)),
 samples:[...section.querySelectorAll('[data-rational-table="samples"] tbody tr')].map(n=>[...n.children].map(c=>c.textContent)),
 width:innerWidth,bodyWidth:document.documentElement.scrollWidth,mainWidth:document.querySelector('#fixture').clientWidth,mainScrollWidth:document.querySelector('#fixture').scrollWidth,
 tableCaptions:[...section.querySelectorAll('table caption')].map(n=>n.textContent),graphWidth:svg.getBoundingClientRect().width,scrollWidth:section.querySelector('.ei-graph-scroll').clientWidth,
 font:getComputedStyle(section).fontFamily
 };});
 const scene=content[key].scenes.find(s=>s.model==='rational'),v={...scene.initial};for(const c of result.controls){v[c.key]=c.value;assert.equal(c.output,String(c.value));assert.ok(c.label);}
 const input={scale:v.scale,numerator:[{root:v.numeratorRoot,multiplicity:v.numeratorMultiplicity},...(v.commonNumeratorMultiplicity?[{root:v.commonRoot,multiplicity:v.commonNumeratorMultiplicity}]:[])],denominator:[{root:v.denominatorRoot,multiplicity:v.denominatorMultiplicity},...(v.commonDenominatorMultiplicity?[{root:v.commonRoot,multiplicity:v.commonDenominatorMultiplicity}]:[])]};
 const state=factorLedger(input);assert.deepEqual(result.poles,state.exclusions.filter(r=>r.kind==='pole').map(r=>r.x));assert.deepEqual(result.holes.map(({x,y})=>({x,y})),state.exclusions.filter(r=>r.kind==='hole').map(r=>({x:r.x,y:r.y})));assert.deepEqual(result.zeros,state.zeros.map(r=>r.x));assert.equal(result.tableCaptions.length,5);assert.match(result.font,/system-ui/);
 assert.ok(result.bodyWidth<=result.width+1);assert.ok(result.mainScrollWidth<=result.mainWidth+1,JSON.stringify({main:result.mainWidth,scroll:result.mainScrollWidth}));assert.ok(result.graphWidth>=599);
 for(const h of result.holes){assert.ok(h.cx>=76&&h.cx<=564&&h.cy>=48&&h.cy<=276);assert.equal(h.fill,'rgb(255, 255, 255)');assert.equal(h.stroke,'rgb(138, 23, 56)');}
 for(const branch of result.branches){const decoded=branch.map(([px,py])=>{assert.ok(px>=70-1e-8&&px<=570+1e-8&&py>=42-1e-8&&py<=282+1e-8);const x=-5+(px-70)/500*10,y=result.ymin+(282-py)/240*(result.ymax-result.ymin),expected=rationalAt(input,x).y;assert.ok(expected!==null&&Math.abs(y-expected)<1e-7*Math.max(1,Math.abs(expected)));return x;});for(const excluded of state.exclusions)assert.ok(!(Math.min(...decoded)<excluded.x&&Math.max(...decoded)>excluded.x));}
 for(const excluded of state.exclusions)assert.ok(result.samples.some(row=>Number(row[0].replaceAll(',',''))===excluded.x&&row[1]==='undefined'));
 return result;
}
async function screenshot(page,name){const graph=page.locator('.ei-graph-scroll');await graph.scrollIntoViewIfNeeded();
 const features=page.locator('[data-rational-hole]');
 if(await features.count()){
  const target=features.first();await target.scrollIntoViewIfNeeded();await frame(page);
  const observed=await target.evaluate(n=>{const r=n.getBoundingClientRect(),region=n.closest('.ei-graph-scroll').getBoundingClientRect(),main=document.querySelector('#fixture').getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;return{cx:x,cy:y,width:r.width,height:r.height,region:{left:region.left,right:region.right,top:region.top,bottom:region.bottom},fullyVisible:r.left>=Math.max(0,region.left,main.left)&&r.right<=Math.min(innerWidth,region.right,main.right)&&r.top>=Math.max(0,region.top,main.top)&&r.bottom<=Math.min(innerHeight,region.bottom,main.bottom),hit:document.elementFromPoint(x,y)===n};});
  assert.ok(observed.fullyVisible&&observed.hit,JSON.stringify(observed));check(name+' native hollow feature visible in scroll viewport and hit-testable',{feature:observed});
 }
 await frame(page);for(const [suffix,fn]of [['',p=>page.screenshot({path:p,timeout:15000})],['-graph-window',p=>graph.screenshot({path:p,timeout:15000})]]){const file=path.join(out,name+suffix+'.png');await fn(file);const raw=await readFile(file);report.screenshots.push({path:path.basename(file),bytes:raw.length,sha256:sha(raw)});}}
try{
 await bounded(new Promise((r,j)=>{server.once('error',j);server.listen(0,'127.0.0.1',r);}),5000,'listen');origin=`http://127.0.0.1:${server.address().port}`;
 browser=await chromium.launch({headless:true,timeout:20000,executablePath:process.env.ECHS_CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage','--no-proxy-server']});report.browser=browser.version();report.playwright=require(path.join(pwPath,'package.json')).version;
 for(const viewport of [{width:1365,height:900},{width:390,height:844}]){
  const label=String(viewport.width),context=await browser.newContext({viewport,deviceScaleFactor:1,reducedMotion:'reduce',serviceWorkers:'block'});contexts.add(context);
  await context.route('**/*',route=>{if(new URL(route.request().url()).origin===origin)return route.continue();report.blocked_off_origin++;return route.abort();});
  const page=await context.newPage();page.setDefaultTimeout(10000);page.on('pageerror',e=>report.page_errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.console_errors.push(m.text());});
  page.on('response',response=>{const pathname=new URL(response.url()).pathname,row=sources.get(pathname);if(row)responseChecks.push(response.body().then(raw=>assert.ok(raw.equals(row.raw),'exact received '+pathname)));});
  stage=label+' setup';await page.goto(origin+'/fixture.html',{waitUntil:'load',timeout:20000});await page.waitForFunction(()=>window.fixtureReady===true);
  for(const key of lessonKeys){stage=label+' '+key;await choose(page,key);const before=await snapshot(page,key),scene=content[key].scenes.find(s=>s.model==='rational');assert.deepEqual(before.controls.map(c=>[c.key,c.value]),scene.controls.map(c=>[c.key,scene.initial[c.key]]));check(stage+' actual scene defaults, retained style, graph/ledger/domain and no page overflow');
   const first=scene.controls[0],value=scene.initial[first.key]===first.max?first.min:first.max;await setRange(page,first.key,value);await snapshot(page,key);await reset(page);const after=await snapshot(page,key);assert.deepEqual(after,before);check(stage+' native keyboard control and exact captured reset');
   if(viewport.width===390){const region=page.locator('.ei-graph-scroll');await region.scrollIntoViewIfNeeded();await region.focus();await region.press('Home');await region.press('ArrowRight');await page.waitForFunction(()=>document.querySelector('.ei-graph-scroll').scrollLeft>0);assert.equal(await region.getAttribute('tabindex'),'0');check(stage+' native keyboard horizontal graph scroll');}
   await screenshot(page,label+'-'+key+'-default');
  }
  stage=label+' hole movements';const key='ap-rational-holes';await choose(page,key);
  for(const [c,y]of [[1.75,-11],[2.25,13]]){await setRange(page,'commonRoot',c);const data=await snapshot(page,key);assert.deepEqual(data.holes.map(h=>[h.x,h.y]),[[c,y]]);assert.deepEqual(data.poles,[2]);await screenshot(page,label+'-hole-'+String(c).replace('.','_'));check(label+' native hole '+c+' has height '+y+' inside expanded window');}
  await setRange(page,'commonRoot',2);const collision=await snapshot(page,key);assert.equal(collision.holes.length,0);assert.deepEqual(collision.poles,[2]);check(label+' exact collision leaves pole with no finite hole');await reset(page);assert.equal((await snapshot(page,key)).holes[0].y,-2);
  await choose(page,'ap-rational-tails');await setRange(page,'scale',0);const zero=await snapshot(page,'ap-rational-tails');assert.deepEqual(zero.holes.map(h=>[h.x,h.y]),[[2,0]]);assert.deepEqual(zero.poles,[]);assert.deepEqual(zero.zeros,[]);assert.match(await page.locator('.ei-rational-view').innerText(),/zero polynomial has no degree/);check(label+' zero scale retains original-domain hole without invented degree');
  await page.evaluate(()=>window.disposeFixture());assert.equal(await page.locator('.ei-rational-view').count(),0);check(label+' explicit component disposal removes owned view');
  await bounded(context.close(),10000,'context-close');contexts.delete(context);
 }
 await bounded(Promise.all(responseChecks),5000,'response-byte-checks');assert.equal(report.page_errors.length,0);assert.equal(report.console_errors.length,0);assert.equal(report.blocked_off_origin,0);assert.deepEqual([...new Set(report.requests)].sort(),[...sources.keys()].sort());check('Exact eight served source/fixture responses and zero off-origin requests or console errors');report.status='PASS';
}catch(error){report.status='FAIL';report.failure={stage,name:error.name,message:error.message};process.exitCode=1;}
finally{
 const cleanupError=e=>{(report.cleanup_errors??=[]).push(e.message);};
 for(const context of [...contexts])try{await bounded(context.close(),10000,'context-close');contexts.delete(context);}catch(e){cleanupError(e);}
 report.cleanup.contexts=contexts.size===0;
 try{if(browser)await bounded(browser.close(),10000,'browser-close');report.cleanup.browser=true;}catch(e){cleanupError(e);}
 try{if(server.listening){const closed=new Promise((r,j)=>server.close(e=>e?j(e):r()));server.closeAllConnections();for(const socket of sockets)socket.destroy();await bounded(closed,5000,'server-close');}report.cleanup.server=!server.listening;}catch(e){cleanupError(e);}
 report.cleanup.sockets=sockets.size===0;
 report.source_unchanged=(await Promise.all([...pins].map(async([file,raw])=>(await readFile(file)).equals(raw)))).every(Boolean);
 if(!report.source_unchanged||!Object.values(report.cleanup).every(Boolean)||report.cleanup_errors?.length){report.status='FAIL';process.exitCode=1;}
 await writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,checks:report.checks.length,screenshots:report.screenshots.length,failure:report.failure,cleanup:report.cleanup,source_unchanged:report.source_unchanged,output:out}));
}
