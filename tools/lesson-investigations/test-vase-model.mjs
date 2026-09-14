import assert from 'node:assert/strict';
import {VESSELS,radiusAt,volumeAt,heightAtVolume,vesselState,vesselMesh,projectPoint} from '../../lessons/shared/investigations/vase-model.mjs';
const near=(a,b,t=1e-9)=>assert.ok(Math.abs(a-b)<=t,`${a} vs ${b}`);
for(const name of Object.keys(VESSELS)) {
  const s=VESSELS[name], r0=s.radius,rt=radiusAt(name,12);
  // Independent frustum formula and midpoint quadrature, not the model polynomial.
  near(volumeAt(name,12),Math.PI*12*(r0*r0+r0*rt+rt*rt)/3);
  for(const h of [0,.01,1,3,6,11.9,12]) {
    near(heightAtVolume(name,volumeAt(name,h)),h);
    let sum=0;const n=10000;
    for(let i=0;i<n;i++){const r=r0+(rt-r0)*((i+.5)*h/n)/12;sum+=Math.PI*r*r*h/n;}
    near(volumeAt(name,h),sum,1e-5);
  }
  const state=vesselState({shape:name,fraction:0});near(state.height,0);
  const end=vesselState({shape:name,fraction:1});near(end.height,12);
  const rows=state.rows;for(let i=1;i<rows.length;i++)near(rows[i].volume-rows[i-1].volume,state.capacity/6);
  if(name==='cylinder')state.rates.forEach(x=>near(x,10/(9*Math.PI)));
  else for(let i=1;i<state.rates.length;i++)assert.ok(name==='widening'?state.rates[i]<state.rates[i-1]:state.rates[i]>state.rates[i-1]);
  const mesh=vesselMesh(name);assert.equal(mesh.length,13);assert.equal(mesh[0].length,24);
  for(const ring of mesh)for(const p of ring)near(p.x*p.x+p.z*p.z,radiusAt(name,p.y)**2);
}
near(volumeAt('widening',12),volumeAt('narrowing',12));
assert.notEqual(vesselState({shape:'widening'}).height,vesselState({shape:'narrowing'}).height);
near(projectPoint({x:1,y:0,z:0},{azimuth:0,elevation:0}).x,208);
near(projectPoint({x:1,y:0,z:0},{azimuth:90,elevation:0}).x,190);
near(projectPoint({x:0,y:1,z:0},{azimuth:0,elevation:0}).y,262);
for(const bad of [NaN,Infinity,-1,13,'4'])assert.throws(()=>radiusAt('cylinder',bad));
for(const bad of [NaN,Infinity,-.1,1.1,'0.5'])assert.throws(()=>vesselState({fraction:bad}));
for(const bad of [0,-1,NaN,Infinity,101,'10'])assert.throws(()=>vesselState({flow:bad}));
assert.throws(()=>vesselMesh('widening',{segments:100}));assert.throws(()=>vesselMesh('widening',{levels:0}));
assert.throws(()=>volumeAt('__proto__',1));assert.throws(()=>projectPoint({x:NaN,y:0,z:0}));
assert.throws(()=>heightAtVolume('cylinder',-1));assert.throws(()=>heightAtVolume('cylinder',10000));
console.log('PASS vessel model: independent volume, inverse, rates, geometry, projection and invalid domains');
