import {AP_RATES_CONTENT} from './ap-rates-content.mjs';
import {AP_POLYNOMIAL_CONTENT} from './ap-polynomial-content.mjs';
import {mountPolynomial} from './polynomial-view.mjs';
import {IB_CONTENT} from './ib-content.mjs';
import {sampleRates} from './ap-rates-model.mjs';
import {arithmetic,geometric} from './ib-models.mjs';
import {mountFinance} from './finance-view.mjs';
import {mountCar} from './car-view.mjs';
import {VESSELS,vesselState} from './vase-model.mjs';
import {graph,table,format,vesselDrawing} from './visuals.mjs';

const VASE_SCENE=Object.freeze({id:'vessel',title:'Fill a vessel in three dimensions',kind:'discover',model:'vase',text:[
  'Water enters each idealized vessel at a constant volume rate. Predict how the height changes before testing the model. Equal amounts of water need not produce equal rises in height.',
  'Compare a cylinder with vessels that widen or narrow upward. The table uses equal time intervals. Use the height rates as evidence; a curved height graph is not automatically quadratic.'
],prompts:['Which vessel has constant average height rates over equal time intervals?','For a widening vessel, explain the changing height rates using the cross-sectional area.','Does half the capacity always mean half the height? Use two model measurements to justify your answer.']});
const courses={ 'ap-rates':AP_RATES_CONTENT, ...AP_POLYNOMIAL_CONTENT, ...IB_CONTENT };
let nextId=0;
export function mountInvestigation({dialog,key,window:win,onClose}) {
  const doc=dialog.ownerDocument,data=courses[key];
  if(!data)throw new TypeError('Unknown teaching investigation.');
  const uid=`ei-${++nextId}`,removers=[];let disposed=false,index=0,cleanupScene=()=>{};
  const el=(tag,text,cls)=>{const n=doc.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
  const on=(node,type,fn)=>{node.addEventListener(type,fn);removers.push(()=>node.removeEventListener(type,fn));};
  const button=(text,fn,cls)=>{const n=el('button',text,cls);n.type='button';on(n,'click',fn);return n;};
  const scenes=[...data.scenes];if(key==='ap-rates')scenes.splice(Math.min(3,scenes.length),0,VASE_SCENE);
  const shell=el('div',undefined,'ei-shell'),header=el('header',undefined,'ei-header'),headingWrap=el('div');
  const eyebrow=el('span',key==='ap-rates'?'AP Precalculus · Topic 1.3':AP_POLYNOMIAL_CONTENT[key]?`AP Precalculus · Topic ${data.topic}`:'IB Mathematics AI SL · First assessment 2021','ei-eyebrow');
  const title=el('h1',data.title);title.id=`${uid}-title`;dialog.setAttribute('aria-labelledby',title.id);
  headingWrap.append(eyebrow,title);header.append(headingWrap,button('Return to lesson',onClose));
  const body=el('div',undefined,'ei-body'),nav=el('nav',undefined,'ei-nav'),main=el('main',undefined,'ei-main');nav.setAttribute('aria-label','Investigation activities');main.tabIndex=-1;
  const footer=el('footer',undefined,'ei-footer'),status=el('p');status.setAttribute('role','status');
  const actions=el('div',undefined,'ei-footer-actions');
  const prev=button('Previous',()=>show(index-1)),next=button('Next activity',()=>show(index+1),'ei-primary');actions.append(prev,next);footer.append(status,actions);
  const navButtons=scenes.map((s,i)=>{const n=button('',()=>show(i));n.append(el('span',String(i+1).padStart(2,'0'),'ei-step-number'),el('span',s.title));nav.append(n);return n;});
  body.append(nav,main);shell.append(header,body,footer);dialog.replaceChildren(shell);
  // The legacy decks own document/window shortcuts. A modal does not stop their bubbling.
  on(dialog,'keydown',event=>event.stopPropagation());on(dialog,'click',event=>event.stopPropagation());
  function card(titleText){const n=el('section',undefined,'ei-card');if(titleText)n.append(el('h3',titleText,'ei-section-title'));return n;}
  function explain(root,scene){
    const c=card('Explain and connect');const list=el('ol',undefined,'ei-prompts');
    for(const p of scene.prompts??[])list.append(el('li',typeof p==='string'?p:p.text??p.prompt));
    c.append(list);const label=el('label','Record your reasoning','ei-field-label'),input=el('textarea');
    input.id=`${uid}-reasoning`;label.htmlFor=input.id;input.maxLength=3000;input.placeholder='Use a calculation, a representation, and a sentence that interprets the result.';
    const wrap=el('div',undefined,'ei-explain');wrap.append(label,input,el('p','Discuss your explanation with a partner or teacher. Your writing is not automatically graded.','ei-note'));c.append(wrap);
    if(scene.worked?.length){const details=el('details'),summary=el('summary','Worked comparison · open after trying');details.append(summary);for(const p of scene.worked)details.append(el('p',p));c.append(details);}
    root.append(c);
  }
  function numericControl(root,{key:k,label,min,max,step=1},params,update,removes){
    const wrap=el('div',undefined,'ei-control'),l=el('label',label),input=el('input'),out=el('output');
    input.type='range';input.min=min;input.max=max;input.step=step;input.value=params[k];input.id=`${uid}-${k}`;l.htmlFor=input.id;out.value=format(params[k]);out.textContent=out.value;out.setAttribute('for',input.id);
    const fn=()=>{const value=Number(input.value);if(!Number.isFinite(value))return;params[k]=value;out.value=format(value);out.textContent=out.value;update();};input.addEventListener('input',fn);removes.push(()=>input.removeEventListener('input',fn));
    wrap.append(l,input,out);root.append(wrap);return input;
  }
  function selectControl(root,labelText,k,options,params,update,removes){
    const wrap=el('div',undefined,'ei-control'),label=el('label',labelText),input=el('select');input.id=`${uid}-${k}`;label.htmlFor=input.id;
    for(const [value,text] of options){const opt=el('option',text);opt.value=value;input.append(opt);}input.value=params[k];
    const fn=()=>{params[k]=input.value;update();};input.addEventListener('change',fn);removes.push(()=>input.removeEventListener('change',fn));wrap.append(label,input);root.append(wrap);return input;
  }
  function prediction(root,getTask,removes){
    const wrap=el('div',undefined,'ei-prediction'),label=el('label',undefined,'ei-field-label'),input=el('input'),feedback=el('p',undefined,'ei-feedback');input.type='text';input.inputMode='decimal';input.id=`${uid}-prediction`;input.autocomplete='off';input.maxLength=60;label.htmlFor=input.id;feedback.setAttribute('role','status');
    const check=el('button','Test my prediction','ei-primary');check.type='button';
    const clear=()=>{feedback.textContent='';delete feedback.dataset.result;};
    const test=()=>{
      const task=getTask(),raw=input.value.trim();
      if(!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(raw)||!Number.isFinite(Number(raw))){feedback.textContent='Enter one finite number. Use a decimal point, with no units or commas.';feedback.dataset.result='retry';return;}
      const tolerance=task.tolerance??Math.max(.0005,Math.abs(task.answer)*.000005),correct=Math.abs(Number(raw)-task.answer)<=tolerance;
      feedback.dataset.result=correct?'correct':'retry';feedback.textContent=correct?`Your prediction agrees with the model. ${task.explanation}`:`Recheck your prediction. ${task.hint} The model gives ${format(task.answer,task.money?2:4)}${task.unit?` ${task.unit}`:''}.`;
    };
    check.addEventListener('click',test);input.addEventListener('input',clear);removes.push(()=>check.removeEventListener('click',test),()=>input.removeEventListener('input',clear));wrap.append(label,input,check,feedback);root.append(wrap);
    return {update(){label.textContent=getTask().label;clear();},clear(){input.value='';clear();}};
  }
  function mountModel(root,scene){
    if(scene.model==='polynomial'){const target=card('Explore the declared polynomial');root.append(target);const view=mountPolynomial({root:target,window:win,scene});explain(root,scene);return()=>view.dispose();}
    if(scene.model==='finance'){const target=el('div');root.append(target);const view=mountFinance({root:target,window:win,scene});explain(root,scene);return()=>view.dispose();}
    const cleanup=[],grid=el('div',undefined,'ei-grid'),left=el('div'),right=card('Change the model'),controls=el('div',undefined,'ei-controls');
    const visual=card('Linked representations'),output=el('div');visual.append(output);left.append(visual);right.append(controls);grid.append(left,right);root.append(grid);
    const model=scene.model,params={...(scene.initial??{})};let task,carView,carRoot,draw=()=>{};
    const pred=prediction(right,()=>task,cleanup);
    const reset=el('button','Reset model and prediction');reset.type='button';
    const make=(c)=>numericControl(controls,c,params,()=>draw(),cleanup);
    const inputs=[];
    if(model==='vase') {
      Object.assign(params,{shape:'widening',fraction:.5,flow:10,azimuth:35,elevation:20});
      inputs.push(selectControl(controls,'Vessel shape','shape',Object.entries(VESSELS).map(([k,v])=>[k,v.label]),params,()=>draw(),cleanup));
      for(const c of [{key:'fraction',label:'Fraction of capacity',min:0,max:1,step:.05},{key:'flow',label:'Inflow / cm³ per second',min:1,max:20},{key:'azimuth',label:'Rotate view / degrees',min:-180,max:180,step:5},{key:'elevation',label:'View elevation / degrees',min:-20,max:45,step:5}])inputs.push(make(c));
      draw=()=>{
        const s=vesselState(params);output.replaceChildren(vesselDrawing(doc,s,{azimuth:params.azimuth,elevation:params.elevation}));
        output.append(el('p',`At ${format(s.time)} s: height = ${format(s.height)} cm; volume = ${format(s.volume)} cm³; horizontal area = ${format(s.area)} cm².`,'ei-formula'));
        output.append(graph(doc,{title:'Water height over time, with equal-time samples',xLabel:'time / s',yLabel:'height / cm',series:[{label:'Water height',points:s.rows.map(r=>({x:r.time,y:r.height}))}]}));
        output.append(table(doc,['Time / s','Volume / cm³','Height / cm','Interval rate / cm s⁻¹'],s.rows.map((r,i)=>[r.time,r.volume,r.height,i===0?'—':s.rates[i-1]]),'Equal-time samples; displayed values rounded'));
        task={label:'Predict the water height when the vessel is half full by volume / cm',answer:vesselState({...params,fraction:.5}).height,tolerance:.02,unit:'cm',hint:'Compare the space available below and above the midpoint.',explanation:params.shape==='cylinder'?'The cross-sectional area is constant, so half the volume occupies half the height.':'Half the volume is not half the height: the cross-sectional area varies with height.'};pred.update();
      };
    } else if(model==='arithmetic'||model==='geometric') {
      const fn=model==='arithmetic'?arithmetic:geometric;Object.assign(params,{first:model==='arithmetic'?12:6,index:6,count:6,...(model==='arithmetic'?{difference:4}:{ratio:1.5}),...scene.initial});
      for(const c of scene.controls??[{key:'first',label:'First term u₁',min:-20,max:30},{key:model==='arithmetic'?'difference':'ratio',label:model==='arithmetic'?'Common difference d':'Common ratio r',min:-3,max:3,step:.25},{key:'index',label:'Term index n',min:1,max:12},{key:'count',label:'Number of terms in the sum',min:1,max:12}])inputs.push(make(c));
      draw=()=>{
        const s=fn(params);output.replaceChildren(graph(doc,{title:'Sequence terms at integer indices',xLabel:'integer index n',yLabel:'term uₙ',series:[{label:'Individual terms',points:s.rows.map(r=>({x:r.index,y:r.term})),connect:false}]}));
        const formula=model==='arithmetic'?`uₙ = ${format(s.first)} + (n − 1)(${format(s.difference)})`:`uₙ = ${format(s.first)} × (${format(s.ratio)})ⁿ⁻¹`;
        output.append(el('p',`${formula}. At n = ${s.index}, uₙ = ${format(s.term)}. The sum of the first ${s.count} terms is ${format(s.sum)}.`,'ei-formula'));
        output.append(table(doc,['n','Term uₙ','Running sum Sₙ'],s.rows.map(r=>[r.index,r.term,r.sum]),'Keep a single term distinct from a sum'));
        output.append(el('p',model==='geometric'&&s.ratio===1?'When r = 1, every term equals u₁ and Sₙ = nu₁.':model==='geometric'&&s.ratio===0?'When r = 0, the sequence is u₁, 0, 0, … . A quotient with a zero denominator cannot identify the ratio.':'Only integer indices are part of this sequence. A line connecting the dots would not add new sequence terms.','ei-note'));
        const target=fn({...params,index:params.index+1});task={label:`Predict term u${params.index+1} using the recurrence`,answer:target.term,hint:model==='arithmetic'?'Add d once to the current term.':'Multiply the current term by r once.',explanation:model==='arithmetic'?`One step adds ${format(s.difference)}; a term and a running total answer different questions.`:`One step multiplies by ${format(s.ratio)}; apply that factor to the term, not to the running sum.`};pred.update();
      };
    } else if(model) {
      Object.assign(params,{a:1,b:2,c:0,start:0,step:1,count:6,...scene.initial});
      for(const c of scene.controls??[{key:'a',label:'Quadratic coefficient a',min:-2,max:2,step:.25},{key:'b',label:'Linear coefficient b',min:-6,max:6},{key:'c',label:'Starting shift c',min:-10,max:10},{key:'start',label:'First input x',min:0,max:4},{key:'step',label:'Equal input step h',min:.25,max:2,step:.25}])inputs.push(make(c));
      draw=()=>{
        const s=sampleRates(params),rows=s.rows??s.samples,points=rows.map(r=>({x:r.x,y:r.y}));
        const curve=Array.from({length:101},(_,i)=>{const x=points[0].x+(points.at(-1).x-points[0].x)*i/100;return{x,y:params.a*x*x+params.b*x+params.c};});
        output.replaceChildren(graph(doc,{title:'Function graph and equal-input samples',xLabel:'input x',yLabel:'output f(x)',series:[{label:'Function',points:curve,dots:false},{label:'Samples',points,connect:false}]}));
        output.append(el('p',`f(x) = ${format(params.a)}x² + (${format(params.b)})x + (${format(params.c)}). Equal input step h = ${format(params.step)}.`,'ei-formula'));
        const rates=rows.slice(1).map((r,i)=>(r.y-rows[i].y)/params.step),diffs=rows.slice(1).map((r,i)=>r.y-rows[i].y);
        output.append(table(doc,['x','f(x)','Output change','Interval rate'],rows.map((r,i)=>[r.x,r.y,i===0?'—':diffs[i-1],i===0?'—':rates[i-1]]),'First compare output changes, then divide by the input step'));
        output.append(el('p',`Raw second difference = 2ah² = ${format(2*params.a*params.step**2)}. Change between consecutive interval rates = 2ah = ${format(2*params.a*params.step)}. Change in rate per input unit = 2a = ${format(2*params.a)}.`,'ei-formula'));
        if(scene.motionModel){if(!carView){carRoot=el('div');visual.prepend(carRoot);carView=mountCar({root:carRoot,window:win,model:params});cleanup.push(()=>carView.dispose());}else carView.update(params);}
        task={label:'Predict the change between consecutive average rates (use output units per input unit)',answer:2*params.a*params.step,hint:'First divide each output change by h, then subtract consecutive rates.',explanation:`Consecutive rates differ by 2ah = ${format(2*params.a*params.step)}. Dividing that change by h gives ${format(2*params.a)} output units per input unit squared.`};pred.update();
      };
    }
    const initial={...params};const resetFn=()=>{Object.assign(params,initial);for(const input of inputs){const k=input.id.slice(uid.length+1);input.value=params[k];const out=input.parentElement.querySelector('output');if(out)out.textContent=format(params[k]);}pred.clear();draw();};reset.addEventListener('click',resetFn);cleanup.push(()=>reset.removeEventListener('click',resetFn));right.append(reset);
    try{draw();}catch{output.replaceChildren(el('p','These inputs do not define a valid model. Reset to the initial values.','ei-feedback'));}
    explain(left,scene);return()=>cleanup.forEach(fn=>fn());
  }
  function show(n,focus=true){
    if(disposed||n<0||n>=scenes.length)return;cleanupScene();index=n;const scene=scenes[index];main.replaceChildren();
    const h=el('h2',scene.title);h.tabIndex=-1;main.append(el('span',scene.kind??'Investigate','ei-eyebrow'),h);
    const intro=el('div',undefined,'ei-intro');for(const p of scene.text??[])intro.append(el('p',p));main.append(intro);
    if(scene.model&&scene.kind!=='transfer')cleanupScene=mountModel(main,scene);else{explain(main,scene);cleanupScene=()=>{};}
    navButtons.forEach((b,i)=>{if(i===index)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});prev.disabled=index===0;next.disabled=index===scenes.length-1;status.textContent=`Activity ${index+1} of ${scenes.length} · Explore, predict, explain`;main.scrollTop=0;if(focus)h.focus();
  }
  show(0,true);
  return Object.freeze({dispose(){if(disposed)return;disposed=true;cleanupScene();removers.splice(0).forEach(fn=>fn());dialog.replaceChildren();dialog.removeAttribute('aria-labelledby');},get activityIndex(){return index;}});
}
