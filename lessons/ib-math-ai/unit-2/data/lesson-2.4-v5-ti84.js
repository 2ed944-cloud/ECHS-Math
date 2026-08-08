(function(){
'use strict';
const data=window.LESSON_DATA;if(!data||String(data.lesson?.number)!=='2.4')return;
const $=(selector,root=document)=>root.querySelector(selector),$$=(selector,root=document)=>[...root.querySelectorAll(selector)];
const expData={x:[0,1,2,3,4,5,6],y:[18,24,31,42,55,74,98]};
function linearFit(xs,ys){const n=xs.length,sx=xs.reduce((a,b)=>a+b,0),sy=ys.reduce((a,b)=>a+b,0),sxx=xs.reduce((a,b)=>a+b*b,0),sxy=xs.reduce((a,b,i)=>a+b*ys[i],0),den=n*sxx-sx*sx,m=(n*sxy-sx*sy)/den,c=(sy-m*sx)/n;return{m,c};}
const logFit=linearFit(expData.x,expData.y.map(Math.log)),regA=Math.exp(logFit.c),regB=Math.exp(logFit.m),regPredict=x=>regA*regB**x;
const intersectX=Math.log(240/85)/Math.log(1.16);
const workflows={
  intersect:{code:'A',title:'Intersect · continuous threshold',prompt:'Solve 85(1.16)^t = 240 and record the continuous crossing time.',sequence:['Y=','Y₁=85(1.16)^X','Y₂=240','WINDOW','GRAPH','2nd','TRACE','5:intersect','ENTER ×3'],answer:intersectX,tolerance:.002,window:{xmin:0,xmax:10,ymin:50,ymax:310},functions:[x=>85*1.16**x,x=>240],result:`Intersection: X≈${intersectX.toFixed(3)}, Y=240`,verify:'Logarithms give t = ln(240/85) ÷ ln(1.16), and substitution returns approximately 240.',evidence:'Record Y₁, Y₂, a window displaying the crossing, the coordinate, units and a contextual sentence.'},
  table:{code:'B',title:'TABLE · first permitted integer',prompt:'For A(n)=18(1.12)^n, find the first whole n for which A(n)>50.',sequence:['Y=','Y₁=18(1.12)^X','2nd','WINDOW (TBLSET)','TblStart=7','ΔTbl=1','2nd','GRAPH (TABLE)'],answer:10,tolerance:.001,result:'A(9)=49.915<50; A(10)=55.905>50; first whole n=10',verify:'The adjacent permitted inputs prove both that n=10 works and that n=9 does not.',evidence:'Do not round the continuous crossing. Use ΔTbl=1 and compare the values immediately before and after the threshold.'},
  expreg:{code:'C',title:'ExpReg · fit, store and audit',prompt:'Fit y=ab^x to x=0,…,6 and y=18,24,31,42,55,74,98. Enter the fitted factor b.',sequence:['STAT','1:Edit','L₁ and L₂','STAT','CALC','0:ExpReg','L₁,L₂,Y₁','ENTER','2nd','Y= (Plot1)','ZOOM','9:ZoomStat'],answer:regB,tolerance:.0003,window:{xmin:-.5,xmax:8.5,ymin:0,ymax:190},functions:[regPredict],result:`ExpReg: y≈${regA.toFixed(4)}(${regB.toFixed(5)})^x; y(8)≈${regPredict(8).toFixed(3)}`,verify:'Compare predictions with the observations and inspect residuals. At x=4, observed−predicted is approximately −0.493.',evidence:'Interpret a as the modelled initial output and b−1 as the percentage growth per input unit. Restrict claims to the supported domain.'}
};
let dock,overlay,canvas,ctx,readout,tableHost,active='intersect',previousFocus,routeButton;
function markup(){
  const aside=document.createElement('aside');aside.id='el5-ti84-dock';aside.className='el5-ti-dock';aside.setAttribute('aria-hidden','true');aside.setAttribute('role','dialog');aside.setAttribute('aria-modal','true');aside.setAttribute('aria-labelledby','el5-ti84-title');
  aside.innerHTML=`<header class="el5-ti-head"><div><span>ECHS · LOCAL TI‑84 PLUS CE TRAINING</span><h2 id="el5-ti84-title">Lesson 2.4 calculator evidence lab</h2></div><button class="el5-ti-close" type="button" aria-label="Close TI-84 lab">×</button></header><div class="el5-ti-body"><section class="el5-ti-device"><div class="el5-ti-brand"><span>TI‑84 PLUS CE</span><span>ECHS LOCAL SIMULATOR</span></div><div class="el5-ti-screen"><canvas width="640" height="360" aria-label="Local TI-84 graph or table screen"></canvas><div class="el5-ti-readout" aria-live="polite">Select a workflow.</div><div data-ti-table hidden></div></div><div class="el5-ti-keys" aria-hidden="true"><span class="dark">Y=</span><span class="dark">WINDOW</span><span class="dark">ZOOM</span><span class="dark">TRACE</span><span class="dark">GRAPH</span><span class="gold">2nd</span><span>MODE</span><span>DEL</span><span>ALPHA</span><span>X,T,θ,n</span><span>STAT</span><span>MATH</span><span>APPS</span><span>PRGM</span><span>VARS</span><span>7</span><span>8</span><span>9</span><span>÷</span><span>ENTER</span></div></section><section class="el5-ti-guide"><div class="el5-ti-tabs">${Object.entries(workflows).map(([key,w])=>`<button type="button" data-ti-workflow="${key}">${w.code} · ${w.title.split(' · ')[0]}</button>`).join('')}</div><article class="el5-ti-panel"><span data-ti-code></span><h3 data-ti-title></h3><p data-ti-prompt></p><div class="el5-ti-sequence" data-ti-sequence></div><p><b>Independent check:</b> <span data-ti-verify></span></p><p><b>IB evidence:</b> <span data-ti-evidence></span></p><div class="el5-ti-actions"><button type="button" data-ti-render>Graph / Table</button><button class="secondary" type="button" data-ti-result>Show calculator result</button><button class="secondary" type="button" data-ti-reset>Reset</button></div></article><article class="el5-ti-panel"><div class="el5-ti-response"><input type="text" inputmode="decimal" data-ti-answer aria-label="Requested numerical answer" placeholder="Enter the requested numerical answer"><button type="button" data-ti-check>Check</button></div><div class="el5-ti-feedback" data-ti-feedback>Predict first, then produce calculator evidence and verify it independently.</div></article></section></div>`;
  return aside;
}
function build(){
  if(dock?.isConnected)return;
  overlay=document.createElement('div');overlay.className='el5-ti-overlay';document.body.append(overlay);
  dock=markup();document.body.append(dock);canvas=$('canvas',dock);ctx=canvas.getContext('2d');readout=$('.el5-ti-readout',dock);tableHost=$('[data-ti-table]',dock);
  $('.el5-ti-close',dock).addEventListener('click',close);overlay.addEventListener('click',close);
  $$('[data-ti-workflow]',dock).forEach(button=>button.addEventListener('click',()=>select(button.dataset.tiWorkflow)));
  $('[data-ti-render]',dock).addEventListener('click',render);$('[data-ti-result]',dock).addEventListener('click',showResult);$('[data-ti-reset]',dock).addEventListener('click',reset);$('[data-ti-check]',dock).addEventListener('click',check);
  select(active);
}
function installLauncher(){
  const route=$('.routebar');if(!route)return;
  routeButton=$('.el5-ti-launch',route);
  if(!routeButton){routeButton=document.createElement('button');routeButton.type='button';routeButton.className='el5-ti-launch';routeButton.setAttribute('aria-controls','el5-ti84-dock');routeButton.setAttribute('aria-pressed','false');routeButton.innerHTML='<span>84</span><b>TI‑84 Simulator</b>';routeButton.addEventListener('click',()=>open(active));route.append(routeButton);}
}
function focusables(){return dock?$$('button,input,[href],[tabindex]:not([tabindex="-1"])',dock).filter(node=>!node.disabled&&!node.hidden&&node.getClientRects().length):[];}
function open(workflow){build();installLauncher();if(typeof workflow==='string'&&workflows[workflow])select(workflow);previousFocus=document.activeElement;dock.classList.add('open');overlay.classList.add('show');dock.setAttribute('aria-hidden','false');document.body.classList.add('el5-ti-open');routeButton?.setAttribute('aria-pressed','true');setTimeout(()=>$('.el5-ti-close',dock)?.focus(),25);}
function close(){if(!dock)return;dock.classList.remove('open');overlay.classList.remove('show');dock.setAttribute('aria-hidden','true');document.body.classList.remove('el5-ti-open');routeButton?.setAttribute('aria-pressed','false');previousFocus?.focus?.();}
function select(key){
  active=workflows[key]?key:'intersect';const w=workflows[active];
  $$('[data-ti-workflow]',dock).forEach(button=>button.classList.toggle('active',button.dataset.tiWorkflow===active));
  $('[data-ti-code]',dock).textContent=`WORKFLOW ${w.code}`;$('[data-ti-title]',dock).textContent=w.title;$('[data-ti-prompt]',dock).textContent=w.prompt;$('[data-ti-verify]',dock).textContent=w.verify;$('[data-ti-evidence]',dock).textContent=w.evidence;
  $('[data-ti-sequence]',dock).innerHTML=w.sequence.map((step,index)=>`${index?'<i>→</i>':''}<kbd>${step}</kbd>`).join('');reset();
}
function reset(){
  if(!dock)return;canvas.hidden=false;tableHost.hidden=true;tableHost.innerHTML='';ctx.fillStyle='#d7e5c9';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#1c2a1e';ctx.font='700 15px ui-monospace, monospace';ctx.fillText('READY — estimate before calculating',18,30);readout.textContent='Ready — enter the model or data, then graph.';$('[data-ti-answer]',dock).value='';const feedback=$('[data-ti-feedback]',dock);feedback.textContent='Predict first, then produce calculator evidence and verify it independently.';feedback.className='el5-ti-feedback';
}
function xy(window,x,y){const p={l:54,r:20,t:22,b:42};return[p.l+(x-window.xmin)/(window.xmax-window.xmin)*(canvas.width-p.l-p.r),canvas.height-p.b-(y-window.ymin)/(window.ymax-window.ymin)*(canvas.height-p.t-p.b)];}
function axes(window){
  ctx.fillStyle='#d7e5c9';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.strokeStyle='#71836d';ctx.lineWidth=1;ctx.globalAlpha=.32;
  for(let i=0;i<=10;i++){const x=54+i*(canvas.width-74)/10;ctx.beginPath();ctx.moveTo(x,22);ctx.lineTo(x,canvas.height-42);ctx.stroke();const y=22+i*(canvas.height-64)/10;ctx.beginPath();ctx.moveTo(54,y);ctx.lineTo(canvas.width-20,y);ctx.stroke();}
  ctx.globalAlpha=1;ctx.strokeStyle='#1c2a1e';ctx.lineWidth=2;
  if(window.ymin<=0&&window.ymax>=0){const y=xy(window,0,0)[1];ctx.beginPath();ctx.moveTo(54,y);ctx.lineTo(canvas.width-20,y);ctx.stroke();}
  if(window.xmin<=0&&window.xmax>=0){const x=xy(window,0,0)[0];ctx.beginPath();ctx.moveTo(x,22);ctx.lineTo(x,canvas.height-42);ctx.stroke();}
  ctx.fillStyle='#1c2a1e';ctx.font='700 12px ui-monospace, monospace';ctx.fillText(String(window.xmin),52,canvas.height-18);ctx.fillText(String(window.xmax),canvas.width-52,canvas.height-18);ctx.fillText(String(window.ymax),6,32);ctx.fillText(String(window.ymin),6,canvas.height-44);
}
function plot(window,fn,color,dash=[]){
  ctx.strokeStyle=color;ctx.lineWidth=3.2;ctx.setLineDash(dash);ctx.beginPath();let drawing=false;
  for(let i=0;i<=700;i++){const x=window.xmin+(window.xmax-window.xmin)*i/700,y=fn(x),visible=Number.isFinite(y)&&y>=window.ymin-2*(window.ymax-window.ymin)&&y<=window.ymax+2*(window.ymax-window.ymin);if(!visible){drawing=false;continue;}const[p,q]=xy(window,x,y);if(!drawing){ctx.moveTo(p,q);drawing=true;}else ctx.lineTo(p,q);}
  ctx.stroke();ctx.setLineDash([]);
}
function renderIntersect(show=false){const w=workflows.intersect;canvas.hidden=false;tableHost.hidden=true;axes(w.window);plot(w.window,w.functions[0],'#6d2437');plot(w.window,w.functions[1],'#1b5f64',[8,5]);if(show){const[p,q]=xy(w.window,intersectX,240);ctx.fillStyle='#9a7317';ctx.beginPath();ctx.arc(p,q,7,0,Math.PI*2);ctx.fill();ctx.fillStyle='#1c2a1e';ctx.font='800 14px ui-monospace, monospace';ctx.fillText(`(${intersectX.toFixed(3)}, 240)`,Math.min(p+10,canvas.width-160),q-10);}readout.textContent=show?w.result:'WINDOW X:[0,10] Y:[50,310] · Y₁ and Y₂ graphed';}
function renderTable(show=false){canvas.hidden=true;tableHost.hidden=false;const rows=[7,8,9,10,11].map(n=>{const value=18*1.12**n;return `<tr><td>${n}</td><td>${value.toFixed(3)}</td><td>${value>50?'&gt; 50':'&lt; 50'}</td></tr>`;}).join('');tableHost.innerHTML=`<table class="el5-ti-table"><thead><tr><th>n</th><th>Y₁</th><th>compare</th></tr></thead><tbody>${rows}</tbody></table>`;readout.textContent=show?workflows.table.result:'TABLE · TblStart=7 · ΔTbl=1';}
function renderExpReg(show=false){const w=workflows.expreg;canvas.hidden=false;tableHost.hidden=true;axes(w.window);plot(w.window,regPredict,'#6d2437');expData.x.forEach((x,i)=>{const[p,q]=xy(w.window,x,expData.y[i]);ctx.fillStyle='#9a7317';ctx.beginPath();ctx.arc(p,q,6,0,Math.PI*2);ctx.fill();});if(show){const[p,q]=xy(w.window,8,regPredict(8));ctx.fillStyle='#1b5f64';ctx.beginPath();ctx.arc(p,q,7,0,Math.PI*2);ctx.fill();ctx.fillStyle='#1c2a1e';ctx.font='800 13px ui-monospace, monospace';ctx.fillText(`x=8 → ${regPredict(8).toFixed(3)}`,Math.min(p-110,canvas.width-145),q-10);}readout.textContent=show?w.result:`ExpReg curve with ${expData.x.length} observed points · X:[${w.window.xmin},${w.window.xmax}]`;}
function render(){if(active==='intersect')renderIntersect(false);else if(active==='table')renderTable(false);else renderExpReg(false);}
function showResult(){if(active==='intersect')renderIntersect(true);else if(active==='table')renderTable(true);else renderExpReg(true);}
function numberFrom(value){const match=String(value??'').replace(/,/g,'').replace(/[−–—]/g,'-').match(/[-+]?\d*\.?\d+(?:e[-+]?\d+)?/i);return match?Number(match[0]):NaN;}
function check(){const w=workflows[active],value=numberFrom($('[data-ti-answer]',dock).value),feedback=$('[data-ti-feedback]',dock);if(!Number.isFinite(value)){feedback.textContent='Enter a numerical response first.';feedback.className='el5-ti-feedback incorrect';return;}const correct=Math.abs(value-w.answer)<=w.tolerance;feedback.textContent=correct?`Accepted. ${w.verify}`:'Not yet. Recheck the model or lists, selected command, bounds, discrete condition and rounding.';feedback.className=`el5-ti-feedback ${correct?'correct':'incorrect'}`;}
function init(){
  build();installLauncher();
  document.addEventListener('click',event=>{const button=event.target.closest?.('[data-open-ti84]');if(button){event.preventDefault();open(button.dataset.openTi84||active);return;}if(event.target.closest?.('[data-route]'))close();});
  document.addEventListener('keydown',event=>{if(!dock?.classList.contains('open'))return;if(event.key==='Escape'){event.preventDefault();close();return;}if(event.key==='Tab'){const items=focusables();if(!items.length)return;const first=items[0],last=items[items.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}});
  data.ti84={release:'5.0.0',provider:'local lesson simulator',model:'TI-84 Plus CE',workflows:Object.keys(workflows),externalService:false,iframe:false,manualFirst:true};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
