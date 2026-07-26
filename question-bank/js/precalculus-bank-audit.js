(async()=>{
  const $=id=>document.getElementById(id);
  const required={PCALRT5S:4528};
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
    const publisherRows=(catalog.banks||[]).filter(bank=>Object.hasOwn(required,bank.code));
    const publisherImported=publisherRows.reduce((sum,bank)=>sum+(Number(bank.question_count)||0),0);
    const requiredTotal=Object.values(required).reduce((sum,count)=>sum+count,0);
    const complete=Object.entries(required).every(([code,count])=>{
      const bank=publisherRows.find(row=>row.code===code);
      return (Number(bank?.question_count)||0)>=count;
    })&&publisherImported>=requiredTotal&&unitSet.size>=4;
    const partial=publisherImported>0||questionIds.size>0;
    if($('precalcTotal'))$('precalcTotal').textContent=publisherImported.toLocaleString();
    if($('precalcBanks'))$('precalcBanks').textContent=publisherRows.length.toLocaleString();
    if($('precalcUnits'))$('precalcUnits').textContent=Math.min(unitSet.size,4)+'/4';
    if($('precalcStatus'))$('precalcStatus').textContent=complete?'Complete':partial?'Partial':'Not available';
    if($('precalcStatusCard')){
      $('precalcStatusCard').classList.toggle('warning',!complete);
      $('precalcStatusCard').title=complete?'The complete 4,528-question Pearson Precalculus collection is published across all four AP units.':'The AP Precalculus publisher collection is not yet fully published across all four units.';
    }
    window.ECHSPrecalculusAudit={complete,partial,total:questionIds.size,publisherImported,requiredTotal,bankCodes:[...bankCodes],units:[...unitSet]};
  }catch(error){
    if($('precalcStatus'))$('precalcStatus').textContent='Unavailable';
    if($('precalcStatusCard'))$('precalcStatusCard').classList.add('warning');
    console.error('AP Precalculus bank audit failed',error);
  }
})();
