/**
 * Unit 8 software 3D renderer. Geometry is in actual mathematical coordinates;
 * an orthographic camera projects it onto Canvas 2D with equal world scales.
 * No animation loop, listeners, storage, network, WebGL, or external dependencies.
 * The lesson controller owns interaction, reduced-motion policy, and lifecycle.
 */
const TAU = 2 * Math.PI;
const C = Object.freeze({ navy:'#17324d', teal:'#16838b', maroon:'#7d284b', gold:'#e6a63d', ink:'#243b53', muted:'#607487', grid:'#dbe5eb' });
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const finite=(n,fallback)=>Number.isFinite(n)?n:fallback;
const mix=(a,b,t)=>a+(b-a)*t;
const format=n=>Math.abs(n)<1e-9?'0':Number(n.toFixed(2)).toString();
const vecSub=(a,b)=>a.map((v,i)=>v-b[i]);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const length=v=>Math.hypot(...v);

function settings(state={}) {
  return {
    slice:clamp(finite(state.slice,.5),0,1), slices:Math.round(clamp(finite(state.slices,20),3,48)),
    mode:['solid','stack','slice'].includes(state.mode)?state.mode:'solid',
    sweep:clamp(finite(state.sweep,360),0,360), cutaway:!!state.cutaway,
    yaw:finite(state.yaw,-.65), pitch:clamp(finite(state.pitch,.42),-1.35,1.35),
    zoom:clamp(finite(state.zoom,1),.55,2.2), showRegion:state.showRegion!==false,
    showAxes:state.showAxes!==false, showSlice:state.showSlice!==false,
    buildFraction:clamp(finite(state.buildFraction,1),0,1)
  };
}

function setup(canvas) {
  if(!canvas || typeof canvas.getContext!=='function') return null;
  const ctx=canvas.getContext('2d');
  if(!ctx) return null;
  const rect=typeof canvas.getBoundingClientRect==='function'?canvas.getBoundingClientRect():{};
  if(rect.width===0||rect.height===0)return null;
  const width=Math.max(1,finite(rect.width,0)||canvas.clientWidth||canvas.width||600);
  const height=Math.max(1,finite(rect.height,0)||canvas.clientHeight||canvas.height||400);
  const dpr=clamp(finite(globalThis.devicePixelRatio,1),1,2);
  const pixelWidth=Math.round(width*dpr),pixelHeight=Math.round(height*dpr);
  if(canvas.width!==pixelWidth) canvas.width=pixelWidth;
  if(canvas.height!==pixelHeight) canvas.height=pixelHeight;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,width,height);
  ctx.lineJoin='round'; ctx.lineCap='round';
  const gradient=ctx.createLinearGradient(0,0,0,height);
  gradient.addColorStop(0,'#fcfeff'); gradient.addColorStop(1,'#edf4f7');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,width,height);
  return {ctx,width,height};
}

// The cross-section profile is in the transverse-coordinate / z plane.
// The planar base is always the diameter, side, leg, or hypotenuse specified.
export function sectionProfile(model,t) {
  const [lo,hi]=model.baseAt(t),w=Math.max(0,hi-lo),mid=(lo+hi)/2;
  switch(model.shape) {
    case 'rectangle':return [[lo,0],[hi,0],[hi,2*w],[lo,2*w]];
    case 'equilateral':return [[lo,0],[hi,0],[mid,Math.sqrt(3)*w/2]];
    case 'right-leg':return [[lo,0],[hi,0],[lo,w]];
    case 'right-hypotenuse':return [[lo,0],[hi,0],[mid,w/2]];
    case 'semicircle':return Array.from({length:65},(_,j)=>{
      const angle=Math.PI*(1-j/64);return [mid+w/2*Math.cos(angle),w/2*Math.sin(angle)];
    });
    default:return [[lo,0],[hi,0],[hi,w],[lo,w]];
  }
}
const profile=sectionProfile;
const sectionPoint=(model,t,q,z=0)=>model.axis==='x'?[t,q,z]:[q,t,z];
const radialPoint=(model,t,r,angle)=>model.axis==='x'
  ?[t,model.axisOffset+r*Math.cos(angle),r*Math.sin(angle)]
  :[model.axisOffset+r*Math.cos(angle),t,r*Math.sin(angle)];
