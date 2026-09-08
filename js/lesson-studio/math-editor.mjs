import {MathExpressionError,MATH_SYMBOLS,MATH_FUNCTIONS,MATH_OPERATORS,compileMathSource,suggestMathSpeech,validateMathContent} from '../lesson-runtime/math-expression.mjs';

const copy=value=>JSON.parse(JSON.stringify(value));
const symbol=(name='x')=>({kind:'symbol',name});
const number=(value='1')=>({kind:'number',value});
const kindLabels={number:'Number',symbol:'Symbol',group:'Parentheses',negate:'Negative',binary:'Operation',fraction:'Fraction',power:'Power',root:'Root',function:'Function',sum:'Sum',integral:'Integral',limit:'Limit'};
const operatorLabels={add:'Add',subtract:'Subtract',multiply:'Multiply',equals:'Equals',less:'Less than',lessEqual:'Less than or equal',greater:'Greater than',greaterEqual:'Greater than or equal'};
const functionLabels={sin:'Sine',cos:'Cosine',tan:'Tangent',arcsin:'Inverse sine',arccos:'Inverse cosine',arctan:'Inverse tangent',ln:'Natural logarithm',log:'Logarithm',exp:'Exponential',abs:'Absolute value',f:'f',g:'g',h:'h'};
let instanceSequence=0;
function template(kind){
  switch(kind){
    case 'number':return number();case 'symbol':return symbol();case 'group':case 'negate':return {kind,body:symbol()};
    case 'binary':return {kind,operator:'add',left:symbol(),right:number()};
    case 'fraction':return {kind,numerator:number(),denominator:symbol()};
    case 'power':return {kind,base:symbol(),exponent:number('2')};
    case 'root':return {kind,radicand:symbol(),index:null};
    case 'function':return {kind,name:'sin',argument:symbol()};
    case 'sum':return {kind,variable:'k',lower:number(),upper:symbol('n'),body:symbol('k')};
    case 'integral':return {kind,variable:'x',lower:null,upper:null,body:symbol()};
    case 'limit':return {kind,variable:'x',target:number('0'),side:'both',body:symbol()};
  }
  throw new Error('Unsupported visual expression.');
}

