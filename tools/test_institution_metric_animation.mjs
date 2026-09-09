/* Executes the actual trusted classic function in a deterministic DOM/RAF harness. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
const path=new URL('../js/institution-experience.js',import.meta.url),raw=fs.readFileSync(path),source=raw.toString('utf8');
const start=source.indexOf('  function bindAnimatedNumbers()'),end=source.indexOf('  function bindDialogFocusRecovery()',start);
assert.ok(start>=0&&end>start,'Actual named source function boundaries');
const code=source.slice(start,end)+'\nbindAnimatedNumbers();',checks=[];
function harness(value='97%',options={}){
  const node={textContent:value,isConnected:true},queue=[],observed=[];
  let callback,clock=1000,reduced=options.reduced||false,actor={id:'a',organization_id:'org-a',role:'student'};
  class Observer{constructor(cb){callback=cb;}observe(target){observed.push(target);}unobserve(){}}
  const window={IntersectionObserver:Observer,matchMedia:()=>({matches:reduced}),ECHSInstitution:{account:()=>actor}};
  vm.runInNewContext(code,{window,IntersectionObserver:Observer,WeakSet,$$:()=>[node],performance:{now:()=>clock},requestAnimationFrame:cb=>{queue.push(cb);return queue.length;}});
  return{node,queue,observed,enter(){callback?.([{isIntersecting:true,target:node}]);},frame(time){clock=time;const cb=queue.shift();cb?.(time);},setActor(next){actor=next;},setReduced(next){reduced=next;}};
}
function check(name,run){run();checks.push(name);console.log('PASS '+name);}
check('A visible 97 percent metric animates from zero through its own writes to exact target',()=>{
  const h=harness();h.enter();h.frame(1000);assert.equal(h.node.textContent,'0%');h.frame(1016);assert.equal(h.node.textContent,'9%');h.frame(1032);assert.notEqual(h.node.textContent,'9%');h.frame(1500);assert.equal(h.node.textContent,'97%');assert.equal(h.queue.length,0);
});
check('Actual zero, missing text and unsupported values remain untouched without scheduling',()=>{
  for(const text of ['0%','—','Insufficient practice evidence','5001','-1']){const h=harness(text);h.enter();assert.equal(h.node.textContent,text);assert.equal(h.queue.length,0);}
});
check('A newer report cancels every later write, including exactly the completion frame',()=>{
  for(const replacement of ['65%','0%','—']){const h=harness();h.enter();h.frame(1016);h.node.textContent=replacement;h.frame(1500);assert.equal(h.node.textContent,replacement);assert.equal(h.queue.length,0);}
});
check('Account, organization, role changes and logout cannot receive a late old animation',()=>{
  for(const actor of [null,{id:'b',organization_id:'org-a',role:'student'},{id:'a',organization_id:'org-b',role:'student'},{id:'a',organization_id:'org-a',role:'teacher'}]){const h=harness();h.enter();h.frame(1016);const before=h.node.textContent;h.setActor(actor);h.frame(1500);assert.equal(h.node.textContent,before);assert.equal(h.queue.length,0);}
});
check('Detached DOM receives no late writes or continuing animation',()=>{const h=harness();h.enter();h.frame(1016);const before=h.node.textContent;h.node.isConnected=false;h.frame(1032);assert.equal(h.node.textContent,before);assert.equal(h.queue.length,0);});
check('Reduced motion retains the exact current value and registers no observer',()=>{const h=harness('97%',{reduced:true});assert.equal(h.observed.length,0);h.enter();assert.equal(h.node.textContent,'97%');assert.equal(h.queue.length,0);});
check('Reduced motion enabled during animation reaches the unchanged target immediately',()=>{const h=harness();h.enter();h.frame(1016);h.setReduced(true);h.frame(1032);assert.equal(h.node.textContent,'97%');assert.equal(h.queue.length,0);});
check('Repeated observer notification cannot create competing loops or runaway frames',()=>{const h=harness();h.enter();h.enter();assert.equal(h.queue.length,1);let frames=0;for(let t=1000;h.queue.length&&t<=1600;t+=16){h.frame(t);frames++;assert.ok(h.queue.length<=1);}assert.ok(frames<40);assert.equal(h.queue.length,0);assert.equal(h.node.textContent,'97%');});
check('Integer, decimal and suffix targets finish with the exact original reported text',()=>{for(const text of ['1,234 XP','97.5%','97.50%']){const h=harness(text);h.enter();h.frame(1500);assert.equal(h.node.textContent,text);assert.equal(h.queue.length,0);}});
console.log(JSON.stringify({status:'PASS',groups:checks.length,source:'js/institution-experience.js',source_sha256:createHash('sha256').update(raw).digest('hex'),scope:'Actual source function with synthetic DOM, account and animation-frame clock; no production access'}));
