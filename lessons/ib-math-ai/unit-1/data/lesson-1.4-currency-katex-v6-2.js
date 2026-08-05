(function(){
  'use strict';

  const data=window.LESSON_DATA;
  if(!data||String(data.lesson?.number)!=='1.4'||!Array.isArray(data.slides))return;

  let replacements=0;
  data.slides.forEach(slide=>{
    if(typeof slide.html!=='string')return;

    slide.html=slide.html.replace(/([€£$])\(([\d,.\s]+)\\\)/g,(_,symbol,amount)=>{
      replacements+=1;
      return`${symbol} \\(${amount}\\)`;
    });

    slide.html=slide.html.replace(/([€£$])\\\(/g,(_,symbol)=>{
      replacements+=1;
      return`${symbol} \\(`;
    });
  });

  data.v6Audit=Object.assign({},data.v6Audit,{
    currencyAdjacentKatexNormalized:true,
    currencyKatexReplacementCount:replacements
  });
})();
