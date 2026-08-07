(function(){
  'use strict';
  const data=window.LESSON_DATA,app=document.getElementById('app');
  if(!data||String(data.lesson?.number)!=='2.2'||!app)return;
  const NS='http://www.w3.org/2000/svg';
  const C={navy:'#17324d',maroon:'#7a1733',teal:'#177e89',gold:'#d4a72c',grid:'#e7e0d7',muted:'#5d6a75'};
  const num=value=>Number(value);
  const el=(name,attrs={})=>{const node=document.createElementNS(NS,name);Object.entries(attrs).forEach(([key,value])=>node.setAttribute(key,String(value)));return node;};
  const clear=node=>{while(node&&node.firstChild)node.removeChild(node.firstChild);};
  function axes(svg){
    clear(svg);svg.setAttribute('viewBox','0 0 620 360');
    svg.append(el('rect',{x:1,y:1,width:618,height:358,rx:22,fill:'#fff',stroke:'#d9d1c8'}));
    for(let x=70;x<=570;x+=50)svg.append(el('line',{x1:x,y1:28,x2:x,y2:330,stroke:C.grid}));
    for(let y=55;y<=305;y+=50)svg.append(el('line',{x1:35,y1:y,x2:590,y2:y,stroke:C.grid}));
    svg.append(el('line',{x1:35,y1:180,x2:590,y2:180,stroke:C.navy,'stroke-width':2.5}));
    svg.append(el('line',{x1:310,y1:330,x2:310,y2:28,stroke:C.navy,'stroke-width':2.5}));
  }
  function initLinear(root){
    if(root.dataset.ready==='1')return;root.dataset.ready='1';
    const m=root.querySelector('[data-linear-m]'),c=root.querySelector('[data-linear-c]'),out=root.querySelector('[data-linear-equation]'),svg=root.querySelector('[data-linear-svg]');
    const X=x=>310+x*43,Y=y=>180-y*22;
    const draw=()=>{axes(svg);const M=num(m.value),C0=num(c.value),x1=-6,x2=6;svg.append(el('line',{x1:X(x1),y1:Y(M*x1+C0),x2:X(x2),y2:Y(M*x2+C0),stroke:C.maroon,'stroke-width':7,'stroke-linecap':'round'}));svg.append(el('circle',{cx:X(0),cy:Y(C0),r:8,fill:C.gold,stroke:'#fff','stroke-width':4}));out.textContent=`y = ${M}x ${C0>=0?'+':'−'} ${Math.abs(C0)}`;};
    m.addEventListener('input',draw);c.addEventListener('input',draw);draw();
  }
  function initQuadratic(root){
    if(root.dataset.ready==='1')return;root.dataset.ready='1';
    const a=root.querySelector('[data-quadratic-a]'),h=root.querySelector('[data-quadratic-h]'),k=root.querySelector('[data-quadratic-k]'),out=root.querySelector('[data-quadratic-equation]'),svg=root.querySelector('[data-quadratic-svg]');
    const X=x=>310+x*43,Y=y=>180-y*19;
    const draw=()=>{axes(svg);let A=num(a.value);if(Math.abs(A)<.01){A=.5;a.value='.5';}const H=num(h.value),K=num(k.value);let d='';for(let i=0;i<=220;i++){const x=-6+i*12/220,y=A*(x-H)**2+K;if(y<-9||y>9){d+=' ';continue;}d+=`${d.trim()?'L':'M'}${X(x).toFixed(2)} ${Y(y).toFixed(2)} `;}svg.append(el('path',{d,fill:'none',stroke:C.teal,'stroke-width':7,'stroke-linecap':'round'}));svg.append(el('line',{x1:X(H),y1:28,x2:X(H),y2:330,stroke:C.gold,'stroke-width':3,'stroke-dasharray':'8 7'}));svg.append(el('circle',{cx:X(H),cy:Y(K),r:9,fill:C.maroon,stroke:'#fff','stroke-width':4}));out.textContent=`y = ${A}(x ${H>=0?'−':'+'} ${Math.abs(H)})² ${K>=0?'+':'−'} ${Math.abs(K)}`;};
    [a,h,k].forEach(input=>input.addEventListener('input',draw));draw();
  }
  function initDifference(root){
    if(root.dataset.ready==='1')return;root.dataset.ready='1';
    const table=root.querySelector('[data-model-table]'),verdict=root.querySelector('[data-model-verdict]');
    const sets={
      linear:{x:[0,1,2,3,4],y:[5,8,11,14,17],verdict:'Constant first difference 3 supports a linear model.'},
      quadratic:{x:[0,1,2,3,4],y:[3,8,17,30,47],verdict:'First differences 5, 9, 13, 17 and constant second difference 4 support a quadratic model.'},
      neither:{x:[0,1,2,3,4],y:[2,6,13,25,46],verdict:'Neither first nor second differences are constant; do not force a linear or quadratic model.'}
    };
    const render=key=>{const set=sets[key],d1=set.y.slice(1).map((value,index)=>value-set.y[index]),d2=d1.slice(1).map((value,index)=>value-d1[index]);table.innerHTML=`<table class="lq5-table"><thead><tr><th>x</th>${set.x.map(value=>`<td>${value}</td>`).join('')}</tr></thead><tbody><tr><th>y</th>${set.y.map(value=>`<td>${value}</td>`).join('')}</tr><tr><th>Δy</th><td></td>${d1.map(value=>`<td>${value}</td>`).join('')}</tr><tr><th>Δ²y</th><td></td><td></td>${d2.map(value=>`<td>${value}</td>`).join('')}</tr></tbody></table>`;verdict.innerHTML=`<b>Decision:</b> ${set.verdict}`;root.querySelectorAll('[data-model-set]').forEach(button=>button.classList.toggle('active',button.dataset.modelSet===key));};
    root.addEventListener('click',event=>{const button=event.target.closest('[data-model-set]');if(button)render(button.dataset.modelSet);});render('linear');
  }
  function initResidual(root){
    if(root.dataset.ready==='1')return;root.dataset.ready='1';
    const svg=root.querySelector('[data-residual-svg]'),verdict=root.querySelector('[data-residual-verdict]');
    const sets={
      random:{points:[[1,.8],[2,-1.1],[3,.4],[4,-.3],[5,1],[6,-.7],[7,.1],[8,-.9],[9,.6]],verdict:'Patternless residuals support the model, provided their size is acceptable in context.'},
      curve:{points:[[1,-3],[2,-1.6],[3,.4],[4,2.1],[5,3],[6,2.2],[7,.5],[8,-1.7],[9,-3.2]],verdict:'The curved pattern shows systematic model error; a linear model is missing curvature.'},
      outlier:{points:[[1,.4],[2,-.5],[3,.2],[4,-.2],[5,4.2],[6,.3],[7,-.4],[8,.1],[9,-.3]],verdict:'Most residuals are small but one point is influential; investigate the data point before changing model family.'}
    };
    const draw=key=>{const set=sets[key];clear(svg);svg.append(el('rect',{x:1,y:1,width:718,height:358,rx:22,fill:'#fff',stroke:'#d9d1c8'}));for(let x=65;x<=665;x+=60)svg.append(el('line',{x1:x,y1:30,x2:x,y2:325,stroke:C.grid}));for(let y=60;y<=300;y+=60)svg.append(el('line',{x1:40,y1:y,x2:690,y2:y,stroke:C.grid}));svg.append(el('line',{x1:40,y1:180,x2:690,y2:180,stroke:C.navy,'stroke-width':3}));set.points.forEach(([x,y])=>svg.append(el('circle',{cx:55+x*65,cy:180-y*42,r:8,fill:Math.abs(y)>3.5?C.maroon:C.teal,stroke:'#fff','stroke-width':3})));verdict.innerHTML=`<b>Decision:</b> ${set.verdict}`;root.querySelectorAll('[data-residual-set]').forEach(button=>button.classList.toggle('active',button.dataset.residualSet===key));};
    root.addEventListener('click',event=>{const button=event.target.closest('[data-residual-set]');if(button)draw(button.dataset.residualSet);});draw('random');
  }
  function scan(){
    document.querySelectorAll('[data-lq5-linear-lab]').forEach(initLinear);
    document.querySelectorAll('[data-lq5-quadratic-lab]').forEach(initQuadratic);
    document.querySelectorAll('[data-lq5-difference-lab]').forEach(initDifference);
    document.querySelectorAll('[data-lq5-residual-lab]').forEach(initResidual);
  }
  document.addEventListener('click',event=>{const button=event.target.closest('[data-cover-next]');if(button)document.getElementById('next-slide')?.click();});
  new MutationObserver(scan).observe(app,{childList:true,subtree:true});scan();
})();
