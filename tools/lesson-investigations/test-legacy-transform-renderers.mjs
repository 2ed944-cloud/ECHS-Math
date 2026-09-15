import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

// Executes the actual inline methods with a recording Plot and number-format seam.
// This is source/component evidence, not native canvas, browser or release acceptance.
const arg=name=>{const i=process.argv.indexOf(name);return i<0?null:process.argv[i+1];};
const folder=dirname(fileURLToPath(import.meta.url));
const repo=resolve(arg('--repo')||resolve(folder,'../..'));
const original=arg('--baseline-root');
if(!original)throw new Error('Supply --baseline-root with the exact retained lesson originals.');
const pins=JSON.parse(readFileSync(resolve(folder,'transform-baseline-pins.json'),'utf8'));
const sha=raw=>createHash('sha256').update(raw).digest('hex');
const files=pins.files.map(pin=>({pin,before:readFileSync(resolve(original,pin.path)),after:readFileSync(resolve(repo,pin.path))}));
const method=(raw,name)=>{
  const found=[...raw.toString('utf8').matchAll(new RegExp('^    '+name+'\\(p,v,read\\)\\{[^\\r\\n]*','gm'))];
  assert.equal(found.length,1,`unique actual ${name} method`);return found[0][0];
};
const compiled=new Map();
function invoke(raw,name,value){
  let methods=compiled.get(raw);if(!methods){methods=new Map();compiled.set(raw,methods);}
  if(!methods.has(name))methods.set(name,vm.runInNewContext('({'+method(raw,name)+'})['+JSON.stringify(name)+']',{
    nice:n=>String(n),xFactor:n=>n<0?`(x+${-n})`:`(x−${n})`
  },{timeout:1000}));
  const plot={points:[],curves:[],horizontal:[],vertical:[],data:[],
    grid(title){this.title=title;},curve(fn){this.curves.push(fn);},point(...p){this.points.push(p);},
    asymH(...p){this.horizontal.push(p);},asymV(...p){this.vertical.push(p);},scatter(p){this.data.push(p);}};
  const read={textContent:''};methods.get(name)(plot,value,read);return{plot,text:read.textContent};
}
const near=(actual,expected)=>assert.ok(Number.isFinite(actual)&&Math.abs(actual-expected)<=1e-10*Math.max(1,Math.abs(expected)),`${actual} != ${expected}`);
const ticks=(lo,hi)=>Array.from({length:Math.round((hi-lo)*4)+1},(_,i)=>lo+i/4);
const inside=({plot,text})=>{
  assert.doesNotMatch(text,/NaN|Infinity|undefined/);
  for(const n of Object.values(plot.b))assert.ok(Number.isFinite(n));
  assert.ok(plot.b.xmin<plot.b.xmax&&plot.b.ymin<plot.b.ymax);
  for(const [x,y]of plot.points){assert.ok(Number.isFinite(x)&&Number.isFinite(y));assert.ok(x>plot.b.xmin&&x<plot.b.xmax,`x=${x}`);assert.ok(y>plot.b.ymin&&y<plot.b.ymax,`y=${y}`);}
};
const card=(raw,name)=>{
  const found=[...raw.toString('utf8').matchAll(/<article\b[^>]*data-interaction="([^"]+)"[^>]*>[\s\S]*?<\/article>/g)].filter(m=>m[1]===name);
  assert.equal(found.length,1);return found[0][0];
};

