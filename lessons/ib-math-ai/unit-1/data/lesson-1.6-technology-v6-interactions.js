(function(){
'use strict';
const data=window.LESSON_DATA;if(!data||String(data.lesson?.number)!=='1.6')return;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const format=(value,digits=4)=>{
  if(!Number.isFinite(value))return 'undefined';
  if(Math.abs(value)<1e-12)return '0';
  return Number(value.toFixed(digits)).toString();
};
const esc=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const scheduleMath=root=>requestAnimationFrame(()=>{
  if(window.renderMath)window.renderMath(root);
  else if(window.katex){
    root.querySelectorAll('[data-te-tex]').forEach(node=>{
      try{node.innerHTML=window.katex.renderToString(node.dataset.teTex,{throwOnError:false,strict:'ignore'});}catch(_){node.textContent=node.dataset.teTex;}
    });
  }
});

function mountSystem(root){
  if(root.dataset.mounted==='1')return;root.dataset.mounted='1';
  root.innerHTML=`<div class="te-lab-shell"><div class="te-lab-controls">
    <label><span>Line 1 gradient <output data-out="m1">1</output></span><input type="range" min="-4" max="4" step="0.25" value="1" data-field="m1"></label>
    <label><span>Line 1 intercept <output data-out="b1">1</output></span><input type="range" min="-5" max="5" step="0.5" value="1" data-field="b1"></label>
    <label><span>Line 2 gradient <output data-out="m2">-1</output></span><input type="range" min="-4" max="4" step="0.25" value="-1" data-field="m2"></label>
    <label><span>Line 2 intercept <output data-out="b2">3</output></span><input type="range" min="-5" max="5" step="0.5" value="3" data-field="b2"></label>
    <div class="te-lab-presets"><button type="button" data-preset="unique">Unique</button><button type="button" data-preset="none">No solution</button><button type="button" data-preset="many">Infinitely many</button></div>
  </div><div class="te-lab-display"><svg viewBox="0 0 560 330" role="img" aria-label="Two linear graphs"><g class="grid"></g><g class="axes"></g><path class="line line-one"></path><path class="line line-two"></path><circle class="intersection" r="7"></circle></svg><div class="te-lab-result" aria-live="polite"></div></div></div>`;
  const fields=Object.fromEntries([...root.querySelectorAll('[data-field]')].map(node=>[node.dataset.field,node]));
  const path1=root.querySelector('.line-one'),path2=root.querySelector('.line-two'),point=root.querySelector('.intersection'),result=root.querySelector('.te-lab-result');
  const sx=x=>42+(x+6)/12*486,sy=y=>294-(y+6)/12*252;
  const grid=root.querySelector('.grid'),axes=root.querySelector('.axes');
  let gridHTML='';for(let value=-6;value<=6;value+=2){gridHTML+=`<line x1="${sx(value)}" y1="42" x2="${sx(value)}" y2="294"></line><line x1="42" y1="${sy(value)}" x2="528" y2="${sy(value)}"></line>`;}grid.innerHTML=gridHTML;
  axes.innerHTML=`<line x1="42" y1="${sy(0)}" x2="528" y2="${sy(0)}"></line><line x1="${sx(0)}" y1="42" x2="${sx(0)}" y2="294"></line>`;
  const update=()=>{
    const v=Object.fromEntries(Object.entries(fields).map(([key,node])=>[key,Number(node.value)]));
    Object.entries(v).forEach(([key,value])=>{root.querySelector(`[data-out="${key}"]`).textContent=format(value,2);});
    path1.setAttribute('d',`M ${sx(-6)} ${sy(clamp(v.m1*-6+v.b1,-12,12))} L ${sx(6)} ${sy(clamp(v.m1*6+v.b1,-12,12))}`);
    path2.setAttribute('d',`M ${sx(-6)} ${sy(clamp(v.m2*-6+v.b2,-12,12))} L ${sx(6)} ${sy(clamp(v.m2*6+v.b2,-12,12))}`);
    const delta=v.m2-v.m1,eps=1e-8;
    let title,detail,kind,x,y;
    if(Math.abs(delta)>eps){x=(v.b1-v.b2)/delta;y=v.m1*x+v.b1;title='Unique solution';detail=`Intersection: (${format(x,3)}, ${format(y,3)}); determinant Δ = ${format(delta,2)} ≠ 0.`;kind='unique';}
    else if(Math.abs(v.b1-v.b2)<eps){title='Dependent system';detail='The equations describe the same line; infinitely many ordered pairs satisfy both.';kind='many';}
    else{title='Inconsistent system';detail='The lines are parallel and distinct; no ordered pair satisfies both.';kind='none';}
    result.className=`te-lab-result ${kind}`;result.innerHTML=`<b>${title}</b><span>${esc(detail)}</span><small>Equations: y = ${format(v.m1,2)}x ${v.b1<0?'−':'+'} ${format(Math.abs(v.b1),2)} and y = ${format(v.m2,2)}x ${v.b2<0?'−':'+'} ${format(Math.abs(v.b2),2)}</small>`;
    if(kind==='unique'&&x>=-6&&x<=6&&y>=-6&&y<=6){point.style.display='';point.setAttribute('cx',sx(x));point.setAttribute('cy',sy(y));}else point.style.display='none';
  };
  Object.values(fields).forEach(node=>node.addEventListener('input',update));
  root.querySelectorAll('[data-preset]').forEach(button=>button.addEventListener('click',()=>{
    const presets={unique:[1,1,-1,3],none:[1,1,1,-2],many:[1,1,1,1]};
    [fields.m1.value,fields.b1.value,fields.m2.value,fields.b2.value]=presets[button.dataset.preset];update();
  }));
  update();
}

function mountResidual(root){
  if(root.dataset.mounted==='1')return;root.dataset.mounted='1';
  root.innerHTML=`<div class="te-residual-shell"><div class="te-residual-equations"><b>Candidate for</b><span data-te-tex="5x-2y=4"></span><span data-te-tex="3x+y=13"></span></div><div class="te-residual-inputs"><label>x<input type="number" step="0.000001" value="2.727273" data-residual="x"></label><label>y<input type="number" step="0.000001" value="4.818182" data-residual="y"></label><div class="te-lab-presets"><button type="button" data-rpreset="exact">Exact</button><button type="button" data-rpreset="rounded">Rounded</button><button type="button" data-rpreset="wrong">Incorrect</button></div></div><div class="te-residual-output" aria-live="polite"></div></div>`;
  const x=root.querySelector('[data-residual="x"]'),y=root.querySelector('[data-residual="y"]'),out=root.querySelector('.te-residual-output');
  const update=()=>{
    const xv=Number(x.value),yv=Number(y.value),r1=5*xv-2*yv-4,r2=3*xv+yv-13,max=Math.max(Math.abs(r1),Math.abs(r2));
    const kind=max<1e-10?'exact':max<5e-6?'close':'wrong';
    const message=kind==='exact'?'Both equations are satisfied exactly at the displayed precision.':kind==='close'?'Residuals are very small; the candidate is consistent with six-decimal rounding.':'At least one residual is too large for a claimed precise solution.';
    out.className=`te-residual-output ${kind}`;out.innerHTML=`<div><span>r₁</span><b>${format(r1,8)}</b></div><div><span>r₂</span><b>${format(r2,8)}</b></div><div><span>max |r|</span><b>${format(max,8)}</b></div><p>${message}</p>`;
  };
  [x,y].forEach(node=>node.addEventListener('input',update));
  root.querySelectorAll('[data-rpreset]').forEach(button=>button.addEventListener('click',()=>{
    const presets={exact:[30/11,53/11],rounded:[2.727273,4.818182],wrong:[2.7,4.8]};[x.value,y.value]=presets[button.dataset.rpreset];update();
  }));
  scheduleMath(root);update();
}

function mountPolynomial(root){
  if(root.dataset.mounted==='1')return;root.dataset.mounted='1';
  root.innerHTML=`<div class="te-poly-shell"><div class="te-poly-controls">
    <label><span>Root 1 <output data-pout="r1">-2</output></span><input type="range" min="-4" max="4" step="1" value="-2" data-root="r1"></label>
    <label><span>Root 2 <output data-pout="r2">1</output></span><input type="range" min="-4" max="4" step="1" value="1" data-root="r2"></label>
    <label><span>Root 3 <output data-pout="r3">3</output></span><input type="range" min="-4" max="4" step="1" value="3" data-root="r3"></label>
    <div class="te-lab-presets"><button type="button" data-ppreset="distinct">Distinct</button><button type="button" data-ppreset="double">Double root</button><button type="button" data-ppreset="triple">Triple root</button></div>
    <div class="te-poly-forms"><div><span>Factored</span><b data-factor></b></div><div><span>Expanded</span><b data-expanded></b></div></div>
  </div><div class="te-poly-graph"><svg viewBox="0 0 560 330" role="img" aria-label="Cubic polynomial graph"><g class="grid"></g><g class="axes"></g><path class="poly-curve"></path><g class="root-points"></g></svg><div class="te-poly-note" aria-live="polite"></div></div></div>`;
  const fields=Object.fromEntries([...root.querySelectorAll('[data-root]')].map(node=>[node.dataset.root,node]));
  const sx=x=>42+(x+5)/10*486,sy=(y,min,max)=>294-(y-min)/(max-min)*252;
  const grid=root.querySelector('.grid'),axes=root.querySelector('.axes');
  let gridHTML='';for(let value=-4;value<=4;value+=2)gridHTML+=`<line x1="${sx(value)}" y1="42" x2="${sx(value)}" y2="294"></line>`;grid.innerHTML=gridHTML;
  const curve=root.querySelector('.poly-curve'),points=root.querySelector('.root-points'),factor=root.querySelector('[data-factor]'),expanded=root.querySelector('[data-expanded]'),note=root.querySelector('.te-poly-note');
  const f=(x,r)=>r.reduce((value,rootValue)=>value*(x-rootValue),1);
  const factorTerm=r=>r===0?'x':r>0?`(x−${r})`:`(x+${Math.abs(r)})`;
  const polynomialText=(a,b,c)=>`x³ ${a<0?'−':'+'} ${Math.abs(a)}x² ${b<0?'−':'+'} ${Math.abs(b)}x ${c<0?'−':'+'} ${Math.abs(c)}`;
  const update=()=>{
    const r=Object.values(fields).map(node=>Number(node.value));Object.keys(fields).forEach((key,index)=>root.querySelector(`[data-pout="${key}"]`).textContent=r[index]);
    const s1=r[0]+r[1]+r[2],s2=r[0]*r[1]+r[0]*r[2]+r[1]*r[2],s3=r[0]*r[1]*r[2];
    factor.textContent=r.map(factorTerm).join('');expanded.textContent=polynomialText(-s1,s2,-s3);
    const samples=[];for(let i=0;i<=220;i++){const x=-5+i/220*10;samples.push([x,f(x,r)]);}const ys=samples.map(item=>item[1]);let max=Math.max(6,...ys.map(Math.abs));max=Math.min(160,max*1.08);const min=-max;
    curve.setAttribute('d',samples.map(([x,y],index)=>`${index?'L':'M'} ${sx(x)} ${sy(clamp(y,min,max),min,max)}`).join(' '));
    axes.innerHTML=`<line x1="42" y1="${sy(0,min,max)}" x2="528" y2="${sy(0,min,max)}"></line><line x1="${sx(0)}" y1="42" x2="${sx(0)}" y2="294"></line>`;
    points.innerHTML=[...new Set(r)].map(value=>`<circle cx="${sx(value)}" cy="${sy(0,min,max)}" r="7"></circle><text x="${sx(value)}" y="${sy(0,min,max)+24}" text-anchor="middle">${value}</text>`).join('');
    const counts=r.reduce((map,value)=>(map[value]=(map[value]||0)+1,map),{});const multiplicity=Object.entries(counts).map(([value,count])=>`${value}: multiplicity ${count}`).join(' · ');
    note.innerHTML=`<b>Root audit</b><span>${esc(multiplicity)}</span><small>${new Set(r).size} distinct x-intercept${new Set(r).size===1?'':'s'}; 3 roots counted with multiplicity.</small>`;
  };
  Object.values(fields).forEach(node=>node.addEventListener('input',update));
  root.querySelectorAll('[data-ppreset]').forEach(button=>button.addEventListener('click',()=>{
    const presets={distinct:[-2,1,3],double:[-2,2,2],triple:[1,1,1]};[fields.r1.value,fields.r2.value,fields.r3.value]=presets[button.dataset.ppreset];update();
  }));update();
}

function scan(root=document){
  root.querySelectorAll('[data-te-lab="system"]').forEach(mountSystem);
  root.querySelectorAll('[data-te-lab="residual"]').forEach(mountResidual);
  root.querySelectorAll('[data-te-lab="polynomial"]').forEach(mountPolynomial);
}
function init(){scan();new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(node=>{if(node.nodeType===1)scan(node);}))).observe(document.body,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
data.interactions=Object.assign({},data.interactions,{systemClassifier:true,residualLaboratory:true,polynomialRootExplorer:true});
})();
