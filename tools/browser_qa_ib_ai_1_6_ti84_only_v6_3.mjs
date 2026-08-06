import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const base=process.env.ECHS_PREVIEW_URL||'http://127.0.0.1:4173';
const out=process.env.ECHS_PREVIEW_OUTPUT||'artifacts/ib-ai-1-6-ti84-only-v6-3';
const url=`${base}/lessons/ib-math-ai/unit-1/lessons/IB_AI_SL_1.6_technology_equations_ECHS.html#learn`;
const key='echs:ib-ai:u1:1.6:learn-index';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--font-render-hinting=none']});
const report={url,checks:[],errors:[],screenshots:[]};
const check=(name,pass,details='')=>{report.checks.push({name,pass,details});if(!pass)report.errors.push(`${name}: ${details}`);};
const rectOverlap=(a,b)=>a&&b&&a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1;

async function context(viewport={width:1920,height:1080}){
  const ctx=await browser.newContext({viewport,deviceScaleFactor:1,reducedMotion:'reduce',serviceWorkers:'block'});
  await ctx.route('https://ti84calc.com/ti84calc',route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><html><body style="margin:0;display:grid;place-items:center;height:100vh;background:#f4f4f4;font-family:sans-serif"><div data-qa-ti84 style="width:520px;height:760px;border-radius:28px;background:#111;color:white;display:grid;place-items:center;font-size:34px">TI-84 QA SIMULATOR</div></body></html>'}));
  return ctx;
}
async function openTitle(page,title){
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>document.body.dataset.rendered==='1'&&window.LESSON_DATA?.slides?.length===73,null,{timeout:30000});
  const index=await page.evaluate(wanted=>window.LESSON_DATA.slides.findIndex(slide=>slide.title===wanted),title);
  if(index<0)throw new Error(`Slide not found: ${title}`);
  await page.evaluate(({key,index})=>localStorage.setItem(key,String(index)),{key,index});
  await page.reload({waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(expected=>document.body.dataset.rendered==='1'&&document.getElementById('progress-label')?.textContent?.trim().startsWith(`${expected} /`),index+1,{timeout:30000});
  await page.waitForTimeout(250);
  return index;
}
async function common(page){return page.evaluate(()=>({bodyOverflow:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-innerWidth,stageOverflow:(document.querySelector('.stage')?.scrollWidth||0)-(document.querySelector('.stage')?.clientWidth||0),rawMath:((document.querySelector('#app')?.innerText||'').match(/\\\(|\\\[|\\\)|\\\]/g)||[]).length,mathErrors:document.querySelectorAll('[data-math-error="true"],.katex-error,.katex .merror').length,gdcElements:document.querySelectorAll('#echs-gdc-launch,.echs-gdc-dialog,.gdc-route-resource,.gdc-callout,[data-gdc-launch]').length}));}
try{
  const ctx=await context();const page=await ctx.newPage();const consoleErrors=[];page.on('pageerror',e=>consoleErrors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/favicon|404/i.test(m.text()))consoleErrors.push(m.text());});

  await openTitle(page,'Three equations as three planes');
  let state=await common(page);
  const planes=await page.evaluate(()=>{const box=n=>{const r=n.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};return{figure:!!document.querySelector('.te63-planes-figure'),planes:document.querySelectorAll('.te63-planes-figure polygon.plane').length,point:!!document.querySelector('.te63-common-point'),text:document.querySelector('.slide-body')?.innerText||'',equations:[...document.querySelectorAll('.te63-planes-equations>div')].map(box),figureBox:box(document.querySelector('.te63-planes-figure'))};});
  check('ECHS GDC is absent from Lesson 1.6',state.gdcElements===0,JSON.stringify(state));
  check('three-plane visual contains three planes and one common point',planes.figure&&planes.planes===3&&planes.point,JSON.stringify(planes));
  check('three-plane equations remain compact inside their own column',planes.equations.length===3&&planes.equations.every(e=>e.height<65&&e.right<=planes.figureBox.left-10),JSON.stringify(planes));
  check('three-plane explanation includes non-unique alternatives',/line|infinitely|no common point/i.test(planes.text),planes.text);
  const shot1=path.join(out,'01-three-planes-accurate.png');await page.screenshot({path:shot1});report.screenshots.push(shot1);

  await openTitle(page,'Root, zero and x-intercept are the same condition');
  const eq=await page.evaluate(()=>({cards:[...document.querySelectorAll('.te63-equivalence article')].map(n=>{const r=n.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};}),math:[...document.querySelectorAll('.te63-equivalence-math')].map(n=>{const r=n.getBoundingClientRect();return{width:r.width,height:r.height};})}));
  check('root equivalence has three horizontal cards',eq.cards.length===3&&eq.cards.every(card=>card.width>250&&card.height<280),JSON.stringify(eq));
  check('root equivalence mathematics has horizontal geometry',eq.math.length===3&&eq.math.every(box=>box.width>75&&box.height<80),JSON.stringify(eq.math));
  check('root equivalence cards do not overlap',eq.cards.every((a,i)=>eq.cards.slice(i+1).every(b=>!rectOverlap(a,b))),JSON.stringify(eq.cards));
  const shot2=path.join(out,'02-root-zero-intercept-accurate.png');await page.screenshot({path:shot2});report.screenshots.push(shot2);

  await openTitle(page,'Multiplicity changes how a graph meets the axis');
  const mult=await page.evaluate(()=>({cards:document.querySelectorAll('.te63-multiplicity-grid article').length,roots:document.querySelectorAll('.te63-multiplicity-grid circle.root').length,text:document.querySelector('.slide-body')?.innerText||''}));
  check('multiplicity visual plots m=1, m=2 and m=3 separately',mult.cards===3&&mult.roots===3&&/Multiplicity 1/.test(mult.text)&&/Multiplicity 2/.test(mult.text)&&/Multiplicity 3/.test(mult.text),JSON.stringify(mult));
  check('multiplicity wording distinguishes touch from cross',/touches the x-axis and turns/.test(mult.text)&&/flattens at the root and crosses/.test(mult.text),mult.text);
  const shot3=path.join(out,'03-multiplicity-accurate.png');await page.screenshot({path:shot3});report.screenshots.push(shot3);

  await openTitle(page,'Intersections solve an equation in two equivalent ways');
  const inter=await page.evaluate(()=>{const pointBoxes=[...document.querySelectorAll('[data-exact-point]')].map(n=>{const r=n.getBoundingClientRect();return{id:n.dataset.exactPoint,width:r.width,height:r.height,left:r.left,right:r.right,top:r.top,bottom:r.bottom};});return{dots:document.querySelectorAll('.te63-intersection-figure .intersection-dot').length,pointBoxes,legend:[...document.querySelectorAll('.te63-function-legend span')].map(n=>n.textContent.trim()),pair:document.querySelector('.te63-equation-pair')?.getBoundingClientRect().toJSON(),copy:document.querySelector('.te63-intersection-copy')?.getBoundingClientRect().toJSON(),figure:!!document.querySelector('.te63-intersection-figure')};});
  check('intersection diagram has two accurate point cards and graph markers',inter.figure&&inter.dots===2&&inter.pointBoxes.length===2&&inter.pointBoxes.map(p=>p.id).join(',')==='P1,P2'&&inter.pointBoxes.every(p=>p.width>220&&p.height<70),JSON.stringify(inter));
  check('intersection function legend is clear and horizontal',inter.legend.length===2&&inter.legend[0]==='y = 2x + 1'&&inter.legend[1]==='y = x² − 3',JSON.stringify(inter.legend));
  check('intersection equivalence fits inside its card',inter.pair&&inter.copy&&inter.pair.right<=inter.copy.right-12&&inter.pair.left>=inter.copy.left+12,JSON.stringify(inter));
  const shot4=path.join(out,'04-intersections-accurate.png');await page.screenshot({path:shot4});report.screenshots.push(shot4);

  await openTitle(page,'Context can reject mathematically valid roots');
  const domain=await page.evaluate(()=>({values:[...document.querySelectorAll('.te63-root-pair b,.te63-accepted-root')].map(n=>{const r=n.getBoundingClientRect();return{text:n.innerText,width:r.width,height:r.height};}),text:document.querySelector('.slide-body')?.innerText||''}));
  check('domain slide shows both recomputed roots horizontally',domain.text.includes('−0.0815')&&domain.text.includes('3.7550')&&domain.values.every(v=>v.width>110&&v.height<75),JSON.stringify(domain));
  check('domain slide explicitly rejects the negative time',/reject.*t.*<.*0/i.test(domain.text.replace(/\s+/g,' ')),domain.text);
  const shot5=path.join(out,'05-domain-roots-accurate.png');await page.screenshot({path:shot5});report.screenshots.push(shot5);

  await openTitle(page,'Worked example · exact intersections');
  const official=await page.evaluate(()=>{const w=window.ECHS_TI84_CLASSROOM_WORKFLOWS;const pack=id=>({keys:w[id].tiSteps.flatMap(s=>s.keys).join(' '),labels:w[id].tiSteps.map(s=>s.label).join(' | '),details:w[id].tiSteps.map(s=>s.detail).join(' | ')});return{zero:pack('cubic-roots'),intersect:pack('exact-intersections'),rref:pack('system-2x2'),audit:window.LESSON_DATA.ti84Classroom?.officialPathAudit};});
  check('official Zero route is installed',official.zero.keys.includes('2nd')&&official.zero.keys.includes('TRACE (CALC)')&&official.zero.keys.includes('2:zero')&&official.zero.labels.includes('Left Bound')&&official.zero.labels.includes('Right Bound')&&official.zero.labels.includes('Guess'),JSON.stringify(official.zero));
  check('official Intersect route is installed',official.intersect.keys.includes('2nd')&&official.intersect.keys.includes('TRACE (CALC)')&&official.intersect.keys.includes('5:intersect')&&official.intersect.labels.includes('First curve')&&official.intersect.labels.includes('Second curve')&&official.intersect.labels.includes('Guess'),JSON.stringify(official.intersect));
  check('official matrix rref route is installed',official.rref.keys.includes('x⁻¹ (MATRIX)')&&official.rref.keys.includes('→ (MATH)')&&official.rref.keys.includes('rref(')&&official.rref.details.includes('last column'),JSON.stringify(official.rref));
  check('official TI audit metadata is active',official.audit==='6.3.0',JSON.stringify(official));

  await page.waitForSelector('.ti84-inline-launch');await page.click('.ti84-inline-launch');await page.waitForSelector('.ti84-inline-dock.open');await page.frameLocator('.ti84-inline-dock iframe').locator('[data-qa-ti84]').waitFor({timeout:15000});
  const dock=await page.evaluate(()=>{const app=document.querySelector('.app-shell').getBoundingClientRect(),panel=document.querySelector('.ti84-inline-dock').getBoundingClientRect(),title=document.querySelector('.slide-title')?.getBoundingClientRect();return{bodyClass:document.body.classList.contains('ti84-inline-open'),appRight:app.right,panelLeft:panel.left,gap:panel.left-app.right,panelWidth:panel.width,titleVisible:!!title&&title.width>300&&title.top>=app.top,iframeSrc:document.querySelector('.ti84-inline-dock iframe')?.src,sandbox:document.querySelector('.ti84-inline-dock iframe')?.getAttribute('sandbox'),oldModal:document.querySelectorAll('.gdc-external-tools').length};});
  check('TI-84 simulator opens beside rather than over the slide',dock.bodyClass&&dock.gap>=-2&&dock.gap<=12&&dock.titleVisible,JSON.stringify(dock));
  check('inline simulator is lazy, sandboxed and uses requested provider',dock.iframeSrc.includes('ti84calc.com/ti84calc')&&dock.sandbox.includes('allow-scripts')&&dock.oldModal===0,JSON.stringify(dock));
  state=await common(page);check('slide and dock have no horizontal page overflow',state.bodyOverflow<=2&&state.stageOverflow<=2,JSON.stringify(state));
  const shot6=path.join(out,'06-slide-with-ti84-beside.png');await page.screenshot({path:shot6});report.screenshots.push(shot6);
  check('no browser console errors',consoleErrors.length===0,consoleErrors.join('\n'));await ctx.close();

  const mobileCtx=await context({width:390,height:844});const mobile=await mobileCtx.newPage();await openTitle(mobile,'Worked example · exact intersections');await mobile.click('.ti84-inline-launch');await mobile.waitForSelector('.ti84-inline-dock.open');const mobileState=await common(mobile);check('mobile simulator fallback has no horizontal overflow',mobileState.bodyOverflow<=2,JSON.stringify(mobileState));const shot7=path.join(out,'07-mobile-ti84-dock.png');await mobile.screenshot({path:shot7});report.screenshots.push(shot7);await mobileCtx.close();
}finally{await browser.close();}
await writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({checks:report.checks.length,errors:report.errors.length,screenshots:report.screenshots.length},null,2));if(report.errors.length){for(const error of report.errors)console.error(`ERROR: ${error}`);process.exit(1);}