const axisVector=(model,sign=1)=>model.axis==='x'?[sign,0,0]:[0,sign,0];
const radialVector=(model,angle,sign=1)=>model.axis==='x'?[0,sign*Math.cos(angle),sign*Math.sin(angle)]:[sign*Math.cos(angle),0,sign*Math.sin(angle)];
const basePoint=(model,t,q)=>model.kind==='shell'
  ?(model.axis==='y'?[t,q,0]:[q,t,0]):sectionPoint(model,t,q,0);
function radialSign(model,t) {
  const [lo,hi]=model.baseAt(t),k=model.axisOffset;
  return Math.abs(lo-k)>Math.abs(hi-k)?Math.sign(lo-k)||1:Math.sign(hi-k)||1;
}
function angularRange(model,s,t) {
  const phase=(model.kind==='shell'?Math.sign(t-model.axisOffset)||1:radialSign(model,t))<0?Math.PI:0;
  if(s.cutaway && s.sweep>=359.999) {
    // Remove the near quadrant, so the cut actually exposes the interior.
    const near=model.axis==='x'?Math.atan2(Math.cos(s.yaw)*Math.cos(s.pitch),Math.sin(s.pitch))
      :Math.atan2(Math.cos(s.yaw),-Math.sin(s.yaw));
    return [near+Math.PI/4,near+TAU-Math.PI/4];
  }
  return [phase,phase+s.sweep*Math.PI/180];
}

