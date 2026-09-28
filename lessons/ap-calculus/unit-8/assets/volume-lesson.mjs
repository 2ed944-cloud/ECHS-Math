import {LESSONS} from './volume-lessons.mjs?v=20260928-volume2';
import {SCENARIOS,SHAPES,buildModel,midpointSum} from './volume-model.mjs?v=20260928-volume2';

// Scoped lesson engine. Public, original teaching content; no learner-storage,
// completion or mastery writes. The established platform guard owns access.
const $=id=>document.getElementById(id);
const lesson=LESSONS[document.documentElement.dataset.volumeLesson];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=x=>Number(x).toLocaleString('en-US',{maximumFractionDigits:5});
const answers=new Map();
const events=new AbortController();
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
let current=0,model,renderer,rendererPromise,drawFrame=0,animationFrame=0,animationStart=0,drag=null,destroyed=false;
let state=defaults();
function defaults(){return{slice:.5,slices:12,mode:'solid',sweep:360,buildFraction:1,cutaway:false,yaw:-.62,pitch:.46,zoom:1,showRegion:true,showAxes:true,showSlice:true};}
function on(node,type,fn){node.addEventListener(type,fn,{signal:events.signal});}
function math(node,tex){
  node.replaceChildren();
  if(window.katex){try{window.katex.render(tex,node,{displayMode:true,throwOnError:true,trust:false,strict:'error',maxExpand:100,maxSize:10});return;}catch{}}
  node.classList.add('formula-fallback');node.textContent=tex;
}
function formulaList(arr){return(arr||[]).map(t=>`<div class="formula" data-formula="${esc(t)}"></div>`).join('');}
function applyMath(root=document){root.querySelectorAll('[data-formula]').forEach(n=>math(n,n.dataset.formula));}
function paragraphList(arr){return(arr||[]).map(t=>`<p>${esc(t)}</p>`).join('');}
function selectedScenarios(){
  if(lesson.id==='cross-sections')return SCENARIOS.filter(s=>s.kind==='cross');
  if(lesson.id==='about-a-line')return SCENARIOS.filter(s=>s.id.startsWith('shifted-')||s.kind==='shell');
  return SCENARIOS.filter(s=>!s.id.startsWith('shifted-')&&s.kind!=='cross');
}
function stageIndexFromHash(){const id=decodeURIComponent(location.hash.slice(1));if(id==='practice')return lesson.stages.findIndex(s=>s.kind==='question');const i=lesson.stages.findIndex(s=>s.id===id);return i<0?0:i;}
function showStage(index,focus=false){
  stopAnimation();current=Math.max(0,Math.min(lesson.stages.length-1,index));
  const stage=lesson.stages[current],record=answers.get(stage.id)||{};
  $('phase').textContent=`${stage.phase||'Learn'} · AP Calculus AB / BC`;
  $('stage-title').textContent=stage.title;
  $('lesson-number').textContent=`AP Calculus ${lesson.number}`;
  $('lesson-title').textContent=lesson.title;
  $('stage-select').value=String(current);
  $('stage-counter').textContent=`${current+1} / ${lesson.stages.length}`;
  $('progress-line').style.width=`${100*(current+1)/lesson.stages.length}%`;
  $('back').disabled=current===0;$('next').disabled=current===lesson.stages.length-1;
  const isQuestion=stage.kind==='question';
  const isResponse=stage.kind==='reflection'||Boolean(stage.parts?.length);
  let body=`<div class="stage-copy">${paragraphList(stage.body)}${formulaList(stage.formulas)}`;
  if(stage.kind==='intro')body+=`<ol class="objectives">${lesson.objectives.map(x=>`<li>${esc(x)}</li>`).join('')}</ol>`;
  if(stage.prompt)body+=`<p class="lede"><strong>${esc(stage.prompt)}</strong></p>`;
  if(stage.sources?.length)body+=`<p class="small context-source">${stage.sources.filter(s=>s.url.startsWith('https://')).map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a>`).join(' · ')}</p>`;
  if(stage.parts?.length)body+=`<ol>${stage.parts.map(x=>`<li>${esc(x)}</li>`).join('')}</ol>`;
  if(isQuestion)body+=`<fieldset class="question-choices"><legend class="sr-only">Choose one answer</legend>${(stage.choices||[]).map((x,i)=>`<label><input type="radio" name="answer" value="${i}" ${record.choice===i?'checked':''}><span><strong>${String.fromCharCode(65+i)}.</strong> ${esc(x)}</span></label>`).join('')}</fieldset><button class="primary" id="check-answer">Check my reasoning</button><div class="feedback" id="question-feedback" role="status"></div>`;
  if(isResponse)body+=`<label for="written-response"><strong>Your setup and explanation</strong></label><textarea id="written-response" maxlength="6000" placeholder="Write the integral, explain the geometry, and include units.">${esc(record.written||'')}</textarea><p class="small">This is an ungraded reflection. Your writing stays in this open tab.</p>`;
  if(stage.hints?.length)body+=`<div class="stage-actions"><button id="hint-button">Show a guiding hint</button></div><p id="hint-text" class="hint" hidden></p>`;
  if(stage.solution?.length||stage.solutionFormulas?.length)body+=`<div class="stage-actions"><button id="solution-button" aria-expanded="false" aria-controls="worked-solution">${isResponse?'Compare with a worked response':'Reveal the worked reasoning'}</button></div><div class="answer-panel" id="worked-solution" hidden><h3>Worked reasoning</h3>${paragraphList(stage.solution)}${formulaList(stage.solutionFormulas)}</div>`;
  if(stage.kind==='summary')body+=`<div class="stage-actions"><button id="return-practice" class="primary">Review the lesson checks</button><a href="../../../index.html?course=ap-calculus-ab#courses">Return to AP Calculus</a></div><p class="small">The platform’s lesson-completion control manages your learning pathway. Viewing a model or checking these examples does not award mastery.</p>`;
  body+='</div>';
  $('stage-body').className=`stage-body ${stage.kind}`;$('stage-body').innerHTML=body;applyMath($('stage-body'));
  if(isQuestion){$('stage-body').querySelectorAll('input[name=answer]').forEach(n=>on(n,'change',()=>{record.choice=Number(n.value);answers.set(stage.id,record);}));on($('check-answer'),'click',()=>{const choice=$('stage-body').querySelector('input[name=answer]:checked');if(!choice){$('question-feedback').textContent='Choose an answer, then explain why it fits the geometry.';return;}record.choice=Number(choice.value);record.checked=true;answers.set(stage.id,record);$('question-feedback').textContent=record.choice===stage.correct?'Correct. Check that your explanation also identifies the slice and the differential.':'Revisit the radius, the slice direction, or the area formula. Use a hint before trying again.';});}
  if(isResponse)on($('written-response'),'input',e=>{record.written=e.target.value;answers.set(stage.id,record);});
  if($('hint-button')){let h=0;on($('hint-button'),'click',()=>{$('hint-text').hidden=false;$('hint-text').textContent=stage.hints[Math.min(h++,stage.hints.length-1)];});}
  if($('solution-button'))on($('solution-button'),'click',()=>{const panel=$('worked-solution');panel.hidden=!panel.hidden;$('solution-button').setAttribute('aria-expanded',String(!panel.hidden));});
  if($('return-practice'))on($('return-practice'),'click',()=>navigateToPractice());
  const useModel=Boolean(stage.scenario)||stage.kind==='lab'||stage.kind==='intro';
  $('lessonStage').classList.toggle('model-stage',useModel);
  $('workspace').hidden=!useModel;$('explore-button').textContent=useModel?'Hide 3D workspace':'Open 3D workspace';$('explore-button').setAttribute('aria-expanded',String(useModel));
  if(useModel){setScenario(stage.scenario||selectedScenarios()[0].id,stage.shape||'square',stage.axisOffset);loadRenderer();}
  if(document.body.classList.contains('presentation-mode'))setMathVisible(false);
  $('announcement').textContent=`Step ${current+1}: ${stage.title}`;
  if(focus){$('stage-title').focus({preventScroll:true});window.scrollTo({top:0,behavior:reduced.matches?'instant':'smooth'});}
}
function go(index){const next=Math.max(0,Math.min(lesson.stages.length-1,index));history.replaceState(null,'',`#${lesson.stages[next].id}`);showStage(next,true);}
function navigateToPractice(){history.replaceState(null,'','#practice');showStage(lesson.stages.findIndex(s=>s.kind==='question'),true);}
function setScenario(id,shape='square',offset){
  stopAnimation();const spec=SCENARIOS.find(s=>s.id===id);if(!spec)throw new Error('Missing reviewed scenario');
  // A stage may request a comparison from a neighboring volume lesson.
  if(![...$('scenario').options].some(x=>x.value===id)){$('scenario').add(new Option(spec.label,id));}
  $('scenario').value=id;$('shape').value=shape;
  $('axis-offset').replaceChildren(...spec.allowedAxisOffsets.map(k=>new Option(`${spec.axis==='x'?'y':'x'} = ${k}`,String(k))));
  $('axis-offset').value=String(offset??spec.defaultAxisOffset);
  $('shape-label').hidden=spec.kind!=='cross';$('axis-label').hidden=!spec.id.startsWith('shifted-');
  state=defaults();model=buildModel({scenario:id,shape,axisOffset:Number($('axis-offset').value)});
  syncControls();updateMath();queueDraw();
}
function rebuildModel(){stopAnimation();model=buildModel({scenario:$('scenario').value,shape:$('shape').value,axisOffset:Number($('axis-offset').value)});state.sweep=360;state.buildFraction=1;syncControls();updateMath();queueDraw();}
function syncControls(){
  $('slice').value=String(state.slice*1000);$('slices').value=String(state.slices);$('sweep').value=String(state.sweep);$('view-mode').value=state.mode;$('cutaway').checked=state.cutaway;$('show-region').checked=state.showRegion;$('show-axes').checked=state.showAxes;$('show-slice').checked=state.showSlice;
  $('sweep-control').hidden=model.kind==='cross';$('cutaway-label').hidden=model.kind==='cross';
  $('construction-control').hidden=model.kind!=='cross';$('construction').value=String(state.buildFraction*1000);$('construction-value').textContent=`${Math.round(state.buildFraction*100)}%`;
  $('section-caption').textContent=model.kind==='shell'?'Unrolled shell surface':'Face-on cross section';
  $('build').textContent='Build solid';$('build').disabled=reduced.matches;
  $('motion-note').textContent=reduced.matches?'Reduced motion is on. Use the sliders to inspect construction step by step.':'Drag the solid to rotate. Arrow keys rotate, +/− zoom, and Home resets the view.';
}
function updateMath(){
  const [a,b]=model.bounds,t=a+(b-a)*state.slice,s=model.sliceAt(t),step=(b-a)/state.slices,approx=midpointSum(model,state.slices);
  $('slice-value').textContent=`${model.variable} = ${num(t)}`;$('slice-label').textContent=`Representative ${model.kind==='shell'?'shell':'slice'}`;
  $('slices-value').textContent=String(state.slices);$('sweep-value').textContent=`${Math.round(state.sweep)}°`;
  $('model-description').textContent=model.baseDescription;
  $('model-scope').textContent=model.enrichment?'Optional enrichment · cylindrical shells':'AP Calculus AB / BC';
  const labels=model.kind==='cross'?['Base width w','Cross-section area A',`Partition width Δ${model.variable}`,'Midpoint volume sum']:model.kind==='shell'?['Shell radius','Shell height',`Partition width Δ${model.variable}`,'Midpoint volume sum']:['Outer radius R','Inner radius r',`Partition width Δ${model.variable}`,'Midpoint volume sum'];
  const values=model.kind==='cross'?[num(s.width),num(s.area),num(step),num(approx)]:model.kind==='shell'?[num(s.radius),num(s.height),num(step),num(approx)]:[num(s.outer),num(s.inner),num(step),num(approx)];
  $('measurements').innerHTML=labels.map((x,i)=>`<div><small>${esc(x)}${i===3?' (units³)':i===1&&model.kind==='cross'?' (units²)':' (units)'}</small><strong>${esc(values[i])}</strong></div>`).join('');
  math($('integral'),model.integralTex);
  $('exact-value').textContent=`${model.exactText} units³`;$('exact-decimal').textContent=`≈ ${num(model.exactVolume)} units³`;
  $('approx-error').textContent=`${state.slices} midpoint ${model.kind==='shell'?'shells':'slices'}: ${num(approx)} units³. Absolute error: ${num(Math.abs(approx-model.exactVolume))} units³.`;
  const shape=model.shapeDescriptor;
  const area=model.kind==='cross'?`A(${model.variable})=${shape.areaTex},\\quad w=${model.widthTex}`:model.kind==='shell'?`dV=2\\pi rh\\,d${model.variable},\\quad r=${model.radiusTex},\\ h=${model.widthTex}`:`A(${model.variable})=\\pi(R^2-r^2),\\quad R=${model.outerRadiusTex},\\ r=${model.innerRadiusTex}`;
  math($('slice-formula'),area);
  $('construction-note').textContent=model.kind==='cross'?'The base determines the width. The specified cross-section shape determines the area above it.':model.id==='pearl-y'?'The semicircular region generates a sphere. Each horizontal segment sweeps out a disk, with zero inner radius.':model.kind==='disk'?'The inner radius is zero. For the shifted disk preset, the region moves with the axis.':model.kind==='shell'?'Shells use slices parallel to the axis. The displayed exact volume is for the full solid.':'The axis stays outside the region in these reviewed presets. Radii are distances to that axis.';
  $('volume-note').textContent=(state.cutaway||state.sweep<360||state.buildFraction<1)?'Construction and cutaway views expose the interior. The integral and exact value always refer to the complete solid.':'The finite stack is a midpoint approximation. The integral gives the exact volume of the complete solid.';
  const rows=[0,.25,.5,.75,1].map(f=>a+(b-a)*f);
  $('data-head').innerHTML=`<tr><th>${model.variable}</th><th>Base interval</th><th>${model.kind==='shell'?'2πrh':'A('+model.variable+')'}</th></tr>`;
  $('data-body').innerHTML=rows.map(v=>{const r=model.sliceAt(v);return`<tr><td>${num(v)}</td><td>[${num(r.baseLow)}, ${num(r.baseHigh)}]</td><td>${num(r.area)}</td></tr>`;}).join('');
  $('model-text').textContent=`${model.scenario.label}. ${model.baseDescription} At ${model.variable} = ${num(t)}, the base interval is ${num(s.baseLow)} to ${num(s.baseHigh)}. ${model.kind==='cross'?`The ${shape.label.toLowerCase()} has area ${num(s.area)} square units.`:model.kind==='shell'?`Shell radius ${num(s.radius)}, height ${num(s.height)}.`:`Outer radius ${num(s.outer)}, inner radius ${num(s.inner)}.`} The complete volume is ${model.exactText} cubic units.`;
}
async function loadRenderer(){
  try{rendererPromise??=import('./volume-renderer.mjs?v=20260928-volume2');renderer=await rendererPromise;if(destroyed)return;queueDraw();}
  catch{showFallback();}
}
function showFallback(){$('visual-fallback').hidden=false;$('visuals').hidden=true;$('model-text').hidden=false;}
function draw(){drawFrame=0;if(!renderer||!model||$('workspace').hidden||destroyed)return;try{const regionResult=renderer.renderRegion($('region-canvas'),model,state);const solidResult=renderer.renderVolume($('solid-canvas'),model,state);const sectionResult=renderer.renderSection($('section-canvas'),model,state);if(regionResult?.available===false||solidResult?.available===false||sectionResult?.available===false){showFallback();return;}$('visual-fallback').hidden=true;$('visuals').hidden=false;}catch{showFallback();}}
function queueDraw(){if(!drawFrame)drawFrame=requestAnimationFrame(draw);}
function stopAnimation(){if(animationFrame)cancelAnimationFrame(animationFrame);animationFrame=0;if($('build'))$('build').textContent='Build solid';}
function animate(timestamp){if(destroyed||document.hidden||reduced.matches){stopAnimation();return;}if(!animationStart)animationStart=timestamp;const f=Math.min(1,(timestamp-animationStart)/4800);state.sweep=360*f;state.buildFraction=f;$('sweep').value=String(state.sweep);$('sweep-value').textContent=`${Math.round(state.sweep)}°`;$('construction').value=String(1000*f);$('construction-value').textContent=`${Math.round(100*f)}%`;queueDraw();if(f<1)animationFrame=requestAnimationFrame(animate);else{stopAnimation();updateMath();}}
function startAnimation(){if(reduced.matches)return;if(animationFrame){stopAnimation();updateMath();return;}animationStart=0;state.sweep=0;state.buildFraction=0;state.mode='solid';state.cutaway=false;state.showRegion=true;state.showSlice=false;syncControls();$('build').textContent='Pause construction';updateMath();animationFrame=requestAnimationFrame(animate);}
function setMathVisible(visible){$('model-mathematics').hidden=!visible;$('math-toggle').setAttribute('aria-expanded',String(visible));$('math-toggle').textContent=visible?'Hide mathematics':'Show mathematics';}
function footerOffset(){const h=document.querySelector('.lesson-footer')?.getBoundingClientRect().height||72;document.documentElement.style.setProperty('--echs-tutor-bottom',`${h+12}px`);}
function rotate(dx,dy){state.yaw+=dx;state.pitch=Math.max(-1.35,Math.min(1.35,state.pitch+dy));queueDraw();}
function resetCamera(){state.yaw=-.62;state.pitch=.46;state.zoom=1;queueDraw();}
function validateLesson(){if(!lesson||!lesson.stages?.length)throw new Error('Lesson data is unavailable');const ids=new Set();for(const s of lesson.stages){if(!s.id||ids.has(s.id))throw new Error('Invalid stage identity');ids.add(s.id);if(s.kind==='question'&&(!Array.isArray(s.choices)||!Number.isInteger(s.correct)||s.correct<0||s.correct>=s.choices.length))throw new Error('Invalid question data');}}
function init(){
  validateLesson();$('static-content').hidden=true;
  $('lesson-app').hidden=false;$('stage-select').replaceChildren(...lesson.stages.map((s,i)=>new Option(`${i+1}. ${s.title}`,String(i))));
  $('scenario').replaceChildren(...selectedScenarios().map(s=>new Option(s.label,s.id)));$('shape').replaceChildren(...SHAPES.map(s=>new Option(s.label,s.id)));
  $('alignment').textContent=`Platform lesson ${lesson.number} · College Board topics ${lesson.cedTopics.join(', ')} · Curriculum 2026–27`;
  on($('back'),'click',()=>go(current-1));on($('next'),'click',()=>go(current+1));on($('stage-select'),'change',e=>go(Number(e.target.value)));
  on($('presentation-mode'),'click',()=>{const active=document.body.classList.toggle('presentation-mode');$('presentation-mode').setAttribute('aria-pressed',String(active));$('presentation-mode').textContent=active?'Reading view':'Slide view';setMathVisible(!active);footerOffset();queueDraw();});
  on($('math-toggle'),'click',()=>setMathVisible($('model-mathematics').hidden));
  on($('flat-region'),'click',()=>{stopAnimation();state.sweep=0;state.buildFraction=0;state.mode='solid';state.cutaway=false;state.showRegion=true;state.showSlice=false;syncControls();updateMath();queueDraw();});
  on($('complete-solid'),'click',()=>{stopAnimation();state.sweep=360;state.buildFraction=1;state.mode='solid';state.cutaway=false;syncControls();updateMath();queueDraw();});
  on($('isolate-slice'),'click',()=>{stopAnimation();state.sweep=360;state.buildFraction=1;state.mode='slice';state.cutaway=false;state.showSlice=true;syncControls();updateMath();queueDraw();});
  on($('explore-button'),'click',()=>{$('workspace').hidden=!$('workspace').hidden;const open=!$('workspace').hidden;$('explore-button').textContent=open?'Hide 3D workspace':'Open 3D workspace';$('explore-button').setAttribute('aria-expanded',String(open));if(open){if(!model)setScenario(selectedScenarios()[0].id);loadRenderer();}});
  on($('scenario'),'change',e=>setScenario(e.target.value,$('shape').value));on($('shape'),'change',rebuildModel);on($('axis-offset'),'change',rebuildModel);
  on($('slice'),'input',e=>{state.slice=Number(e.target.value)/1000;updateMath();queueDraw();});on($('slices'),'input',e=>{state.slices=Number(e.target.value);updateMath();queueDraw();});
  on($('sweep'),'input',e=>{stopAnimation();state.sweep=Number(e.target.value);state.buildFraction=1;updateMath();queueDraw();});
  on($('construction'),'input',e=>{stopAnimation();state.buildFraction=Number(e.target.value)/1000;$('construction-value').textContent=`${Math.round(state.buildFraction*100)}%`;updateMath();queueDraw();});
  on($('view-mode'),'change',e=>{state.mode=e.target.value;queueDraw();});
  for(const [id,key] of [['cutaway','cutaway'],['show-region','showRegion'],['show-axes','showAxes'],['show-slice','showSlice']])on($(id),'change',e=>{state[key]=e.target.checked;updateMath();queueDraw();});
  on($('build'),'click',startAnimation);on($('reset-model'),'click',()=>setScenario(model.id,model.shape,model.axisOffset));
  on($('reset-camera'),'click',resetCamera);on($('turn-left'),'click',()=>rotate(-.18,0));on($('turn-right'),'click',()=>rotate(.18,0));on($('tilt-up'),'click',()=>rotate(0,.15));on($('tilt-down'),'click',()=>rotate(0,-.15));on($('zoom-in'),'click',()=>{state.zoom=Math.min(1.65,state.zoom+.1);queueDraw();});on($('zoom-out'),'click',()=>{state.zoom=Math.max(.6,state.zoom-.1);queueDraw();});
  const canvas=$('solid-canvas');
  on(canvas,'pointerdown',e=>{drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
  on(canvas,'pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;rotate((e.clientX-drag.x)*.007,(e.clientY-drag.y)*.006);drag.x=e.clientX;drag.y=e.clientY;});
  on(canvas,'pointerup',()=>{drag=null;});on(canvas,'pointercancel',()=>{drag=null;});on(canvas,'lostpointercapture',()=>{drag=null;});
  on(canvas,'keydown',e=>{const actions={ArrowLeft:()=>rotate(-.15,0),ArrowRight:()=>rotate(.15,0),ArrowUp:()=>rotate(0,.12),ArrowDown:()=>rotate(0,-.12),Home:resetCamera,'+':()=>{state.zoom=Math.min(1.65,state.zoom+.1);queueDraw();},'=':()=>{state.zoom=Math.min(1.65,state.zoom+.1);queueDraw();},'-':()=>{state.zoom=Math.max(.6,state.zoom-.1);queueDraw();}};if(actions[e.key]){e.preventDefault();e.stopPropagation();actions[e.key]();}});
  on($('full-screen'),'click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('workspace').requestFullscreen();}catch{$('announcement').textContent='Full screen is unavailable. You can still use the workspace in this page.';}});
  on($('print-view'),'click',()=>window.print());
  on(window,'hashchange',()=>showStage(stageIndexFromHash(),true));
  on(document,'keydown',e=>{if(e.defaultPrevented||e.altKey||e.ctrlKey||e.metaKey||/INPUT|SELECT|TEXTAREA|BUTTON|CANVAS/.test(e.target.tagName)||e.target.closest('dialog'))return;if(e.key==='ArrowRight'){e.preventDefault();go(current+1);}if(e.key==='ArrowLeft'){e.preventDefault();go(current-1);}});
  on(document,'visibilitychange',()=>{if(document.hidden)stopAnimation();});on(reduced,'change',()=>{stopAnimation();syncControls();});
  const resize=new ResizeObserver(()=>{footerOffset();queueDraw();});resize.observe($('workspace'));resize.observe(document.querySelector('.lesson-footer'));
  const observer=new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)stopAnimation();},{threshold:0});observer.observe($('workspace'));
  on(window,'pageshow',()=>{if(!destroyed)queueDraw();});
  on(window,'pagehide',event=>{if(event.persisted){stopAnimation();return;}destroyed=true;stopAnimation();if(drawFrame)cancelAnimationFrame(drawFrame);resize.disconnect();observer.disconnect();events.abort();answers.clear();});
  showStage(stageIndexFromHash());
  footerOffset();
}
try{init();}catch(error){$('lesson-app').hidden=true;$('static-content').hidden=false;$('load-error').hidden=false;console.error('Volume lesson could not initialize',error);}
