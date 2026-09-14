/* Independent geometry/unit/render-budget checks; native layout is separate. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {vesselState,heightAtVolume,vesselMesh,projectPoint} from '../../lessons/shared/investigations/vase-model.mjs';
import {vesselDrawing} from '../../lessons/shared/investigations/visuals.mjs';
const require=createRequire(import.meta.url);
const {parseHTML}=require(process.env.ECHS_TEST_DOM_MODULE||'linkedom');
const {document}=parseHTML('<html><body></body></html>');
const near=(a,b,t=1e-9)=>assert.ok(Math.abs(a-b)<=t,`${a} versus ${b}`);
let passed=0,maxPolygons=0,maxNodes=0,minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
function group(name,fn){fn();passed++;console.log('PASS '+name);}
group('inverse dimensions independently match cylinder and reversed-frustum geometry',()=>{
  for(const f of [0,.01,.25,.5,.8,.99,1]){
    const widening=vesselState({shape:'widening',fraction:f}),narrowing=vesselState({shape:'narrowing',fraction:1-f});
    near(widening.capacity,84*Math.PI);near(vesselState({shape:'cylinder'}).capacity,108*Math.PI);
    near(widening.height,4*(Math.cbrt(1+63*f)-1));near(widening.height+narrowing.height,12);
    near(vesselState({shape:'cylinder',fraction:f}).height,12*f);
  }
});
group('flow changes time and interval rates while preserving height and equal-volume samples',()=>{
  for(const shape of ['cylinder','widening','narrowing']){
    const slow=vesselState({shape,fraction:.45,flow:2}),fast=vesselState({shape,fraction:.45,flow:20});
    near(slow.height,fast.height);near(slow.time,10*fast.time);near(slow.duration,10*fast.duration);
    for(let i=1;i<7;i++){
      near(slow.rows[i].volume-slow.rows[i-1].volume,slow.capacity/6);
      near(slow.rows[i].time-slow.rows[i-1].time,slow.capacity/12);
      near(fast.rates[i-1],10*slow.rates[i-1]);
    }
    const state=vesselState({shape,fraction:.5});
    const r=shape==='cylinder'?3:shape==='widening'?1+state.height/4:4-state.height/4;
    const dV=state.capacity*1e-6;
    const derivative=(heightAtVolume(shape,state.volume+dV)-heightAtVolume(shape,state.volume-dV))/(2*dV);
    near(derivative,1/(Math.PI*r*r),1e-9);
  }
});
group('sampled mesh has true radii, horizontal rings and bounded immutable allocation',()=>{
  for(const shape of ['cylinder','widening','narrowing'])for(const h of [0,3,8,12]){
    const mesh=vesselMesh(shape,{height:h,levels:8,segments:24});assert.equal(mesh.length,9);
    for(let j=0;j<mesh.length;j++)for(const p of mesh[j]){
      const r=shape==='cylinder'?3:shape==='widening'?1+p.y/4:4-p.y/4;
      near(p.y,h*j/8);near(Math.hypot(p.x,p.z),r);assert.ok(Object.isFrozen(p));
    }
    assert.ok(Object.isFrozen(mesh));assert.ok(Object.isFrozen(mesh[0]));
  }
  const maximum=vesselMesh('widening',{levels:24,segments:48});assert.equal(maximum.flat().length,1200);
  for(const options of [{levels:25},{segments:49},{levels:1.5},{segments:NaN},{height:13}])assert.throws(()=>vesselMesh('widening',options));
});
group('orthographic rotations preserve lengths and use one common spatial scale',()=>{
  for(const azimuth of [-180,-90,-35,0,35,90,180])for(const elevation of [-20,0,18,45])for(const p of [{x:1,y:0,z:0},{x:0,y:1,z:0},{x:0,y:0,z:1},{x:3,y:12,z:-4}]){
    const q=projectPoint(p,{azimuth,elevation,scale:18});
    const projectedSquared=((q.x-190)/18)**2+((280-q.y)/18)**2+q.depth*q.depth;
    near(projectedSquared,p.x*p.x+p.y*p.y+p.z*p.z,1e-10);
  }
});
group('actual SVG has finite bounded geometry and accessible numerical description',()=>{
  for(const shape of ['cylinder','widening','narrowing'])for(const fraction of [0,.5,1])for(const elevation of [-20,0,45])for(const azimuth of [-180,-90,0,90,180])for(const cutaway of [true,false]){
    const svg=vesselDrawing(document,vesselState({shape,fraction}),{azimuth,elevation},cutaway);
    assert.equal(svg.getAttribute('role'),'img');assert.match(svg.getAttribute('aria-label'),/Water height .* cm; volume .* cubic centimetres/);assert.ok(svg.querySelector('title'));
    const polygons=svg.querySelectorAll('polygon');assert.equal(polygons.length,(cutaway?144:192)+(fraction===0?0:193));
    maxPolygons=Math.max(maxPolygons,polygons.length);maxNodes=Math.max(maxNodes,svg.querySelectorAll('*').length);
    const [, ,width,height]=svg.getAttribute('viewBox').split(' ').map(Number);
    let currentLowest=-Infinity;
    for(const node of polygons)for(const pair of node.getAttribute('points').split(' ')){
      const [x,y]=pair.split(',').map(Number);assert.ok(Number.isFinite(x)&&Number.isFinite(y));
      assert.ok(x>=0&&x<=width&&y>=0&&y<=height,'geometry must fit viewBox');
      minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
      currentLowest=Math.max(currentLowest,y);
    }
    const caption=[...svg.querySelectorAll('text')].find(n=>n.textContent===(cutaway?'Cutaway exposes the water surface':'Complete vessel surface'));
    assert.ok(Number(caption.getAttribute('y'))-currentLowest>20,'Caption clearance over20 SVG units for all reachable extrema');
  }
  assert.equal(vesselDrawing(document,vesselState(),undefined,false).querySelectorAll('polygon').length,385);
});
group('caption stays below reachable projected geometry with readable separation',()=>{
  const svg=vesselDrawing(document,vesselState({shape:'narrowing',fraction:1}),{azimuth:0,elevation:45});
  const caption=[...svg.querySelectorAll('text')].find(n=>n.textContent==='Cutaway exposes the water surface');
  const captionBaseline=Number(caption.getAttribute('y'));
  const lowest=Math.max(...[...svg.querySelectorAll('polygon')].flatMap(n=>n.getAttribute('points').split(' ').map(pair=>Number(pair.split(',')[1]))));
  assert.ok(captionBaseline-lowest>20,`Caption baseline ${captionBaseline}; geometry extends to ${lowest}. Reserve over20 SVG units.`);
});
console.log(JSON.stringify({status:'PASS',groups:passed,max_polygons:maxPolygons,max_svg_nodes:maxNodes,projected_bounds:{minX,maxX,minY,maxY},native_browser:false,layout_checked:false,three_webgl_engine:false}));
