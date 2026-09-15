// Actual renderer/Plot extraction with controlled canvas calls. No native pixels.
import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
const location=dirname(fileURLToPath(import.meta.url));
const arg=name=>{const i=process.argv.indexOf(name);return i<0?null:process.argv[i+1];};
const repo=resolve(arg('--repo')||resolve(location,'../..'));
if(!arg('--baseline-root'))throw new Error('Supply --baseline-root with the exact retained lesson originals.');
const baselineRoot=resolve(arg('--baseline-root'));
const metadata=JSON.parse(readFileSync(resolve(location,'rational-source-preservation.json'),'utf8'));
const baseline=JSON.parse(readFileSync(resolve(location,'rational-baseline-pins.json'),'utf8'));
const hash=raw=>createHash('sha256').update(raw).digest('hex');
const files=metadata.files.map(row=>({row,old:readFileSync(resolve(baselineRoot,row.path)),current:readFileSync(resolve(repo,row.path))}));
const method=(raw,name)=>{const matches=[...raw.toString().matchAll(new RegExp('^    '+name+'\\(p,v,read\\)\\{[^\\r\\n]*','gm'))];assert.equal(matches.length,1);return matches[0][0];};
function draw(raw,name,value,plot=null) {
 const s=raw.toString(),nice=s.match(/const nice=[^\r\n]*/)[0];
 const fn=vm.runInNewContext(`${nice}\n({${method(raw,name)}}).${name}`,{}, {timeout:1000});
 plot??={curves:[],points:[],verticals:[],events:[],grid(t){this.title=t;},curve(fn,...args){this.curves.push({fn,args});this.events.push('curve');},point(...point){this.points.push(point);this.events.push('point');},asymV(x){this.verticals.push(x);this.events.push('vertical');}};
 const read={textContent:''};fn(plot,value,read);return{plot,text:read.textContent};
}
const numericEqual=(a,b)=>assert.ok(a===b||Math.abs(a-b)<1e-10*Math.max(1,Math.abs(b)));
function nativePlot(raw) {
 const s=raw.toString(),start=s.indexOf('  class Plot{'),end=s.indexOf('\n  function controls(',start);
 assert.ok(start>=0&&end>start);
 const calls=[];
 const context=new Proxy({arc(...args){calls.push({type:'arc',args});}},{get(target,key){return target[key]??(()=>{});}});
 const canvas={getBoundingClientRect:()=>({width:600}),getContext:()=>context};
 const Plot=vm.runInNewContext(s.match(/const nice=[^\r\n]*/)[0]+'\n'+s.slice(start,end)+'\nPlot',{devicePixelRatio:1,getComputedStyle:()=>({height:'390px'})},{timeout:1000});
 return {plot:new Plot(canvas),calls};
}

