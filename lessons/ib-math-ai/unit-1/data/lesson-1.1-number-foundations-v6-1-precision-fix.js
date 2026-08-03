(function(){
  'use strict';

  const data=window.LESSON_DATA;
  if(!data||!data.lesson||data.lesson.number!=='1.1'||!Array.isArray(data.slides))return;

  const getSlide=title=>data.slides.find(slide=>slide.title===title);

  const decimalPlaces=getSlide('Decimal places measure distance from the decimal point');
  if(decimalPlaces){
    decimalPlaces.html=`
      <div class="nf-two">
        <div class="nf-key-fact">
          <b>DECIMAL-PLACE DEFINITION</b>
          <p>Decimal places count positions to the right of the decimal point. Zeros count as positions, even when they are not significant figures.</p>
          <div class="nf-formula">\\[47.38621\\text{ to }3\\text{ d.p.}=47.386\\]</div>
          <div class="nf-note"><b>Place-value language:</b> first decimal place = tenths, second = hundredths, third = thousandths.</div>
        </div>
        <div class="nf-precision-visual">
          <div class="nf-digit-diagram nf-dp-diagram" aria-label="Place-value diagram for 47.38621 rounded to three decimal places">
            <div class="nf-digit-cell"><b>4</b><small>tens</small></div>
            <div class="nf-digit-cell"><b>7</b><small>ones</small></div>
            <div class="nf-decimal-cell"><b>.</b><small>decimal point</small></div>
            <div class="nf-digit-cell is-retained"><b>3</b><small>1st d.p.<br>tenths</small></div>
            <div class="nf-digit-cell is-retained"><b>8</b><small>2nd d.p.<br>hundredths</small></div>
            <div class="nf-digit-cell is-target"><b>6</b><small>3rd d.p.<br>last retained digit</small></div>
            <div class="nf-digit-cell is-guard"><b>2</b><small>guard digit<br>decides rounding</small></div>
            <div class="nf-digit-cell"><b>1</b><small>not inspected</small></div>
          </div>
          <div class="nf-precision-legend" aria-label="Precision diagram key">
            <span class="is-retained-key">retained decimal places</span>
            <span class="is-target-key">target place</span>
            <span class="is-guard-key">guard digit</span>
          </div>
          <div class="nf-note"><b>Scale warning:</b> \\(0.004786\\) to 3 decimal places is \\(0.005\\), not \\(0.00479\\). The latter is 3 significant figures.</div>
        </div>
      </div>`;
  }

  const significantFigures=getSlide('Significant figures measure meaningful digits');
  if(significantFigures){
    significantFigures.html=`
      <div class="nf-two">
        <div class="nf-key-fact">
          <b>SIGNIFICANT-FIGURE DEFINITION</b>
          <p>Significant figures begin at the first non-zero digit. They measure reported precision independently of where the decimal point is located.</p>
          <div class="nf-formula">\\[0.004786\\text{ to }3\\text{ s.f.}=0.00479\\]</div>
          <div class="nf-note"><b>Counting rule:</b> start at 4, count three significant digits \\(4,7,8\\), then inspect the next digit \\(6\\).</div>
        </div>
        <div class="nf-precision-visual">
          <div class="nf-digit-diagram nf-sf-diagram" aria-label="Significant-figure diagram for 0.004786 rounded to three significant figures">
            <div class="nf-digit-cell is-placeholder"><b>0</b><small>placeholder<br>not significant</small></div>
            <div class="nf-decimal-cell"><b>.</b><small>decimal point</small></div>
            <div class="nf-digit-cell is-placeholder"><b>0</b><small>leading zero<br>not significant</small></div>
            <div class="nf-digit-cell is-placeholder"><b>0</b><small>leading zero<br>not significant</small></div>
            <div class="nf-digit-cell is-retained"><b>4</b><small>1st significant figure</small></div>
            <div class="nf-digit-cell is-retained"><b>7</b><small>2nd significant figure</small></div>
            <div class="nf-digit-cell is-target"><b>8</b><small>3rd s.f.<br>last retained digit</small></div>
            <div class="nf-digit-cell is-guard"><b>6</b><small>guard digit<br>round 8 up to 9</small></div>
          </div>
          <div class="nf-precision-legend" aria-label="Significant figures diagram key">
            <span>placeholders</span>
            <span class="is-retained-key">significant digits retained</span>
            <span class="is-target-key">target significant digit</span>
            <span class="is-guard-key">guard digit</span>
          </div>
          <div class="nf-note"><b>Leading zeros are placeholders.</b> They locate the decimal point but do not count as significant figures.</div>
        </div>
      </div>`;
  }

  const directInterval=getSlide('Rounding creates an interval of possible exact values');
  if(directInterval){
    directInterval.html=`
      <div class="nf-two">
        <div class="nf-key-fact">
          <b>ERROR INTERVAL</b>
          <p>If \\(x_0\\) is rounded to the nearest unit \\(h\\), the maximum rounding error is half the unit:</p>
          <div class="nf-formula">\\[x_0-\\frac h2\\leq x\\lt x_0+\\frac h2\\]</div>
          <div class="nf-example-row">
            <div><b>reported value</b><span>\\(x_0=8.4\\)</span></div>
            <div><b>rounding unit</b><span>\\(h=0.1\\)</span></div>
            <div><b>half-unit</b><span>\\(h/2=0.05\\)</span></div>
          </div>
          <div class="nf-worked-strip"><b>Endpoint calculation:</b> \\(8.4-0.05=8.35\\) and \\(8.4+0.05=8.45\\).</div>
          <p>The lower endpoint is included. The upper endpoint is excluded because \\(8.45\\) rounds to \\(8.5\\) under the usual half-up convention.</p>
        </div>
        <div class="nf-interval-visual">
          <div class="nf-interval-title">\\(8.4\\) to the nearest \\(0.1\\)</div>
          <div class="nf-number-line"><span class="nf-interval-segment"></span><i class="nf-closed-dot"></i><i class="nf-open-dot"></i><b class="nf-end nf-lower">8.35</b><b class="nf-end nf-upper">8.45</b></div>
          <div class="nf-interval-label">\\[8.35\\leq x\\lt8.45\\]</div>
          <div class="nf-note"><b>Read the picture:</b> the filled point belongs to the interval; the open point is a boundary value but is not included.</div>
        </div>
      </div>`;
  }

  const calculatedRules=getSlide('Bounds in sums, differences, products and powers');
  if(calculatedRules){
    calculatedRules.eyebrow='For each operation: explain the direction, choose endpoints, then verify with an example';
    calculatedRules.html=`
      <div class="nf-bound-rule-grid">
        <article class="nf-bound-rule-card">
          <div class="nf-bound-rule-head">SUM</div>
          <p>Adding larger inputs makes the sum larger. Use both lower endpoints for the minimum and both upper endpoints for the maximum.</p>
          <div class="nf-formula">\\[(x+y)_L=x_L+y_L,\\qquad(x+y)_U=x_U+y_U\\]</div>
          <div class="nf-bound-example"><b>Example</b><p>If \\(2\\leq x\\lt3\\) and \\(5\\leq y\\lt7\\), then \\(7\\leq x+y\\lt10\\).</p></div>
        </article>
        <article class="nf-bound-rule-card">
          <div class="nf-bound-rule-head">DIFFERENCE</div>
          <p>To make \\(x-y\\) small, choose a small \\(x\\) and a large \\(y\\). To make it large, reverse those choices.</p>
          <div class="nf-formula">\\[(x-y)_L=x_L-y_U,\\qquad(x-y)_U=x_U-y_L\\]</div>
          <div class="nf-bound-example"><b>Example</b><p>For the same intervals, \\(-5\\lt x-y\\lt-2\\). Both endpoints are open because \\(x_U\\) and \\(y_U\\) are not included.</p></div>
        </article>
        <article class="nf-bound-rule-card">
          <div class="nf-bound-rule-head">PRODUCT · POSITIVE INPUTS</div>
          <p>When both intervals are positive, increasing either factor increases the product.</p>
          <div class="nf-formula">\\[(xy)_L=x_Ly_L,\\qquad(xy)_U=x_Uy_U\\]</div>
          <div class="nf-bound-example"><b>Example</b><p>If \\(6\\leq x\\lt8\\) and \\(3\\leq y\\lt4\\), then \\(18\\leq xy\\lt32\\).</p></div>
        </article>
        <article class="nf-bound-rule-card">
          <div class="nf-bound-rule-head">POWER · POSITIVE INPUT</div>
          <p>For a positive interval and positive integer \\(n\\), the function \\(x^n\\) increases as \\(x\\) increases.</p>
          <div class="nf-formula">\\[(x^n)_L=x_L^n,\\qquad(x^n)_U=x_U^n\\]</div>
          <div class="nf-bound-example"><b>Example</b><p>If \\(4.1\\leq r\\lt4.2\\), then \\(16.81\\leq r^2\\lt17.64\\).</p></div>
        </article>
      </div>
      <div class="nf-warning"><b>Sign warning:</b> the product and power shortcuts above assume positive quantities. If an interval crosses zero or contains negative values, test monotonicity and all relevant endpoint products.</div>`;
  }

  const quotientRules=getSlide('Bounds in quotients');
  if(quotientRules){
    quotientRules.html=`
      <div class="nf-two">
        <div class="nf-key-fact">
          <b>POSITIVE QUOTIENT RULE</b>
          <p>A quotient becomes smaller when the numerator decreases or the positive denominator increases.</p>
          <div class="nf-formula">\\[\\left(\\frac xy\\right)_L=\\frac{x_L}{y_U},\\qquad\\left(\\frac xy\\right)_U=\\frac{x_U}{y_L}\\]</div>
          <div class="nf-quotient-example">
            <div><b>Lower endpoint calculation</b><p>small numerator ÷ large denominator</p><div class="nf-formula">\\[8\\div2.5=3.2\\]</div></div>
            <div><b>Upper endpoint calculation</b><p>large numerator ÷ small denominator</p><div class="nf-formula">\\[9\\div2=4.5\\]</div></div>
          </div>
        </div>
        <div>
          <div class="nf-endpoint-choice">
            <div><b>LOWER QUOTIENT</b><span>small numerator</span><i>÷</i><span>large denominator</span></div>
            <div><b>UPPER QUOTIENT</b><span>large numerator</span><i>÷</i><span>small denominator</span></div>
          </div>
          <div class="nf-worked-strip"><b>Complete example:</b> if \\(8\\leq x\\lt9\\) and \\(2\\leq y\\lt2.5\\), then \\(3.2\\lt x/y\\lt4.5\\). The endpoint values are not attained because the corresponding upper endpoints are excluded.</div>
          <div class="nf-warning"><b>Domain check:</b> this rule requires a positive denominator interval that does not contain zero.</div>
        </div>
      </div>`;
  }

  /* HTML parsers treat a raw less-than sign inside a math delimiter as the start
     of a tag. Convert it to a KaTeX command in every lesson string before the
     engine builds DOM nodes. */
  const mathSegment=/(\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\])/g;
  const sanitizeMath=value=>value.replace(mathSegment,segment=>segment.replace(/</g,'\\lt '));
  const visited=new WeakSet();
  const sanitizeDeep=value=>{
    if(typeof value==='string')return sanitizeMath(value);
    if(!value||typeof value!=='object'||visited.has(value))return value;
    visited.add(value);
    if(Array.isArray(value)){
      for(let index=0;index<value.length;index+=1)value[index]=sanitizeDeep(value[index]);
      return value;
    }
    for(const key of Object.keys(value))value[key]=sanitizeDeep(value[key]);
    return value;
  };
  sanitizeDeep(data);

  data.v6Audit=Object.assign({},data.v6Audit,{
    graphicsPrecisionHotfix:'6.0.1',
    numberSetContainmentGeometry:true,
    decimalPlaceLabelsSeparated:true,
    significantFigureLabelsSeparated:true,
    calculatedBoundsExamples:true,
    rawLessThanMathSanitized:true
  });
})();
