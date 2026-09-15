import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
const arg=name=>{const i=process.argv.indexOf(name);return i<0?null:process.argv[i+1];};
const location=dirname(fileURLToPath(import.meta.url));
const repo=resolve(arg('--repo')||resolve(location,'../..'));
const baseline=arg('--baseline-root');
if(!baseline)throw new Error('Supply --baseline-root containing the one pinned original lesson.');
const record=JSON.parse(readFileSync(resolve(location,'ap17-source-preservation.json'),'utf8'));
const old=readFileSync(resolve(baseline,record.path));
const current=readFileSync(resolve(repo,record.path));
const hash=b=>createHash('sha256').update(b).digest('hex');
const source=current.toString('utf8');
const method=(text,name)=>{const rows=text.match(new RegExp('^    '+name+'\\(p,v,read\\)\\{[^\\r\\n]*','gm'));assert.equal(rows?.length,1);return rows[0];};
const invoke=(text,name,v={})=>{
 const fn=vm.runInNewContext('({'+method(text,name)+'})['+JSON.stringify(name)+']',{}, {timeout:1000});
 const plot={curves:[],vertical:[],horizontal:[],grid(t){this.title=t;},curve(f,c,w,lo=this.b.xmin,hi=this.b.xmax){this.curves.push({f,lo,hi});},asymV(x){this.vertical.push(x);},asymH(y,label){this.horizontal.push({y,label});}};
 const read={textContent:''};fn(plot,v,read);return {plot,read:read.textContent};
};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-10*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const cases=[{name:'rationalendworked',caption:'unit-figure-caption-17',f:x=>(-4*x**5+x)/(2*x**5-7),poles:[(7/2)**(1/5)],atZero:0},{name:'rationalendstudent',caption:'unit-figure-caption-18',f:x=>(6*x**4-x+2)/(-3*x**4+5),poles:[-((5/3)**(1/4)),(5/3)**(1/4)],atZero:0.4}];
test('one exact original source and reversible changes preserve every other byte',()=>{
 assert.equal(hash(old),record.original_sha256);assert.equal(hash(current),record.candidate_sha256);
 assert.equal(old.length,record.original_bytes);assert.equal(current.length,record.candidate_bytes);
 let inverse=source;
 const insertion=['rationalendworked','rationalendstudent'].map(name=>method(source,name)+'\n').join('');
 assert.equal(hash(Buffer.from(insertion)),record.insertion_sha256);
 assert.equal(inverse.split(insertion).length-1,1);inverse=inverse.replace(insertion,'');
 for(const change of record.canvas_changes){
   const pattern=new RegExp('<canvas\\b[^>]*aria-describedby="'+change.identity+'"[^>]*></canvas>','g');
   const before=old.toString('utf8').match(pattern),after=source.match(pattern);
   assert.equal(before?.length,1);assert.equal(after?.length,1);
   assert.equal(hash(Buffer.from(before[0])),change.before_sha256);assert.equal(hash(Buffer.from(after[0])),change.after_sha256);
   inverse=inverse.replace(after[0],before[0]);
 }
 assert.ok(Buffer.from(inverse).equals(old));
 const scripts=b=>[...b.toString('utf8').matchAll(/<script[^>]*>(.*?)<\/script>/gs)].map(m=>m[1]);
 for(const i of [0,2,3])assert.equal(scripts(current)[i],scripts(old)[i]);
});
test('only the two named canvas identities select their declared formulas',()=>{
 for(const row of cases){const canvas=source.match(new RegExp('<canvas\\b[^>]*aria-describedby="'+row.caption+'"[^>]*>','g'));assert.equal(canvas?.length,1);assert.ok(canvas[0].includes('data-static-visual="'+row.name+'"'));assert.equal(source.match(new RegExp('data-static-visual="'+row.name+'"','g'))?.length,1);}
 assert.equal(method(source,'rationalend'),method(old.toString('utf8'),'rationalend'));
});
test('red control reproduces the original positive two asymptote on both figures',()=>{
 for(const row of cases){assert.ok(old.toString('utf8').match(new RegExp('<canvas\\b[^>]*data-static-visual="rationalend"[^>]*aria-describedby="'+row.caption+'"')));const result=invoke(old.toString('utf8'),'rationalend',{gap:0});assert.equal(result.plot.horizontal[0].y,2);assert.equal(result.plot.curves[0].f(0),1);}
});
test('explicit rules retain their distinct original values and both approach negative two',()=>{
 for(const row of cases){const result=invoke(source,row.name);assert.deepEqual(result.plot.horizontal,[{y:-2,label:'y = -2'}]);near(result.plot.curves.find(c=>c.lo<=0&&c.hi>=0).f(0),row.atZero);for(const x of [-1e4,1e4])near(row.f(x),-2);for(const x of [-6,-3,-1,0,1,3,6]){const curve=result.plot.curves.find(c=>c.lo<=x&&c.hi>=x);assert.ok(curve);const expected=row.f(x);if(expected>=result.plot.b.ymin&&expected<=result.plot.b.ymax)near(curve.f(x),expected);else assert.ok(Number.isNaN(curve.f(x)));}}
});
test('separate graph domains never span a pole and no sample is clamped to the frame',()=>{
 let samples=0;
 for(const row of cases){const {plot}=invoke(source,row.name);assert.equal(plot.curves.length,row.poles.length+1);assert.equal(plot.vertical.length,row.poles.length);row.poles.forEach((p,i)=>near(plot.vertical[i],p));for(const curve of plot.curves){assert.ok(curve.lo<curve.hi);for(const p of row.poles)assert.ok(!(curve.lo<=p&&curve.hi>=p));for(let i=0;i<=2000;i++){const x=curve.lo+(curve.hi-curve.lo)*i/2000,y=curve.f(x),expected=row.f(x);if(Number.isFinite(y)){assert.ok(y>=plot.b.ymin&&y<=plot.b.ymax);near(y,expected);}else assert.ok(expected<plot.b.ymin||expected>plot.b.ymax);samples++;}}}
 assert.equal(samples,10005);
});
test('new renderer methods have no write, event, network, or arbitrary expression authority',()=>{
 for(const row of cases)assert.doesNotMatch(method(source,row.name),/localStorage|sessionStorage|fetch\(|XMLHttpRequest|eval\(|Function\(|dispatchEvent|addEventListener|LESSON_CONFIG|LESSON_DATA/);
});
