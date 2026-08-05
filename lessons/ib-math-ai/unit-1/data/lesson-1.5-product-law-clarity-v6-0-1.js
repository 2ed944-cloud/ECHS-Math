(function(){
  'use strict';
  const data=window.LESSON_DATA;
  if(!data||String(data.lesson?.number)!=='1.5'||!Array.isArray(data.slides))return;

  const slide=data.slides.find(item=>item.title==='Product law · why exponents add');
  if(!slide)return;

  slide.html=`<div class="el-two">
  <div class="el-concept">
    <p>Because the two powers are <b>multiplied</b> and have the <b>same base</b>, their lists of equal factors join:</p>
    <div class="el-display">\\[a^3\\cdot a^4=(aaa)(aaaa)=a^{3+4}=a^7.\\]</div>
    <p>The exponents are added because they count the total number of factors of \\(a\\) in the product.</p>
    <div class="el-warning"><b>Important:</b> we are not adding the powers. In general, \\(a^3+a^4\\ne a^7\\). The product law applies only to multiplication of powers with the same base.</div>
  </div>
  <div class="el-step-visual" aria-label="Multiplying powers with the same base joins their factor groups">
    <div><b>\\(a^3\\)</b><span>3 factors of \\(a\\)</span></div>
    <strong aria-label="multiplied by">×</strong>
    <div><b>\\(a^4\\)</b><span>4 factors of \\(a\\)</span></div>
    <strong aria-label="equals">=</strong>
    <div class="accent"><b>\\(a^{3+4}=a^7\\)</b><span>7 factors of \\(a\\)</span></div>
  </div>
</div>`;

  data.version='6.0.1';
  data.v6Audit=Object.assign({},data.v6Audit,{
    productLawClarity:'The product-law derivation explicitly distinguishes multiplying powers from adding powers.'
  });
})();
