/* Independent mathematical checks for the six added practice families. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import fs from 'node:fs';
const require=createRequire(import.meta.url),base=new URL('../lessons/ap-precalculus/unit-1/',import.meta.url);
const C=require(new URL('assets/tandem-context-models-v4.js',base).pathname),Q=require(new URL('assets/tandem-1-1-questions-v3.js',base).pathname);
const extra=Q.questions.filter(q=>q.id.startsWith('ex')),near=(a,b,e=1e-8)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`),key=q=>q.choices[q.answer];
assert.equal(extra.length,48);for(const family of new Set(extra.map(q=>q.family)))assert.equal(extra.filter(q=>q.family===family).length,8);
for(const q of extra){assert.equal(new Set(q.choices).size,4,q.id);assert.ok(q.hint&&q.solution&&q.ek);}
for(const q of extra.slice(0,6)){
 const a=q.audit,found=a.behaviors.map((b,i)=>[b,i]).filter(([b])=>b.toLowerCase().includes(a.target==='up'?'increasing':'decreasing'));
 assert.equal(found.length,1);const i=found[0][1];assert.equal(key(q),`${a.bounds[i]} &lt; x &lt; ${a.bounds[i+1]}`);
}
for(const q of extra.slice(8,14)){
 const text=key(q),b=q.audit.behavior;assert.ok(text.includes('f is '+(b.startsWith('Positive')?'increasing':'decreasing')));
 assert.ok(text.includes('concave '+(b.endsWith('increasing')?'up':'down')));
}
// Difference quotients at samples provide independent evidence of rate trends and sign changes.
for(const q of extra.slice(16,22)){
 const p=q.audit,h=.0001,rate=x=>(C.cubic(x+h,p)-C.cubic(x-h,p))/(2*h),rates=Array.from({length:19},(_,i)=>rate(p.lo+(i+1)*(p.hi-p.lo)/20));
 assert.ok(rates.some(r=>r>0)&&rates.some(r=>r<0));const inc=rates.every((r,i)=>!i||r>rates[i-1]),dec=rates.every((r,i)=>!i||r<rates[i-1]);
 assert.ok(inc||dec);assert.equal(key(q),`The rate of change is ${inc?'increasing':'decreasing'}.`);
}
for(const radius of [2,3,4,5])for(const period of [8,10,12,16])for(const gap of [0,1,2])for(const start of ['near','far']){
 const p={radius,period,gap,start},expected=start==='near'?[gap,gap+radius,gap+2*radius,gap+radius,gap]:[gap+2*radius,gap+radius,gap,gap+radius,gap+2*radius];
 expected.forEach((d,i)=>near(C.car(i*period/4,p).distance,d));
 for(let i=0;i<50;i++){const t=i*period/13,c=C.car(t,p);near(c.x*c.x+c.y*c.y,radius*radius);near(c.distance,gap+radius-c.x);near(c.distance,C.car(t+period,p).distance);}
}
for(const q of extra.slice(24,28)){assert.equal(q.audit.order[q.answer],'correct');assert.ok(q.solution.startsWith(key(q)+'.'));}
for(const q of extra.slice(32,36)){assert.equal(q.audit.order[q.answer],q.audit.target);assert.ok(q.solution.startsWith(key(q)+'.'));}
// Independent midpoint quadrature confirms vessel volumes; inverse mapping conserves supplied water.
for(const name of Object.keys(C.vessels)){
 let integral=0;const n=12000;for(let i=0;i<n;i++)integral+=C.area(name,(i+.5)*12/n)*12/n;near(integral,C.volume(name),1e-5);
 for(const flow of [20,30,40])for(let i=0;i<=100;i++){const t=C.volume(name)*i/(100*flow),h=C.waterHeight(name,t,flow);assert.ok(h>=0&&h<=12);near(C.volume(name,h),flow*t,1e-6);}
}
near(C.volume('neck'),528);near(C.volume('cylinder'),588);near(C.waterHeight('neck',528/30,30),12);
const depthRate=(name,h,flow=30)=>{const t=C.volume(name,h)/flow,d=.0001;return(C.waterHeight(name,t+d,flow)-C.waterHeight(name,t-d,flow))/(2*d);};
assert.ok(depthRate('neck',7)>depthRate('neck',1));near(depthRate('neck',9),depthRate('neck',11),1e-6);
assert.ok(depthRate('widening',7)<depthRate('widening',1));assert.ok(depthRate('hourglass',5)>depthRate('hourglass',1));assert.ok(depthRate('hourglass',11)<depthRate('hourglass',7));
// Bisection verifies impact independently of the closed-form implementation.
for(const q of extra.slice(40,44)){
 const p=q.audit;let lo=0,hi=10;for(let i=0;i<70;i++){const mid=(lo+hi)/2;if(C.projectile(mid,p)>0)lo=mid;else hi=mid;}const impact=(lo+hi)/2,f=C.flight(p);
 near(f.impact,impact);near(C.projectile(f.impact,p),0);near(C.projectile(f.peakTime-.01,p),C.projectile(f.peakTime+.01,p));
 near(f.peakHeight,C.projectile(f.peakTime,p));near(f.fallTime,impact-f.peakTime);
 assert.ok(key(q).includes(f.peakHeight.toFixed(3)+' m'));assert.ok(key(q).includes(f.fallTime.toFixed(3)+' s after reaching its maximum height'));
}
const standaloneAnswers={ex07:'Decreasing and linear',ex08:'The graph is concave up.',ex15:'f is decreasing, and its graph is concave up.',ex16:'A function whose positive rate decreases from 9 to 3',ex23:'f increases throughout; its rate first increases, then decreases.',ex24:'From x = −1 to x = 1, f decreases while the graph flattens and the rate increases.',ex29:'1.5 m and 8.5 m',ex30:'10 &lt; t &lt; 20',ex31:'3.3 m',ex32:'The time between successive minima is halved; minimum and maximum distances stay the same.',ex37:'The depth increase in the 12 cm² section is four times that in the 48 cm² section.',ex38:'Draw a rising concave-up portion followed by a steep straight rise.',ex39:'The graph alone does not establish that the tank narrows upward.',ex40:'A continuous increasing graph with a steeper straight segment after t = 6',ex45:'2.483 s',ex46:'Its maximum height is 24 m at release; it then decreases with concave-down behavior.',ex47:'[0, 19.6] meters',ex48:'The rate decreases throughout, changing from positive to zero to negative.'};
for(const [id,answer] of Object.entries(standaloneAnswers))assert.equal(key(extra.find(q=>q.id===id)),answer);
const html=fs.readFileSync(new URL('AP_Precalculus_1.1_Change_in_Tandem_ECHS_Refined.html',base),'utf8');
assert.equal((html.match(/data-context-lab=/g)||[]).length,4);
for(const [skill,id] of [['rate-tables','ex01'],['direction-rate','ex09'],['curve-rate','ex17'],['toy-car','ex25'],['filling-vessels','ex33'],['projectile-height','ex41']])assert.ok(html.indexOf(`id="${skill}"`)<html.indexOf(`data-question="${id}"`));
console.log('Context mathematics: PASS (48 items; geometry, graph-rate signs, volume conservation, roots, rounding and prerequisite order).');