function meshBuilder() {
  const polygons=[];
  return {polygons, add(points,type='body',edge=false,outward=null) {
    if(points.length<3||points.some(p=>p.some(v=>!Number.isFinite(v))))return;
    let normal=[0,0,0];
    for(let j=1;j<points.length-1&&length(normal)<1e-12;j++)normal=cross(vecSub(points[j],points[0]),vecSub(points[j+1],points[0]));
    if(length(normal)<1e-12)return;
    if(outward&&normal.reduce((sum,v,i)=>sum+v*outward[i],0)<0){points=points.slice().reverse();normal=normal.map(v=>-v);}
    polygons.push({points,type,edge,normal});
  }};
}
function addCrossPrism(mesh,model,t0,t1,sample,type='body',edge=false) {
  const q=profile(model,sample),p0=q.map(([v,z])=>sectionPoint(model,t0,v,z)),p1=q.map(([v,z])=>sectionPoint(model,t1,v,z));
  mesh.add(p0,type,true,axisVector(model,-1));mesh.add(p1,type,true,axisVector(model));
  const sign=Math.sign(q.reduce((sum,p,j)=>{const r=q[(j+1)%q.length];return sum+p[0]*r[1]-r[0]*p[1];},0))||1;
  for(let j=0;j<q.length;j++) {const k=(j+1)%q.length,dq=q[k][0]-q[j][0],dz=q[k][1]-q[j][1];
    const outward=model.axis==='x'?[0,sign*dz,-sign*dq]:[sign*dz,0,-sign*dq];
    mesh.add([p0[j],p0[k],p1[k],p1[j]],type,edge,outward);}
}
function addCrossSolid(mesh,model,s) {
  const [a,b]=model.bounds,end=mix(a,b,s.buildFraction),n=80;
  if(end<=a)return;
  let prev=profile(model,a).map(([v,z])=>sectionPoint(model,a,v,z));
  for(let i=1;i<=n;i++) {
    const t=mix(a,end,i/n),next=profile(model,t).map(([v,z])=>sectionPoint(model,t,v,z));
    const q=profile(model,mix(a,end,(i-.5)/n)),sign=Math.sign(q.reduce((sum,p,j)=>{const r=q[(j+1)%q.length];return sum+p[0]*r[1]-r[0]*p[1];},0))||1;
    for(let j=0;j<next.length;j++){const k=(j+1)%next.length,dq=q[k][0]-q[j][0],dz=q[k][1]-q[j][1];
      const outward=model.axis==='x'?[0,sign*dz,-sign*dq]:[sign*dz,0,-sign*dq];
      mesh.add([prev[j],prev[k],next[k],next[j]],'body',false,outward);}
    if(i===1)mesh.add(prev,'cut',true,axisVector(model,-1));
    if(i===n)mesh.add(next,'cut',true,axisVector(model));
    prev=next;
  }
}
function addAnnulusFace(mesh,model,t,inner,outer,start,end,n,type='body',edge=false,sign=1) {
  for(let j=0;j<n;j++) {
    const u=mix(start,end,j/n),v=mix(start,end,(j+1)/n);
    mesh.add([radialPoint(model,t,inner,u),radialPoint(model,t,outer,u),radialPoint(model,t,outer,v),radialPoint(model,t,inner,v)],type,edge,axisVector(model,sign));
  }
}
function addTube(mesh,model,t0,t1,inner,outer,start,end,n,type='body',edge=false) {
  if(outer<1e-12||end-start<1e-8)return;
  for(let j=0;j<n;j++) {
    const u=mix(start,end,j/n),v=mix(start,end,(j+1)/n);
    mesh.add([radialPoint(model,t0,outer,u),radialPoint(model,t1,outer,u),radialPoint(model,t1,outer,v),radialPoint(model,t0,outer,v)],type,edge,radialVector(model,(u+v)/2));
    if(inner>1e-12)mesh.add([radialPoint(model,t0,inner,v),radialPoint(model,t1,inner,v),radialPoint(model,t1,inner,u),radialPoint(model,t0,inner,u)],type==='body'?'inner':type,edge,radialVector(model,(u+v)/2,-1));
  }
  addAnnulusFace(mesh,model,t0,inner,outer,start,end,n,type,edge,-1);
  addAnnulusFace(mesh,model,t1,inner,outer,start,end,n,type,edge);
  if(end-start<TAU-1e-7)for(const angle of [start,end])mesh.add([
    radialPoint(model,t0,inner,angle),radialPoint(model,t0,outer,angle),
    radialPoint(model,t1,outer,angle),radialPoint(model,t1,inner,angle)
  ],type==='body'?'cut':type,true,radialVector(model,angle+Math.PI/2,angle===start?-1:1));
}
function addRevolutionSolid(mesh,model,s) {
  const [a,b]=model.bounds,n=64,na=64,[start,end]=angularRange(model,s,(a+b)/2);
  if(end-start<1e-8)return;
  for(let i=0;i<n;i++) {
    const t0=mix(a,b,i/n),t1=mix(a,b,(i+1)/n),r0=model.radiiAt(t0),r1=model.radiiAt(t1);
    for(let j=0;j<na;j++) {
      const u=mix(start,end,j/na),v=mix(start,end,(j+1)/na);
      mesh.add([radialPoint(model,t0,r0.outer,u),radialPoint(model,t1,r1.outer,u),radialPoint(model,t1,r1.outer,v),radialPoint(model,t0,r0.outer,v)],'body',false,radialVector(model,(u+v)/2));
      if(r0.inner>1e-12||r1.inner>1e-12)mesh.add([radialPoint(model,t0,r0.inner,v),radialPoint(model,t1,r1.inner,v),radialPoint(model,t1,r1.inner,u),radialPoint(model,t0,r0.inner,u)],'inner',false,radialVector(model,(u+v)/2,-1));
    }
    if(end-start<TAU-1e-7)for(const angle of [start,end])mesh.add([
      radialPoint(model,t0,r0.inner,angle),radialPoint(model,t0,r0.outer,angle),
      radialPoint(model,t1,r1.outer,angle),radialPoint(model,t1,r1.inner,angle)
    ],'cut',false,radialVector(model,angle+Math.PI/2,angle===start?-1:1));
  }
  for(const t of [a,b]) {const r=model.radiiAt(t);addAnnulusFace(mesh,model,t,r.inner,r.outer,start,end,na,'cut',false,t===a?-1:1);}
}
function addShellSolid(mesh,model,s) {
  const [a,b]=model.bounds,n=64,na=64,[start,end]=angularRange(model,s,(a+b)/2);
  if(end-start<1e-8)return;
  for(let i=0;i<n;i++) {
    const t0=mix(a,b,i/n),t1=mix(a,b,(i+1)/n),p=model.shellAt(t0),q=model.shellAt(t1);
    for(let j=0;j<na;j++) {
      const u=mix(start,end,j/na),v=mix(start,end,(j+1)/na);
      for(const edge of ['low','high'])mesh.add([
        radialPoint(model,p[edge],p.radius,u),radialPoint(model,q[edge],q.radius,u),
        radialPoint(model,q[edge],q.radius,v),radialPoint(model,p[edge],p.radius,v)
      ],edge==='low'?'inner':'body',false,axisVector(model,edge==='low'?-1:1));
    }
    if(end-start<TAU-1e-7)for(const angle of [start,end])mesh.add([
      radialPoint(model,p.low,p.radius,angle),radialPoint(model,q.low,q.radius,angle),
      radialPoint(model,q.high,q.radius,angle),radialPoint(model,p.high,p.radius,angle)
    ],'cut',false,radialVector(model,angle+Math.PI/2,angle===start?-1:1));
  }
  for(const t of [a,b]) {const q=model.shellAt(t);addTube(mesh,model,q.low,q.high,q.radius,q.radius,start,end,na,'body');}
}
function addShellBand(mesh,model,t,dt,s,type='body',na=24) {
  const [a,b]=model.bounds,q=model.shellAt(t),left=clamp(t-dt/2,a,b),right=clamp(t+dt/2,a,b);
  const r0=Math.abs(left-model.axisOffset),r1=Math.abs(right-model.axisOffset),[start,end]=angularRange(model,s,t);
  addTube(mesh,model,q.low,q.high,Math.min(r0,r1),Math.max(r0,r1),start,end,na,type,type!=='body');
}

