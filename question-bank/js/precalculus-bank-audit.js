(async()=>{
  const $=id=>document.getElementById(id);
  const expected={PCALRT5S:4528,CAF5S:3101};
  const expectedTotal=expected.PCALRT5S+expected.CAF5S;
  try{
    const catalog=await ECHSBank.loadCatalog();
    const precalcRows=(catalog.bundles?.course_units||[]).filter(row=>row.course_key==='ap-precalculus');
    const unitSet=new Set(precalcRows.map(row=>String(row.unit)).filter(Boolean));
    const questionIds=new Set();
    const bankCodes=new Set();
    for(const row of precalcRows){
      const questions=await ECHSBank.loadBundle(row);
      for(const question of questions){
        if(!question?.id)continue;
        questionIds.add(question.id);
        if(question.bank_code)bankCodes.add(question.bank_code);
      }
    }
    const publisherRows=(catalog.banks||[]).filter(bank=>Object.hasOwn(expected,bank.code));
    const publisherImported=publisherRows.reduce((sum,bank)=>sum+(Number(bank.question_count)||0),0);
    const complete=Object.entries(expected).every(([code,count])=>{
      const bank=publisherRows.find(row=>row.code===code);
      return (Number(bank?.question_count)||0)>=count;
    })&&publisherImported>=expectedTotal&&unitSet.size>=4;
    const partial=publisherImported>0||questionIds.size>0;
    if($('precalcTotal'))$('precalcTotal').textContent=questionIds.size.toLocaleString();
    if($('precalcBanks'))$('precalcBanks').textContent=bankCodes.size.toLocaleString();
    if($('precalcUnits'))$('precalcUnits').textContent=unitSet.size+'/4';
    if($('precalcStatus'))$('precalcStatus').textContent=complete?'Complete':partial?'Partial':'Not available';
    if($('precalcStatusCard')){
      $('precalcStatusCard').classList.toggle('warning',!complete);
      $('precalcStatusCard').title=complete?'All planned AP Precalculus publisher collections are present.':'The published library is available, but the complete planned collection has not yet reached GitHub.';
    }
    window.ECHSPrecalculusAudit={complete,partial,total:questionIds.size,publisherImported,expectedTotal,bankCodes:[...bankCodes],units:[...unitSet]};
  }catch(error){
    if($('precalcStatus'))$('precalcStatus').textContent='Unavailable';
    if($('precalcStatusCard'))$('precalcStatusCard').classList.add('warning');
    console.error('AP Precalculus bank audit failed',error);
  }
})();