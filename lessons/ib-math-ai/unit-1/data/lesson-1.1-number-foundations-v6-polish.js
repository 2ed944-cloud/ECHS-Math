(function(){
  'use strict';
  const data=window.LESSON_DATA;
  if(!data||!data.lesson||data.lesson.number!=='1.1')return;

  const cover=data.slides.find(slide=>slide.title==='1.1 · Scientific Notation and Orders of Magnitude');
  if(cover){
    cover.title='1.1 · Number Foundations and Scientific Notation';
    cover.eyebrow='IB Mathematics: Applications and Interpretation SL · Unit 1';
    cover.html=`<div class="ap-cover nf-cover">
      <div class="ap-cover-copy">
        <div class="lesson-kicker">NUMBER SETS · PRECISION · APPROXIMATION · SCIENTIFIC NOTATION</div>
        <h1><span>1.1</span> Number Foundations and Scientific Notation</h1>
        <p class="cover-lead">Classify numbers, report precision honestly, construct bounds, quantify error and calculate confidently across powers of ten.</p>
        <div class="meaning-callout"><b>The central idea</b><span>A number is not only a value: its set, representation, stated precision and uncertainty determine what conclusions are justified.</span></div>
        <button class="cover-start" data-cover-next="1">Begin lesson <span aria-hidden="true">→</span></button>
      </div>
      <div class="cover-visual nf-cover-visual" aria-label="Learning path from number sets to scientific notation">
        <div class="visual-title">ONE COHERENT NUMBER FOUNDATIONS PATH</div>
        <div class="nf-cover-path">
          <div><b>1</b><span>Number sets</span><small>ℕ · ℤ · ℚ · ℝ · ℂ</small></div><i>→</i>
          <div><b>2</b><span>Precision</span><small>decimal places · significant figures</small></div><i>→</i>
          <div><b>3</b><span>Rounding</span><small>guard digits · justified reporting</small></div><i>→</i>
          <div><b>4</b><span>Bounds & error</span><small>intervals · percentage error</small></div><i>→</i>
          <div><b>5</b><span>Scientific notation</span><small>scale · operations · interpretation</small></div>
        </div>
        <div class="scale-caption">Structure → precision → uncertainty → calculation → interpretation</div>
      </div>
    </div>`;
  }

  const opening=data.slides.find(slide=>slide.title==='Opening problem · three quantities, one decision');
  if(opening){
    opening.title='Opening problem · five numbers, five decisions';
    opening.eyebrow='Classify, report, bound and represent before calculating';
    opening.html=`<div class="opening-problem">
      <div class="problem-banner">OPENING PROBLEM</div>
      <p>A science team receives five numerical records. For each, decide what mathematical information must be communicated before the value can be used responsibly.</p>
      <div class="nf-opening-grid">
        <div><span>A</span><b>\\(\\sqrt{50}\\)</b><small>Which number set?</small></div>
        <div><span>B</span><b>\\(0.006953\\)</b><small>How should precision be reported?</small></div>
        <div><span>C</span><b>\\(8.4\\text{ cm}\\)</b><small>What exact values could round here?</small></div>
        <div><span>D</span><b>50 vs 48.6</b><small>How large is the relative error?</small></div>
        <div><span>E</span><b>\\(72\\,900\\,000\\)</b><small>Which representation exposes scale?</small></div>
      </div>
      <div class="question-band"><b>Question:</b> Why is a bare calculator display not enough evidence for a mathematically responsible conclusion?</div>
      <textarea class="student-note" data-note="opening-problem-v6" aria-label="Opening problem response" placeholder="For at least three records, state the missing mathematical information and why it matters."></textarea>
    </div>`;
  }

  const goals=data.slides.find(slide=>slide.title==='Learning goals and evidence of mastery');
  if(goals){
    goals.html=`<div class="goal-grid nf-goal-grid">
      <div class="goal-card"><b>Classify</b><p>Place exact values in the smallest appropriate number set and explain the hierarchy.</p></div>
      <div class="goal-card"><b>Report precision</b><p>Round to decimal places and significant figures while preserving meaningful zeros.</p></div>
      <div class="goal-card"><b>Construct bounds</b><p>Translate rounded measurements into direct and calculated error intervals.</p></div>
      <div class="goal-card"><b>Quantify error</b><p>Calculate absolute, relative and percentage error and judge tolerance.</p></div>
      <div class="goal-card"><b>Represent scale</b><p>Convert between ordinary and normalized scientific notation.</p></div>
      <div class="goal-card"><b>Validate</b><p>Use definitions, units, estimates, bounds and contextual interpretation.</p></div>
    </div>
    <div class="success-strip"><b>A complete IB response:</b><span>defines the structure → shows the method → preserves units and precision → checks uncertainty → interprets the result.</span></div>`;
  }

  const water=data.exam.find(task=>task.id==='NFV6-1.1-E04');
  if(water){
    water.parts[1].answer='\\(\\pi(2.395)^2(5.75)\\approx103.616\\text{ m}^3\\).';
    water.parts[2].answer='\\(\\pi(2.405)^2(5.85)\\approx106.301\\text{ m}^3\\).';
    water.parts[3].answer='Compare the nominal value \\(104.954\\text{ m}^3\\) with both extremes. The larger relative difference is approximately \\(1.29\\%\\), occurring at the lower bound.';
    water.parts[3].markscheme='M1 evaluates both extreme differences; M1 divides by the corresponding possible true value; A1 identifies the maximum as approximately 1.29%.';
  }

  const optical=data.exam.find(task=>task.id==='NFV6-1.1-E05');
  if(optical){
    optical.parts[2].answer='\\(13.8215\\le A<13.8874\\text{ cm}^2\\) approximately.';
    optical.parts[3].answer='Compare \\(13.85\\) with both possible area extremes. The maximum relative difference is approximately \\(0.270\\%\\), at the upper endpoint.';
    optical.parts[3].markscheme='M1 evaluates both differences; M1 divides by the corresponding possible true area; A1 identifies the maximum as approximately 0.270%.';
  }

  data.v6Audit=Object.assign({},data.v6Audit,{
    coverAlignedToFullScope:true,
    learningGoalsAligned:true,
    mathematicalSpotCheck:'water-volume and optical-area bounds independently recalculated',
    waterBounds:[103.6164605046,106.3006451219],
    opticalBounds:[13.8214565144,13.8874299601]
  });
})();
