import assert from 'node:assert/strict';
import {buildModel,SHAPES} from '../lessons/ap-calculus/unit-8/assets/volume-model.mjs';
import {sectionProfile,volumeMesh} from '../lessons/ap-calculus/unit-8/assets/volume-renderer.mjs';

const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function polygonArea(p){return Math.abs(p.reduce((s,q,i)=>{const r=p[(i+1)%p.length];return s+q[0]*r[1]-r[0]*q[1];},0))/2;}
function meshVolume(faces){let v=0;for(const {points:p} of faces)for(let i=1;i<p.length-1;i++)v+=dot(p[0],cross(p[i],p[i+1]))/6;return v;}
let checks=0,maxRelativeError=0;
function close(actual,expected,tol=1e-10){checks++;assert.ok(Math.abs(actual-expected)<=tol,`${actual} != ${expected}`);}
function verifyMesh(model,expected,state={}){
 const faces=volumeMesh(model,{showSlice:false,cutaway:false,...state});
 const actual=meshVolume(faces),relative=Math.abs(actual-expected)/expected;
 maxRelativeError=Math.max(maxRelativeError,relative);checks++;
 assert.ok(relative<.012,`${model.id}/${model.shape}: oriented mesh volume ${actual}, analytic ${expected}, error ${relative}`);
 for(const face of faces)for(const p of face.points)assert.ok(p.every(Number.isFinite));
 return faces;
}
// Shoelace areas are calculated directly from rendered profile vertices.
const coefficients={square:1,rectangle:2,equilateral:Math.sqrt(3)/4,'right-leg':.5,'right-hypotenuse':.25,semicircle:Math.PI/8};
for(const axis of ['x','y'])for(const shape of SHAPES){
 const m=buildModel({scenario:`cross-${axis}`,shape:shape.id});
 for(const t of [0,.1,.25,.5,.8,1]){
  const w=axis==='x'?t-t*t:Math.sqrt(t)-t,expected=coefficients[shape.id]*w*w;
  close(polygonArea(sectionProfile(m,t)),expected,shape.id==='semicircle'?expected*.000402+1e-12:1e-12);
 }
 verifyMesh(m,coefficients[shape.id]/30);
}
// Vertex distances must agree with the generating curves for every shifted axis.
for(const axis of ['x','y'])for(const k of [-2,-1,0,1,2,3]){
 const m=buildModel({scenario:`shifted-washer-${axis}`,axisOffset:k});
 const expected=Math.PI*(axis==='x'?(k<=0?2-5*k:5*k-2)/15:(k<=0?1-2*k:2*k-1)/6);
 const faces=verifyMesh(m,expected);
 for(const f of faces)for(const p of f.points){
  const t=p[axis==='x'?0:1],rho=Math.hypot(p[axis==='x'?1:0]-k,p[2]);
  const a=Math.abs((axis==='x'?t*t:t)-k),b=Math.abs((axis==='x'?t:Math.sqrt(Math.max(0,t)))-k);
  close(Math.min(Math.abs(rho-a),Math.abs(rho-b)),0,1e-9);
 }
 // A 90-degree sweep occupies one quarter of the full rotational volume.
 verifyMesh(m,expected/4,{sweep:90});
}
for(const axis of ['x','y']){
 verifyMesh(buildModel({scenario:`disk-${axis}`}),8*Math.PI);
 verifyMesh(buildModel({scenario:`shell-${axis}`}),axis==='x'?2*Math.PI/15:Math.PI/6);
}
const sphere=buildModel({scenario:'pearl-y'});
close(sphere.exactVolume,4*Math.PI/3);
for(const t of [-1,-.5,0,.5,1])close(sphere.areaAt(t),Math.PI*(1-t*t));
const sphereFaces=verifyMesh(sphere,4*Math.PI/3);
for(const f of sphereFaces)for(const p of f.points)close(dot(p,p),1,1e-10);
for(const angle of [0,90,180,270,360]){
 const faces=volumeMesh(sphere,{showSlice:false,sweep:angle});
 if(angle===0)assert.equal(faces.length,0);
 else verifyMesh(sphere,4*Math.PI/3*angle/360,{sweep:angle});
}
console.log(`PASS: ${checks} geometry checks; profile areas, rotation axes, sphere equation, partial sweeps, outward face orientation and mesh volumes. Largest mesh discretization error ${(100*maxRelativeError).toFixed(3)}%. Exact displayed integrals are independent of mesh resolution.`);
