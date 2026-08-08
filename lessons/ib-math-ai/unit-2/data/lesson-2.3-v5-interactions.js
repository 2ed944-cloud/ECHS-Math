(function(){
  'use strict';
  if(String(window.LESSON_DATA?.lesson?.number)!=='2.3')return;
  const NS='http://www.w3.org/2000/svg',C={navy:'#17324d',maroon:'#7a1733',teal:'#177e89',gold:'#d4a72c',grid:'#e6ded5',muted:'#5d6a75'};
  const el=(name,attrs={})=>{const n=document.createElementNS(NS,name);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,String(v)));return n;};
  const clear=node=>{while(node?.firstChild)node.removeChild(node.firstChild);};
  function axes(svg,{xmin,xmax,ymin,ymax,w=760,h=390}){
    clear(svg);svg.setAttribute('viewBox',`0 0 ${w} ${h}`);const m={l:62,r:28,t:25,b:48};const X=x=>m.l+(x-xmin)/(xmax-xmin)*(w-m.l-m.r),Y=y=>h-m.b-(y-ymin)/(ymax-ymin)*(h-m.t-m.b);
    svg.append(el('rect',{x:1,y:1,width:w-2,height:h-2,rx:20,fill:'#fff',stroke:'#d8d0c7'}));
    for(let i=0;i<=10;i++){const x=xmin+(xmax-xmin)*i/10;svg.append(el('line',{x1:X(x),y1:m.t,x2:X(x),y2:h-m.b,stroke:C.grid}));}
    for(let i=0;i<=8;i++){const y=ymin+(ymax-ymin)*i/8;svg.append(el('line',{x1:m.l,y1:Y(y),x2:w-m.r,y2:Y(y),stroke:C.grid}));}
    if(ymin<=0&&ymax>=0)svg.append(el('line',{x1:m.l,y1:Y(0),x2:w-m.r,y2:Y(0),stroke:C.navy,'stroke-width':2.4}));
    if(xmin<=0&&xmax>=0)svg.append(el('line',{x1:X(0),y1:h-m.b,x2:X(0),y2:m.t,stroke:C.navy,'stroke-width':2.4}));
    return{X,Y,w,h,m};
  }
  function path(svg,fn,scale,color=C.maroon,width=6){const {X,Y}=scale;let d='';for(let i=0;i<=500;i++){const x=scale.xmin+(scale.xmax-scale.xmin)*i/500,y=fn(x);if(!Number.isFinite(y)||y<scale.ymin-2*(scale.ymax-scale.ymin)||y>scale.ymax+2*(scale.ymax-scale.ymin)){d+=' M';continue;}d+=`${i?'L':'M'}${X(x).toFixed(2)} ${Y(y).toFixed(2)} `;}svg.append(el('path',{d,fill:'none',stroke:color,'stroke-width':width,'stroke-linecap':'round','stroke-linejoin':'round'}));}
  function initEnd(root){if(root.dataset.ready==='1')return;root.dataset.ready='1';const degree=root.querySelector('[data-end-degree]'),a=root.querySelector('[data-end-a]'),out=root.querySelector('[data-end-equation]'),svg=root.querySelector('[data-end-svg]'),verdict=root.querySelector('[data-end-verdict]');const draw=()=>{let n=Number(degree.value),A=Number(a.value);if(Math.abs(A)<.01){A=.5;a.value=.5;}const ymax=Math.max(4,Math.abs(A)*1.75**n*1.15),ymin=-ymax;const scale=axes(svg,{xmin:-2,xmax:2,ymin,ymax});Object.assign(scale,{xmin:-2,xmax:2,ymin,ymax});path(svg,x=>A*x**n,scale,A>0?C.teal:C.maroon,7);const parity=n%2?'odd':'even',left=parity==='even'?(A>0?'up':'down'):(A>0?'down':'up'),right=A>0?'up':'down';out.textContent=`y = ${A}x^${n}`;verdict.innerHTML=`<b>${parity} degree, ${A>0?'positive':'negative'} leading coefficient:</b> left end ${left}; right end ${right}; at most ${n-1} turning point${n-1===1?'':'s'}.`;};degree.addEventListener('input',draw);a.addEventListener('input',draw);draw();}
  const xs=[0,1,2,3,4,5,6,7],ys=[18,25.5,23.2,21.2,17,20.2,28.4,50.4];
  const models={
    linear:{name:'Linear',fn:x=>2.71547619*x+15.98333333,r2:.382918,ss:499.0887},
    quadratic:{name:'Quadratic',fn:x=>1.25892857*x*x-6.09702381*x+24.79583333,r2:.712131,ss:232.8253},
    cubic:{name:'Cubic',fn:x=>.6209596*x**3-5.26114719*x*x+10.97936508*x+18.27575758,r2:.995321,ss:3.78435}
  };
  function initResidual(root){if(root.dataset.ready==='1')return;root.dataset.ready='1';const fitSvg=root.querySelector('[data-residual-fit]'),resSvg=root.querySelector('[data-residual-plot]'),verdict=root.querySelector('[data-residual-verdict]');let active='cubic';const draw=()=>{const model=models[active];let scale=axes(fitSvg,{xmin:-.5,xmax:7.5,ymin:10,ymax:55,w:760,h:340});Object.assign(scale,{xmin:-.5,xmax:7.5,ymin:10,ymax:55});path(fitSvg,model.fn,scale,active==='cubic'?C.maroon:active==='quadratic'?C.gold:C.teal,6);xs.forEach((x,i)=>fitSvg.append(el('circle',{cx:scale.X(x),cy:scale.Y(ys[i]),r:6,fill:C.teal,stroke:'#fff','stroke-width':3})));
      const residuals=xs.map((x,i)=>ys[i]-model.fn(x)),limit=Math.max(2,Math.ceil(Math.max(...residuals.map(Math.abs))));let rs=axes(resSvg,{xmin:-.5,xmax:7.5,ymin:-limit,ymax:limit,w:760,h:250});Object.assign(rs,{xmin:-.5,xmax:7.5,ymin:-limit,ymax:limit});resSvg.append(el('line',{x1:rs.m.l,y1:rs.Y(0),x2:760-rs.m.r,y2:rs.Y(0),stroke:C.navy,'stroke-width':2,'stroke-dasharray':'6 5'}));residuals.forEach((r,i)=>resSvg.append(el('circle',{cx:rs.X(xs[i]),cy:rs.Y(r),r:6,fill:r>=0?C.teal:C.maroon,stroke:'#fff','stroke-width':3})));
      root.querySelectorAll('[data-residual-model]').forEach(button=>button.classList.toggle('active',button.dataset.residualModel===active));verdict.innerHTML=`<b>${model.name} model:</b> R² ≈ ${model.r2.toFixed(3)}, SSres ≈ ${model.ss.toFixed(2)}. ${active==='cubic'?'The residuals are small and patternless inside the observed interval.':'The residual pattern and error size indicate missing curvature.'}`;};root.addEventListener('click',event=>{const button=event.target.closest('[data-residual-model]');if(button){active=button.dataset.residualModel;draw();}});draw();}
  function scan(){document.querySelectorAll('[data-pr5-end-lab]').forEach(initEnd);document.querySelectorAll('[data-pr5-residual-lab]').forEach(initResidual);}
  const app=document.getElementById('app');if(app)new MutationObserver(scan).observe(app,{childList:true,subtree:true});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scan,{once:true});else scan();
})();
