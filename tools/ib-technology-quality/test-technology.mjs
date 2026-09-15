import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url),{parseHTML}=require(process.env.ECHS_TEST_DOM_MODULE||'linkedom');
const arg=name=>{const i=process.argv.indexOf(name);return i<0?null:process.argv[i+1];};
assert.ok(arg('--repo')&&arg('--baseline-root'),'Supply --repo and --baseline-root');
const sourceRoot=path.resolve(arg('--repo')),baselineRoot=path.resolve(arg('--baseline-root'));
const relative='lessons/ib-math-ai/unit-1/data/lesson-1.6-technology-v6-interactions.js';
const manifest=JSON.parse(fs.readFileSync(new URL('./baseline-pins.json',import.meta.url)));
assert.equal(manifest.files.length,1);
const sha=b=>createHash('sha256').update(b).digest('hex');
const source=fs.readFileSync(path.join(sourceRoot,relative)),before=manifest.files.map(r=>({path:r.path,sha256:sha(fs.readFileSync(path.join(sourceRoot,r.path)))}));
const groups=[];let combinations=0,samplesChecked=0;
async function group(name,fn){try{await fn();groups.push({name,status:'PASS'});console.log('PASS '+name);}catch(error){groups.push({name,status:'FAIL',error:String(error.stack||error)});console.log('FAIL '+name);}}
function fixture(){
  const {window,document}=parseHTML('<html><body><div data-te-lab="system"></div><div data-te-lab="polynomial"></div><div data-te-lab="residual"></div></body></html>');
  window.LESSON_DATA={lesson:{number:'1.6'}};
  vm.runInNewContext(source.toString('utf8'),{window,document,MutationObserver:class{observe(){}},requestAnimationFrame:()=>0,console});
  const set=(node,value)=>{node.value=String(value);node.dispatchEvent(new window.Event('input',{bubbles:true}));};
  const click=node=>node.dispatchEvent(new window.Event('click',{bubbles:true}));
  return {document,set,click};
}
const near=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const values=lab=>[...lab.querySelectorAll('.te-residual-output b')].map(n=>Number(n.textContent));
function verifyCurve(root,roots){
  const pairs=[...root.querySelector('.poly-curve').getAttribute('d').matchAll(/[ML] ([^ ]+) ([^ ]+)/g)].map(m=>[Number(m[1]),Number(m[2])]);
  assert.equal(pairs.length,221);
  // Recover one common screen scale from a nonzero endpoint, then independently
  // substitute every other plotted abscissa into the factored polynomial.
  const value=x=>roots.reduce((p,r)=>p*(x-r),1),scale=(168-pairs[0][1])/value(-5);
  assert.ok(Number.isFinite(scale)&&scale>0);
  for(const [sx,sy] of pairs){
    assert.ok(Number.isFinite(sx)&&Number.isFinite(sy));
    assert.ok(sx>=42-1e-8&&sx<=528+1e-8&&sy>42&&sy<294,'Headroom keeps actual samples inside the frame');
    const x=(sx-42)/486*10-5;near((168-sy)/scale,value(x));samplesChecked++;
  }
  assert.equal(root.querySelectorAll('.root-points circle').length,new Set(roots).size);
}
await group('Triple preset plots the actual cubic without a clipped flat tail',()=>{
  const {document,click}=fixture(),root=document.querySelector('[data-te-lab="polynomial"]');
  click(root.querySelector('[data-ppreset="triple"]'));verifyCurve(root,[1,1,1]);
});
await group('All729 native integer root settings preserve polynomial samples and multiplicity',()=>{
  const {document,set}=fixture(),root=document.querySelector('[data-te-lab="polynomial"]'),fields=[...root.querySelectorAll('[data-root]')];
  for(let a=-4;a<=4;a++)for(let b=-4;b<=4;b++)for(let c=-4;c<=4;c++){
    const roots=[a,b,c];fields.forEach((n,i)=>n.value=String(roots[i]));set(fields[0],a);verifyCurve(root,roots);combinations++;
  }
});
await group('Blank whitespace and malformed residual inputs produce no numeric residuals',()=>{
  const {document,set}=fixture(),root=document.querySelector('[data-te-lab="residual"]'),x=root.querySelector('[data-residual="x"]'),y=root.querySelector('[data-residual="y"]');
  for(const invalid of ['', '   ', 'NaN', 'Infinity', '-Infinity', '1e999','2abc','0x10']){
    set(y,0);set(x,invalid);assert.equal(root.querySelector('.te-residual-output').classList.contains('invalid'),true,JSON.stringify(invalid));assert.equal(values(root).length,0);
    assert.match(root.querySelector('.te-residual-output').textContent,/enter|finite|number/i);
    set(x,0);set(y,invalid);assert.equal(values(root).length,0);
  }
});
await group('Finite entries whose arithmetic overflows fail without Infinity or NaN',()=>{
  const {document,set}=fixture(),root=document.querySelector('[data-te-lab="residual"]');
  set(root.querySelector('[data-residual="x"]'),'1e308');set(root.querySelector('[data-residual="y"]'),'1e308');
  assert.equal(values(root).length,0);assert.equal(root.querySelector('.te-residual-output').classList.contains('invalid'),true);assert.doesNotMatch(root.querySelector('.te-residual-output').textContent,/NaN|Infinity/);
});
await group('Entered zero signed decimals and scientific notation remain genuine numbers',()=>{
  const {document,set}=fixture(),root=document.querySelector('[data-te-lab="residual"]'),x=root.querySelector('[data-residual="x"]'),y=root.querySelector('[data-residual="y"]');
  for(const [a,b] of [['0','0'],['-0','+0'],[' +2.5e0 ','-1.2e1'],['.5','2.']]){
    set(x,a);set(y,b);const expected=[5*Number(a)-2*Number(b)-4,3*Number(a)+Number(b)-13];assert.deepEqual(values(root),[...expected,Math.max(...expected.map(Math.abs))]);
    assert.equal(root.querySelector('.te-residual-output').classList.contains('invalid'),false);
  }
});
await group('Original exact rounded wrong presets and recovery replace stale feedback',()=>{
  const {document,set,click}=fixture(),root=document.querySelector('[data-te-lab="residual"]');
  for(const [preset,kind] of [['exact','exact'],['rounded','close'],['wrong','wrong']]){
    set(root.querySelector('[data-residual="x"]'),'');click(root.querySelector(`[data-rpreset="${preset}"]`));
    assert.equal(root.querySelector('.te-residual-output').classList.contains(kind),true);assert.equal(values(root).length,3);
  }
});
await group('Single original pin holds and every byte outside the two lab functions is preserved',()=>{
  const base=fs.readFileSync(path.join(baselineRoot,relative),'utf8'),current=source.toString('utf8');
  const strip=text=>text.replace(/function mountResidual\(root\)\{[\s\S]*?(?=\nfunction mountPolynomial\(root\))/,'RESIDUAL\n').replace(/function mountPolynomial\(root\)\{[\s\S]*?(?=\nfunction scan\(root=document\))/,'POLYNOMIAL\n');
  assert.equal(strip(current),strip(base));
  for(const row of manifest.files){const b=fs.readFileSync(path.join(baselineRoot,row.path));assert.equal(sha(b),row.sha256);assert.equal(b.length,row.bytes);if(row.path!==relative)assert.ok(fs.readFileSync(path.join(sourceRoot,row.path)).equals(b));}
  assert.deepEqual(manifest.files.map(r=>({path:r.path,sha256:sha(fs.readFileSync(path.join(sourceRoot,r.path)))})),before);
});
const report={schema:'echs.ib-technology.component.v1',status:groups.every(g=>g.status==='PASS')?'PASS':'FAIL',groups,combinations,samplesChecked,source_files:before,baseline_sha256:sha(fs.readFileSync(new URL('./baseline-pins.json',import.meta.url))),harness_sha256:sha(fs.readFileSync(fileURLToPath(import.meta.url))),scope:'Whole actual module in controlled DOM; observer and frame scheduling are explicit seams. No native layout, access, backend or assessment claim.'};
if(arg('--report'))fs.writeFileSync(arg('--report'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,groups:groups.length,failed:groups.filter(g=>g.status==='FAIL').length,combinations,samplesChecked}));
if(report.status!=='PASS')process.exitCode=1;