function buildMesh(model,s) {
  const mesh=meshBuilder(),[a,b]=model.bounds,dt=(b-a)/s.slices,t=mix(a,b,s.slice);
  if(s.mode==='solid') {
    if(model.kind==='cross')addCrossSolid(mesh,model,s);
    else if(model.kind==='shell')addShellSolid(mesh,model,s);
    else addRevolutionSolid(mesh,model,s);
  } else if(s.mode==='stack') {
    const na=Math.min(40,Math.max(12,Math.floor(2700/(s.slices*(model.kind==='disk'?3:4)))));
    for(let i=0;i<s.slices;i++) {
      const lo=a+i*dt,hi=lo+dt,mid=(lo+hi)/2;
      if(model.kind==='cross') {
        const builtEnd=mix(a,b,s.buildFraction);if(lo>=builtEnd)continue;
        addCrossPrism(mesh,model,lo,Math.min(hi,builtEnd),mid,'body',true);
      } else if(model.kind==='shell')addShellBand(mesh,model,mid,dt,s,'body',na);
      else {const r=model.radiiAt(mid),[start,end]=angularRange(model,s,mid);addTube(mesh,model,lo,hi,r.inner,r.outer,start,end,na,'body',true);}
    }
  }
  if(!s.showSlice)return mesh.polygons;
  if(model.kind==='cross')addCrossPrism(mesh,model,clamp(t-dt/2,a,b),clamp(t+dt/2,a,b),t,'selected',true);
  else if(model.kind==='shell')addShellBand(mesh,model,t,dt,s,'selected',40);
  else {
    const r=model.radiiAt(t),[start,end]=angularRange(model,s,t);
    addTube(mesh,model,clamp(t-dt/2,a,b),clamp(t+dt/2,a,b),r.inner,r.outer,start,end,40,'selected',true);
  }
  return mesh.polygons;
}

/** Pure mathematical mesh for independent geometry checks; no canvas required. */
export function volumeMesh(model,state={}) {return buildMesh(model,settings(state));}

