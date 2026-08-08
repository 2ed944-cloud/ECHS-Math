(function(){
  'use strict';
  if(String(window.LESSON_DATA?.lesson?.number)!=='2.5')return;
  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const storageKey='echs:ib-ai:u2:2.5:tci5-lab';
  const defaults={a:-2,b:2,h:1,k:4,u:1};
  const presets={
    translation:{a:1,b:1,h:2,k:-3,u:2},
    reflection:{a:-2,b:2,h:1,k:4,u:1},
    stretch:{a:0.5,b:-0.5,h:-1,k:1,u:-2},
    identity:{a:1,b:1,h:0,k:0,u:2}
  };
  const fmt=value=>Math.abs(value)<1e-10?'0':Number.isInteger(value)?String(value):String(Number(value.toFixed(3)));
  const pretty=value=>fmt(value).replace(/^-/, '−');
  const signed=value=>value<0?`− ${fmt(Math.abs(value))}`:`+ ${fmt(value)}`;
  const affine=(constant,coefficient,symbol)=>{
    const term=Math.abs(coefficient)===1?symbol:`${fmt(Math.abs(coefficient))}${symbol}`;
    if(Math.abs(constant)<1e-10)return coefficient<0?`−${term}`:term;
    return `${pretty(constant)} ${coefficient<0?'−':'+'} ${term}`;
  };
  const inputDifference=(x,h)=>h>0?`${pretty(x)}−${fmt(h)}`:h<0?`${pretty(x)}+${fmt(Math.abs(h))}`:pretty(x);
  const f=x=>0.5*x*x-2;
  function readSaved(){try{return {...defaults,...JSON.parse(localStorage.getItem(storageKey)||'{}')};}catch{return {...defaults};}}
  function save(state){try{localStorage.setItem(storageKey,JSON.stringify(state));}catch{}}

  function equation(state){
    const hPart=state.h===0?'X':`(X ${state.h>0?'−':'+'} ${fmt(Math.abs(state.h))})`;
    const inner=state.b===1?hPart:state.b===-1?`−${hPart}`:`${fmt(state.b)}${hPart}`;
    const outside=state.a===1?'':state.a===-1?'−':pretty(state.a);
    const kPart=state.k===0?'':` ${signed(state.k)}`;
    return `g(X)=${outside}[0.5(${inner})²−2]${kPart}`;
  }

  function buildLab(lab){
    if(lab.dataset.tci5Ready)return;
    const state=readSaved();
    lab.innerHTML=`
      <div class="tci5-lab-toolbar">
        <div><span>PRESETS</span><div class="tci5-preset-row"><button type="button" data-preset="translation">Translate</button><button type="button" data-preset="reflection">Reflect + scale</button><button type="button" data-preset="stretch">Negative horizontal stretch</button><button type="button" data-preset="identity">Reset</button></div></div>
        <div class="tci5-lab-rule"><b>Base function</b><span>f(x)=0.5x²−2</span></div>
      </div>
      <div class="tci5-lab-layout">
        <section class="tci5-lab-controls" aria-label="Transformation controls">
          ${control('a','Outside factor a',-3,3,0.5,state.a,'Multiplies y-values; negative reflects in the x-axis.')}
          ${control('b','Inside factor b',-3,3,0.5,state.b,'Divides x-coordinates; negative reflects in the y-axis.')}
          ${control('h','Horizontal shift h',-4,4,0.5,state.h,'Adds h to transformed x-coordinates.')}
          ${control('k','Vertical shift k',-4,4,0.5,state.k,'Adds k to transformed y-coordinates.')}
          ${control('u','Selected base input u',-3,3,0.5,state.u,'Tracks one exact point from the base graph.')}
          <div class="tci5-lab-predict"><label for="tci5-prediction"><b>Prediction before reveal</b></label><textarea id="tci5-prediction" placeholder="Predict the image vertex, orientation and selected point."></textarea></div>
        </section>
        <section class="tci5-lab-display">
          <div class="tci5-lab-equation" data-lab-equation></div>
          <div class="tci5-lab-graph" data-lab-graph aria-live="polite"></div>
        </section>
      </div>
      <div class="tci5-lab-results" data-lab-results aria-live="polite"></div>`;
    lab.dataset.tci5Ready='1';
    $$('[data-lab-control]',lab).forEach(input=>input.addEventListener('input',()=>updateLab(lab)));
    $$('[data-preset]',lab).forEach(button=>button.addEventListener('click',()=>{
      const next=presets[button.dataset.preset]||defaults;
      Object.entries(next).forEach(([key,value])=>{const input=$(`[data-lab-control="${key}"]`,lab);if(input)input.value=value;});
      updateLab(lab);
    }));
    updateLab(lab);
  }
  function control(key,label,min,max,step,value,help){
    return `<label class="tci5-range"><span><b>${label}</b><output data-lab-output="${key}">${fmt(value)}</output></span><input type="range" min="${min}" max="${max}" step="${step}" value="${value}" data-lab-control="${key}"><small>${help}</small></label>`;
  }
  function currentState(lab){
    const state={};$$('[data-lab-control]',lab).forEach(input=>state[input.dataset.labControl]=Number(input.value));
    if(Math.abs(state.a)<1e-12)state.a=state.a<0?-0.5:0.5;
    if(Math.abs(state.b)<1e-12)state.b=state.b<0?-0.5:0.5;
    return state;
  }
  function updateLab(lab){
    const state=currentState(lab);
    ['a','b'].forEach(key=>{const input=$(`[data-lab-control="${key}"]`,lab);if(Number(input.value)===0)input.value=state[key];});
    Object.entries(state).forEach(([key,value])=>{const output=$(`[data-lab-output="${key}"]`,lab);if(output)output.textContent=fmt(value);});
    save(state);
    const baseY=f(state.u),imageX=state.h+state.u/state.b,imageY=state.k+state.a*baseY;
    const vertexX=state.h,vertexY=state.k-2*state.a;
    const range=state.a>0?`y ≥ ${fmt(vertexY)}`:`y ≤ ${fmt(vertexY)}`;
    const horizontal=`${state.b<0?'reflect in y-axis; ':''}${Math.abs(state.b)>1?`horizontal compression factor ${fmt(1/Math.abs(state.b))}`:Math.abs(state.b)<1?`horizontal stretch factor ${fmt(1/Math.abs(state.b))}`:'no horizontal scale'}`;
    const vertical=`${state.a<0?'reflect in x-axis; ':''}${Math.abs(state.a)>1?`vertical stretch factor ${fmt(Math.abs(state.a))}`:Math.abs(state.a)<1?`vertical compression factor ${fmt(Math.abs(state.a))}`:'no vertical scale'}`;
    const horizontalShift=state.h===0?'no horizontal translation':`translate ${fmt(Math.abs(state.h))} ${state.h>0?'right':'left'}`;
    const verticalShift=state.k===0?'no vertical translation':`translate ${fmt(Math.abs(state.k))} ${state.k>0?'up':'down'}`;
    $('[data-lab-equation]',lab).innerHTML=`<span>TRANSFORMED RULE</span><b>${equation(state)}</b><small>Coordinate map: (u,v) ↦ (${affine(state.h,1/state.b,'u')}, ${affine(state.k,state.a,'v')})</small>`;
    const graphics=window.ECHS_TCI5_GRAPHICS;
    if(graphics){
      const g=x=>state.a*f(state.b*(x-state.h))+state.k;
      $('[data-lab-graph]',lab).innerHTML=graphics.plotSVG({
        title:'Live transformation laboratory',xMin:-8,xMax:8,yMin:-12,yMax:12,xStep:2,yStep:3,
        curves:[{fn:f,color:'#7a1733',label:'base f'},{fn:g,color:'#177e89',label:'image g'}],
        points:[{x:state.u,y:baseY,label:`P(${fmt(state.u)},${fmt(baseY)})`,color:'#7a1733'},{x:imageX,y:imageY,label:`P′(${fmt(imageX)},${fmt(imageY)})`,color:'#177e89'},{x:vertexX,y:vertexY,label:'image vertex',color:'#d4a72c'}]
      });
    }
    $('[data-lab-results]',lab).innerHTML=`<article><span>SELECTED POINT</span><h3>(${pretty(state.u)}, ${pretty(baseY)}) → (${pretty(imageX)}, ${pretty(imageY)})</h3><p>Check: b(x−h)=${pretty(state.b)}(${inputDifference(imageX,state.h)})=${pretty(state.u)}.</p></article><article><span>VERTEX AND SETS</span><h3>Vertex (${pretty(vertexX)}, ${pretty(vertexY)})</h3><p>Domain: all real x. Range: ${range}.</p></article><article><span>DESCRIPTION</span><h3>${horizontal}</h3><p>${vertical}; ${horizontalShift}; ${verticalShift}.</p></article>`;
  }

  function installChrome(){
    const start=$('#start-lesson');
    start?.addEventListener('click',()=>{
      const learn=$('.route-btn[data-route="learn"]');
      if(!learn?.classList.contains('active'))learn?.click();
      else if($('#progress-label')?.textContent?.trim().startsWith('1 /'))$('#next-slide')?.click();
      $('#app')?.focus?.({preventScroll:true});
    });
    const fullscreen=$('#toggle-fullscreen');
    fullscreen?.addEventListener('click',async()=>{
      try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen();}catch{}
    });
    document.addEventListener('fullscreenchange',()=>{
      if(fullscreen){fullscreen.classList.toggle('active',Boolean(document.fullscreenElement));fullscreen.setAttribute('aria-pressed',String(Boolean(document.fullscreenElement)));}
    });
    const menu=$('#toggle-route-menu'),route=$('#lesson-route-menu');
    menu?.addEventListener('click',()=>{
      const open=document.body.classList.toggle('tci5-route-open');menu.setAttribute('aria-expanded',String(open));route?.classList.toggle('tci5-open',open);
    });
    route?.addEventListener('click',event=>{if(event.target.closest('button')){document.body.classList.remove('tci5-route-open');route.classList.remove('tci5-open');menu?.setAttribute('aria-expanded','false');}});
  }
  function scan(){const lab=$('#tci5-transform-lab');if(lab)buildLab(lab);}
  function init(){installChrome();scan();const app=$('#app');if(app)new MutationObserver(scan).observe(app,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.ECHS_TCI5_INTERACTIONS={buildLab,release:'5.0.0'};
})();
