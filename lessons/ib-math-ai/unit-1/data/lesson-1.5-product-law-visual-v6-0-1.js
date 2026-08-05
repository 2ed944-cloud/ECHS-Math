(function(){
'use strict';

const data=window.LESSON_DATA;
if(!data||String(data.lesson?.number)!=='1.5'||!Array.isArray(data.slides))return;

const slide=data.slides.find(item=>item&&item.title==='Product law · why exponents add');
if(!slide){
  console.warn('Lesson 1.5 product-law visual slide was not found.');
  return;
}

slide.html=`<div class="el-two">
  <div class="el-concept">
    <p>Multiplying \\(a^3\\) by \\(a^4\\) creates seven factors of \\(a\\):</p>
    <div class="el-display">\\[a^3a^4=(aaa)(aaaa)=a^7.\\]</div>
    <p>Therefore the exponent records the total number of equal factors.</p>
  </div>
  <div>
    <div class="el-step-visual" role="img" aria-label="a cubed multiplied by a to the fourth equals a to the seventh. The factor counts add: three plus four equals seven.">
      <div><b>\\(a^3\\)</b><span>3 equal factors</span></div>
      <strong aria-label="multiplied by">×</strong>
      <div><b>\\(a^4\\)</b><span>4 equal factors</span></div>
      <strong aria-label="equals">=</strong>
      <div class="accent"><b>\\(a^7\\)</b><span>7 equal factors</span></div>
    </div>
    <div class="el-note"><b>Read the operations separately:</b> the powers are multiplied, while the exponents add because the factor counts combine: \\(3+4=7\\).</div>
  </div>
</div>`;

data.visualPatchVersion='6.0.1';
data.visualAudit=Object.assign({},data.visualAudit,{
  productLawOperator:'multiplication sign shown between powers',
  factorCountClarification:'3 + 4 = 7 is labelled separately from a^3 multiplied by a^4'
});
})();
