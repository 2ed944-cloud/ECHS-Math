(function(){
'use strict';
const data=window.LESSON_DATA,app=document.getElementById('app');
if(!data||String(data.lesson?.number)!=='2.4'||!app)return;
const NS='http://www.w3.org/2000/svg';
const C={navy:'#17324d',maroon:'#7a1733',teal:'#177e89',gold:'#d4a72c',grid:'#e7e0d7',muted:'#5d6a75',paper:'#fffdf9',green:'#1f7a4d',red:'#a83246',blue:'#2f72b8'};
const el=(name,attrs={})=>{const node=document.createElementNS(NS,name);Object.entries(attrs).forEach(([key,value])=>node.setAttribute(key,String(value)));return node;};
const clear=node=>{while(node&&node.firstChild)node.removeChild(node.firstChild);};
const fmt=(value,digits=3)=>Number.isFinite(value)?Number(value.toFixed(digits)).toLocaleString('en-US',{maximumFractionDigits:digits}):'undefined';
const pct=value=>`${fmt(Math.abs(value),1)}%`;
function addText(svg,x,y,text,attrs={}){const node=el('text',{x,y,fill:C.muted,'font-size':12,'font-weight':700,...attrs});node.textContent=text;svg.append(node);return node;}
function frame(svg,{w=720,h=400,left=58,right=24,top=24,bottom=48,xmin=0,xmax=12,ymin=0,ymax=100,xTicks=6,yTicks=5}={}){
  clear(svg);svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
  svg.append(el('rect',{x:1,y:1,width:w-2,height:h-2,rx:22,fill:'#fff',stroke:'#d9d1c8'}));
  const X=x=>left+(x-xmin)/(xmax-xmin)*(w-left-right);
  const Y=y=>h-bottom-(y-ymin)/(ymax-ymin)*(h-top-bottom);
  for(let i=0;i<=xTicks;i++){
    const value=xmin+(xmax-xmin)*i/xTicks,x=X(value);
    svg.append(el('line',{x1:x,y1:top,x2:x,y2:h-bottom,stroke:C.grid}));
    addText(svg,x,h-20,fmt(value,2),{'text-anchor':'middle'});
  }
  for(let i=0;i<=yTicks;i++){
    const value=ymin+(ymax-ymin)*i/yTicks,y=Y(value);
    svg.append(el('line',{x1:left,y1:y,x2:w-right,y2:y,stroke:C.grid}));
    addText(svg,left-10,y+4,fmt(value,2),{'text-anchor':'end'});
  }
  if(ymin<=0&&ymax>=0)svg.append(el('line',{x1:left,y1:Y(0),x2:w-right,y2:Y(0),stroke:C.navy,'stroke-width':2.3}));
  if(xmin<=0&&xmax>=0)svg.append(el('line',{x1:X(0),y1:top,x2:X(0),y2:h-bottom,stroke:C.navy,'stroke-width':2.3}));
  return {w,h,left,right,top,bottom,xmin,xmax,ymin,ymax,X,Y};
}
function pathFor(fn,cfg,{steps=320,clip=.3}={}){
  let d='',drawing=false;
  const span=cfg.ymax-cfg.ymin;
  for(let i=0;i<=steps;i++){
    const x=cfg.xmin+(cfg.xmax-cfg.xmin)*i/steps,y=fn(x);
    const visible=Number.isFinite(y)&&y>=cfg.ymin-clip*span&&y<=cfg.ymax+clip*span;
    if(!visible){drawing=false;continue;}
    d+=`${drawing?'L':'M'}${cfg.X(x).toFixed(2)} ${cfg.Y(y).toFixed(2)} `;drawing=true;
  }
  return d;
}
function initGrowth(root){
  if(root.dataset.ready==='1')return;root.dataset.ready='1';
  const a=root.querySelector('[data-growth-a]'),rate=root.querySelector('[data-growth-r]'),time=root.querySelector('[data-growth-t]'),eq=root.querySelector('[data-growth-equation]'),value=root.querySelector('[data-growth-value]'),svg=root.querySelector('[data-growth-svg]');
  const draw=()=>{
    const A0=Number(a.value),r=Number(rate.value),b=1+r/100,t=Number(time.value),fn=x=>A0*b**x;
    const endpoint=fn(12),maximum=Math.max(A0,endpoint,fn(t)),ymax=Math.max(20,maximum*1.16);
    const cfg=frame(svg,{xmin:0,xmax:12,ymin:0,ymax,xTicks:6,yTicks:5});
    svg.append(el('path',{d:pathFor(fn,cfg),fill:'none',stroke:r>=0?C.maroon:C.teal,'stroke-width':7,'stroke-linecap':'round','stroke-linejoin':'round'}));
    const y=fn(t);
    svg.append(el('line',{x1:cfg.X(t),y1:cfg.Y(0),x2:cfg.X(t),y2:cfg.Y(y),stroke:C.gold,'stroke-width':3,'stroke-dasharray':'8 7'}));
    svg.append(el('circle',{cx:cfg.X(t),cy:cfg.Y(y),r:9,fill:C.gold,stroke:'#fff','stroke-width':4}));
    addText(svg,cfg.X(t)+10,Math.max(38,cfg.Y(y)-12),`(${fmt(t,0)}, ${fmt(y,2)})`,{fill:C.navy,'font-size':14,'font-weight':900});
    addText(svg,cfg.w/2,cfg.h-5,'time intervals',{'text-anchor':'middle','font-size':13});
    eq.textContent=`A(t) = ${fmt(A0,0)}(${b.toFixed(2)})^t · ${r>=0?'growth':'decay'} factor ${b.toFixed(2)} (${pct(r)} ${r>=0?'increase':'decrease'} per interval)`;
    value.textContent=`At t = ${fmt(t,0)}, A(t) = ${fmt(y,2)}. ${b===1?'The output is constant.':b>1?'Repeated multiplication bends the graph upward.':'Repeated multiplication moves the output toward 0.'}`;
  };
  [a,rate,time].forEach(input=>input.addEventListener('input',draw));draw();
}
function initTransform(root){
  if(root.dataset.ready==='1')return;root.dataset.ready='1';
  const a=root.querySelector('[data-transform-a]'),b=root.querySelector('[data-transform-b]'),h=root.querySelector('[data-transform-h]'),k=root.querySelector('[data-transform-k]'),eq=root.querySelector('[data-transform-equation]'),range=root.querySelector('[data-transform-range]'),svg=root.querySelector('[data-transform-svg]');
  const draw=()=>{
    const A=Number(a.value),B=Number(b.value),H=Number(h.value),K=Number(k.value),fn=x=>A*B**(x-H)+K;
    const cfg=frame(svg,{xmin:-5,xmax:7,ymin:-12,ymax:20,xTicks:6,yTicks:8});
    svg.append(el('line',{x1:cfg.left,y1:cfg.Y(K),x2:cfg.w-cfg.right,y2:cfg.Y(K),stroke:C.gold,'stroke-width':3,'stroke-dasharray':'10 8'}));
    svg.append(el('path',{d:pathFor(fn,cfg,{steps:420,clip:.7}),fill:'none',stroke:A>=0?C.maroon:C.teal,'stroke-width':7,'stroke-linecap':'round','stroke-linejoin':'round'}));
    const anchorY=fn(H);
    if(anchorY>=cfg.ymin&&anchorY<=cfg.ymax)svg.append(el('circle',{cx:cfg.X(H),cy:cfg.Y(anchorY),r:8,fill:C.gold,stroke:'#fff','stroke-width':4}));
    addText(svg,cfg.w-cfg.right-6,Math.max(cfg.top+15,Math.min(cfg.h-cfg.bottom-8,cfg.Y(K)-8)),`asymptote y = ${fmt(K,1)}`,{'text-anchor':'end',fill:C.gold,'font-size':13,'font-weight':900});
    const shift=H===0?'x':`(x ${H>0?'−':'+'} ${Math.abs(H)})`;
    eq.textContent=`y = ${fmt(A,1)}(${fmt(B,1)})^${shift} ${K>=0?'+':'−'} ${Math.abs(K)}`;
    if(A>0)range.textContent=`Horizontal asymptote: y = ${fmt(K,1)} · range: y > ${fmt(K,1)} · ${B===1?'b = 1 makes this a constant, not an exponential model.':B>1?'increasing base':'decaying base'}`;
    else if(A<0)range.textContent=`Horizontal asymptote: y = ${fmt(K,1)} · range: y < ${fmt(K,1)} · reflection across the asymptote side`;
    else range.textContent=`a = 0 gives the degenerate constant y = ${fmt(K,1)}; choose a ≠ 0 for an exponential function.`;
  };
  [a,b,h,k].forEach(input=>input.addEventListener('input',draw));draw();
}
function linReg(xs,ys){
  const n=xs.length,sx=xs.reduce((p,v)=>p+v,0),sy=ys.reduce((p,v)=>p+v,0),sxx=xs.reduce((p,v)=>p+v*v,0),sxy=xs.reduce((p,v,i)=>p+v*ys[i],0),den=n*sxx-sx*sx;
  const m=(n*sxy-sx*sy)/den,c=(sy-m*sx)/n;return {m,c,predict:x=>m*x+c};
}
function expReg(xs,ys){
  const logs=ys.map(Math.log),fit=linReg(xs,logs),a=Math.exp(fit.c),b=Math.exp(fit.m);return {a,b,predict:x=>a*b**x};
}
function initModel(root){
  if(root.dataset.ready==='1')return;root.dataset.ready='1';
  const table=root.querySelector('[data-model-table]'),verdict=root.querySelector('[data-model-verdict]'),svg=root.querySelector('[data-model-svg]');
  const sets={
    linear:{xs:[0,1,2,3,4,5],ys:[12,20,28,36,44,52],family:'linear',verdict:'Data A has constant first difference 8. The exact line y = 12 + 8x is supported; an exponential model is unnecessary.'},
    exponential:{xs:[0,1,2,3,4,5],ys:[18,24,31,42,55,74],family:'exponential',verdict:'Data B has approximately constant ratios. ExpReg gives a factor near 1.33 and small, patternless residuals, supporting an exponential model over the observed interval.'},
    limited:{xs:[0,1,2,3,4,5],ys:[20,30,44,61,76,82],family:'exponential',verdict:'Data C rises rapidly but begins to level off. The curved residual pattern warns that unrestricted exponential growth misses a capacity effect; a bounded model may be more defensible.'}
  };
  const render=key=>{
    const set=sets[key],fit=set.family==='linear'?linReg(set.xs,set.ys):expReg(set.xs,set.ys),pred=set.xs.map(fit.predict),res=set.ys.map((y,i)=>y-pred[i]);
    table.innerHTML=`<table class="el5-table"><thead><tr><th>x</th>${set.xs.map(x=>`<td>${x}</td>`).join('')}</tr></thead><tbody><tr><th>observed</th>${set.ys.map(y=>`<td>${fmt(y,1)}</td>`).join('')}</tr><tr><th>predicted</th>${pred.map(y=>`<td>${fmt(y,1)}</td>`).join('')}</tr><tr><th>residual</th>${res.map(y=>`<td>${fmt(y,1)}</td>`).join('')}</tr></tbody></table>`;
    const equation=set.family==='linear'?`y ≈ ${fmt(fit.c,3)} + ${fmt(fit.m,3)}x`:`y ≈ ${fmt(fit.a,4)}(${fmt(fit.b,5)})^x`;
    verdict.innerHTML=`<b>${equation}</b><br>${set.verdict}`;
    root.querySelectorAll('[data-model-set]').forEach(button=>button.classList.toggle('active',button.dataset.modelSet===key));
    clear(svg);svg.setAttribute('viewBox','0 0 720 400');svg.append(el('rect',{x:1,y:1,width:718,height:398,rx:22,fill:'#fff',stroke:'#d9d1c8'}));
    const left=54,right=24,top=24,split=270,bottom=34,xmin=0,xmax=5,ymin=0,ymax=100;
    const X=x=>left+(x-xmin)/(xmax-xmin)*(720-left-right),Y=y=>split-18-(y-ymin)/(ymax-ymin)*(split-top-34);
    for(let x=0;x<=5;x++){svg.append(el('line',{x1:X(x),y1:top,x2:X(x),y2:split-18,stroke:C.grid}));addText(svg,X(x),split-2,String(x),{'text-anchor':'middle'});}
    for(let y=0;y<=100;y+=20){svg.append(el('line',{x1:left,y1:Y(y),x2:720-right,y2:Y(y),stroke:C.grid}));addText(svg,left-8,Y(y)+4,String(y),{'text-anchor':'end'});}
    svg.append(el('line',{x1:left,y1:Y(0),x2:720-right,y2:Y(0),stroke:C.navy,'stroke-width':2.2}));
    let d='';for(let i=0;i<=300;i++){const x=xmin+(xmax-xmin)*i/300,y=fit.predict(x);d+=`${i?'L':'M'}${X(x).toFixed(2)} ${Y(y).toFixed(2)} `;}
    svg.append(el('path',{d,fill:'none',stroke:set.family==='linear'?C.teal:C.maroon,'stroke-width':6,'stroke-linecap':'round'}));
    set.xs.forEach((x,i)=>svg.append(el('circle',{cx:X(x),cy:Y(set.ys[i]),r:8,fill:C.gold,stroke:'#fff','stroke-width':3})));
    const baseY=338,scale=10;
    addText(svg,left,294,'residual = observed − predicted',{fill:C.navy,'font-size':13,'font-weight':900});
    svg.append(el('line',{x1:left,y1:baseY,x2:720-right,y2:baseY,stroke:C.navy,'stroke-width':2.5}));
    [-4,-2,0,2,4].forEach(r=>{const y=baseY-r*scale;svg.append(el('line',{x1:left,y1:y,x2:720-right,y2:y,stroke:r===0?C.navy:C.grid,'stroke-width':r===0?2:1}));addText(svg,left-8,y+4,String(r),{'text-anchor':'end'});});
    set.xs.forEach((x,i)=>svg.append(el('circle',{cx:X(x),cy:baseY-res[i]*scale,r:7,fill:Math.abs(res[i])>3?C.red:C.teal,stroke:'#fff','stroke-width':3})));
  };
  root.addEventListener('click',event=>{const button=event.target.closest('[data-model-set]');if(button)render(button.dataset.modelSet);});render('linear');
}
function scan(){
  document.querySelectorAll('[data-el5-growth-lab]').forEach(initGrowth);
  document.querySelectorAll('[data-el5-transform-lab]').forEach(initTransform);
  document.querySelectorAll('[data-el5-model-lab]').forEach(initModel);
}
document.addEventListener('click',event=>{const button=event.target.closest('[data-cover-next]');if(button)document.getElementById('next-slide')?.click();});
new MutationObserver(scan).observe(app,{childList:true,subtree:true});scan();
data.interactions={release:'5.0.0',labs:['growth-rate','transformed-exponential','model-choice-residuals'],exactRecalculation:true};
})();