function worldBounds(model) {
  const points=[],[a,b]=model.bounds;
  for(let i=0;i<=48;i++) {
    const t=mix(a,b,i/48),[lo,hi]=model.baseAt(t);
    points.push(basePoint(model,t,lo),basePoint(model,t,hi));
    if(model.kind==='cross')for(const [v,z]of profile(model,t))points.push(sectionPoint(model,t,v,z));
    else if(model.kind==='shell'){
      const q=model.shellAt(t);for(const v of [q.low,q.high])for(let j=0;j<8;j++)points.push(radialPoint(model,v,q.radius,j*TAU/8));
    } else {const q=model.radiiAt(t);for(let j=0;j<8;j++)points.push(radialPoint(model,t,q.outer,j*TAU/8));}
  }
  const lo=[0,1,2].map(k=>Math.min(...points.map(p=>p[k]))),hi=[0,1,2].map(k=>Math.max(...points.map(p=>p[k])));
  // Include the actual rotation axis, not a fictitious center of the object.
  if(model.kind!=='cross'){const k=model.axis==='x'?1:0;lo[k]=Math.min(lo[k],model.axisOffset);hi[k]=Math.max(hi[k],model.axisOffset);}
  for(let k=0;k<3;k++)if(hi[k]-lo[k]<1e-8){lo[k]-=.05;hi[k]+=.05;}
  return {lo,hi};
}
function camera(bounds,s,width,height) {
  const center=bounds.lo.map((v,i)=>(v+bounds.hi[i])/2),cy=Math.cos(s.yaw),sy=Math.sin(s.yaw),cp=Math.cos(s.pitch),sp=Math.sin(s.pitch);
  const rotate=p=>{const x=p[0]-center[0],y=p[1]-center[1],z=p[2]-center[2],rx=x*cy+z*sy,rz=-x*sy+z*cy;return [rx,y*cp-rz*sp,y*sp+rz*cp];};
  const corners=[];for(const x of [bounds.lo[0],bounds.hi[0]])for(const y of [bounds.lo[1],bounds.hi[1]])for(const z of [bounds.lo[2],bounds.hi[2]])corners.push(rotate([x,y,z]));
  const xs=corners.map(p=>p[0]),ys=corners.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  const padding=Math.min(width,height)*.13;
  const scale=Math.min((width-2*padding)/Math.max(.01,maxX-minX),(height-2*padding)/Math.max(.01,maxY-minY))*s.zoom;
  const ox=(minX+maxX)/2,oy=(minY+maxY)/2;
  return p=>{const q=rotate(p);return [width/2+(q[0]-ox)*scale,height/2-(q[1]-oy)*scale,q[2]];};
}
function path(ctx,points,close=true) {
  if(!points.length)return;ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);
  for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);if(close)ctx.closePath();
}
function color(hex,light=1,alpha=1) {
  const n=parseInt(hex.slice(1),16),rgb=[n>>16,(n>>8)&255,n&255].map(v=>Math.round(clamp(v*light,0,255)));
  return `rgba(${rgb.join(',')},${alpha})`;
}
function drawLine(ctx,p,q,stroke,width=1,dash=[]) {
  ctx.save();ctx.setLineDash(dash);ctx.strokeStyle=stroke;ctx.lineWidth=width;path(ctx,[p,q],false);ctx.stroke();ctx.restore();
}
function label(ctx,text,x,y,fill=C.ink,align='left') {
  ctx.save();ctx.font='600 12px system-ui, sans-serif';ctx.textAlign=align;ctx.textBaseline='middle';
  ctx.lineWidth=4;ctx.strokeStyle='rgba(250,253,255,.93)';ctx.strokeText(text,x,y);ctx.fillStyle=fill;ctx.fillText(text,x,y);ctx.restore();
}
function drawBase3D(ctx,model,s,project) {
  const [a,b]=model.bounds,points=[];
  for(let i=0;i<=56;i++){const t=mix(a,b,i/56);points.push(basePoint(model,t,model.baseAt(t)[0]));}
  for(let i=56;i>=0;i--){const t=mix(a,b,i/56);points.push(basePoint(model,t,model.baseAt(t)[1]));}
  path(ctx,points.map(project));ctx.fillStyle='rgba(125,40,75,.13)';ctx.fill();ctx.strokeStyle='rgba(125,40,75,.65)';ctx.lineWidth=1.4;ctx.stroke();
  const t=mix(a,b,s.slice),[lo,hi]=model.baseAt(t);
  if(s.showSlice)drawLine(ctx,project(basePoint(model,t,lo)),project(basePoint(model,t,hi)),C.maroon,2.5);
}
function drawAxes3D(ctx,model,bounds,project) {
  const spans=bounds.hi.map((v,i)=>v-bounds.lo[i]),size=Math.max(...spans),origin=[0,0,0];
  // Coordinates use the mathematical origin even when the axis is shifted.
  const axisStart=bounds.lo.map(v=>Math.min(0,v)),axisEnd=bounds.hi.map(v=>Math.max(0,v));
  for(let k=0;k<3;k++) {
    const p=origin.slice(),q=origin.slice();p[k]=axisStart[k]-.04*size;q[k]=axisEnd[k]+.09*size;
    drawLine(ctx,project(p),project(q),'rgba(36,59,83,.45)',1);
    const end=project(q);label(ctx,['x','y','z'][k],end[0]+5,end[1]-4,C.muted);
  }
  if(model.kind!=='cross') {
    const a=origin.slice(),b=origin.slice(),axis=model.axis==='x'?0:1,trans=axis===0?1:0;
    a[trans]=b[trans]=model.axisOffset;a[axis]=bounds.lo[axis]-.08*size;b[axis]=bounds.hi[axis]+.08*size;
    drawLine(ctx,project(a),project(b),C.gold,2,[6,5]);
  }
}

