(function(){
'use strict';
const data=window.LESSON_DATA,X=window.U410;if(!data||!X)return;
const {U}=X,$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const C={m:'#78183f',n:'#173b57',t:'#147e78',g:'#bf8b22',i:'#24313d',u:'#667784',grid:'#d8e0e5',paper:'#fffdf9',mint:'#eaf7f5',rose:'#fff1f4',blue:'#edf4f8',success:'#247450',danger:'#b33e50'};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function setup(node,h=340){let c=$('canvas',node);if(!c){node.innerHTML='<canvas role="img"></canvas>';c=$('canvas',node)}const w=Math.max(300,node.clientWidth||720),d=Math.min(2.5,window.devicePixelRatio||1);c.width=Math.round(w*d);c.height=Math.round(h*d);c.style.width=w+'px';c.style.height=h+'px';const x=c.getContext('2d');x.setTransform(d,0,0,d,0,0);x.clearRect(0,0,w,h);x.lineCap='round';x.lineJoin='round';return{c,x,w,h}}
function font(x,s=12,w=650,color=C.i,align='left'){x.font=`${w} ${s}px Inter,system-ui,sans-serif`;x.fillStyle=color;x.textAlign=align;x.textBaseline='middle'}
function line(x,x1,y1,x2,y2,color=C.grid,width=1,dash=[]){x.save();x.strokeStyle=color;x.lineWidth=width;x.setLineDash(dash);x.beginPath();x.moveTo(x1,y1);x.lineTo(x2,y2);x.stroke();x.restore()}
function roundedPath(x,a,b,w,h,r){if(typeof x.roundRect==='function'){x.beginPath();x.roundRect(a,b,w,h,r);return}const rr=Math.min(r,w/2,h/2);x.beginPath();x.moveTo(a+rr,b);x.arcTo(a+w,b,a+w,b+h,rr);x.arcTo(a+w,b+h,a,b+h,rr);x.arcTo(a,b+h,a,b,rr);x.arcTo(a,b,a+w,b,rr);x.closePath()}
function round(x,a,b,w,h,r,fill,stroke){roundedPath(x,a,b,w,h,r);if(fill){x.fillStyle=fill;x.fill()}if(stroke){x.strokeStyle=stroke;x.lineWidth=1;x.stroke()}}
function title(x,text,sub,w){font(x,17,900,C.n);x.fillText(text,22,25);if(sub){font(x,10,650,C.u);x.fillText(sub,22,47)}font(x,9,800,C.u,'right');x.fillText('ECHS · exact probability engine',w-18,25)}
function niceMax(v){if(!(v>0))return 1;const p=10**Math.floor(Math.log10(v)),q=v/p;return(q<=1?1:q<=2?2:q<=5?5:10)*p}
function selected(k,type,a,b){if(type==='exact')return k===a;if(type==='atMost')return k<=a;if(type==='lessThan')return k<a;if(type==='atLeast')return k>=a;if(type==='moreThan')return k>a;if(type==='between')return k>=a&&k<=b;if(type==='notZero')return k>=1;if(type==='zero')return k===0;return false}
function eventLabel(type,a,b){return{exact:`X = ${a}`,atMost:`X ≤ ${a}`,lessThan:`X < ${a}`,atLeast:`X ≥ ${a}`,moreThan:`X > ${a}`,between:`${a} ≤ X ≤ ${b}`,notZero:'X ≥ 1',zero:'X = 0'}[type]||'Full distribution'}
function eventValue(n,p,o){if(!o.type)return 1;if(o.type==='notZero')return 1-U.pmf(n,p,0);if(o.type==='zero')return U.pmf(n,p,0);return U.event(n,p,o.type,o.a,o.b)}

function drawPMF(node,o={}){
  const n=Number(o.n??12),p=Number(o.p??.4),dist=U.dist(n,p),h=o.h||340,{c,x,w}=setup(node,h);
  c.setAttribute('aria-label',o.aria||`Binomial probability mass function for n ${n} and p ${p}`);
  title(x,o.title||`Binomial PMF · n=${n}, p=${U.fmt(p,4)}`,o.subtitle||'Bar height equals P(X=x)',w);
  const b={x:56,y:72,w:w-80,h:h-118},max=niceMax(Math.max(...dist.map(d=>d.p))*1.07);
  for(let j=0;j<=4;j++){const yy=b.y+b.h-b.h*j/4;line(x,b.x,yy,b.x+b.w,yy,C.grid);font(x,9,650,C.u,'right');x.fillText(U.fmt(max*j/4,3),b.x-7,yy)}
  line(x,b.x,b.y,b.x,b.y+b.h,C.n,1.5);line(x,b.x,b.y+b.h,b.x+b.w,b.y+b.h,C.n,1.5);
  const gap=Math.max(.8,Math.min(5,b.w/(n+1)*.17)),bw=Math.max(1.4,(b.w-gap*(n+1))/(n+1));
  dist.forEach((d,k)=>{const bx=b.x+k*(bw+gap)+gap/2,bh=b.h*d.p/max,sel=selected(k,o.type,o.a,o.b);x.fillStyle=sel?C.t:(o.type==='notZero'&&k===0?C.m:C.n);x.globalAlpha=sel?1:.66;x.fillRect(bx,b.y+b.h-bh,bw,bh);x.globalAlpha=1;if(n<=20||k%Math.ceil((n+1)/12)===0||k===n){font(x,9,700,C.u,'center');x.fillText(String(k),bx+bw/2,b.y+b.h+16)}});
  const mu=n*p;
  if(o.showMean!==false){const mx=b.x+(mu+.5)*(bw+gap);if(mx>=b.x&&mx<=b.x+b.w){line(x,mx,b.y,mx,b.y+b.h,C.g,2,[5,4]);font(x,9,850,C.g,'center');x.fillText(`μ=${U.fmt(mu,2)}`,Math.max(b.x+28,Math.min(b.x+b.w-28,mx)),b.y-11)}}
  if(o.showSD){const s=U.sd(n,p);[mu-s,mu+s].forEach(v=>{const px=b.x+(v+.5)*(bw+gap);if(px>=b.x&&px<=b.x+b.w)line(x,px,b.y+12,px,b.y+b.h,C.m,1.5,[3,4])})}
  if(o.showMode){U.modes(n,p).forEach(m=>{const px=b.x+(m+.5)*(bw+gap),py=b.y+b.h-b.h*dist[m].p/max-7;x.fillStyle=C.g;x.beginPath();x.arc(px,py,5,0,Math.PI*2);x.fill()})}
  const prob=eventValue(n,p,o);round(x,w-196,52,174,31,10,C.paper,C.grid);font(x,10,850,C.m,'center');x.fillText(o.type?`${eventLabel(o.type,o.a,o.b)} · P=${U.fmt(prob,5)}`:'ΣP(X=x)=1',w-109,67.5);
  return{canvas:c,n,p,dist};
}

function drawCDF(node,o={}){
  const n=Number(o.n??12),p=Number(o.p??.4),dist=U.dist(n,p),h=o.h||340,{c,x,w}=setup(node,h);
  c.setAttribute('aria-label',o.aria||`Binomial cumulative distribution function for n ${n} and p ${p}`);
  title(x,o.title||`Binomial CDF · n=${n}, p=${U.fmt(p,4)}`,o.subtitle||'F(k)=P(X≤k) is a step function',w);
  const b={x:56,y:72,w:w-80,h:h-118};
  for(let j=0;j<=4;j++){const yy=b.y+b.h-b.h*j/4;line(x,b.x,yy,b.x+b.w,yy,C.grid);font(x,9,650,C.u,'right');x.fillText(U.fmt(j/4,2),b.x-7,yy)}
  line(x,b.x,b.y,b.x,b.y+b.h,C.n,1.5);line(x,b.x,b.y+b.h,b.x+b.w,b.y+b.h,C.n,1.5);
  const dx=b.w/(n+1);x.strokeStyle=C.t;x.lineWidth=3;x.beginPath();
  dist.forEach((d,k)=>{const x0=b.x+k*dx,x1=b.x+(k+1)*dx,y=b.y+b.h-d.cdf*b.h;if(k===0)x.moveTo(x0,y);else x.lineTo(x0,y);x.lineTo(x1,y)});x.stroke();
  dist.forEach((d,k)=>{const x0=b.x+k*dx,x1=b.x+(k+1)*dx,y=b.y+b.h-d.cdf*b.h;x.fillStyle=(o.a!=null&&k<=o.a)?C.m:C.t;x.beginPath();x.arc(x1,y,3.3,0,Math.PI*2);x.fill();if(n<=20||k%Math.ceil((n+1)/12)===0||k===n){font(x,9,700,C.u,'center');x.fillText(String(k),x0+dx/2,b.y+b.h+16)}});
  if(o.a!=null){const k=Math.floor(o.a),px=b.x+(k+1)*dx,py=b.y+b.h-U.cdf(n,p,k)*b.h;line(x,px,b.y,px,b.y+b.h,C.m,1.7,[4,4]);round(x,w-190,52,168,31,10,C.paper,C.grid);font(x,10,850,C.m,'center');x.fillText(`F(${k})=${U.fmt(U.cdf(n,p,k),5)}`,w-106,67.5);x.fillStyle=C.m;x.beginPath();x.arc(px,py,5,0,Math.PI*2);x.fill()}
  return{canvas:c,n,p,dist};
}

function drawMiniPMF(x,box,n,p,label,color=C.t,type,a,b){
  round(x,box.x,box.y,box.w,box.h,16,'#fff',C.grid);font(x,12,900,C.n);x.fillText(label,box.x+14,box.y+19);
  const d=U.dist(n,p),max=Math.max(...d.map(v=>v.p))*1.06,base=box.y+box.h-29,left=box.x+18,width=box.w-36,gap=1,bw=Math.max(1,(width-gap*(n+1))/(n+1));
  line(x,left,base,left+width,base,C.grid);
  d.forEach((v,k)=>{const bh=(box.h-60)*v.p/max,bx=left+k*(bw+gap);x.fillStyle=selected(k,type,a,b)?C.m:color;x.globalAlpha=selected(k,type,a,b)?1:.72;x.fillRect(bx,base-bh,bw,bh);x.globalAlpha=1});
  font(x,9,700,C.u);x.fillText(`μ=${U.fmt(n*p,2)} · σ=${U.fmt(U.sd(n,p),2)}`,box.x+14,box.y+box.h-12);
}
function drawComparison(node,o={}){
  const h=o.h||365,{c,x,w}=setup(node,h);c.setAttribute('aria-label',o.aria||'Comparison of exact binomial distributions');title(x,o.title||'Binomial comparison',o.subtitle||'',w);
  const items=o.items||[],cols=w<560?1:(w<900?Math.min(2,items.length):items.length),rows=Math.ceil(items.length/cols),gap=12,top=65,available=h-top-12,bw=(w-24-gap*(cols-1))/cols,bh=(available-gap*(rows-1))/rows;
  items.forEach((it,i)=>drawMiniPMF(x,{x:12+(i%cols)*(bw+gap),y:top+Math.floor(i/cols)*(bh+gap),w:bw,h:bh},it.n,it.p,it.label,it.color||C.t,it.type,it.a,it.b));
  return{canvas:c};
}

function drawTrialStrip(node){
  const {c,x,w}=setup(node,330);c.setAttribute('aria-label','Twelve fixed binary trials producing a success count');title(x,'Twelve attempts → one count','The order is visible, but X records only the number of successes',w);
  const seq=[1,0,1,1,1,0,1,1,0,1,1,0],gap=Math.max(3,Math.min(9,(w-80)/80)),box=Math.min(52,(w-50-gap*11)/12),start=(w-(box*12+gap*11))/2,y=113;
  seq.forEach((v,i)=>{round(x,start+i*(box+gap),y,box,box,13,v?C.t:'#e8edf0',v?C.t:C.grid);font(x,16,950,v?'#fff':C.u,'center');x.fillText(v?'S':'F',start+i*(box+gap)+box/2,y+box/2);font(x,8,750,C.u,'center');x.fillText(String(i+1),start+i*(box+gap)+box/2,y+box+15)});
  const count=U.sum(seq);round(x,w/2-105,235,210,52,16,C.n);font(x,18,950,'#fff','center');x.fillText(`X = ${count} successes`,w/2,261);return{canvas:c};
}
function drawDependence(node){
  const {c,x,w}=setup(node,310);c.setAttribute('aria-label','Independent trials versus clustered dependent outcomes');title(x,'Independence is structural','Separate trials do not share a hidden cause; clustered trials may',w);
  const half=w/2;round(x,18,72,half-28,190,19,C.mint,C.grid);round(x,half+10,72,half-28,190,19,C.rose,C.grid);font(x,14,900,C.t);x.fillText('PLAUSIBLY INDEPENDENT',36,98);font(x,14,900,C.m);x.fillText('CLUSTERED / DEPENDENT',half+28,98);
  const points=[[.15,.35],[.34,.62],[.53,.28],[.72,.58],[.86,.37]];points.forEach(([a,b],i)=>{const px=35+a*(half-62),py=120+b*105;x.fillStyle=i%2?C.g:C.t;x.beginPath();x.arc(px,py,9,0,Math.PI*2);x.fill()});
  const cx=half+86,cy=170;line(x,cx,cy,cx+88,cy-48,C.m,3);line(x,cx,cy,cx+100,cy+42,C.m,3);line(x,cx,cy,cx-25,cy-51,C.m,3);[[cx,cy],[cx+88,cy-48],[cx+100,cy+42],[cx-25,cy-51]].forEach(([a,b],i)=>{x.fillStyle=i?C.g:C.m;x.beginPath();x.arc(a,b,i?9:13,0,Math.PI*2);x.fill()});font(x,10,750,C.u);x.fillText('shared influence',half+28,238);return{canvas:c};
}
function drawFixedWaiting(node){
  const {c,x,w}=setup(node,310);c.setAttribute('aria-label','Fixed trial count compared with waiting until first success');title(x,'Two superficially similar experiments','The stopping rule decides the distribution',w);
  const mid=w/2;round(x,18,72,mid-28,190,18,C.mint,C.grid);round(x,mid+10,72,mid-28,190,18,C.rose,C.grid);font(x,14,900,C.t);x.fillText('BINOMIAL · fixed n=8',36,98);font(x,12,700,C.u);x.fillText('Run all eight trials',36,122);
  [1,0,0,1,1,0,1,0].forEach((v,i)=>{round(x,36+i*31,155,24,37,7,v?C.t:'#dfe5e8');font(x,11,900,v?'#fff':C.u,'center');x.fillText(v?'S':'F',48+i*31,173.5)});font(x,12,850,C.n);x.fillText('Count successes: X=4',36,225);
  font(x,14,900,C.m);x.fillText('WAITING TIME · stop',mid+28,98);font(x,12,700,C.u);x.fillText('Stop at first success',mid+28,122);[0,0,0,1].forEach((v,i)=>{round(x,mid+28+i*42,155,34,37,7,v?C.m:'#eadfe3');font(x,11,900,v?'#fff':C.u,'center');x.fillText(v?'S':'F',mid+45+i*42,173.5)});font(x,12,850,C.n);x.fillText('First success on trial 4',mid+28,225);return{canvas:c};
}
function drawChangingP(node){
  const {c,x,w,h}=setup(node,300);c.setAttribute('aria-label','Constant success probability compared with changing probability');title(x,'Constant p versus changing p','A binomial model requires a horizontal probability profile',w);
  const b={x:58,y:75,w:w-84,h:h-120};for(let j=0;j<=4;j++){const yy=b.y+b.h-b.h*j/4;line(x,b.x,yy,b.x+b.w,yy,C.grid);font(x,9,650,C.u,'right');x.fillText(U.fmt(j/4,2),b.x-7,yy)}line(x,b.x,b.y,b.x,b.y+b.h,C.n,1.5);line(x,b.x,b.y+b.h,b.x+b.w,b.y+b.h,C.n,1.5);
  const stable=Array(10).fill(.62),changing=Array.from({length:10},(_,i)=>.75-.04*i),draw=(arr,color)=>{x.strokeStyle=color;x.lineWidth=3;x.beginPath();arr.forEach((v,i)=>{const px=b.x+b.w*i/9,py=b.y+b.h-v*b.h;i?x.lineTo(px,py):x.moveTo(px,py)});x.stroke();arr.forEach((v,i)=>{const px=b.x+b.w*i/9,py=b.y+b.h-v*b.h;x.fillStyle=color;x.beginPath();x.arc(px,py,3.5,0,Math.PI*2);x.fill()})};draw(stable,C.t);draw(changing,C.m);font(x,10,850,C.t);x.fillText('constant p',b.x+12,b.y+b.h*(1-.62)-12);font(x,10,850,C.m);x.fillText('changing p',b.x+b.w-105,b.y+b.h*(1-changing[9])-12);return{canvas:c};
}
function drawBinomialGeometric(node){
  const {c,x,w}=setup(node,300);c.setAttribute('aria-label','Binomial count compared with geometric waiting time');title(x,'What is fixed?','The question determines the random variable',w);const y=105;round(x,30,y,w/2-45,135,20,C.mint,C.grid);round(x,w/2+15,y,w/2-45,135,20,C.rose,C.grid);font(x,15,900,C.t);x.fillText('BINOMIAL',50,y+30);font(x,12,750,C.n);x.fillText('Fixed trials n',50,y+60);x.fillText('Random success count X',50,y+87);font(x,15,900,C.m);x.fillText('GEOMETRIC',w/2+35,y+30);font(x,12,750,C.n);x.fillText('Random stopping trial',w/2+35,y+60);x.fillText('First success ends process',w/2+35,y+87);font(x,28,950,C.g,'center');x.fillText('↔',w/2,y+68);return{canvas:c};
}
function drawCombinations(node){
  const {c,x,w}=setup(node,310);c.setAttribute('aria-label','Ten arrangements of two successes in five trials');title(x,'Two successes among five trials','There are C(5,2)=10 placements',w);const seq=[];for(let a=0;a<5;a++)for(let b=a+1;b<5;b++){const r=Array(5).fill(0);r[a]=r[b]=1;seq.push(r)}const cols=5,bw=(w-46)/cols,bh=86;seq.forEach((r,i)=>{const px=18+(i%cols)*bw,py=70+Math.floor(i/cols)*bh;round(x,px,py,bw-8,70,12,'#fff',C.grid);r.forEach((v,j)=>{x.fillStyle=v?C.t:'#dfe5e8';x.beginPath();x.arc(px+18+j*((bw-44)/4),py+30,7,0,Math.PI*2);x.fill()});font(x,9,750,C.u,'center');x.fillText(r.map(v=>v?'S':'F').join(''),px+(bw-8)/2,py+55)});return{canvas:c};
}
function drawFiniteCompare(node){
  const {c,x,w,h}=setup(node,350);c.setAttribute('aria-label','Hypergeometric exact probabilities compared with binomial approximation');title(x,'Without replacement · exact versus approximation','N=800, K=64, n=20; sample fraction 2.5%',w);const ks=Array.from({length:8},(_,i)=>i),exact=ks.map(k=>U.hypergeomPmf(800,64,20,k)),approx=ks.map(k=>U.pmf(20,.08,k)),max=niceMax(Math.max(...exact,...approx)*1.08),b={x:58,y:75,w:w-86,h:h-122};for(let j=0;j<=4;j++){const yy=b.y+b.h-b.h*j/4;line(x,b.x,yy,b.x+b.w,yy,C.grid);font(x,9,650,C.u,'right');x.fillText(U.fmt(max*j/4,3),b.x-7,yy)}line(x,b.x,b.y,b.x,b.y+b.h,C.n,1.5);line(x,b.x,b.y+b.h,b.x+b.w,b.y+b.h,C.n,1.5);const group=b.w/ks.length,bw=Math.min(20,group*.28);ks.forEach((k,i)=>{const cx=b.x+(i+.5)*group,he=b.h*exact[i]/max,ha=b.h*approx[i]/max;x.fillStyle=C.t;x.fillRect(cx-bw-1,b.y+b.h-he,bw,he);x.fillStyle=C.m;x.fillRect(cx+1,b.y+b.h-ha,bw,ha);font(x,9,750,C.u,'center');x.fillText(String(k),cx,b.y+b.h+16)});font(x,10,850,C.t);x.fillText('Exact hypergeometric',b.x+8,b.y-12);font(x,10,850,C.m);x.fillText('Binomial approximation',b.x+148,b.y-12);round(x,w-210,51,188,31,10,C.paper,C.grid);font(x,10,850,C.n,'center');x.fillText(`At x=2 · error ${U.fmt(Math.abs(exact[2]-approx[2]),6)}`,w-116,66.5);return{canvas:c};
}
function drawListMode(node){
  const n=8,p=.35,d=U.dist(n,p),{c,x,w}=setup(node,330);c.setAttribute('aria-label','TI-84 list of binomial probability values');title(x,'binompdf(8,.35)','Omit x to inspect the complete PMF list',w);const left=28,top=78,rowH=24,colW=(w-56)/3;round(x,left,top,w-56,230,16,'#fff',C.grid);[['x','P(X=x)','F(x)'],...d.map(r=>[r.x,U.fmt(r.p,6),U.fmt(r.cdf,6)])].forEach((row,i)=>row.forEach((v,j)=>{if(i===0){x.fillStyle=C.n;x.fillRect(left+j*colW,top,colW,rowH)}font(x,i===0?10:9,i===0?900:700,i===0?'#fff':(j===1?C.m:C.i),j===0?'center':'right');x.fillText(String(v),left+j*colW+(j===0?colW/2:colW-12),top+rowH*i+rowH/2)}));return{canvas:c};
}
function drawConvergence(node){
  const q=U.pmf(12,.72,9),{c,x,w,h}=setup(node,330);c.setAttribute('aria-label','Empirical relative frequency converging toward exact binomial probability');title(x,'Simulation frequency approaches exact probability','Event: exactly 9 successes in B(12,.72)',w);const b={x:58,y:72,w:w-84,h:h-116};for(let j=0;j<=4;j++){const v=.1+j*.05,yy=b.y+b.h-(v-.1)/.2*b.h;line(x,b.x,yy,b.x+b.w,yy,C.grid);font(x,9,650,C.u,'right');x.fillText(U.fmt(v,2),b.x-7,yy)}line(x,b.x,b.y,b.x,b.y+b.h,C.n,1.5);line(x,b.x,b.y+b.h,b.x+b.w,b.y+b.h,C.n,1.5);const yq=b.y+b.h-(q-.1)/.2*b.h;line(x,b.x,yq,b.x+b.w,yq,C.m,2,[5,4]);font(x,9,850,C.m);x.fillText(`exact ${U.fmt(q,4)}`,b.x+8,yq-10);let seed=410,hit=0;x.strokeStyle=C.t;x.lineWidth=2.5;x.beginPath();for(let r=1;r<=500;r++){seed=(1664525*seed+1013904223)>>>0;const u=seed/4294967296;if(u<q)hit++;const f=hit/r,px=b.x+b.w*(r-1)/499,py=b.y+b.h-(f-.1)/.2*b.h;if(r===1)x.moveTo(px,Math.max(b.y,Math.min(b.y+b.h,py)));else x.lineTo(px,Math.max(b.y,Math.min(b.y+b.h,py)))}x.stroke();font(x,9,750,C.u,'center');[1,100,200,300,400,500].forEach(r=>x.fillText(String(r),b.x+b.w*(r-1)/499,b.y+b.h+16));return{canvas:c};
}
function drawThreshold(node){
  const p=.08,target=.95,{c,x,w,h}=setup(node,330);c.setAttribute('aria-label','Probability of at least one success versus number of trials');title(x,'Repeated-trial threshold · p=0.08','Find the first integer n for which 1−0.92ⁿ reaches 0.95',w);const b={x:58,y:70,w:w-84,h:h-116},maxN=55;for(let j=0;j<=4;j++){const yy=b.y+b.h-b.h*j/4;line(x,b.x,yy,b.x+b.w,yy,C.grid);font(x,9,650,C.u,'right');x.fillText(U.fmt(j/4,2),b.x-7,yy)}line(x,b.x,b.y,b.x,b.y+b.h,C.n,1.5);line(x,b.x,b.y+b.h,b.x+b.w,b.y+b.h,C.n,1.5);line(x,b.x,b.y+b.h*(1-target),b.x+b.w,b.y+b.h*(1-target),C.m,2,[5,4]);font(x,9,850,C.m);x.fillText('target 0.95',b.x+8,b.y+b.h*(1-target)-10);x.strokeStyle=C.t;x.lineWidth=3;x.beginPath();for(let n=1;n<=maxN;n++){const pr=1-(1-p)**n,px=b.x+b.w*(n-1)/(maxN-1),py=b.y+b.h*(1-pr);n===1?x.moveTo(px,py):x.lineTo(px,py)}x.stroke();const n0=U.thresholdAtLeastOne(p,target),px=b.x+b.w*(n0-1)/(maxN-1),pr0=1-(1-p)**n0,py=b.y+b.h*(1-pr0);x.fillStyle=C.g;x.beginPath();x.arc(px,py,6,0,Math.PI*2);x.fill();font(x,10,900,C.g,'center');x.fillText(`n=${n0}`,px,py-15);return{canvas:c};
}
function drawAssumption(node){
  const {c,x,w}=setup(node,300);c.setAttribute('aria-label','Five-stage binomial model audit');title(x,'Calculator output is the last check—not the first','A valid chain keeps modelling and computation separate',w);const items=[['B','Binary?'],['I','Independent?'],['N','Fixed n?'],['S','Same p?'],['84','Correct event?']],gap=14,bw=(w-44-gap*4)/5,y=105;items.forEach((it,i)=>{round(x,22+i*(bw+gap),y,bw,105,18,i===4?C.n:'#fff',i===4?C.n:C.grid);round(x,22+i*(bw+gap)+bw/2-18,y+16,36,36,12,i===4?C.g:(i%2?C.m:C.t));font(x,12,950,i===4?C.n:'#fff','center');x.fillText(it[0],22+i*(bw+gap)+bw/2,y+34);font(x,11,850,i===4?'#fff':C.n,'center');x.fillText(it[1],22+i*(bw+gap)+bw/2,y+78);if(i<4){font(x,20,950,C.g,'center');x.fillText('→',22+i*(bw+gap)+bw+gap/2,y+52)}});return{canvas:c};
}

const configs={
  cover:{n:18,p:.42,type:'between',a:6,b:10,title:'Probability mass is discrete',subtitle:'Highlighted bars show 6≤X≤10',showMean:true,showMode:true,h:390},
  'defect-pmf':{n:20,p:.04,type:'atMost',a:1,title:'Defect-count distribution',subtitle:'X~B(20,.04)',showMean:true},
  'pmf-basic':{n:12,p:.35,type:'exact',a:5,title:'Read a binomial PMF',subtitle:'Each bar is P(X=x)',showMean:true},
  'exact-two':{n:10,p:1/6,type:'exact',a:2,title:'Exactly two sixes',subtitle:'C(10,2)(1/6)²(5/6)⁸',showMean:true},
  'exact-three':{n:8,p:.25,type:'exact',a:3,title:'Exactly three successes',subtitle:'One PMF bar',showMean:true},
  'pmf-selected':{n:12,p:.5,type:'between',a:5,b:8,title:'Selected bars form an event',subtitle:'P(5≤X≤8)',showMean:true},
  'less-than':{n:18,p:.4,type:'lessThan',a:7,title:'Fewer than seven',subtitle:'Included integers end at 6',showMean:true},
  'tail-atleast':{n:20,p:.04,type:'atLeast',a:2,title:'At least two defects',subtitle:'Upper tail = 1−F(1)',showMean:true},
  'more-than':{n:20,p:.4,type:'moreThan',a:6,title:'More than six',subtitle:'Upper tail begins at 7',showMean:true},
  interval:{n:16,p:.45,type:'between',a:5,b:9,title:'Inclusive interval',subtitle:'F(9)−F(4)',showMean:true},
  'zero-complement':{n:12,p:.15,type:'notZero',a:1,title:'At least one success',subtitle:'All bars except X=0',showMean:true},
  'pdf-workflow':{n:12,p:.72,type:'exact',a:9,title:'binompdf(12,.72,9)',subtitle:'Exact TI‑84 evidence',showMean:true,showMode:true},
  'interval-workflow':{n:16,p:.45,type:'between',a:5,b:9,title:'binomcdf difference',subtitle:'F(9)−F(4)',showMean:true},
  'mean-graph':{n:20,p:.25,title:'Mean at μ=np=5',subtitle:'The gold line marks long-run centre',showMean:true},
  'sd-graph':{n:24,p:.35,title:'Centre and one standard deviation',subtitle:'Dashed maroon lines mark μ±σ',showMean:true,showSD:true},
  'two-modes':{n:24,p:.4,title:'Two equal modal bars',subtitle:'(n+1)p=10 gives modes 9 and 10',showMean:true,showMode:true},
  reliability:{n:8,p:.92,type:'atLeast',a:7,title:'At least seven working modules',subtitle:'P(X≥7)',showMean:true},
  'quality-control':{n:20,p:.04,type:'atMost',a:1,title:'At most one defective sensor',subtitle:'P(X≤1)',showMean:true},
  'ib-worked':{n:30,p:.6,type:'between',a:16,b:21,title:'Survey support interval',subtitle:'P(16≤X≤21)',showMean:true,showSD:true},
  'exam-turn':{n:14,p:.65,type:'moreThan',a:10,title:'More than ten successful throws',subtitle:'P(X>10)',showMean:true}
};
const cdfConfigs={
  'cdf-basic':{n:12,p:.35,a:5,title:'Cumulative step function',subtitle:'F(k)=P(X≤k)'},
  'cdf-atmost':{n:15,p:.35,a:5,title:'At most five',subtitle:'F(5) includes x=0 through 5'},
  'cdf-workflow':{n:15,p:.35,a:5,title:'binomcdf(15,.35,5)',subtitle:'Lower cumulative TI‑84 evidence'}
};
const comparisonConfigs={
  'shape-p':{title:'Fixed n=20 · changing p',subtitle:'Centre shifts and skew reverses',items:[{n:20,p:.2,label:'p=.20 · right-skew'},{n:20,p:.5,label:'p=.50 · symmetric',color:C.g},{n:20,p:.8,label:'p=.80 · left-skew',color:C.m}]},
  skewness:{title:'Mirror distributions',subtitle:'B(18,.25), B(18,.50), B(18,.75)',items:[{n:18,p:.25,label:'p=.25'},{n:18,p:.5,label:'p=.50',color:C.g},{n:18,p:.75,label:'p=.75',color:C.m}]},
  'parameter-compare':{title:'Same mean does not mean same distribution',subtitle:'Both means equal 6; spreads differ',items:[{n:12,p:.5,label:'B(12,.50)'},{n:20,p:.3,label:'B(20,.30)',color:C.m}]}
};
function mountPlot(node){const key=node.dataset.u410Plot;if(configs[key])return drawPMF(node,configs[key]);if(cdfConfigs[key])return drawCDF(node,cdfConfigs[key]);if(comparisonConfigs[key])return drawComparison(node,comparisonConfigs[key]);if(key==='trial-strip')return drawTrialStrip(node);if(key==='dependence')return drawDependence(node);if(key==='fixed-waiting')return drawFixedWaiting(node);if(key==='changing-p')return drawChangingP(node);if(key==='binomial-geometric')return drawBinomialGeometric(node);if(key==='combinations')return drawCombinations(node);if(key==='finite-compare')return drawFiniteCompare(node);if(key==='list-mode')return drawListMode(node);if(key==='convergence')return drawConvergence(node);if(key==='threshold')return drawThreshold(node);if(key==='assumption-audit')return drawAssumption(node);node.innerHTML=`<div class="u410-plot-fallback">Unknown plot: ${esc(key)}</div>`}
const mounted=new WeakSet();function hydrate(root=document){root.querySelectorAll?.('[data-u410-plot]').forEach(node=>{if(mounted.has(node))return;mounted.add(node);mountPlot(node);if('ResizeObserver'in window){let timer;new ResizeObserver(()=>{clearTimeout(timer);timer=setTimeout(()=>mountPlot(node),90)}).observe(node)}})}
function start(){hydrate();new MutationObserver(rs=>rs.forEach(r=>r.addedNodes.forEach(n=>{if(n.nodeType===1)hydrate(n)}))).observe(document.body,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.U410_RUNTIME={data,X,U,$,$$,C,esc,setup,font,line,round,title,drawPMF,drawCDF,drawComparison,mountPlot,hydrate};
})();