test('01 three exact private originals; inverse repairs preserve every other source byte',()=>{
  assert.equal(files.length,3);assert.equal(pins.baseline_main,'dcc65f84dafd2dc5cb4518ea03d18b4087ddf4ff');
  const allowed=[['transform','transformpoints'],[],['modelconstruct','rationalconstruct']];
  for(const [index,{pin,before,after}]of files.entries()){
    assert.equal(before.length,pin.bytes);assert.equal(sha(before),pin.sha256);
    assert.equal(createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${before.length}\0`),before])).digest('hex'),pin.git_blob_sha);
    let inverse=after.toString('utf8');
    for(const name of allowed[index])inverse=inverse.replace(method(after,name),method(before,name));
    if(index===1){const old=card(before,'modelselect'),current=card(after,'modelselect');
      assert.equal(current.replace('<option value="2">Rational saturation</option>','<option value="2">Cubic-like</option>'),old);
      inverse=inverse.replace(current,old);
    }
    assert.ok(Buffer.from(inverse).equals(before),'all prose, assessments, IDs, styles and other methods remain exact');
    const scripts=raw=>[...raw.toString('utf8').matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
    assert.equal(scripts(before).length,scripts(after).length);
    for(const i of [0,2,3])assert.equal(scripts(after)[i],scripts(before)[i]);
    assert.deepEqual([...after.toString().matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]),[...before.toString().matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
  }
});
test('02 tested zero and small nonzero settings are actual unchanged controls',()=>{
  for(const [index,name,keys]of [[0,'transform',['a','b']],[0,'transformpoints',['a','b','u']],[2,'modelconstruct',['scale']],[2,'rationalconstruct',['L']]]){
    const before=card(files[index].before,name),after=card(files[index].after,name);assert.equal(after,before);
    for(const key of keys){const input=[...after.matchAll(/<input\b[^>]*>/g)].map(m=>m[0]).find(s=>s.includes(`data-control="${key}"`));
      assert.ok(input,`${name}.${key}`);assert.match(input,/step="0\.25"/);
      const lo=Number(input.match(/min="([^"]+)"/)[1]),hi=Number(input.match(/max="([^"]+)"/)[1]);assert.ok(lo<0&&hi>0);
    }
  }
});
test('03 b=0 is a finite constant, not an invertible horizontal dilation or unique vertex',()=>{
  for(const a of ticks(-3,3))for(const h of [-3,0,3])for(const k of [-5,0,5]){
    const state=invoke(files[0].after,'transform',{a,b:0,h,k});inside(state);
    assert.equal(state.plot.points.length,0);assert.match(state.text,/constant/i);assert.match(state.text,/no unique vertex/i);
    assert.doesNotMatch(state.text,/horizontal scale is/);for(const x of [-6,-1,0,4,6])near(state.plot.curves[1](x),k);
  }
});
test('04 a=0 also collapses to k with no unique vertex, without changing the selected b',()=>{
  for(const b of ticks(-3,3).filter(Boolean)){
    const state=invoke(files[0].after,'transform',{a:0,b,h:2,k:3});inside(state);
    assert.equal(state.plot.points.length,0);assert.match(state.text,/a=0/);assert.match(state.text,/constant/i);assert.match(state.text,/no unique vertex/i);
    for(const x of [-6,0,2,6])near(state.plot.curves[1](x),3);
  }
});
test('05 all nonzero transform scales retain the original curve, vertex and explanation',()=>{
  for(const a of ticks(-3,3).filter(Boolean))for(const b of ticks(-3,3).filter(Boolean)){
    const value={a,b,h:2,k:3},before=invoke(files[0].before,'transform',value),after=invoke(files[0].after,'transform',value);
    assert.equal(after.text,before.text);assert.equal(after.plot.title,before.plot.title);assert.deepEqual(after.plot.points,before.plot.points);
    for(const x of [-6,-1,0,2,5,6])near(after.plot.curves[1](x),a*b*b*(x-2)*(x-2)+3);
  }
});
test('06 b=0 mapper distinguishes no solution from every input; never divides by zero',()=>{
  for(const a of ticks(-3,3))for(const u of ticks(-3,3)){
    const state=invoke(files[0].after,'transformpoints',{a,b:0,u});inside(state);
    assert.equal(state.plot.points.length,1,'parent point only; no unique image marker');
    near(state.plot.points[0][0],u);near(state.plot.points[0][1],u*u);
    assert.equal(state.plot.title,'Constant output: g(x)=2');assert.match(state.text,/b=0/);assert.match(state.text,/no unique (?:image|point)/i);
    assert.match(state.text,u===0?/every (?:real )?input/i:/no (?:real )?input/i);
    for(const x of [-5,0,1,7])near(state.plot.curves[1](x),2);
  }
});
test('07 all 15000 legal nonzero-b mappings use exact coordinates inside a bounded viewport',()=>{
  let checked=0;
  for(const a of ticks(-3,3))for(const b of ticks(-3,3).filter(Boolean))for(const u of ticks(-3,3)){
    const state=invoke(files[0].after,'transformpoints',{a,b,u});inside(state);
    assert.equal(state.plot.points.length,2);const [parent,image]=state.plot.points;
    near(parent[0],u);near(parent[1],u*u);near(image[0],1+u/b);near(image[1],2+a*u*u);
    near(state.plot.curves[1](image[0]),image[1]);near(b*(image[0]-1),u);
    assert.equal(state.plot.title,'Parent point and image');assert.ok(state.text.endsWith(' Model: g(x)=a f(b(x−1))+2.'));
    if(a!==0)assert.equal(state.text.slice(0,-' Model: g(x)=a f(b(x−1))+2.'.length),invoke(files[0].before,'transformpoints',{a,b,u}).text);
    assert.ok(state.plot.b.xmin>=-12&&state.plot.b.xmax<=14&&state.plot.b.ymin>=-27&&state.plot.b.ymax<=31);
    checked++;
  }
  assert.equal(checked,15000);
  const old=invoke(files[0].before,'transformpoints',{a:2,b:.25,u:3});assert.ok(old.plot.points[1][0]>old.plot.b.xmax&&old.plot.points[1][1]>old.plot.b.ymax);
});
test('08 zero-a mapper keeps input correspondence and explicitly identifies collapsed outputs',()=>{
  for(const b of [-3,-.25,.25,3])for(const u of [-3,0,3]){
    const state=invoke(files[0].after,'transformpoints',{a:0,b,u});inside(state);
    assert.match(state.text,/a=0/);assert.match(state.text,/all outputs to 2/);near(state.plot.points[1][1],2);
    near(state.plot.points[1][0],1+u/b);
  }
});
test('09 model-selection option names the unchanged rational saturation formula and data',()=>{
  const actual=card(files[1].after,'modelselect');assert.match(actual,/<option value="2">Rational saturation<\/option>/);assert.doesNotMatch(actual,/Cubic-like/);
  assert.equal(method(files[1].before,'modelselect'),method(files[1].after,'modelselect'));
  for(const data of [0,1,2]){
    const before=invoke(files[1].before,'modelselect',{data}),after=invoke(files[1].after,'modelselect',{data});assert.equal(after.text,before.text);
    assert.equal(JSON.stringify(after.plot.data),JSON.stringify(before.plot.data));
    for(const x of [0,1,3,8,12])near(after.plot.curves[0](x),data===0?3*x+2:data===1?x*x-2*x-1:80*x/(x+3));
  }
});
test('10 all 625 zero-scale quadratic selections are the zero polynomial with all real zeros',()=>{
  for(const r1 of ticks(-4,2))for(const r2 of ticks(-2,4)){
    const state=invoke(files[2].after,'modelconstruct',{scale:0,r1,r2});inside(state);
    assert.equal(state.plot.title,'Zero polynomial');assert.equal(state.plot.points.length,0);
    assert.match(state.text,/every real input is a zero/);assert.match(state.text,/degree and leading coefficient are not defined/);
    for(const x of [-6,-1,0,3,7])near(state.plot.curves[0](x),0);
  }
});
test('11 all nonzero quadratic scales retain original features and correct factors',()=>{
  for(const scale of ticks(-3,3).filter(Boolean))for(const r1 of [-4,0,2])for(const r2 of [-2,0,4]){
    const value={scale,r1,r2},before=invoke(files[2].before,'modelconstruct',value),after=invoke(files[2].after,'modelconstruct',value);
    assert.equal(after.text,before.text);assert.equal(after.plot.title,before.plot.title);assert.deepEqual(after.plot.points,before.plot.points);
    for(const x of [-6,r1,r2,0,7])near(after.plot.curves[0](x),scale*(x-r1)*(x-r2));
  }
});
test('12 every zero-L rational model preserves the denominator exclusion as a hole, not a pole',()=>{
  let checked=0;
  for(const a of ticks(-4,3))for(const z of ticks(-3,4)){
    const state=invoke(files[2].after,'rationalconstruct',{a,z,L:0});inside(state);
    assert.equal(state.plot.vertical.length,0);assert.equal(state.plot.points.length,1);
    const point=state.plot.points[0];near(point[0],a);near(point[1],0);assert.equal(point[3],true,'hollow marker');
    assert.match(state.text,/every (?:retained-domain|original-domain) input is a zero/);assert.match(state.text,/hole/);assert.match(state.text,/not a vertical asymptote/);
    assert.ok(state.text.includes(`x≠${a}`));
    assert.ok(!Number.isFinite(state.plot.curves[0](a)),'the original denominator input remains excluded');
    for(const x of [a-1,a-.001,a+.001,a+1])near(state.plot.curves[0](x),0);
    checked++;
  }
  assert.equal(checked,841);
});
test('13 nonzero rational levels retain both coincident-hole and distinct-pole cases',()=>{
  for(const L of ticks(-4,4).filter(Boolean))for(const a of [-4,-2,0,3])for(const z of [-3,-2,0,3,4]){
    const value={L,a,z},before=invoke(files[2].before,'rationalconstruct',value),after=invoke(files[2].after,'rationalconstruct',value);
    assert.equal(after.text,before.text);assert.equal(after.plot.title,before.plot.title);assert.deepEqual(after.plot.points,before.plot.points);assert.deepEqual(after.plot.vertical,before.plot.vertical);assert.deepEqual(after.plot.horizontal,before.plot.horizontal);
    for(const x of [a-1,a+.5,a+2])near(after.plot.curves[0](x),L*(x-z)/(x-a));
    assert.equal(after.plot.vertical.length,a===z?0:1);
  }
});
test('14 retained originals reproduce the exact misleading zero-state and option defects',()=>{
  const b0=invoke(files[0].before,'transform',{a:2,b:0,h:1,k:2});assert.match(b0.text,/Infinity/);assert.equal(b0.plot.points.length,1);
  assert.ok(!Number.isFinite(invoke(files[0].before,'transformpoints',{a:2,b:0,u:3}).plot.points[1][0]));
  assert.match(card(files[1].before,'modelselect'),/Cubic-like/);
  assert.match(invoke(files[2].before,'modelconstruct',{scale:0,r1:-2,r2:3}).text,/nonzero scale/);
  assert.equal(invoke(files[2].before,'rationalconstruct',{a:-2,z:1,L:0}).plot.vertical.length,1);
});