/** Render the actual 3D solid and linked representative element. */
export function renderVolume(canvas,model,state={}) {
  const surface=setup(canvas);if(!surface)return {available:false,polygonCount:0};
  const {ctx,width,height}=surface,s=settings(state),bounds=worldBounds(model),project=camera(bounds,s,width,height),polygons=buildMesh(model,s);
  if(s.showRegion)drawBase3D(ctx,model,s,project);
  const projected=polygons.map(p=>({...p,screen:p.points.map(project)}));
  for(const p of projected)p.depth=p.screen.reduce((sum,v)=>sum+v[2],0)/p.screen.length;
  projected.sort((a,b)=>a.depth-b.depth);
  for(const p of projected) {
    const n=p.normal,norm=length(n),light=.78+.3*Math.abs((n[0]*.3+n[1]*.65+n[2]*.7)/norm);
    const selected=p.type==='selected';
    const base=selected?C.gold:p.type==='inner'?C.navy:p.type==='cut'?'#42a4a8':C.teal;
    path(ctx,p.screen);ctx.fillStyle=color(base,light,selected?.86:p.type==='cut'?.5:.4);ctx.fill();
    ctx.strokeStyle=selected?'rgba(139,83,12,.5)':p.edge?'rgba(24,63,79,.28)':'rgba(24,82,95,.07)';
    ctx.lineWidth=selected?.7:p.edge?.65:.35;ctx.stroke();
  }
  if(s.showAxes)drawAxes3D(ctx,model,bounds,project);
  ctx.save();ctx.font='500 11px system-ui, sans-serif';ctx.fillStyle=C.muted;
  ctx.fillText('Equal-scale 3D · orthographic view',14,height-15);ctx.restore();
  return {available:true,polygonCount:polygons.length,worldBounds:bounds,sliceParameter:mix(...model.bounds,s.slice),projection:'orthographic-equal-scale'};
}

/** Face-on view preserves lengths/angles, independent of the orbit camera. */
export function renderSection(canvas,model,state={}) {
  const surface=setup(canvas);if(!surface)return {available:false};
  const {ctx,width,height}=surface,s=settings(state),t=mix(...model.bounds,s.slice),slice=model.sliceAt(t);
  let points,extentX,extentY;
  if(model.kind==='cross'){
    points=profile(model,t);extentX=slice.width;extentY=Math.max(0,...points.map(p=>p[1]));
    points=points.map(([q,z])=>[q-(slice.baseLow+slice.baseHigh)/2,z-extentY/2]);
  }else if(model.kind==='shell'){
    extentX=TAU*slice.radius;extentY=slice.height;
    points=[[-extentX/2,-extentY/2],[extentX/2,-extentY/2],[extentX/2,extentY/2],[-extentX/2,extentY/2]];
  }else{extentX=extentY=2*slice.outer;}
  const scale=Math.min((width-54)/Math.max(extentX,.001),(height-108)/Math.max(extentY,.001));
  const project=([q,z])=>[width/2+q*scale,height/2-z*scale-8];
  if(Math.max(extentX,extentY)<1e-10){
    const p=project([0,0]);ctx.beginPath();ctx.arc(...p,3,0,TAU);ctx.fillStyle=C.gold;ctx.fill();
    label(ctx,'Zero-area endpoint',width/2,height/2+28,C.ink,'center');
  }else if(points){
    path(ctx,points.map(project));ctx.fillStyle='rgba(230,166,61,.58)';ctx.fill();ctx.strokeStyle='#9e6819';ctx.lineWidth=2;ctx.stroke();
  }else{
    const p=project([0,0]);ctx.beginPath();ctx.arc(...p,slice.outer*scale,0,TAU);
    if(slice.inner>1e-12)ctx.arc(...p,slice.inner*scale,0,TAU,true);
    ctx.fillStyle='rgba(230,166,61,.58)';ctx.fill('evenodd');ctx.strokeStyle='#9e6819';ctx.lineWidth=2;ctx.stroke();
    dim(ctx,p,project([slice.outer,0]),'R',C.ink,13);
    if(slice.inner>1e-12)dim(ctx,p,project([0,slice.inner]),'r',C.ink,-14);
  }
  label(ctx,`${model.variable} = ${format(t)}`,14,20,C.ink);
  const description=model.kind==='cross'?`w = ${format(slice.width)}`:model.kind==='shell'?`circumference = 2πr; height = ${format(slice.height)}`:`R = ${format(slice.outer)}; r = ${format(slice.inner)}`;
  ctx.save();ctx.font='12px system-ui, sans-serif';ctx.fillStyle=C.ink;ctx.textAlign='center';
  ctx.fillText(description,width/2,height-40);
  ctx.fillText(model.kind==='shell'?'Unrolled shell surface, not a perpendicular face':`Face area ≈ ${Number(slice.area.toFixed(5))} square units`,width/2,height-20);ctx.restore();
  return {available:true,sliceParameter:t,area:slice.area,projection:'face-on-equal-scale'};
}

