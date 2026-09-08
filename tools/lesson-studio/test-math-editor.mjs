import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const repository=fileURLToPath(new URL('../../',import.meta.url));
const require=createRequire(new URL('../../question-bank/official/tools/package.json',import.meta.url));
const {chromium}=require('playwright');
const output=process.env.ECHS_MATH_EDITOR_EVIDENCE||path.join(repository,'artifacts/lesson-studio');
const fixture=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Isolated visual math editor fixture</title><link rel="stylesheet" href="/lessons/ib-math-ai/unit-1/assets/css/katex.css"><link rel="stylesheet" href="/css/lesson-studio.css"></head><body><main><h1>Visual math editor fixture</h1><div id="editor"></div></main><script type="module">
import katex from '/lessons/ib-math-ai/unit-1/assets/js/katex.js';
import {createMathEditor} from '/js/lesson-studio/math-editor.mjs';
import {suggestMathSpeech,compileMathSource} from '/js/lesson-runtime/math-expression.mjs';
const changes=[],invalid=[];
const value={source:{mode:'visual',expression:{kind:'symbol',name:'x'}},spoken:'x',display:true};
const editor=createMathEditor({root:document.getElementById('editor'),value,mathEngine:katex,onChange:next=>changes.push(next),onInvalid:next=>invalid.push(next)});
window.mathFixture={editor,changes,invalid,compileMathSource,createMathEditor,katex,load(expression){editor.setValue({source:{mode:'visual',expression},spoken:suggestMathSpeech(expression),display:true});},ready:true};
</script></body></html>`;
const types={'.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf'};
const server=createServer(async(req,res)=>{
  try{
    const route=new URL(req.url,'http://localhost').pathname;
    if(route==='/math-editor-fixture.html'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end(fixture);return;}
    const file=path.resolve(repository,'.'+decodeURIComponent(route));
    if(!file.startsWith(path.resolve(repository)+path.sep)){res.writeHead(403).end();return;}
    res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(await readFile(file));
  }catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const checks=[],errors=[],requests=[];let browser;
const pass=label=>{checks.push(label);console.log('PASS '+label);};
const symbol=name=>({kind:'symbol',name}),number=value=>({kind:'number',value:String(value)});
try{
  browser=await chromium.launch({headless:true,executablePath:process.env.ECHS_CHROMIUM_PATH||undefined});
  const context=await browser.newContext({viewport:{width:1200,height:1000},serviceWorkers:'block'});
  await context.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
  const page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',error=>errors.push(error.message));
  page.on('request',request=>requests.push(new URL(request.url()).pathname));
  await page.goto(`http://127.0.0.1:${server.address().port}/math-editor-fixture.html`,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>window.mathFixture?.ready);
  const field=key=>page.locator(`[data-math-field="${key}"]`);
  const state=()=>page.evaluate(()=>window.mathFixture.editor.getValue());
  const load=expression=>page.evaluate(expression=>window.mathFixture.load(expression),expression);
  assert.equal(await field('mode').inputValue(),'visual');assert.equal(await page.locator('.math-editor-preview .katex').count(),1);
  assert.equal(await page.evaluate(()=>window.mathFixture.changes.length),0);
  assert.equal(await page.evaluate(()=>[...document.querySelectorAll('#editor input,#editor textarea,#editor select')].every(control=>control.labels.length>0)),true);
  pass('default visual mode uses actual KaTeX, labeled controls and a silent constructor');

  await field('expression-kind').selectOption('fraction');await field('expression-numerator-value').fill('3');
  await field('expression-denominator-kind').selectOption('binary');await field('expression-denominator-right-value').fill('2');
  let current=await state();assert.equal(current.source.expression.numerator.value,'3');assert.equal(current.source.expression.denominator.operator,'add');
  assert.equal(await page.evaluate(()=>window.mathFixture.compileMathSource(window.mathFixture.editor.getValue().source)),'\\frac{3}{\\left(x\\right) + \\left(2\\right)}');
  pass('fraction controls create nested operands without raw TeX or JSON');

  await load(symbol('x'));await field('expression-kind').selectOption('power');await field('expression-base-kind').selectOption('negate');
  assert.equal((await state()).source.expression.base.kind,'negate');
  await field('expression-kind').selectOption('root');await field('expression-indexed').check();await field('expression-index-value').fill('3');
  assert.equal((await state()).source.expression.index.value,'3');await field('expression-indexed').uncheck();assert.equal((await state()).source.expression.index,null);
  pass('power and indexed-root controls preserve structure and optional root index');

  await field('expression-kind').selectOption('sum');await field('expression-variable').fill('j');await field('expression-lower-value').fill('0');
  assert.equal((await state()).source.expression.variable,'j');
  await field('expression-kind').selectOption('integral');await field('expression-variable').fill('t');await field('expression-bounded').check();
  await field('expression-upper-value').fill('4');current=await state();assert.equal(current.source.expression.upper.value,'4');assert.equal(current.source.expression.variable,'t');
  await field('expression-bounded').uncheck();assert.equal((await state()).source.expression.lower,null);
  await field('expression-kind').selectOption('limit');await field('expression-side').selectOption('left');assert.equal((await state()).source.expression.side,'left');
  assert.match((await state()).spoken,/from the left/);
  pass('sum, definite and indefinite integral, and one-sided limit controls retain their fields');

  await load(number(2));const before=await page.evaluate(()=>window.mathFixture.changes.length);
  await field('expression-value').fill('');assert.equal(await field('expression-value').inputValue(),'');
  assert.equal(await page.evaluate(()=>{try{window.mathFixture.editor.getValue();return false;}catch{return true;}}),true);
  assert.equal(await page.evaluate(()=>window.mathFixture.changes.length),before);assert.equal(await page.locator('#editor').getAttribute('data-math-editor-valid'),'false');
  await field('expression-value').fill('2');assert.equal(await page.evaluate(()=>window.mathFixture.changes.length),before+1);
  await field('expression-value').fill('12.5');assert.equal((await state()).source.expression.value,'12.5');
  assert.equal(await field('expression-value').evaluate(control=>document.activeElement===control),true);
  pass('invalid numeric buffers stay visible, suppress changes and recover without losing focus');

  await field('spoken').fill('My custom description');await field('expression-value').fill('9');
  assert.equal(await field('spoken').inputValue(),'My custom description');assert.equal(await page.locator('[data-math-action="confirm-speech"]').isVisible(),true);
  assert.equal(await page.evaluate(()=>{try{window.mathFixture.editor.getValue();return false;}catch{return true;}}),true);
  await page.locator('[data-math-action="confirm-speech"]').click();assert.equal((await state()).spoken,'My custom description');
  await page.locator('[data-math-action="suggest-speech"]').click();await field('expression-value').fill('10');assert.equal((await state()).spoken,'10');
  pass('custom descriptions require review after formula edits and suggested speech stays synchronized');

  await field('mode').selectOption('tex');await page.getByRole('button',{name:'Keep current source',exact:true}).click();assert.equal((await state()).source.mode,'visual');
  await field('mode').selectOption('tex');await page.getByRole('button',{name:'Use advanced LaTeX',exact:true}).click();assert.equal((await state()).source.tex,'10');
  await field('tex').fill('\\frac{x}{');assert.equal(await field('tex').inputValue(),'\\frac{x}{');
  assert.equal(await page.evaluate(()=>{try{window.mathFixture.editor.getValue();return false;}catch{return true;}}),true);
  await field('tex').fill('\\href{https://example.test}{x}');assert.equal(await page.locator('#editor a').count(),0);
  await field('tex').fill('\\frac{x}{2}');await field('spoken').fill('x divided by two');assert.equal((await state()).source.mode,'tex');
  await field('mode').selectOption('visual');await page.getByRole('button',{name:'Keep current source',exact:true}).click();assert.equal((await state()).source.tex,'\\frac{x}{2}');
  await field('mode').selectOption('visual');await page.getByRole('button',{name:'Start visual formula',exact:true}).click();assert.equal((await state()).source.mode,'visual');
  pass('advanced input is optional and mode changes require confirmation without silently discarding invalid source');

  const examples=[{kind:'group',body:symbol('x')},{kind:'negate',body:number(2)},{kind:'binary',operator:'lessEqual',left:symbol('x'),right:number(1)},
    {kind:'fraction',numerator:number(1),denominator:symbol('x')},{kind:'power',base:symbol('x'),exponent:number(2)},
    {kind:'root',radicand:symbol('x'),index:number(3)},{kind:'function',name:'sin',argument:symbol('theta')},
    {kind:'sum',variable:'k',lower:number(1),upper:symbol('n'),body:symbol('k')},
    {kind:'integral',variable:'t',lower:number(0),upper:number(1),body:symbol('t')},
    {kind:'limit',variable:'x',target:number(0),side:'right',body:symbol('x')}];
  for(const expression of examples){await load(expression);const saved=await state();await page.evaluate(value=>window.mathFixture.editor.setValue(JSON.parse(JSON.stringify(value))),saved);assert.deepEqual(await state(),saved);}
  pass('every visual structure round-trips through JSON and reopens with editable fields');

  const saved=await state();assert.equal(await page.evaluate(()=>{const value=window.mathFixture.editor.getValue();value.source.expression.variable='changed';try{window.mathFixture.editor.setValue({...value,private_notes:'forbidden'});return false;}catch{return true;}}),true);
  assert.deepEqual(await state(),saved);await page.evaluate(()=>window.mathFixture.editor.focus());assert.equal(await field('expression-kind').evaluate(control=>document.activeElement===control),true);
  pass('getValue is defensive, invalid setValue retains content and focus is keyboard accessible');

  let nested=symbol('x');for(let i=0;i<4;i++)nested={kind:'group',body:nested};await load(nested);
  assert.deepEqual(await field('expression-body-body-body-body-kind').locator('option').evaluateAll(options=>options.map(option=>option.value)),['number','symbol']);
  pass('deepest visual slots offer only leaf structures within the five-level bound');

  await mkdir(output,{recursive:true});await page.setViewportSize({width:420,height:900});await load({kind:'fraction',numerator:number(1),denominator:{kind:'binary',operator:'add',left:symbol('x'),right:number(2)}});
  await page.screenshot({path:path.join(output,'math-editor-mobile.png'),fullPage:true});
  await page.evaluate(()=>{const fixture=window.mathFixture,value=fixture.editor.getValue();fixture.editor.dispose();fixture.editor=fixture.createMathEditor({root:document.getElementById('editor'),value:{...value,display:false},allowDisplayMode:false,mathEngine:fixture.katex,onChange:next=>fixture.changes.push(next),onInvalid:next=>fixture.invalid.push(next)});});
  assert.equal(await field('display').count(),0);assert.equal((await state()).display,false);
  assert.equal(await page.evaluate(()=>{try{window.mathFixture.editor.setValue({...window.mathFixture.editor.getValue(),display:true});return false;}catch{return true;}}),true);
  pass('inline configuration hides display controls and rejects display-mode changes');
  const counts=await page.evaluate(()=>({changes:window.mathFixture.changes.length,invalid:window.mathFixture.invalid.length}));
  await page.evaluate(()=>{window.detachedMathInput=document.querySelector('[data-math-field="expression-numerator-value"]');window.mathFixture.editor.dispose();window.detachedMathInput.value='99';window.detachedMathInput.dispatchEvent(new Event('input',{bubbles:true}));});
  assert.equal(await page.locator('#editor').textContent(),'');
  assert.deepEqual(await page.evaluate(()=>({changes:window.mathFixture.changes.length,invalid:window.mathFixture.invalid.length})),counts);
  assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0);assert.deepEqual(errors,[]);
  pass('mobile browser smoke, disposal, detached-event suppression and zero draft storage');
  await writeFile(path.join(output,'math-editor-results.json'),JSON.stringify({ok:true,groups:checks.length,checks,browser_errors:errors,scope:'Isolated local browser and actual checked-in KaTeX; no school account or production request.'},null,2)+'\n');
}catch(error){console.error(JSON.stringify({requests,browser_errors:errors}));throw error;}
finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
