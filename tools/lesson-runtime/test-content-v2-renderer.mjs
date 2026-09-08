import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';

const repository=fileURLToPath(new URL('../../',import.meta.url));
const require=createRequire(new URL('../../question-bank/official/tools/package.json',import.meta.url));
const {chromium}=require('playwright');
const output=path.join(repository,'artifacts/lesson-content-v2');await mkdir(output,{recursive:true});
const types={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.json':'application/json','.css':'text/css','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf'};
const server=createServer(async(request,response)=>{
  try{const file=path.resolve(repository,'.'+decodeURIComponent(new URL(request.url,'http://localhost').pathname));
    if(!file.startsWith(path.resolve(repository)+path.sep)){response.writeHead(403).end();return;}
    response.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');response.end(await readFile(file));
  }catch{response.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true,executablePath:process.env.ECHS_CHROMIUM_PATH||undefined});
const context=await browser.newContext({viewport:{width:1280,height:900}});
const external=[];await context.route('**/*',route=>{if(new URL(route.request().url()).hostname==='127.0.0.1')return route.continue();external.push(route.request().url());return route.abort();});
const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
const checks=[],pass=label=>{checks.push(label);console.log('PASS '+label);};
const n=value=>({kind:'number',value:String(value)}),x={kind:'symbol',name:'x'};
const original=JSON.parse(await readFile(new URL('./fixtures/published-original.lesson.json',import.meta.url)));
const lesson=structuredClone(original);
lesson.slides[1].blocks=[
  {id:'v2-rich',type:'rich-text',version:2,content:{nodes:[
    {type:'paragraph',children:[{type:'text',text:'Explain ',marks:['strong']},{type:'math',source:{mode:'visual',expression:{kind:'power',base:{kind:'negate',body:x},exponent:n(2)}},spoken:'The square of negative x'},{type:'text',text:' using '},{type:'link',href:'https://apcentral.collegeboard.org/',children:[{type:'text',text:'a reference',marks:['em']}]}]},
    {type:'list',style:'unordered',items:[{type:'list-item',children:[{type:'text',text:'Check the grouping.'}]},{type:'list-item',children:[{type:'math',source:{mode:'tex',tex:'(-x)^2=x^2'},spoken:'Negative x in parentheses squared equals x squared.'}]}]},
    {type:'list',style:'ordered',items:[{type:'list-item',children:[{type:'text',text:'State the domain.'}]}]}
  ]}},
  {id:'v2-math',type:'math',version:2,content:{source:{mode:'visual',expression:{kind:'fraction',numerator:{kind:'binary',operator:'add',left:x,right:n(1)},denominator:n(2)}},spoken:'The sum of x and one divided by two.',display:true}},
  {id:'v2-callout',type:'callout',version:2,content:{kind:'note',title:'Explain each step',body:{nodes:[{type:'paragraph',children:[{type:'text',text:'Grouping changes the expression.'}]}]}}}
];
try{
  await page.goto(`http://127.0.0.1:${server.address().port}/tools/lesson-runtime/fixtures/renderer.html?course=ap-calculus&scenario=allowed#slide=2`);
  await page.waitForFunction(()=>window.fixture?.ready);
  assert.equal(await page.evaluate(()=>fixture.error),undefined);
  await page.evaluate(async lesson=>{
    const {mountLesson}=await import('/js/lesson-runtime/renderer.mjs');const {default:katex}=await import('/tools/lesson-runtime/node_modules/katex/dist/katex.mjs');
    fixture.controller.dispose();const route=new URL(location.href);route.hash='';
    const binding={route:route.href,course_key:'ap-calculus',document:{lesson_id:lesson.lesson_id,course_version_id:lesson.course_version_id,unit_id:lesson.unit_id,topic_id:lesson.topic_id,document_version:lesson.document_version,publication_revision:lesson.publication.revision}};
    fixture.v2=await mountLesson({root:document.querySelector('#lesson'),lesson,binding,enabled:true,mathEngine:katex});
    const {renderLessonPreview}=await import('/js/lesson-studio/preview.mjs');const preview=document.createElement('div');preview.id='v2-preview';document.body.append(preview);renderLessonPreview({root:preview,document:lesson,mathEngine:katex});
  },lesson);
  const visible=page.locator('.echsDocumentSlide:not([hidden])');
  assert.equal(await visible.locator('ul li').count(),2);assert.equal(await visible.locator('ol li').count(),1);
  assert.equal(await visible.locator('strong').first().textContent(),'Explain ');
  assert.equal(await visible.locator('a em').textContent(),'a reference');
  assert.equal(await visible.locator('[role=math]').count(),3);
  assert.equal(await visible.locator('[role=math]').first().getAttribute('aria-label'),'The square of negative x');
  assert.ok(await visible.locator('.katex-mathml math').count()>=3);
  pass('mixed v1/v2 lesson renders semantic paragraphs, lists, emphasis, visual/advanced math and spoken labels');
  const link=visible.locator('a');assert.equal(await link.getAttribute('rel'),'noopener noreferrer');assert.equal(await link.getAttribute('referrerpolicy'),'no-referrer');assert.equal(await link.getAttribute('target'),'_blank');
  assert.deepEqual(external,[]);pass('HTTPS links use fixed safe navigation attributes without fetching external content');
  const parity=await page.evaluate(()=>{
    const student=document.querySelector('.echsDocumentSlide:not([hidden]) .echsDocumentBlocks'),preview=document.querySelectorAll('#v2-preview .slide-canvas')[1].querySelector('.slide-content');
    const summary=root=>({text:root.textContent,lists:[...root.querySelectorAll('ol,ul')].map(node=>node.tagName),math:[...root.querySelectorAll('[role=math]')].map(node=>node.getAttribute('aria-label')),links:[...root.querySelectorAll('a')].map(node=>node.href)});
    return [summary(student),summary(preview)];
  });assert.deepEqual(...parity);
  assert.equal(await page.evaluate(()=>{const ids=[...document.querySelectorAll('[id]')].map(node=>node.id);return new Set(ids).size===ids.length;}),true);
  pass('staff preview and authorized student rendering share identical content semantics without duplicate accessible IDs');
  assert.equal(await page.evaluate(()=>fixture.learningCalls),0);assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0);
  await page.getByRole('button',{name:'Next',exact:true}).click();assert.equal(await page.evaluate(()=>fixture.v2.slideIndex),2);
  await page.getByRole('button',{name:'Previous',exact:true}).click();assert.equal(await page.evaluate(()=>fixture.v2.slideIndex),1);
  pass('existing slide navigation remains usable and content rendering writes no learning or browser state');
  await page.locator('#v2-preview').evaluate(node=>node.remove());
  await page.screenshot({path:path.join(output,'content-desktop.png'),fullPage:true});
  await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:path.join(output,'content-mobile.png'),fullPage:true});pass('mixed content retains a readable layout at desktop and 390px widths');
  await page.evaluate(()=>document.documentElement.dataset.lessonGate='denied');await page.waitForFunction(()=>document.querySelector('#lesson').childElementCount===0);
  assert.equal(await page.evaluate(()=>fixture.learningCalls),0);pass('revoking the existing lesson gate still clears all mixed-version content');
  assert.deepEqual(errors,[]);await writeFile(path.join(output,'content-renderer-results.json'),JSON.stringify({status:'passed',checks,scope:'Synthetic local mixed-version lesson using the unchanged simulated access fixture; no production requests.'},null,2)+'\n');
}finally{await context.close();await browser.close();await new Promise(resolve=>server.close(resolve));}
