import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const arg=name=>{const i=process.argv.indexOf(name);return i<0?null:process.argv[i+1];};
assert.ok(arg('--repo')&&arg('--style-root')&&arg('--report-dir'),'Supply --repo, --style-root and a fresh --report-dir.');
const repo=path.resolve(arg('--repo')),styleRoot=path.resolve(arg('--style-root')),out=path.resolve(arg('--report-dir'));
await mkdir(out,{recursive:false});
const prefix='lessons/shared/investigations/',sha=raw=>createHash('sha256').update(raw).digest('hex');
const sources=new Map(),pins=new Map(),contexts=new Set(),sockets=new Set(),responseChecks=[];
const report={schema:'echs.ap-equivalence.native-view.v1',status:'RUNNING',scope:'Isolated native Chrome component fixture with exact candidate modules and retained stylesheet over owned loopback HTTP. No canonical lesson host, account, backend, mastery, assessment, publication or Linux claim.',checks:[],screenshots:[],requests:[],page_errors:[],console_errors:[],blocked_off_origin:0,cleanup:{contexts:false,browser:false,server:false,sockets:false},source_unchanged:false};
let browser,server,origin,stage='prepare';
const bounded=(promise,ms,label)=>{let timer;return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error(label)),ms);})]).finally(()=>clearTimeout(timer));};
const check=(name,data={})=>{report.checks.push({name,pass:true,...data});console.log('PASS '+name);};
const near=(actual,expected)=>assert.ok(Number.isFinite(actual)&&Math.abs(actual-expected)<1e-7*Math.max(1,Math.abs(expected)),`${actual} != ${expected}`);
const frame=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
async function select(page,family){await page.locator('#scene').selectOption(family);await page.waitForFunction(family=>document.body.dataset.family===family,family);await frame(page);}
async function setRange(page,key,value){const range=page.locator(`[data-equivalence-control="${key}"]`),bounds=await range.evaluate(node=>({min:Number(node.min),max:Number(node.max),step:Number(node.step)}));assert.ok(value>=bounds.min&&value<=bounds.max);const steps=(value-bounds.min)/bounds.step;assert.ok(Number.isInteger(steps));await range.focus();await range.press('Home');for(let i=0;i<steps;i++)await range.press('ArrowRight');assert.equal(Number(await range.inputValue()),value);await frame(page);assert.equal(await page.locator('[data-equivalence-error]').isVisible(),false);}
async function reset(page){await page.locator('[data-equivalence-reset]').focus();await page.locator('[data-equivalence-reset]').press('Enter');await frame(page);}
async function snapshot(page) {
  const result=await page.locator('.ei-equivalence-view').evaluate(section=>{
    const svg=section.querySelector('svg'),main=document.querySelector('main');
    return {family:document.body.dataset.family,text:section.innerText,controls:[...section.querySelectorAll('input')].map(input=>({key:input.dataset.equivalenceControl,value:Number(input.value),output:section.querySelector(`output[for="${input.id}"]`).value,label:document.getElementById(input.getAttribute('aria-labelledby')).textContent,height:input.getBoundingClientRect().height})),
      tables:[...section.querySelectorAll('[data-equivalence-table]')].map(wrapper=>({key:wrapper.dataset.equivalenceTable,caption:wrapper.querySelector('caption').textContent,headers:[...wrapper.querySelectorAll('thead th')].map(th=>th.getAttribute('scope')),rows:[...wrapper.querySelectorAll('tbody tr')].map(row=>[...row.children].map(cell=>cell.textContent)),tabindex:wrapper.getAttribute('tabindex'),role:wrapper.getAttribute('role')})),
      width:innerWidth,documentWidth:document.documentElement.scrollWidth,mainWidth:main.clientWidth,mainScrollWidth:main.scrollWidth,font:getComputedStyle(section).fontFamily,
      plot:svg?{ymin:Number(svg.dataset.ymin),ymax:Number(svg.dataset.ymax),width:svg.getBoundingClientRect().width,branches:[...svg.querySelectorAll('[data-equivalence-branch]')].map(node=>node.getAttribute('points').split(' ').map(pair=>pair.split(',').map(Number))),
        holes:[...svg.querySelectorAll('[data-equivalence-hole]')].map(node=>({x:Number(node.dataset.equivalenceHole),y:Number(node.dataset.holeY),cx:Number(node.getAttribute('cx')),cy:Number(node.getAttribute('cy')),fill:getComputedStyle(node).fill})),poles:[...svg.querySelectorAll('[data-equivalence-pole]')].map(node=>Number(node.dataset.equivalencePole))}:null};
  });
  assert.ok(result.documentWidth<=result.width+1);assert.ok(result.mainScrollWidth<=result.mainWidth+1,JSON.stringify(result));assert.match(result.font,/system-ui/);
  const input=Object.fromEntries(result.controls.map(row=>{assert.equal(row.output,String(row.value));assert.ok(row.label);assert.ok(row.height>=44);return[row.key,row.value];}));
  for(const table of result.tables){assert.ok(table.caption);assert.ok(table.headers.length>0&&table.headers.every(scope=>scope==='col'));assert.equal(table.role,'region');assert.equal(table.tabindex,'0');}
  if(result.family==='quotient-remainder') {
    assert.ok(result.plot&&result.plot.width>=599&&result.plot.branches.length>0);assert.deepEqual(result.plot.poles,input.r===0?[]:[input.c]);
    assert.deepEqual(result.plot.holes.map(({x,y})=>({x,y})),input.r===0?[{x:input.c,y:input.a*input.c+input.b}]:[]);
    for(const hole of result.plot.holes){assert.ok(hole.cx>=76&&hole.cx<=564&&hole.cy>=48&&hole.cy<=276);assert.equal(hole.fill,'rgb(255, 255, 255)');}
    for(const branch of result.plot.branches){const points=branch.map(([px,py])=>{assert.ok(px>=70-1e-8&&px<=570+1e-8&&py>=42-1e-8&&py<=282+1e-8);const x=-5+(px-70)/50,y=result.plot.ymin+(282-py)/240*(result.plot.ymax-result.plot.ymin);assert.notEqual(x,input.c);near(y,input.a*x+input.b+input.r/(x-input.c));return x;});assert.ok(!(points[0]<input.c&&points.at(-1)>input.c));}
    for(const row of result.tables.find(table=>table.key==='samples').rows){const x=Number(row[0]);assert.equal(Number(row[2]),input.a*x+input.b);if(x===input.c){assert.equal(row[1],'undefined');assert.equal(row[3],'undefined');}else{near(Number(row[1]),input.a*x+input.b+input.r/(x-input.c));near(Number(row[3]),input.r/(x-input.c));}}
  } else {
    assert.equal(result.plot,null);let coefficients=[1];
    for(let i=0;i<input.n;i++){const next=Array(coefficients.length+1).fill(0);coefficients.forEach((value,k)=>{next[k]+=value*input.a;next[k+1]+=value*input.b;});coefficients=next;}
    const rows=result.tables.find(table=>table.key==='terms').rows;assert.equal(rows.length,input.n+1);rows.forEach((row,i)=>assert.equal(Number(row[6]),coefficients[i]===0?0:coefficients[i]));
    for(const row of result.tables.find(table=>table.key==='binomial-values').rows){const x=Number(row[0]),expected=(input.a*x+input.b)**input.n;assert.equal(Number(row[1]),expected);assert.equal(Number(row[2]),expected);}
  }
  return result;
}
async function screenshot(page,name,target) {
  await target.scrollIntoViewIfNeeded();await frame(page);
  const file=path.join(out,name+'.png');await page.screenshot({path:file,timeout:10000});const raw=await readFile(file);
  report.screenshots.push({path:path.basename(file),bytes:raw.length,sha256:sha(raw)});
}
try {
  for(const name of ['equivalence-view.mjs','ap-equivalence-model.mjs','ap-equivalence-content.mjs','visuals.mjs','vase-model.mjs']){const file=path.join(repo,prefix+name),raw=await readFile(file);pins.set(file,raw);sources.set('/'+prefix+name,{raw,type:'text/javascript; charset=utf-8'});}
  const stylePath=path.join(styleRoot,prefix+'investigations.css'),style=await readFile(stylePath);pins.set(stylePath,style);sources.set('/'+prefix+'investigations.css',{raw:style,type:'text/css; charset=utf-8'});
  const self=fileURLToPath(import.meta.url);pins.set(self,await readFile(self));
  report.source_before=[...pins].map(([file,raw])=>({path:file,bytes:raw.length,sha256:sha(raw)}));
  const fixture=Buffer.from(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Isolated AP equivalence fixture</title><link rel="stylesheet" href="/${prefix}investigations.css"></head><body><dialog class="ei-dialog" open><div class="ei-shell"><header class="ei-header"><h1>Equivalent forms</h1><label>Explorer <select id="scene"></select></label></header><main class="ei-main" id="fixture"></main><footer class="ei-footer"><p>Isolated component fixture; no account or assessment connection</p></footer></div></dialog><script type="module" src="/fixture.mjs"></script></body></html>`);
  const script=Buffer.from(`import {AP_EQUIVALENCE_CONTENT as content} from '/${prefix}ap-equivalence-content.mjs';
import {mountEquivalence} from '/${prefix}equivalence-view.mjs';
const scenes=Object.values(content).flatMap(lesson=>lesson.scenes.filter(scene=>scene.model==='equivalence'));
if(scenes.length!==2)throw Error('fixture-scene-count');
const root=document.querySelector('#fixture'),select=document.querySelector('#scene');let handle;
for(const scene of scenes){const option=document.createElement('option');option.value=scene.family;option.textContent=scene.family;select.append(option);}
function show(){handle?.dispose();root.replaceChildren();const scene=scenes.find(scene=>scene.family===select.value),title=document.createElement('h2');title.textContent=scene.title;root.append(title);const card=document.createElement('div');card.className='ei-card';root.append(card);handle=mountEquivalence({root:card,window,scene});document.body.dataset.family=scene.family;}
select.addEventListener('change',show);show();window.fixtureReady=true;window.disposeFixture=()=>{select.removeEventListener('change',show);handle?.dispose();delete window.fixtureReady;};`);
  sources.set('/fixture.html',{raw:fixture,type:'text/html; charset=utf-8'});sources.set('/fixture.mjs',{raw:script,type:'text/javascript; charset=utf-8'});
  report.fixture=[...sources].filter(([name])=>name.startsWith('/fixture')).map(([name,{raw}])=>({path:name,bytes:raw.length,sha256:sha(raw)}));
  server=createServer((req,res)=>{const url=new URL(req.url,'http://127.0.0.1');if(req.method==='GET'&&url.pathname==='/favicon.ico'){res.writeHead(204);res.end();return;}const row=sources.get(url.pathname);if(req.method!=='GET'||url.search||!row){res.writeHead(404);res.end();return;}report.requests.push(url.pathname);res.writeHead(200,{'Content-Type':row.type,'Cache-Control':'no-store'});res.end(row.raw);});
  server.on('connection',socket=>{sockets.add(socket);socket.once('close',()=>sockets.delete(socket));});
  await bounded(new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);}),5000,'server-listen');origin=`http://127.0.0.1:${server.address().port}`;
  const require=createRequire(import.meta.url),pwPath=process.env.ECHS_PLAYWRIGHT_MODULE||'playwright',{chromium}=require(pwPath);report.playwright=require(path.join(pwPath,'package.json')).version;
  browser=await chromium.launch({headless:true,timeout:20000,executablePath:process.env.ECHS_CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage','--no-proxy-server']});report.browser=browser.version();
  for(const viewport of [{width:1365,height:900},{width:390,height:844}]) {
    const label=String(viewport.width);stage=label+' setup';
    const context=await browser.newContext({viewport,deviceScaleFactor:1,reducedMotion:'reduce',serviceWorkers:'block'});contexts.add(context);
    await context.route('**/*',route=>{if(new URL(route.request().url()).origin===origin)return route.continue();report.blocked_off_origin++;return route.abort();});
    const page=await context.newPage();page.setDefaultTimeout(10000);page.on('pageerror',error=>report.page_errors.push(error.message));page.on('console',message=>{if(message.type()==='error')report.console_errors.push(message.text());});
    page.on('response',response=>{const row=sources.get(new URL(response.url()).pathname);if(row){const check=response.body().then(raw=>assert.ok(raw.equals(row.raw),'Exact received source bytes'));check.catch(()=>{});responseChecks.push(check);}});
    await page.goto(origin+'/fixture.html',{waitUntil:'load',timeout:20000});await page.waitForFunction(()=>window.fixtureReady===true);
    for(const family of ['quotient-remainder','binomial']){stage=label+' '+family;await select(page,family);const initial=await snapshot(page);check(stage+' actual scene, algebra, labels and no outer overflow');
      await setRange(page,'a',4);await snapshot(page);await reset(page);assert.deepEqual(await snapshot(page),initial);check(stage+' native keyboard change and captured reset');
      if(viewport.width===390){const region=page.locator(family==='binomial'?'[data-equivalence-table="terms"]':'.ei-graph-scroll');await region.scrollIntoViewIfNeeded();await region.focus();await region.press('Home');await region.press('ArrowRight');await page.waitForFunction(selector=>document.querySelector(selector).scrollLeft>0,family==='binomial'?'[data-equivalence-table="terms"]':'.ei-graph-scroll');check(stage+' keyboard internal horizontal scroll');}
    }
    stage=label+' hole';await select(page,'quotient-remainder');await setRange(page,'r',0);const hole=await snapshot(page);assert.deepEqual(hole.plot.holes.map(({x,y})=>({x,y})),[{x:2,y:3}]);
    const circle=page.locator('[data-equivalence-hole]');await circle.scrollIntoViewIfNeeded();await frame(page);const visible=await circle.evaluate(node=>{const rect=node.getBoundingClientRect(),region=node.closest('.ei-graph-scroll').getBoundingClientRect(),main=document.querySelector('main').getBoundingClientRect();return rect.left>=Math.max(0,region.left,main.left)&&rect.right<=Math.min(innerWidth,region.right,main.right)&&rect.top>=Math.max(0,region.top,main.top)&&rect.bottom<=Math.min(innerHeight,region.bottom,main.bottom)&&document.elementFromPoint(rect.left+rect.width/2,rect.top+rect.height/2)===node;});assert.equal(visible,true);check(label+' zero-remainder hollow hole is visible and hit-testable');await screenshot(page,label+'-hole',circle);
    await setRange(page,'r',-.25);const pole=await snapshot(page);assert.deepEqual(pole.plot.poles,[2]);assert.deepEqual(pole.tables.find(table=>table.key==='exclusion').rows,[['2','pole','undefined','+∞','−∞']]);check(label+' nonzero negative remainder gives signed pole');
    stage=label+' binomial degeneracy';await select(page,'binomial');await setRange(page,'n',8);await setRange(page,'a',0);const constant=await snapshot(page);assert.match(constant.text,/Actual polynomial degree: 0/);await setRange(page,'b',0);const zero=await snapshot(page);assert.match(zero.text,/Actual polynomial degree: undefined \(zero polynomial\)/);check(label+' actual constant and zero degree with all nine binomial terms');
    await setRange(page,'a',.25);await setRange(page,'b',.25);const small=await snapshot(page);assert.equal(small.tables.find(table=>table.key==='terms').rows[0][6],'0.0000152587890625');const coefficient=page.locator('[data-equivalence-table="terms"] tbody tr').first().locator('td').last();await coefficient.scrollIntoViewIfNeeded();await screenshot(page,label+'-binomial-small-coefficient',coefficient);check(label+' exact nonzero quarter-power coefficient stays visible');
    await page.evaluate(()=>window.disposeFixture());assert.equal(await page.locator('.ei-equivalence-view').count(),0);check(label+' owned component disposal');
    await bounded(context.close(),10000,'context-close');contexts.delete(context);
  }
  await bounded(Promise.all(responseChecks),5000,'source-response-checks');assert.equal(report.page_errors.length,0);assert.equal(report.console_errors.length,0);assert.equal(report.blocked_off_origin,0);assert.deepEqual([...new Set(report.requests)].sort(),[...sources.keys()].sort());check('All eight received sources/fixtures are byte-exact with zero off-origin requests or browser errors');report.status='PASS';
} catch(error) {report.status='FAIL';report.failure={stage,name:error.name,message:error.message};process.exitCode=1;}
finally {
  const failed=error=>{(report.cleanup_errors??=[]).push(error.message);};
  for(const context of [...contexts])try{await bounded(context.close(),10000,'context-close');contexts.delete(context);}catch(error){failed(error);}report.cleanup.contexts=contexts.size===0;
  try{if(browser)await bounded(browser.close(),10000,'browser-close');report.cleanup.browser=true;}catch(error){failed(error);}
  try{if(server?.listening){const socketCloses=[...sockets].map(socket=>new Promise(resolve=>socket.once('close',resolve))),closed=new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()));server.closeAllConnections();for(const socket of sockets)socket.destroy();await bounded(Promise.all([closed,...socketCloses]),5000,'server-socket-close');}report.cleanup.server=!server?.listening;}catch(error){failed(error);}report.cleanup.sockets=sockets.size===0;
  try{report.source_after=[];for(const [file]of pins){const raw=await readFile(file);report.source_after.push({path:file,bytes:raw.length,sha256:sha(raw)});}report.source_unchanged=!!report.source_before&&JSON.stringify(report.source_before)===JSON.stringify(report.source_after);}catch(error){failed(error);}
  if(!report.source_unchanged||!Object.values(report.cleanup).every(Boolean)||report.cleanup_errors?.length){report.status='FAIL';process.exitCode=1;}
  await writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,checks:report.checks.length,failure:report.failure,cleanup:report.cleanup,source_unchanged:report.source_unchanged,output:out}));
}
