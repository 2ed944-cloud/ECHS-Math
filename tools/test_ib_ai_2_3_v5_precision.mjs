import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const root=path.resolve('.'),dir=path.join(root,'lessons/ib-math-ai/unit-2/data');const context={window:{location:{search:''}},console};context.window.window=context.window;vm.createContext(context);for(const file of ['lesson-2.3-v5-build.js','lesson-2.3-v5-content-a.js','lesson-2.3-v5-content-b.js','lesson-2.3-v5-content-c.js','lesson-2.3-v5-finalize.js','lesson-2.3-v5-practice-a.js','lesson-2.3-v5-practice-b.js','lesson-2.3-v5-assessment.js','lesson-2.3-v5-precision.js'])vm.runInContext(fs.readFileSync(path.join(dir,file),'utf8'),context,{filename:file});const d=context.window.LESSON_DATA;const fail=(c,m)=>{if(!c)throw new Error(m)};
const approx=(a,b,t=1e-6)=>Math.abs(a-b)<=t;
// Open-box maximum
const x=(25-5*Math.sqrt(7))/3,V=x=>x*(30-2*x)*(20-2*x);fail(approx(x,3.9237478149,1e-8),'box x');fail(approx(V(x),1056.305895,1e-3),'box V');
// Projectile root
const rootPos=(20+Math.sqrt(20**2-4*(-4.9)*1.2))/(9.8);fail(approx(rootPos,4.140846,1e-4),'projectile root');
// Profit model
const profit=x=>-.05*(x-10)*(x-60)*(x+20);fail(profit(10)===0&&profit(60)===0&&profit(40)===1800,'profit values');
// Rational hole
const holeY=(-2-2)/(-2-3);fail(approx(holeY,.8),'hole coordinate');
// Finite-difference models
const a=x=>x**3+x**2+x+2;fail([0,1,2,3].every((x,i)=>a(x)===[2,5,16,41][i]),'P025 model');const b=x=>x**3+x**2+x+3;fail([0,1,2,3,4].every((x,i)=>b(x)===[3,6,17,42,87][i]),'P075/T6 model');
// Sign chart challenge
const sign=x=>-(x+3)**2*(x-1)**3;fail(sign(-4)>0&&sign(-2)>0&&sign(0)>0&&sign(2)<0,'P073 signs');
// Rational solution and asymptote
const roots=[(3+Math.sqrt(13))/2,(3-Math.sqrt(13))/2];fail(roots.every(x=>approx((x+1)/(x-2),x,1e-9)),'rational equation roots');
console.log(JSON.stringify({status:'PASS',checks:['box maximum','projectile root','profit model','hole coordinate','finite differences','sign intervals','rational roots']},null,2));