/** All uncommitted expression fields live only in this disposable editor. */
export function createMathEditor({root,value,mathEngine,onChange=()=>{},onInvalid=()=>{},allowDisplayMode=true}={}){
  if(!root?.ownerDocument||typeof onChange!=='function'||typeof onInvalid!=='function')throw new TypeError('A math editor root and callbacks are required.');
  if(!mathEngine||mathEngine.version!=='0.16.27'||typeof mathEngine.render!=='function'||typeof mathEngine.renderToString!=='function')throw new TypeError('The local KaTeX 0.16.27 engine is required.');
  if(typeof allowDisplayMode!=='boolean')throw new TypeError('Display mode permission must be a boolean.');
  let buffer,disposed=false,autoSpeech=false,customSpeechChanged=false,lastEmitted=null,lastReportedValid=true,removers=[];
  let sourceControls,preview,errorRegion,spokenInput,speechReview,modeSelect,displayInput;
  const dom=root.ownerDocument,prefix=`math-editor-${++instanceSequence}`;
  function assertActive(){if(disposed)throw new Error('This math editor is closed.');}
  function checked(next){const result=validateMathContent(next,{mathEngine});if(result.valid&&!allowDisplayMode&&next.display!==false)result.errors.push({path:'/display',code:'inline-display',message:'Inline mathematics must keep display mode off.'});result.valid=result.errors.length===0;if(!result.valid)throw new MathExpressionError(result.errors);return result;}
  checked(value);buffer=copy(value);
  if(buffer.source.mode==='visual')try{autoSpeech=buffer.spoken===suggestMathSpeech(buffer.source.expression);}catch{}
  const element=(tag,text)=>{const node=dom.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
  function listen(node,type,handler){const wrapped=event=>{if(!disposed)handler(event);};node.addEventListener(type,wrapped);removers.push(()=>node.removeEventListener(type,wrapped));}
  function clearListeners(){for(const remove of removers.splice(0))remove();}
  function labelFor(control,label,key){const wrap=element('label',label);control.id=`${prefix}-${key}`;control.dataset.mathField=key;wrap.htmlFor=control.id;wrap.append(control);return wrap;}
  function select(values,labels,current){const control=element('select');for(const item of values){const option=element('option',labels?.[item]||item);option.value=item;control.append(option);}control.value=current;return control;}
  function notifyInvalid(errors){const response={valid:false,errors:errors.map(item=>({...item}))};try{onInvalid(response);}catch{/* UI callbacks cannot modify validity. */}}
  function expressionChanged(){
    if(buffer.source.mode==='visual'&&autoSpeech){try{buffer.spoken=suggestMathSpeech(buffer.source.expression);spokenInput.value=buffer.spoken;}catch{/* Incomplete fields remain editable. */}}
    else customSpeechChanged=true;
    refresh(true);
  }
  function refresh(notify){
    if(disposed)return;
    const result=validateMathContent(buffer,{mathEngine});
    if(customSpeechChanged)result.errors.push({path:'/spoken',code:'speech-review',message:'Review the spoken description after changing the expression, then confirm it.'});
    result.valid=result.errors.length===0;
    speechReview.hidden=!customSpeechChanged;
    errorRegion.textContent=result.valid?'':result.errors[0].message;
    root.dataset.mathEditorValid=String(result.valid);
    preview.replaceChildren();
    if(result.valid){
      preview.setAttribute('role','math');preview.setAttribute('aria-label',buffer.spoken);
      try{mathEngine.render(compileMathSource(buffer.source),preview,{displayMode:buffer.display,throwOnError:true,strict:'error',trust:false,maxExpand:100,maxSize:10,output:'htmlAndMathml'});}
      catch{result.valid=false;result.errors.push({path:'/source',code:'invalid-math',message:'Correct the expression before saving.'});preview.replaceChildren();errorRegion.textContent=result.errors.at(-1).message;root.dataset.mathEditorValid='false';}
    }else{preview.removeAttribute('role');preview.removeAttribute('aria-label');preview.append(element('p','Complete the fields to preview and save this expression.'));}
    if(notify){
      if(!result.valid){lastReportedValid=false;notifyInvalid(result.errors);}
      else{const recovered=!lastReportedValid;lastReportedValid=true;const serialized=JSON.stringify(buffer);if(recovered||serialized!==lastEmitted){lastEmitted=serialized;try{onChange(copy(buffer));}catch{/* Changes remain available through getValue. */}}}
    }
  }
  function tree(node,parent,key,path,level){
    const group=element('fieldset');group.className='math-editor-expression';group.dataset.mathNode=path;
    const legend=element('legend',key==='expression'?'Expression':({body:'Expression',left:'Left expression',right:'Right expression',numerator:'Numerator',denominator:'Denominator',base:'Base',exponent:'Exponent',radicand:'Under the root',index:'Root index',argument:'Argument',lower:'Lower bound',upper:'Upper bound',target:'Approaches'})[key]||key);group.append(legend);
    const kinds=level>=5?['number','symbol']:Object.keys(kindLabels);
    const kind=select(kinds,kindLabels,node.kind);group.append(labelFor(kind,'Structure',path+'-kind'));
    listen(kind,'change',()=>{parent[key]=template(kind.value);render();root.querySelector(`[data-math-field="${path}-kind"]`)?.focus();expressionChanged();});
    function field(property,label,options,labels){
      const input=options?select(options,labels,node[property]):element('input');
      if(!options){input.type='text';input.value=node[property];input.maxLength=property==='variable'?1:32;input.spellcheck=false;if(property==='value')input.inputMode='decimal';}
      group.append(labelFor(input,label,path+'-'+property));
      listen(input,options?'change':'input',()=>{node[property]=input.value;expressionChanged();});
    }
    function child(property){group.append(tree(node[property],node,property,path+'-'+property,level+1));}
    switch(node.kind){
      case 'number':field('value','Number');break;
      case 'symbol':field('name','Symbol',MATH_SYMBOLS,{pi:'π (pi)',theta:'θ (theta)',alpha:'α (alpha)',beta:'β (beta)',gamma:'γ (gamma)',delta:'δ (delta)',epsilon:'ε (epsilon)',infinity:'∞ (infinity)'});break;
      case 'group':case 'negate':child('body');break;
      case 'binary':field('operator','Operation',MATH_OPERATORS,operatorLabels);child('left');child('right');break;
      case 'fraction':child('numerator');child('denominator');break;
      case 'power':child('base');child('exponent');break;
      case 'root':{
        const indexed=element('input');indexed.type='checkbox';indexed.checked=node.index!==null;group.append(labelFor(indexed,'Specify root index',path+'-indexed'));
        listen(indexed,'change',()=>{node.index=indexed.checked?number('3'):null;render();expressionChanged();});if(node.index!==null)child('index');child('radicand');break;
      }
      case 'function':field('name','Function',MATH_FUNCTIONS,functionLabels);child('argument');break;
      case 'sum':case 'integral':{
        field('variable','Variable');
        if(node.kind==='integral'){
          const bounded=element('input');bounded.type='checkbox';bounded.checked=node.lower!==null;group.append(labelFor(bounded,'Definite integral with bounds',path+'-bounded'));
          listen(bounded,'change',()=>{node.lower=bounded.checked?number('0'):null;node.upper=bounded.checked?number('1'):null;render();expressionChanged();});
        }
        if(node.lower!==null){child('lower');child('upper');}child('body');break;
      }
      case 'limit':field('variable','Variable');field('side','Direction',['both','left','right'],{both:'From both sides',left:'From the left',right:'From the right'});child('target');child('body');break;
    }
    return group;
  }
  function render(){
    clearListeners();root.replaceChildren();root.classList.add('math-editor');
    modeSelect=select(['visual','tex'],{visual:'Visual formula builder',tex:'Advanced LaTeX'},buffer.source.mode);
    root.append(labelFor(modeSelect,'Math input', 'mode'));
    listen(modeSelect,'change',()=>{
      const desired=modeSelect.value;modeSelect.value=buffer.source.mode;
      const prompt=element('div');prompt.className='math-editor-mode-confirm';prompt.setAttribute('role','group');prompt.setAttribute('aria-label','Confirm math input change');
      prompt.append(element('p',desired==='visual'?'Starting a visual formula replaces the current advanced source. Keep the current source to cancel.':'Advanced mode uses the current generated LaTeX. Returning to visual mode starts a new formula.'));
      const confirm=element('button',desired==='visual'?'Start visual formula':'Use advanced LaTeX'),cancel=element('button','Keep current source');confirm.type=cancel.type='button';
      listen(cancel,'click',()=>{prompt.remove();modeSelect.focus();});
      listen(confirm,'click',()=>{
        if(desired==='tex'){
          try{buffer.source={mode:'tex',tex:compileMathSource(buffer.source)};}catch{notifyInvalid([{path:'/source',code:'incomplete-source',message:'Complete the visual expression before switching to advanced input.'}]);prompt.remove();return;}
          autoSpeech=false;
        }else{buffer.source={mode:'visual',expression:symbol()};autoSpeech=true;buffer.spoken=suggestMathSpeech(buffer.source.expression);customSpeechChanged=false;}
        render();refresh(true);focus();
      });
      prompt.append(confirm,cancel);root.querySelector('.math-editor-mode-confirm')?.remove();root.append(prompt);cancel.focus();
    });
    sourceControls=element('div');sourceControls.className='math-editor-source';
    if(buffer.source.mode==='visual')sourceControls.append(tree(buffer.source.expression,buffer.source,'expression','expression',1));
    else{
      const advanced=element('textarea');advanced.value=buffer.source.tex;advanced.maxLength=4000;advanced.spellcheck=false;advanced.rows=4;
      sourceControls.append(labelFor(advanced,'LaTeX source','tex'));
      listen(advanced,'input',()=>{buffer.source.tex=advanced.value;expressionChanged();});
    }
    root.append(sourceControls);
    if(allowDisplayMode){
      displayInput=element('input');displayInput.type='checkbox';displayInput.checked=buffer.display;root.append(labelFor(displayInput,'Display as a separate equation','display'));
      listen(displayInput,'change',()=>{buffer.display=displayInput.checked;refresh(true);});
    }
    spokenInput=element('textarea');spokenInput.value=buffer.spoken;spokenInput.rows=3;spokenInput.maxLength=4000;root.append(labelFor(spokenInput,'Spoken description','spoken'));
    listen(spokenInput,'input',()=>{buffer.spoken=spokenInput.value;autoSpeech=false;customSpeechChanged=false;refresh(true);});
    if(buffer.source.mode==='visual'){
      const suggest=element('button','Use suggested spoken description');suggest.type='button';suggest.dataset.mathAction='suggest-speech';root.append(suggest);
      listen(suggest,'click',()=>{try{buffer.spoken=suggestMathSpeech(buffer.source.expression);autoSpeech=true;customSpeechChanged=false;spokenInput.value=buffer.spoken;refresh(true);}catch(error){notifyInvalid(error.errors||[{path:'/source',code:'incomplete-source',message:'Complete the visual expression first.'}]);}});
    }
    speechReview=element('button','I reviewed the spoken description');speechReview.type='button';speechReview.dataset.mathAction='confirm-speech';root.append(speechReview);
    listen(speechReview,'click',()=>{customSpeechChanged=false;refresh(true);});
    errorRegion=element('p');errorRegion.className='math-editor-error';errorRegion.setAttribute('role','status');errorRegion.setAttribute('aria-live','polite');root.append(errorRegion);
    preview=element('div');preview.className='math-editor-preview';root.append(preview);refresh(false);
  }
  function getValue(){assertActive();checked(buffer);if(customSpeechChanged)throw new MathExpressionError([{path:'/spoken',code:'speech-review',message:'Review the spoken description after changing the expression.'}]);return copy(buffer);}
  function setValue(next){assertActive();checked(next);buffer=copy(next);customSpeechChanged=false;autoSpeech=false;if(buffer.source.mode==='visual')try{autoSpeech=buffer.spoken===suggestMathSpeech(buffer.source.expression);}catch{}lastEmitted=JSON.stringify(buffer);lastReportedValid=true;render();}
  function focus(){assertActive();root.querySelector('[data-math-field="expression-kind"], [data-math-field="tex"]')?.focus();}
  function dispose(){if(disposed)return;disposed=true;clearListeners();buffer=null;lastEmitted=null;root.replaceChildren();root.classList.remove('math-editor');delete root.dataset.mathEditorValid;sourceControls=preview=errorRegion=spokenInput=speechReview=modeSelect=displayInput=null;onChange=onInvalid=()=>{};}
  lastEmitted=JSON.stringify(buffer);render();return Object.freeze({getValue,setValue,focus,dispose});
}
