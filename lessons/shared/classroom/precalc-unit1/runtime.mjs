import {resolveLesson,loadLesson} from './catalog.mjs';
import {freshState,revise,attempted,checkAnswer,classroomRequested,evaluatePolynomial} from './state.mjs';
import {drawGraph,valueTable} from './graphics.mjs';

const OWNERS=['kind','organization_id','account_id','role','status','expires_at','epoch','session_id'];
const sameOwner=(a,b)=>a&&b&&OWNERS.every(key=>a[key]===b[key]);
const stripHash=href=>{const url=new URL(href);url.hash='';return url.href;};
const siteRoot=new URL('../../../../',import.meta.url);

// Compatibility adapter: access remains owned by lesson-access-guard and the server.
export function startClassroom({window:win=globalThis.window,entryURL=win?.location.href,
  loadContent=loadLesson,loadModels=()=>import('./models.mjs')}={}) {
  const doc=win?.document,spec=doc&&resolveLesson(new URL(entryURL).pathname);
  if(!spec)return Object.freeze({dispose(){}});
  const route=stripHash(entryURL),removers=[],states=new Map();
  let disposed=false,starting=false,authority,portal,owner,access,unsubscribe,observer,deadline,ownerDeadline;
  let root,stage,slideNode,returnButton,lesson,select,previous,next,progress,live,active=false,index=0;
  let modelView,modelTicket=0,contentPromise,css,modelCss;
  const on=(target,type,fn,options)=>{target.addEventListener(type,fn,options);removers.push(()=>target.removeEventListener(type,fn,options));};
  const el=(tag,text,className)=>{const node=doc.createElement(tag);if(text!==undefined)node.textContent=text;if(className)node.className=className;return node;};
  const button=(text,fn,className)=>{const node=el('button',text,className);node.type='button';node.addEventListener('click',fn);return node;};
  function rich(node,text) {
    const parts=String(text).split(/(\\\([\s\S]*?\\\))/g);
    for(const part of parts) {
      if(part.startsWith('\\(')&&part.endsWith('\\)')) {
        const span=el('span');
        if(win.katex?.render) {
          try{win.katex.render(part.slice(2,-2),span,{throwOnError:true,trust:false,strict:'error'});}
          catch{span.textContent=part;span.dataset.mathError='true';}
        } else {span.textContent=part.slice(2,-2);span.className='ec-math-fallback';}
        node.append(span);
      } else node.append(doc.createTextNode(part));
    }
    return node;
  }
  const stopModel=()=>{modelTicket++;try{modelView?.dispose();}finally{modelView=null;}};
  const dispose=()=>{
    if(disposed)return;disposed=true;win.clearTimeout(deadline);win.clearTimeout(ownerDeadline);observer?.disconnect();
    try{unsubscribe?.();}catch{/* Continue local cleanup. */}
    stopModel();removers.splice(0).forEach(remove=>remove());states.clear();
    root?.remove();returnButton?.remove();css?.remove();modelCss?.remove();
    doc.documentElement.classList.remove('ec-classroom-active');
  };
  const allowed=()=>{
    try {
      if(disposed||!owner||win.ECHSInstitution?.ownerAuthority!==authority||win.ECHSPortalAccess!==portal||stripHash(win.location.href)!==route||doc.documentElement.dataset.lessonGate!=='allowed'||doc.documentElement.dataset.echsLessonCourse!=='ap-precalculus')return false;
      const current=authority.capture(),queryCourse=new URL(win.location.href).searchParams.get('course');
      if(!sameOwner(owner,current)||current.kind!=='account'||current.status!=='active'||!['teacher','admin','student'].includes(current.role)||!Number.isSafeInteger(current.expires_at)||current.expires_at<=Date.now()||!access?.authenticated||access.role!==current.role||access.current?.id!==current.account_id)return false;
      if(queryCourse&&(portal.normaliseCourseKey?.(queryCourse)||queryCourse)!=='ap-precalculus')return false;
      if(current.role==='student'&&portal.courseAllowed?.('ap-precalculus',access)!==true)return false;
      return sameOwner(owner,authority.capture());
    }catch{return false;}
  };
  const verify=()=>{if(allowed())return true;dispose();return false;};
  const state=()=>{const id=lesson.slides[index].id;if(!states.has(id))states.set(id,freshState());return states.get(id);};
  const announce=text=>{live.textContent=text;};
  const saveHash=()=>{const url=new URL(win.location.href);url.hash='classroom-'+lesson.slides[index].id;win.history.replaceState(win.history.state,'',url.href);};
  const focusTitle=()=>{slideNode.querySelector('h1')?.focus({preventScroll:true});stage.scrollTop=0;};

  async function explore(slide,s,host,trigger) {
    if(!verify()||!attempted(s,slide)){announce('Write a prediction or choose I tried on paper before exploring.');return;}
    if(s.exploring)return;
    s.exploring=true;trigger.disabled=true;const ticket=++modelTicket;
    host.hidden=false;host.textContent='Loading the interactive model…';
    try {
      const module=await loadModels();
      if(ticket!==modelTicket||!verify()||!active)return;
      if(!modelCss){modelCss=el('link');modelCss.rel='stylesheet';modelCss.href=new URL('../../investigations/investigations.css',import.meta.url).href;doc.head.append(modelCss);}
      host.replaceChildren();
      const stillCurrent=()=>ticket===modelTicket&&active&&verify();
      const view=await module.mountModel({root:host,window:win,model:slide.model,stillCurrent});
      if(!stillCurrent()){view?.dispose();return;}
      if(!view?.dispose)throw new Error('Model unavailable');
      modelView=view;trigger.textContent='Model open — change a parameter';announce('Model open. Test one change and compare with your prediction.');
    } catch {
      if(ticket===modelTicket&&verify()) {
        s.exploring=false;host.textContent='This model could not load. Use More practice & original lesson to open the existing simulation, or try again.';trigger.disabled=false;
      }
    }
  }

  function render({focus=true}={}) {
    if(!verify()||!active)return;
    stopModel();
    const slide=lesson.slides[index],s=state();s.exploring=false;
    slideNode=el('article',undefined,'ec-slide');slideNode.dataset.classroomSlide=slide.id;
    slideNode.append(el('p',`AP PRECALCULUS ${spec.topic} · ${slide.kind==='cover'?'Lesson goals':slide.kind==='notes'?'Notes & worked example':slide.kind==='simulation'?'Predict · explore · explain':slide.kind==='reflection'?'Reflection':'Student activity'}`,'ec-eyebrow'));
    const title=el('h1',slide.title);title.tabIndex=-1;slideNode.append(title);
    if(slide.kind==='cover') {
      slideNode.append(el('p','Learn the idea, try it yourself, then reveal the reasoning one step at a time. Test predictions with interactive models.','ec-cover-intro'));
      const goals=el('ul',undefined,'ec-goals');slide.goals.forEach(goal=>goals.append(el('li',goal)));slideNode.append(goals);
      slideNode.append(button('Start the lesson',()=>go(1),'ec-primary'));
      slideNode.append(el('p','Keyboard: ← / → move between slides; Space reveals the next step. Shortcuts pause while you type or use model controls.','ec-small'));
      slideNode.append(el('p','Your work in these slides stays in this open tab. Use the existing practice route for saved work and platform assessment.','ec-small'));
    } else {
      slideNode.append(rich(el('p',undefined,'ec-prompt'),slide.prompt));
      const grid=el('div',undefined,slide.graph||slide.table?'ec-grid':''),work=el('div');grid.append(work);
      if(slide.graph||slide.table) {
        const visual=el('div',undefined,'ec-visual');
        if(slide.graph) {
          visual.append(drawGraph(doc,slide.graph));
          const [lo,hi]=slide.graph.domain,points=Array.from({length:5},(_,i)=>{const x=lo+(hi-lo)*i/4;return[x,evaluatePolynomial(slide.graph.coefficients,x)];});
          visual.append(valueTable(doc,['x','f(x)'],points,'Sample values of the declared polynomial'));
        }
        if(slide.table)visual.append(valueTable(doc,slide.table.headers,slide.table.rows,slide.table.caption));
        grid.append(visual);
      }
      const feedback=el('p',undefined,'ec-feedback');feedback.setAttribute('role','status');
      const solution=el('section',undefined,'ec-solution');solution.id='ec-solution';solution.setAttribute('aria-label','Worked reasoning');
      const steps=el('ol');solution.append(el('h2',slide.kind==='notes'?'Key idea & worked example':'Compare your reasoning'),steps);
      const actions=el('div',undefined,'ec-actions');let paperButton;
      const reveal=button(slide.kind==='notes'?'Show the key idea':'Reveal next step',()=>{
        if(!verify())return;
        if(!attempted(s,slide)){feedback.textContent='Try the question first, or choose I tried on paper.';return;}
        s.revealed=Math.min(slide.steps.length,s.revealed+1);sync();
      },'ec-primary');reveal.id='ec-reveal';reveal.setAttribute('aria-controls',solution.id);
      const hide=button('Hide solution',()=>{s.revealed=0;sync();});
      const hint=el('p',undefined,'ec-hint');hint.hidden=true;
      if(slide.kind!=='notes') {
        const attempt=el('div',undefined,'ec-attempt');
        if(slide.answer?.kind==='choice') {
          const field=el('fieldset');field.append(el('legend','Choose an answer, then explain it'));
          slide.answer.options.forEach((option,i)=>{
            const label=el('label',undefined,'ec-choice'),radio=el('input');radio.type='radio';radio.name='ec-choice';radio.value=String(i);radio.checked=s.selected===i;
            radio.addEventListener('change',()=>{revise(s,{selected:i,paper:false});invalidate();});label.append(radio,rich(el('span'),option));field.append(label);
          });attempt.append(field);
        } else {
          const numeric=slide.answer?.kind==='number',label=el('label',numeric?'My answer'+(slide.answer.unit?' ('+slide.answer.unit+')':''):'My prediction, setup or explanation');label.htmlFor='ec-draft';
          const input=el(numeric?'input':'textarea');if(numeric){input.type='text';input.inputMode='decimal';}else input.rows=3;
          input.id='ec-draft';input.value=s.draft;input.autocomplete='off';input.maxLength=numeric?80:4000;input.addEventListener('input',()=>{revise(s,{draft:input.value,paper:false});invalidate();});attempt.append(label,input);
          if(numeric)attempt.append(el('p','Enter a number or a fraction such as −23/6, without the unit.','ec-small'));
        }
        const attemptActions=el('div',undefined,'ec-actions');
        if(['number','choice'].includes(slide.answer?.kind))attemptActions.append(button('Check my answer',()=>{
          if(!verify())return;
          if(!attempted(s,slide)||s.paper&&(slide.answer.kind==='choice'?s.selected===null:!s.draft.trim())){feedback.textContent='Enter or choose an answer to check it. You can still compare your paper attempt with the worked reasoning.';return;}
          s.checked=checkAnswer(slide,s);feedback.dataset.correct=String(s.checked===true);
          feedback.textContent=s.checked===null?'Enter a finite number or valid fraction.':s.checked?'That answer matches. Explain why, then compare the steps.':'Review the setup, signs and units. Try again or compare the worked steps.';
        }));
        const paper=button(s.paper?'Paper attempt recorded':'I tried on paper',()=>{if(!verify())return;s.paper=!s.paper;paper.textContent=s.paper?'Paper attempt recorded':'I tried on paper';paper.setAttribute('aria-pressed',String(s.paper));if(!s.paper){s.revealed=0;stopModel();if(modelHost){modelHost.hidden=true;modelHost.replaceChildren();}if(exploreButton){s.exploring=false;exploreButton.disabled=false;exploreButton.textContent='Explore the model';}}feedback.textContent=s.paper?'Now compare your work with the steps.':'';sync();});paper.setAttribute('aria-pressed',String(s.paper));paperButton=paper;attemptActions.append(paper);
        attempt.append(attemptActions,feedback);work.append(attempt);
      }
      let modelHost,exploreButton;
      if(slide.model) {
        modelHost=el('div',undefined,'ec-model');modelHost.hidden=true;modelHost.dataset.classroomModel=slide.id;
        exploreButton=button('Explore the model',()=>void explore(slide,s,modelHost,exploreButton));actions.append(exploreButton);
      }
      actions.append(reveal,hide);
      if(slide.hint)actions.append(button('Hint',()=>{s.hint=!s.hint;hint.hidden=!s.hint;hint.replaceChildren();rich(hint,slide.hint);}));
      actions.append(button('Reset this slide',()=>{states.set(slide.id,freshState());render();}));
      work.append(actions,hint);
      slideNode.append(grid);if(modelHost)slideNode.append(modelHost);slideNode.append(solution);
      slideNode.append(el('p',slide.calculator||'Explain on paper or discuss with a partner.','ec-small'));
      function sync(){steps.replaceChildren();slide.steps.slice(0,s.revealed).forEach(text=>steps.append(rich(el('li'),text)));solution.hidden=s.revealed===0;hide.disabled=!s.revealed;reveal.disabled=s.revealed===slide.steps.length;reveal.textContent=s.revealed===slide.steps.length?'All steps shown':slide.kind==='notes'&&s.revealed===0?'Show the key idea':`Reveal next step (${s.revealed+1}/${slide.steps.length})`;reveal.setAttribute('aria-expanded',String(s.revealed>0));hint.hidden=!s.hint;if(s.hint&&!hint.childNodes.length)rich(hint,slide.hint);}
      function invalidate(){stopModel();feedback.textContent='';feedback.removeAttribute('data-correct');if(paperButton){paperButton.textContent='I tried on paper';paperButton.setAttribute('aria-pressed','false');}if(modelHost){modelHost.hidden=true;modelHost.replaceChildren();}if(exploreButton){exploreButton.disabled=false;exploreButton.textContent='Explore the model';}sync();}
      sync();
    }
    stage.replaceChildren(slideNode);select.value=String(index);previous.disabled=index===0;next.disabled=index===lesson.slides.length-1;
    progress.style.width=((index+1)/lesson.slides.length*100)+'%';
    announce(`Slide ${index+1} of ${lesson.slides.length}: ${slide.title}`);
    root.dataset.slideIndex=String(index);saveHash();if(focus)focusTitle();
  }
  const go=value=>{if(!verify()||!active)return;index=Math.max(0,Math.min(lesson.slides.length-1,value));render();};
  const original=()=>{
    if(!verify())return;stopModel();active=false;root.hidden=true;returnButton.hidden=false;
    doc.documentElement.classList.remove('ec-classroom-active');
    const url=new URL(win.location.href);url.hash=new URL(entryURL).hash.startsWith('#classroom-')?'':new URL(entryURL).hash;
    win.history.replaceState(win.history.state,'',url.href);win.dispatchEvent(new win.Event('resize'));
    returnButton.focus();
  };
  const open=()=>{if(!verify())return;active=true;root.hidden=false;returnButton.hidden=true;doc.documentElement.classList.add('ec-classroom-active');render();};

  function install() {
    if(!verify())return;
    css=el('link');css.rel='stylesheet';css.href=new URL('./classroom.css',import.meta.url).href;doc.head.append(css);
    root=el('div');root.id='echsClassroom';root.hidden=true;root.lang='en';
    const header=el('header',undefined,'ec-header'),logo=el('img');logo.src=new URL('assets/echs_logo.png',siteRoot).href;logo.alt='ECHS';logo.className='ec-logo';
    const brand=el('div','ECHS · AP PRECALCULUS '+spec.topic,'ec-brand');brand.append(el('span','Interactive lesson slides'));
    const tools=el('div',undefined,'ec-tools'),unit=el('a','Unit 1','ec-unit');unit.href=new URL('lessons/ap-precalculus/unit-1/index.html',siteRoot).href;
    tools.append(unit,button('More practice & original lesson',original),button('Present',async()=>{if(!verify())return;try{if(doc.fullscreenElement)await doc.exitFullscreen();else await doc.documentElement.requestFullscreen();}catch{announce('Use your browser full-screen command to present.');}}));
    header.append(logo,brand,tools);stage=el('main',undefined,'ec-stage');stage.setAttribute('aria-label','Interactive lesson slide');stage.tabIndex=-1;
    const footer=el('footer',undefined,'ec-footer');previous=button('← Previous',()=>go(index-1));next=button('Next →',()=>go(index+1));
    const location=el('div',undefined,'ec-location');select=el('select');select.setAttribute('aria-label','Choose a lesson slide');
    lesson.slides.forEach((slide,i)=>{const option=el('option',`${i+1} / ${lesson.slides.length} · ${slide.title}`);option.value=String(i);select.append(option);});select.addEventListener('change',()=>go(Number(select.value)));
    const track=el('div',undefined,'ec-progress');progress=el('span');track.append(progress);location.append(select,track);footer.append(previous,location,next);
    live=el('div');live.className='sr-only';live.style.cssText='position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)';live.setAttribute('role','status');live.setAttribute('aria-live','polite');
    root.append(header,stage,footer,live);returnButton=button('Return to interactive slides',open);returnButton.id='echsClassroomReturn';returnButton.hidden=true;doc.body.append(root,returnButton);
    for(const type of ['click','input','change','keydown','pointerdown'])on(root,type,event=>{if(!verify()){event.preventDefault();event.stopImmediatePropagation();}},true);
    // Bubble fence protects the native deck hotkeys without stealing input/model keys.
    on(root,'keydown',event=>event.stopPropagation());
    on(doc,'keydown',event=>{
      if(!active||!verify()||event.defaultPrevented||event.isComposing||event.ctrlKey||event.altKey||event.metaKey||event.shiftKey)return;
      if(doc.querySelector('dialog[open]')||event.target.closest?.('input,textarea,select,button,a,[contenteditable],.ec-model'))return;
      let action;if(event.key==='ArrowRight')action=()=>go(index+1);if(event.key==='ArrowLeft')action=()=>go(index-1);if(event.key==='Home')action=()=>go(0);if(event.key==='End')action=()=>go(lesson.slides.length-1);if(event.code==='Space'||event.key===' ')action=()=>doc.querySelector('#ec-reveal')?.click();
      if(action){event.preventDefault();event.stopImmediatePropagation();action();}
    },true);
    const initialID=new URL(entryURL).hash.replace('#classroom-','');const requested=lesson.slides.findIndex(slide=>slide.id===initialID);if(requested>=0)index=requested;
    if(classroomRequested(entryURL))open();else returnButton.hidden=false;
    win.clearTimeout(deadline);ownerDeadline=win.setTimeout(dispose,Math.min(2147483647,owner.expires_at-Date.now()+1));
  }
  async function attempt() {
    if(disposed||starting||root||doc.documentElement.dataset.lessonGate!=='allowed')return;
    authority=win.ECHSInstitution?.ownerAuthority;portal=win.ECHSPortalAccess;
    if(!authority?.capture||!authority?.subscribe||!portal?.ready)return;
    starting=true;
    try {
      unsubscribe=authority.subscribe(dispose);if(disposed){unsubscribe?.();return;}owner=authority.capture();access=await portal.ready;
      if(!verify())return;contentPromise=loadContent(spec.topic);lesson=await contentPromise;
      if(!verify())return;
      if(!lesson||lesson.topic!==spec.topic||!Array.isArray(lesson.slides)||!lesson.slides.length)throw new Error('Unavailable content');
      install();
    }catch{dispose();}
  }
  observer=new win.MutationObserver(()=>{if(owner){if(!allowed())dispose();}else void attempt();});observer.observe(doc.documentElement,{attributes:true,attributeFilter:['data-lesson-gate','data-echs-lesson-course']});
  on(win,'pagehide',dispose);on(win,'popstate',()=>{if(owner)verify();else if(stripHash(win.location.href)!==route)dispose();});
  on(win,'hashchange',()=>{if(!owner)return;if(!verify())return;if(active){const hash=win.location.hash;if(hash.startsWith('#classroom-')){const target=lesson.slides.findIndex(slide=>hash==='#classroom-'+slide.id);if(target>=0){index=target;render();}}else original();}});
  on(win,'focus',()=>{if(owner)verify();else void attempt();});on(doc,'DOMContentLoaded',()=>void attempt(),{once:true});
  deadline=win.setTimeout(dispose,15000);void attempt();
  return Object.freeze({dispose});
}
