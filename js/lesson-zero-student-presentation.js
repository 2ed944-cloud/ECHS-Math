/* AP Lesson 0 — final student-facing copy and fullscreen control */
(function(){
  'use strict';

  const precalculus=window.ECHS_L0_DATA;
  const calculus=window.ECHS_CALC_L0_DATA;
  const data=precalculus||calculus;
  if(!data||!Array.isArray(data.slides))return;

  const isCalculus=Boolean(calculus);
  const findSlide=id=>data.slides.find(slide=>slide&&slide.id===id);
  const updateSlide=(id,patch)=>{
    const slide=findSlide(id);
    if(slide)Object.assign(slide,patch);
  };

  data.meta=Object.assign({},data.meta,{
    title:isCalculus?'AP Calculus Lesson 0 · First Day, Diagnostic & Success Plan':'AP Precalculus Lesson 0 · First Day, Diagnostic & Success Plan',
    version:'student-presentation-4.0.0-2026-08-29',
    design:'Student classroom presentation'
  });

  /* Remove internal design/release language that should never appear to students. */
  const cleanText=value=>String(value||'')
    .replace(/ECHS Mathematics\s*·\s*Premiere/gi,'ECHS Mathematics · Welcome')
    .replace(/Cinematic first-day edition/gi,'First class')
    .replace(/Light cinematic edition/gi,'')
    .replace(/Cinematic edition/gi,'')
    .replace(/Scene 01\s*·\s*Motion/gi,'First question · Motion')
    .replace(/FREEZE FRAME\s*·\s*/gi,'')
    .replace(/First frame/gi,'Start here')
    .replace(/\s+·\s+·\s+/g,' · ')
    .trim();

  data.slides.forEach(slide=>{
    if(!slide)return;
    slide.title=cleanText(slide.title);
    slide.subtitle=cleanText(slide.subtitle);
    slide.body=cleanText(slide.body);
  });

  const journey=`<div class="scene-route">
    <article data-scene="01"><b>1</b><h3>Connect</h3><p>Meet classmates and identify the ways you begin mathematical thinking.</p></article>
    <article data-scene="02"><b>2</b><h3>Understand</h3><p>See the course structure, major ideas, assessment, and expectations.</p></article>
    <article data-scene="03"><b>3</b><h3>Agree</h3><p>Establish the routines that make discussion, technology, and feedback productive.</p></article>
    <article data-scene="04"><b>4</b><h3>Diagnose</h3><p>Complete the prerequisite readiness check honestly and independently.</p></article>
    <article data-scene="05"><b>5</b><h3>Plan</h3><p>Turn the evidence into one clear first-week action.</p></article>
  </div><aside class="callout"><strong>Your goal today:</strong> leave knowing the course, the classroom, your current strengths, and your next step.</aside>`;

  if(isCalculus){
    updateSlide('welcome',{subtitle:'First class · Course launch'});
    updateSlide('first-day-plan',{
      title:'Your first-class journey',
      subtitle:'One clear sequence from connection to a personal starting plan.',
      body:journey
    });
    const instant=findSlide('calculus-question');
    if(instant){
      instant.title='A question before any formulas';
      instant.subtitle='Use your current thinking; formal calculus language is not required yet.';
      instant.body=cleanText(instant.body);
    }
  }else{
    updateSlide('welcome',{subtitle:'First class · Course launch'});
    updateSlide('pacing',{
      title:'Your first-class journey',
      subtitle:'One clear sequence from connection to a personal starting plan.',
      body:journey
    });
  }

  /* A final pass catches any text inserted by the shared visual layer. */
  data.slides.forEach(slide=>{
    if(!slide)return;
    slide.title=cleanText(slide.title);
    slide.subtitle=cleanText(slide.subtitle);
    slide.body=cleanText(slide.body);
  });

  const button=document.getElementById('fullscreenToggle');
  if(!button)return;
  const label=button.querySelector('[data-fullscreen-label]');
  const icon=button.querySelector('.fullscreen-icon');
  const root=document.documentElement;

  const nativeElement=()=>document.fullscreenElement||document.webkitFullscreenElement||null;
  const fallbackActive=()=>document.body.classList.contains('presentation-mode');
  const isActive=()=>Boolean(nativeElement()||fallbackActive());

  function updateFullscreenUI(){
    const active=isActive();
    button.setAttribute('aria-pressed',active?'true':'false');
    button.setAttribute('aria-label',active?'Exit full screen':'Enter full screen');
    button.title=active?'Exit full screen (Esc)':'Full screen (F)';
    if(label)label.textContent=active?'Exit full screen':'Full screen';
    if(icon)icon.textContent=active?'↙':'⛶';
  }

  async function enterFullscreen(){
    document.body.classList.remove('presentation-mode');
    try{
      if(root.requestFullscreen){
        try{await root.requestFullscreen({navigationUI:'hide'});}catch(firstError){await root.requestFullscreen();}
        return;
      }
      if(root.webkitRequestFullscreen){
        root.webkitRequestFullscreen();
        return;
      }
    }catch(error){
      console.warn('Native fullscreen was unavailable; using presentation mode.',error);
    }
    document.body.classList.add('presentation-mode');
    updateFullscreenUI();
  }

  async function exitFullscreen(){
    try{
      if(document.fullscreenElement&&document.exitFullscreen){await document.exitFullscreen();return;}
      if(document.webkitFullscreenElement&&document.webkitExitFullscreen){document.webkitExitFullscreen();return;}
    }catch(error){
      console.warn('Fullscreen exit failed; restoring the page layout.',error);
    }
    document.body.classList.remove('presentation-mode');
    updateFullscreenUI();
  }

  async function toggleFullscreen(){
    if(isActive())await exitFullscreen();
    else await enterFullscreen();
  }

  button.addEventListener('click',toggleFullscreen);
  document.addEventListener('fullscreenchange',updateFullscreenUI);
  document.addEventListener('webkitfullscreenchange',updateFullscreenUI);
  document.addEventListener('keydown',event=>{
    const tag=document.activeElement&&document.activeElement.tagName;
    const editing=['INPUT','TEXTAREA','SELECT'].includes(tag)||document.activeElement?.isContentEditable;
    if(editing)return;
    if(event.key==='f'||event.key==='F'){
      event.preventDefault();
      toggleFullscreen();
    }else if(event.key==='Escape'&&fallbackActive()){
      document.body.classList.remove('presentation-mode');
      updateFullscreenUI();
    }
  });

  updateFullscreenUI();
})();