function niceStep(span) {
  const raw=span/5,power=10**Math.floor(Math.log10(Math.max(raw,1e-9))),r=raw/power;
  return (r<=1?1:r<=2?2:r<=5?5:10)*power;
}
function dim(ctx,p,q,text,stroke=C.gold,labelOffset=8) {
  drawLine(ctx,p,q,stroke,2);
  const dx=q[0]-p[0],dy=q[1]-p[1],n=Math.hypot(dx,dy);if(n<2)return;
  const nx=-dy/n,ny=dx/n;
  for(const v of [p,q])drawLine(ctx,[v[0]-nx*4,v[1]-ny*4],[v[0]+nx*4,v[1]+ny*4],stroke,1.5);
  label(ctx,text,(p[0]+q[0])/2+nx*labelOffset,(p[1]+q[1])/2+ny*labelOffset,stroke,'center');
}

/** Render the generating region in actual x/y coordinates, with linked strip. */
export function renderRegion(canvas,model,state={}) {
  const surface=setup(canvas);if(!surface)return {available:false};
  const {ctx,width,height}=surface,s=settings(state),[a,b]=model.bounds,points=[];
  for(let i=0;i<=64;i++) {const t=mix(a,b,i/64),[lo,hi]=model.baseAt(t);points.push(basePoint(model,t,lo),basePoint(model,t,hi));}
  let xmin=Math.min(0,...points.map(p=>p[0])),xmax=Math.max(0,...points.map(p=>p[0]));
  let ymin=Math.min(0,...points.map(p=>p[1])),ymax=Math.max(0,...points.map(p=>p[1]));
  if(model.kind!=='cross') {
    if(model.axis==='x'){ymin=Math.min(ymin,model.axisOffset);ymax=Math.max(ymax,model.axisOffset);}
    else{xmin=Math.min(xmin,model.axisOffset);xmax=Math.max(xmax,model.axisOffset);}
  }
  const spanX=Math.max(.1,xmax-xmin),spanY=Math.max(.1,ymax-ymin),pad=width<340?36:44;
  xmin-=spanX*.13;xmax+=spanX*.13;ymin-=spanY*.13;ymax+=spanY*.13;
  const availableWidth=Math.max(1,width-2*pad),availableHeight=Math.max(1,height-2*pad);
  const scale=Math.min(availableWidth/(xmax-xmin),availableHeight/(ymax-ymin));
  const xmid=(xmin+xmax)/2,ymid=(ymin+ymax)/2;
  const project=p=>[width/2+(p[0]-xmid)*scale,height/2-(p[1]-ymid)*scale];
  const left=pad,right=width-pad,top=pad,bottom=height-pad;
  // Use the complete viewport's world extents for a consistent square grid.
  xmin=xmid+(left-width/2)/scale;xmax=xmid+(right-width/2)/scale;
  ymin=ymid-(bottom-height/2)/scale;ymax=ymid-(top-height/2)/scale;
  const step=niceStep(Math.max(xmax-xmin,ymax-ymin));
  ctx.save();ctx.beginPath();ctx.rect(left,top,right-left,bottom-top);ctx.clip();
  for(let x=Math.ceil(xmin/step)*step;x<=xmax+1e-9;x+=step)drawLine(ctx,project([x,ymin]),project([x,ymax]),C.grid,.8);
  for(let y=Math.ceil(ymin/step)*step;y<=ymax+1e-9;y+=step)drawLine(ctx,project([xmin,y]),project([xmax,y]),C.grid,.8);
  const outline=[];
  for(let i=0;i<=96;i++){const t=mix(a,b,i/96);outline.push(basePoint(model,t,model.baseAt(t)[0]));}
  for(let i=96;i>=0;i--){const t=mix(a,b,i/96);outline.push(basePoint(model,t,model.baseAt(t)[1]));}
  path(ctx,outline.map(project));ctx.fillStyle='rgba(22,131,139,.18)';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle=C.teal;ctx.stroke();
  const t=mix(a,b,s.slice),[lo,hi]=model.baseAt(t),dt=(b-a)/s.slices,t0=clamp(t-dt/2,a,b),t1=clamp(t+dt/2,a,b);
  const strip=[basePoint(model,t0,lo),basePoint(model,t1,lo),basePoint(model,t1,hi),basePoint(model,t0,hi)];
  if(s.showSlice) {
    path(ctx,strip.map(project));ctx.fillStyle='rgba(230,166,61,.65)';ctx.fill();ctx.strokeStyle='#ae761e';ctx.lineWidth=1;ctx.stroke();
    drawLine(ctx,project(basePoint(model,t,lo)),project(basePoint(model,t,hi)),C.maroon,2.4);
  }
  if(s.showAxes) {
    drawLine(ctx,project([xmin,0]),project([xmax,0]),C.ink,1.2);
    drawLine(ctx,project([0,ymin]),project([0,ymax]),C.ink,1.2);
    if(model.kind!=='cross') {
      const k=model.axisOffset;
      drawLine(ctx,project(model.axis==='x'?[xmin,k]:[k,ymin]),project(model.axis==='x'?[xmax,k]:[k,ymax]),C.gold,2,[6,4]);
    }
  }
  ctx.restore();
  if(s.showAxes) {
    const xp=project([xmax,0]),yp=project([0,ymax]);label(ctx,'x',right+12,xp[1],C.ink);label(ctx,'y',yp[0],top-14,C.ink,'center');
    ctx.save();ctx.font='11px system-ui, sans-serif';ctx.fillStyle=C.muted;
    for(let x=Math.ceil(xmin/step)*step;x<=xmax+1e-9;x+=step){const p=project([x,0]);ctx.textAlign='center';ctx.fillText(format(x),p[0],clamp(p[1]+17,top+12,bottom+18));}
    for(let y=Math.ceil(ymin/step)*step;y<=ymax+1e-9;y+=step){if(Math.abs(y)<1e-9)continue;const p=project([0,y]);ctx.textAlign='right';ctx.fillText(format(y),clamp(p[0]-8,left-5,right-8),p[1]+4);}
    ctx.restore();
  }
  if(s.showSlice && model.kind==='cross')dim(ctx,project(basePoint(model,t,lo)),project(basePoint(model,t,hi)),'w',C.maroon,12);
  else if(s.showSlice && model.kind==='shell') {
    const k=model.axisOffset,mid=(lo+hi)/2;
    const axisPoint=model.axis==='y'?[k,mid]:[mid,k];
    dim(ctx,project(axisPoint),project(basePoint(model,t,mid)),'r',C.gold,-11);
    dim(ctx,project(basePoint(model,t,lo)),project(basePoint(model,t,hi)),'h',C.maroon,12);
  } else if(s.showSlice) {
    const k=model.axisOffset,far=Math.abs(lo-k)>Math.abs(hi-k)?lo:hi,near=far===lo?hi:lo;
    dim(ctx,project(sectionPoint(model,t,k)),project(sectionPoint(model,t,far)),'R',C.maroon,12);
    if(Math.abs(near-k)>1e-8) {
      const offset=Math.min(dt*.7,(b-a)*.025),q=clamp(t+offset,a,b);
      dim(ctx,project(sectionPoint(model,q,k)),project(sectionPoint(model,q,near)),'r',C.gold,-13);
    }
  }
  if(s.showSlice) {
    const pos=project(basePoint(model,t,hi));
    label(ctx,`${model.variable} = ${format(t)}`,clamp(pos[0]+10,left,right-65),clamp(pos[1]-17,top+12,bottom-12),C.navy);
  }
  if(model.kind!=='cross'&&s.showAxes) {
    label(ctx,`Rotation axis: ${model.axisLabel||`${model.axis==='x'?'y':'x'} = ${format(model.axisOffset)}`}`,14,17,'#9e6819');
  }
  return {available:true,sliceParameter:t,stripThickness:dt,worldBounds:{xmin,xmax,ymin,ymax}};
}
