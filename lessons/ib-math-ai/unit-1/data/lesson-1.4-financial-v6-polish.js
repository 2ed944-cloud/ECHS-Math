(function(){
  'use strict';
  const data=window.LESSON_DATA;
  if(!data||String(data.lesson?.number)!=='1.4')return;
  const get=title=>data.slides.find(item=>item.title===title);
  const replace=(title,pairs)=>{const item=get(title);if(!item)return;for(const [from,to] of pairs)item.html=item.html.replace(from,to);};

  replace('Student turn · annual compound growth',[
    ['QAR \\(37,555.71\\)','QAR \\(37,547.37\\)']
  ]);
  replace('Student turn · match rates to periods',[
    ['QAR \\(10143.53\\)','QAR \\(10145.04\\)'],
    ['QAR \\(31108.35\\)','QAR \\(31084.63\\)']
  ]);
  replace('Student turn · value and loss',[
    ['QAR \\(2,425.34\\)','QAR \\(2,426.11\\)'],
    ['QAR \\(4,074.66\\)','QAR \\(4,073.89\\)']
  ]);
  replace('Worked example · replacement threshold',[
    ['\\(V_5\\approx17878.35\\)','\\(V_5\\approx17795.51\\)'],
    ['\\(V_6\\approx14660.25\\)','\\(V_6\\approx14592.32\\)']
  ]);
  replace('Student turn · inflation-adjusted decisions',[
    ['QAR \\(23,659.62\\)','QAR \\(23,651.79\\)'],
    ['QAR \\(20,708.62\\)','QAR \\(20,691.02\\)']
  ]);
  replace('Student turn · ordinary annuity future value',[
    ['QAR \\(33,890.40\\)','QAR \\(33,545.60\\)']
  ]);
  replace('Student turn · ordinary versus due',[
    ['QAR \\(35,059.45\\)','QAR \\(35,059.44\\)']
  ]);
  replace('Worked example · least number of monthly deposits',[
    ['\\(FV_{88}\\approx38091.86\\)','\\(FV_{88}\\approx38125.56\\)'],
    ['\\(FV_{89}\\approx38622.80\\)','\\(FV_{89}\\approx38656.65\\)']
  ]);
  replace('Student turn · loan balance',[
    ['QAR \\(1,137.93\\)','QAR \\(1,137.78\\)'],
    ['QAR \\(37,892.94\\)','QAR \\(37,849.32\\)']
  ]);
  replace('Independent exit ticket',[
    ['QAR \\(42,488.56\\)','QAR \\(42,404.75\\)'],
    ['QAR \\(1,421.98\\)','QAR \\(1,422.22\\)']
  ]);

  data.v6Audit=Object.assign({},data.v6Audit,{
    independentNumericalReaudit:true,
    correctedPeriodConversionExamples:true,
    correctedDepreciationExamples:true,
    correctedRealValueExamples:true,
    correctedAnnuityExamples:true,
    correctedSavingsThresholdValues:true,
    correctedOutstandingBalanceExamples:true,
    correctedExitTicketValues:true
  });
})();
