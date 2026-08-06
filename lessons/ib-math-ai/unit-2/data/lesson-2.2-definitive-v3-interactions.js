(function(){
'use strict';
const data=window.LESSON_DATA;
if(!data||String(data.lesson?.number)!=='2.2')return;
const NS='http://www.w3.org/2000/svg';
const num=value=>Number(value);
function svgEl(name,attrs={}){const node=document.createElementNS(NS,name);Object.entries(attrs).forEach(([k,v])=>node.setAttribute(k,String(v)));return node;}
function clear(node){while(node&&node.firstChild)node.removeChild(node.firstChild);}
function axes(svg){
  clear(svg);svg.setAttribute('viewBox','0 0 520 300');
  svg.append(svgEl('rect',{x:1,y:1,width:518,height:298,rx:18,fill:'#fff',stroke:'#d9cec3'}));
  for(let x=60;x<=480;x+=40)svg.append(svgEl('line',{x1:x,y1:24,x2:x,y2:276,stroke:'#eee7df','stroke-width':1}));
  for(let y=40;y<=260;y+=40)svg.append(svgEl('line',{x1:34,y1:y,x2:494,y2:y,stroke:'#eee7df','stroke-width':1}));
  svg.append(svgEl('line',{x1:34,y1:150,x2:494,y2:150,stroke:'#17324d','stroke-width':2.5}));
  svg.append(svgEl('line',{x1:260,y1:276,x2:260,y2:24,stroke:'#17324d','stroke-width':2.5}));
}
function initLinear(root){
  if(root.dataset.ready==='1')return;root.dataset.ready='1';
  const m=root.querySelector('[data-linear-m]'),c=root.querySelector('[data-linear-c]'),out=root.querySelector('[data-linear-equation]'),svg=root.querySelector('[data-linear-svg]');
  const draw=()=>{axes(svg);const M=num(m.value),C=num(c.value),mapX=x=>260+x*38,mapY=y=>150-y*18;const x1=-6,x2=6,y1=M*x1+C,y2=M*x2+C;svg.append(svgEl('line',{x1:mapX(x1),y1:mapY(y1),x2:mapX(x2),y2:mapY(y2),stroke:'#7a1733','stroke-width':6,'stroke-linecap':'round'}));svg.append(svgEl('circle',{cx:mapX(0),cy:mapY(C),r:7,fill:'#d4a72c',stroke:'#fff','stroke-width':3}));out.textContent=`y = ${M}x ${C>=0?'+':'−'} ${Math.abs(C)}`;};
  m.addEventListener('input',draw);c.addEventListener('input',draw);draw();
}
function initQuadratic(root){
  if(root.dataset.ready==='1')return;root.dataset.ready='1';
  const a=root.querySelector('[data-quadratic-a]'),h=root.querySelector('[data-quadratic-h]'),k=root.querySelector('[data-quadratic-k]'),out=root.querySelector('[data-quadratic-equation]'),svg=root.querySelector('[data-quadratic-svg]');
  const draw=()=>{axes(svg);let A=num(a.value);if(Math.abs(A)<.01){A=.5;a.value=.5;}const H=num(h.value),K=num(k.value),mapX=x=>260+x*38,mapY=y=>150-y*16;let d='';for(let i=0;i<=160;i++){const x=-6+i*12/160,y=A*(x-H)**2+K;d+=`${i?'L':'M'}${mapX(x).toFixed(2)} ${mapY(y).toFixed(2)}`;}svg.append(svgEl('path',{d,fill:'none',stroke:'#177e89','stroke-width':6,'stroke-linecap':'round'}));svg.append(svgEl('line',{x1:mapX(H),y1:28,x2:mapX(H),y2:272,stroke:'#d4a72c','stroke-width':3,'stroke-dasharray':'8 7'}));svg.append(svgEl('circle',{cx:mapX(H),cy:mapY(K),r:8,fill:'#7a1733',stroke:'#fff','stroke-width':3}));out.textContent=`y = ${A}(x ${H>=0?'−':'+'} ${Math.abs(H)})² ${K>=0?'+':'−'} ${Math.abs(K)}`;};
  [a,h,k].forEach(input=>input.addEventListener('input',draw));draw();
}
function initModel(root){
  if(root.dataset.ready==='1')return;root.dataset.ready='1';
  const table=root.querySelector('[data-model-table]'),verdict=root.querySelector('[data-model-verdict]');
  const sets={linear:{x:[0,1,2,3,4],y:[5,8,11,14,17]},quadratic:{x:[0,1,2,3,4],y:[3,8,17,30,47]}};
  const render=key=>{const set=sets[key],d1=set.y.slice(1).map((v,i)=>v-set.y[i]),d2=d1.slice(1).map((v,i)=>v-d1[i]);table.innerHTML=`<table><thead><tr><th>x</th>${set.x.map(v=>`<td>${v}</td>`).join('')}</tr></thead><tbody><tr><th>y</th>${set.y.map(v=>`<td>${v}</td>`).join('')}</tr><tr><th>Δy</th><td></td>${d1.map(v=>`<td>${v}</td>`).join('')}</tr><tr><th>Δ²y</th><td></td><td></td>${d2.map(v=>`<td>${v}</td>`).join('')}</tr></tbody></table>`;verdict.innerHTML=key==='linear'?'<b>Linear evidence:</b> constant first difference 3.':'<b>Quadratic evidence:</b> first differences 5, 9, 13, 17 and constant second difference 4.';root.querySelectorAll('[data-model-set]').forEach(button=>button.classList.toggle('active',button.dataset.modelSet===key));};
  root.addEventListener('click',event=>{const button=event.target.closest('[data-model-set]');if(button)render(button.dataset.modelSet);});render('linear');
}
function scan(){document.querySelectorAll('[data-l22-linear-lab]').forEach(initLinear);document.querySelectorAll('[data-l22-quadratic-lab]').forEach(initQuadratic);document.querySelectorAll('[data-l22-model-lab]').forEach(initModel);}
new MutationObserver(scan).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scan,{once:true});else scan();
})();
