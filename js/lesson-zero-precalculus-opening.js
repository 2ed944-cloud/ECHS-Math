/* AP Precalculus Lesson 0 — course-specific opening question */
(function(){
  'use strict';

  const data=window.ECHS_L0_DATA;
  if(!data||!Array.isArray(data.slides)||window.ECHS_CALC_L0_DATA)return;
  if(data.slides.some(slide=>slide&&slide.id==='precalc-opening-question'))return;

  const openingSlide={
    id:'precalc-opening-question',
    stage:'Connect',
    title:'Opening Question · When does multiplying beat adding?',
    subtitle:'Make a prediction before calculating, then choose the evidence that could convince the class.',
    tier:'First Day',
    body:`<div class="precalc-opening-scene">
      <section class="growth-question-copy">
        <p class="cinema-kicker">First question · Competing models</p>
        <h3>Two school clubs begin with the same audience.</h3>
        <p>Each club starts with <strong>100 followers</strong>.</p>
        <div class="growth-models" aria-label="Two competing growth models">
          <article class="growth-model additive">
            <span class="growth-symbol">+50</span>
            <div><small>Club A · Additive change</small><strong>Gains 50 followers every week</strong><p>\(A(w)=100+50w\)</p></div>
          </article>
          <div class="growth-versus" aria-hidden="true">VS</div>
          <article class="growth-model multiplicative">
            <span class="growth-symbol">×1.20</span>
            <div><small>Club B · Multiplicative change</small><strong>Grows by 20% every week</strong><p>\(B(w)=100(1.20)^w\)</p></div>
          </article>
        </div>
      </section>
      <aside class="growth-question-panel">
        <span class="growth-week">After week 1</span>
        <div class="growth-score"><strong>150</strong><i>to</i><strong>120</strong></div>
        <p>Club A is ahead at first. Will it still be ahead after <strong>10 weeks</strong>?</p>
        <small>Do not calculate yet. Predict the behavior of the two models.</small>
      </aside>
    </div>

    <div class="opening-predictions" role="group" aria-label="Choose your prediction">
      <button type="button" class="opening-prediction-button" data-value="A" data-feedback="You predict that the constant weekly increase will keep Club A ahead. What table, graph, or calculation would test that claim?">
        <strong>Club A is still ahead</strong><span>The constant increase remains larger through week 10.</span>
      </button>
      <button type="button" class="opening-prediction-button" data-value="B" data-feedback="You predict that repeated multiplication eventually overtakes repeated addition. What evidence would locate the crossover?">
        <strong>Club B overtakes Club A</strong><span>The percentage growth eventually becomes more powerful.</span>
      </button>
      <button type="button" class="opening-prediction-button" data-value="equal" data-feedback="You predict the models meet at week 10. Which representation would let you check equality precisely?">
        <strong>They are equal</strong><span>The two models reach the same value at week 10.</span>
      </button>
      <button type="button" class="opening-prediction-button" data-value="evidence" data-feedback="Good mathematical instinct: a prediction should be tested. Decide whether a table, graph, or equation would give the clearest evidence first.">
        <strong>I need evidence first</strong><span>I want a table, graph, or equation before committing.</span>
      </button>
    </div>
    <p id="growthPredictionFeedback" class="opening-feedback" role="status" aria-live="polite">Choose one prediction. A correct answer is less important right now than a clear reason and a way to test it.</p>
    <label class="workspace opening-reasoning">
      <span>Explain your current reasoning in two or three sentences. Which representation would you use first—and why?</span>
      <textarea data-save="precalc-opening-reasoning" rows="3" placeholder="I predict… I would use a graph/table/equation because…"></textarea>
    </label>
    <aside class="callout"><strong>Why this belongs in AP Precalculus:</strong> the course connects function families, rates of change, models, representations, and mathematical justification.</aside>`
  };

  data.slides.splice(1,0,openingSlide);
  data.meta=Object.assign({},data.meta,{
    slides:data.slides.length,
    version:'precalculus-opening-question-5.2.0-2026-08-29'
  });

  const storage='echs-ap-precalculus-lesson-0';
  const migration=`${storage}:opening-question-5.2.0`;
  if(localStorage.getItem(migration)!=='1'){
    localStorage.removeItem(`${storage}:slide`);
    localStorage.setItem(migration,'1');
  }

  function bindPrediction(){
    const buttons=[...document.querySelectorAll('.opening-prediction-button')];
    const feedback=document.getElementById('growthPredictionFeedback');
    if(!buttons.length||!feedback)return;
    const key=`${storage}:opening-prediction`;
    const saved=localStorage.getItem(key);

    function select(button,announce){
      buttons.forEach(item=>{
        const selected=item===button;
        item.classList.toggle('selected',selected);
        item.setAttribute('aria-pressed',selected?'true':'false');
      });
      localStorage.setItem(key,button.dataset.value||'');
      if(announce)feedback.textContent=button.dataset.feedback||'Prediction saved.';
    }

    buttons.forEach(button=>{
      if(button.dataset.openingBound==='1')return;
      button.dataset.openingBound='1';
      button.setAttribute('aria-pressed','false');
      button.addEventListener('click',()=>select(button,true));
    });
    const restored=buttons.find(button=>button.dataset.value===saved);
    if(restored)select(restored,false);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(bindPrediction,0),{once:true});
  else setTimeout(bindPrediction,0);
  window.addEventListener('load',bindPrediction,{once:true});
})();
