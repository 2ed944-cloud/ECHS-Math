(function(){
'use strict';

const data=window.LESSON_DATA;
if(!data||String(data.lesson?.number)!=='1.6')return;

const STORAGE_KEY='echs:ib-ai:u1:1.6:gdc-lab:v6.1';
const HISTORY_LIMIT=18;
const EPS=1e-9;
const $=(selector,root=document)=>root.querySelector(selector);
const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const finite=value=>Number.isFinite(Number(value));
const cleanNumber=(value,digits=8)=>{
  const number=Number(value);
  if(!Number.isFinite(number))return 'undefined';
  if(Math.abs(number)<1e-12)return '0';
  const rounded=Number(number.toFixed(digits));
  return Math.abs(rounded)>=1e7||Math.abs(rounded)<1e-6?rounded.toExponential(6):rounded.toString();
};
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

const defaults={
  mode:'systems',
  systemSize:2,
  systemValues:[2,3,13,4,-1,5,1,1,1,1,-1,2,2,1,-1,3,1,2],
  polynomialDegree:3,
  polynomialValues:[1,-2,-5,6],
  intersection:{f:'4*x+9',g:'55*(0.86^x)',min:0,max:12},
  matrixSize:3,
  matrixValues:[1,2,0,0,1,3,2,0,1],
  evidence:{problem:'',entry:'',settings:'',output:'',check:'',interpretation:''},
  history:[]
};

function loadState(){
  try{
    const parsed=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
    return Object.assign({},defaults,parsed,{intersection:Object.assign({},defaults.intersection,parsed.intersection||{}),evidence:Object.assign({},defaults.evidence,parsed.evidence||{}),history:Array.isArray(parsed.history)?parsed.history.slice(0,HISTORY_LIMIT):[]});
  }catch(_){return structuredClone(defaults);}
}
const state=loadState();
function saveState(){
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch(_){ }
}

let overlay=null;
let panel=null;
let lastFocus=null;
let activeInput=null;
let graphFrame=0;

function matrixToHTML(matrix,digits=6){
  if(!Array.isArray(matrix)||!matrix.length)return '';
  return `<div class="gdc-matrix-view">${matrix.map(row=>`<div>${row.map(value=>`<span>${esc(cleanNumber(value,digits))}</span>`).join('')}</div>`).join('')}</div>`;
}

function rref(input){
  const matrix=input.map(row=>row.map(Number));
  const rows=matrix.length;
  const cols=matrix[0]?.length||0;
  const pivots=[];
  let lead=0;
  for(let row=0;row<rows&&lead<cols;row++){
    let pivot=row;
    while(pivot<rows&&Math.abs(matrix[pivot][lead])<EPS)pivot++;
    if(pivot===rows){lead++;row--;continue;}
    [matrix[row],matrix[pivot]]=[matrix[pivot],matrix[row]];
    const divisor=matrix[row][lead];
    for(let col=0;col<cols;col++)matrix[row][col]/=divisor;
    for(let other=0;other<rows;other++){
      if(other===row)continue;
      const factor=matrix[other][lead];
      if(Math.abs(factor)<EPS)continue;
      for(let col=0;col<cols;col++)matrix[other][col]-=factor*matrix[row][col];
    }
    pivots.push(lead);
    lead++;
  }
  return{matrix:matrix.map(row=>row.map(value=>Math.abs(value)<EPS?0:value)),pivots};
}

function determinant(matrix){
  const n=matrix.length;
  if(!n||matrix.some(row=>row.length!==n))return NaN;
  const a=matrix.map(row=>row.map(Number));
  let det=1;
  for(let col=0;col<n;col++){
    let pivot=col;
    for(let row=col+1;row<n;row++)if(Math.abs(a[row][col])>Math.abs(a[pivot][col]))pivot=row;
    if(Math.abs(a[pivot][col])<EPS)return 0;
    if(pivot!==col){[a[pivot],a[col]]=[a[col],a[pivot]];det*=-1;}
    const value=a[col][col];det*=value;
    for(let row=col+1;row<n;row++){
      const factor=a[row][col]/value;
      for(let k=col;k<n;k++)a[row][k]-=factor*a[col][k];
    }
  }
  return det;
}

function inverse(matrix){
  const n=matrix.length;
  if(!n||matrix.some(row=>row.length!==n))return null;
  const augmented=matrix.map((row,index)=>[...row.map(Number),...Array.from({length:n},(_,col)=>index===col?1:0)]);
  const reduced=rref(augmented).matrix;
  for(let row=0;row<n;row++)for(let col=0;col<n;col++)if(Math.abs(reduced[row][col]-(row===col?1:0))>1e-7)return null;
  return reduced.map(row=>row.slice(n));
}

function solveSystem(matrix,n){
  const reduced=rref(matrix);
  const rows=reduced.matrix;
  const inconsistent=rows.some(row=>row.slice(0,n).every(value=>Math.abs(value)<1e-8)&&Math.abs(row[n])>=1e-8);
  const rank=rows.filter(row=>row.slice(0,n).some(value=>Math.abs(value)>=1e-8)).length;
  if(inconsistent)return{kind:'none',title:'No solution',summary:'The augmented matrix contains a contradictory row.',reduced:rows};
  if(rank<n)return{kind:'many',title:'Infinitely many solutions',summary:`Rank ${rank} is smaller than the ${n} unknowns.`,reduced:rows};
  const solution=Array(n).fill(0);
  rows.forEach(row=>{
    const pivot=row.slice(0,n).findIndex(value=>Math.abs(value)>=1e-8);
    if(pivot>=0)solution[pivot]=row[n];
  });
  return{kind:'unique',title:'Unique solution',summary:solution.map((value,index)=>`${String.fromCharCode(120+index)}=${cleanNumber(value,7)}`).join(', '),solution,reduced:rows};
}

function quadraticRoots(a,b,c){
  if(Math.abs(a)<EPS){if(Math.abs(b)<EPS)return[];return[-c/b];}
  const discriminant=b*b-4*a*c;
  if(discriminant<-EPS)return[];
  if(Math.abs(discriminant)<=EPS)return[-b/(2*a),-b/(2*a)];
  const root=Math.sqrt(discriminant);
  const q=-0.5*(b+Math.sign(b||1)*root);
  const r1=q/a;
  const r2=Math.abs(q)<EPS?(-b-root)/(2*a):c/q;
  return[r1,r2].sort((x,y)=>x-y);
}

function cubicRoots(a,b,c,d){
  if(Math.abs(a)<EPS)return quadraticRoots(b,c,d);
  const A=b/a,B=c/a,C=d/a;
  const p=B-A*A/3;
  const q=2*A*A*A/27-A*B/3+C;
  const delta=(q*q)/4+(p*p*p)/27;
  const shift=A/3;
  if(delta>EPS){
    const sqrt=Math.sqrt(delta);
    return[Math.cbrt(-q/2+sqrt)+Math.cbrt(-q/2-sqrt)-shift];
  }
  if(Math.abs(delta)<=EPS){
    const u=Math.cbrt(-q/2);
    return[2*u-shift,-u-shift,-u-shift].sort((x,y)=>x-y);
  }
  const radius=2*Math.sqrt(-p/3);
  const angle=Math.acos(clamp((3*q/(2*p))*Math.sqrt(-3/p),-1,1));
  return[0,1,2].map(k=>radius*Math.cos((angle+2*Math.PI*k)/3)-shift).sort((x,y)=>x-y);
}

function rootGroups(roots){
  const groups=[];
  roots.sort((a,b)=>a-b).forEach(root=>{
    const found=groups.find(group=>Math.abs(group.value-root)<1e-6);
    if(found){found.count++;found.value=(found.value*(found.count-1)+root)/found.count;}
    else groups.push({value:root,count:1});
  });
  return groups;
}

function compileExpression(expression){
  let source=String(expression||'').trim().toLowerCase().replaceAll('π','pi');
  if(!source)throw new Error('Enter a function first.');
  if(!/^[0-9a-z_+\-*/^().,\s]+$/.test(source))throw new Error('The expression contains an unsupported character.');
  const words=source.match(/[a-z_]+/g)||[];
  const allowed=new Set(['x','sin','cos','tan','asin','acos','atan','exp','ln','log','sqrt','abs','pi','e']);
  const invalid=words.find(word=>!allowed.has(word));
  if(invalid)throw new Error(`Unsupported function: ${invalid}`);
  source=source.replaceAll('^','**');
  const replacements={asin:'Math.asin',acos:'Math.acos',atan:'Math.atan',sin:'Math.sin',cos:'Math.cos',tan:'Math.tan',sqrt:'Math.sqrt',abs:'Math.abs',exp:'Math.exp',ln:'Math.log',log:'Math.log10',pi:'Math.PI',e:'Math.E'};
  for(const [word,replacement] of Object.entries(replacements))source=source.replace(new RegExp(`\\b${word}\\b`,'g'),replacement);
  const fn=new Function('x',`"use strict";return (${source});`);
  return x=>{const value=Number(fn(Number(x)));return Number.isFinite(value)?value:NaN;};
}

function bisection(fn,left,right){
  let a=left,b=right,fa=fn(a),fb=fn(b);
  if(!Number.isFinite(fa)||!Number.isFinite(fb))return NaN;
  if(Math.abs(fa)<1e-10)return a;
  if(Math.abs(fb)<1e-10)return b;
  for(let i=0;i<70;i++){
    const mid=(a+b)/2,fm=fn(mid);
    if(!Number.isFinite(fm))return NaN;
    if(Math.abs(fm)<1e-11||Math.abs(b-a)<1e-10)return mid;
    if(fa*fm<=0){b=mid;fb=fm;}else{a=mid;fa=fm;}
  }
  return(a+b)/2;
}

function findIntersections(f,g,min,max){
  const h=x=>f(x)-g(x);
  const roots=[];
  const steps=1200;
  let previousX=min,previous=h(min);
  for(let i=1;i<=steps;i++){
    const x=min+(max-min)*i/steps;
    const current=h(x);
    if(Number.isFinite(previous)&&Number.isFinite(current)){
      if(Math.abs(current)<1e-5)roots.push(x);
      if(previous*current<0){const root=bisection(h,previousX,x);if(Number.isFinite(root))roots.push(root);}
    }
    previousX=x;previous=current;
  }
  return roots.sort((a,b)=>a-b).filter((root,index,array)=>index===0||Math.abs(root-array[index-1])>1e-4);
}

function polynomialText(values,degree){
  const powers=degree===3?[3,2,1,0]:[2,1,0];
  return values.slice(0,degree+1).map((coefficient,index)=>{
    const c=Number(coefficient),power=powers[index];
    if(Math.abs(c)<EPS)return '';
    const sign=c<0?'−':'+';
    const magnitude=Math.abs(c);
    const coefficientText=(magnitude===1&&power>0)?'':cleanNumber(magnitude,6);
    const variable=power===0?'':power===1?'x':`x^${power}`;
    return`${sign} ${coefficientText}${variable}`.trim();
  }).filter(Boolean).join(' ').replace(/^\+\s*/,'')||'0';
}

function addHistory(mode,summary,details){
  state.history.unshift({mode,summary,details,time:new Date().toISOString()});
  state.history=state.history.slice(0,HISTORY_LIMIT);
  saveState();
  renderHistory();
}

function updateEvidence(values){
  Object.assign(state.evidence,values);
  saveState();
  renderEvidence();
}

function systemPanel(){
  const n=state.systemSize;
  const needed=n*(n+1);
  while(state.systemValues.length<needed)state.systemValues.push(0);
  return`<div class="gdc-panel-head"><div><span>SIMULTANEOUS EQUATIONS</span><h3>${n} equations · ${n} unknowns</h3></div><label>Size<select id="gdc-system-size"><option value="2" ${n===2?'selected':''}>2 × 2</option><option value="3" ${n===3?'selected':''}>3 × 3</option></select></label></div>
  <div class="gdc-coefficient-grid cols-${n+1}" id="gdc-system-grid">${Array.from({length:needed},(_,index)=>`<input type="number" step="any" value="${esc(state.systemValues[index]??0)}" data-system-index="${index}" aria-label="System value ${index+1}">`).join('')}</div>
  <div class="gdc-equation-labels"><span>Enter each row as coefficients followed by the constant.</span><b>Variable order: ${n===2?'x, y':'x, y, z'}</b></div>
  <div class="gdc-preset-row"><button type="button" data-system-preset="unique">Unique</button><button type="button" data-system-preset="none">No solution</button><button type="button" data-system-preset="many">Dependent</button>${n===3?'<button type="button" data-system-preset="fit">Parameter fit</button>':''}</div>
  <button class="gdc-enter" id="gdc-system-solve" type="button">SOLVE SYSTEM</button>
  <div class="gdc-output" id="gdc-system-output" aria-live="polite"><span>Ready</span><p>Enter the augmented coefficient matrix, then solve.</p></div>`;
}

function bindSystem(){
  $('#gdc-system-size',panel)?.addEventListener('change',event=>{
    state.systemSize=Number(event.target.value);state.systemValues=state.systemSize===2?[2,3,13,4,-1,5]:[1,1,1,9,2,-1,1,4,1,2,-1,3];saveState();renderMode();
  });
  $$('[data-system-index]',panel).forEach(input=>{
    input.addEventListener('focus',()=>activeInput=input);
    input.addEventListener('input',()=>{state.systemValues[Number(input.dataset.systemIndex)]=Number(input.value);saveState();});
  });
  $$('[data-system-preset]',panel).forEach(button=>button.addEventListener('click',()=>{
    const n=state.systemSize;
    const presets=n===2?{
      unique:[2,3,13,4,-1,5],none:[1,2,3,2,4,9],many:[1,2,3,2,4,6]
    }:{
      unique:[1,1,1,9,2,-1,1,4,1,2,-1,3],none:[1,1,1,3,2,2,2,6,1,1,1,5],many:[1,1,1,3,2,2,2,6,1,-1,0,1],fit:[4,2,1,18,1,-1,1,3,0,0,1,4]
    };
    state.systemValues=[...presets[button.dataset.systemPreset]];saveState();renderMode();
  }));
  $('#gdc-system-solve',panel)?.addEventListener('click',solveSystemMode);
}

function solveSystemMode(){
  const n=state.systemSize;
  const values=$$('[data-system-index]',panel).map(input=>Number(input.value));
  if(values.some(value=>!Number.isFinite(value))){showOutput('#gdc-system-output','Input error','Every coefficient and constant must be numerical.','error');return;}
  state.systemValues=[...values];saveState();
  const matrix=Array.from({length:n},(_,row)=>values.slice(row*(n+1),(row+1)*(n+1)));
  const result=solveSystem(matrix,n);
  const className=result.kind==='unique'?'success':result.kind==='none'?'error':'warning';
  const output=$('#gdc-system-output',panel);
  output.className=`gdc-output ${className}`;
  output.innerHTML=`<span>${esc(result.title)}</span><p>${esc(result.summary)}</p><div class="gdc-output-label">RREF</div>${matrixToHTML(result.reduced)}`;
  const entry=matrix.map(row=>`[${row.join(', ')}]`).join(' ');
  const check=result.kind==='unique'?`Substitute ${result.summary} into every original equation.`:'Compare ranks and inspect the reduced rows.';
  updateEvidence({problem:`Solve and classify a ${n}×${n} linear system.`,entry:`Augmented matrix ${entry}`,settings:`Simultaneous equations; variable order ${n===2?'x, y':'x, y, z'}.`,output:`${result.title}: ${result.summary}`,check,interpretation:result.kind==='unique'?'State whether every value is admissible in context.':'Explain what the classification means for the model.'});
  addHistory('Systems',result.title,result.summary);
}

function polynomialPanel(){
  const degree=state.polynomialDegree;
  const needed=degree+1;
  while(state.polynomialValues.length<needed)state.polynomialValues.push(0);
  const labels=degree===3?['a','b','c','d']:['a','b','c'];
  return`<div class="gdc-panel-head"><div><span>POLYNOMIAL ROOTS</span><h3>Degree ${degree} solver</h3></div><label>Degree<select id="gdc-poly-degree"><option value="2" ${degree===2?'selected':''}>2</option><option value="3" ${degree===3?'selected':''}>3</option></select></label></div>
  <div class="gdc-poly-entry">${labels.map((label,index)=>`<label><span>${label}</span><input type="number" step="any" value="${esc(state.polynomialValues[index]??0)}" data-poly-index="${index}"></label>`).join('')}</div>
  <div class="gdc-live-expression" id="gdc-poly-expression">${esc(polynomialText(state.polynomialValues,degree))} = 0</div>
  <div class="gdc-preset-row"><button type="button" data-poly-preset="distinct">Distinct roots</button><button type="button" data-poly-preset="double">Repeated root</button><button type="button" data-poly-preset="none">No real roots</button></div>
  <button class="gdc-enter" id="gdc-poly-solve" type="button">FIND REAL ROOTS</button>
  <canvas class="gdc-mini-graph" id="gdc-poly-canvas" width="680" height="250" aria-label="Polynomial graph"></canvas>
  <div class="gdc-output" id="gdc-poly-output" aria-live="polite"><span>Ready</span><p>Enter coefficients in descending powers.</p></div>`;
}

function bindPolynomial(){
  $('#gdc-poly-degree',panel)?.addEventListener('change',event=>{
    state.polynomialDegree=Number(event.target.value);state.polynomialValues=state.polynomialDegree===3?[1,-2,-5,6]:[1,-5,6];saveState();renderMode();
  });
  $$('[data-poly-index]',panel).forEach(input=>{
    input.addEventListener('focus',()=>activeInput=input);
    input.addEventListener('input',()=>{
      state.polynomialValues[Number(input.dataset.polyIndex)]=Number(input.value);saveState();
      $('#gdc-poly-expression',panel).textContent=`${polynomialText(state.polynomialValues,state.polynomialDegree)} = 0`;drawPolynomial();
    });
  });
  $$('[data-poly-preset]',panel).forEach(button=>button.addEventListener('click',()=>{
    const degree=state.polynomialDegree;
    const presets=degree===3?{distinct:[1,-2,-5,6],double:[1,-3,0,4],none:[1,0,1,1]}:{distinct:[1,-5,6],double:[1,-4,4],none:[1,0,4]};
    state.polynomialValues=[...presets[button.dataset.polyPreset]];saveState();renderMode();
  }));
  $('#gdc-poly-solve',panel)?.addEventListener('click',solvePolynomialMode);
  drawPolynomial();
}

function solvePolynomialMode(){
  const degree=state.polynomialDegree;
  const values=$$('[data-poly-index]',panel).map(input=>Number(input.value));
  if(values.some(value=>!Number.isFinite(value))||Math.abs(values[0])<EPS){showOutput('#gdc-poly-output','Input error','The leading coefficient must be non-zero.','error');return;}
  state.polynomialValues=[...values];saveState();
  const roots=degree===3?cubicRoots(...values):quadraticRoots(...values);
  const groups=rootGroups(roots);
  const polynomial=polynomialText(values,degree);
  const resultText=groups.length?groups.map(group=>`x=${cleanNumber(group.value,8)}${group.count>1?` (multiplicity ${group.count})`:''}`).join(' · '):'No real roots';
  const output=$('#gdc-poly-output',panel);output.className=`gdc-output ${groups.length?'success':'warning'}`;output.innerHTML=`<span>${groups.length?`${roots.length} real root${roots.length===1?'':'s'} counted with multiplicity`:'No real roots'}</span><p>${esc(resultText)}</p><small>Degree audit: a degree-${degree} polynomial has ${degree} complex roots counted with multiplicity.</small>`;
  updateEvidence({problem:`Find all relevant real roots of ${polynomial}=0.`,entry:`Polynomial coefficients: ${values.join(', ')}.`,settings:`Polynomial solver; degree ${degree}; real-root display.`,output:resultText,check:'Substitute every displayed root into the original polynomial and audit multiplicity.',interpretation:'Apply the contextual domain before selecting a reported root.'});
  addHistory('Polynomial',groups.length?'Roots found':'No real roots',resultText);
  drawPolynomial(groups.map(group=>group.value));
}

function drawAxes(ctx,width,height,xMin,xMax,yMin,yMax){
  ctx.clearRect(0,0,width,height);
  ctx.fillStyle='#081b2a';ctx.fillRect(0,0,width,height);
  const sx=x=>(x-xMin)/(xMax-xMin)*width;
  const sy=y=>height-(y-yMin)/(yMax-yMin)*height;
  ctx.strokeStyle='rgba(110,235,211,.12)';ctx.lineWidth=1;
  for(let i=0;i<=10;i++){const x=i/10*width;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,height);ctx.stroke();}
  for(let i=0;i<=6;i++){const y=i/6*height;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(width,y);ctx.stroke();}
  ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=1.5;
  if(xMin<=0&&xMax>=0){ctx.beginPath();ctx.moveTo(sx(0),0);ctx.lineTo(sx(0),height);ctx.stroke();}
  if(yMin<=0&&yMax>=0){ctx.beginPath();ctx.moveTo(0,sy(0));ctx.lineTo(width,sy(0));ctx.stroke();}
  return{sx,sy};
}

function drawPolynomial(markRoots=[]){
  cancelAnimationFrame(graphFrame);
  graphFrame=requestAnimationFrame(()=>{
    const canvas=$('#gdc-poly-canvas',panel);if(!canvas)return;
    const ctx=canvas.getContext('2d'),values=state.polynomialValues,degree=state.polynomialDegree;
    const fn=x=>degree===3?values[0]*x**3+values[1]*x**2+values[2]*x+values[3]:values[0]*x**2+values[1]*x+values[2];
    const xMin=-6,xMax=6,samples=Array.from({length:500},(_,i)=>{const x=xMin+(xMax-xMin)*i/499;return[x,fn(x)];});
    const maxY=Math.max(8,...samples.map(([,y])=>Math.min(100,Math.abs(y))));
    const{sx,sy}=drawAxes(ctx,canvas.width,canvas.height,xMin,xMax,-maxY,maxY);
    ctx.strokeStyle='#6eebd3';ctx.lineWidth=3;ctx.beginPath();samples.forEach(([x,y],i)=>{const X=sx(x),Y=sy(clamp(y,-maxY,maxY));if(i===0)ctx.moveTo(X,Y);else ctx.lineTo(X,Y);});ctx.stroke();
    ctx.fillStyle='#f7ca50';markRoots.filter(root=>root>=xMin&&root<=xMax).forEach(root=>{ctx.beginPath();ctx.arc(sx(root),sy(0),6,0,Math.PI*2);ctx.fill();});
  });
}

function intersectionPanel(){
  const item=state.intersection;
  return`<div class="gdc-panel-head"><div><span>GRAPH INTERSECTION</span><h3>Compare two functions</h3></div><span class="gdc-angle-mode">RAD</span></div>
  <div class="gdc-function-entry"><label><span>f(x)</span><input type="text" value="${esc(item.f)}" id="gdc-f-expression" spellcheck="false"></label><label><span>g(x)</span><input type="text" value="${esc(item.g)}" id="gdc-g-expression" spellcheck="false"></label></div>
  <div class="gdc-window-entry"><label>x-min<input type="number" step="any" value="${esc(item.min)}" id="gdc-xmin"></label><label>x-max<input type="number" step="any" value="${esc(item.max)}" id="gdc-xmax"></label></div>
  <div class="gdc-preset-row"><button type="button" data-intersection-preset="linear">Two lines</button><button type="button" data-intersection-preset="exponential">Linear–exponential</button><button type="button" data-intersection-preset="quadratic">Quadratic–line</button><button type="button" data-intersection-preset="trig">Trigonometric</button></div>
  <button class="gdc-enter" id="gdc-intersection-solve" type="button">GRAPH & INTERSECT</button>
  <canvas class="gdc-mini-graph" id="gdc-intersection-canvas" width="680" height="250" aria-label="Graph of two functions"></canvas>
  <div class="gdc-output" id="gdc-intersection-output" aria-live="polite"><span>Ready</span><p>Use x, ^, sin, cos, tan, exp, ln, log, sqrt and abs.</p></div>`;
}

function bindIntersection(){
  const fields={f:$('#gdc-f-expression',panel),g:$('#gdc-g-expression',panel),min:$('#gdc-xmin',panel),max:$('#gdc-xmax',panel)};
  Object.entries(fields).forEach(([key,input])=>{
    input.addEventListener('focus',()=>activeInput=input);
    input.addEventListener('input',()=>{state.intersection[key]=key==='f'||key==='g'?input.value:Number(input.value);saveState();});
  });
  $$('[data-intersection-preset]',panel).forEach(button=>button.addEventListener('click',()=>{
    const presets={
      linear:{f:'2*x+1',g:'-x+7',min:-4,max:8},
      exponential:{f:'4*x+9',g:'55*(0.86^x)',min:0,max:12},
      quadratic:{f:'x^2-4*x+1',g:'2*x-3',min:-4,max:8},
      trig:{f:'8*cos(x)',g:'x',min:0,max:16}
    };
    state.intersection={...presets[button.dataset.intersectionPreset]};saveState();renderMode();
  }));
  $('#gdc-intersection-solve',panel)?.addEventListener('click',solveIntersectionMode);
  drawIntersection();
}

function solveIntersectionMode(){
  try{
    const fText=$('#gdc-f-expression',panel).value,gText=$('#gdc-g-expression',panel).value,min=Number($('#gdc-xmin',panel).value),max=Number($('#gdc-xmax',panel).value);
    if(!Number.isFinite(min)||!Number.isFinite(max)||min>=max)throw new Error('Use a valid window with x-min < x-max.');
    const f=compileExpression(fText),g=compileExpression(gText);
    state.intersection={f:fText,g:gText,min,max};saveState();
    const roots=findIntersections(f,g,min,max);
    const points=roots.map(x=>({x,y:f(x)})).filter(point=>Number.isFinite(point.y));
    const resultText=points.length?points.map(point=>`(${cleanNumber(point.x,7)}, ${cleanNumber(point.y,7)})`).join(' · '):'No intersection detected in the selected window';
    const output=$('#gdc-intersection-output',panel);output.className=`gdc-output ${points.length?'success':'warning'}`;output.innerHTML=`<span>${points.length} intersection${points.length===1?'':'s'} in [${cleanNumber(min)}, ${cleanNumber(max)}]</span><p>${esc(resultText)}</p><small>Change the window or use another initial interval when completeness is uncertain.</small>`;
    updateEvidence({problem:`Solve ${fText} = ${gText}.`,entry:`Y₁=${fText}; Y₂=${gText}.`,settings:`Graph window x∈[${min},${max}], radians.`,output:resultText,check:'Substitute each x-coordinate into both functions and compare the y-values.',interpretation:'Retain only intersections permitted by the contextual domain.'});
    addHistory('Intersection',`${points.length} intersection${points.length===1?'':'s'}`,resultText);
    drawIntersection(points);
  }catch(error){showOutput('#gdc-intersection-output','Input error',error.message,'error');}
}

function drawIntersection(points=[]){
  cancelAnimationFrame(graphFrame);
  graphFrame=requestAnimationFrame(()=>{
    const canvas=$('#gdc-intersection-canvas',panel);if(!canvas)return;
    const ctx=canvas.getContext('2d'),item=state.intersection;
    let f,g;try{f=compileExpression(item.f);g=compileExpression(item.g);}catch(_){return;}
    const xMin=Number(item.min),xMax=Number(item.max);
    const samples=Array.from({length:500},(_,i)=>{const x=xMin+(xMax-xMin)*i/499;return[x,f(x),g(x)];});
    const ys=samples.flatMap(([,a,b])=>[a,b]).filter(Number.isFinite);
    if(!ys.length)return;
    let yMin=Math.min(...ys),yMax=Math.max(...ys);const span=Math.max(1,yMax-yMin);yMin-=span*.1;yMax+=span*.1;
    const{sx,sy}=drawAxes(ctx,canvas.width,canvas.height,xMin,xMax,yMin,yMax);
    const plot=(index,color)=>{ctx.strokeStyle=color;ctx.lineWidth=3;ctx.beginPath();let started=false;samples.forEach(sample=>{const x=sample[0],y=sample[index];if(!Number.isFinite(y)||y<yMin*4||y>yMax*4){started=false;return;}if(!started){ctx.moveTo(sx(x),sy(y));started=true;}else ctx.lineTo(sx(x),sy(y));});ctx.stroke();};
    plot(1,'#6eebd3');plot(2,'#f7ca50');
    ctx.fillStyle='#ff668e';points.forEach(point=>{ctx.beginPath();ctx.arc(sx(point.x),sy(point.y),6,0,Math.PI*2);ctx.fill();});
  });
}

function matrixPanel(){
  const n=state.matrixSize,needed=n*n;
  while(state.matrixValues.length<needed)state.matrixValues.push(0);
  return`<div class="gdc-panel-head"><div><span>MATRIX WORKSPACE</span><h3>${n} × ${n} matrix</h3></div><label>Size<select id="gdc-matrix-size"><option value="2" ${n===2?'selected':''}>2 × 2</option><option value="3" ${n===3?'selected':''}>3 × 3</option></select></label></div>
  <div class="gdc-coefficient-grid cols-${n}" id="gdc-matrix-grid">${Array.from({length:needed},(_,index)=>`<input type="number" step="any" value="${esc(state.matrixValues[index]??0)}" data-matrix-index="${index}">`).join('')}</div>
  <div class="gdc-preset-row"><button type="button" data-matrix-preset="identity">Identity</button><button type="button" data-matrix-preset="invertible">Invertible</button><button type="button" data-matrix-preset="singular">Singular</button></div>
  <div class="gdc-action-row"><button class="gdc-enter" type="button" data-matrix-action="det">DET</button><button class="gdc-enter" type="button" data-matrix-action="rref">RREF</button><button class="gdc-enter" type="button" data-matrix-action="inverse">INVERSE</button></div>
  <div class="gdc-output" id="gdc-matrix-output" aria-live="polite"><span>Ready</span><p>Select an operation.</p></div>`;
}

function bindMatrix(){
  $('#gdc-matrix-size',panel)?.addEventListener('change',event=>{state.matrixSize=Number(event.target.value);state.matrixValues=state.matrixSize===2?[1,2,3,4]:[1,2,0,0,1,3,2,0,1];saveState();renderMode();});
  $$('[data-matrix-index]',panel).forEach(input=>{input.addEventListener('focus',()=>activeInput=input);input.addEventListener('input',()=>{state.matrixValues[Number(input.dataset.matrixIndex)]=Number(input.value);saveState();});});
  $$('[data-matrix-preset]',panel).forEach(button=>button.addEventListener('click',()=>{
    const n=state.matrixSize,presets=n===2?{identity:[1,0,0,1],invertible:[2,1,5,3],singular:[1,2,2,4]}:{identity:[1,0,0,0,1,0,0,0,1],invertible:[1,2,0,0,1,3,2,0,1],singular:[1,2,3,2,4,6,0,1,1]};
    state.matrixValues=[...presets[button.dataset.matrixPreset]];saveState();renderMode();
  }));
  $$('[data-matrix-action]',panel).forEach(button=>button.addEventListener('click',()=>solveMatrixMode(button.dataset.matrixAction)));
}

function solveMatrixMode(action){
  const n=state.matrixSize,values=$$('[data-matrix-index]',panel).map(input=>Number(input.value));
  if(values.some(value=>!Number.isFinite(value))){showOutput('#gdc-matrix-output','Input error','Every entry must be numerical.','error');return;}
  state.matrixValues=[...values];saveState();
  const matrix=Array.from({length:n},(_,row)=>values.slice(row*n,(row+1)*n));
  const output=$('#gdc-matrix-output',panel);
  let title,summary,body,check;
  if(action==='det'){
    const det=determinant(matrix);title='Determinant';summary=`det(A)=${cleanNumber(det,8)}`;body='';check=det===0?'A zero determinant confirms that A is singular.':'A non-zero determinant confirms that A is invertible.';
  }else if(action==='rref'){
    const reduced=rref(matrix).matrix;title='Reduced row-echelon form';summary='RREF(A)';body=matrixToHTML(reduced);check='Use the pivot columns to interpret rank and independence.';
  }else{
    const inv=inverse(matrix);title=inv?'Inverse found':'Matrix is singular';summary=inv?'A⁻¹':'No inverse exists';body=inv?matrixToHTML(inv):'';check=inv?'Multiply A by A⁻¹ and confirm the identity matrix.':'Confirm det(A)=0 or dependent rows.';
  }
  output.className=`gdc-output ${action==='inverse'&&!body?'warning':'success'}`;output.innerHTML=`<span>${esc(title)}</span><p>${esc(summary)}</p>${body}<small>${esc(check)}</small>`;
  updateEvidence({problem:`Apply ${action.toUpperCase()} to a ${n}×${n} matrix.`,entry:`A=${matrix.map(row=>`[${row.join(', ')}]`).join('')}`,settings:`Matrix mode; dimension ${n}×${n}.`,output:summary,check,interpretation:'Connect the matrix result to the system, transformation or model being studied.'});
  addHistory('Matrix',title,summary);
}

function showOutput(selector,title,message,kind='warning'){
  const output=$(selector,panel);if(!output)return;output.className=`gdc-output ${kind}`;output.innerHTML=`<span>${esc(title)}</span><p>${esc(message)}</p>`;
}

function modeMarkup(){
  if(state.mode==='systems')return systemPanel();
  if(state.mode==='polynomial')return polynomialPanel();
  if(state.mode==='intersection')return intersectionPanel();
  return matrixPanel();
}

function renderMode(){
  if(!panel)return;
  panel.innerHTML=modeMarkup();
  $$('.gdc-mode-button',overlay).forEach(button=>button.classList.toggle('active',button.dataset.gdcMode===state.mode));
  if(state.mode==='systems')bindSystem();
  else if(state.mode==='polynomial')bindPolynomial();
  else if(state.mode==='intersection')bindIntersection();
  else bindMatrix();
}

function renderEvidence(){
  const root=$('.gdc-evidence-fields',overlay);if(!root)return;
  root.innerHTML=Object.entries({problem:'Problem / objective',entry:'Calculator entry',settings:'Settings / window',output:'Complete output',check:'Independent check',interpretation:'Contextual interpretation'}).map(([key,label])=>`<label><span>${label}</span><textarea data-evidence-field="${key}">${esc(state.evidence[key]||'')}</textarea></label>`).join('');
  $$('[data-evidence-field]',root).forEach(field=>field.addEventListener('input',()=>{state.evidence[field.dataset.evidenceField]=field.value;saveState();}));
}

function renderHistory(){
  const root=$('.gdc-history-list',overlay);if(!root)return;
  root.innerHTML=state.history.length?state.history.map((item,index)=>`<button type="button" data-history-index="${index}"><span>${esc(item.mode)}</span><b>${esc(item.summary)}</b><small>${esc(item.details)}</small></button>`).join(''):'<div class="gdc-empty-history">Solved results will appear here.</div>';
  $$('[data-history-index]',root).forEach(button=>button.addEventListener('click',()=>{
    const item=state.history[Number(button.dataset.historyIndex)];if(!item)return;
    $('.gdc-screen-message',overlay).textContent=`${item.mode}: ${item.summary} — ${item.details}`;
  }));
}

function evidenceText(){
  return[`Problem: ${state.evidence.problem}`,`GDC entry: ${state.evidence.entry}`,`Settings: ${state.evidence.settings}`,`Output: ${state.evidence.output}`,`Independent check: ${state.evidence.check}`,`Interpretation: ${state.evidence.interpretation}`].join('\n');
}

function buildOverlay(){
  if($('#echs-gdc-overlay'))return;
  const launcher=document.createElement('button');
  launcher.type='button';launcher.id='echs-gdc-launch';launcher.className='echs-gdc-launch';launcher.innerHTML='<span>▣</span><b>GDC Lab</b><small>Open calculator</small>';launcher.addEventListener('click',()=>openGDC());
  const headerActions=$('.header-actions');if(headerActions)headerActions.insertBefore(launcher,headerActions.firstChild);else document.body.append(launcher);

  overlay=document.createElement('div');overlay.id='echs-gdc-overlay';overlay.className='echs-gdc-overlay';overlay.setAttribute('aria-hidden','true');
  overlay.innerHTML=`<div class="echs-gdc-backdrop" data-gdc-close></div><section class="echs-gdc-dialog" role="dialog" aria-modal="true" aria-labelledby="echs-gdc-title">
    <header class="gdc-dialog-head"><div><span>ECHS MATHEMATICS</span><h2 id="echs-gdc-title">GDC Laboratory</h2><p>Model → enter → solve → verify → interpret</p></div><button type="button" class="gdc-close" data-gdc-close aria-label="Close GDC Laboratory">×</button></header>
    <div class="gdc-workspace">
      <section class="gdc-device" aria-label="Interactive graphing display calculator">
        <div class="gdc-device-brand"><b>ECHS GDC</b><span>AI SL · TECHNOLOGY MODE</span></div>
        <div class="gdc-status"><span>RUN</span><span class="gdc-screen-message">Ready for transparent technology evidence</span><span>RAD · AUTO</span></div>
        <nav class="gdc-mode-nav" aria-label="GDC modes">
          <button type="button" class="gdc-mode-button" data-gdc-mode="systems">SYSTEM</button>
          <button type="button" class="gdc-mode-button" data-gdc-mode="polynomial">POLY</button>
          <button type="button" class="gdc-mode-button" data-gdc-mode="intersection">GRAPH</button>
          <button type="button" class="gdc-mode-button" data-gdc-mode="matrix">MATRIX</button>
        </nav>
        <div class="gdc-screen-panel"></div>
        <div class="gdc-keypad" aria-label="GDC keypad">
          ${['7','8','9','DEL','AC','4','5','6','×','÷','1','2','3','+','−','0','.','(−)','x','ENTER'].map(key=>`<button type="button" data-gdc-key="${esc(key)}" class="${key==='ENTER'?'enter':key==='DEL'||key==='AC'?'utility':''}">${esc(key)}</button>`).join('')}
        </div>
      </section>
      <aside class="gdc-evidence-panel">
        <div class="gdc-evidence-head"><span>IB TECHNOLOGY EVIDENCE</span><h3>What must appear in the solution?</h3></div>
        <div class="gdc-evidence-fields"></div>
        <div class="gdc-evidence-actions"><button type="button" id="gdc-copy-evidence">Copy evidence</button><button type="button" id="gdc-clear-evidence">Clear</button></div>
        <div class="gdc-history-head"><span>SESSION HISTORY</span><button type="button" id="gdc-clear-history">Clear</button></div>
        <div class="gdc-history-list"></div>
      </aside>
    </div>
  </section>`;
  document.body.append(overlay);
  panel=$('.gdc-screen-panel',overlay);
  $$('[data-gdc-close]',overlay).forEach(node=>node.addEventListener('click',closeGDC));
  $$('.gdc-mode-button',overlay).forEach(button=>button.addEventListener('click',()=>{state.mode=button.dataset.gdcMode;saveState();renderMode();}));
  overlay.addEventListener('focusin',event=>{if(event.target.matches('input,textarea'))activeInput=event.target;});
  $$('.gdc-keypad [data-gdc-key]',overlay).forEach(button=>button.addEventListener('click',()=>handleKey(button.dataset.gdcKey)));
  $('#gdc-copy-evidence',overlay).addEventListener('click',async event=>{
    const text=evidenceText();
    try{await navigator.clipboard.writeText(text);event.currentTarget.textContent='Copied';}catch(_){event.currentTarget.textContent='Select and copy';}
    setTimeout(()=>event.currentTarget.textContent='Copy evidence',1400);
  });
  $('#gdc-clear-evidence',overlay).addEventListener('click',()=>{state.evidence=structuredClone(defaults.evidence);saveState();renderEvidence();});
  $('#gdc-clear-history',overlay).addEventListener('click',()=>{state.history=[];saveState();renderHistory();});
  renderMode();renderEvidence();renderHistory();
}

function handleKey(key){
  if(key==='ENTER'){if(state.mode==='systems')solveSystemMode();else if(state.mode==='polynomial')solvePolynomialMode();else if(state.mode==='intersection')solveIntersectionMode();else solveMatrixMode('rref');return;}
  if(!activeInput||!overlay.contains(activeInput))return;
  if(key==='AC'){activeInput.value='';activeInput.dispatchEvent(new Event('input',{bubbles:true}));return;}
  if(key==='DEL'){
    const start=activeInput.selectionStart??String(activeInput.value).length,end=activeInput.selectionEnd??start;
    const value=String(activeInput.value);activeInput.value=start===end?value.slice(0,Math.max(0,start-1))+value.slice(end):value.slice(0,start)+value.slice(end);activeInput.dispatchEvent(new Event('input',{bubbles:true}));return;
  }
  const mapped={'×':'*','÷':'/','−':'-','(−)':'-'}[key]||key;
  if(activeInput.type==='number'&&!/^[0-9.\-]$/.test(mapped))return;
  const start=activeInput.selectionStart??String(activeInput.value).length,end=activeInput.selectionEnd??start,value=String(activeInput.value);
  activeInput.value=value.slice(0,start)+mapped+value.slice(end);activeInput.dispatchEvent(new Event('input',{bubbles:true}));
  try{activeInput.setSelectionRange(start+mapped.length,start+mapped.length);}catch(_){ }
}

function openGDC(mode=state.mode,focusEvidence=false){
  buildOverlay();
  if(['systems','polynomial','intersection','matrix'].includes(mode))state.mode=mode;
  saveState();renderMode();renderEvidence();renderHistory();
  lastFocus=document.activeElement;
  overlay.classList.add('open');overlay.setAttribute('aria-hidden','false');document.body.classList.add('gdc-open');
  $('.gdc-close',overlay)?.focus();
  if(focusEvidence)setTimeout(()=>$('.gdc-evidence-panel',overlay)?.scrollIntoView({block:'start'}),80);
}
function closeGDC(){
  if(!overlay)return;overlay.classList.remove('open');overlay.setAttribute('aria-hidden','true');document.body.classList.remove('gdc-open');
  if(lastFocus&&typeof lastFocus.focus==='function')lastFocus.focus();
}

const contextMap=[
  {pattern:/system classifier|coefficient order|three-variable|simultaneous/i,mode:'systems',label:'Open the simultaneous-equation solver'},
  {pattern:/polynomial-root explorer|root, zero|multiplicity|polynomial equation/i,mode:'polynomial',label:'Open the polynomial-root solver'},
  {pattern:/intersection|graph window|initial guess|competing model/i,mode:'intersection',label:'Open the graph-intersection workspace'},
  {pattern:/residual laboratory|verification evidence|guard digits|rounding order/i,mode:'evidence',label:'Open the IB technology-evidence panel'}
];
function addContextLaunch(root=document){
  const stage=$('.stage-inner',root)||root.closest?.('.stage-inner')||null;if(!stage)return;
  const title=$('.slide-title',stage)?.textContent||data.slides?.[Number(($('#progress-label')?.textContent||'1').split('/')[0])-1]?.title||'';
  const match=contextMap.find(item=>item.pattern.test(title));if(!match)return;
  const body=$('.slide-body',stage);if(!body||$('.gdc-context-launch',body))return;
  const strip=document.createElement('div');strip.className='gdc-context-launch';strip.innerHTML=`<div><span>ECHS GDC LAB</span><b>${esc(match.label)}</b><small>Use the tool, then record output, verification and interpretation.</small></div><button type="button">Launch GDC</button>`;
  strip.querySelector('button').addEventListener('click',()=>openGDC(match.mode==='evidence'?state.mode:match.mode,match.mode==='evidence'));
  body.prepend(strip);
}

function init(){
  buildOverlay();addContextLaunch();
  new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(node=>{if(node.nodeType===1)addContextLaunch(node);}))).observe(document.body,{childList:true,subtree:true});
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&overlay?.classList.contains('open')){event.preventDefault();closeGDC();}
    if(event.altKey&&event.key.toLowerCase()==='g'){event.preventDefault();openGDC();}
  });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();

data.gdcLab={
  release:'6.1.0',
  name:'ECHS GDC Laboratory',
  offline:true,
  externalApi:false,
  modes:['simultaneous systems','polynomial roots','graph intersections','matrix operations'],
  evidenceFields:['problem','entry','settings','output','independent check','interpretation'],
  shortcut:'Alt+G'
};
data.interactions=Object.assign({},data.interactions,{gdcLaboratory:true,gdcSystems:true,gdcPolynomial:true,gdcIntersection:true,gdcMatrix:true,gdcEvidenceRecorder:true});
})();
