(function(){
'use strict';

const data=window.LESSON_DATA;
if(!data||String(data.lesson?.number)!=='1.5'||!Array.isArray(data.slides))return;

const byTitle=title=>data.slides.find(slide=>slide&&slide.title===title);
const logarithmSlide=byTitle('A logarithm answers “what exponent?”');
const thresholdSlide=byTitle('Continuous crossing versus recorded period');

if(logarithmSlide){
  logarithmSlide.html=`<div class="el-two el-log-definition-layout-v602">
  <div class="el-concept el-log-definition-copy-v602">
    <div class="el-display">\\[b^y=x\\quad\\Longleftrightarrow\\quad\\log_b(x)=y.\\]</div>
    <p>A logarithm returns the exponent: \\(\\log_b(x)\\) asks which power of \\(b\\) produces \\(x\\).</p>
    <div class="el-log-condition-grid-v602">
      <div><b>Base</b><span><var>b</var> &gt; 0 and <var>b</var> &ne; 1</span></div>
      <div><b>Argument</b><span><var>x</var> &gt; 0</span></div>
    </div>
  </div>
  <div class="el-log-definition-visual-v602" role="img" aria-label="A logarithm identifies the exponent y for which b to the power y equals x">
    <div class="el-log-question-v602">WHAT EXPONENT?</div>
    <div class="el-log-equation-v602">\\[\\log_b(x)=y\\]</div>
    <div class="el-log-role-grid-v602">
      <article class="role-base-v602"><span>\\(b\\)</span><b>base</b><small>the repeated multiplier</small></article>
      <article class="role-argument-v602"><span>\\(x\\)</span><b>argument</b><small>the positive result</small></article>
      <article class="role-exponent-v602"><span>\\(y\\)</span><b>exponent</b><small>the answer returned</small></article>
    </div>
    <div class="el-log-inverse-strip-v602">
      <span>\\(\\log_b(x)=y\\)</span><strong>means exactly</strong><span>\\(b^y=x\\)</span>
    </div>
  </div>
</div>`;
}

if(thresholdSlide){
  thresholdSlide.html=`<div class="el-threshold el-threshold-v602">
  <div class="el-threshold-summary-v602">
    <div><span>Continuous model</span><b>\\(t\\approx11.67\\)</b><small>The curve crosses \\(N=3000\\) between hours 11 and 12.</small></div>
    <div><span>Recorded observations</span><b>whole hours only</b><small>The reported answer must be an admissible observation time.</small></div>
  </div>
  <div class="el-threshold-journey-v602" role="img" aria-label="At hour 11 the model is below 3000, it crosses 3000 at about 11.67 hours, and hour 12 is the first whole recorded period above 3000">
    <article class="before">
      <div class="el-threshold-status-v602">last record below target</div>
      <b>11</b>
      <span>\\(N(11)\\approx2747\\)</span>
      <small>\\(2747\\lt3000\\)</small>
    </article>
    <div class="el-threshold-arrow-v602" aria-hidden="true">→</div>
    <article class="crossing">
      <div class="el-threshold-status-v602">continuous crossing</div>
      <b>11.67</b>
      <span>\\(N(t)=3000\\)</span>
      <small>between recorded periods</small>
    </article>
    <div class="el-threshold-arrow-v602" aria-hidden="true">→</div>
    <article class="reported">
      <div class="el-threshold-status-v602">first record above target</div>
      <b>12</b>
      <span>\\(N(12)\\approx3132\\)</span>
      <small>\\(3132\\gt3000\\)</small>
    </article>
  </div>
  <div class="el-threshold-rule el-threshold-rule-v602"><b>Reporting decision:</b> the continuous solution is \\(t\\approx11.67\\) hours, but the first whole-hour observation at or above the target is hour \\(12\\). Verify both adjacent recorded periods before rounding.</div>
</div>`;
}

data.version='6.0.2';
data.visualPatchVersion='6.0.2';
data.visualAudit=Object.assign({},data.visualAudit,{
  logarithmDefinition:'single correctly typeset logarithm with separate role cards and inverse equivalence',
  logarithmDomain:'base and argument conditions use unambiguous HTML inequality symbols',
  thresholdTimeline:'three-stage decision journey with non-overlapping labels and independently recomputed model values',
  authenticatedViewport:'lesson geometry reserves the measured Learning Pathway bar height'
});
})();
