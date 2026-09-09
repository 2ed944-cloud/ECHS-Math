import {createPresentationSession} from './presentation-session.mjs';
import {createContentRenderer} from '../lesson-runtime/content-renderer.mjs';

const presentations=new WeakMap();

/** A read-only, currently authorized staff presentation. The caller supplies only
 * a canonical document; teacher notes and student progression have no API here. */
export function openLessonPresentation({dialog,document:lesson,mathEngine,isCurrent,resolveAsset}={}){
  if(!dialog?.ownerDocument||typeof dialog.showModal!=='function'||typeof isCurrent!=='function'||
     (resolveAsset!==undefined&&typeof resolveAsset!=='function'))throw new TypeError('A verified presentation dialog is required.');
  const doc=dialog.ownerDocument,win=doc.defaultView;
  if(!win||!dialog.isConnected)throw new TypeError('The presentation dialog must be connected.');
  let controller=null,source=null,renderer=null,disposed=false,resolveClosed,guardTimer,observer;
  let renderedSlide=null,renderedReset=-1,renderedCount=0,assetPending=0,fullscreenPending=false;
  let fullscreenGeneration=0,fullscreenTimer=null,fullscreenMessage='',opener=doc.activeElement,cancelAfterFullscreenUntil=0;
  const listeners=[],closed=new Promise(resolve=>{resolveClosed=resolve;});
  const el=(tag,text,attributes={})=>{const node=doc.createElement(tag);if(text!==undefined)node.textContent=text;for(const [key,value] of Object.entries(attributes))node.setAttribute(key,String(value));return node;};
  const frame=el('section',undefined,{class:'lesson-presentation-surface','aria-label':'Lesson presentation'});
  const heading=el('h2','',{id:'presentation-heading'}),end=el('button','End presentation',{id:'presentation-end',type:'button'});
  const top=el('header',undefined,{class:'lesson-presentation-header'});top.append(heading,end);
  const slide=el('section',undefined,{id:'presentation-slide',tabindex:0,'aria-labelledby':'presentation-slide-heading'});
  const footer=el('footer',undefined,{class:'lesson-presentation-footer'});
  const status=el('p','',{id:'presentation-status',role:'status','aria-live':'polite','aria-atomic':'true'});
  const controls=el('nav',undefined,{class:'lesson-presentation-controls','aria-label':'Presentation controls'});
  const previous=el('button','Previous slide',{id:'presentation-previous',type:'button'});
  const next=el('button','Next slide',{id:'presentation-next',type:'button'});
  const jumpLabel=el('label','Go to slide',{for:'presentation-jump'}),jump=el('select',undefined,{id:'presentation-jump'});
  const jumpField=el('div',undefined,{class:'lesson-presentation-jump'});jumpField.append(jumpLabel,jump);
  const reveal=el('button','Reveal next block',{id:'presentation-reveal',type:'button'});
  const reset=el('button','Reset slide',{id:'presentation-reset',type:'button'});
  const fullscreen=el('button','Full screen',{id:'presentation-fullscreen',type:'button','aria-pressed':'false'});
  controls.append(previous,jumpField,next,reveal,reset,fullscreen);footer.append(status,controls);frame.append(top,slide,footer);
  let content=null,empty=null;
  const on=(target,type,callback)=>{target.addEventListener(type,callback);listeners.push(()=>target.removeEventListener(type,callback));};
  function rawCurrent(){try{return typeof isCurrent==='function'&&isCurrent()===true;}catch{return false;}}
  function current(){if(disposed)return false;if(!rawCurrent()||disposed){dispose();return false;}return true;}
  function exitOwnedFullscreen(){
    if(doc.fullscreenElement===frame&&typeof doc.exitFullscreen==='function'){
      try{Promise.resolve(doc.exitFullscreen()).catch(()=>{});}catch{}
    }
  }
  function dispose(){
    if(disposed)return;
    // The parent ownership callback may itself dispose this view. Set the guard
    // before calling any external code so that cleanup is safely re-entrant.
    disposed=true;const returnFocus=rawCurrent();fullscreenGeneration++;
    win.clearInterval(guardTimer);win.clearTimeout(fullscreenTimer);observer?.disconnect();
    for(const remove of listeners.splice(0))remove();
    renderer?.deactivate(slide);renderer?.dispose();renderer=null;controller?.dispose();source=null;lesson=null;
    assetPending=0;fullscreenPending=false;exitOwnedFullscreen();
    // Clear retained nodes as well as detaching them; old handles cannot retain
    // private lesson text or clear a subsequently mounted presentation.
    for(const node of [...frame.querySelectorAll('*')].reverse()){
      if('value'in node)node.value='';node.replaceChildren();
    }
    frame.replaceChildren();
    if(presentations.get(dialog)===api){
      presentations.delete(dialog);if(dialog.open)dialog.close();dialog.replaceChildren();
      dialog.removeAttribute('aria-labelledby');dialog.removeAttribute('aria-describedby');
    }
    if(returnFocus&&opener?.isConnected)opener.focus?.();
    opener=null;content=null;empty=null;resolveAsset=null;isCurrent=null;mathEngine=null;resolveClosed();
  }
  async function authorizedAsset(assetId,options){
    if(!current()||options.signal?.aborted)throw new Error('Presentation is no longer available.');
    const resolver=resolveAsset;assetPending++;
    try{
      const receipt=await resolver(assetId,options);
      if(!current()||options.signal?.aborted)throw new Error('Presentation is no longer available.');
      return receipt;
    }finally{assetPending=Math.max(0,assetPending-1);}
  }
  function render(state){
    if(!current())return;
    if(state.status==='disposed'){dispose();return;}
    const selected=source.slides[state.slideIndex];
    if(renderedSlide!==state.slideId||renderedReset!==state.resetToken){
      renderer?.deactivate(slide);renderer?.dispose();renderer=null;
      slide.replaceChildren();content=el('div',undefined,{class:'lesson-presentation-content','data-layout':selected.layout});
      empty=el('p','Use Reveal next block or press Space to begin.',{class:'lesson-presentation-empty'});
      slide.append(el('h3',selected.title,{id:'presentation-slide-heading'}),empty,content);
      renderer=createContentRenderer({document:doc,mathEngine,resolveAsset:typeof resolveAsset==='function'?authorizedAsset:undefined});
      renderedSlide=state.slideId;renderedReset=state.resetToken;renderedCount=0;slide.scrollTop=0;
    }
    while(renderedCount<state.revealedCount){
      const block=selected.blocks[renderedCount];
      const node=block.type==='legacy-embedded'&&block.version===1?
        el('p','Legacy lesson reference: '+block.content.summary):renderer.block(block);
      node.classList.add('lesson-presentation-block');node.dataset.blockId=block.id;content.append(node);renderedCount++;
    }
    empty.hidden=state.revealedCount!==0;
    heading.textContent=source.title;
    previous.disabled=!state.canPrevious;next.disabled=!state.canNext;reveal.disabled=!state.canReveal;
    reset.disabled=state.revealedCount===0;jump.value=String(state.slideIndex);
    const full=doc.fullscreenElement===frame;
    fullscreen.textContent=full?'Exit full screen':'Full screen';fullscreen.setAttribute('aria-pressed',String(full));fullscreen.disabled=fullscreenPending;
    status.textContent=`Slide ${state.slideIndex+1} of ${state.totalSlides} · ${state.revealedCount} of ${state.totalBlocks} blocks revealed.${fullscreenMessage?' '+fullscreenMessage:''}`;
  }
  function update(){if(current())render(controller.snapshot());}
  function action(method,value){
    if(!current())return;
    try{controller[method](value);update();}catch{if(current()){fullscreenMessage='This presentation action could not be completed.';update();}}
  }
  function settleFullscreen(generation,failed){
    if(disposed||generation!==fullscreenGeneration){exitOwnedFullscreen();return;}
    win.clearTimeout(fullscreenTimer);fullscreenTimer=null;fullscreenPending=false;
    if(!current()){exitOwnedFullscreen();return;}
    if(failed)fullscreenMessage='Full screen is unavailable. Presentation remains open.';
    else fullscreenMessage=doc.fullscreenElement===frame?'Full screen is on.':'Presentation remains open.';
    update();
  }
  function toggleFullscreen(){
    if(!current()||fullscreenPending)return;
    const leaving=doc.fullscreenElement===frame;
    const request=leaving?doc.exitFullscreen:frame.requestFullscreen;
    if(typeof request!=='function'){fullscreenMessage='Full screen is unavailable. Presentation remains open.';update();return;}
    const generation=++fullscreenGeneration;fullscreenPending=true;fullscreenMessage='';
    // Invoke the API directly in the click's user-activation turn. No automatic
    // fullscreen request is made on opening, revealing, or exiting fullscreen.
    let result;
    try{result=request.call(leaving?doc:frame);}catch{settleFullscreen(generation,true);return;}
    fullscreenTimer=win.setTimeout(()=>{
      if(disposed||generation!==fullscreenGeneration)return;
      fullscreenGeneration++;fullscreenPending=false;fullscreenMessage='Full screen is unavailable. Presentation remains open.';update();
    },5000);
    Promise.resolve(result).then(()=>settleFullscreen(generation,!leaving&&doc.fullscreenElement!==frame),()=>settleFullscreen(generation,true));
    update();
  }
  const api=Object.freeze({closed,dispose,hasPending:()=>current()&&(assetPending>0||fullscreenPending)});
  try{
    // Validation precedes replacement of an existing authorized view.
    controller=createPresentationSession({document:lesson,mathEngine,isCurrent:rawCurrent,onChange:render});
    source=controller.document();lesson=null;
    if(!source||!rawCurrent())throw new Error('Presentation is no longer available.');
    const prior=presentations.get(dialog);if(dialog.open&&!prior)throw new Error('The dialog is already in use.');
    prior?.dispose();
    if(!rawCurrent())throw new Error('Presentation is no longer available.');
    presentations.set(dialog,api);dialog.classList.add('lesson-presentation');
    dialog.setAttribute('aria-labelledby','presentation-heading');dialog.setAttribute('aria-describedby','presentation-status');
    frame.lang=source.accessibility.language;
    jump.replaceChildren(...source.slides.map((item,index)=>el('option',`${index+1}. ${item.title}`,{value:index})));
    dialog.replaceChildren(frame);
    on(previous,'click',()=>action('previous'));on(next,'click',()=>action('next'));
    on(reveal,'click',()=>action('reveal'));on(reset,'click',()=>action('reset'));
    on(jump,'change',()=>action('jump',Number(jump.value)));on(fullscreen,'click',toggleFullscreen);on(end,'click',dispose);
    // Native close events are queued. A close event from a replaced instance
    // must not dispose a new instance that has already reopened this dialog.
    on(dialog,'close',()=>{if(!dialog.open)dispose();});
    on(dialog,'cancel',event=>{
      event.preventDefault();
      if(win.performance.now()<cancelAfterFullscreenUntil)return;
      if(fullscreenPending)dispose();else if(doc.fullscreenElement===frame)toggleFullscreen();else dispose();
    });
    on(doc,'fullscreenchange',()=>{
      if(!current())return;
      cancelAfterFullscreenUntil=doc.fullscreenElement===frame?0:win.performance.now()+250;
      fullscreenMessage=doc.fullscreenElement===frame?'Full screen is on.':'Full screen ended. Presentation remains open.';update();
    });
    on(frame,'keydown',event=>{
      if(!current()||event.defaultPrevented||event.isComposing||event.keyCode===229||event.repeat||event.ctrlKey||event.metaKey||event.altKey)return;
      if(event.key==='Escape'&&doc.fullscreenElement===frame){
        event.preventDefault();event.stopPropagation();if(fullscreenPending)dispose();else toggleFullscreen();return;
      }
      if(event.target?.closest?.('button,a,input,select,textarea,summary,[contenteditable],iframe,video,audio,.echsMediaTable,[role="button"],[role="textbox"]'))return;
      const method=({'ArrowRight':'next','PageDown':'next','ArrowLeft':'previous','PageUp':'previous',' ':'reveal'})[event.key];
      if(method){event.preventDefault();action(method);}
    });
    for(const name of ['storage','focus','echs:institution-signout','popstate'])on(win,name,()=>current());
    observer=new win.MutationObserver(()=>{if(!dialog.isConnected||!dialog.open)dispose();});
    render(controller.snapshot());dialog.showModal();slide.focus();
    observer.observe(doc.documentElement,{childList:true,subtree:true});
    guardTimer=win.setInterval(()=>current(),200);
    return api;
  }catch(error){dispose();throw error;}
}
