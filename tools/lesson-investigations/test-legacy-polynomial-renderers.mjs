import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';

// Actual isolated renderer methods with a recording Plot/formatter seam.
// No DOM/canvas pixels, native browser, storage or access-control claim.
const arg=name=>{const i=process.argv.indexOf(name);return i<0?null:process.argv[i+1];};
const location=dirname(fileURLToPath(import.meta.url));
const packaged=location.endsWith('lesson-investigations');
const here=resolve(arg('--repo')||resolve(location,packaged?'../..':'..'));
const baseline=arg('--baseline-root');
if(packaged&&!baseline)throw new Error('Supply --baseline-root with the exact retained lesson originals.');
const source=resolve(baseline||resolve(here,'original'));
const receipt=JSON.parse(readFileSync(resolve(location,packaged?'polynomial-source-preservation.json':'../SOURCE_PRESERVATION.json'),'utf8'));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const files=receipt.files.map(row=>({row,old:readFileSync(resolve(source,row.path)),current:readFileSync(resolve(here,row.path))}));
const method=(raw,name)=>{
  const matches=[...raw.toString('utf8').matchAll(new RegExp('^    '+name+'\\(p,v,read\\)\\{[^\\r\\n]*','gm'))];
  assert.equal(matches.length,1);return matches[0][0];
};
const extract=(raw,name)=>vm.runInNewContext('({'+method(raw,name)+'})['+JSON.stringify(name)+']',{nice:n=>String(n)},{timeout:1000});
const invoke=(raw,name,value)=>{
  const plot={points:[],lines:[],curves:[],grid(title){this.title=title;},curve(fn){this.curves.push(fn);},point(...args){this.points.push(args);},line(...args){this.lines.push(args);}};
  const read={textContent:''};extract(raw,name)(plot,value,read);return{plot,text:read.textContent};
};
const near=(a,b)=>assert.ok(Math.abs(a-b)<=1e-10*Math.max(1,Math.abs(b)),`${a} != ${b}`);

test('exact source pins and inverse method substitution preserve all remaining bytes',()=>{
  assert.equal(files.length,2);
  for(const {row,old,current} of files){
    assert.equal(hash(old),row.original_sha256);assert.equal(hash(current),row.candidate_sha256);
    let inverse=current.toString('utf8');
    for(const change of row.changed_methods){
      const before=method(old,change.method),after=method(current,change.method);
      assert.equal(hash(Buffer.from(before)),change.old_sha256);assert.equal(hash(Buffer.from(after)),change.new_sha256);
      inverse=inverse.replace(after,before);
    }
    assert.ok(Buffer.from(inverse).equals(old));
    const script=raw=>[...raw.toString('utf8').matchAll(/<script[^>]*>(.*?)<\/script>/gs)].map(m=>m[1]);
    assert.equal(hash(Buffer.from(script(current)[2])),row.assessment_script_sha256);
    for(const i of [0,2,3])assert.equal(script(current)[i],script(old)[i]);
  }
});
test('zero scale is an explicit zero-polynomial state in both source families',()=>{
  for(const mode of [0,1]){
    const state=invoke(files[0].current,'polyfeatures',{mode,lead:0});
    assert.match(state.text,/degree and leading coefficient are not defined/);
    assert.match(state.text,/every real input is a zero/);assert.equal(state.plot.title,'Zero polynomial');
    for(const x of [-4,0,2,5])near(state.plot.curves[0](x),0);
    assert.match(invoke(files[0].old,'polyfeatures',{mode,lead:0}).text,/Degree is [34]/);
  }
});
test('every nonzero legacy scale keeps its original formula and readout',()=>{
  for(const mode of [0,1])for(let q=-8;q<=8;q++)if(q!==0){
    const value={mode,lead:q/4},before=invoke(files[0].old,'polyfeatures',value),after=invoke(files[0].current,'polyfeatures',value);
    assert.equal(after.text,before.text);assert.equal(after.plot.title,before.plot.title);
    for(const x of [-4,-2,0,1,3,4])near(after.plot.curves[0](x),before.plot.curves[0](x));
  }
});
test('all 290 allowed secants and the full displayed polynomial fit the repaired bounds',()=>{
  let checked=0;
  for(let i=-16;i<=12;i++)for(let j=1;j<=10;j++){
    const value={u:i/4,h:j/4},after=invoke(files[0].current,'polyintervalrates',value),before=invoke(files[0].old,'polyintervalrates',value),{plot}=after;
    assert.equal(after.text,before.text);assert.equal(plot.points.length,2);
    for(const [x,y] of plot.points){assert.ok(x>plot.b.xmin&&x<plot.b.xmax);assert.ok(y>plot.b.ymin&&y<plot.b.ymax);}
    for(let s=0;s<=200;s++){
      const x=plot.b.xmin+(plot.b.xmax-plot.b.xmin)*s/200,y=plot.curves[0](x);
      assert.ok(y>=plot.b.ymin&&y<=plot.b.ymax);
      near(y,.15*(x+3)*(x+1)*(x-2)*(x-4));
    }
    checked++;
  }
  assert.equal(checked,290);
  const old=invoke(files[0].old,'polyintervalrates',{u:3,h:2.5});assert.ok(old.plot.points[1][0]>old.plot.b.xmax);
});
test('zero mixer satisfies both identities; all nonzero categories remain unchanged',()=>{
  for(let e=-15;e<=15;e++)for(let o=-15;o<=15;o++){
    const value={even:e/10,odd:o/10},after=invoke(files[1].current,'symmetry',value);
    if(e===0&&o===0){assert.match(after.text,/both even and odd \(the zero function\)/);assert.doesNotMatch(invoke(files[1].old,'symmetry',value).text,/both even and odd/);}
    else assert.equal(after.text,invoke(files[1].old,'symmetry',value).text);
    for(const x of [-2,-.5,0,1,2]){
      near(after.plot.curves[0](x),value.even*(x*x-2)+value.odd*(x*x*x-x));
      near(after.plot.curves[1](x),after.plot.curves[0](-x));
    }
  }
});
