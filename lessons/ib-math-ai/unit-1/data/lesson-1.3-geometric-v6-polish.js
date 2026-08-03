(function(){
  'use strict';
  const data=window.LESSON_DATA;
  if(!data||String(data.lesson?.number)!=='1.3')return;
  const slide=title=>data.slides.find(item=>item.title===title);
  const practice=id=>data.practice.find(item=>item.id===id);
  const task=id=>data.exam.find(item=>item.id===id);

  const preview=slide('Integrated IB-style geometric model');
  if(preview){
    preview.html=preview.html
      .replace('\\(u_{18}=120(1.08)^{17}\\approx443.96\\)','\\(u_{18}=120(1.08)^{17}\\approx444.00\\)')
      .replace('\\(S_{18}=120(1.08^{18}-1)/0.08\\approx5519.54\\)','\\(S_{18}=120(1.08^{18}-1)/0.08\\approx4494.03\\)');
  }

  const a22=practice('GSV6-1.3-A22');
  if(a22){
    a22.answer='\\(444.00\\).';
    a22.solution='\\(u_{18}=120(1.08)^{17}\\approx444.00\\).';
    a22.check={mode:'number',value:444.00,tolerance:0.03};
  }
  const a23=practice('GSV6-1.3-A23');
  if(a23){
    a23.answer='\\(4494.03\\).';
    a23.solution='\\(S_{18}=120(1.08^{18}-1)/0.08\\approx4494.03\\).';
    a23.check={mode:'number',value:4494.03,tolerance:0.03};
  }
  const c04=practice('GSV6-1.3-C04');
  if(c04){
    c04.answer='\\(p=\\dfrac{15+\\sqrt{218}}7\\) or \\(p=\\dfrac{15-\\sqrt{218}}7\\).';
    c04.solution='Set \\((3p+2)^2=(2p-1)(8p-5)\\). This gives \\(7p^2-30p+1=0\\), so \\(p=(15\\pm\\sqrt{218})/7\\).';
    delete c04.check;
  }
  const c13=practice('GSV6-1.3-C13');
  if(c13){
    c13.answer='\\(53.2099\\) m approximately.';
    c13.solution='\\(D=12+24\\sum_{k=1}^{6}0.65^k\\approx53.2099\\text{ m}\\).';
    c13.check={mode:'number',value:53.2099,tolerance:0.002};
  }
  const c18=practice('GSV6-1.3-C18');
  if(c18){
    c18.answer='\\(u_8=500(1.3)^4(1.1)^3\\approx1900.73\\).';
    c18.solution='Stages \\(1\\) to \\(5\\) use four factors of \\(1.3\\); stages \\(5\\) to \\(8\\) use three factors of \\(1.1\\).';
    c18.check={mode:'number',value:1900.73,tolerance:0.03};
  }
  const c21=practice('GSV6-1.3-C21');
  if(c21){
    c21.prompt='A geometric sequence has \\(u_1=4\\) and \\(r=1.5\\). Find the first \\(n\\geq3\\) for which \\(S_{n-2}>u_n\\).';
    c21.answer='\\(n=6\\).';
    c21.solution='At \\(n=5\\), \\(S_3=19<20.25=u_5\\). At \\(n=6\\), \\(S_4=32.5>30.375=u_6\\), so \\(6\\) is the first valid index.';
    c21.check={mode:'number',value:6,tolerance:1e-9};
  }
  const c24=practice('GSV6-1.3-C24');
  if(c24){
    c24.answer='Total \\(\\approx4494.03\\); retain guard digits and round the final result.';
    c24.solution='\\(S_{18}=120(1.08^{18}-1)/0.08\\approx4494.03\\). Using the finite-sum formula avoids repeated rounding; apply whole-person interpretation only after calculating the model total.';
  }

  const bounce=task('GSV6-1.3-E04');
  if(bounce){
    const part=bounce.parts.find(item=>item.label==='c');
    if(part){
      part.answer='\\(D=12+24\\sum_{k=1}^{6}(0.65)^k\\approx53.2099\\) m.';
      part.markscheme='M1 initial drop once; M1 rebound sum twice; M1 finite sum; A1 result.';
    }
  }
  const inverse=task('GSV6-1.3-E05');
  if(inverse){
    const part=inverse.parts.find(item=>item.label==='g');
    if(part){
      part.prompt='Explain why no second real value of \\(r\\) must be considered in part (c).';
      part.answer='The equation is \\(r^3=8\\). An odd power preserves sign and has one real cube root, so \\(r=2\\) is the only real ratio.';
      part.markscheme='R1 identifies odd power/cube root; R1 concludes unique real ratio.';
    }
  }

  data.v6Audit=Object.assign({},data.v6Audit,{
    independentArithmeticReaudit:true,
    correctedWildlifeModelValues:true,
    correctedBounceDistance:true,
    correctedSymbolicParameterRoots:true,
    correctedPiecewiseGrowthValue:true
  });
})();
