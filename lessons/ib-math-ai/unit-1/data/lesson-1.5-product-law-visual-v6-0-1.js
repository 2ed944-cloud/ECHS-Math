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
    <p>Because the two powers are <b>multiplied</b> and have the <b>same base</b>, their groups of equal factors join:</p>
    <div class="el-display">\\[a^3\\cdot a^4=(aaa)(aaaa)=a^{3+4}=a^7.\\]</div>
    <p>The exponents are added only to count how many factors of \\(a\\) occur in the product.</p>
    <div class="el-warning"><b>Do not confuse the operations:</b> the powers are multiplied. We are not adding \\(a^3\\) and \\(a^4\\); in general, \\(a^3+a^4\\ne a^7\\).</div>
  </div>
  <div>
    <div class="el-step-visual" role="img" aria-label="a cubed multiplied by a to the fourth equals a to the power three plus four, which equals a to the seventh">
      <div><b>\\(a^3\\)</b><span>3 factors of \\(a\\)</span></div>
      <strong aria-label="multiplied by">×</strong>
      <div><b>\\(a^4\\)</b><span>4 factors of \\(a\\)</span></div>
      <strong aria-label="equals">=</strong>
      <div class="accent"><b>\\(a^{3+4}=a^7\\)</b><span>7 factors of \\(a\\)</span></div>
    </div>
    <div class="el-note"><b>Product law:</b> multiply powers with the same base, then add their factor counts: \\(a^m\\cdot a^n=a^{m+n}\\).</div>
  </div>
</div>`;

data.version='6.0.1';
data.visualPatchVersion='6.0.1';
data.visualAudit=Object.assign({},data.visualAudit,{
  productLawOperator:'multiplication sign shown between powers',
  productLawNonExample:'a^3 + a^4 is explicitly distinguished from a^3 multiplied by a^4',
  factorCountClarification:'the intermediate exponent m+n is shown as a count of factors in the product'
});
})();
