(function(){
  'use strict';
  const data=window.LESSON_DATA;
  if(!data||!data.lesson||data.lesson.number!=='1.1'||!Array.isArray(data.slides))return;

  data.version='5.2.0';
  data.buildDate='2026-08-03';

  const byTitle=title=>data.slides.find(slide=>slide.title===title);

  const cover=byTitle('1.1 · Scientific Notation and Orders of Magnitude');
  if(cover){
    cover.html=`<div class="ap-cover">
      <div class="ap-cover-copy">
        <div class="lesson-kicker">IB MATHEMATICS: APPLICATIONS AND INTERPRETATION SL · UNIT 1</div>
        <h1><span>1.1</span> Scientific Notation and Orders of Magnitude</h1>
        <p class="cover-lead">Read scale. Preserve significant digits. Calculate with powers of ten. Decide whether the result makes sense.</p>
        <div class="meaning-callout"><b>The central idea</b><span>In \\(a\\times10^k\\), the coefficient records the significant digits and the exponent records the scale.</span></div>
        <button class="cover-start" data-cover-next="1">Begin lesson <span aria-hidden="true">→</span></button>
      </div>
      <div class="cover-visual" aria-label="Length scales increasing by a factor of one thousand">
        <div class="visual-title">ONE NOTATION · CONSISTENT LENGTH SCALES</div>
        <div class="scale-spectrum">
          <div class="scale-stop"><strong>10<sup>−9</sup> m</strong><span>nanometre</span></div>
          <div class="scale-stop"><strong>10<sup>−6</sup> m</strong><span>micrometre</span></div>
          <div class="scale-stop"><strong>10<sup>−3</sup> m</strong><span>millimetre</span></div>
          <div class="scale-stop"><strong>10<sup>0</sup> m</strong><span>metre</span></div>
          <div class="scale-stop"><strong>10<sup>3</sup> m</strong><span>kilometre</span></div>
        </div>
        <div class="scale-caption">Every step of 3 in the exponent multiplies the length scale by <b>1000</b>.</div>
      </div>
    </div>`;
  }

  const comparison=byTitle('Compare and order without expanding');
  if(comparison){
    comparison.html=`<div class="lesson-grid two">
      <div>
        <div class="procedure-card"><b>Procedure</b><ol><li>Compare exponent values first.</li><li>If exponents match, compare coefficients.</li><li>For negative quantities, remember that the more negative value is smaller.</li></ol></div>
        <div class="formula-panel">\\[9.0\\times10^{-5}<3.1\\times10^{-4}<7.0\\times10^{-4}<1.2\\times10^{-3}\\]</div>
      </div>
      <div class="order-ladder" aria-label="Quantities ordered from smallest to largest">
        <div class="order-item"><span>1</span><b>\\(9.0\\times10^{-5}\\)</b><small>smallest exponent</small></div>
        <div class="order-item"><span>2</span><b>\\(3.1\\times10^{-4}\\)</b><small>same decade as the next value</small></div>
        <div class="order-item"><span>3</span><b>\\(7.0\\times10^{-4}\\)</b><small>larger coefficient</small></div>
        <div class="order-item"><span>4</span><b>\\(1.2\\times10^{-3}\\)</b><small>largest exponent</small></div>
      </div>
    </div>`;
  }

  const validation=byTitle('Estimate first, calculate second');
  if(validation){
    validation.html=`<div class="worked-box">
      <div class="worked-head"><span>VALIDATION ROUTINE</span><b>Evaluate \\((5.8\\times10^7)(3.3\\times10^5)\\).</b></div>
      <div class="validation-grid">
        <div><span>1 · ESTIMATE</span><div class="validation-math">\\[(6\\times10^7)(3\\times10^5)=18\\times10^{12}\\approx2\\times10^{13}\\]</div></div>
        <div><span>2 · CALCULATE</span><div class="validation-math">\\[5.8(3.3)\\times10^{12}=1.914\\times10^{13}\\]</div></div>
        <div><span>3 · JUDGE</span><div class="validation-math"><b>The coefficient and exponent agree with the estimate.</b></div></div>
      </div>
      <div class="warning-box"><b>A display of \\(1.914\\times10^2\\) would be rejected immediately:</b> the exponent is eleven orders too small.</div>
    </div>`;
  }

  const units=byTitle('Unit conversion in one, two and three dimensions');
  if(units){
    units.html=`<div class="unit-grid">
      <div><span>LENGTH</span><div class="unit-equation">\\[1\\text{ km}=10^3\\text{ m}\\]</div><p>Use one conversion factor.</p></div>
      <div><span>AREA</span><div class="unit-equation">\\[1\\text{ km}^2=(10^3\\text{ m})^2=10^6\\text{ m}^2\\]</div><p>Square the conversion factor.</p></div>
      <div><span>VOLUME</span><div class="unit-equation">\\[1\\text{ km}^3=(10^3\\text{ m})^3=10^9\\text{ m}^3\\]</div><p>Cube the conversion factor.</p></div>
    </div>
    <div class="warning-box"><b>Dimensional error:</b> multiplying an area in km² by only \\(10^3\\) changes the units incorrectly, even if the arithmetic is tidy.</div>`;
  }

  data.v5Audit=Object.assign({},data.v5Audit,{
    visualPolishVersion:'5.2.0',
    correctedKatexSelectorScoping:true,
    removedDestructiveKatexSpanReset:true,
    correctedCoverScale:true,
    correctedComparisonGraphic:true,
    correctedUnitGraphic:true,
    platformBarOffsetAware:true
  });
})();
