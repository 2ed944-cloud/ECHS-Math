import {rateRows,evaluatePolynomial} from './state.mjs';
import {drawGraph,valueTable,format} from './graphics.mjs';

function mountRates({root,window:win,model}) {
  const doc=root.ownerDocument,p={...model.initial},listeners=[];
  const controls=doc.createElement('div');controls.className='ec-model-controls';
  const output=doc.createElement('div');output.className='ec-model-output';
  const status=doc.createElement('p');status.setAttribute('role','status');status.className='ec-model-summary';
  const update=()=>{
    const rows=rateRows(p),coefficients=[p.a,p.b,p.c],domain=[p.start,p.start+4*p.width];
    const values=Array.from({length:101},(_,i)=>evaluatePolynomial(coefficients,domain[0]+(domain[1]-domain[0])*i/100));
    const lo=Math.min(...values),hi=Math.max(...values),pad=Math.max(1,(hi-lo)*.12);
    status.textContent=`f(x) = ${format(p.a)}x² + ${format(p.b)}x + ${format(p.c)}. Interval width h = ${format(p.width)}. Change in consecutive average rates: ${format(2*p.a*p.width)}. Raw second difference: ${format(2*p.a*p.width*p.width)}. Rate change per input unit: ${format(2*p.a)}.`;
    output.replaceChildren(drawGraph(doc,{coefficients,domain,range:[lo-pad,hi+pad]},{label:'Quadratic graph with the first secant interval',secants:[rows[0]]}),
      valueTable(doc,['Left x','Right x','f(left)','f(right)','Output change','Average rate'],rows.map(r=>[r.left,r.right,r.output,r.next,r.change,r.rate]),'Four adjacent equal-width intervals'));
    root.dataset.modelRevision=String(Number(root.dataset.modelRevision||0)+1);
  };
  for(const [key,label,min,max,step]of [['a','Quadratic coefficient a',-2,2,.5],['b','Linear coefficient b',-6,6,.5],['c','Constant c',-10,10,1],['start','First input',-3,3,.25],['width','Interval width h',.25,2,.25]]) {
    const wrap=doc.createElement('label'),text=doc.createElement('span'),input=doc.createElement('input');input.type='range';input.min=min;input.max=max;input.step=step;input.value=p[key];input.setAttribute('aria-label',label);
    const change=()=>{p[key]=Number(input.value);text.textContent=label+': '+format(p[key]);update();};text.textContent=label+': '+format(p[key]);input.addEventListener('input',change);listeners.push(()=>input.removeEventListener('input',change));wrap.append(text,input);controls.append(wrap);
  }
  root.append(controls,status,output);update();
  return {dispose(){listeners.forEach(fn=>fn());root.replaceChildren();}};
}

// Port the same existing simulation node, retaining its listeners and prediction UI.
function mountNative({root,window:win,model}) {
  const doc=root.ownerDocument,node=doc.querySelector(model.selector);
  if(!node?.querySelector('input,select'))throw new Error('Original simulation is unavailable');
  const marker=doc.createComment('ECHS original simulation position'),shell=doc.createElement('div');
  shell.className='slide active ec-native-slide';shell.hidden=false;
  node.before(marker);shell.append(node);root.append(shell);
  win.dispatchEvent(new win.Event('resize'));
  let disposed=false;
  return {dispose(){if(disposed)return;disposed=true;if(marker.isConnected)marker.replaceWith(node);const play=node.querySelector('#context-car-play');if(play?.textContent==='Pause')play.click();shell.remove();}};
}

export async function mountModel(options) {
  const {model}=options;
  if(model.kind==='native')return mountNative(options);
  if(model.kind==='rates')return mountRates(options);
  const families={
    polynomial:()=>Promise.all([import('../../investigations/polynomial-view.mjs'),import('../../investigations/ap-polynomial-content.mjs')]).then(([view,data])=>[view.mountPolynomial,data.AP_POLYNOMIAL_CONTENT]),
    rational:()=>Promise.all([import('../../investigations/rational-view.mjs'),import('../../investigations/ap-rational-content.mjs')]).then(([view,data])=>[view.mountRational,data.AP_RATIONAL_CONTENT]),
    equivalence:()=>Promise.all([import('../../investigations/equivalence-view.mjs'),import('../../investigations/ap-equivalence-content.mjs')]).then(([view,data])=>[view.mountEquivalence,data.AP_EQUIVALENCE_CONTENT]),
    modeling:()=>Promise.all([import('../../investigations/modeling-view.mjs'),import('../../investigations/ap-modeling-content.mjs')]).then(([view,data])=>[view.mountModeling,data.AP_MODELING_CONTENT])
  };
  if(!families[model.kind])throw new Error('Unknown model');
  const [mount,content]=await families[model.kind]();
  // The caller checks ownership again after imports and before rendering.
  if(options.stillCurrent?.()!==true)return null;
  const item=content[model.key],scene=item?.scenes.find(s=>model.scene?s.id===model.scene:s.model===model.kind);
  if(!scene)throw new Error('Missing model scene');
  return mount({...options,scene});
}