test('two exact changes inverse-reconstruct every original byte including assessment scripts and IDs',()=>{
 assert.equal(files.length,2);assert.equal(baseline.baseline_main,'dcc65f84dafd2dc5cb4518ea03d18b4087ddf4ff');
 for(const {row,old,current} of files) {
  const pin=baseline.files.find(p=>p.path===row.path);assert.ok(pin);assert.equal(pin.bytes,old.length);assert.equal(pin.sha256,hash(old));
  assert.equal(hash(old),row.original_sha256);assert.equal(hash(current),row.candidate_sha256);assert.equal(current.length,row.candidate_bytes);
  const a=method(old,row.method),b=method(current,row.method);assert.equal(hash(Buffer.from(a)),row.old_method_sha256);assert.equal(hash(Buffer.from(b)),row.new_method_sha256);
  assert.ok(Buffer.from(current.toString().replace(b,a)).equals(old));
  const scripts=raw=>[...raw.toString().matchAll(/<script[^>]*>(.*?)<\/script>/gs)].map(m=>m[1]);const before=scripts(old),after=scripts(current);
  assert.equal(hash(Buffer.from(after[2])),row.assessment_script_sha256);before.forEach((s,i)=>{if(i!==1)assert.equal(s,after[i]);});
  const ids=raw=>[...raw.toString().matchAll(/(?:\bid|data-save-key)="([^"]+)"/g)].map(m=>m[0]);assert.deepEqual(ids(current),ids(old));
 }
});
test('red baseline preserves evidence of the original false vertical asymptote at zero remainder',()=>{
 const before=draw(files[1].old,'longdivision',{rem:0});assert.deepEqual(before.plot.verticals,[2]);assert.equal(before.plot.points.length,0);
 assert.equal(before.plot.curves[0].fn(1),2);assert.equal(before.plot.curves[0].fn(3),4);
});
test('zero remainder retains excluded input, hollow hole and complete quotient overlay ordering',()=>{
 for(const rem of [0,-0]) {
  const after=draw(files[1].current,'longdivision',{rem});assert.deepEqual(after.plot.verticals,[]);
  assert.deepEqual(after.plot.points,[[2,3,'#6f1738',true,7]]);assert.deepEqual(after.plot.events,['curve','curve','point']);
  assert.ok(Number.isNaN(after.plot.curves[0].fn(2)));for(const x of [-6,0,1.99,2.01,7])numericEqual(after.plot.curves[0].fn(x),x+1);
  assert.match(after.text,/x≠2/);assert.match(after.text,/hole at \(2,3\), not a vertical asymptote/);
 }
});
test('all32 legal nonzero remainders preserve original values, bounds, styles and readout',()=>{
 let count=0;
 for(let i=-16;i<=16;i++)if(i!==0) {
  const input={rem:i/2},before=draw(files[1].old,'longdivision',input),after=draw(files[1].current,'longdivision',input);
  assert.equal(after.text,before.text);assert.deepEqual({...after.plot.b},{...before.plot.b});assert.equal(after.plot.title,before.plot.title);
  assert.deepEqual(after.plot.verticals,before.plot.verticals);assert.deepEqual(after.plot.points,before.plot.points);
  assert.deepEqual(after.plot.curves.map(x=>x.args),before.plot.curves.map(x=>x.args));
  for(let j=0;j<2;j++)for(const x of [-6,-1,0,1.75,2.25,7])numericEqual(after.plot.curves[j].fn(x),before.plot.curves[j].fn(x));count++;
 }
 assert.equal(count,32);
});
test('red baseline shows both allowed near-asymptote hole positions outside its bounds',()=>{
 for(const c of [1.75,2.25]){const before=draw(files[0].old,'holes',{c}),p=before.plot.points[0];assert.ok(p[1]<before.plot.b.ymin||p[1]>before.plot.b.ymax);}
});
test('all31 legal hole positions stay visible, keep the exact curve/readout and retain collision behavior',()=>{
 let count=0;
 for(let i=0;i<=30;i++) {
  const c=-3+i/4,before=draw(files[0].old,'holes',{c}),after=draw(files[0].current,'holes',{c});
  assert.equal(after.text,before.text);assert.equal(after.plot.title,before.plot.title);assert.deepEqual(after.plot.verticals,[2]);
  for(const x of [-5,-1,0,1.75,2.25,6])numericEqual(after.plot.curves[0].fn(x),before.plot.curves[0].fn(x));
  if(c===2){assert.equal(after.plot.points.length,0);assert.deepEqual({...after.plot.b},{...before.plot.b});assert.match(after.text,/rather than a finite hole/);}
  else {const p=after.plot.points[0];assert.equal(p[0],c);numericEqual(p[1],(c+1)/(c-2));assert.equal(p[3],true);assert.ok(p[0]>after.plot.b.xmin&&p[0]<after.plot.b.xmax);assert.ok(p[1]>after.plot.b.ymin&&p[1]<after.plot.b.ymax);
   if(p[1]>-8&&p[1]<8)assert.deepEqual({...after.plot.b},{...before.plot.b});assert.ok(after.plot.b.ymin>=-12&&after.plot.b.ymax<=14);
  }
  count++;
 }
 assert.equal(count,31);
});
test('actual retained Plot maps repaired hollow markers inside its drawing area',()=>{
 for(const c of [1.75,2.25]) {
  const fixture=nativePlot(files[0].current);draw(files[0].current,'holes',{c},fixture.plot);
  const marker=fixture.calls.filter(x=>x.type==='arc').at(-1);assert.ok(marker);const [x,y,r]=marker.args;
  assert.equal(r,7);assert.ok(x-r>fixture.plot.pad.l&&x+r<fixture.plot.w-fixture.plot.pad.r);assert.ok(y-r>fixture.plot.pad.t&&y+r<fixture.plot.h-fixture.plot.pad.b);
 }
 const fixture=nativePlot(files[1].current);draw(files[1].current,'longdivision',{rem:0},fixture.plot);
 const [x,y]=fixture.calls.at(-1).args;numericEqual(x,fixture.plot.x(2));numericEqual(y,fixture.plot.y(3));
});
test('collision uses the exact excluded input; a nearby distinct real input stays a finite hole',()=>{
 const after=draw(files[0].current,'holes',{c:2.01});assert.equal(after.plot.points.length,1);numericEqual(after.plot.points[0][1],3.01/.01);assert.ok(after.plot.points[0][1]<after.plot.b.ymax);
 const exact=draw(files[0].current,'holes',{c:2});assert.equal(exact.plot.points.length,0);assert.deepEqual(exact.plot.verticals,[2]);
});
