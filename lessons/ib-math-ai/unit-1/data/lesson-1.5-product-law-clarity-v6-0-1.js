(function(){
  'use strict';

  const data=window.LESSON_DATA;
  if(!data||String(data.lesson?.number)!=='1.5'||!Array.isArray(data.slides))return;

  const slide=data.slides.find(item=>item.title==='Product law · why exponents add');
  if(!slide)return;

  slide.title='Product law · multiply the powers, add the factor counts';
  slide.eyebrow='The operation between the powers is multiplication';
  slide.html=`<div class="el-two">
  <div class="el-concept">
    <p>The expression is a product: \\(a^3\\cdot a^4\\). Expanding both powers joins two groups of equal factors into one product:</p>
    <div class="el-display">\\[a^3\\cdot a^4=(a\\cdot a\\cdot a)(a\\cdot a\\cdot a\\cdot a)=a^7.\\]</div>
    <p>The first power contributes \\(3\\) factors and the second contributes \\(4\\), so the product contains \\(3+4=7\\) factors. Therefore</p>
    <div class="el-display">\\[a^m\\cdot a^n=a^{m+n}.\\]</div>
    <div class="el-warning"><b>Important:</b> the powers are multiplied; only their factor counts are added. This rule does not apply to a sum: \\(a^3+a^4\\ne a^7\\).</div>
  </div>
  <div class="el-step-visual" aria-label="Multiply powers with the same base, then add their factor counts">
    <div><b>\\(a^3\\)</b><span>3 factors</span></div><strong aria-label="multiplied by">×</strong><div><b>\\(a^4\\)</b><span>4 factors</span></div><strong>=</strong><div class="accent"><b>\\(a^7\\)</b><span>3 + 4 = 7 factors</span></div>
  </div>
</div>`;

  data.version='6.0.1';
  data.v6Audit=Object.assign({},data.v6Audit,{
    productLawClarity:'The visual uses multiplication between powers and reserves addition for the factor counts in the exponent.'
  });
})();
