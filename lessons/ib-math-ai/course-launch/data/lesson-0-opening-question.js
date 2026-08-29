(function(){
  'use strict';

  const data=window.ECHS_IBAI_L0_DATA;
  if(!data||!Array.isArray(data.slides))return;

  const slide=data.slides.find(item=>item&&item.id==='opening-question');
  if(!slide)return;

  slide.stage='Icebreaker';
  slide.title='Opening Question · Is the average enough?';
  slide.subtitle='Use data, variation, and context to make a defensible decision.';
  slide.body=String.raw`<div class="ibai-opening-scene">
    <section class="ibai-question-copy">
      <p class="ibai-opening-kicker">First question · Data-informed decision</p>
      <h3>Two school shuttle routes have the same average travel time.</h3>
      <p>Each route was timed on five mornings. The shuttle leaves at <strong>7:10</strong>, and class begins at <strong>7:45</strong>, so a trip longer than <strong>35 minutes</strong> arrives late.</p>

      <div class="ibai-route-compare" aria-label="Travel times for two shuttle routes">
        <article class="ibai-route-card route-a">
          <header><span>Route A</span><strong>More clustered</strong></header>
          <div class="ibai-route-times" aria-label="Route A times: 28, 29, 30, 31, and 32 minutes">
            <b>28</b><b>29</b><b>30</b><b>31</b><b>32</b>
          </div>
          <p class="ibai-route-mean">Mean travel time: \(\bar{x}_A=30\) minutes</p>
        </article>

        <div class="ibai-route-versus" aria-hidden="true">VS</div>

        <article class="ibai-route-card route-b">
          <header><span>Route B</span><strong>More spread out</strong></header>
          <div class="ibai-route-times" aria-label="Route B times: 18, 24, 30, 36, and 42 minutes">
            <b>18</b><b>24</b><b>30</b><b>36</b><b>42</b>
          </div>
          <p class="ibai-route-mean">Mean travel time: \(\bar{x}_B=30\) minutes</p>
        </article>
      </div>
    </section>

    <aside class="ibai-decision-panel">
      <span class="ibai-deadline">On-time limit · 35 min</span>
      <div class="ibai-same-mean"><strong>30</strong><span>minutes</span><small>same mean</small></div>
      <h3>Which route should the school recommend if reliable arrival matters?</h3>
      <p>Choose the strongest initial recommendation. Then identify what additional evidence would make the decision more trustworthy.</p>
    </aside>
  </div>

  <div class="ibai-opening-options" role="group" aria-label="Choose your initial recommendation">
    <button type="button" class="ibai-opening-choice" data-value="A" data-feedback="You are using consistency and the 35-minute deadline. Explain which values support that choice.">
      <strong>Recommend Route A</strong>
      <span>Its observed times are more consistent.</span>
    </button>
    <button type="button" class="ibai-opening-choice" data-value="B" data-feedback="You are prioritizing the possibility of a very fast trip. Compare that benefit with the risk of arriving late.">
      <strong>Recommend Route B</strong>
      <span>It can sometimes be much faster.</span>
    </button>
    <button type="button" class="ibai-opening-choice" data-value="same" data-feedback="You are using the equal means. Ask whether equal averages guarantee equal reliability.">
      <strong>Either route is equally good</strong>
      <span>Both have a mean of 30 minutes.</span>
    </button>
    <button type="button" class="ibai-opening-choice" data-value="more" data-feedback="Good caution. State a provisional decision from the current data, then name the extra data you would collect.">
      <strong>Collect more evidence first</strong>
      <span>Five mornings may not be enough for a final policy.</span>
    </button>
  </div>

  <p id="ibaiOpeningFeedback" class="ibai-opening-feedback" role="status" aria-live="polite">Choose one response. In IB Math AI, the quality of the evidence and interpretation matters as much as the calculation.</p>

  <div class="ibai-opening-actions">
    <button type="button" id="ibaiRevealEvidence" class="primary-button" aria-expanded="false" aria-controls="ibaiEvidencePanel">Reveal the evidence after discussion</button>
  </div>

  <section id="ibaiEvidencePanel" class="ibai-evidence-panel" hidden>
    <article><strong>Route A</strong><span>Range: \(32-28=4\) minutes</span><span>Late in the sample: \(0/5\)</span></article>
    <article><strong>Route B</strong><span>Range: \(42-18=24\) minutes</span><span>Late in the sample: \(2/5\)</span></article>
    <div><strong>Defensible conclusion</strong><p>For reliable on-time arrival, Route A is the stronger initial recommendation. The equal means hide a major difference in variation. Because the sample contains only five mornings, a final policy should still use more data and consider traffic conditions.</p></div>
  </section>

  <label class="workspace ibai-opening-reasoning">
    <span>Write a two- or three-sentence decision. Use at least one number and state one limitation of the evidence.</span>
    <textarea data-save-key="ibai-opening-reasoning" rows="3" placeholder="I recommend… The data show… One limitation is…"></textarea>
  </label>

  <aside class="notice"><strong>Why this belongs in IB Math AI:</strong> the course asks you to use data and technology, compare evidence, recognize variation, evaluate limitations, and communicate a decision in context.</aside>`;

  const originalIndex=data.slides.indexOf(slide);
  if(originalIndex>1){
    data.slides.splice(originalIndex,1);
    data.slides.splice(1,0,slide);
  }

  data.meta=Object.assign({},data.meta,{
    slides:data.slides.length,
    version:'ib-math-ai-opening-question-2.0.0-2026-08-29'
  });

  const storage='echs-ib-math-ai-lesson-0';
  const choiceKey=`${storage}:opening-decision`;
  const evidenceKey=`${storage}:opening-evidence`;
  const migration=`${storage}:opening-question-2.0.0`;

  if(localStorage.getItem(migration)!=='1'){
    localStorage.removeItem(`${storage}:slide`);
    localStorage.setItem(migration,'1');
  }

  function typeset(root){
    try{
      if(window.MathJax?.typesetClear)window.MathJax.typesetClear([root]);
      if(window.MathJax?.typesetPromise)return window.MathJax.typesetPromise([root]).catch(()=>{});
      if(window.renderMathInElement){
        window.renderMathInElement(root,{
          delimiters:[
            {left:'\\(',right:'\\)',display:false},
            {left:'\\[',right:'\\]',display:true}
          ],
          throwOnError:false
        });
      }
    }catch(error){
      console.warn('IB Math AI opening-question typesetting fallback',error);
    }
  }

  function bind(){
    const buttons=[...document.querySelectorAll('.ibai-opening-choice')];
    const feedback=document.getElementById('ibaiOpeningFeedback');
    const reveal=document.getElementById('ibaiRevealEvidence');
    const panel=document.getElementById('ibaiEvidencePanel');
    const reasoning=document.querySelector('[data-save-key="ibai-opening-reasoning"]');

    if(buttons.length&&feedback){
      const saved=localStorage.getItem(choiceKey);
      const select=(button,announce)=>{
        buttons.forEach(item=>{
          const selected=item===button;
          item.classList.toggle('selected',selected);
          item.setAttribute('aria-pressed',selected?'true':'false');
        });
        localStorage.setItem(choiceKey,button.dataset.value||'');
        if(announce)feedback.textContent=button.dataset.feedback||'Response saved.';
      };

      buttons.forEach(button=>{
        if(button.dataset.ibaiOpeningBound==='1')return;
        button.dataset.ibaiOpeningBound='1';
        button.setAttribute('aria-pressed','false');
        button.addEventListener('click',()=>select(button,true));
      });

      const restored=buttons.find(button=>button.dataset.value===saved);
      if(restored)select(restored,false);
    }

    if(reveal&&panel&&reveal.dataset.ibaiOpeningBound!=='1'){
      reveal.dataset.ibaiOpeningBound='1';
      const setVisible=(visible)=>{
        panel.hidden=!visible;
        reveal.setAttribute('aria-expanded',visible?'true':'false');
        reveal.textContent=visible?'Hide the evidence':'Reveal the evidence after discussion';
        localStorage.setItem(evidenceKey,visible?'1':'0');
        if(visible)typeset(panel);
      };
      setVisible(localStorage.getItem(evidenceKey)==='1');
      reveal.addEventListener('click',()=>setVisible(panel.hidden));
    }

    if(reasoning&&reasoning.dataset.ibaiOpeningBound!=='1'){
      reasoning.dataset.ibaiOpeningBound='1';
      const key=`${storage}:field:ibai-opening-reasoning`;
      if(!reasoning.value)reasoning.value=localStorage.getItem(key)||'';
      reasoning.addEventListener('input',()=>localStorage.setItem(key,reasoning.value));
    }
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>setTimeout(bind,0),{once:true});
  }else{
    setTimeout(bind,0);
  }
  window.addEventListener('load',bind,{once:true});
})();
